// Records follow the data model in the spec. Every record belongs to a trainer
// business so more PTs can be added later without a rebuild.

export type ID = string;

export type Business = {
  id: ID;
  name: string;
  trainerName: string;
  town: string;
  brandColor: string;
};

export type Category =
  | 'Strength'
  | 'Mobility'
  | 'Cardio'
  | 'Rehab'
  | 'Warm-ups'
  | 'Home workouts'
  | 'Balance';

export type Client = {
  id: ID;
  businessId: ID;
  firstName: string;
  lastName: string;
  initials: string;
  contact: string;
  ageGroup: 'under-18' | 'adult' | 'senior';
  goals: string;
  conditions: string;
  trainerNotes: string;
  programme: string;
  easyView: boolean;
  invite: 'joined' | 'sent' | 'guardian-sent' | 'paused';
  lastActive: string; // human readable for the demo
  daysSinceActive: number;
};

export type Exercise = {
  id: ID;
  businessId: ID;
  name: string;
  videoLength: string; // e.g. "0:18"
  coachingNotes: string;
  steps: string[];
  easier?: string;
  harder?: string;
  tags: string[];
};

export type SessionExercise = {
  exerciseId: ID;
  sets: number;
  reps?: string; // "10" or "8 each side"
  time?: string; // "30 sec"
  weight?: string;
  restSec: number;
  note?: string;
};

export type Session = {
  id: ID;
  businessId: ID;
  name: string;
  category: Category;
  minutes: number;
  equipment: string;
  level: 1 | 2 | 3;
  purpose: string;
  safetyNote?: string;
  exercises: SessionExercise[];
  updated: string;
};

export type Assignment = {
  id: ID;
  clientId: ID;
  sessionId: ID;
  days: string[]; // e.g. ["Thu", "Sat"]
  favourite?: boolean;
  isNew?: boolean;
};

export type Feel = 1 | 2 | 3 | 4 | 5; // Really hard ... Really easy

export type PainReport = {
  id: ID;
  clientId: ID;
  sessionLogId?: ID;
  area: string;
  side: 'Left' | 'Right' | 'Both' | 'Middle';
  view: 'front' | 'back';
  severity: number; // 0 to 10
  type: 'Sharp' | 'Dull ache' | 'Pulling' | 'Swelling' | 'Not sure';
  when: string;
  status: 'new' | 'seen' | 'resolved';
  at: string;
  minutesAgo: number;
  redFlag?: boolean;
};

export type CheckIn = {
  feel: Feel;
  effort: number; // 1 to 10 (RPE)
  enjoyed?: string;
  hardExerciseIds: ID[];
  hardNote?: string;
  pain: boolean;
  forTrainer?: string;
  voiceNote?: { length: string; transcript: string };
};

export type SessionLog = {
  id: ID;
  clientId: ID;
  sessionId: ID;
  date: string; // ISO date
  dateLabel: string;
  completedExerciseIds: ID[];
  checkIn?: CheckIn;
  seenByTrainer: boolean;
  minutesAgo: number;
};

export type DiaryEntry = {
  id: ID;
  clientId: ID;
  date: string;
  dateLabel: string;
  text: string;
};

export type Reply = {
  id: ID;
  targetId: ID; // a session log, pain report or diary entry
  text: string;
  at: string;
};

export type Message = {
  id: ID;
  clientId: ID;
  text: string;
  at: string;
};
