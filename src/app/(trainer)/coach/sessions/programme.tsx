import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Chip, H3, Page, Small, Tag, Title, Toggle, useUI } from '@/components/ui';
import { useStore } from '@/data/store';
import { TOUCH } from '@/theme';

// Assign one phase of a phased programme (e.g. Shoulder mobility phase 2) to
// the clients Hogan picks. Nobody else sees it.
export default function AssignProgramme() {
  const { name, phase: p } = useLocalSearchParams<{ name: string; phase?: string }>();
  const st = useStore();
  const { c } = useUI();
  const all = st.sessions.filter((s) => s.programme === name);
  const phases = Array.from(new Set(all.map((s) => s.phase ?? 0))).sort((a, b) => a - b);
  const [phase, setPhase] = useState<number>(p ? Number(p) : phases[0] ?? 0);
  const [who, setWho] = useState<string[]>([]);
  const [replace, setReplace] = useState(true);
  const [done, setDone] = useState(false);
  const inPhase = all.filter((s) => (s.phase ?? 0) === phase);
  const joined = st.clients.filter((x) => x.invite === 'joined');
  // Which phase each client is on now, to show next to their name.
  const current = (cid: string) => {
    const ph = st.assignments.filter((a) => a.clientId === cid).map((a) => all.find((s) => s.id === a.sessionId)?.phase).filter((x): x is number => x !== undefined);
    return ph.length ? Math.max(...ph) : undefined;
  };

  return (
    <Page maxWidth={860}>
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/coach/sessions')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
        <Icon name="back" size={22} color={c.brandText} />
        <BodyBold color={c.brandText}>Sessions</BodyBold>
      </Pressable>
      <View style={{ gap: 4 }}>
        <Title>{name}</Title>
        <Small>
          {phases.length} phase{phases.length === 1 ? '' : 's'} · {all.length} sessions. Only the clients you assign it to will see it.
        </Small>
      </View>
      {done ? (
        <Card>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name="check" size={24} color={c.ok} />
            <H3>
              Phase {phase} assigned to {who.length} client{who.length === 1 ? '' : 's'}
            </H3>
          </View>
          <Body>The sessions are in their list now. Put them on days from each client's calendar.</Body>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {who.length === 1 ? <Button small title="Open their calendar" onPress={() => router.navigate(`/coach/clients/${who[0]}/calendar`)} /> : null}
            <Button small variant="ghost" title="Back to sessions" onPress={() => router.navigate('/coach/sessions')} />
          </View>
        </Card>
      ) : (
        <>
          <Card>
            <H3>Phase</H3>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {phases.map((n) => (
                <Chip key={n} label={n ? `Phase ${n}` : 'No phase'} on={phase === n} onPress={() => setPhase(n)} />
              ))}
            </View>
            {inPhase.map((s) => (
              <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, borderTopWidth: 1, borderTopColor: c.line }}>
                <View style={{ flex: 1 }}>
                  <BodyBold>{s.name}</BodyBold>
                  <Small>
                    {s.exercises.length} exercises · {s.minutes} min
                  </Small>
                </View>
                <Button small variant="ghost" title="Edit" onPress={() => router.navigate(`/coach/sessions/new?edit=${s.id}`)} />
              </View>
            ))}
          </Card>
          <Card>
            <H3>Assign to</H3>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {joined.map((x) => {
                const cur = current(x.id);
                return (
                  <Chip
                    key={x.id}
                    label={`${x.firstName} ${x.lastName[0] ?? ''}.${cur ? ` (on phase ${cur})` : ''}`}
                    on={who.includes(x.id)}
                    onPress={() => setWho(who.includes(x.id) ? who.filter((y) => y !== x.id) : [...who, x.id])}
                  />
                );
              })}
            </View>
            {phases.length > 1 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Toggle label="Replace their other phases" value={replace} onChange={setReplace} />
                <Body style={{ flex: 1 }}>Take the other phases of {name} off their list</Body>
              </View>
            ) : null}
          </Card>
          {inPhase.length === 0 ? <Tag label="This phase has no sessions yet" tone="warn" /> : null}
          <Button
            full
            icon="check"
            title={who.length ? `Assign phase ${phase} to ${who.length} client${who.length === 1 ? '' : 's'}` : 'Pick at least one client'}
            disabled={!who.length || !inPhase.length}
            onPress={() => {
              for (const cid of who) {
                if (replace) {
                  st.assignments
                    .filter((a) => a.clientId === cid && all.some((s) => s.id === a.sessionId && (s.phase ?? 0) !== phase))
                    .forEach((a) => st.unassign(a.id));
                }
                inPhase.forEach((s) => st.assign(cid, s.id, []));
              }
              setDone(true);
            }}
          />
        </>
      )}
    </Page>
  );
}
