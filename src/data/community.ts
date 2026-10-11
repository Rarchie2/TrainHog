// Community posts are picked from these presets, so nobody has to write
// anything and nothing personal goes up by accident.

export type Preset = { id: string; emoji: string; text: string; needs?: 'session' | 'kg' | 'weeks' };

export const PRESETS: Preset[] = [
  { id: 'smashed', emoji: '💪', text: 'Smashed my session', needs: 'session' },
  { id: 'checkin', emoji: '✅', text: 'Checked in with Hogan' },
  { id: 'pb', emoji: '🏆', text: 'New personal best' },
  { id: 'lost', emoji: '📉', text: 'Down', needs: 'kg' },
  { id: 'streak', emoji: '🔥', text: 'weeks in a row', needs: 'weeks' },
  { id: 'early', emoji: '🌅', text: 'Early morning session done' },
  { id: 'tough', emoji: '😅', text: 'That one was tough, but done' },
  { id: 'rest', emoji: '😴', text: 'Rest day, back at it tomorrow' },
];

export const REACTIONS = ['👏', '🔥', '💪', '🙌'];

export function presetLine(presetId: string, detail?: string) {
  const p = PRESETS.find((x) => x.id === presetId);
  if (!p) return '';
  if (p.needs === 'kg') return `${p.text} ${detail ?? ''}`.trim();
  if (p.needs === 'weeks') return `${detail ?? ''} ${p.text}`.trim();
  if (p.needs === 'session' && detail) return `${p.text}: ${detail}`;
  return p.text;
}
