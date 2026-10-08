// Sample data for the demo. Every name here is made up.
// Dates are relative to today so the demo always looks current.

import type {
  Assignment,
  Business,
  Client,
  DiaryEntry,
  Exercise,
  Message,
  PainReport,
  Reply,
  Session,
  SessionLog,
} from './types';

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const longDate = (d: Date) => `${DAY_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const monthName = (d: Date) => MONTHS[d.getMonth()];
export function relativeLabel(n: number): string {
  if (n === 0) return 'Today';
  if (n === 1) return 'Yesterday';
  return longDate(daysAgo(n));
}

export const business: Business = {
  id: 'b1',
  name: 'TrainHog',
  trainerName: 'Hogan',
  town: 'Winchester',
  brandColor: '#1E5BD8',
};

const ex = (
  id: string,
  name: string,
  videoLength: string,
  coachingNotes: string,
  steps: string[],
  tags: string[],
  easier?: string,
  harder?: string,
): Exercise => ({ id, businessId: 'b1', name, videoLength, coachingNotes, steps, tags, easier, harder });

export const exercises: Exercise[] = [
  ex('e1', 'Goblet squat', '0:22', 'Hold the dumbbell close to your chest. Sit back like there is a chair behind you and keep your knees in line with your toes.', ['Stand with feet just wider than hips.', 'Hold the weight at your chest.', 'Sit down and back until your thighs are level.', 'Push through your heels to stand.'], ['legs', 'strength'], 'Squat to a chair and stand back up', 'Pause for 2 seconds at the bottom'),
  ex('e2', 'Romanian deadlift', '0:19', 'Soft knees, push your hips back and keep the weights close to your legs. You should feel it in the back of your thighs.', ['Hold the dumbbells in front of your thighs.', 'Push your hips back with a flat back.', 'Lower to just below the knee.', 'Squeeze your bum to stand tall.'], ['legs', 'strength'], 'Use lighter weights and a shorter range', 'Single-leg version'),
  ex('e3', 'Walking lunge', '0:16', 'Long step, drop the back knee gently towards the floor and keep your chest up.', ['Step forward with one leg.', 'Lower until both knees are bent.', 'Push off and bring the back foot through.', 'Repeat on the other side.'], ['legs'], 'Static split squat holding a wall', 'Hold dumbbells'),
  ex('e4', 'Glute bridge', '0:14', 'Feet flat, push through your heels and squeeze at the top. Do not arch your lower back.', ['Lie on your back with knees bent.', 'Lift your hips until your body is in a line.', 'Hold for a second.', 'Lower slowly.'], ['legs', 'rehab'], 'Smaller range', 'Single leg'),
  ex('e5', 'Calf raise', '0:12', 'Rise up slowly onto your toes and lower under control. Hold a wall or counter for balance.', ['Stand tall near a wall.', 'Rise onto your toes.', 'Pause at the top.', 'Lower for 3 seconds.'], ['legs', 'balance'], 'Both hands on the wall', 'One leg at a time'),
  ex('e6', 'Dead bug', '0:18', 'Press your lower back into the floor the whole time. Move slowly and breathe out as you reach.', ['Lie on your back, arms up, knees over hips.', 'Lower opposite arm and leg.', 'Return to the start.', 'Swap sides.'], ['core'], 'Move legs only', 'Hold a light weight'),
  ex('e7', 'Step-up', '0:20', 'Whole foot on the step. Drive up through the front heel and step down with control.', ['Place one foot on the step.', 'Push up to stand on the step.', 'Step down slowly.', 'Do all reps then swap legs.'], ['legs', 'rehab'], 'Lower step and hold a rail', 'Hold dumbbells'),
  ex('e8', 'Incline push-up', '0:15', 'Hands on a bench or kitchen counter, body in a straight line, lower your chest to the edge.', ['Hands shoulder width on the bench.', 'Walk your feet back.', 'Lower your chest towards the bench.', 'Push back up.'], ['upper'], 'Use a wall', 'Floor push-up'),
  ex('e9', 'Dumbbell row', '0:17', 'Flat back, pull your elbow towards your hip and squeeze your shoulder blade.', ['One hand and knee on the bench.', 'Let the weight hang.', 'Pull the elbow back.', 'Lower slowly.'], ['upper'], 'Lighter weight', 'Pause at the top'),
  ex('e10', 'Shoulder press', '0:15', 'Ribs down, press straight up without leaning back.', ['Weights at shoulder height.', 'Press up until arms are straight.', 'Lower to your shoulders.'], ['upper'], 'Seated', 'Standing on one leg'),
  ex('e11', 'Cat cow', '0:20', 'Move slowly with your breath. Round up as you breathe out, dip down as you breathe in.', ['Hands and knees on the floor.', 'Round your back up.', 'Let your tummy drop and look forward.'], ['mobility'], 'Seated on a chair', undefined),
  ex('e12', 'Thread the needle', '0:18', 'Reach under and rotate gently. Let your shoulder relax towards the floor.', ['On hands and knees.', 'Slide one arm under your body.', 'Return and reach that arm to the ceiling.'], ['mobility'], 'Smaller range', undefined),
  ex('e13', 'Hip flexor stretch', '0:25', 'Tuck your tail under and you will feel the stretch at the front of the back hip.', ['Kneel on one knee with a cushion.', 'Tuck your pelvis under.', 'Shift forward gently.', 'Hold and breathe.'], ['mobility'], 'Standing version holding a chair', undefined),
  ex('e14', 'Sit to stand', '0:24', 'Feet back slightly, lean forward and stand up tall. Sit down slowly, no flopping.', ['Sit near the front of a sturdy chair.', 'Feet flat, slightly behind your knees.', 'Lean forward and stand up.', 'Sit down slowly.'], ['legs', 'strength', 'senior'], 'Use your hands on your thighs', 'Hold a light weight'),
  ex('e15', 'Heel to toe walk', '0:20', 'Keep one hand on the kitchen counter. Look ahead, not at your feet.', ['Stand beside the counter.', 'Place one heel in front of the other toe.', 'Take 10 slow steps.', 'Turn and come back.'], ['balance', 'senior'], 'Feet slightly apart', 'Without holding on'),
  ex('e16', 'Single-leg balance', '0:16', 'Hold the counter lightly. Stand tall and keep a soft knee.', ['Stand beside the counter.', 'Lift one foot just off the floor.', 'Hold for up to 30 seconds.', 'Swap legs.'], ['balance', 'senior'], 'Toes on the floor for support', 'Eyes closed, still holding on'),
  ex('e17', 'Seated knee extension', '0:14', 'Straighten your leg slowly and squeeze the front of your thigh for a second.', ['Sit tall in a chair.', 'Straighten one knee.', 'Hold for a second.', 'Lower slowly.'], ['rehab', 'senior'], undefined, 'Add an ankle weight'),
  ex('e18', 'Banded clam', '0:15', 'Keep your feet together and your hips stacked. Open the knee like a clam shell.', ['Lie on your side, knees bent, band above knees.', 'Keep feet together.', 'Lift the top knee.', 'Lower slowly.'], ['rehab'], 'No band', 'Thicker band'),
  ex('e19', 'Jumping jacks', '0:10', 'Land softly on the balls of your feet.', ['Jump feet out and arms up.', 'Jump back in.'], ['cardio'], 'Step out instead of jumping', undefined),
  ex('e20', 'Squat thrust', '0:12', 'Hands down, step or jump back to a plank, then return and stand.', ['Squat and place hands down.', 'Step or jump back.', 'Return and stand up.'], ['cardio'], 'Step back one leg at a time', 'Add a jump at the top'),
  ex('e21', 'Mountain climber', '0:10', 'Shoulders over hands, drive the knees in one at a time.', ['Start in a plank.', 'Bring one knee in.', 'Swap legs quickly.'], ['cardio', 'core'], 'Hands on a bench', undefined),
  ex('e22', 'Arm circles', '0:10', 'Small circles first, then bigger. Keep your shoulders relaxed.', ['Arms out to the side.', 'Make small circles forwards.', 'Then backwards.'], ['mobility', 'warm-up'], 'One arm at a time', undefined),
  ex('e23', 'Seated march', '0:12', 'Sit tall and lift one knee at a time. Swing your arms if you can.', ['Sit near the front of the chair.', 'Lift one knee.', 'Lower and lift the other.'], ['warm-up', 'senior'], undefined, 'Standing march'),
];

const s = (
  id: string,
  name: string,
  category: Session['category'],
  minutes: number,
  equipment: string,
  level: Session['level'],
  purpose: string,
  exercises: Session['exercises'],
  updated: string,
  safetyNote?: string,
): Session => ({ id, businessId: 'b1', name, category, minutes, equipment, level, purpose, exercises, updated, safetyNote });

export const sessions: Session[] = [
  s('s1', 'Lower body strength A', 'Strength', 40, 'Dumbbells', 2, 'Builds leg and hip strength for running and everyday life.', [
    { exerciseId: 'e1', sets: 3, reps: '10', weight: '16 kg', restSec: 60 },
    { exerciseId: 'e2', sets: 3, reps: '10', weight: '2 x 10 kg', restSec: 60 },
    { exerciseId: 'e3', sets: 3, reps: '8 each side', restSec: 60, note: 'Swap for step-ups if the knee is sore.' },
    { exerciseId: 'e4', sets: 3, reps: '12', restSec: 45 },
    { exerciseId: 'e5', sets: 3, reps: '15', restSec: 30 },
    { exerciseId: 'e6', sets: 3, reps: '8 each side', restSec: 30 },
  ], '2 days ago', 'Stop if you feel sharp pain in the knee.'),
  s('s2', 'Upper body B', 'Strength', 35, 'Dumbbells, bench', 2, 'Pushing and pulling strength with good posture.', [
    { exerciseId: 'e8', sets: 3, reps: '10', restSec: 60 },
    { exerciseId: 'e9', sets: 3, reps: '10 each side', weight: '12 kg', restSec: 60 },
    { exerciseId: 'e10', sets: 3, reps: '10', weight: '2 x 8 kg', restSec: 60 },
    { exerciseId: 'e6', sets: 2, reps: '8 each side', restSec: 30 },
  ], '1 week ago'),
  s('s3', 'Knee-friendly lower body', 'Rehab', 30, 'Step, band', 1, 'Strength for the legs without loading a sore knee.', [
    { exerciseId: 'e7', sets: 3, reps: '8 each leg', restSec: 60 },
    { exerciseId: 'e4', sets: 3, reps: '12', restSec: 45 },
    { exerciseId: 'e18', sets: 3, reps: '12 each side', restSec: 30 },
    { exerciseId: 'e17', sets: 3, reps: '10 each leg', restSec: 30 },
    { exerciseId: 'e5', sets: 2, reps: '15', restSec: 30 },
  ], 'Yesterday', 'This should feel comfortable. Pain above 3 out of 10 means stop and tell Hogan.'),
  s('s4', 'Morning mobility', 'Mobility', 15, 'No equipment', 1, 'Loosens hips, back and shoulders. Good on rest days.', [
    { exerciseId: 'e11', sets: 1, time: '45 sec', restSec: 10 },
    { exerciseId: 'e12', sets: 1, reps: '6 each side', restSec: 10 },
    { exerciseId: 'e13', sets: 1, time: '30 sec each side', restSec: 10 },
    { exerciseId: 'e22', sets: 1, time: '30 sec', restSec: 0 },
  ], '3 weeks ago'),
  s('s5', 'Hotel room intervals', 'Cardio', 20, 'No equipment', 3, 'A sweaty session you can do anywhere in 20 minutes.', [
    { exerciseId: 'e19', sets: 4, time: '30 sec', restSec: 30 },
    { exerciseId: 'e20', sets: 4, time: '30 sec', restSec: 30 },
    { exerciseId: 'e21', sets: 4, time: '30 sec', restSec: 30 },
  ], '1 month ago'),
  s('s6', 'Gym warm-up', 'Warm-ups', 10, 'No equipment', 1, 'Do this before any strength session.', [
    { exerciseId: 'e22', sets: 1, time: '30 sec', restSec: 0 },
    { exerciseId: 'e11', sets: 1, time: '30 sec', restSec: 0 },
    { exerciseId: 'e4', sets: 1, reps: '10', restSec: 0 },
    { exerciseId: 'e19', sets: 1, time: '45 sec', restSec: 0 },
  ], '2 months ago'),
  s('s7', 'Living room circuit', 'Home workouts', 25, 'Chair', 2, 'Full body circuit using a chair.', [
    { exerciseId: 'e14', sets: 3, reps: '12', restSec: 30 },
    { exerciseId: 'e8', sets: 3, reps: '10', restSec: 30 },
    { exerciseId: 'e4', sets: 3, reps: '12', restSec: 30 },
    { exerciseId: 'e6', sets: 3, reps: '8 each side', restSec: 30 },
  ], '3 weeks ago'),
  s('s8', 'Gentle mobility', 'Mobility', 20, 'A sturdy chair', 1, 'Keeps your joints moving and makes everyday jobs easier.', [
    { exerciseId: 'e23', sets: 1, time: '1 minute', restSec: 30 },
    { exerciseId: 'e22', sets: 1, time: '30 sec', restSec: 30 },
    { exerciseId: 'e11', sets: 1, reps: '8, seated', restSec: 30 },
    { exerciseId: 'e17', sets: 2, reps: '8 each leg', restSec: 45 },
    { exerciseId: 'e15', sets: 2, reps: '10 steps', restSec: 45, note: 'Keep one hand on the counter.' },
  ], 'Last week', 'Keep a hand on the counter for anything standing.'),
  s('s9', 'Balance basics', 'Balance', 15, 'Kitchen counter', 1, 'Steadier on your feet, step by step.', [
    { exerciseId: 'e16', sets: 2, time: '20 sec each leg', restSec: 30 },
    { exerciseId: 'e15', sets: 2, reps: '10 steps', restSec: 30 },
    { exerciseId: 'e5', sets: 2, reps: '10', restSec: 30 },
  ], 'Last week', 'Always hold the counter.'),
  s('s10', 'Sit-to-stand strength', 'Strength', 20, 'A sturdy chair', 1, 'Makes getting up from chairs and the car easier.', [
    { exerciseId: 'e23', sets: 1, time: '1 minute', restSec: 30 },
    { exerciseId: 'e14', sets: 3, reps: '8', restSec: 60 },
    { exerciseId: 'e17', sets: 2, reps: '10 each leg', restSec: 45 },
    { exerciseId: 'e5', sets: 2, reps: '10', restSec: 30 },
  ], 'Last week'),
];

const cl = (c: Omit<Client, 'businessId'>): Client => ({ ...c, businessId: 'b1' });

export const clients: Client[] = [
  cl({ id: 'c1', firstName: 'Sarah', lastName: 'Collins', initials: 'SC', contact: '07700 900123', ageGroup: 'adult', goals: 'Run a half marathon in the spring without knee pain.', conditions: 'Occasional left knee pain on lunges.', trainerNotes: 'Responds well to clear numbers. Watch the left knee.', programme: 'Strength block · week 3 of 6', easyView: false, invite: 'joined', lastActive: 'Today', daysSinceActive: 0 }),
  cl({ id: 'c2', firstName: 'Margaret', lastName: 'Ellis', initials: 'ME', contact: '07700 900456', ageGroup: 'senior', goals: 'Feel steadier on her feet and keep gardening.', conditions: 'Right knee osteoarthritis. Mild balance worries.', trainerNotes: 'Prefers voice notes. Daughter helped set up the app.', programme: 'Gentle start · week 2 of 6', easyView: true, invite: 'joined', lastActive: '12 minutes ago', daysSinceActive: 0 }),
  cl({ id: 'c3', firstName: 'Tom', lastName: 'Reid', initials: 'TR', contact: 'tom@example.com', ageGroup: 'adult', goals: 'Build upper body strength.', conditions: 'None.', trainerNotes: '', programme: 'Upper and lower split', easyView: false, invite: 'joined', lastActive: '38 minutes ago', daysSinceActive: 0 }),
  cl({ id: 'c4', firstName: 'Priya', lastName: 'Shah', initials: 'PS', contact: 'priya@example.com', ageGroup: 'adult', goals: 'Stay fit while travelling for work.', conditions: 'None.', trainerNotes: 'Away most weeks. Hotel sessions.', programme: 'Travel plan', easyView: false, invite: 'joined', lastActive: '1 hour ago', daysSinceActive: 0 }),
  cl({ id: 'c5', firstName: 'Dave', lastName: 'Morgan', initials: 'DM', contact: '07700 900789', ageGroup: 'adult', goals: 'Ease lower back stiffness.', conditions: 'Desk job, stiff back.', trainerNotes: '', programme: 'Mobility first', easyView: false, invite: 'joined', lastActive: '3 hours ago', daysSinceActive: 0 }),
  cl({ id: 'c6', firstName: 'Ben', lastName: 'Lowe', initials: 'BL', contact: 'ben@example.com', ageGroup: 'adult', goals: 'Get back into training after a new baby.', conditions: 'None.', trainerNotes: 'Busy at home. Keep sessions short.', programme: 'Strength block · week 1 of 6', easyView: false, invite: 'joined', lastActive: '9 days ago', daysSinceActive: 9 }),
  cl({ id: 'c7', firstName: 'Ruth', lastName: 'Owens', initials: 'RO', contact: '07700 900321', ageGroup: 'senior', goals: 'Keep up with the grandchildren.', conditions: 'Hip replacement two years ago.', trainerNotes: '', programme: 'Gentle start · week 4 of 6', easyView: true, invite: 'joined', lastActive: '12 days ago', daysSinceActive: 12 }),
  cl({ id: 'c8', firstName: 'Callum', lastName: 'Fry', initials: 'CF', contact: 'Parent: 07700 900654', ageGroup: 'under-18', goals: 'Pre-season fitness for football.', conditions: 'None.', trainerNotes: 'Aged 16. Parent must accept the invite.', programme: 'Football pre-season', easyView: false, invite: 'guardian-sent', lastActive: 'Not joined yet', daysSinceActive: 99 }),
  cl({ id: 'c9', firstName: 'Jo', lastName: 'Pearce', initials: 'JP', contact: 'jo@example.com', ageGroup: 'adult', goals: 'To be agreed.', conditions: 'Unknown.', trainerNotes: 'First session next week.', programme: 'No plan yet', easyView: false, invite: 'sent', lastActive: 'Not joined yet', daysSinceActive: 99 }),
];

const as = (id: string, clientId: string, sessionId: string, days: string[], extra: Partial<Assignment> = {}): Assignment => ({ id, clientId, sessionId, days, ...extra });

export const assignments: Assignment[] = [
  as('a1', 'c1', 's1', ['Thu']),
  as('a2', 'c1', 's2', ['Mon']),
  as('a3', 'c1', 's3', ['Sat'], { isNew: true }),
  as('a4', 'c1', 's4', ['Wed'], { favourite: true }),
  as('a5', 'c1', 's5', []),
  as('a6', 'c1', 's6', []),
  as('a7', 'c1', 's7', []),
  as('a8', 'c2', 's8', ['Tue', 'Thu']),
  as('a9', 'c2', 's9', ['Wed']),
  as('a10', 'c2', 's10', ['Mon', 'Fri']),
  as('a11', 'c2', 's3', []),
  as('a12', 'c3', 's2', ['Mon', 'Thu']),
  as('a13', 'c4', 's5', ['Tue', 'Thu']),
  as('a14', 'c5', 's4', ['Daily'] as string[]),
  as('a15', 'c6', 's1', ['Sat']),
  as('a16', 'c7', 's8', ['Mon', 'Wed']),
];

const log = (l: Omit<SessionLog, 'date' | 'dateLabel'> & { daysAgo: number }): SessionLog => {
  const { daysAgo: n, ...rest } = l;
  return { ...rest, date: isoDate(daysAgo(n)), dateLabel: relativeLabel(n) };
};

export const sessionLogs: SessionLog[] = [
  log({ id: 'l1', clientId: 'c1', sessionId: 's1', daysAgo: 2, minutesAgo: 2 * 1440, completedExerciseIds: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'], seenByTrainer: true,
    checkIn: { feel: 2, effort: 8, enjoyed: 'Goblet squats felt great.', hardExerciseIds: ['e3'], hardNote: 'Walking lunges hurt the left knee a bit.', pain: false } }),
  log({ id: 'l2', clientId: 'c1', sessionId: 's4', daysAgo: 1, minutesAgo: 1440, completedExerciseIds: ['e11', 'e12', 'e13', 'e22'], seenByTrainer: false }),
  log({ id: 'l3', clientId: 'c1', sessionId: 's2', daysAgo: 5, minutesAgo: 5 * 1440, completedExerciseIds: ['e8', 'e9', 'e10', 'e6'], seenByTrainer: true,
    checkIn: { feel: 4, effort: 6, enjoyed: 'Went up to 12 kg on the row.', hardExerciseIds: [], pain: false } }),
  log({ id: 'l4', clientId: 'c1', sessionId: 's1', daysAgo: 9, minutesAgo: 9 * 1440, completedExerciseIds: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'], seenByTrainer: true,
    checkIn: { feel: 3, effort: 7, hardExerciseIds: [], pain: false } }),
  log({ id: 'l5', clientId: 'c2', sessionId: 's8', daysAgo: 1, minutesAgo: 1440, completedExerciseIds: ['e23', 'e22', 'e11', 'e17', 'e15'], seenByTrainer: true,
    checkIn: { feel: 3, effort: 4, hardExerciseIds: ['e15'], pain: false, voiceNote: { length: '0:32', transcript: 'Felt a bit wobbly on the balance one but I managed it. Knees were fine.' } } }),
  log({ id: 'l6', clientId: 'c2', sessionId: 's10', daysAgo: 0, minutesAgo: 14, completedExerciseIds: ['e23', 'e14'], seenByTrainer: false,
    checkIn: { feel: 2, effort: 6, hardExerciseIds: ['e14'], pain: true, forTrainer: 'Stopped after the sit to stands.' } }),
  log({ id: 'l7', clientId: 'c3', sessionId: 's2', daysAgo: 0, minutesAgo: 38, completedExerciseIds: ['e8', 'e9', 'e10', 'e6'], seenByTrainer: false,
    checkIn: { feel: 4, effort: 7, enjoyed: 'Felt strong, went up to 14 kg on the row.', hardExerciseIds: [], pain: false } }),
  log({ id: 'l8', clientId: 'c4', sessionId: 's5', daysAgo: 0, minutesAgo: 62, completedExerciseIds: ['e19', 'e20', 'e21'], seenByTrainer: false,
    checkIn: { feel: 3, effort: 6, hardExerciseIds: ['e20'], pain: false, voiceNote: { length: '0:24', transcript: 'Did it in the hotel in Leeds. The squat thrusts were tough but fine.' } } }),
  log({ id: 'l9', clientId: 'c5', sessionId: 's4', daysAgo: 0, minutesAgo: 185, completedExerciseIds: ['e11', 'e12', 'e13', 'e22'], seenByTrainer: false,
    checkIn: { feel: 5, effort: 3, hardExerciseIds: [], pain: false } }),
];

export const painReports: PainReport[] = [
  { id: 'p1', clientId: 'c2', sessionLogId: 'l6', area: 'Knee', side: 'Right', view: 'front', severity: 6, type: 'Sharp', when: 'During Sit to stand', status: 'new', at: '12 minutes ago', minutesAgo: 12 },
];

export const diaryEntries: DiaryEntry[] = [
  { id: 'd1', clientId: 'c1', date: isoDate(daysAgo(3)), dateLabel: relativeLabel(3), text: 'Walked 5 km with the dog. Knee a bit stiff afterwards.' },
  { id: 'd2', clientId: 'c2', date: isoDate(daysAgo(2)), dateLabel: relativeLabel(2), text: 'Gardening for an hour. Back felt good.' },
];

export const replies: Reply[] = [
  { id: 'r1', targetId: 'l1', text: "Thanks Sarah. Swap lunges for step-ups this week and we'll look at it on Saturday.", at: '2 days ago' },
  { id: 'r2', targetId: 'l5', text: 'Lovely work Margaret. Hold the counter for that one and it will get steadier.', at: 'Yesterday' },
];

export const messages: Message[] = [
  { id: 'm1', clientId: 'c1', text: "Take it easy on the left knee this week. Swap the walking lunges for step-ups and we'll look at it on Saturday.", at: 'Yesterday, 6:40pm' },
  { id: 'm2', clientId: 'c2', text: 'Lovely work yesterday, Margaret. Keep one hand on the kitchen counter for the balance exercise.', at: 'Yesterday, 5:15pm' },
];
