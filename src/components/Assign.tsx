import { View } from 'react-native';
import { onDay } from '@/data/selectors';
import { useStore } from '@/data/store';
import type { Category, ID, Session } from '@/data/types';
import { BodyBold, Chip, Small, useUI } from './ui';

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const CATEGORIES: Category[] = ['Strength', 'Mobility', 'Cardio', 'Rehab', 'Warm-ups', 'Home workouts', 'Balance'];

export const daysLabel = (days: string[]) => (days.includes('Daily') ? 'Every day' : days.length ? WEEK_DAYS.filter((d) => days.includes(d)).join(', ') : 'Any day');

// Pick which days a session is on. "Any day" means it sits in the client's
// list to do whenever. A day can hold more than one session.
export function DayPicker({ days, onChange }: { days: string[]; onChange: (days: string[]) => void }) {
  const toggle = (d: string) => {
    const base = days.filter((x) => x !== 'Daily');
    onChange(base.includes(d) ? base.filter((x) => x !== d) : [...base, d]);
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {WEEK_DAYS.map((d) => (
        <Chip key={d} label={d} on={days.includes(d) || days.includes('Daily')} onPress={() => toggle(d)} />
      ))}
      <Chip label="Every day" on={days.includes('Daily')} onPress={() => onChange(days.includes('Daily') ? [] : ['Daily'])} />
      <Chip label="Any day" on={days.length === 0} onPress={() => onChange([])} />
    </View>
  );
}

// What else this client already has on the chosen days, so stacking a
// warm-up with a weights session is easy to see.
export function SameDayNote({ clientId, days, sessionId }: { clientId: ID; days: string[]; sessionId?: ID }) {
  const st = useStore();
  const { c } = useUI();
  const picked = days.includes('Daily') ? WEEK_DAYS : days;
  const rows = picked
    .map((d) => ({
      d,
      others: st.assignments
        .filter((a) => a.clientId === clientId && a.sessionId !== sessionId && onDay(a, d))
        .map((a) => st.sessions.find((s) => s.id === a.sessionId))
        .filter((s): s is Session => !!s),
    }))
    .filter((r) => r.others.length);
  if (!rows.length) return null;
  return (
    <View style={{ gap: 4, backgroundColor: c.surface2, padding: 12, borderRadius: 12 }}>
      <BodyBold>Already on those days</BodyBold>
      {rows.map((r) => (
        <Small key={r.d}>
          {r.d}: {r.others.map((s) => s.name).join(', ')}. Both will show that day.
        </Small>
      ))}
    </View>
  );
}
