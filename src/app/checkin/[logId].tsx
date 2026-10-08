import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AREAS, BodyOutline } from '@/components/BodyMap';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Chip, Face, FEEL_LABELS, H2, H3, Small, Title, useLayout, useUI } from '@/components/ui';
import { useLookups, useStore } from '@/data/store';
import type { Feel, PainReport } from '@/data/types';
import { fonts, radius, TOUCH } from '@/theme';

const RED_FLAGS = ['I had a fall', 'Chest pain', 'Dizzy or faint', 'Very short of breath'];

// The post-session check-in. Every answer goes straight to Hogan.
export default function CheckIn() {
  const { logId } = useLocalSearchParams<{ logId: string }>();
  const st = useStore();
  const { session, exercise } = useLookups();
  const { c, k } = useUI();
  const { size } = useLayout();
  const insets = useSafeAreaInsets();
  const log = st.logs.find((l) => l.id === logId);

  const [feel, setFeel] = useState<Feel | null>(null);
  const [effort, setEffort] = useState<number | null>(null);
  const [enjoyed, setEnjoyed] = useState('');
  const [hard, setHard] = useState<string[]>([]);
  const [pain, setPain] = useState<boolean | null>(null);
  const [area, setArea] = useState<string | undefined>();
  const [side, setSide] = useState<PainReport['side']>('Right');
  const [view, setView] = useState<'front' | 'back'>('front');
  const [severity, setSeverity] = useState<number | null>(null);
  const [type, setType] = useState<PainReport['type'] | null>(null);
  const [when, setWhen] = useState<string | null>(null);
  const [flags, setFlags] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    st.setRole('client');
  }, [st.setRole]);

  if (!log) return null;
  const s = session(log.sessionId);
  const exs = s.exercises.map((x) => exercise(x.exerciseId));
  const serious = (severity ?? 0) >= 7 || flags.length > 0;
  const painReady = !pain || (area && severity !== null);
  const canSend = feel !== null && effort !== null && pain !== null && painReady;

  const send = () => {
    st.submitCheckIn(
      log.id,
      {
        feel: feel!,
        effort: effort!,
        enjoyed: enjoyed.trim() || undefined,
        hardExerciseIds: hard,
        pain: !!pain,
        forTrainer: other.trim() || undefined,
      },
      pain && area
        ? {
            area,
            side: AREAS.find((a) => a.name === area)?.paired ? side : 'Middle',
            view,
            severity: severity ?? 0,
            type: type ?? 'Not sure',
            when: when ?? 'Not sure',
            redFlag: flags.length > 0,
          }
        : undefined,
    );
    setSent(true);
  };

  const inputStyle = { minHeight: 80, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, padding: 12, fontFamily: fonts.body, fontSize: Math.round(17 * k), color: c.ink, textAlignVertical: 'top' as const };

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: insets.top + 24 }}>
        <View style={{ maxWidth: 520, width: '100%', gap: 18, alignItems: 'center' }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={44} color={c.brandInk} strokeWidth={2.6} />
          </View>
          <Title center>Sent to Hogan</Title>
          <Body center>
            {pain
              ? "Hogan has been alerted about the pain straight away. He'll get back to you. Rest that area until you hear from him."
              : 'Nice work today. Hogan will see how it went and may leave you a note in your diary.'}
          </Body>
          {serious ? <SafetyBox /> : null}
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button title="Back to Today" icon="home" onPress={() => router.replace('/')} />
            <Button variant="ghost" title="Open my diary" icon="book" onPress={() => router.replace('/diary')} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 18, paddingBottom: 12, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Do this later" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))} style={{ minWidth: TOUCH, minHeight: TOUCH, justifyContent: 'center' }}>
          <Icon name="x" size={26} color={c.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <BodyBold>Check in with Hogan</BodyBold>
          <Small numberOfLines={1}>
            {s.name} · {log.dateLabel}
          </Small>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: size === 'compact' ? 16 : 28, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 820, alignSelf: 'center', gap: 16 }}>
          <Body>About 30 seconds. Everything goes straight to Hogan. You can skip the optional bits.</Body>

          <Section n={1} title="How did that feel overall?">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {([1, 2, 3, 4, 5] as Feel[]).map((f) => (
                <Pressable
                  key={f}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: feel === f }}
                  accessibilityLabel={FEEL_LABELS[f]}
                  onPress={() => setFeel(f)}
                  style={{ flexGrow: 1, flexBasis: 100, minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.md, borderWidth: 2, borderColor: feel === f ? c.brand : c.line, backgroundColor: feel === f ? c.brandSoft : c.surface }}
                >
                  <Face feel={f} size={42} selected={feel === f} />
                  <Text style={{ fontFamily: fonts.bold, fontSize: Math.round(14 * k), color: c.ink }}>{FEEL_LABELS[f]}</Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section n={2} title="How much effort did it take?">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {Array.from({ length: 10 }, (_, j) => j + 1).map((n) => (
                <Pressable
                  key={n}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: effort === n }}
                  accessibilityLabel={`Effort ${n} out of 10`}
                  onPress={() => setEffort(n)}
                  style={{ width: 52 * k, height: 52 * k, borderRadius: 26 * k, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: effort === n ? c.brand : c.line, backgroundColor: effort === n ? c.brand : c.surface }}
                >
                  <Text style={{ fontFamily: fonts.heavy, fontSize: Math.round(18 * k), color: effort === n ? c.brandInk : c.ink }}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Small>1 = very easy</Small>
              <Small>10 = everything I had</Small>
            </View>
          </Section>

          <Section n={3} title="What did you enjoy or feel good about?" optional>
            <TextInput value={enjoyed} onChangeText={setEnjoyed} multiline placeholder="Type here, or record a voice note" placeholderTextColor={c.muted} style={inputStyle} accessibilityLabel="What you enjoyed" />
            <Button small variant="ghost" icon="mic" title="Record a voice note" />
          </Section>

          <Section n={4} title="Did anything feel difficult?" optional>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {exs.map((e) => (
                <Chip key={e.id} label={e.name} on={hard.includes(e.id)} onPress={() => setHard(hard.includes(e.id) ? hard.filter((x) => x !== e.id) : [...hard, e.id])} />
              ))}
            </View>
          </Section>

          <Section n={5} title="Any pain or discomfort?">
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[false, true].map((v) => (
                <Pressable
                  key={String(v)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: pain === v }}
                  onPress={() => setPain(v)}
                  style={{ flex: 1, minHeight: 60, borderRadius: radius.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderColor: pain === v ? (v ? c.bad : c.brand) : c.line, backgroundColor: pain === v ? (v ? c.badSoft : c.brandSoft) : c.surface }}
                >
                  <Text style={{ fontFamily: fonts.bold, fontSize: Math.round(18 * k), color: pain === v && v ? c.bad : c.ink }}>{v ? 'Yes' : 'No'}</Text>
                </Pressable>
              ))}
            </View>

            {pain ? (
              <View style={{ gap: 18, marginTop: 6 }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Icon name="alert" size={22} color={c.bad} />
                  <H2 color={c.bad}>Pain report</H2>
                </View>
                <Body>Hogan gets this straight away.</Body>

                <View style={{ gap: 10 }}>
                  <BodyBold>Where does it hurt? Tap the body or pick below.</BodyBold>
                  <View style={{ flexDirection: size === 'compact' ? 'column' : 'row', gap: 16, alignItems: size === 'compact' ? 'center' : 'flex-start' }}>
                    <View style={{ alignItems: 'center', gap: 8 }}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Chip label="Front" on={view === 'front'} onPress={() => setView('front')} />
                        <Chip label="Back" on={view === 'back'} onPress={() => setView('back')} />
                      </View>
                      <BodyOutline
                        view={view}
                        area={area}
                        side={side}
                        height={250}
                        onPick={(a, sd) => {
                          setArea(a);
                          setSide(sd);
                        }}
                      />
                    </View>
                    <View style={{ flex: size === 'compact' ? undefined : 1, gap: 10, alignSelf: 'stretch' }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {AREAS.filter((a) => a.view === 'both' || a.view === view).map((a) => (
                          <Chip key={a.name} label={a.name} on={area === a.name} tone="danger" onPress={() => setArea(a.name)} />
                        ))}
                      </View>
                      {area && AREAS.find((a) => a.name === area)?.paired ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {(['Left', 'Right', 'Both'] as const).map((sd) => (
                            <Chip key={sd} label={sd} on={side === sd} tone="danger" onPress={() => setSide(sd)} />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>

                <View style={{ gap: 10 }}>
                  <BodyBold>How bad is it?</BodyBold>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {Array.from({ length: 11 }, (_, j) => j).map((n) => (
                      <Pressable
                        key={n}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: severity === n }}
                        accessibilityLabel={`Pain ${n} out of 10`}
                        onPress={() => setSeverity(n)}
                        style={{ width: 48 * k, height: 48 * k, borderRadius: 24 * k, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: severity === n ? c.bad : c.line, backgroundColor: severity === n ? c.bad : c.surface }}
                      >
                        <Text style={{ fontFamily: fonts.heavy, fontSize: Math.round(17 * k), color: severity === n ? '#fff' : c.ink }}>{n}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Small>0 = no pain</Small>
                    <Small>10 = worst pain</Small>
                  </View>
                </View>

                <View style={{ gap: 10 }}>
                  <BodyBold>What does it feel like?</BodyBold>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {(['Sharp', 'Dull ache', 'Pulling', 'Swelling', 'Not sure'] as const).map((t) => (
                      <Chip key={t} label={t} on={type === t} tone="danger" onPress={() => setType(t)} />
                    ))}
                  </View>
                </View>

                <View style={{ gap: 10 }}>
                  <BodyBold>When did it start?</BodyBold>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {[...exs.map((e) => `During ${e.name}`), 'Afterwards'].map((w) => (
                      <Chip key={w} label={w} on={when === w} tone="danger" onPress={() => setWhen(w)} />
                    ))}
                  </View>
                </View>

                <View style={{ gap: 10 }}>
                  <BodyBold>Did any of these happen?</BodyBold>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {RED_FLAGS.map((f) => (
                      <Chip key={f} label={f} on={flags.includes(f)} tone="danger" onPress={() => setFlags(flags.includes(f) ? flags.filter((x) => x !== f) : [...flags, f])} />
                    ))}
                  </View>
                </View>
                {serious ? <SafetyBox /> : null}
              </View>
            ) : null}
          </Section>

          <Section n={6} title="Anything else for Hogan?" optional>
            <TextInput value={other} onChangeText={setOther} multiline placeholder="Type here" placeholderTextColor={c.muted} style={inputStyle} accessibilityLabel="Anything else for Hogan" />
          </Section>

          <Button full title={canSend ? 'Send to Hogan' : 'Answer 1, 2 and 5 to send'} icon="send" disabled={!canSend} onPress={send} />
        </View>
      </ScrollView>
    </View>
  );
}

// Defined outside the screen so text boxes keep focus while typing.
function Section({ n, title, children, optional }: { n: number; title: string; children: React.ReactNode; optional?: boolean }) {
  const { c } = useUI();
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'baseline' }}>
        <Text style={{ fontFamily: fonts.heavy, color: c.brand, fontSize: 15 }}>{n}</Text>
        <H3>{title}</H3>
        {optional ? <Small>Optional</Small> : null}
      </View>
      {children}
    </Card>
  );
}

function SafetyBox() {
  const { c } = useUI();
  return (
    <View style={{ borderWidth: 2, borderColor: c.bad, backgroundColor: c.badSoft, borderRadius: radius.md, padding: 16, gap: 8, alignSelf: 'stretch' }} accessibilityRole="alert">
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Icon name="alert" size={22} color={c.bad} />
        <BodyBold color={c.bad}>Please stop exercising for now</BodyBold>
      </View>
      <Body>If it feels serious, call 999. For advice, call NHS 111. This app is a training tool, not a medical service.</Body>
    </View>
  );
}
