import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Chip, H3, Page, Small, Title, Toggle, useUI } from '@/components/ui';
import { useLookups, useStore } from '@/data/store';
import { lighterWeight } from '@/data/structure';
import { TOUCH } from '@/theme';

const PERCENTS = [30, 40, 50, 60];

// A lighter copy of a session for a deload week. Hogan picks how much
// lighter and what to cut, then edits the copy however he likes.
export default function DeloadVersion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const st = useStore();
  const { exercise } = useLookups();
  const { c } = useUI();
  const s = st.sessions.find((x) => x.id === id);
  const [pct, setPct] = useState(40);
  const [sets, setSets] = useState(true);
  const [weight, setWeight] = useState(true);
  if (!s) return <Page><Body>Session not found.</Body></Page>;

  const keep = 1 - pct / 100;
  const preview = s.exercises.slice(0, 6).map((x) => {
    const newSets = sets ? Math.max(1, Math.round(x.sets * keep)) : x.sets;
    const w = x.weight && weight ? lighterWeight(x.weight, keep) : x.weight;
    const setsLabel = (n: number) => `${n} ${n === 1 ? 'set' : 'sets'}`;
    return { name: exercise(x.exerciseId)?.name ?? 'Exercise', before: `${setsLabel(x.sets)}${x.weight ? ` · ${x.weight}` : ''}`, after: `${setsLabel(newSets)}${w ? ` · ${w}` : ''}` };
  });

  return (
    <Page maxWidth={760}>
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/coach/sessions')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
        <Icon name="back" size={22} color={c.brandText} />
        <BodyBold color={c.brandText}>Sessions</BodyBold>
      </Pressable>
      <View style={{ gap: 4 }}>
        <Title>Deload version of {s.name}</Title>
        <Small>Makes a lighter copy you can then edit. The original stays as it is. Put the copy on the deload week in each client's calendar.</Small>
      </View>
      <Card>
        <H3>How much lighter?</H3>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {PERCENTS.map((p) => (
            <Chip key={p} label={`${p}% less`} on={pct === p} onPress={() => setPct(p)} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Toggle label="Fewer sets" value={sets} onChange={setSets} />
          <Body style={{ flex: 1 }}>Fewer sets</Body>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Toggle label="Lighter weight" value={weight} onChange={setWeight} />
          <Body style={{ flex: 1 }}>Lighter weight</Body>
        </View>
        <Small>For fewer sessions in the week, take sessions off the deload week in the client's calendar.</Small>
      </Card>
      <Card>
        <H3>Preview</H3>
        {preview.map((x, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 44, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
            <BodyBold style={{ flex: 1 }}>{x.name}</BodyBold>
            <Small>{x.before}</Small>
            <Icon name="chev" size={16} color={c.muted} />
            <Small style={{ color: c.ink }}>{x.after}</Small>
          </View>
        ))}
        {s.exercises.length > 6 ? <Small>and {s.exercises.length - 6} more</Small> : null}
      </Card>
      <Button
        full
        icon="check"
        title="Make the deload version"
        disabled={!sets && !weight}
        onPress={() => {
          const nid = st.makeDeload(s.id, pct, { sets, weight });
          if (nid) router.navigate(`/coach/sessions/new?edit=${nid}`);
        }}
      />
    </Page>
  );
}
