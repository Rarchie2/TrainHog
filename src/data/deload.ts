// Deload weeks: a lighter week Hogan marks on a client's calendar. What
// changes is up to him per client and per week: fewer sessions, fewer sets,
// lighter weights, or a mix, plus an optional note for the client.
import type { Client, DeloadChange, DeloadWeek } from './types';

export const DELOAD_CHANGES: { key: DeloadChange; label: string }[] = [
  { key: 'sessions', label: 'Fewer sessions' },
  { key: 'sets', label: 'Fewer sets' },
  { key: 'weight', label: 'Lighter weights' },
];

const ISO = /^\d{4}-\d{2}-\d{2}$/;

// Saved weeks from the database. Early versions saved just the Monday as a
// string; those read as a deload with nothing chosen yet.
export function readDeloads(raw: unknown): DeloadWeek[] {
  if (!Array.isArray(raw)) return [];
  const out: DeloadWeek[] = [];
  for (const x of raw) {
    if (typeof x === 'string' && ISO.test(x)) out.push({ week: x, changes: [] });
    else if (x && typeof x === 'object' && typeof (x as DeloadWeek).week === 'string' && ISO.test((x as DeloadWeek).week)) {
      const d = x as DeloadWeek;
      const changes = (Array.isArray(d.changes) ? d.changes : []).filter((c): c is DeloadChange => c === 'sessions' || c === 'sets' || c === 'weight');
      const sessions = typeof d.sessions === 'number' && d.sessions >= 0 ? Math.round(d.sessions) : undefined;
      const note = typeof d.note === 'string' && d.note.trim() ? d.note : undefined;
      out.push({ week: d.week, changes, ...(sessions !== undefined ? { sessions } : {}), ...(note ? { note } : {}) });
    }
  }
  // One entry per week, the last one wins, in date order.
  return Array.from(new Map(out.map((d) => [d.week, d])).values()).sort((a, b) => a.week.localeCompare(b.week));
}

export function deloadFor(client: Pick<Client, 'deloadWeeks'> | undefined, monday: string): DeloadWeek | undefined {
  return client?.deloadWeeks?.find((d) => d.week === monday);
}

// Plain lines for the client: "2 sessions this week", "Fewer sets", ...
export function deloadLines(d: DeloadWeek): string[] {
  const lines: string[] = [];
  if (d.changes.includes('sessions')) lines.push(d.sessions !== undefined ? `${d.sessions} session${d.sessions === 1 ? '' : 's'} this week` : 'Fewer sessions this week');
  if (d.changes.includes('sets')) lines.push('Fewer sets');
  if (d.changes.includes('weight')) lines.push('Lighter weights');
  return lines;
}

// Short summary for the trainer's week strip, e.g. "Sets · Weights".
export function deloadShort(d: DeloadWeek): string {
  const words = { sessions: 'Sessions', sets: 'Sets', weight: 'Weights' } as const;
  return d.changes.length ? d.changes.map((c) => words[c]).join(' · ') : 'Deload';
}

export function plusWeeks(monday: string, n: number): string {
  const d = new Date(monday + 'T12:00:00');
  d.setDate(d.getDate() + 7 * n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// A session that is already a deload copy, so it isn't lightened twice.
export const isDeloadCopy = (name: string) => /\(deload(?: \d+)?\)$/i.test(name.trim());
