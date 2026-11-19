// The app's data. With a Supabase project set up (src/config.ts), people sign
// in and everything loads from and saves to the database. Without one, or
// after "Try the demo", it runs on the sample data in memory.
// Either way the screen updates straight away; live saves happen after.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import { AppState } from 'react-native';
import { authRedirectUrl, signInFromLink, supabase, uuid } from './backend';
import { type Account, claimAccount, type LoadedData, loadAll, save } from './remote';
import * as seed from './sample';
import { lighterWeight } from './structure';
import type {
  Assignment,
  Business,
  CheckIn,
  Client,
  CommunityPost,
  Exercise,
  DailyGoal,
  DiaryEntry,
  ExerciseChange,
  GoalDay,
  ID,
  Message,
  PlannedSession,
  PainReport,
  Reply,
  Session,
  SessionExercise,
  SessionLog,
  WeeklyAnswer,
  WeeklyCheckIn,
} from './types';

type Role = 'client' | 'trainer';

// demo: sample data · loading: checking the sign-in · signedOut: show sign-in
// live: real data · noAccount: signed in but not a trainer or client yet
export type Mode = 'demo' | 'loading' | 'signedOut' | 'live' | 'noAccount';

type State = LoadedData & {
  mode: Mode;
  account: Account | null;
  syncError: string | null;
  role: Role;
  clientId: ID; // the client whose app is on screen
  easyOverride: Record<ID, boolean>;
  // Kept on the phone between launches.
  weeklyDoneOn: Record<ID, string>; // client -> ISO date of their last weekly check-in
  weeklyPromptSeen: Record<ID, string>; // client -> check-in week the pop-up was last shown for
};

const SAVED_KEY = 'trainhog.saved.v1';
type Saved = Pick<State, 'weeklyDoneOn' | 'weeklyPromptSeen'>;

const newId = () => uuid();

// "Upper body" -> "Upper body (2)", "Upper body (2)" -> "Upper body (3)".
function nextName(name: string, taken: string[]) {
  const base = name.replace(/\s*\((?:copy|\d+)\)$/i, '');
  let n = Number(name.match(/\((\d+)\)$/)?.[1] ?? 1) + 1;
  while (taken.includes(`${base} (${n})`)) n++;
  return `${base} (${n})`;
}

function demoData(): LoadedData {
  return {
    business: seed.business,
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
    planned: seed.planned,
    goalDays: seed.goalDays,
  };
}
const EMPTY: LoadedData = { business: null, clients: [], exercises: [], sessions: [], assignments: [], logs: [], pain: [], diary: [], replies: [], messages: [], bodyweights: [], lifts: [], weekly: [], posts: [], inPerson: [], planned: [], goalDays: [] };

function initialState(): State {
  return {
    ...(supabase ? EMPTY : demoData()),
    mode: supabase ? 'loading' : 'demo',
    account: null,
    syncError: null,
    role: 'client',
    clientId: supabase ? '' : 'c1',
    easyOverride: {},
    weeklyDoneOn: {},
    weeklyPromptSeen: {},
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
  dismissWeeklyPrompt: (weekStart: string) => void;
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
  saveSession: (session: Omit<Session, 'id' | 'businessId' | 'updated'>, assignTo: ID[], days?: string[]) => ID;
  updateSession: (id: ID, patch: Partial<Omit<Session, 'id' | 'businessId'>>) => void;
  duplicateSession: (id: ID) => ID | undefined;
  addExercise: (e: Omit<Exercise, 'id' | 'businessId' | 'videoLength' | 'steps' | 'tags'> & Partial<Pick<Exercise, 'steps' | 'tags'>>) => Exercise;
  updateExercise: (id: ID, patch: Partial<Omit<Exercise, 'id' | 'businessId'>>) => void;
  assign: (clientId: ID, sessionId: ID, days?: string[]) => void;
  setDays: (assignmentId: ID, days: string[]) => void;
  planSession: (clientId: ID, sessionId: ID, date: string) => void;
  unplan: (id: ID) => void;
  copyWeek: (clientId: ID, fromMonday: string, weeks: number) => number; // how many sessions were added
  setBranding: (theme: Business['theme'] | undefined, logo: string | undefined) => void;
  unassign: (assignmentId: ID) => void;
  setDailyGoals: (clientId: ID, goals: DailyGoal[]) => void;
  tickGoal: (clientId: ID, date: string, goalId: ID, value: boolean | boolean[]) => void;
  setDeload: (clientId: ID, monday: string, on: boolean) => void;
  makeDeload: (sessionId: ID, percent: number, opts: { sets: boolean; weight: boolean }) => ID | undefined;
  addClient: (firstName: string, lastName: string, contact: string, easyView: boolean) => void;
  updateProfile: (clientId: ID, patch: { goals: string; conditions: string; trainerNotes: string }) => void;
  reset: () => void;
  // Sign-in
  startDemo: () => void;
  sendCode: (email: string) => Promise<string | null>; // error message or null
  verifyCode: (email: string, code: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshAccount: () => void;
  clearSyncError: () => void;
};

const Ctx = createContext<(State & Actions) | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [st, set] = useState<State>(initialState);
  const ref = useRef(st);
  ref.current = st;

  // ------------------------------------------------ the few things kept on the phone
  const loaded = useRef(false);
  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<Saved>;
          set((s) => ({ ...s, weeklyDoneOn: { ...s.weeklyDoneOn, ...saved.weeklyDoneOn }, weeklyPromptSeen: { ...s.weeklyPromptSeen, ...saved.weeklyPromptSeen } }));
        }
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
      });
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    const saved: Saved = { weeklyDoneOn: st.weeklyDoneOn, weeklyPromptSeen: st.weeklyPromptSeen };
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved)).catch(() => {});
  }, [st.weeklyDoneOn, st.weeklyPromptSeen]);

  // ------------------------------------------------ live data
  const live = () => ref.current.mode === 'live' && !!ref.current.account?.businessId;
  const biz = () => ref.current.account!.businessId!;
  // Run a save in the background; show a message if it fails.
  const remote = useCallback((fn: () => Promise<unknown>) => {
    if (!live()) return;
    fn().catch((e: Error) => set((s) => ({ ...s, syncError: e.message || 'Something did not save. Check your connection.' })));
  }, []);

  const loadLive = useCallback(async (keepView = false) => {
    try {
      const account = await claimAccount();
      if (!account) return set((s) => ({ ...s, ...EMPTY, mode: 'signedOut', account: null }));
      if (!account.trainer && !account.clientId) return set((s) => ({ ...s, ...EMPTY, mode: 'noAccount', account }));
      const data = await loadAll(account);
      set((s) => {
        const ownClients = data.clients.filter((c) => c.invite === 'joined' || account.trainer);
        const keep = keepView && data.clients.some((c) => c.id === s.clientId);
        return {
          ...s,
          ...data,
          mode: 'live',
          account,
          syncError: null,
          role: keep ? s.role : account.trainer ? 'trainer' : 'client',
          clientId: keep ? s.clientId : account.clientId ?? ownClients[0]?.id ?? '',
        };
      });
    } catch (e) {
      set((s) => ({ ...s, syncError: (e as Error).message, mode: s.mode === 'loading' ? 'signedOut' : s.mode }));
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    // The sign-in email's link opens the app (trainhog://auth#access_token=…).
    const fromLink = async (url: string | null) => {
      if (!url || !/access_token=|[?&]code=|error_description=/.test(url)) return false;
      const err = await signInFromLink(url);
      if (err) set((s) => ({ ...s, syncError: err, mode: s.mode === 'loading' ? 'signedOut' : s.mode }));
      else {
        set((s) => ({ ...s, mode: 'loading' }));
        await loadLive();
      }
      return true;
    };
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      fromLink(url);
    });
    (async () => {
      if (await fromLink(await Linking.getInitialURL())) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) loadLive();
      else set((s) => (s.mode === 'loading' ? { ...s, mode: 'signedOut' } : s));
    })();
    // Pick up new check-ins and messages when the app comes back on screen.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && ref.current.mode === 'live') loadLive(true);
    });
    return () => {
      sub.remove();
      linkSub.remove();
    };
  }, [loadLive]);

  const startDemo = useCallback(() => set((s) => ({ ...s, ...demoData(), mode: 'demo', account: null, role: 'client', clientId: 'c1', syncError: null })), []);
  const sendCode = useCallback(async (email: string) => {
    if (!supabase) return 'Sign-in is not set up yet.';
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true, emailRedirectTo: authRedirectUrl() } });
    return error ? error.message : null;
  }, []);
  const verifyCode = useCallback(
    async (email: string, code: string) => {
      if (!supabase) return 'Sign-in is not set up yet.';
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
      if (error) return error.message;
      set((s) => ({ ...s, mode: 'loading' }));
      await loadLive();
      return null;
    },
    [loadLive],
  );
  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut().catch(() => {});
    set((s) => ({ ...s, ...EMPTY, mode: supabase ? 'signedOut' : 'demo', account: null, clientId: '', role: 'client' }));
  }, []);
  const refresh = useCallback(() => (ref.current.mode === 'live' ? loadLive(true) : Promise.resolve()), [loadLive]);
  const refreshAccount = useCallback(() => {
    set((s) => ({ ...s, mode: 'loading' }));
    loadLive();
  }, [loadLive]);
  const clearSyncError = useCallback(() => set((s) => ({ ...s, syncError: null })), []);

  // ------------------------------------------------ actions
  // Switching to the client app: if the client being previewed is missing
  // (e.g. a trainer who added their first client after signing in), pick one.
  const setRole = useCallback(
    (role: Role) =>
      set((s) => ({
        ...s,
        role,
        clientId: role === 'client' && !s.clients.some((c) => c.id === s.clientId) ? s.clients[0]?.id ?? s.clientId : s.clientId,
      })),
    [],
  );
  const setClient = useCallback((clientId: ID) => set((s) => ({ ...s, clientId })), []);
  const setEasyView = useCallback(
    (clientId: ID, on: boolean) => {
      set((s) => ({ ...s, clients: s.clients.map((c) => (c.id === clientId ? { ...c, easyView: on } : c)) }));
      remote(() => save.clientFields(clientId, { easy_view: on }));
    },
    [remote],
  );

  const finishSession = useCallback(
    (sessionId: ID, completedExerciseIds: ID[], changes?: ExerciseChange[]) => {
      const log: SessionLog = {
        id: newId(),
        clientId: ref.current.clientId,
        sessionId,
        date: seed.isoDate(new Date()),
        dateLabel: 'Today',
        completedExerciseIds,
        changes: changes?.length ? changes : undefined,
        seenByTrainer: false,
        minutesAgo: 0,
      };
      set((s) => ({
        ...s,
        logs: [log, ...s.logs],
        clients: s.clients.map((c) => (c.id === s.clientId ? { ...c, lastActive: 'Just now', daysSinceActive: 0 } : c)),
      }));
      remote(() => save.log(biz(), log));
      return log.id;
    },
    [remote],
  );

  const submitCheckIn = useCallback(
    (logId: ID, checkIn: CheckIn, pain?: PainInput) => {
      const log = ref.current.logs.find((l) => l.id === logId);
      const report: PainReport | undefined =
        pain && log ? { ...pain, id: newId(), clientId: log.clientId, sessionLogId: logId, status: 'new', at: 'Just now', minutesAgo: 0 } : undefined;
      set((s) => ({
        ...s,
        logs: s.logs.map((l) => (l.id === logId ? { ...l, checkIn, seenByTrainer: false, minutesAgo: 0 } : l)),
        pain: report ? [report, ...s.pain] : s.pain,
      }));
      remote(async () => {
        await save.checkIn(logId, checkIn);
        if (report) await save.pain(biz(), report);
      });
    },
    [remote],
  );

  const addDiary = useCallback(
    (text: string) => {
      const d: DiaryEntry = { id: newId(), clientId: ref.current.clientId, date: seed.isoDate(new Date()), dateLabel: 'Today', text };
      set((s) => ({ ...s, diary: [d, ...s.diary] }));
      remote(() => save.diary(biz(), d));
    },
    [remote],
  );

  const markLogSeen = useCallback(
    (logId: ID) => {
      set((s) => ({ ...s, logs: s.logs.map((l) => (l.id === logId ? { ...l, seenByTrainer: true } : l)) }));
      remote(() => save.logSeen(logId));
    },
    [remote],
  );
  const markPainSeen = useCallback(
    (painId: ID) => {
      set((s) => ({ ...s, pain: s.pain.map((p) => (p.id === painId ? { ...p, status: 'seen' } : p)) }));
      remote(() => save.painStatus(painId, 'seen'));
    },
    [remote],
  );
  const reply = useCallback(
    (targetId: ID, text: string) => {
      const s0 = ref.current;
      const log = s0.logs.find((l) => l.id === targetId);
      const pain = s0.pain.find((p) => p.id === targetId);
      const diary = s0.diary.find((d) => d.id === targetId);
      const weekly = s0.weekly.find((w) => w.id === targetId);
      const clientId = log?.clientId ?? pain?.clientId ?? diary?.clientId ?? weekly?.clientId ?? s0.clientId;
      const r: Reply = { id: newId(), targetId, text, at: 'Just now' };
      set((s) => ({
        ...s,
        replies: [...s.replies, r],
        logs: s.logs.map((l) => (l.id === targetId ? { ...l, seenByTrainer: true } : l)),
        pain: s.pain.map((p) => (p.id === targetId && p.status === 'new' ? { ...p, status: 'seen' } : p)),
      }));
      remote(async () => {
        await save.reply(biz(), clientId, r);
        if (log) await save.logSeen(targetId);
        if (pain?.status === 'new') await save.painStatus(targetId, 'seen');
      });
    },
    [remote],
  );
  const sendMessage = useCallback(
    (clientId: ID, text: string) => {
      const m: Message = { id: newId(), clientId, text, at: 'Just now' };
      set((s) => ({ ...s, messages: [m, ...s.messages] }));
      remote(() => save.message(biz(), m));
    },
    [remote],
  );

  const updateAssignment = useCallback(
    (id: ID, patch: Partial<Assignment>) => {
      const a = ref.current.assignments.find((x) => x.id === id);
      if (!a) return;
      const next = { ...a, ...patch };
      set((s) => ({ ...s, assignments: s.assignments.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
      remote(() => save.assignment(biz(), next));
    },
    [remote],
  );
  const toggleFavourite = useCallback(
    (assignmentId: ID) => {
      const a = ref.current.assignments.find((x) => x.id === assignmentId);
      if (a) updateAssignment(assignmentId, { favourite: !a.favourite });
    },
    [updateAssignment],
  );
  const saveSession = useCallback(
    (session: Omit<Session, 'id' | 'businessId' | 'updated'>, assignTo: ID[], days: string[] = []) => {
      const s1: Session = { ...session, id: newId(), businessId: ref.current.account?.businessId ?? 'b1', updated: 'Just now' };
      const added: Assignment[] = assignTo.map((clientId) => ({ id: newId(), clientId, sessionId: s1.id, days, isNew: true }));
      set((s) => ({ ...s, sessions: [...s.sessions, s1], assignments: [...s.assignments, ...added] }));
      remote(async () => {
        await save.session(biz(), s1);
        for (const a of added) await save.assignment(biz(), a);
      });
      return s1.id;
    },
    [remote],
  );
  const updateSession = useCallback(
    (id: ID, patch: Partial<Omit<Session, 'id' | 'businessId'>>) => {
      const old = ref.current.sessions.find((x) => x.id === id);
      if (!old) return;
      const next: Session = { ...old, ...patch, updated: 'Just now' };
      set((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === id ? next : x)) }));
      remote(() => save.session(biz(), next));
    },
    [remote],
  );
  // A copy to tweak, e.g. week 2 of a block. Clients aren't copied across.
  const duplicateSession = useCallback(
    (id: ID) => {
      const old = ref.current.sessions.find((x) => x.id === id);
      if (!old) return undefined;
      const copy: Session = { ...old, id: newId(), name: nextName(old.name, ref.current.sessions.map((x) => x.name)), exercises: old.exercises.map((x) => ({ ...x })), updated: 'Just now' };
      set((s) => ({ ...s, sessions: [...s.sessions, copy] }));
      remote(() => save.session(biz(), copy));
      return copy.id;
    },
    [remote],
  );
  const addExercise = useCallback(
    (input: Omit<Exercise, 'id' | 'businessId' | 'videoLength' | 'steps' | 'tags'> & Partial<Pick<Exercise, 'steps' | 'tags'>>) => {
      const e: Exercise = { steps: [], tags: [], ...input, id: newId(), businessId: ref.current.account?.businessId ?? 'b1', videoLength: '' };
      set((s) => ({ ...s, exercises: [...s.exercises, e] }));
      remote(() => save.exercise(biz(), e));
      return e;
    },
    [remote],
  );
  const updateExercise = useCallback(
    (id: ID, patch: Partial<Omit<Exercise, 'id' | 'businessId'>>) => {
      const old = ref.current.exercises.find((x) => x.id === id);
      if (!old) return;
      const next = { ...old, ...patch };
      set((s) => ({ ...s, exercises: s.exercises.map((x) => (x.id === id ? next : x)) }));
      remote(() => save.exercise(biz(), next));
    },
    [remote],
  );
  // Assigning a session the client already has just updates its days.
  const assign = useCallback(
    (clientId: ID, sessionId: ID, days: string[] = []) => {
      const existing = ref.current.assignments.find((a) => a.clientId === clientId && a.sessionId === sessionId);
      if (existing) return updateAssignment(existing.id, { days, isNew: true });
      const a: Assignment = { id: newId(), clientId, sessionId, days, isNew: true };
      set((s) => ({ ...s, assignments: [...s.assignments, a] }));
      remote(() => save.assignment(biz(), a));
    },
    [updateAssignment, remote],
  );
  // The business's own colours and logo. Empty means TrainHog's look.
  const setBranding = useCallback(
    (theme: Business['theme'] | undefined, logo: string | undefined) => {
      set((s) => ({ ...s, business: s.business ? { ...s.business, theme, logo } : s.business }));
      remote(() => save.branding(biz(), theme ?? null, logo ?? null));
    },
    [remote],
  );
  // Calendar: put a session on a date, take it off, or copy a week forward.
  const planSession = useCallback(
    (clientId: ID, sessionId: ID, date: string) => {
      const sameDay = ref.current.planned.filter((x) => x.clientId === clientId && x.date === date);
      const p: PlannedSession = { id: newId(), clientId, sessionId, date, position: sameDay.length };
      set((s) => ({ ...s, planned: [...s.planned, p] }));
      remote(() => save.plan(biz(), [p]));
    },
    [remote],
  );
  const unplan = useCallback(
    (id: ID) => {
      set((s) => ({ ...s, planned: s.planned.filter((x) => x.id !== id) }));
      remote(() => save.unplan(id));
    },
    [remote],
  );
  const copyWeek = useCallback(
    (clientId: ID, fromMonday: string, weeks: number) => {
      const start = new Date(fromMonday + 'T12:00:00');
      const inWeek = (iso: string, k: number) => {
        const d = Math.round((new Date(iso + 'T12:00:00').getTime() - start.getTime()) / 86400000);
        return d >= k * 7 && d < k * 7 + 7;
      };
      const source = ref.current.planned.filter((x) => x.clientId === clientId && inWeek(x.date, 0));
      const added: PlannedSession[] = [];
      for (let w = 1; w <= weeks; w++) {
        for (const x of source) {
          const d = new Date(x.date + 'T12:00:00');
          d.setDate(d.getDate() + 7 * w);
          const date = seed.isoDate(d);
          const taken = [...ref.current.planned, ...added].some((y) => y.clientId === clientId && y.date === date && y.sessionId === x.sessionId);
          if (!taken) added.push({ id: newId(), clientId, sessionId: x.sessionId, date, position: x.position });
        }
      }
      if (added.length) {
        set((s) => ({ ...s, planned: [...s.planned, ...added] }));
        remote(() => save.plan(biz(), added));
      }
      return added.length;
    },
    [remote],
  );
  // Daily goals: the trainer sets them per client; the client ticks them off.
  const setClientFields = useCallback((clientId: ID, patch: Partial<Client>) => set((s) => ({ ...s, clients: s.clients.map((c) => (c.id === clientId ? { ...c, ...patch } : c)) })), []);
  const setDailyGoals = useCallback(
    (clientId: ID, goals: DailyGoal[]) => {
      setClientFields(clientId, { dailyGoals: goals });
      remote(() => save.clientFields(clientId, { daily_goals: goals }));
    },
    [remote, setClientFields],
  );
  const tickGoal = useCallback(
    (clientId: ID, date: string, goalId: ID, value: boolean | boolean[]) => {
      const old = ref.current.goalDays.find((x) => x.clientId === clientId && x.date === date);
      const day: GoalDay = { clientId, date, hits: { ...(old?.hits ?? {}), [goalId]: value } };
      set((s) => ({ ...s, goalDays: [...s.goalDays.filter((x) => !(x.clientId === clientId && x.date === date)), day] }));
      remote(() => save.goalDay(biz(), day));
    },
    [remote],
  );
  // Deload weeks: the trainer marks a week; clients see it on their week.
  const setDeload = useCallback(
    (clientId: ID, monday: string, on: boolean) => {
      const was = ref.current.clients.find((c) => c.id === clientId)?.deloadWeeks ?? [];
      const weeks = on ? Array.from(new Set([...was, monday])).sort() : was.filter((w) => w !== monday);
      setClientFields(clientId, { deloadWeeks: weeks });
      remote(() => save.clientFields(clientId, { deload_weeks: weeks }));
    },
    [remote, setClientFields],
  );
  // A lighter copy of a session for a deload week, which the trainer then edits.
  const makeDeload = useCallback(
    (sessionId: ID, percent: number, opts: { sets: boolean; weight: boolean }) => {
      const old = ref.current.sessions.find((x) => x.id === sessionId);
      if (!old) return undefined;
      const keep = 1 - percent / 100;
      const base = old.name.replace(/\s*\((?:deload|\d+)\)$/i, '');
      const taken = ref.current.sessions.map((x) => x.name);
      let name = `${base} (deload)`;
      for (let n = 2; taken.includes(name); n++) name = `${base} (deload ${n})`;
      const copy: Session = {
        ...old,
        id: newId(),
        name,
        updated: 'Just now',
        exercises: old.exercises.map((x) => ({
          ...x,
          sets: opts.sets ? Math.max(1, Math.round(x.sets * keep)) : x.sets,
          weight: opts.weight && x.weight ? lighterWeight(x.weight, keep) : x.weight,
          dropSet: opts.sets ? false : x.dropSet,
        })),
      };
      set((s) => ({ ...s, sessions: [...s.sessions, copy] }));
      remote(() => save.session(biz(), copy));
      return copy.id;
    },
    [remote],
  );
  const setDays = useCallback((assignmentId: ID, days: string[]) => updateAssignment(assignmentId, { days }), [updateAssignment]);
  const setPlan = useCallback((assignmentId: ID, plan: SessionExercise[]) => updateAssignment(assignmentId, { plan, isNew: true }), [updateAssignment]);
  const unassign = useCallback(
    (assignmentId: ID) => {
      set((s) => ({ ...s, assignments: s.assignments.filter((a) => a.id !== assignmentId) }));
      remote(() => save.unassign(assignmentId));
    },
    [remote],
  );
  // The trainer writes a client's goals, injuries and conditions, and private notes.
  const updateProfile = useCallback(
    (clientId: ID, patch: { goals: string; conditions: string; trainerNotes: string }) => {
      setClientFields(clientId, patch);
      remote(() => save.clientFields(clientId, { goals: patch.goals, conditions: patch.conditions }));
      remote(() => save.trainerNotes(biz(), clientId, patch.trainerNotes));
    },
    [remote, setClientFields],
  );
  const addClient = useCallback(
    (firstName: string, lastName: string, contact: string, easyView: boolean) => {
      const email = contact.includes('@') ? contact.trim().toLowerCase() : undefined;
      const c: Client = {
        id: newId(),
        businessId: ref.current.account?.businessId ?? 'b1',
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
      };
      set((s) => ({ ...s, clients: [...s.clients, c] }));
      remote(() => save.client(biz(), c, email));
    },
    [remote],
  );
  const submitWeekly = useCallback(
    (answers: WeeklyAnswer[]) => {
      const s0 = ref.current;
      const today = seed.isoDate(new Date());
      const kg = Number(answers.find((a) => a.questionId === 'weight')?.value);
      const w: WeeklyCheckIn = { id: newId(), clientId: s0.clientId, date: today, dateLabel: 'Today', answers, seenByTrainer: false, minutesAgo: 0 };
      set((s) => ({
        ...s,
        weeklyDoneOn: { ...s.weeklyDoneOn, [s.clientId]: today },
        weekly: [w, ...s.weekly],
        bodyweights: kg > 0 ? [...s.bodyweights.filter((b) => !(b.clientId === s.clientId && b.date === today)), { clientId: s.clientId, date: today, kg }] : s.bodyweights,
      }));
      remote(async () => {
        await save.weekly(biz(), w, answers);
        if (kg > 0) await save.bodyweight(biz(), { clientId: w.clientId, date: today, kg });
      });
    },
    [remote],
  );
  const markWeeklySeen = useCallback(
    (id: ID) => {
      set((s) => ({ ...s, weekly: s.weekly.map((w) => (w.id === id ? { ...w, seenByTrainer: true } : w)) }));
      remote(() => save.weeklySeen(id));
    },
    [remote],
  );
  const dismissWeeklyPrompt = useCallback(
    (weekStart: string) => set((s) => ({ ...s, weeklyPromptSeen: { ...s.weeklyPromptSeen, [s.clientId]: weekStart } })),
    [],
  );
  const setCommunity = useCallback(
    (clientId: ID, on: boolean) => {
      set((s) => ({ ...s, clients: s.clients.map((c) => (c.id === clientId ? { ...c, community: on } : c)) }));
      remote(() => save.clientFields(clientId, { community: on }));
    },
    [remote],
  );
  const post = useCallback(
    (presetId: string, detail?: string) => {
      const p: CommunityPost = { id: newId(), clientId: ref.current.clientId, presetId, detail, at: 'Just now', minutesAgo: 0, reactions: {} };
      set((s) => ({ ...s, posts: [p, ...s.posts] }));
      remote(() => save.post(biz(), p));
    },
    [remote],
  );
  const react = useCallback(
    (postId: ID, emoji: string) => {
      const s0 = ref.current;
      const p = s0.posts.find((x) => x.id === postId);
      if (!p) return;
      const who = p.reactions[emoji] ?? [];
      const on = !who.includes(s0.clientId);
      set((s) => ({
        ...s,
        posts: s.posts.map((x) => (x.id !== postId ? x : { ...x, reactions: { ...x.reactions, [emoji]: on ? [...who, s.clientId] : who.filter((y) => y !== s.clientId) } })),
      }));
      remote(() => save.react(biz(), postId, s0.clientId, emoji, on));
    },
    [remote],
  );
  const reset = useCallback(() => set((s) => ({ ...initialState(), ...demoData(), mode: 'demo', clientId: 'c1', weeklyDoneOn: s.weeklyDoneOn, weeklyPromptSeen: s.weeklyPromptSeen })), []);

  const actions: Actions = {
    setRole, setClient, setEasyView, finishSession, submitCheckIn, addDiary, markLogSeen, markPainSeen, reply, sendMessage,
    toggleFavourite, saveSession, updateSession, duplicateSession, addExercise, updateExercise, assign, setDays, planSession, unplan, copyWeek, setBranding, unassign, setDailyGoals, tickGoal, setDeload, makeDeload, addClient, updateProfile, submitWeekly, markWeeklySeen, dismissWeeklyPrompt,
    setCommunity, post, react, setPlan, reset, startDemo, sendCode, verifyCode, signOut, refresh, refreshAccount, clearSyncError,
  };
  // Every action above is stable (useCallback), so this only changes with the data.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({ ...st, ...actions }), [st]);
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
    const exercise = (id: ID) => s.exercises.find((e) => e.id === id) ?? MISSING_EXERCISE(id);
    const session = (id: ID) => s.sessions.find((x) => x.id === id)!;
    const client = (id: ID) => s.clients.find((c) => c.id === id) ?? MISSING_CLIENT(id);
    const repliesFor = (id: ID) => s.replies.filter((r) => r.targetId === id);
    // The session as this client should do it: Hogan's per-client numbers if he set them.
    const planFor = (clientId: ID, sessionId: ID): SessionExercise[] => {
      const a = s.assignments.find((x) => x.clientId === clientId && x.sessionId === sessionId);
      return a?.plan ?? session(sessionId)?.exercises ?? [];
    };
    return { exercise, session, client, repliesFor, planFor };
  }, [s.exercises, s.sessions, s.clients, s.replies, s.assignments]);
}

// Placeholders so a deleted exercise or a client who left doesn't crash a screen.
const MISSING_EXERCISE = (id: ID): Exercise => ({ id, businessId: '', name: 'Exercise', videoLength: '', coachingNotes: '', steps: [], tags: [] });
const MISSING_CLIENT = (id: ID): Client => ({ id, businessId: '', firstName: 'Someone', lastName: '', initials: '?', contact: '', ageGroup: 'adult', goals: '', conditions: '', trainerNotes: '', programme: '', easyView: false, invite: 'joined', lastActive: '', daysSinceActive: 0 });

export function useMe() {
  const s = useStore();
  return s.clients.find((c) => c.id === s.clientId) ?? MISSING_CLIENT(s.clientId);
}
