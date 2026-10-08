import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { CheckInItem, PainCard } from '@/components/CoachBits';
import { Icon } from '@/components/Icon';
import { Avatar, BodyBold, Button, Card, Eyebrow, Mark, Page, SectionHead, Small, Tag, Title, useLayout, useUI } from '@/components/ui';
import { DAY_NAMES, longDate } from '@/data/sample';
import { greeting } from '@/data/selectors';
import { useLookups, useStore } from '@/data/store';
import { fonts } from '@/theme';
import { APP_NAME } from '@/config';

export default function Inbox() {
  const st = useStore();
  const { session } = useLookups();
  const { c } = useUI();
  const { size } = useLayout();
  const [nudged, setNudged] = useState<string[]>([]);

  const openPain = st.pain.filter((p) => p.status === 'new');
  const seenPain = st.pain.filter((p) => p.status !== 'new');
  const checkIns = st.logs.filter((l) => l.checkIn).sort((a, b) => Number(a.seenByTrainer) - Number(b.seenByTrainer) || a.minutesAgo - b.minutesAgo);
  const newCount = checkIns.filter((l) => !l.seenByTrainer).length;
  const joined = st.clients.filter((x) => x.invite === 'joined');
  const trainedThisWeek = new Set(st.logs.filter((l) => l.minutesAgo < 7 * 1440).map((l) => l.clientId)).size;
  const quiet = joined.filter((x) => x.daysSinceActive >= 7);
  const today = DAY_NAMES[new Date().getDay()];
  const due = st.assignments.filter((a) => a.days.includes(today) || a.days.includes('Daily'));
  const invites = st.clients.filter((x) => x.invite === 'sent' || x.invite === 'guardian-sent');

  const kpis = [
    { n: openPain.length, label: openPain.length === 1 ? 'Pain report' : 'Pain reports', alert: openPain.length > 0 },
    { n: newCount, label: 'New check-ins' },
    { n: `${trainedThisWeek}`, of: ` of ${joined.length}`, label: 'Trained this week' },
    { n: quiet.length, label: 'Quiet for 7+ days' },
  ];

  const feed = (
    <Card>
      <SectionHead title="Check-ins" />
      <Small style={{ marginTop: -10 }}>New first</Small>
      <View>
        {checkIns.map((l) => (
          <CheckInItem key={l.id} log={l} />
        ))}
      </View>
    </Card>
  );

  const side = (
    <View style={{ gap: 18 }}>
      <Card>
        <SectionHead title="Gone quiet" />
        {quiet.length === 0 ? <Small>Everyone has trained this week.</Small> : null}
        {quiet.map((x) => (
          <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar initials={x.initials} size={40} />
            <View style={{ flex: 1 }}>
              <BodyBold>
                {x.firstName} {x.lastName}
              </BodyBold>
              <Small>Last session {x.lastActive}</Small>
            </View>
            {nudged.includes(x.id) ? (
              <Tag label="Nudged" tone="ok" icon="check" />
            ) : (
              <Button
                small
                variant="ghost"
                title="Nudge"
                onPress={() => {
                  st.sendMessage(x.id, `Hi ${x.firstName}, just checking in. Fancy a quick session this week? Even 15 minutes counts.`);
                  setNudged([...nudged, x.id]);
                }}
              />
            )}
          </View>
        ))}
      </Card>
      <Card>
        <SectionHead title="Due today" />
        <Small style={{ marginTop: -10 }}>{due.length} sessions planned</Small>
        {due.map((a) => {
          const who = st.clients.find((x) => x.id === a.clientId)!;
          const done = st.logs.some((l) => l.clientId === a.clientId && l.sessionId === a.sessionId && l.dateLabel === 'Today');
          const hurt = st.pain.some((p) => p.clientId === a.clientId && p.status === 'new');
          return (
            <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar initials={who.initials} size={40} />
              <View style={{ flex: 1 }}>
                <BodyBold>
                  {who.firstName} {who.lastName}
                </BodyBold>
                <Small>{session(a.sessionId).name}</Small>
              </View>
              {hurt ? <Tag label="Pain" tone="danger" icon="alert" /> : done ? <Tag label="Done" tone="ok" icon="check" /> : <Tag label="Planned" tone="neutral" />}
            </View>
          );
        })}
      </Card>
      <Card>
        <SectionHead title="Invites" />
        {invites.map((x) => (
          <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar initials={x.initials} size={40} />
            <View style={{ flex: 1 }}>
              <BodyBold>
                {x.firstName} {x.lastName}
              </BodyBold>
              <Small>{x.invite === 'guardian-sent' ? 'Waiting for a parent to accept' : 'Invite sent, not opened yet'}</Small>
            </View>
          </View>
        ))}
        <Button small variant="ghost" title="Resend invites" />
      </Card>
    </View>
  );

  return (
    <Page>
      {size === 'compact' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Mark size={32} />
          <Text style={{ fontFamily: fonts.display, fontSize: 17, color: c.ink, flex: 1 }}>{APP_NAME} Coach</Text>
          <Button small variant="ghost" icon="switch" title="Client app" onPress={() => router.navigate('/')} />
        </View>
      ) : null}
      <View style={{ flexDirection: size === 'compact' ? 'column' : 'row', alignItems: size === 'compact' ? 'flex-start' : 'flex-end', gap: 12 }}>
        <View style={{ flex: size === 'compact' ? undefined : 1, gap: 4 }}>
          <Eyebrow>{longDate(new Date())}</Eyebrow>
          <Title>{greeting()}, Hogan</Title>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Button small variant="ghost" icon="plus" title="Add client" onPress={() => router.navigate('/coach/clients?add=1')} />
          <Button small icon="plus" title="Build a session" onPress={() => router.navigate('/coach/sessions/new')} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {kpis.map((k) => (
          <View
            key={k.label}
            style={{ flexGrow: 1, flexBasis: size === 'compact' ? '45%' : 0, backgroundColor: k.alert ? c.badSoft : c.surface, borderWidth: 1, borderColor: k.alert ? 'transparent' : c.line, borderRadius: 18, padding: 16, gap: 2 }}
          >
            <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 32, color: k.alert ? c.bad : c.ink, fontVariant: ['tabular-nums'] }}>
              {k.n}
              {k.of ? <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: c.muted }}>{k.of}</Text> : null}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              {k.alert ? <Icon name="alert" size={16} color={c.bad} /> : null}
              <Small color={k.alert ? c.bad : undefined} style={k.alert ? { fontFamily: fonts.bold } : undefined}>
                {k.label}
              </Small>
            </View>
          </View>
        ))}
      </View>

      {size === 'compact' ? (
        <View style={{ gap: 16 }}>
          {openPain.map((p) => (
            <PainCard key={p.id} report={p} />
          ))}
          {feed}
          {side}
          {seenPain.map((p) => (
            <PainCard key={p.id} report={p} />
          ))}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
          <View style={{ flex: 1.65, gap: 18 }}>
            {openPain.map((p) => (
              <PainCard key={p.id} report={p} />
            ))}
            {feed}
            {seenPain.map((p) => (
              <PainCard key={p.id} report={p} />
            ))}
          </View>
          <View style={{ flex: 1 }}>{side}</View>
        </View>
      )}
    </Page>
  );
}
