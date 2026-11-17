// Daily goals: the trainer picks goals and numbers per client; the client
// ticks Hit or not each day. Meals are one tick box per meal.

import type { DailyGoal, DailyGoalKind, GoalDay } from './types';

export const GOAL_KINDS: { kind: Exclude<DailyGoalKind, 'custom'>; name: string; start: number; step: number; min: number; unit: string }[] = [
  { kind: 'steps', name: 'Steps', start: 8000, step: 500, min: 500, unit: 'steps' },
  { kind: 'water', name: 'Water', start: 2, step: 0.25, min: 0.25, unit: 'litres' },
  { kind: 'meals', name: 'Meals', start: 3, step: 1, min: 2, unit: 'meals' },
  { kind: 'protein', name: 'Protein', start: 120, step: 5, min: 10, unit: 'g' },
  { kind: 'sleep', name: 'Sleep', start: 8, step: 0.5, min: 4, unit: 'hours' },
];

export const MEAL_CHOICES = [2, 3, 4];

const num = (n: number) => n.toLocaleString('en-GB', { maximumFractionDigits: 2 });

// "8,000 steps", "Drink 2 litres of water", "3 meals"
export function goalTitle(g: DailyGoal): string {
  const t = g.target ?? GOAL_KINDS.find((k) => k.kind === g.kind)?.start ?? 0;
  switch (g.kind) {
    case 'steps':
      return `${num(t)} steps`;
    case 'water':
      return `Drink ${num(t)} ${t === 1 ? 'litre' : 'litres'} of water`;
    case 'meals':
      return `${t} meals`;
    case 'protein':
      return `${num(t)} g of protein`;
    case 'sleep':
      return `${num(t)} hours of sleep`;
    default:
      return g.label ?? 'Goal';
  }
}

export const mealCount = (g: DailyGoal) => Math.max(1, Math.min(6, g.target ?? 3));

export function isHit(g: DailyGoal, v: boolean | boolean[] | undefined): boolean {
  if (g.kind === 'meals') return Array.isArray(v) && v.filter(Boolean).length >= mealCount(g);
  return v === true;
}

export function dayFor(days: GoalDay[], clientId: string, date: string) {
  return days.find((d) => d.clientId === clientId && d.date === date);
}

// How many of the last 7 days each goal was hit, oldest day first.
export function lastSevenDays(today: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}
