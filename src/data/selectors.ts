import { useMemo } from 'react';
import { DAY_NAMES, isoDate } from './sample';
import { useStore } from './store';
import type { Category, ID, Session } from './types';

export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  x.setHours(9, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - dow);
  return x;
}

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
    const todayName = DAY_NAMES[new Date().getDay()];
    const todayIso = isoDate(new Date());

    const planned = mySessions.find((x) => x.assignment.days.includes(todayName)) ?? mySessions[0];
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
        planned: mySessions.some((x) => x.assignment.days.includes(name)),
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

    return { mySessions, logs, diary, pain, messages, planned, doneToday, missingCheckIn, week, plannedThisWeek, doneThisWeek, categories, streak };
  }, [s.assignments, s.sessions, s.logs, s.diary, s.pain, s.messages, clientId]);
}
