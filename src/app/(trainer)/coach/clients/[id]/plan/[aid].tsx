import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { NumbersEditor } from '@/components/NumbersEditor';
import { Body, BodyBold, Button, Card, Page, Small, Tag, Title, useUI } from '@/components/ui';
import { useLookups, useStore } from '@/data/store';
import { groupLabel, groups, sectionLabel, sectionOf } from '@/data/structure';
import type { SessionExercise } from '@/data/types';
import { fonts, TOUCH } from '@/theme';

// Hogan sets one client's own sets, reps, weight and rest for a session,
// without changing the session for anyone else.
export default function ClientPlan() {
  const { id, aid } = useLocalSearchParams<{ id: string; aid: string }>();
  const st = useStore();
  const { exercise, session, planFor } = useLookups();
  const { c } = useUI();
  const who = st.clients.find((x) => x.id === id);
  const assignment = st.assignments.find((a) => a.id === aid);
  const [items, setItems] = useState<SessionExercise[]>(() => (who && assignment ? planFor(who.id, assignment.sessionId).map((x) => ({ ...x })) : []));
  const [saved, setSaved] = useState(false);
  if (!who || !assignment) return <Page><Body>That session could not be found.</Body></Page>;
  const s = session(assignment.sessionId);
  const g = groups(items);
  const update = (i: number, patch: Partial<SessionExercise>) => {
    setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    setSaved(false);
  };

  return (
    <Page maxWidth={860}>
      <Pressable accessibilityRole="button" onPress={() => router.navigate(`/coach/clients/${who.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
        <Icon name="back" size={22} color={c.brandText} />
        <BodyBold color={c.brandText}>{who.firstName}</BodyBold>
      </Pressable>
      <View style={{ gap: 4 }}>
        <Title>
          {who.firstName}'s numbers for {s.name}
        </Title>
        <Small>Only {who.firstName} sees these. The session stays the same for everyone else.</Small>
      </View>
      <Card>
        {items.map((x, i) => {
          const e = exercise(x.exerciseId);
          const info = g[i];
          return (
            <View key={i} style={{ gap: 10, paddingTop: i ? 14 : 0, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontFamily: fonts.heavy, color: c.brandText, fontSize: 16 }}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <BodyBold>{e.name}</BodyBold>
                  <Small>{[sectionLabel(sectionOf(x), s.kind), info ? groupLabel(info) : null].filter(Boolean).join(' · ')}</Small>
                </View>
              </View>
              <NumbersEditor x={x} name={e.name} onChange={(patch) => update(i, patch)} restNote={info && info.index < info.size ? `No rest: straight into the next exercise in the ${info.kind}.` : undefined} />
            </View>
          );
        })}
      </Card>
      <View style={{ gap: 10 }}>
        <Button
          full
          icon="check"
          title={`Save ${who.firstName}'s numbers`}
          onPress={() => {
            st.setPlan(assignment.id, items);
            setSaved(true);
          }}
        />
        {saved ? <Tag label={`Saved. ${who.firstName} sees the new numbers next time they open the session.`} tone="ok" icon="check" /> : null}
      </View>
    </Page>
  );
}
