import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Chip, Eyebrow, H3, Small, Tag, Thumb, Title, useLayout, useUI } from '@/components/ui';
import { CHANGE_LABELS, holdSeconds, prescription } from '@/data/format';
import { useLookups, useStore } from '@/data/store';
import type { ChangeKind, ExerciseChange } from '@/data/types';
import { fonts, radius, TOUCH } from '@/theme';

// One exercise per screen, big Done and Skip buttons, and a rest timer.
export default function Workout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const st = useStore();
  const { session, exercise, planFor } = useLookups();
  const { c, k } = useUI();
  const { size } = useLayout();
  const insets = useSafeAreaInsets();
  const s = session(id);

  // The client can do exercises in any order (busy gyms): `queue` holds the
  // plan positions still to do, and the first one is on screen.
  const [queue, setQueue] = useState<number[] | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [resting, setResting] = useState(0);
  const [holding, setHolding] = useState(0);
  const [picking, setPicking] = useState(false);
  const [showSteps, setShowSteps] = useState(true);
  const [changes, setChanges] = useState<Record<string, ExerciseChange>>({});
  const [panel, setPanel] = useState<'none' | 'struggling' | 'change'>('none');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    st.setRole('client');
  }, [st.setRole]);

  useEffect(() => {
    if (resting <= 0) return;
    timer.current = setInterval(() => {
      setResting((r) => {
        if (r <= 1) {
          Vibration.vibrate(400);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [resting > 0]);

  // Countdown for timed holds (planks, wall sits and other isometrics).
  useEffect(() => {
    if (holding <= 0) return;
    const t = setInterval(() => {
      setHolding((h) => {
        if (h <= 1) {
          Vibration.vibrate([0, 300, 150, 300]);
          return 0;
        }
        return h - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [holding > 0]);

  if (!s) return null;
  const plan = planFor(st.clientId, s.id);
  const total = plan.length;
  const q = queue ?? plan.map((_, n) => n);
  if (!q.length) return null;
  const cur = plan[q[0]];
  const e = exercise(cur.exerciseId);
  const position = total - q.length; // how many are finished or skipped
  const secs = holdSeconds(cur);

  const finish = (completed: string[]) => {
    const logId = st.finishSession(s.id, completed, Object.values(changes).filter((x) => x.kinds.length || x.note || x.weightUsed));
    router.replace(`/checkin/${logId}`);
  };
  const next = (markDone: boolean) => {
    const completed = markDone ? [...done, cur.exerciseId] : done;
    setDone(completed);
    if (q.length <= 1) return finish(completed);
    setQueue(q.slice(1));
    setPanel('none');
    setHolding(0);
    if (markDone && cur.restSec > 0) setResting(cur.restSec);
  };
  // Equipment taken? Push this one to the end, or jump to any other.
  const later = () => {
    setQueue([...q.slice(1), q[0]]);
    setPanel('none');
    setHolding(0);
  };
  const jumpTo = (pos: number) => {
    setQueue([pos, ...q.filter((x) => x !== pos)]);
    setPicking(false);
    setPanel('none');
    setHolding(0);
  };

  const topBar = (
    <View style={{ paddingHorizontal: 18, paddingTop: insets.top + 10, paddingBottom: 12, gap: 10, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Leave session" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))} style={{ minWidth: TOUCH, minHeight: TOUCH, justifyContent: 'center' }}>
          <Icon name="x" size={26} color={c.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <BodyBold numberOfLines={1}>{s.name}</BodyBold>
          <Small>
            {position} of {total} done
          </Small>
        </View>
        {q.length > 1 ? <Button small variant="ghost" icon="grid" title="Change order" onPress={() => setPicking(!picking)} /> : null}
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: c.surface2, overflow: 'hidden' }} accessibilityLabel={`${position} of ${total} exercises done`}>
        <View style={{ height: 8, width: `${(position / total) * 100}%`, backgroundColor: c.brand, borderRadius: 4 }} />
      </View>
    </View>
  );

  if (resting > 0) {
    const mm = Math.floor(resting / 60);
    const ss = String(resting % 60).padStart(2, '0');
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {topBar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 }}>
          <Eyebrow>Rest</Eyebrow>
          <Text style={{ fontFamily: fonts.displayHeavy, fontSize: Math.round(96 * k), color: c.brand, fontVariant: ['tabular-nums'] }} accessibilityLiveRegion="polite">
            {mm}:{ss}
          </Text>
          <Body center>Next up: {e.name}</Body>
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variant="ghost" title="Add 15 seconds" icon="plus" onPress={() => setResting((r) => r + 15)} />
            <Button title="I'm ready" icon="play" onPress={() => setResting(0)} />
          </View>
        </View>
      </View>
    );
  }

  if (holding > 0) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {topBar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 }}>
          <Eyebrow>Hold</Eyebrow>
          <Text style={{ fontFamily: fonts.displayHeavy, fontSize: Math.round(96 * k), color: c.brand, fontVariant: ['tabular-nums'] }} accessibilityLiveRegion="polite">
            {holding}s
          </Text>
          <Body center>{e.name}</Body>
          <Button variant="ghost" title="Stop the timer" icon="x" onPress={() => setHolding(0)} />
        </View>
      </View>
    );
  }

  if (picking) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {topBar}
        <ScrollView contentContainerStyle={{ padding: 18, gap: 12, maxWidth: 680, width: '100%', alignSelf: 'center' }}>
          <Title>Pick your next exercise</Title>
          <Body>Gym busy? Do them in whatever order works. Hogan still sees everything you finish.</Body>
          {q.map((pos, n) => {
            const x = plan[pos];
            const ex = exercise(x.exerciseId);
            return (
              <Pressable
                key={pos}
                accessibilityRole="button"
                accessibilityLabel={`Do ${ex.name} next`}
                onPress={() => jumpTo(pos)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 64, borderRadius: radius.lg, borderWidth: n === 0 ? 2 : 1, borderColor: n === 0 ? c.brand : c.line, backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 })}
              >
                <View style={{ flex: 1 }}>
                  <BodyBold>{ex.name}</BodyBold>
                  <Small>{prescription(x)}</Small>
                </View>
                {n === 0 ? <Tag label="On screen now" tone="neutral" /> : <Icon name="chev" size={22} color={c.muted} />}
              </Pressable>
            );
          })}
          <Button variant="ghost" title="Back" onPress={() => setPicking(false)} />
        </ScrollView>
      </View>
    );
  }

  const mine = changes[cur.exerciseId] ?? { exerciseId: cur.exerciseId, kinds: [] };
  const updateMine = (patch: Partial<ExerciseChange>) => setChanges({ ...changes, [cur.exerciseId]: { ...mine, ...patch } });
  const toggleKind = (kind: ChangeKind) => updateMine({ kinds: mine.kinds.includes(kind) ? mine.kinds.filter((x) => x !== kind) : [...mine.kinds, kind] });
  const noted = mine.kinds.length > 0 || !!mine.note || !!mine.weightUsed;
  const tip = cur.ifStruggling ?? (e.easier ? `Try the easier version: ${e.easier.toLowerCase()}.` : 'Take a longer rest, lower the weight a little, and do what you can with good form.');
  const input = { minHeight: 48, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface } as const;

  const numbers = [
    { label: 'Sets', value: String(cur.sets) },
    { label: cur.reps ? 'Reps' : secs !== undefined ? 'Hold' : 'Time', value: cur.reps ?? cur.time ?? '-' },
    { label: 'Weight', value: cur.weight ?? 'Body' },
    { label: 'Rest', value: `${cur.restSec}s` },
  ];

  const info = (
    <View style={{ gap: 14 }}>
      <Eyebrow color={c.brand}>{prescription(cur)}</Eyebrow>
      <Title>{e.name}</Title>
      <View style={{ flexDirection: 'row', gap: 8 }} accessibilityLabel={`From Hogan: ${prescription(cur)}, rest ${cur.restSec} seconds`}>
        {numbers.map((n) => (
          <View key={n.label} style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 2 }}>
            <Text style={{ fontFamily: fonts.displayHeavy, fontSize: Math.round(19 * k), color: c.ink, textAlign: 'center' }} numberOfLines={2}>
              {n.value}
            </Text>
            <Small>{n.label}</Small>
          </View>
        ))}
      </View>
      {cur.note ? <Tag label={cur.note} tone="warn" /> : null}
      {secs !== undefined ? <Button full icon="clock" title={`Start ${secs}s hold timer`} onPress={() => setHolding(secs)} /> : null}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button small variant={panel === 'struggling' ? 'primary' : 'ghost'} icon="alert" title="Struggling?" onPress={() => setPanel(panel === 'struggling' ? 'none' : 'struggling')} />
        <Button small variant={panel === 'change' ? 'primary' : 'ghost'} icon={noted ? 'check' : 'plus'} title={noted ? 'Change noted' : 'Note a change'} onPress={() => setPanel(panel === 'change' ? 'none' : 'change')} />
        {q.length > 1 ? <Button small variant="ghost" icon="clock" title="Kit taken? Do it later" onPress={later} /> : null}
      </View>
      {panel === 'struggling' ? (
        <Card tone="warn">
          <BodyBold>If you're struggling</BodyBold>
          <Body>{tip}</Body>
          <Small>Stop and tell Hogan if anything hurts.</Small>
          <Button small variant="warn" title="I changed something" onPress={() => setPanel('change')} />
        </Card>
      ) : null}
      {panel === 'change' ? (
        <Card>
          <BodyBold>What did you change?</BodyBold>
          <Small>Hogan sees this with your check-in.</Small>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(Object.keys(CHANGE_LABELS) as ChangeKind[]).map((kind) => (
              <Chip key={kind} label={CHANGE_LABELS[kind]} on={mine.kinds.includes(kind)} onPress={() => toggleKind(kind)} />
            ))}
          </View>
          <TextInput value={mine.weightUsed ?? ''} onChangeText={(t) => updateMine({ weightUsed: t || undefined })} placeholder={`Weight you used${cur.weight ? ` (Hogan set ${cur.weight})` : ''}`} placeholderTextColor={c.muted} style={input} accessibilityLabel="Weight you used" />
          <TextInput value={mine.note ?? ''} onChangeText={(t) => updateMine({ note: t || undefined })} placeholder="Anything else? For example: knee twinged on set 2" placeholderTextColor={c.muted} multiline style={[input, { minHeight: 70, paddingTop: 10, textAlignVertical: 'top' }]} accessibilityLabel="Note for Hogan" />
          <Button small icon="check" title="Save" onPress={() => setPanel('none')} />
        </Card>
      ) : null}
      <Card tone="soft">
        <BodyBold>Hogan says</BodyBold>
        <Body>{e.coachingNotes}</Body>
      </Card>
      <Pressable accessibilityRole="button" onPress={() => setShowSteps(!showSteps)} style={{ minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <H3>Step by step</H3>
        <Small>{showSteps ? 'Hide' : 'Show'}</Small>
      </Pressable>
      {showSteps
        ? e.steps.map((t, n) => (
            <View key={n} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.heavy, color: c.brand }}>{n + 1}</Text>
              </View>
              <Body style={{ flex: 1 }}>{t}</Body>
            </View>
          ))
        : null}
      {e.easier || e.harder ? (
        <View style={{ gap: 8 }}>
          {e.easier ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Tag label="Easier" tone="ok" />
              <Body style={{ flex: 1 }}>{e.easier}</Body>
            </View>
          ) : null}
          {e.harder ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Tag label="Harder" tone="brand" />
              <Body style={{ flex: 1 }}>{e.harder}</Body>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  const video = (
    <View style={{ gap: 10 }}>
      <Thumb label={e.name} duration={e.videoLength} />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button small variant="ghost" icon="film" title="Full how-to video" />
        <Button small variant="ghost" icon="speaker" title="Read aloud" />
        <Button small variant="ghost" title="Play slower" />
      </View>
      <Small>Captions are on. Videos are saved to the phone so they work in the gym.</Small>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {topBar}
      <ScrollView contentContainerStyle={{ padding: size === 'compact' ? 18 : 32, paddingBottom: 30 }}>
        <View style={{ width: '100%', maxWidth: 1100, alignSelf: 'center' }}>
          {size === 'compact' ? (
            <View style={{ gap: 18 }}>
              {video}
              {info}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 28, alignItems: 'flex-start' }}>
              <View style={{ flex: 1.2 }}>{video}</View>
              <View style={{ flex: 1 }}>{info}</View>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 16, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line }}>
        <View style={{ flex: 1, maxWidth: 1100 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => next(false)}
              style={({ pressed }) => ({ flex: 1, minHeight: 64, borderRadius: radius.lg, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: Math.round(19 * k), color: c.ink }}>Skip</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => next(true)}
              style={({ pressed }) => ({ flex: 2, minHeight: 64, borderRadius: radius.lg, backgroundColor: c.brand, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}
            >
              <Icon name="check" size={26} color={c.brandInk} />
              <Text style={{ fontFamily: fonts.bold, fontSize: Math.round(19 * k), color: c.brandInk }}>{q.length === 1 ? 'Done, finish session' : 'Done'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

