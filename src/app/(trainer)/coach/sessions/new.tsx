import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Chip, H3, Page, Small, Tag, Thumb, Title, useLayout, useUI } from '@/components/ui';
import { useStore } from '@/data/store';
import type { Category, SessionExercise } from '@/data/types';
import { fonts, radius, TOUCH } from '@/theme';

const CATEGORIES: Category[] = ['Strength', 'Mobility', 'Cardio', 'Rehab', 'Warm-ups', 'Home workouts', 'Balance'];

function Stepper({ label, value, onChange, step = 1, min = 0, suffix = '' }: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number; suffix?: string }) {
  const { c } = useUI();
  const btn = (txt: string, d: number) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`${txt === '+' ? 'More' : 'Less'} ${label}`} onPress={() => onChange(Math.max(min, value + d))} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.heavy, fontSize: 18, color: c.ink }}>{txt}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 4 }}>
      <Small>{label}</Small>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {btn('−', -step)}
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: c.ink, minWidth: 54, textAlign: 'center' }}>
          {value}
          {suffix}
        </Text>
        {btn('+', step)}
      </View>
    </View>
  );
}

// Hogan picks exercises from his library, sets the numbers and assigns it.
export default function NewSession() {
  const st = useStore();
  const { c } = useUI();
  const { size } = useLayout();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Strength');
  const [items, setItems] = useState<SessionExercise[]>([]);
  const [assignTo, setAssignTo] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [saved, setSaved] = useState<string | null>(null);

  const library = st.exercises.filter((e) => !q || e.name.toLowerCase().includes(q.toLowerCase()) || e.tags.some((t) => t.includes(q.toLowerCase())));
  const minutes = Math.max(5, Math.round(items.reduce((t, x) => t + x.sets * (45 + x.restSec), 0) / 60));
  const update = (i: number, patch: Partial<SessionExercise>) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const input = { minHeight: 50, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface } as const;

  if (saved) {
    return (
      <Page maxWidth={700}>
        <Card>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name="check" size={24} color={c.ok} />
            <Title>Session saved</Title>
          </View>
          <Body>
            {saved} is in your library{assignTo.length ? ` and assigned to ${assignTo.length} client${assignTo.length > 1 ? 's' : ''}. They'll see it marked "New from Hogan".` : '.'}
          </Body>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Button small title="Back to sessions" onPress={() => router.navigate('/coach/sessions')} />
            <Button
              small
              variant="ghost"
              title="Build another"
              onPress={() => {
                setSaved(null);
                setName('');
                setItems([]);
                setAssignTo([]);
              }}
            />
          </View>
        </Card>
      </Page>
    );
  }

  const builder = (
    <View style={{ gap: 16 }}>
      <Card>
        <H3>Session details</H3>
        <TextInput value={name} onChangeText={setName} placeholder="Session name, e.g. Knee-friendly lower body" placeholderTextColor={c.muted} style={input} accessibilityLabel="Session name" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((cat) => (
            <Chip key={cat} label={cat} on={category === cat} onPress={() => setCategory(cat)} />
          ))}
        </View>
      </Card>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <H3>Exercises</H3>
          <Small>About {minutes} min</Small>
        </View>
        {items.length === 0 ? <Body>Pick exercises from your library to add them here.</Body> : null}
        {items.map((x, i) => {
          const e = st.exercises.find((y) => y.id === x.exerciseId)!;
          return (
            <View key={i} style={{ gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontFamily: fonts.heavy, color: c.brand, fontSize: 16 }}>{i + 1}</Text>
                <BodyBold style={{ flex: 1 }}>{e.name}</BodyBold>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${e.name}`} onPress={() => setItems(items.filter((_, j) => j !== i))} style={{ minWidth: TOUCH, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="x" size={20} color={c.muted} />
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
                <Stepper label="Sets" value={x.sets} min={1} onChange={(n) => update(i, { sets: n })} />
                <Stepper label="Reps" value={Number(x.reps ?? 10)} min={1} onChange={(n) => update(i, { reps: String(n) })} />
                <Stepper label="Rest" value={x.restSec} step={15} suffix="s" onChange={(n) => update(i, { restSec: n })} />
              </View>
              <TextInput value={x.note ?? ''} onChangeText={(t) => update(i, { note: t || undefined })} placeholder="Note for the client (optional)" placeholderTextColor={c.muted} style={input} accessibilityLabel={`Note for ${e.name}`} />
            </View>
          );
        })}
      </Card>
      <Card>
        <H3>Assign to</H3>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {st.clients
            .filter((x) => x.invite === 'joined')
            .map((x) => (
              <Chip key={x.id} label={`${x.firstName} ${x.lastName[0]}.`} on={assignTo.includes(x.id)} onPress={() => setAssignTo(assignTo.includes(x.id) ? assignTo.filter((y) => y !== x.id) : [...assignTo, x.id])} />
            ))}
        </View>
      </Card>
      <Button
        full
        icon="check"
        title={name.trim() && items.length ? 'Save session' : 'Add a name and at least one exercise'}
        disabled={!name.trim() || items.length === 0}
        onPress={() => {
          st.saveSession({ name: name.trim(), category, minutes, equipment: 'See exercises', level: 1, purpose: `${category} session from Hogan.`, exercises: items }, assignTo);
          setSaved(name.trim());
        }}
      />
    </View>
  );

  const lib = (
    <Card>
      <H3>Your exercise library</H3>
      <TextInput value={q} onChangeText={setQ} placeholder="Search, e.g. knee, balance, squat" placeholderTextColor={c.muted} style={input} accessibilityLabel="Search exercises" />
      {library.map((e) => (
        <Pressable
          key={e.id}
          accessibilityRole="button"
          accessibilityLabel={`Add ${e.name}`}
          onPress={() => setItems([...items, { exerciseId: e.id, sets: 3, reps: '10', restSec: 45 }])}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, opacity: pressed ? 0.8 : 1 })}
        >
          <Thumb label={e.name} width={76} compact />
          <View style={{ flex: 1 }}>
            <BodyBold>{e.name}</BodyBold>
            <Small>{e.tags.join(' · ')}</Small>
          </View>
          <Icon name="plus" size={22} color={c.brand} />
        </Pressable>
      ))}
    </Card>
  );

  return (
    <Page>
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/coach/sessions')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
        <Icon name="back" size={22} color={c.brand} />
        <BodyBold color={c.brand}>Sessions</BodyBold>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Title>Build a session</Title>
        <Tag label="Takes a few minutes" tone="neutral" icon="clock" />
      </View>
      {size === 'compact' ? (
        <View style={{ gap: 16 }}>
          {builder}
          {lib}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
          <View style={{ flex: 1.3 }}>{builder}</View>
          <View style={{ flex: 1 }}>{lib}</View>
        </View>
      )}
    </Page>
  );
}

