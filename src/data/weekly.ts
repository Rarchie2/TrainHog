// The weekly check-in questions. These are placeholders until Hogan sends his
// own list: change the wording or add questions here and the form, Hogan's
// inbox and the client page all follow.

export type WeeklyQuestion =
  | { id: string; kind: 'scale'; label: string; low: string; high: string }
  | { id: string; kind: 'number'; label: string; unit: string }
  | { id: string; kind: 'choice'; label: string; options: string[] }
  | { id: string; kind: 'text'; label: string; placeholder: string };

export const WEEKLY_QUESTIONS: WeeklyQuestion[] = [
  { id: 'weight', kind: 'number', label: "This morning's weight", unit: 'kg' },
  { id: 'energy', kind: 'scale', label: 'How has your energy been?', low: 'Very low', high: 'Great' },
  { id: 'sleep', kind: 'scale', label: 'How have you slept?', low: 'Badly', high: 'Really well' },
  { id: 'stress', kind: 'scale', label: 'How stressed have you felt?', low: 'Not at all', high: 'Very' },
  { id: 'food', kind: 'scale', label: 'How well have you stuck to your eating plan?', low: 'Not at all', high: 'Spot on' },
  { id: 'sessions', kind: 'choice', label: 'Did you do all your sessions?', options: ['All of them', 'Most', 'Some', 'None'] },
  { id: 'win', kind: 'text', label: 'Best thing about your week', placeholder: 'For example: ran 5 km without stopping' },
  { id: 'note', kind: 'text', label: 'Anything Hogan should know?', placeholder: 'Injuries, a busy week, holidays coming up' },
];

export const WEEKLY_DAY = 'Sun'; // when the reminder pops up
