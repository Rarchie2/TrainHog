import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Avatar, Body, BodyBold, Button, Card, Chip, H3, Page, Small, Tag, Title, Toggle, useLayout, useUI } from '@/components/ui';
import { useStore } from '@/data/store';
import type { Client } from '@/data/types';
import { fonts, radius } from '@/theme';

const INVITE: Record<Client['invite'], { label: string; tone: 'ok' | 'neutral' | 'warn' }> = {
  joined: { label: 'Joined', tone: 'ok' },
  sent: { label: 'Invite sent', tone: 'neutral' },
  'guardian-sent': { label: 'Parent invited', tone: 'neutral' },
  paused: { label: 'Paused', tone: 'warn' },
};

export default function Clients() {
  const st = useStore();
  const params = useLocalSearchParams<{ add?: string }>();
  const { c } = useUI();
  const { size } = useLayout();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');
  const [adding, setAdding] = useState(params.add === '1');

  const list = st.clients.filter((x) => {
    const name = `${x.firstName} ${x.lastName}`.toLowerCase();
    if (q && !name.includes(q.toLowerCase())) return false;
    if (filter === 'Gone quiet') return x.invite === 'joined' && x.daysSinceActive >= 7;
    if (filter === 'Easy view') return x.easyView;
    if (filter === 'Pain reports') return st.pain.some((p) => p.clientId === x.id && p.status === 'new');
    return true;
  });
  const wide = size !== 'compact';

  return (
    <Page>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Title>Clients</Title>
          <Small>
            {st.clients.filter((x) => x.invite === 'joined').length} active · {st.clients.filter((x) => x.invite !== 'joined').length} invites waiting
          </Small>
        </View>
        <Button small icon="plus" title="Add client" onPress={() => setAdding(true)} />
      </View>

      {adding ? <AddClient onDone={() => setAdding(false)} /> : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: radius.pill, paddingHorizontal: 16, minHeight: 50 }}>
        <Icon name="search" size={20} color={c.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search clients" placeholderTextColor={c.muted} accessibilityLabel="Search clients" style={{ flex: 1, fontFamily: fonts.medium, fontSize: 16, color: c.ink, minHeight: 48 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {['All', 'Pain reports', 'Gone quiet', 'Easy view'].map((f) => (
          <Chip key={f} label={f} on={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      <Card style={{ paddingVertical: 8 }}>
        {wide ? (
          <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 8 }}>
            <View style={{ width: 42 }} />
            {['Name', 'Programme', 'Last active', 'Status'].map((h, i) => (
              <Small key={h} style={{ flex: i === 3 ? 1.2 : i === 2 ? 0.9 : 1.6, fontFamily: fonts.heavy, letterSpacing: 1 }}>
                {h.toUpperCase()}
              </Small>
            ))}
          </View>
        ) : null}
        {list.map((x) => {
          const hurt = st.pain.some((p) => p.clientId === x.id && p.status === 'new');
          const quiet = x.invite === 'joined' && x.daysSinceActive >= 7;
          const tags = (
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: wide ? 'flex-start' : 'flex-end' }}>
              {hurt ? <Tag label="Pain report" tone="danger" icon="alert" /> : null}
              {quiet ? <Tag label="Gone quiet" tone="warn" /> : null}
              <Tag label={INVITE[x.invite].label} tone={INVITE[x.invite].tone} />
            </View>
          );
          return (
            <Pressable
              key={x.id}
              accessibilityRole="button"
              onPress={() => router.navigate(`/coach/clients/${x.id}`)}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.line, opacity: pressed ? 0.8 : 1 })}
            >
              <Avatar initials={x.initials} size={42} />
              {wide ? (
                <>
                  <View style={{ flex: 1.6 }}>
                    <BodyBold>
                      {x.firstName} {x.lastName}
                    </BodyBold>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                      {x.easyView ? <Tag label="Easy view" tone="neutral" /> : null}
                      {x.ageGroup === 'under-18' ? <Tag label="Under 18" tone="neutral" /> : null}
                    </View>
                  </View>
                  <Small style={{ flex: 1.6 }}>{x.programme}</Small>
                  <Small style={{ flex: 0.9 }}>{x.lastActive}</Small>
                  <View style={{ flex: 1.2 }}>{tags}</View>
                </>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <BodyBold>
                      {x.firstName} {x.lastName}
                    </BodyBold>
                    <Small>{x.programme}</Small>
                    <Small>{x.lastActive}</Small>
                  </View>
                  <View style={{ maxWidth: 130 }}>{tags}</View>
                </>
              )}
            </Pressable>
          );
        })}
        {list.length === 0 ? <Body style={{ paddingVertical: 12 }}>No clients match that.</Body> : null}
      </Card>
    </Page>
  );
}

function AddClient({ onDone }: { onDone: () => void }) {
  const st = useStore();
  const { c } = useUI();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [contact, setContact] = useState('');
  const [easy, setEasy] = useState(false);
  const [sent, setSent] = useState('');
  const input = { minHeight: 50, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink, flexGrow: 1, flexBasis: 200 } as const;
  if (sent) {
    return (
      <Card tone="soft">
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icon name="check" size={22} color={c.ok} />
          <BodyBold>Invite sent to {sent}</BodyBold>
        </View>
        <Body>They'll get a text or email saying "Hogan has set up your training plan. Tap to open." No password needed.</Body>
        <Button small variant="ghost" title="Done" onPress={onDone} />
      </Card>
    );
  }
  return (
    <Card>
      <H3>Add a client</H3>
      <Small>They get a one-tap invite link. Nobody picks a password.</Small>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <TextInput value={first} onChangeText={setFirst} placeholder="First name" placeholderTextColor={c.muted} style={input} accessibilityLabel="First name" />
        <TextInput value={last} onChangeText={setLast} placeholder="Last name" placeholderTextColor={c.muted} style={input} accessibilityLabel="Last name" />
        <TextInput value={contact} onChangeText={setContact} placeholder="Mobile number or email" placeholderTextColor={c.muted} style={input} accessibilityLabel="Mobile number or email" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Toggle label="Start in Easy view" value={easy} onChange={setEasy} />
        <Body>Start in Easy view (bigger text and buttons)</Body>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Button
          small
          icon="send"
          title="Send invite"
          disabled={!first.trim() || !contact.trim()}
          onPress={() => {
            st.addClient(first.trim(), last.trim(), contact.trim(), easy);
            setSent(first.trim());
          }}
        />
        <Button small variant="ghost" title="Cancel" onPress={onDone} />
      </View>
    </Card>
  );
}
