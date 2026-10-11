import type { ChangeKind, SessionExercise } from './types';

export function prescription(x: Pick<SessionExercise, 'sets' | 'reps' | 'time' | 'weight'>) {
  const amount = x.reps ? (/^\d+$/.test(x.reps) ? `${x.reps} reps` : x.reps) : x.time ?? '';
  return `${x.sets} ${x.sets === 1 ? 'set' : 'sets'} of ${amount}${x.weight ? ` · ${x.weight}` : ''}`;
}

export function agoLabel(minutes: number) {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hr ago`;
  const d = Math.round(minutes / 1440);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

export const CHANGE_LABELS: Record<ChangeKind, string> = {
  'lowered-weight': 'Lowered the weight',
  'raised-weight': 'Went heavier',
  'changed-variation': 'Changed the variation',
  'fewer-reps': 'Did fewer reps',
  issue: "Something didn't feel right",
};
