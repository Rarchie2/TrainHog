// Reads and writes the real database. The store keeps working the same way
// as the demo: it updates the screen straight away, then saves here.
import { supabase } from './backend';
import { agoLabel } from './format';
import { isoDate, relativeLabel } from './sample';
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
  PlannedSession,
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

export type Account = { userId: ID; email: string; trainer: boolean; clientId?: ID; businessId?: ID };

export type LoadedData = {
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
  planned: PlannedSession[];
};

type Row = Record<string, any>;

const minutesSince = (ts: string) => Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
const daysSince = (iso: string) => {
  const a = new Date(iso + 'T12:00:00').getTime();
  const b = new Date(isoDate(new Date()) + 'T12:00:00').getTime();
  return Math.round((b - a) / 86400000);
};
const dateLabel = (iso: string) => relativeLabel(daysSince(iso));
const initials = (f: string, l: string) => `${f[0] ?? ''}${l[0] ?? ''}`.toUpperCase();

// Links this login to its trainer invite or client record (by email).
export async function claimAccount(): Promise<Account | null> {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { error } = await supabase.rpc('claim_account');
  if (error) throw error;
  const [{ data: tr }, { data: cl }] = await Promise.all([
    supabase.from('trainers').select('business_id').eq('user_id', auth.user.id).limit(1),
    supabase.from('clients').select('id, business_id').eq('user_id', auth.user.id).limit(1),
  ]);
  return {
    userId: auth.user.id,
    email: auth.user.email ?? '',
    trainer: !!tr?.length,
    clientId: cl?.[0]?.id,
    businessId: tr?.[0]?.business_id ?? cl?.[0]?.business_id,
  };
}

async function all(table: string, order?: string): Promise<Row[]> {
  let q = supabase!.from(table).select('*');
  if (order) q = q.order(order, { ascending: false });
  const { data, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

// Everything this person may see (the database's rules do the filtering).
export async function loadAll(account: Account): Promise<LoadedData> {
  const [clients, priv, members, exercises, sessions, assignments, logs, pain, diary, replies, messages, bodyweights, lifts, weekly, posts, reactions, inPerson, planned] =
    await Promise.all([
      all('clients'),
      account.trainer ? all('client_private') : Promise.resolve([]),
      all('community_members'),
      all('exercises'),
      all('sessions'),
      all('assignments'),
      all('session_logs', 'created_at'),
      all('pain_reports', 'created_at'),
      all('diary_entries', 'created_at'),
      all('replies'),
      all('messages', 'created_at'),
      all('bodyweights'),
      all('lifts'),
      all('weekly_checkins', 'created_at'),
      all('community_posts', 'created_at'),
      all('post_reactions'),
      all('in_person'),
      all('planned_sessions'),
    ]);

  const lastLog = new Map<string, string>();
  logs.forEach((l) => {
    if (!lastLog.has(l.client_id)) lastLog.set(l.client_id, l.created_at);
  });
  const notes = new Map(priv.map((p) => [p.client_id, p.trainer_notes as string]));

  const mapClient = (c: Row): Client => {
    const last = lastLog.get(c.id);
    const mins = last ? minutesSince(last) : undefined;
    return {
      id: c.id,
      businessId: c.business_id,
      firstName: c.first_name,
      lastName: c.last_name,
      initials: initials(c.first_name, c.last_name),
      contact: c.contact || c.email || '',
      ageGroup: c.age_group,
      goals: c.goals,
      conditions: c.conditions,
      trainerNotes: notes.get(c.id) ?? '',
      programme: c.programme,
      easyView: c.easy_view,
      invite: c.invite,
      lastActive: mins === undefined ? (c.invite === 'joined' ? 'No sessions yet' : 'Not joined yet') : agoLabel(mins),
      daysSinceActive: mins === undefined ? 99 : Math.floor(mins / 1440),
      goalType: c.goal_type ?? undefined,
      planWeeks: c.plan_weeks ?? undefined,
      planStart: c.plan_start ?? undefined,
      community: c.community,
    };
  };
  const mapped = clients.map(mapClient);
  // Other clients in the community feed: first name and initials only.
  members
    .filter((m) => !mapped.some((c) => c.id === m.id))
    .forEach((m) =>
      mapped.push({ id: m.id, businessId: m.business_id, firstName: m.first_name, lastName: '', initials: m.initials, contact: '', ageGroup: 'adult', goals: '', conditions: '', trainerNotes: '', programme: '', easyView: false, invite: 'joined', lastActive: '', daysSinceActive: 0, community: true }),
    );

  const reactionMap = new Map<string, Record<string, ID[]>>();
  reactions.forEach((r) => {
    const m = reactionMap.get(r.post_id) ?? {};
    m[r.emoji] = [...(m[r.emoji] ?? []), r.client_id];
    reactionMap.set(r.post_id, m);
  });

  return {
    clients: mapped,
    exercises: exercises.map((e) => ({
      id: e.id,
      businessId: e.business_id,
      name: e.name,
      category: e.category ?? undefined,
      videoUrl: e.video_url ?? undefined,
      videoLength: e.video_length,
      coachingNotes: e.coaching_notes,
      steps: e.steps ?? [],
      easier: e.easier ?? undefined,
      harder: e.harder ?? undefined,
      tags: e.tags ?? [],
    })),
    sessions: sessions.map((s) => ({
      id: s.id,
      businessId: s.business_id,
      name: s.name,
      category: s.category,
      kind: s.kind ?? undefined,
      programme: s.programme ?? undefined,
      phase: s.phase ?? undefined,
      minutes: s.minutes,
      equipment: s.equipment,
      level: s.level,
      purpose: s.purpose,
      safetyNote: s.safety_note ?? undefined,
      exercises: s.exercises ?? [],
      updated: agoLabel(minutesSince(s.updated_at)).replace('min ago', 'minutes ago'),
    })),
    assignments: assignments.map((a) => ({
      id: a.id,
      clientId: a.client_id,
      sessionId: a.session_id,
      days: a.days ?? [],
      favourite: a.favourite,
      isNew: a.is_new,
      plan: a.plan ?? undefined,
      createdOn: a.created_at ? isoDate(new Date(a.created_at)) : undefined,
    })),
    logs: logs.map((l) => ({
      id: l.id,
      clientId: l.client_id,
      sessionId: l.session_id,
      date: l.date,
      dateLabel: dateLabel(l.date),
      completedExerciseIds: l.completed_exercise_ids ?? [],
      changes: l.changes ?? undefined,
      checkIn: l.check_in ?? undefined,
      seenByTrainer: l.seen_by_trainer,
      minutesAgo: minutesSince(l.created_at),
    })),
    pain: pain.map((p) => ({
      id: p.id,
      clientId: p.client_id,
      sessionLogId: p.session_log_id ?? undefined,
      area: p.area,
      side: p.side,
      view: p.view,
      severity: p.severity,
      type: p.type,
      when: p.when_text,
      status: p.status,
      at: agoLabel(minutesSince(p.created_at)),
      minutesAgo: minutesSince(p.created_at),
      redFlag: p.red_flag,
    })),
    diary: diary.map((d) => ({ id: d.id, clientId: d.client_id, date: d.date, dateLabel: dateLabel(d.date), text: d.text })),
    replies: replies.map((r) => ({ id: r.id, targetId: r.target_id, text: r.text, at: agoLabel(minutesSince(r.created_at)) })),
    messages: messages.map((m) => ({ id: m.id, clientId: m.client_id, text: m.text, at: agoLabel(minutesSince(m.created_at)) })),
    bodyweights: bodyweights.map((b) => ({ clientId: b.client_id, date: b.date, kg: Number(b.kg) })),
    lifts: lifts.map((l) => ({ clientId: l.client_id, exerciseId: l.exercise_id, date: l.date, kg: Number(l.kg) })),
    weekly: weekly.map((w) => ({
      id: w.id,
      clientId: w.client_id,
      date: w.date,
      dateLabel: dateLabel(w.date),
      answers: w.answers ?? [],
      seenByTrainer: w.seen_by_trainer,
      minutesAgo: minutesSince(w.created_at),
    })),
    posts: posts.map((p) => ({
      id: p.id,
      clientId: p.client_id,
      presetId: p.preset_id,
      detail: p.detail ?? undefined,
      at: agoLabel(minutesSince(p.created_at)),
      minutesAgo: minutesSince(p.created_at),
      reactions: reactionMap.get(p.id) ?? {},
    })),
    inPerson: inPerson.map((i) => ({ id: i.id, clientId: i.client_id, date: i.date, time: i.time, place: i.place })),
    planned: planned.map((x) => ({ id: x.id, clientId: x.client_id, sessionId: x.session_id, date: x.date, position: x.position ?? 0 })),
  };
}

// ---------------------------------------------------------------- writes
// Each returns a promise; the store reports any failure on screen.

const db = () => supabase!;
const ok = async (p: PromiseLike<{ error: { message: string } | null }>, what: string) => {
  const { error } = await p;
  if (error) throw new Error(`Couldn't save ${what}: ${error.message}`);
};
const exList = (x: SessionExercise[]) => x;

export const save = {
  log: (b: ID, l: SessionLog) =>
    ok(db().from('session_logs').insert({ id: l.id, business_id: b, client_id: l.clientId, session_id: l.sessionId, date: l.date, completed_exercise_ids: l.completedExerciseIds, changes: l.changes ?? null }), 'the session'),
  checkIn: (logId: ID, checkIn: CheckIn) => ok(db().from('session_logs').update({ check_in: checkIn, seen_by_trainer: false }).eq('id', logId), 'the check-in'),
  pain: (b: ID, p: PainReport) =>
    ok(
      db().from('pain_reports').insert({ id: p.id, business_id: b, client_id: p.clientId, session_log_id: p.sessionLogId ?? null, area: p.area, side: p.side, view: p.view, severity: p.severity, type: p.type, when_text: p.when, red_flag: !!p.redFlag }),
      'the pain report',
    ),
  diary: (b: ID, d: DiaryEntry) => ok(db().from('diary_entries').insert({ id: d.id, business_id: b, client_id: d.clientId, date: d.date, text: d.text }), 'the diary note'),
  logSeen: (id: ID) => ok(db().from('session_logs').update({ seen_by_trainer: true }).eq('id', id), 'seen'),
  painStatus: (id: ID, status: PainReport['status']) => ok(db().from('pain_reports').update({ status }).eq('id', id), 'seen'),
  reply: (b: ID, clientId: ID, r: Reply) => ok(db().from('replies').insert({ id: r.id, business_id: b, client_id: clientId, target_id: r.targetId, text: r.text }), 'the reply'),
  message: (b: ID, m: Message) => ok(db().from('messages').insert({ id: m.id, business_id: b, client_id: m.clientId, text: m.text }), 'the message'),
  assignment: (b: ID, a: Assignment) =>
    ok(db().from('assignments').upsert({ id: a.id, business_id: b, client_id: a.clientId, session_id: a.sessionId, days: a.days, favourite: !!a.favourite, is_new: !!a.isNew, plan: a.plan ?? null }), 'the assignment'),
  plan: (b: ID, rows: PlannedSession[]) =>
    ok(db().from('planned_sessions').insert(rows.map((x) => ({ id: x.id, business_id: b, client_id: x.clientId, session_id: x.sessionId, date: x.date, position: x.position }))), 'the calendar'),
  unplan: (id: ID) => ok(db().from('planned_sessions').delete().eq('id', id), 'the calendar'),
  unassign: (id: ID) => ok(db().from('assignments').delete().eq('id', id), 'the change'),
  session: (b: ID, s: Session) =>
    ok(
      db().from('sessions').upsert({ id: s.id, business_id: b, name: s.name, category: s.category, kind: s.kind ?? null, programme: s.programme ?? null, phase: s.phase ?? null, minutes: s.minutes, equipment: s.equipment, level: s.level, purpose: s.purpose, safety_note: s.safetyNote ?? null, exercises: exList(s.exercises), updated_at: new Date().toISOString() }),
      'the session',
    ),
  exercise: (b: ID, e: Exercise) =>
    ok(
      db().from('exercises').upsert({ id: e.id, business_id: b, name: e.name, category: e.category ?? null, video_url: e.videoUrl ?? null, video_length: e.videoLength, coaching_notes: e.coachingNotes, steps: e.steps, easier: e.easier ?? null, harder: e.harder ?? null, tags: e.tags }),
      'the exercise',
    ),
  client: async (b: ID, c: Client, email?: string) => {
    await ok(
      db().from('clients').insert({ id: c.id, business_id: b, email: email ?? null, first_name: c.firstName, last_name: c.lastName, contact: c.contact, easy_view: c.easyView, invite: 'sent', goals: c.goals, conditions: c.conditions, programme: c.programme }),
      'the client',
    );
    await ok(db().from('client_private').insert({ client_id: c.id, business_id: b, trainer_notes: c.trainerNotes }), 'the client');
  },
  clientFields: (id: ID, fields: { easy_view?: boolean; community?: boolean }) => ok(db().from('clients').update(fields).eq('id', id), 'the setting'),
  weekly: (b: ID, w: WeeklyCheckIn, answers: WeeklyAnswer[]) =>
    ok(db().from('weekly_checkins').insert({ id: w.id, business_id: b, client_id: w.clientId, date: w.date, answers }), 'the weekly check-in'),
  bodyweight: (b: ID, x: BodyweightEntry) => ok(db().from('bodyweights').upsert({ business_id: b, client_id: x.clientId, date: x.date, kg: x.kg }, { onConflict: 'client_id,date' }), 'the weigh-in'),
  weeklySeen: (id: ID) => ok(db().from('weekly_checkins').update({ seen_by_trainer: true }).eq('id', id), 'seen'),
  post: (b: ID, p: CommunityPost) => ok(db().from('community_posts').insert({ id: p.id, business_id: b, client_id: p.clientId, preset_id: p.presetId, detail: p.detail ?? null }), 'the post'),
  react: (b: ID, postId: ID, clientId: ID, emoji: string, on: boolean) =>
    on
      ? ok(db().from('post_reactions').insert({ post_id: postId, client_id: clientId, business_id: b, emoji }), 'the reaction')
      : ok(db().from('post_reactions').delete().match({ post_id: postId, client_id: clientId, emoji }), 'the reaction'),
};

export type { ExerciseChange };
