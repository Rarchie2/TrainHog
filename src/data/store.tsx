// In-memory store for the demo. Everything a client does (finishing a session,
// checking in, reporting pain, writing a diary note) shows up on Hogan's side
// straight away, the way the real backend will work.
// TODO: replace with the real backend (Supabase in the spec) after Sunday.

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as seed from './sample';
import type {
  Assignment,
  CheckIn,
  Client,
  DiaryEntry,
  Exercise,
  ID,
  Message,
  PainReport,
  Reply,
  Session,
  SessionLog,
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
  };
}

export type PainInput = Omit<PainReport, 'id' | 'clientId' | 'status' | 'at' | 'minutesAgo'>;

type Actions = {
  setRole: (r: Role) => void;
  setClient: (id: ID) => void;
  setEasyView: (clientId: ID, on: boolean) => void;
  finishSession: (sessionId: ID, completedExerciseIds: ID[]) => ID;
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

  const finishSession = useCallback((sessionId: ID, completedExerciseIds: ID[]) => {
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
      reset,
    }),
    [st, setRole, setClient, setEasyView, finishSession, submitCheckIn, addDiary, markLogSeen, markPainSeen, reply, sendMessage, toggleFavourite, saveSession, assign, addClient, reset],
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
    return { exercise, session, client, repliesFor };
  }, [s.exercises, s.sessions, s.clients, s.replies]);
}

export function useMe() {
  const s = useStore();
  const me = s.clients.find((c) => c.id === s.clientId)!;
  return me;
}
