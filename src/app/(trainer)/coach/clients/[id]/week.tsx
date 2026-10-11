import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { FeelRow, useHardList } from '@/components/ClientBits';
import { ChangesList, PainCard, WeeklyItem } from '@/components/CoachBits';
import { Icon } from '@/components/Icon';
import { Avatar, Body, BodyBold, Button, Card, Columns, H3, Page, Small, Tag, Title, useLayout, useUI } from '@/components/ui';
import { prescription } from '@/data/format';
import { isoDate } from '@/data/sample';
import { useClientData } from '@/data/selectors';
import { useLookups, useStore } from '@/data/store';
import type { SessionLog } from '@/data/types';
import { TOUCH } from '@/theme';

const WEEK = 7 * 1440;

function LogCard({ log }: { log: SessionLog }) {
  const { session, exercise, planFor } = useLookups();
  const { c } = useUI();
  const hard = useHardList(log);
  const s = session(log.sessionId);
  const plan = planFor(log.clientId, log.sessionId);
  const ci = log.checkIn;
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <H3>{s.name}</H3>
        <Small>{log.dateLabel}</Small>
      </View>
      <FeelRow log={log} />
      <View>
        {plan.map((x, i) => {
          const done = log.completedExerciseIds.includes(x.exerciseId);
          const changed = log.changes?.some((ch) => ch.exerciseId === x.exerciseId);
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.line }}>
              <Icon name={done ? 'check' : 'x'} size={18} color={done ? c.ok : c.muted} />
              <View style={{ flex: 1 }}>
                <BodyBold>{exercise(x.exerciseId).name}</BodyBold>
                <Small>{done ? prescription(x) : 'Skipped'}</Small>
              </View>
              {changed ? <Tag label="Changed" tone="warn" /> : null}
            </View>
          );
        })}
      </View>
      <ChangesList log={log} />
      {hard.length ? <Tag label={`Found hard: ${hard.join(', ')}`} tone="warn" /> : null}
      {ci?.enjoyed ? <Body>{ci.enjoyed}</Body> : null}
      {ci?.hardNote ? <Body>{ci.hardNote}</Body> : null}
      {ci?.forTrainer ? <Body>{ci.forTrainer}</Body> : null}
      {ci?.voiceNote ? <Body>"{ci.voiceNote.transcript}"</Body> : null}
    </Card>
  );
}

// What Hogan opens before an in-person session: everything from the last 7 days.
export default function ClientWeek() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const st = useStore();
  const { c } = useUI();
  const { size } = useLayout();
  const who = st.clients.find((x) => x.id === id);
  const d = useClientData(id);
  if (!who) return <Page><Body>Client not found.</Body></Page>;

  const today = isoDate(new Date());
  const weekAgo = isoDate(new Date(Date.now() - 7 * 86400000));
  const booked = st.inPerson.find((x) => x.clientId === who.id && x.date === today);
  const logs = d.logs.filter((l) => l.minutesAgo < WEEK);
  const pain = d.pain.filter((p) => p.minutesAgo < WEEK);
  const weekly = d.weekly.filter((w) => w.minutesAgo < WEEK);
  const diary = d.diary.filter((e) => e.date >= weekAgo);
  const changes = logs.reduce((n, l) => n + (l.changes?.length ?? 0), 0);
  const efforts = logs.filter((l) => l.checkIn).map((l) => l.checkIn!.effort);
  const avgEffort = efforts.length ? (efforts.reduce((a, b) => a + b, 0) / efforts.length).toFixed(1) : '–';

  const stats = [
    { n: String(logs.length), label: logs.length === 1 ? 'Session done' : 'Sessions done' },
    { n: avgEffort, label: 'Average effort /10' },
    { n: String(changes), label: changes === 1 ? 'Change made' : 'Changes made' },
    { n: String(pain.length), label: pain.length === 1 ? 'Pain report' : 'Pain reports', alert: pain.length > 0 },
  ];

  return (
    <Page maxWidth={1100}>
      <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/coach'))} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
        <Icon name="back" size={22} color={c.brand} />
        <BodyBold color={c.brand}>Back</BodyBold>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Avatar initials={who.initials} size={56} />
        <View style={{ flex: 1, minWidth: 180 }}>
          <Title>{who.firstName}'s last 7 days</Title>
          <Small>{booked ? `In person today at ${booked.time} · ${booked.place}` : who.programme}</Small>
        </View>
        <Button small variant="ghost" title="Full profile" onPress={() => router.navigate(`/coach/clients/${who.id}`)} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {stats.map((k) => (
          <View key={k.label} style={{ flexGrow: 1, flexBasis: size === 'compact' ? '45%' : 0, backgroundColor: k.alert ? c.badSoft : c.surface, borderWidth: 1, borderColor: k.alert ? 'transparent' : c.line, borderRadius: 18, padding: 14, gap: 2 }}>
            <H3 color={k.alert ? c.bad : undefined}>{k.n}</H3>
            <Small color={k.alert ? c.bad : undefined}>{k.label}</Small>
          </View>
        ))}
      </View>

      {pain.map((p) => (
        <PainCard key={p.id} report={p} />
      ))}

      <Columns cols={size === 'wide' ? 2 : 1} gap={18}>
        <View style={{ gap: 18 }}>
          {logs.length === 0 ? (
            <Card>
              <H3>No sessions this week</H3>
              <Small>{who.firstName} hasn't logged a session in the last 7 days.</Small>
            </Card>
          ) : null}
          {logs.map((l) => (
            <LogCard key={l.id} log={l} />
          ))}
        </View>
        <View style={{ gap: 18 }}>
          <Card>
            <H3>Weekly check-in</H3>
            {weekly.length ? weekly.map((w) => <WeeklyItem key={w.id} w={w} showClient={false} />) : <Small>Not sent this week.</Small>}
          </Card>
          <Card>
            <H3>Diary</H3>
            {diary.length === 0 ? <Small>No diary notes this week.</Small> : null}
            {diary.map((e) => (
              <View key={e.id} style={{ gap: 2 }}>
                <Small>{e.dateLabel}</Small>
                <Body>{e.text}</Body>
              </View>
            ))}
          </Card>
        </View>
      </Columns>
    </Page>
  );
}
