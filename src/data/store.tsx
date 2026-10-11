// In-memory store for the demo. Everything a client does (finishing a session,
// checking in, reporting pain, writing a diary note) shows up on Hogan's side
// straight away, the way the real backend will work.
// TODO: replace with the real backend (Supabase in the spec) after Sunday.

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as seed from './sample';
import type {
  Assignment,
  BodyweightEntry,
  CheckIn,
  Client,
  CommunityPost,
  DiaryEntry,
  Exercise,
  ExerciseChange,
  ID,
  InPersonSession,
  LiftEntry,
  Message,
  PainReport,
  Reply,
  Session,
  SessionExercise,
  SessionLog,
  WeeklyAnswer,
  WeeklyCheckIn,
} from './types';

type Role = 'client' | 'trainer';

type State = {
  role: Role;
  clientId: ID; // the signed-in client in the demo
  easyOverride: Record<ID, boolean>;
  clients: Client[];
  exercises: Exercise[];
  sessions: Session[];
  assignments: Assignment[];
  logs: SessionLog[];
  pain: PainReport[];
  diary: DiaryEntry[];
  replies: Reply[];
  messages: Message[];
  bodyweights: BodyweightEntry[];
  lifts: LiftEntry[];
  weekly: WeeklyCheckIn[];
  posts: CommunityPost[];
  inPerson: InPersonSession[];
  weeklyPromptDismissed: boolean;
};

let counter = 100;
const newId = (p: string) => `${p}${++counter}`;

function initialState(): State {
  return {
    role: 'client',
    clientId: 'c1',
    easyOverride: {},
    clients: seed.clients,
    exercises: seed.exercises,
    sessions: seed.sessions,
    assignments: seed.assignments,
    logs: seed.sessionLogs,
    pain: seed.painReports,
    diary: seed.diaryEntries,
    replies: seed.replies,
    messages: seed.messages,
    bodyweights: seed.bodyweights,
    lifts: seed.lifts,
    weekly: seed.weeklyCheckIns,
    posts: seed.communityPosts,
    inPerson: seed.inPerson,
    weeklyPromptDismissed: false,
  };
}

export type PainInput = Omit<PainReport, 'id' | 'clientId' | 'status' | 'at' | 'minutesAgo'>;

type Actions = {
  setRole: (r: Role) => void;
  setClient: (id: ID) => void;
  setEasyView: (clientId: ID, on: boolean) => void;
  finishSession: (sessionId: ID, completedExerciseIds: ID[], changes?: ExerciseChange[]) => ID;
  submitWeekly: (answers: WeeklyAnswer[]) => void;
  markWeeklySeen: (id: ID) => void;
  dismissWeeklyPrompt: () => void;
  setCommunity: (clientId: ID, on: boolean) => void;
  post: (presetId: string, detail?: string) => void;
  react: (postId: ID, emoji: string) => void;
  setPlan: (assignmentId: ID, plan: SessionExercise[]) => void;
  submitCheckIn: (logId: ID, checkIn: CheckIn, pain?: PainInput) => void;
  addDiary: (text: string) => void;
  markLogSeen: (logId: ID) => void;
  markPainSeen: (painId: ID) => void;
  reply: (targetId: ID, text: string) => void;
  sendMessage: (clientId: ID, text: string) => void;
  toggleFavourite: (assignmentId: ID) => void;
  saveSession: (session: Omit<Session, 'id' | 'businessId' | 'updated'>, assignTo: ID[]) => ID;
  assign: (clientId: ID, sessionId: ID) => void;
  addClient: (firstName: string, lastName: string, contact: string, easyView: boolean) => void;
  reset: () => void;
};

const Ctx = createContext<(State & Actions) | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [st, set] = useState<State>(initialState);

  const setRole = useCallback((role: Role) => set((s) => ({ ...s, role })), []);
  const setClient = useCallback((clientId: ID) => set((s) => ({ ...s, clientId })), []);
  const setEasyView = useCallback(
    (clientId: ID, on: boolean) =>
      set((s) => ({ ...s, clients: s.clients.map((c) => (c.id === clientId ? { ...c, easyView: on } : c)) })),
    [],
  );

  const finishSession = useCallback((sessionId: ID, completedExerciseIds: ID[], changes?: ExerciseChange[]) => {
    const id = newId('l');
    set((s) => ({
      ...s,
      logs: [
        {
          id,
          clientId: s.clientId,
          sessionId,
          date: seed.isoDate(new Date()),
          dateLabel: 'Today',
          completedExerciseIds,
          changes: changes?.length ? changes : undefined,
          seenByTrainer: false,
          minutesAgo: 0,
        },
        ...s.logs,
      ],
      clients: s.clients.map((c) => (c.id === s.clientId ? { ...c, lastActive: 'Just now', daysSinceActive: 0 } : c)),
    }));
    return id;
  }, []);

  const submitCheckIn = useCallback((logId: ID, checkIn: CheckIn, pain?: PainInput) => {
    set((s) => {
      const log = s.logs.find((l) => l.id === logId);
      const next: State = {
        ...s,
        logs: s.logs.map((l) => (l.id === logId ? { ...l, checkIn, seenByTrainer: false, minutesAgo: 0 } : l)),
      };
      if (pain && log) {
        next.pain = [
          { ...pain, id: newId('p'), clientId: log.clientId, sessionLogId: logId, status: 'new', at: 'Just now', minutesAgo: 0 },
          ...s.pain,
        ];
      }
      return next;
    });
  }, []);

  const addDiary = useCallback(
    (text: string) =>
      set((s) => ({
        ...s,
        diary: [{ id: newId('d'), clientId: s.clientId, date: seed.isoDate(new Date()), dateLabel: 'Today', text }, ...s.diary],
      })),
    [],
  );

  const markLogSeen = useCallback(
    (logId: ID) => set((s) => ({ ...s, logs: s.logs.map((l) => (l.id === logId ? { ...l, seenByTrainer: true } : l)) })),
    [],
  );
  const markPainSeen = useCallback(
    (painId: ID) => set((s) => ({ ...s, pain: s.pain.map((p) => (p.id === painId ? { ...p, status: 'seen' } : p)) })),
    [],
  );
  const reply = useCallback(
    (targetId: ID, text: string) =>
      set((s) => ({
        ...s,
        replies: [...s.replies, { id: newId('r'), targetId, text, at: 'Just now' }],
        logs: s.logs.map((l) => (l.id === targetId ? { ...l, seenByTrainer: true } : l)),
        pain: s.pain.map((p) => (p.id === targetId && p.status === 'new' ? { ...p, status: 'seen' } : p)),
      })),
    [],
  );
  const sendMessage = useCallback(
    (clientId: ID, text: string) =>
      set((s) => ({ ...s, messages: [{ id: newId('m'), clientId, text, at: 'Just now' }, ...s.messages] })),
    [],
  );
  const toggleFavourite = useCallback(
    (assignmentId: ID) =>
      set((s) => ({
        ...s,
        assignments: s.assignments.map((a) => (a.id === assignmentId ? { ...a, favourite: !a.favourite } : a)),
      })),
    [],
  );
  const saveSession = useCallback((session: Omit<Session, 'id' | 'businessId' | 'updated'>, assignTo: ID[]) => {
    const id = newId('s');
    set((s) => ({
      ...s,
      sessions: [...s.sessions, { ...session, id, businessId: 'b1', updated: 'Just now' }],
      assignments: [
        ...s.assignments,
        ...assignTo.map((clientId) => ({ id: newId('a'), clientId, sessionId: id, days: [], isNew: true })),
      ],
    }));
    return id;
  }, []);
  const assign = useCallback(
    (clientId: ID, sessionId: ID) =>
      set((s) =>
        s.assignments.some((a) => a.clientId === clientId && a.sessionId === sessionId)
          ? s
          : { ...s, assignments: [...s.assignments, { id: newId('a'), clientId, sessionId, days: [], isNew: true }] },
      ),
    [],
  );
  const addClient = useCallback(
    (firstName: string, lastName: string, contact: string, easyView: boolean) =>
      set((s) => ({
        ...s,
        clients: [
          ...s.clients,
          {
            id: newId('c'),
            businessId: 'b1',
            firstName,
            lastName,
            initials: `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase(),
            contact,
            ageGroup: 'adult',
            goals: 'To be agreed.',
            conditions: 'Not recorded yet.',
            trainerNotes: '',
            programme: 'No plan yet',
            easyView,
            invite: 'sent',
            lastActive: 'Not joined yet',
            daysSinceActive: 99,
          },
        ],
      })),
    [],
  );
  const submitWeekly = useCallback(
    (answers: WeeklyAnswer[]) =>
      set((s) => {
        const today = seed.isoDate(new Date());
        const kg = Number(answers.find((a) => a.questionId === 'weight')?.value);
        return {
          ...s,
          weeklyPromptDismissed: true,
          weekly: [{ id: newId('w'), clientId: s.clientId, date: today, dateLabel: 'Today', answers, seenByTrainer: false, minutesAgo: 0 }, ...s.weekly],
          bodyweights: kg > 0 ? [...s.bodyweights.filter((b) => !(b.clientId === s.clientId && b.date === today)), { clientId: s.clientId, date: today, kg }] : s.bodyweights,
        };
      }),
    [],
  );
  const markWeeklySeen = useCallback(
    (id: ID) => set((s) => ({ ...s, weekly: s.weekly.map((w) => (w.id === id ? { ...w, seenByTrainer: true } : w)) })),
    [],
  );
  const dismissWeeklyPrompt = useCallback(() => set((s) => ({ ...s, weeklyPromptDismissed: true })), []);
  const setCommunity = useCallback(
    (clientId: ID, on: boolean) => set((s) => ({ ...s, clients: s.clients.map((c) => (c.id === clientId ? { ...c, community: on } : c)) })),
    [],
  );
  const post = useCallback(
    (presetId: string, detail?: string) =>
      set((s) => ({
        ...s,
        posts: [{ id: newId('cp'), clientId: s.clientId, presetId, detail, at: 'Just now', minutesAgo: 0, reactions: {} }, ...s.posts],
      })),
    [],
  );
  const react = useCallback(
    (postId: ID, emoji: string) =>
      set((s) => ({
        ...s,
        posts: s.posts.map((p) => {
          if (p.id !== postId) return p;
          const who = p.reactions[emoji] ?? [];
          const next = who.includes(s.clientId) ? who.filter((x) => x !== s.clientId) : [...who, s.clientId];
          return { ...p, reactions: { ...p.reactions, [emoji]: next } };
        }),
      })),
    [],
  );
  const setPlan = useCallback(
    (assignmentId: ID, plan: SessionExercise[]) =>
      set((s) => ({ ...s, assignments: s.assignments.map((a) => (a.id === assignmentId ? { ...a, plan, isNew: true } : a)) })),
    [],
  );
  const reset = useCallback(() => set(initialState()), []);

  const value = useMemo(
    () => ({
      ...st,
      setRole,
      setClient,
      setEasyView,
      finishSession,
      submitCheckIn,
      addDiary,
      markLogSeen,
      markPainSeen,
      reply,
      sendMessage,
      toggleFavourite,
      saveSession,
      assign,
      addClient,
      submitWeekly,
      markWeeklySeen,
      dismissWeeklyPrompt,
      setCommunity,
      post,
      react,
      setPlan,
      reset,
    }),
    [st, setRole, setClient, setEasyView, finishSession, submitCheckIn, addDiary, markLogSeen, markPainSeen, reply, sendMessage, toggleFavourite, saveSession, assign, addClient, submitWeekly, markWeeklySeen, dismissWeeklyPrompt, setCommunity, post, react, setPlan, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}

// Handy lookups
export function useLookups() {
  const s = useStore();
  return useMemo(() => {
    const exercise = (id: ID) => s.exercises.find((e) => e.id === id)!;
    const session = (id: ID) => s.sessions.find((x) => x.id === id)!;
    const client = (id: ID) => s.clients.find((c) => c.id === id)!;
    const repliesFor = (id: ID) => s.replies.filter((r) => r.targetId === id);
    // The session as this client should do it: Hogan's per-client numbers if he set them.
    const planFor = (clientId: ID, sessionId: ID): SessionExercise[] => {
      const a = s.assignments.find((x) => x.clientId === clientId && x.sessionId === sessionId);
      return a?.plan ?? session(sessionId)?.exercises ?? [];
    };
    return { exercise, session, client, repliesFor, planFor };
  }, [s.exercises, s.sessions, s.clients, s.replies, s.assignments]);
}

export function useMe() {
  const s = useStore();
  const me = s.clients.find((c) => c.id === s.clientId)!;
  return me;
}
