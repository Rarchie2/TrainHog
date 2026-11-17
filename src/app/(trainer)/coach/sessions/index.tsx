import { router } from 'expo-router';
import { View } from 'react-native';
import { Body, BodyBold, Button, Card, CATEGORY_ICON, Columns, H3, IconBadge, Page, Small, Tag, Thumb, Title, useLayout, useUI } from '@/components/ui';
import { useStore } from '@/data/store';
import { KIND_LABEL } from '@/data/structure';
import type { Category, Session } from '@/data/types';

export default function CoachSessions() {
  const st = useStore();
  const { size } = useLayout();
  const { c } = useUI();
  const groups = Array.from(st.sessions.reduce((m, s) => m.set(s.category, [...(m.get(s.category) ?? []), s]), new Map<Category, Session[]>()));
  const programmes = Array.from(st.sessions.reduce((m, s) => (s.programme ? m.set(s.programme, [...(m.get(s.programme) ?? []), s]) : m), new Map<string, Session[]>())).sort((a, b) => a[0].localeCompare(b[0]));
  const assignedCount = (id: string) => st.assignments.filter((a) => a.sessionId === id).length;

  return (
    <Page>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Title>Sessions</Title>
          <Small>
            {st.sessions.length} ready-made sessions · {st.exercises.length} exercises in your library. Assign any of them as they are, or duplicate one to make next week's version.
          </Small>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Button small variant="ghost" icon="list" title="Exercise library" onPress={() => router.navigate('/coach/sessions/exercises')} />
          {size === 'wide' ? null : <Button small variant="ghost" icon="star" title="Branding" onPress={() => router.navigate('/coach/branding')} />}
          <Button small icon="plus" title="Build a session" onPress={() => router.navigate('/coach/sessions/new')} />
        </View>
      </View>
      {programmes.length ? (
        <Card>
          <H3>Phased programmes</H3>
          <Small>Assign a phase to the clients you pick. Nobody else sees it.</Small>
          {programmes.map(([name, list]) => {
            const phases = Array.from(new Set(list.map((x) => x.phase ?? 0))).sort((a, b) => a - b);
            return (
              <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line }}>
                <View style={{ flex: 1, minWidth: 180 }}>
                  <BodyBold>{name}</BodyBold>
                  <Small>
                    {phases.filter(Boolean).length ? `Phases ${phases.filter(Boolean).join(', ')}` : 'No phases set'} · {list.length} sessions
                  </Small>
                </View>
                <Button small icon="plus" title="Assign a phase" onPress={() => router.navigate({ pathname: '/coach/sessions/programme', params: { name } } as never)} />
              </View>
            );
          })}
        </Card>
      ) : null}
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
                    {s.kind ? `${KIND_LABEL[s.kind]} · ` : ''}
                    {s.minutes} min · {s.exercises.length} exercises
                  </Small>
                  {s.programme ? <Small>{s.programme}{s.phase ? ` · phase ${s.phase}` : ''}</Small> : null}
                  <Small>Assigned to {assignedCount(s.id)} · edited {s.updated.toLowerCase()}</Small>
                  {s.updated === 'Just now' ? <Tag label="New" tone="warn" /> : null}
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    <Button small icon="plus" title="Assign" onPress={() => router.navigate(`/coach/sessions/assign?session=${s.id}`)} />
                    <Button small variant="ghost" title="Edit" onPress={() => router.navigate(`/coach/sessions/new?edit=${s.id}`)} />
                    <Button
                      small
                      variant="ghost"
                      title="Duplicate"
                      onPress={() => {
                        const id = st.duplicateSession(s.id);
                        if (id) router.navigate(`/coach/sessions/new?edit=${id}`);
                      }}
                    />
                  </View>
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
