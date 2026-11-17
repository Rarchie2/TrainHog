import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { GoalsWeek } from '@/components/Goals';
import { Icon } from '@/components/Icon';
import { Stepper } from '@/components/NumbersEditor';
import { Body, BodyBold, Button, Card, Chip, H3, Page, Small, Tag, Title, Toggle, useUI } from '@/components/ui';
import { uuid } from '@/data/backend';
import { GOAL_KINDS, goalTitle, MEAL_CHOICES } from '@/data/goals';
import { useStore } from '@/data/store';
import type { DailyGoal } from '@/data/types';
import { fonts, radius, TOUCH } from '@/theme';

// Hogan picks this client's daily goals and the numbers. The client just
// ticks Hit or not each day (meals: one tick per meal).
export default function ClientGoals() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const st = useStore();
  const { c } = useUI();
  const who = st.clients.find((x) => x.id === id);
  const [goals, setGoals] = useState<DailyGoal[]>(() => who?.dailyGoals?.map((g) => ({ ...g })) ?? []);
  const [custom, setCustom] = useState('');
  const [saved, setSaved] = useState(false);
  if (!who) return <Page><Body>Client not found.</Body></Page>;

  const input = { minHeight: 50, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface } as const;
  const change = (next: DailyGoal[]) => {
    setGoals(next);
    setSaved(false);
  };
  const find = (kind: DailyGoal['kind']) => goals.find((g) => g.kind === kind);
  const setTarget = (gid: string, target: number) => change(goals.map((g) => (g.id === gid ? { ...g, target } : g)));

  return (
    <Page maxWidth={860}>
      <Pressable accessibilityRole="button" onPress={() => router.navigate(`/coach/clients/${who.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
        <Icon name="back" size={22} color={c.brandText} />
        <BodyBold color={c.brandText}>{who.firstName}</BodyBold>
      </Pressable>
      <View style={{ gap: 4 }}>
        <Title>{who.firstName}'s daily goals</Title>
        <Small>Turn on the goals you want and set the numbers. {who.firstName} ticks Hit or not each day on their home screen, and gets a reminder each morning.</Small>
      </View>
      <Card>
        {GOAL_KINDS.map((k) => {
          const g = find(k.kind);
          return (
            <View key={k.kind} style={{ gap: 10, paddingVertical: 10, borderTopWidth: k.kind === 'steps' ? 0 : 1, borderTopColor: c.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Toggle
                  label={k.name}
                  value={!!g}
                  onChange={(on) => change(on ? [...goals, { id: uuid(), kind: k.kind, target: k.start }] : goals.filter((x) => x.kind !== k.kind))}
                />
                <View style={{ flex: 1 }}>
                  <BodyBold>{k.name}</BodyBold>
                  {g ? <Small>{goalTitle(g)} a day</Small> : <Small>Off</Small>}
                </View>
              </View>
              {g && k.kind === 'steps' ? (
                <TextInput
                  value={String(g.target ?? '')}
                  onChangeText={(t) => setTarget(g.id, Number(t.replace(/[^0-9]/g, '')) || 0)}
                  keyboardType="number-pad"
                  placeholder="8000"
                  placeholderTextColor={c.muted}
                  style={[input, { maxWidth: 200 }]}
                  accessibilityLabel="Steps a day"
                />
              ) : null}
              {g && k.kind === 'meals' ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {MEAL_CHOICES.map((n) => (
                    <Chip key={n} label={`${n} meals`} on={g.target === n} onPress={() => setTarget(g.id, n)} />
                  ))}
                </View>
              ) : null}
              {g && k.kind !== 'steps' && k.kind !== 'meals' ? (
                <Stepper label={k.unit} value={g.target ?? k.start} step={k.step} min={k.min} onChange={(n) => setTarget(g.id, Math.round(n * 100) / 100)} />
              ) : null}
            </View>
          );
        })}
      </Card>
      <Card>
        <H3>Your own goals</H3>
        <Small>Anything else to tick off each day, for example "10 minutes of stretching".</Small>
        {goals
          .filter((g) => g.kind === 'custom')
          .map((g) => (
            <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, borderTopWidth: 1, borderTopColor: c.line }}>
              <Body style={{ flex: 1 }}>{g.label}</Body>
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${g.label}`} onPress={() => change(goals.filter((x) => x.id !== g.id))} style={{ minWidth: TOUCH, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="x" size={20} color={c.muted} />
              </Pressable>
            </View>
          ))}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TextInput value={custom} onChangeText={setCustom} placeholder="Type a goal" placeholderTextColor={c.muted} style={[input, { flex: 1 }]} accessibilityLabel="New goal" />
          <Button
            small
            icon="plus"
            title="Add"
            disabled={!custom.trim()}
            onPress={() => {
              change([...goals, { id: uuid(), kind: 'custom', label: custom.trim() }]);
              setCustom('');
            }}
          />
        </View>
      </Card>
      <Button
        full
        icon="check"
        title="Save goals"
        disabled={goals.some((g) => g.kind === 'steps' && !g.target)}
        onPress={() => {
          st.setDailyGoals(who.id, goals);
          setSaved(true);
        }}
      />
      {saved ? <Tag label={`Saved. ${who.firstName} sees these on their home screen now.`} tone="ok" icon="check" /> : null}
      <GoalsWeek clientId={who.id} />
    </Page>
  );
}
