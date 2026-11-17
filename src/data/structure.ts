// How Hogan structures a session: the parts in order, supersets and circuits,
// and when rest applies. Shared by the builder, the client's session page and
// the workout screen.

import type { ExerciseCategory, SectionId, SessionExercise, SessionKind } from './types';

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  'Dynamic stretches',
  'Static stretches',
  'Drills',
  'Cardiovascular',
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Core',
  'Glutes',
  'Quads',
  'Hamstrings',
  'Calves',
  'Full body',
];

export const SECTION_ORDER: SectionId[] = ['cv-warmup', 'mobility', 'specific-mobility', 'drills', 'main', 'cv-finisher', 'cooldown'];

// Which parts each kind of session offers. Most are optional: a part with no
// exercises in it simply doesn't show.
export const KIND_SECTIONS: Record<SessionKind, SectionId[]> = {
  weights: ['cv-warmup', 'mobility', 'specific-mobility', 'drills', 'main', 'cv-finisher', 'cooldown'],
  cv: ['mobility', 'specific-mobility', 'drills', 'main', 'cooldown'],
};

export const KIND_LABEL: Record<SessionKind, string> = { weights: 'Weights session', cv: 'CV session' };

export function sectionLabel(id: SectionId, kind: SessionKind = 'weights'): string {
  switch (id) {
    case 'cv-warmup': return 'CV warm up';
    case 'mobility': return 'Standard mobility warm up';
    case 'specific-mobility': return 'Specific mobility warm up';
    case 'drills': return 'Drills';
    case 'main': return kind === 'cv' ? 'Main CV session' : 'Main session';
    case 'cv-finisher': return 'CV finisher';
    case 'cooldown': return 'Cool down mobility';
  }
}

// Which library categories to show first when adding to a part.
export const SECTION_HINT: Partial<Record<SectionId, ExerciseCategory[]>> = {
  'cv-warmup': ['Cardiovascular'],
  mobility: ['Dynamic stretches'],
  'specific-mobility': ['Dynamic stretches', 'Static stretches'],
  drills: ['Drills'],
  'cv-finisher': ['Cardiovascular'],
  cooldown: ['Static stretches'],
};

export const sectionOf = (x: SessionExercise): SectionId => x.section ?? 'main';

// Keep exercises grouped by part, in part order, without reshuffling within a part.
export function sortBySection(items: SessionExercise[]): SessionExercise[] {
  return items
    .map((x, i) => ({ x, i }))
    .sort((a, b) => SECTION_ORDER.indexOf(sectionOf(a.x)) - SECTION_ORDER.indexOf(sectionOf(b.x)) || a.i - b.i)
    .map((r) => r.x);
}

// Insert an exercise at the end of its part.
export function addToSection(items: SessionExercise[], x: SessionExercise): SessionExercise[] {
  const rank = SECTION_ORDER.indexOf(sectionOf(x));
  let at = items.length;
  for (let i = 0; i < items.length; i++) {
    if (SECTION_ORDER.indexOf(sectionOf(items[i])) > rank) {
      at = i;
      break;
    }
  }
  return [...items.slice(0, at), x, ...items.slice(at)];
}

export type GroupInfo = { kind: 'superset' | 'circuit'; letter: string; index: number; size: number; start: number };

// Supersets and circuits are runs of exercises joined to the next one.
// Returns, for each position, which group it is in (A1, A2, B1 ...), if any.
// A join never crosses into another part of the session.
export function groups(items: SessionExercise[]): (GroupInfo | undefined)[] {
  const out: (GroupInfo | undefined)[] = items.map(() => undefined);
  let letter = 0;
  let i = 0;
  while (i < items.length) {
    let end = i;
    while (end < items.length - 1 && items[end].join && sectionOf(items[end]) === sectionOf(items[end + 1])) end++;
    if (end > i) {
      const kind = items[i].join!;
      const l = String.fromCharCode(65 + (letter++ % 26));
      for (let j = i; j <= end; j++) out[j] = { kind, letter: l, index: j - i + 1, size: end - i + 1, start: i };
    }
    i = end + 1;
  }
  return out;
}

// Can this exercise be joined to the next one? Only within the same part.
export const canJoin = (items: SessionExercise[], i: number) => i < items.length - 1 && sectionOf(items[i]) === sectionOf(items[i + 1]);

// Rest after this exercise: none part-way through a superset or circuit.
export function restAfter(items: SessionExercise[], i: number, g = groups(items)): number {
  const info = g[i];
  if (info && info.index < info.size) return 0;
  return items[i]?.restSec ?? 0;
}

export function groupLabel(info: GroupInfo) {
  return `${info.kind === 'circuit' ? 'Circuit' : 'Superset'} ${info.letter}${info.index}`;
}

export function effortLabel(x: Pick<SessionExercise, 'effort' | 'effortScale'>) {
  if (!x.effort) return undefined;
  return `${x.effortScale ?? 'RPE'} ${x.effort}`;
}

// Split a plan into its parts for display, keeping each exercise's position.
export function bySection(items: SessionExercise[]) {
  const parts: { id: SectionId; rows: { x: SessionExercise; i: number }[] }[] = [];
  items.forEach((x, i) => {
    const id = sectionOf(x);
    const last = parts[parts.length - 1];
    if (last && last.id === id) last.rows.push({ x, i });
    else parts.push({ id, rows: [{ x, i }] });
  });
  return parts;
}

// Turn a typed or pasted link into something the app can open.
export function cleanVideoUrl(t: string): string | undefined {
  const v = t.trim();
  if (!v) return undefined;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

// A lighter weight for a deload: "16 kg" at 60% -> "9.5 kg". Only the load
// changes, so "2 x 10 kg" keeps 2 dumbbells. Rounds to 0.5 (whole above 20).
export function lighterWeight(weight: string, keep: number) {
  const scale = (m: string) => {
    const v = Number(m) * keep;
    return String(v >= 20 ? Math.round(v) : Math.round(v * 2) / 2);
  };
  if (/\d(?:\.\d+)?\s*(?:kg|lbs?)\b/i.test(weight)) return weight.replace(/\d+(?:\.\d+)?(?=\s*(?:kg|lbs?)\b)/gi, scale);
  return weight.replace(/\d+(?:\.\d+)?(?!.*\d)/, scale);
}
