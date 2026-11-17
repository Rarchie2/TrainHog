import { Pressable, Text, TextInput, View } from 'react-native';
import { holdSeconds } from '@/data/format';
import type { SessionExercise } from '@/data/types';
import { fonts, radius } from '@/theme';
import { Chip, Small, useUI } from './ui';

export function Stepper({ label, value, onChange, step = 1, min = 0, suffix = '', display }: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number; suffix?: string; display?: string }) {
  const { c } = useUI();
  const btn = (txt: string, d: number) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`${txt === '+' ? 'More' : 'Less'} ${label}`} onPress={() => onChange(Math.max(min, value + d))} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.heavy, fontSize: 18, color: c.ink }}>{txt}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 4 }}>
      <Small>{label}</Small>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {btn('−', -step)}
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: c.ink, minWidth: 54, textAlign: 'center' }}>
          {display ?? `${value}${suffix}`}
        </Text>
        {btn('+', step)}
      </View>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (t: string) => void; placeholder: string; multiline?: boolean }) {
  const { c } = useUI();
  return (
    <View style={{ gap: 4, flex: 1, minWidth: 200 }}>
      <Small>{label}</Small>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        multiline={multiline}
        accessibilityLabel={label}
        style={{ minHeight: multiline ? 70 : 50, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: multiline ? 10 : 0, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface, textAlignVertical: multiline ? 'top' : 'center' }}
      />
    </View>
  );
}

// Sets, reps, weight, tempo, effort, rest and the "if they're struggling" tip
// for one exercise. Used by the session builder and the per-client numbers screen.
// `restNote` replaces the rest control when rest doesn't apply (part-way
// through a superset or circuit).
export function NumbersEditor({ x, onChange, name, restNote }: { x: SessionExercise; onChange: (patch: Partial<SessionExercise>) => void; name: string; restNote?: string }) {
  const timed = x.time !== undefined;
  const numericReps = !timed && (x.reps === undefined || /^\d+$/.test(x.reps));
  const secs = timed ? holdSeconds(x) : undefined;
  // "Each side" applies to both reps and holds, e.g. "30 sec each side".
  const timeExtra = timed && secs !== undefined ? x.time!.replace(/^\d+\s*\w+\s*/, '') : '';
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Small>Count in</Small>
        <Chip label="Reps" on={!timed} onPress={() => onChange({ reps: '10', time: undefined })} />
        <Chip label="Seconds (holds)" on={timed} onPress={() => onChange({ time: '30 sec', reps: undefined })} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
        <Stepper label="Sets" value={x.sets} min={1} onChange={(n) => onChange({ sets: n })} />
        {numericReps ? <Stepper label="Reps" value={Number(x.reps ?? 10)} min={1} onChange={(n) => onChange({ reps: String(n) })} /> : null}
        {timed && secs !== undefined ? <Stepper label="Hold" value={secs} min={5} step={5} suffix="s" onChange={(n) => onChange({ time: `${n} sec${timeExtra ? ` ${timeExtra}` : ''}` })} /> : null}
        {restNote ? null : <Stepper label="Rest" value={x.restSec} step={15} suffix="s" onChange={(n) => onChange({ restSec: n })} />}
        <Stepper label={x.effortScale ?? 'RPE'} value={x.effort ?? 0} display={x.effort ? String(x.effort) : 'Off'} onChange={(n) => onChange({ effort: n ? Math.min(10, n) : undefined })} />
      </View>
      {restNote ? <Small>{restNote}</Small> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Small>Effort scale</Small>
        <Chip label="RPE" on={(x.effortScale ?? 'RPE') === 'RPE'} onPress={() => onChange({ effortScale: 'RPE' })} />
        <Chip label="RIR" on={x.effortScale === 'RIR'} onPress={() => onChange({ effortScale: 'RIR' })} />
        <Chip label="Drop set" on={!!x.dropSet} onPress={() => onChange({ dropSet: x.dropSet ? undefined : true })} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {!numericReps ? (
          timed ? (
            <Field label="Time" value={x.time ?? ''} onChange={(t) => onChange({ time: t })} placeholder="For example: 30 sec each side" />
          ) : (
            <Field label="Reps" value={x.reps ?? ''} onChange={(t) => onChange({ reps: t })} placeholder="For example: 8 each side" />
          )
        ) : null}
        <Field label="Weight" value={x.weight ?? ''} onChange={(t) => onChange({ weight: t || undefined })} placeholder="For example: 2 x 10 kg (blank for bodyweight)" />
        <Field label="Tempo (optional)" value={x.tempo ?? ''} onChange={(t) => onChange({ tempo: t || undefined })} placeholder="For example: 3-1-1-0 (3 seconds down)" />
      </View>
      <Field label="If they're struggling" value={x.ifStruggling ?? ''} onChange={(t) => onChange({ ifStruggling: t || undefined })} placeholder={`What to do if ${name.toLowerCase()} is too hard`} multiline />
      <Field label="Note for the client (optional)" value={x.note ?? ''} onChange={(t) => onChange({ note: t || undefined })} placeholder="For example: keep the knee over the toes" />
    </View>
  );
}
