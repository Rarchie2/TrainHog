import type { SessionExercise } from './types';

export function prescription(x: Pick<SessionExercise, 'sets' | 'reps' | 'time' | 'weight'>) {
  const amount = x.reps ? `${x.reps} reps` : x.time ?? '';
  return `${x.sets} ${x.sets === 1 ? 'set' : 'sets'} of ${amount}${x.weight ? ` · ${x.weight}` : ''}`;
}

export function agoLabel(minutes: number) {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hr ago`;
  const d = Math.round(minutes / 1440);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}
