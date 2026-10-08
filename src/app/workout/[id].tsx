import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Eyebrow, H3, Small, Tag, Thumb, Title, useLayout, useUI } from '@/components/ui';
import { prescription } from '@/data/format';
import { useLookups, useStore } from '@/data/store';
import { fonts, radius, TOUCH } from '@/theme';

// One exercise per screen, big Done and Skip buttons, and a rest timer.
export default function Workout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const st = useStore();
  const { session, exercise } = useLookups();
  const { c, k } = useUI();
  const { size } = useLayout();
  const insets = useSafeAreaInsets();
  const s = session(id);

  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [resting, setResting] = useState(0);
  const [showSteps, setShowSteps] = useState(true);
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

  if (!s) return null;
  const total = s.exercises.length;
  const cur = s.exercises[i];
  const e = exercise(cur.exerciseId);

  const finish = (completed: string[]) => {
    const logId = st.finishSession(s.id, completed);
    router.replace(`/checkin/${logId}`);
  };
  const next = (markDone: boolean) => {
    const completed = markDone ? [...done, cur.exerciseId] : done;
    setDone(completed);
    if (i + 1 >= total) return finish(completed);
    setI(i + 1);
    if (markDone && cur.restSec > 0) setResting(cur.restSec);
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
            Exercise {i + 1} of {total}
          </Small>
        </View>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: c.surface2, overflow: 'hidden' }} accessibilityLabel={`Exercise ${i + 1} of ${total}`}>
        <View style={{ height: 8, width: `${(i / total) * 100}%`, backgroundColor: c.brand, borderRadius: 4 }} />
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

  const info = (
    <View style={{ gap: 14 }}>
      <Eyebrow color={c.brand}>{prescription(cur)}</Eyebrow>
      <Title>{e.name}</Title>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Tag label={`Rest ${cur.restSec} sec`} tone="neutral" icon="clock" />
        {cur.note ? <Tag label={cur.note} tone="warn" /> : null}
      </View>
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
              <Text style={{ fontFamily: fonts.bold, fontSize: Math.round(19 * k), color: c.brandInk }}>{i + 1 === total ? 'Done, finish session' : 'Done'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

