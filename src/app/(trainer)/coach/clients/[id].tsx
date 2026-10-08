import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { CheckInItem, PainCard } from '@/components/CoachBits';
import { Icon } from '@/components/Icon';
import { Avatar, Body, BodyBold, Button, Card, Chip, Columns, H3, Page, Small, Tag, Title, Toggle, useLayout, useUI } from '@/components/ui';
import { useClientData } from '@/data/selectors';
import { useStore } from '@/data/store';
import { fonts, radius, TOUCH } from '@/theme';

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const st = useStore();
  const { c } = useUI();
  const { size } = useLayout();
  const who = st.clients.find((x) => x.id === id);
  const d = useClientData(id);
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [assigning, setAssigning] = useState(false);
  if (!who) return <Page><Body>Client not found.</Body></Page>;

  const unassigned = st.sessions.filter((s) => !d.mySessions.some((x) => x.session.id === s.id));
  const efforts = d.logs.filter((l) => l.checkIn).slice(0, 8).reverse();

  const profile = (
    <Card>
      <H3>Profile</H3>
      {[
        ['Goals', who.goals],
        ['Injuries or conditions', who.conditions],
        ['Contact', who.contact],
        ['Programme', who.programme],
      ].map(([k, v]) => (
        <View key={k} style={{ gap: 2 }}>
          <Small>{k}</Small>
          <Body>{v}</Body>
        </View>
      ))}
      <View style={{ gap: 2, backgroundColor: c.surface2, padding: 12, borderRadius: radius.md }}>
        <Small>Notes only you can see</Small>
        <Body>{who.trainerNotes || 'None yet.'}</Body>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Toggle label="Easy view" value={who.easyView} onChange={(v) => st.setEasyView(who.id, v)} />
        <Body style={{ flex: 1 }}>Easy view for this client</Body>
      </View>
    </Card>
  );

  const message = (
    <Card>
      <H3>Message {who.firstName}</H3>
      <Small>Shows at the top of their Today screen.</Small>
      <TextInput
        value={msg}
        onChangeText={(t) => {
          setMsg(t);
          setSent(false);
        }}
        multiline
        placeholder="For example: Take it easy on the knee this week"
        placeholderTextColor={c.muted}
        accessibilityLabel={`Message ${who.firstName}`}
        style={{ minHeight: 80, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, padding: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink, textAlignVertical: 'top' }}
      />
      <Button
        small
        icon="send"
        title="Send message"
        disabled={!msg.trim()}
        onPress={() => {
          st.sendMessage(who.id, msg.trim());
          setMsg('');
          setSent(true);
        }}
      />
      {sent ? <Tag label={`Sent. ${who.firstName} will see it on their Today screen.`} tone="ok" icon="check" /> : null}
    </Card>
  );

  const sessions = (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <H3>Assigned sessions</H3>
        <Button small variant="ghost" icon="plus" title="Assign" onPress={() => setAssigning(!assigning)} />
      </View>
      {assigning ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {unassigned.map((s) => (
            <Chip key={s.id} label={s.name} icon="plus" onPress={() => st.assign(who.id, s.id)} />
          ))}
          {unassigned.length === 0 ? <Small>Every session is already assigned.</Small> : null}
        </View>
      ) : null}
      {d.mySessions.map(({ session, assignment }) => (
        <View key={assignment.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: TOUCH }}>
          <View style={{ flex: 1 }}>
            <BodyBold>{session.name}</BodyBold>
            <Small>
              {session.category} · {assignment.days.length ? assignment.days.join(', ') : 'Any day'}
            </Small>
          </View>
          {assignment.isNew ? <Tag label="New" tone="warn" /> : null}
        </View>
      ))}
    </Card>
  );

  const trend = (
    <Card>
      <H3>Effort over time</H3>
      <Small>From their last {efforts.length} check-ins, out of 10</Small>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120 }}>
        {efforts.map((l, i) => (
          <View key={l.id} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Small style={{ fontFamily: fonts.bold }}>{l.checkIn!.effort}</Small>
            <View style={{ width: '100%', maxWidth: 34, height: (l.checkIn!.effort / 10) * 90, borderRadius: 6, backgroundColor: c.brand, opacity: i === efforts.length - 1 ? 1 : 0.45 }} />
          </View>
        ))}
        {efforts.length === 0 ? <Small>No check-ins yet.</Small> : null}
      </View>
    </Card>
  );

  const history = (
    <Card>
      <H3>Sessions and check-ins</H3>
      <View>
        {d.logs.map((l) => (
          <CheckInItem key={l.id} log={l} showClient={false} />
        ))}
        {d.logs.length === 0 ? <Small>Nothing yet.</Small> : null}
      </View>
      {d.diary.length ? <H3>Diary notes</H3> : null}
      {d.diary.map((e) => (
        <View key={e.id} style={{ gap: 2 }}>
          <Small>{e.dateLabel}</Small>
          <Body>{e.text}</Body>
        </View>
      ))}
    </Card>
  );

  return (
    <Page>
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/coach/clients')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
        <Icon name="back" size={22} color={c.brand} />
        <BodyBold color={c.brand}>Clients</BodyBold>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Avatar initials={who.initials} size={60} />
        <View style={{ flex: 1, minWidth: 180 }}>
          <Title>
            {who.firstName} {who.lastName}
          </Title>
          <Small>
            {who.programme} · Last active {who.lastActive.toLowerCase()}
          </Small>
        </View>
        {who.invite !== 'joined' ? <Button small variant="ghost" icon="send" title="Resend invite" /> : null}
      </View>
      {d.pain.map((p) => (
        <PainCard key={p.id} report={p} />
      ))}
      <Columns cols={size === 'compact' ? 1 : 2} gap={18}>
        {profile}
        {message}
        {sessions}
        {trend}
      </Columns>
      {history}
    </Page>
  );
}
