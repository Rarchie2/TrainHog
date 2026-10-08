import { Pressable, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useUI } from './ui';

// Body areas and where they sit on a 120 x 260 outline (front view; the
// client's right is the viewer's left). Back-only areas use the same grid.
export const AREAS: { name: string; x: number; y: number; view: 'front' | 'back' | 'both'; paired: boolean }[] = [
  { name: 'Neck', x: 60, y: 44, view: 'both', paired: false },
  { name: 'Shoulder', x: 30, y: 60, view: 'both', paired: true },
  { name: 'Chest', x: 60, y: 76, view: 'front', paired: false },
  { name: 'Upper back', x: 60, y: 76, view: 'back', paired: false },
  { name: 'Elbow', x: 18, y: 104, view: 'both', paired: true },
  { name: 'Lower back', x: 60, y: 118, view: 'back', paired: false },
  { name: 'Stomach', x: 60, y: 112, view: 'front', paired: false },
  { name: 'Wrist or hand', x: 12, y: 140, view: 'both', paired: true },
  { name: 'Hip', x: 44, y: 140, view: 'both', paired: true },
  { name: 'Thigh', x: 46, y: 168, view: 'both', paired: true },
  { name: 'Knee', x: 46, y: 196, view: 'both', paired: true },
  { name: 'Calf or shin', x: 46, y: 222, view: 'both', paired: true },
  { name: 'Ankle or foot', x: 46, y: 248, view: 'both', paired: true },
];

export function areaPoint(name: string, side: string) {
  const a = AREAS.find((x) => x.name === name);
  if (!a) return null;
  // Mirror for the client's left side (viewer's right).
  const x = a.paired && side === 'Left' ? 120 - a.x : a.x;
  return { x, y: a.y, both: a.paired && side === 'Both' ? 120 - a.x : null };
}

export function BodyOutline({ area, side, height = 260, onPick, view = 'front' }: {
  area?: string;
  side?: string;
  height?: number;
  view?: 'front' | 'back';
  onPick?: (area: string, side: 'Left' | 'Right' | 'Middle') => void;
}) {
  const { c } = useUI();
  const pt = area ? areaPoint(area, side ?? 'Right') : null;
  const w = (height * 120) / 270;
  const outline = { fill: c.surface2, stroke: c.muted, strokeWidth: 1.4 };
  return (
    <View style={{ width: w, height }}>
      <Svg width={w} height={height} viewBox="0 0 120 270" accessibilityLabel={area ? `${side ?? ''} ${area} marked` : 'Body outline'}>
        <Circle cx={60} cy={20} r={15} {...outline} />
        <Rect x={54} y={34} width={12} height={10} {...outline} />
        <Rect x={32} y={44} width={56} height={92} rx={18} {...outline} />
        <Rect x={14} y={50} width={15} height={92} rx={7.5} {...outline} />
        <Rect x={91} y={50} width={15} height={92} rx={7.5} {...outline} />
        <Rect x={36} y={130} width={21} height={128} rx={10} {...outline} />
        <Rect x={63} y={130} width={21} height={128} rx={10} {...outline} />
        {pt ? (
          <>
            <Circle cx={pt.x} cy={pt.y} r={13} fill={c.bad} opacity={0.22} />
            <Circle cx={pt.x} cy={pt.y} r={6} fill={c.bad} />
            {pt.both !== null ? (
              <>
                <Circle cx={pt.both} cy={pt.y} r={13} fill={c.bad} opacity={0.22} />
                <Circle cx={pt.both} cy={pt.y} r={6} fill={c.bad} />
              </>
            ) : null}
          </>
        ) : null}
      </Svg>
      {onPick
        ? AREAS.filter((a) => a.view === 'both' || a.view === view).flatMap((a) =>
            (a.paired ? (['Right', 'Left'] as const) : (['Middle'] as const)).map((sd) => {
              const x = a.paired && sd === 'Left' ? 120 - a.x : a.x;
              const s = height / 270;
              return (
                <Pressable
                  key={a.name + sd}
                  accessibilityRole="button"
                  accessibilityLabel={`${sd === 'Middle' ? '' : sd + ' '}${a.name}`}
                  onPress={() => onPick(a.name, sd)}
                  style={{ position: 'absolute', left: x * s - 16, top: a.y * s - 16, width: 32, height: 32, borderRadius: 16 }}
                />
              );
            }),
          )
        : null}
    </View>
  );
}
