import { Pressable, Text, TextInput, View } from 'react-native';
import type { SessionExercise } from '@/data/types';
import { fonts, radius } from '@/theme';
import { Small, useUI } from './ui';

export function Stepper({ label, value, onChange, step = 1, min = 0, suffix = '' }: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number; suffix?: string }) {
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
          {value}
          {suffix}
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

// Sets, reps, weight, rest and the "if they're struggling" tip for one exercise.
// Used by the session builder and by the per-client numbers screen.
export function NumbersEditor({ x, onChange, name }: { x: SessionExercise; onChange: (patch: Partial<SessionExercise>) => void; name: string }) {
  const numericReps = !x.time && (x.reps === undefined || /^\d+$/.test(x.reps));
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
        <Stepper label="Sets" value={x.sets} min={1} onChange={(n) => onChange({ sets: n })} />
        {numericReps ? <Stepper label="Reps" value={Number(x.reps ?? 10)} min={1} onChange={(n) => onChange({ reps: String(n) })} /> : null}
        <Stepper label="Rest" value={x.restSec} step={15} suffix="s" onChange={(n) => onChange({ restSec: n })} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {!numericReps ? (
          x.time ? (
            <Field label="Time" value={x.time} onChange={(t) => onChange({ time: t })} placeholder="For example: 30 sec" />
          ) : (
            <Field label="Reps" value={x.reps ?? ''} onChange={(t) => onChange({ reps: t })} placeholder="For example: 8 each side" />
          )
        ) : null}
        <Field label="Weight" value={x.weight ?? ''} onChange={(t) => onChange({ weight: t || undefined })} placeholder="For example: 2 x 10 kg (blank for bodyweight)" />
      </View>
      <Field label="If they're struggling" value={x.ifStruggling ?? ''} onChange={(t) => onChange({ ifStruggling: t || undefined })} placeholder={`What to do if ${name.toLowerCase()} is too hard`} multiline />
      <Field label="Note for the client (optional)" value={x.note ?? ''} onChange={(t) => onChange({ note: t || undefined })} placeholder="For example: keep the knee over the toes" />
    </View>
  );
}
