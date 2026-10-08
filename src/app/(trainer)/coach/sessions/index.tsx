import { router } from 'expo-router';
import { View } from 'react-native';
import { Body, BodyBold, Button, Card, CATEGORY_ICON, Columns, H3, IconBadge, Page, Small, Tag, Thumb, Title, useLayout, useUI } from '@/components/ui';
import { useStore } from '@/data/store';
import type { Category, Session } from '@/data/types';

export default function CoachSessions() {
  const st = useStore();
  const { size } = useLayout();
  const { c } = useUI();
  const groups = Array.from(st.sessions.reduce((m, s) => m.set(s.category, [...(m.get(s.category) ?? []), s]), new Map<Category, Session[]>()));
  const assignedCount = (id: string) => st.assignments.filter((a) => a.sessionId === id).length;

  return (
    <Page>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Title>Sessions</Title>
          <Small>
            {st.sessions.length} sessions · {st.exercises.length} exercises in your library
          </Small>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Button small variant="ghost" icon="film" title="Film an exercise" />
          <Button small icon="plus" title="Build a session" onPress={() => router.navigate('/coach/sessions/new')} />
        </View>
      </View>
      <Columns cols={size === 'wide' ? 3 : size === 'medium' ? 2 : 1} gap={18}>
        {groups.map(([cat, list]) => (
          <Card key={cat}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <IconBadge name={CATEGORY_ICON[cat]} size={36} />
              <H3>{cat}</H3>
            </View>
            {list.map((s, i) => (
              <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
                <Thumb label={s.name} width={84} compact />
                <View style={{ flex: 1 }}>
                  <BodyBold>{s.name}</BodyBold>
                  <Small>
                    {s.minutes} min · {s.exercises.length} exercises
                  </Small>
                  <Small>Assigned to {assignedCount(s.id)} · edited {s.updated.toLowerCase()}</Small>
                  {s.updated === 'Just now' ? <Tag label="New" tone="warn" /> : null}
                </View>
              </View>
            ))}
          </Card>
        ))}
      </Columns>
      <Card tone="soft">
        <BodyBold>Starter library</BodyBold>
        <Body>Common exercises are included so you don't have to film everything on day one. Swap in your own videos whenever you like.</Body>
      </Card>
    </Page>
  );
}
