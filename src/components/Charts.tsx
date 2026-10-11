import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { fonts } from '@/theme';
import { Small, useUI } from './ui';

export type Point = { week: number; value: number };

// One line, one axis, plotted across the whole plan so empty weeks show
// how much of the plan is left. The latest point is emphasised.
export function PlanLine({ points, weeks, unit, height = 150 }: { points: Point[]; weeks: number; unit: string; height?: number }) {
  const { c } = useUI();
  const [w, setW] = useState(0);
  const padL = 40;
  const padR = 14;
  const padT = 14;
  const padB = 24;
  const vals = points.map((p) => p.value);
  const lo0 = Math.min(...vals);
  const hi0 = Math.max(...vals);
  const span = Math.max(hi0 - lo0, Math.max(1, hi0 * 0.04));
  const lo = lo0 - span * 0.25;
  const hi = hi0 + span * 0.25;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = height - padT - padB;
  const x = (week: number) => padL + (weeks <= 1 ? 0 : ((week - 1) / (weeks - 1)) * innerW);
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * innerH;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.week).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = points.length ? `${line} L${x(points[points.length - 1].week).toFixed(1)},${padT + innerH} L${x(points[0].week).toFixed(1)},${padT + innerH} Z` : '';
  const last = points[points.length - 1];
  const fmt = (v: number) => (Math.round(v * 10) / 10).toString();
  const ticks = [lo0, (lo0 + hi0) / 2, hi0].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height }} accessibilityLabel={`From ${fmt(points[0]?.value ?? 0)} to ${fmt(last?.value ?? 0)} ${unit} over ${points.length} weeks of ${weeks}`}>
      {w > 0 && points.length ? (
        <Svg width={w} height={height}>
          {ticks.map((t) => (
            <Line key={`g${t}`} x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke={c.line} strokeWidth={1} />
          ))}
          {ticks.map((t) => (
            <SvgText key={`t${t}`} x={padL - 6} y={y(t) + 4} fontSize={11} fill={c.muted} textAnchor="end" fontFamily={fonts.medium}>
              {fmt(t)}
            </SvgText>
          ))}
          {Array.from({ length: weeks }, (_, i) => i + 1).map((wk) => (
            <SvgText key={`w${wk}`} x={x(wk)} y={height - 6} fontSize={11} fill={wk === last.week ? c.ink : c.muted} textAnchor="middle" fontFamily={wk === last.week ? fonts.bold : fonts.medium}>
              {`W${wk}`}
            </SvgText>
          ))}
          <Path d={area} fill={c.brand} fillOpacity={0.1} />
          <Path d={line} stroke={c.brand} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {points.slice(0, -1).map((p) => (
            <Circle key={p.week} cx={x(p.week)} cy={y(p.value)} r={3} fill={c.surface} stroke={c.brand} strokeWidth={2} />
          ))}
          <Circle cx={x(last.week)} cy={y(last.value)} r={6} fill={c.brand} stroke={c.surface} strokeWidth={2} />
        </Svg>
      ) : null}
    </View>
  );
}

// Headline above a chart: latest value and the change since week 1, with
// the change judged against the client's goal.
export function ChangeLine({ first, last, unit, good }: { first: number; last: number; unit: string; good: 'up' | 'down' | 'flat' }) {
  const { c } = useUI();
  const diff = Math.round((last - first) * 10) / 10;
  const pct = first ? Math.round((diff / first) * 100) : 0;
  const onTrack = good === 'flat' ? Math.abs(diff) <= Math.max(1, first * 0.02) : good === 'up' ? diff > 0 : diff < 0;
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
      <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 26, color: c.ink, fontVariant: ['tabular-nums'] }}>
        {last}
        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: c.muted }}> {unit}</Text>
      </Text>
      <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: onTrack ? c.ok : c.warn }}>
        {sign}
        {Math.abs(diff)} {unit}
        {pct ? ` (${sign}${Math.abs(pct)}%)` : ''} {onTrack ? '· on track' : '· check in'}
      </Text>
      <Small>since week 1</Small>
    </View>
  );
}
