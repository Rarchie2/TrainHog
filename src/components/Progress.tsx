import { View } from 'react-native';
import { useLookups, useStore } from '@/data/store';
import type { ID } from '@/data/types';
import { ChangeLine, PlanLine, type Point } from './Charts';
import { BodyBold, Card, H3, Small, Tag, useLayout, useUI } from './ui';

const GOAL_WORD = { lose: 'Weight loss', gain: 'Weight gain', maintain: 'Holding steady' } as const;

function weekOf(planStart: string, date: string) {
  const ms = new Date(date + 'T12:00:00').getTime() - new Date(planStart + 'T12:00:00').getTime();
  return Math.floor(ms / (7 * 86400000)) + 1;
}

export function usePlanWeek(clientId: ID) {
  const st = useStore();
  const who = st.clients.find((x) => x.id === clientId);
  if (!who?.planStart || !who.planWeeks) return null;
  const now = weekOf(who.planStart, new Date().toISOString().slice(0, 10));
  return { week: Math.min(Math.max(now, 1), who.planWeeks), of: who.planWeeks };
}

// A client's plan: bodyweight against their goal, and the top weight on each
// key lift, week by week. Hogan sees it on the client page; the client sees
// their own on Today (audience="client").
export function ProgressCard({ clientId, audience = 'coach' }: { clientId: ID; audience?: 'coach' | 'client' }) {
  const st = useStore();
  const { exercise } = useLookups();
  const { c } = useUI();
  const { size } = useLayout();
  const who = st.clients.find((x) => x.id === clientId)!;
  const plan = usePlanWeek(clientId);

  const mine = audience === 'client';
  if (!plan || !who.planStart) {
    if (mine) return null;
    return (
      <Card>
        <H3>Progress</H3>
        <Small>Set a plan length and start date to see progress graphs.</Small>
      </Card>
    );
  }
  const toPoints = (rows: { date: string; value: number }[]): Point[] => {
    const byWeek = new Map<number, number>();
    rows.forEach((r) => {
      const wk = weekOf(who.planStart!, r.date);
      if (wk >= 1 && wk <= plan.of) byWeek.set(wk, r.value);
    });
    return [...byWeek.entries()].sort((a, b) => a[0] - b[0]).map(([week, value]) => ({ week, value }));
  };

  const bw = toPoints(st.bodyweights.filter((b) => b.clientId === clientId).map((b) => ({ date: b.date, value: b.kg })));
  const liftIds = [...new Set(st.lifts.filter((l) => l.clientId === clientId).map((l) => l.exerciseId))];
  const lifts = liftIds.map((id) => ({ id, points: toPoints(st.lifts.filter((l) => l.clientId === clientId && l.exerciseId === id).map((l) => ({ date: l.date, value: l.kg }))) })).filter((l) => l.points.length);
  const goal = who.goalType ?? 'maintain';
  const goodBw = goal === 'lose' ? 'down' : goal === 'gain' ? 'up' : 'flat';
  const pct = Math.round((plan.week / plan.of) * 100);

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <View>
          <H3>{mine ? 'Your progress' : 'Progress'}</H3>
          <Small>
            Week {plan.week} of {plan.of} · goal: {GOAL_WORD[goal].toLowerCase()}
          </Small>
        </View>
        <Tag label={`${pct}% through the plan`} tone="neutral" icon="cal" />
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surface2, overflow: 'hidden' }}>
        <View style={{ height: 6, width: `${pct}%`, backgroundColor: c.brand }} />
      </View>

      <View style={{ gap: 6, paddingTop: 6 }}>
        <BodyBold>Bodyweight</BodyBold>
        {bw.length ? (
          <>
            <ChangeLine first={bw[0].value} last={bw[bw.length - 1].value} unit="kg" good={goodBw} audience={audience} />
            <PlanLine points={bw} weeks={plan.of} unit="kg" />
          </>
        ) : (
          <Small>{mine ? 'Add your weight in the weekly check-in to see it here.' : 'No weigh-ins yet. They come in with the weekly check-in.'}</Small>
        )}
      </View>

      <View style={{ gap: 10, paddingTop: 6 }}>
        <BodyBold>Strength</BodyBold>
        {lifts.length === 0 ? <Small>{mine ? 'Your top weights show here once Hogan adds weighted lifts.' : 'No weighted lifts in this plan yet.'}</Small> : null}
        <View style={{ flexDirection: size === 'compact' ? 'column' : 'row', gap: 16, flexWrap: 'wrap' }}>
          {lifts.map((l) => (
            <View key={l.id} style={{ flexGrow: 1, flexBasis: size === 'compact' ? 'auto' : 220, minWidth: 220, gap: 4 }}>
              <Small style={{ fontFamily: undefined }}>{exercise(l.id).name}, top set</Small>
              <ChangeLine first={l.points[0].value} last={l.points[l.points.length - 1].value} unit="kg" good="up" audience={audience} />
              <PlanLine points={l.points} weeks={plan.of} unit="kg" height={120} />
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}
