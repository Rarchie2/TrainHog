import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { DayPicker, daysLabel } from '@/components/Assign';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Chip, H3, Page, Small, Tag, Title, useUI } from '@/components/ui';
import { prescription } from '@/data/format';
import { useLookups, useStore } from '@/data/store';
import { TOUCH } from '@/theme';

// Assign a ready-made session from the library to one or more clients.
export default function AssignSession() {
  const { session: sid } = useLocalSearchParams<{ session: string }>();
  const st = useStore();
  const { exercise } = useLookups();
  const { c } = useUI();
  const s = st.sessions.find((x) => x.id === sid);
  const [who, setWho] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  if (!s) return <Page><Body>That session could not be found.</Body></Page>;
  const joined = st.clients.filter((x) => x.invite === 'joined');
  const has = (cid: string) => st.assignments.find((a) => a.clientId === cid && a.sessionId === s.id);

  return (
    <Page maxWidth={860}>
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/coach/sessions')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
        <Icon name="back" size={22} color={c.brand} />
        <BodyBold color={c.brand}>Sessions</BodyBold>
      </Pressable>
      <View style={{ gap: 4 }}>
        <Title>Assign {s.name}</Title>
        <Small>
          {s.category} · {s.minutes} min · {s.exercises.length} exercises
        </Small>
      </View>
      {done ? (
        <Card>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name="check" size={24} color={c.ok} />
            <H3>Assigned to {who.length} client{who.length === 1 ? '' : 's'}</H3>
          </View>
          <Body>They'll see it marked "New from Hogan" on {daysLabel(days).toLowerCase()}. Set anyone's own numbers from their client page.</Body>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Button small title="Back to sessions" onPress={() => router.navigate('/coach/sessions')} />
            {who.length === 1 ? <Button small variant="ghost" title="Open client page" onPress={() => router.navigate(`/coach/clients/${who[0]}`)} /> : null}
          </View>
        </Card>
      ) : (
        <>
          <Card>
            <H3>What's in it</H3>
            {s.exercises.map((x, i) => (
              <Small key={i}>
                {i + 1}. {exercise(x.exerciseId).name}: {prescription(x)}
              </Small>
            ))}
          </Card>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Tag label="Step 1" />
              <H3>Who is it for?</H3>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {joined.map((x) => (
                <Chip key={x.id} label={`${x.firstName} ${x.lastName[0]}.${has(x.id) ? ' (has it)' : ''}`} on={who.includes(x.id)} onPress={() => setWho(who.includes(x.id) ? who.filter((y) => y !== x.id) : [...who, x.id])} />
              ))}
            </View>
          </Card>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Tag label="Step 2" />
              <H3>Which days?</H3>
            </View>
            <Small>Days can hold more than one session, for example a warm-up and then weights.</Small>
            <DayPicker days={days} onChange={setDays} />
          </Card>
          <Button
            full
            icon="check"
            title={who.length ? `Assign to ${who.length} client${who.length === 1 ? '' : 's'}` : 'Pick at least one client'}
            disabled={!who.length}
            onPress={() => {
              who.forEach((cid) => st.assign(cid, s.id, days));
              setDone(true);
            }}
          />
        </>
      )}
    </Page>
  );
}
