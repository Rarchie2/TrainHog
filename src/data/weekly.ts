// Hogan's weekly check-in, copied word for word from his Google Form
// "Updated scale weekly check in" (typos corrected). Change the wording or
// add questions here and the form, Hogan's inbox and the client page all follow.

export type WeeklyQuestion = { id: string; label: string; required?: boolean } & (
  | { kind: 'scale'; max: number; low: string; high: string }
  | { kind: 'number'; unit: string }
  | { kind: 'choice'; options: string[] }
  | { kind: 'short'; prefill?: 'name' }
  | { kind: 'date' }
  | { kind: 'text'; placeholder: string }
);

export const WEEKLY_TITLE = 'Updated scale weekly check in';
export const WEEKLY_INTRO = 'This form is to be filled in once a week on a Sunday. Recommended to do so on the same day that you weigh in.';

const scale = (id: string, label: string, low: string, high: string): WeeklyQuestion => ({ id, kind: 'scale', max: 10, label, low, high });

export const WEEKLY_QUESTIONS: WeeklyQuestion[] = [
  { id: 'name', kind: 'short', label: 'Full Name', required: true, prefill: 'name' },
  { id: 'date', kind: 'date', label: 'Date', required: true },
  { id: 'weight', kind: 'number', label: 'Weight', unit: 'kg' },
  scale('challenge', 'On a scale of 1-10 how challenging did you find the gym sessions last week?', 'Easy', 'Extremely Hard'),
  scale('progress', 'How would you describe your progress in the gym last week? (increases in weight lifted, extra reps or improved technique)', 'No progression', 'Significant progression'),
  scale('nutrition', 'How well did you stick to your nutritional targets last week? (calories, macros and water intake)', 'Very disruptive week', 'Perfect week'),
  scale('energy', 'How would you describe your energy levels throughout last week? (including during the workout)', 'Very Fatigued', 'Energised'),
  scale('sleep', 'How would you describe your sleep score last week compared to your normal sleep?', 'Poor sleep quality', 'Ideal amount of sleep each night'),
  scale('recovery', 'How would you describe your recovery or soreness last week?', 'Extremely fatigued and sore', 'No fatigue or soreness'),
  scale('painGym', 'How would you describe pain or discomfort in gym sessions due to injuries last week?', 'Extreme pain and discomfort', 'No pain or discomfort'),
  scale('painOutside', 'How would you describe pain or discomfort outside of the gym sessions due to injuries last week?', 'Extreme pain and discomfort', 'No pain or discomfort'),
  scale('importance', 'How important is your goal to you?', 'Not important at all', 'I need this'),
  scale('motivation', 'How motivated are you towards reaching your goal?', 'Very unmotivated and discouraged', 'Extremely Motivated'),
  scale('wellbeing', 'How would you describe your mental and emotional wellbeing last week?', 'Extremely stressed and overwhelmed', 'Very Positive and confident'),
  { id: 'feedback', kind: 'text', label: 'Feedback (any questions, important information such as an injury or a win that you achieved last week)', placeholder: 'Your answer' },
];

export const WEEKLY_COUNT = WEEKLY_QUESTIONS.length;

export const WEEKLY_DAY = 'Sun'; // when the reminder pops up
