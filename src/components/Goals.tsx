import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { dayFor, goalTitle, isHit, lastSevenDays, mealCount } from '@/data/goals';
import { isoDate } from '@/data/sample';
import { useStore } from '@/data/store';
import type { DailyGoal } from '@/data/types';
import { fonts } from '@/theme';
import { Icon } from './Icon';
import { Body, Button, Card, Chip, SectionHead, Small, Tag, useUI } from './ui';

// A big tick box, easy to hit for older clients.
function TickBox({ on, label, onPress, size = 44 }: { on: boolean; label: string; onPress: () => void; size?: number }) {
  const { c } = useUI();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={{ width: size, height: size, borderRadius: 12, borderWidth: on ? 0 : 2.5, borderColor: c.line, backgroundColor: on ? c.ok : c.surface, alignItems: 'center', justifyContent: 'center' }}
    >
      {on ? <Icon name="check" size={size * 0.6} color="#FFFFFF" strokeWidth={3} /> : null}
    </Pressable>
  );
}

// Client's home screen: today's goals with a tick for each (one per meal).
export function TodayGoals({ clientId }: { clientId: string }) {
  const st = useStore();
  const { c, k } = useUI();
  const [dayBack, setDayBack] = useState(0);
  const goals = st.clients.find((x) => x.id === clientId)?.dailyGoals ?? [];
  if (!goals.length) return null;
  const d = new Date();
  d.setDate(d.getDate() - dayBack);
  const date = isoDate(d);
  const hits = dayFor(st.goalDays, clientId, date)?.hits ?? {};
  const done = goals.filter((g) => isHit(g, hits[g.id])).length;

  return (
    <Card>
      <SectionHead title={dayBack ? "Yesterday's goals" : "Today's goals"} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -8, flexWrap: 'wrap' }}>
        <Small style={{ flex: 1 }}>
          {done} of {goals.length} hit{done === goals.length ? '. Brilliant!' : ''}
        </Small>
        <Chip label={dayBack ? 'Back to today' : 'Forgot yesterday?'} onPress={() => setDayBack(dayBack ? 0 : 1)} />
      </View>
      {goals.map((g) => {
        const v = hits[g.id];
        if (g.kind === 'meals') {
          const n = mealCount(g);
          const ticks = Array.from({ length: n }, (_, i) => (Array.isArray(v) ? !!v[i] : false));
          return (
            <View key={g.id} style={{ gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: Math.round(17 * k), color: c.ink }}>{goalTitle(g)}</Text>
                {isHit(g, v) ? <Tag label="Hit" tone="ok" icon="check" /> : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
                {ticks.map((on, i) => (
                  <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                    <TickBox
                      on={on}
                      label={`Meal ${i + 1}`}
                      onPress={() => st.tickGoal(clientId, date, g.id, ticks.map((t, j) => (j === i ? !t : t)))}
                    />
                    <Small>Meal {i + 1}</Small>
                  </View>
                ))}
              </View>
            </View>
          );
        }
        const on = v === true;
        return (
          <Pressable
            key={g.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={goalTitle(g)}
            onPress={() => st.tickGoal(clientId, date, g.id, !on)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line }}
          >
            <View pointerEvents="none">
              <TickBox on={on} label={goalTitle(g)} onPress={() => {}} />
            </View>
            <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: Math.round(17 * k), color: c.ink }}>{goalTitle(g)}</Text>
            {on ? <Tag label="Hit" tone="ok" /> : null}
          </Pressable>
        );
      })}
    </Card>
  );
}

// Trainer's view: the last 7 days for each goal, and how many were hit.
export function GoalsWeek({ clientId }: { clientId: string }) {
  const st = useStore();
  const { c } = useUI();
  const who = st.clients.find((x) => x.id === clientId);
  const goals = who?.dailyGoals ?? [];
  const days = lastSevenDays(new Date());
  const hitOn = (g: DailyGoal, d: Date) => isHit(g, dayFor(st.goalDays, clientId, isoDate(d))?.hits[g.id]);
  const total = goals.length * 7;
  const hitTotal = goals.reduce((n, g) => n + days.filter((d) => hitOn(g, d)).length, 0);

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <SectionHead title="Daily goals" />
        <Button small variant="ghost" icon={goals.length ? 'list' : 'plus'} title={goals.length ? 'Change goals' : 'Set goals'} onPress={() => router.navigate(`/coach/clients/${clientId}/goals`)} />
      </View>
      {goals.length === 0 ? (
        <Body>No daily goals yet. Set steps, water, meals or your own, and {who?.firstName ?? 'they'} can tick them off each day.</Body>
      ) : (
        <>
          <Small>
            Last 7 days: {hitTotal} of {total} hit ({total ? Math.round((hitTotal / total) * 100) : 0}%)
          </Small>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ flex: 1 }} />
            {days.map((d) => (
              <Text key={d.toISOString()} style={{ width: 22, textAlign: 'center', fontFamily: fonts.bold, fontSize: 12, color: c.muted }}>
                {d.toLocaleDateString('en-GB', { weekday: 'narrow' })}
              </Text>
            ))}
            <View style={{ width: 44 }} />
          </View>
          {goals.map((g) => {
            const n = days.filter((d) => hitOn(g, d)).length;
            return (
              <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, borderTopWidth: 1, borderTopColor: c.line }}>
                <Text style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 14.5, color: c.ink }} numberOfLines={2}>
                  {goalTitle(g)}
                </Text>
                {days.map((d) => {
                  const on = hitOn(g, d);
                  return (
                    <View
                      key={d.toISOString()}
                      accessibilityLabel={`${d.toLocaleDateString('en-GB', { weekday: 'long' })}: ${on ? 'hit' : 'not hit'}`}
                      style={{ width: 22, alignItems: 'center' }}
                    >
                      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: on ? c.ok : c.surface2, borderWidth: on ? 0 : 1, borderColor: c.line }} />
                    </View>
                  );
                })}
                <Text style={{ width: 44, textAlign: 'right', fontFamily: fonts.bold, fontSize: 13.5, color: n >= 5 ? c.ok : c.muted }}>{n}/7</Text>
              </View>
            );
          })}
        </>
      )}
    </Card>
  );
}

