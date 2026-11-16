import { useMemo } from 'react';
import { DAY_NAMES, isoDate } from './sample';
import { useStore } from './store';
import type { Assignment, Category, ID, Session } from './types';
import { WEEKLY_DAY } from './weekly';

export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  x.setHours(9, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - dow);
  return x;
}

// The weekly check-in "week" starts on WEEKLY_DAY (Sunday). A check-in is due
// when the client hasn't sent one since the most recent Sunday.
export function checkInWeekStart(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const target = DAY_NAMES.indexOf(WEEKLY_DAY);
  x.setDate(x.getDate() - ((x.getDay() - target + 7) % 7));
  return isoDate(x);
}

// Is this assignment on the given day? "Daily" means every day.
export const onDay = (a: Assignment, dayName: string) => a.days.includes(dayName) || a.days.includes('Daily');

// Warm-ups and mobility go first when a client has more than one session on a day.
const DAY_ORDER: Partial<Record<Category, number>> = { 'Warm-ups': 0, Mobility: 1 };
const dayRank = (c: Category) => DAY_ORDER[c] ?? 2;

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function useClientData(clientId: ID) {
  const s = useStore();
  return useMemo(() => {
    const myAssignments = s.assignments.filter((a) => a.clientId === clientId);
    const mySessions = myAssignments
      .map((a) => ({ assignment: a, session: s.sessions.find((x) => x.id === a.sessionId) as Session }))
      .filter((x) => x.session);
    const logs = s.logs.filter((l) => l.clientId === clientId).sort((a, b) => a.minutesAgo - b.minutesAgo);
    const diary = s.diary.filter((d) => d.clientId === clientId);
    const pain = s.pain.filter((p) => p.clientId === clientId);
    const messages = s.messages.filter((m) => m.clientId === clientId);
    const weekly = s.weekly.filter((w) => w.clientId === clientId).sort((a, b) => a.minutesAgo - b.minutesAgo);
    const weekStart = checkInWeekStart();
    const lastWeekly = [weekly[0]?.date, s.weeklyDoneOn[clientId]].filter(Boolean).sort().pop();
    const weeklyDue = !lastWeekly || lastWeekly < weekStart;
    // Pop up once per check-in week, only while it's due. The card on Today stays until it's done.
    const weeklyPopup = weeklyDue && s.weeklyPromptSeen[clientId] !== weekStart;
    const todayName = DAY_NAMES[new Date().getDay()];
    const todayIso = isoDate(new Date());

    // Everything planned for today, in order (e.g. mobility warm-up, then weights).
    const today = mySessions
      .filter((x) => onDay(x.assignment, todayName))
      .sort((a, b) => dayRank(a.session.category) - dayRank(b.session.category))
      .map((x) => ({ ...x, done: logs.find((l) => l.sessionId === x.session.id && l.date === todayIso) }));
    const planned = today.find((x) => !x.done) ?? today[0] ?? mySessions[0];
    const doneToday = planned ? logs.find((l) => l.sessionId === planned.session.id && l.date === todayIso) : undefined;
    const missingCheckIn = logs.find((l) => !l.checkIn);

    const monday = startOfWeek();
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = isoDate(d);
      const name = DAY_NAMES[d.getDay()];
      return {
        label: name,
        date: d.getDate(),
        iso,
        isToday: iso === todayIso,
        done: logs.some((l) => l.date === iso),
        planned: mySessions.some((x) => onDay(x.assignment, name)),
        count: mySessions.filter((x) => onDay(x.assignment, name)).length,
        note: diary.some((e) => e.date === iso),
        isPast: d < new Date(new Date().setHours(0, 0, 0, 0)),
      };
    });
    const plannedThisWeek = week.filter((d) => d.planned || d.done).length;
    const doneThisWeek = week.filter((d) => d.done).length;

    const categories = Array.from(
      mySessions.reduce((m, x) => m.set(x.session.category, (m.get(x.session.category) ?? 0) + 1), new Map<Category, number>()),
    );

    // Weeks in a row with at least one session, counting back from this week.
    let streak = 0;
    for (let w = 0; w < 12; w++) {
      const start = new Date(monday);
      start.setDate(monday.getDate() - w * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const any = logs.some((l) => {
        const d = new Date(l.date + 'T09:00:00');
        return d >= start && d < end;
      });
      if (any) streak++;
      else if (w > 0) break;
    }

    return { mySessions, logs, diary, pain, messages, weekly, weeklyDue, weeklyPopup, weekStart, today, planned, doneToday, missingCheckIn, week, plannedThisWeek, doneThisWeek, categories, streak };
  }, [s.assignments, s.sessions, s.logs, s.diary, s.pain, s.messages, s.weekly, s.weeklyDoneOn, s.weeklyPromptSeen, clientId]);
}
