import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { CATEGORIES, DayPicker, daysLabel, SameDayNote } from '@/components/Assign';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Chip, H3, Page, Small, Tag, Title, useUI } from '@/components/ui';
import { useStore } from '@/data/store';
import type { Category } from '@/data/types';
import { fonts, radius, TOUCH } from '@/theme';

// Assign a session to one client in three clear steps:
// 1 pick a session from the library, 2 pick the days, 3 set their numbers.
export default function AssignToClient() {
  const { id, session: preset } = useLocalSearchParams<{ id: string; session?: string }>();
  const st = useStore();
  const { c } = useUI();
  const who = st.clients.find((x) => x.id === id);
  const [sessionId, setSessionId] = useState<string | undefined>(preset);
  const existing = st.assignments.find((a) => a.clientId === id && a.sessionId === sessionId);
  const [days, setDays] = useState<string[]>(existing?.days ?? []);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | null>(null);
  const [done, setDone] = useState(false);
  if (!who) return <Page><Body>Client not found.</Body></Page>;

  const chosen = st.sessions.find((s) => s.id === sessionId);
  const mine = (sid: string) => st.assignments.find((a) => a.clientId === who.id && a.sessionId === sid);
  const list = st.sessions.filter((s) => (!cat || s.category === cat) && (!q || s.name.toLowerCase().includes(q.toLowerCase())));
  const input = { minHeight: 50, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface } as const;
  const back = (
    <Pressable accessibilityRole="button" onPress={() => router.navigate(`/coach/clients/${who.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
      <Icon name="back" size={22} color={c.brandText} />
      <BodyBold color={c.brandText}>{who.firstName}</BodyBold>
    </Pressable>
  );

  if (done && chosen) {
    const a = mine(chosen.id);
    return (
      <Page maxWidth={700}>
        {back}
        <Card>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name="check" size={24} color={c.ok} />
            <Title>Assigned</Title>
          </View>
          <Body>
            {chosen.name} is on {who.firstName}'s plan for {daysLabel(days).toLowerCase()}. They'll see it marked "New from Hogan".
          </Body>
          <Small>Step 3 (optional): set {who.firstName}'s own sets, reps, weight and rest. Otherwise they get the session's numbers.</Small>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {a ? <Button small icon="dumbbell" title={`Set ${who.firstName}'s numbers`} onPress={() => router.navigate(`/coach/clients/${who.id}/plan/${a.id}`)} /> : null}
            <Button
              small
              variant="ghost"
              icon="plus"
              title="Assign another"
              onPress={() => {
                setDone(false);
                setSessionId(undefined);
                setDays([]);
              }}
            />
            <Button small variant="ghost" title={`Back to ${who.firstName}`} onPress={() => router.navigate(`/coach/clients/${who.id}`)} />
          </View>
        </Card>
      </Page>
    );
  }

  return (
    <Page maxWidth={860}>
      {back}
      <View style={{ gap: 4 }}>
        <Title>Assign a session to {who.firstName}</Title>
        <Small>Pick a ready-made session from your library, choose the days, then set their numbers.</Small>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Tag label="Step 1" tone={chosen ? 'ok' : 'brand'} icon={chosen ? 'check' : undefined} />
          <H3>Pick a session</H3>
        </View>
        {chosen ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <BodyBold>{chosen.name}</BodyBold>
              <Small>
                {chosen.category} · {chosen.minutes} min · {chosen.exercises.length} exercises
              </Small>
            </View>
            <Button small variant="ghost" title="Change" onPress={() => setSessionId(undefined)} />
          </View>
        ) : (
          <>
            <TextInput value={q} onChangeText={setQ} placeholder="Search your sessions" placeholderTextColor={c.muted} style={input} accessibilityLabel="Search sessions" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="All" on={!cat} onPress={() => setCat(null)} />
              {CATEGORIES.map((x) => (
                <Chip key={x} label={x} on={cat === x} onPress={() => setCat(cat === x ? null : x)} />
              ))}
            </View>
            {list.map((s) => {
              const a = mine(s.id);
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Pick ${s.name}`}
                  onPress={() => {
                    setSessionId(s.id);
                    setDays(a?.days ?? []);
                  }}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 60, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 })}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <BodyBold>{s.name}</BodyBold>
                    <Small>
                      {s.category} · {s.minutes} min · {s.exercises.length} exercises
                    </Small>
                  </View>
                  {a ? <Tag label={`Has it: ${daysLabel(a.days)}`} tone="neutral" /> : null}
                  <Icon name="chev" size={20} color={c.muted} />
                </Pressable>
              );
            })}
            {list.length === 0 ? <Small>No sessions match.</Small> : null}
            <Button small variant="ghost" icon="plus" title="Build a new session instead" onPress={() => router.navigate(`/coach/sessions/new?client=${who.id}`)} />
          </>
        )}
      </Card>

      {chosen ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Tag label="Step 2" />
            <H3>Which days?</H3>
          </View>
          <Small>You can put more than one session on a day, for example a mobility warm-up and then weights.</Small>
          <DayPicker days={days} onChange={setDays} />
          <SameDayNote clientId={who.id} days={days} sessionId={chosen.id} />
          <Button
            full
            icon="check"
            title={mine(chosen.id) ? `Update ${who.firstName}'s days` : `Assign to ${who.firstName}`}
            onPress={() => {
              st.assign(who.id, chosen.id, days);
              setDone(true);
            }}
          />
        </Card>
      ) : null}
    </Page>
  );
}
