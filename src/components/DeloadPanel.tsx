import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { BodyBold, Button, Chip, Small, Tag, useUI } from '@/components/ui';
import { DELOAD_CHANGES, deloadFor, plusWeeks } from '@/data/deload';
import { useStore } from '@/data/store';
import type { Client, DeloadChange, DeloadWeek } from '@/data/types';
import { fonts, radius } from '@/theme';

const PERCENTS = [30, 40, 50];
const EVERY = [4, 5, 6];
const AHEAD_WEEKS = 26; // "repeat every N weeks" fills about six months

// The deload part of a client's calendar for one week. Hogan marks the week,
// picks what changes for this client (fewer sessions, fewer sets, lighter
// weights, or a mix), adds a note, and can move it, remove it, repeat it
// through the programme, or swap the week's sessions for lighter copies.
export function DeloadPanel({ who, monday, onMove }: { who: Client; monday: string; onMove: (weeks: number) => void }) {
  const st = useStore();
  const { c } = useUI();
  const d = deloadFor(who, monday);
  const [note, setNote] = useState(d?.note ?? '');
  const [pct, setPct] = useState(40);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    setNote(d?.note ?? '');
    setMsg(null);
  }, [monday, d?.note]);

  const line = { gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.line } as const;
  const input = { minHeight: 50, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface } as const;

  if (!d) {
    return (
      <View style={[line, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <View style={{ flex: 1 }}>
          <BodyBold>Deload week</BodyBold>
          <Small>Mark this as a lighter week for {who.firstName}. You choose what changes.</Small>
        </View>
        <Button small variant="outline" title="Mark as deload" onPress={() => st.saveDeload(who.id, { week: monday, changes: [] })} />
      </View>
    );
  }

  const update = (patch: Partial<DeloadWeek>) => st.saveDeload(who.id, { ...d, ...patch });
  const toggle = (k: DeloadChange) => {
    const changes = DELOAD_CHANGES.map((x) => x.key).filter((x) => (x === k ? !d.changes.includes(k) : d.changes.includes(x)));
    update({ changes, sessions: changes.includes('sessions') ? d.sessions : undefined });
  };
  const lighter = d.changes.includes('sets') || d.changes.includes('weight');
  const move = (n: number) => {
    const to = plusWeeks(monday, n);
    st.moveDeload(who.id, monday, to);
    onMove(n);
  };

  return (
    <View style={[line, { gap: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Tag label="Deload week" tone="warn" />
        <Small style={{ flex: 1 }}>{who.firstName} sees this on their week.</Small>
      </View>

      <View style={{ gap: 8 }}>
        <BodyBold>What changes for {who.firstName}?</BodyBold>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {DELOAD_CHANGES.map((x) => (
            <Chip key={x.key} label={x.label} on={d.changes.includes(x.key)} onPress={() => toggle(x.key)} />
          ))}
        </View>
        {d.changes.length === 0 ? <Small>Pick one or more. It's different for everyone.</Small> : null}
      </View>

      {d.changes.includes('sessions') ? (
        <View style={{ gap: 8 }}>
          <Small>How many sessions this week?</Small>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={n} label={String(n)} on={d.sessions === n} onPress={() => update({ sessions: d.sessions === n ? undefined : n })} />
            ))}
          </View>
          <Small>Take the extra sessions off their days with the cross above.</Small>
        </View>
      ) : null}

      {lighter ? (
        <View style={{ gap: 8 }}>
          <Small>
            Swap this week's sessions for lighter copies ({[d.changes.includes('sets') ? 'fewer sets' : '', d.changes.includes('weight') ? 'lighter weights' : ''].filter(Boolean).join(' and ')}). You can edit the copies after.
          </Small>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {PERCENTS.map((p) => (
              <Chip key={p} label={`${p}% less`} on={pct === p} onPress={() => setPct(p)} />
            ))}
            <Button
              small
              title="Make them lighter"
              onPress={() => {
                const n = st.lightenWeek(who.id, monday, pct, { sets: d.changes.includes('sets'), weight: d.changes.includes('weight') });
                setMsg(n ? `Swapped ${n} session${n === 1 ? '' : 's'} for lighter copies.` : 'Nothing to swap. Put sessions on dates this week first (weekly repeating ones stay as they are).');
              }}
            />
          </View>
        </View>
      ) : null}

      <View style={{ gap: 6 }}>
        <Small>Note for {who.firstName} (optional)</Small>
        <TextInput
          value={note}
          onChangeText={setNote}
          onBlur={() => note !== (d.note ?? '') && update({ note: note.trim() || undefined })}
          placeholder="e.g. Keep everything at RPE 6, no failure sets"
          placeholderTextColor={c.muted}
          multiline
          style={input}
          accessibilityLabel="Deload note"
        />
      </View>

      <View style={{ gap: 8 }}>
        <Small>Add it into the programme: also mark every</Small>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {EVERY.map((n) => (
            <Chip
              key={n}
              label={`${n} weeks`}
              onPress={() => {
                const added = st.repeatDeload(who.id, monday, n, Math.floor(AHEAD_WEEKS / n));
                setMsg(added ? `Added ${added} more deload week${added === 1 ? '' : 's'}, every ${n} weeks for about 6 months, with the same changes.` : 'Those weeks are already deload weeks.');
              }}
            />
          ))}
        </View>
      </View>

      {msg ? <Tag label={msg} tone="ok" icon="check" /> : null}

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button small variant="ghost" icon="back" title="Week before" onPress={() => move(-1)} />
        <Button small variant="ghost" title="Week after" onPress={() => move(1)} />
        <Button small variant="danger" icon="x" title="Remove deload" onPress={() => st.removeDeload(who.id, monday)} />
      </View>
    </View>
  );
}
