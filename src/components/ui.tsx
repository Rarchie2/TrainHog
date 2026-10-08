import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useMe, useStore } from '@/data/store';
import type { Category, Feel } from '@/data/types';
import { BREAKPOINTS, colors, easyColors, fonts, radius, TOUCH, type Palette } from '@/theme';
import { Icon, type IconName } from './Icon';

export type LayoutSize = 'compact' | 'medium' | 'wide';

export function useLayout(): { size: LayoutSize; width: number; height: number } {
  const { width, height } = useWindowDimensions();
  const size: LayoutSize = width >= BREAKPOINTS.wide ? 'wide' : width >= BREAKPOINTS.medium ? 'medium' : 'compact';
  return { size, width, height };
}

// Colours and text scale. Easy view only applies on the client side.
export function useUI(): { c: Palette; k: number; easy: boolean } {
  const { role } = useStore();
  const me = useMe();
  const easy = role === 'client' && me.easyView;
  return { c: easy ? easyColors : colors, k: easy ? 1.25 : role === 'trainer' ? 0.95 : 1, easy };
}

type TxtProps = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  color?: string;
  numberOfLines?: number;
  center?: boolean;
};

function makeText(size: number, family: string, lineHeight: number, opts: { muted?: boolean; upper?: boolean; spacing?: number; role?: 'header' } = {}) {
  return function T({ children, style, color, numberOfLines, center }: TxtProps) {
    const { c, k } = useUI();
    return (
      <Text
        accessibilityRole={opts.role}
        numberOfLines={numberOfLines}
        style={[
          {
            fontFamily: family,
            fontSize: Math.round(size * k),
            lineHeight: Math.round(size * k * lineHeight),
            color: color ?? (opts.muted ? c.muted : c.ink),
            letterSpacing: opts.spacing ?? 0,
            textTransform: opts.upper ? 'uppercase' : 'none',
            textAlign: center ? 'center' : undefined,
          },
          style,
        ]}
      >
        {children}
      </Text>
    );
  };
}

// Body text is 17pt minimum, as the spec asks.
export const Title = makeText(28, fonts.display, 1.15, { role: 'header', spacing: -0.3 });
export const H2 = makeText(21, fonts.display, 1.2, { role: 'header' });
export const H3 = makeText(18, fonts.display, 1.25, { role: 'header' });
export const Body = makeText(17, fonts.body, 1.45);
export const BodyBold = makeText(17, fonts.bold, 1.4);
export const Small = makeText(15, fonts.medium, 1.4, { muted: true });
export const Eyebrow = makeText(12.5, fonts.heavy, 1.3, { muted: true, upper: true, spacing: 1.2 });

export function Card({ children, style, tone = 'plain', onPress, label }: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'plain' | 'warn' | 'danger' | 'soft';
  onPress?: () => void;
  label?: string;
}) {
  const { c, easy } = useUI();
  const bg = tone === 'warn' ? c.warnSoft : tone === 'soft' ? c.surface2 : c.surface;
  const border = tone === 'danger' ? c.bad : tone === 'warn' || tone === 'soft' ? 'transparent' : c.line;
  const base: ViewStyle = {
    backgroundColor: bg,
    borderColor: border,
    borderWidth: tone === 'danger' || easy ? 2 : 1,
    borderRadius: radius.lg,
    padding: 18,
    gap: 12,
  };
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

type BtnVariant = 'primary' | 'ghost' | 'warn' | 'danger' | 'outline';

export function Button({ title, onPress, icon, variant = 'primary', small, full, disabled, style }: {
  title: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: BtnVariant;
  small?: boolean;
  full?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, k } = useUI();
  const bg = { primary: c.brand, ghost: c.surface2, warn: c.warn, danger: c.bad, outline: 'transparent' }[variant];
  const fg = { primary: c.brandInk, ghost: c.ink, warn: '#FFFFFF', danger: '#FFFFFF', outline: c.brand }[variant];
  const h = small ? TOUCH * k * 0.92 : 54 * k;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: Math.max(TOUCH, h),
          paddingHorizontal: small ? 16 : 22,
          borderRadius: radius.pill,
          backgroundColor: bg,
          borderWidth: variant === 'outline' ? 2 : 0,
          borderColor: c.brand,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={Math.round((small ? 18 : 20) * k)} color={fg} /> : null}
      <Text style={{ color: fg, fontFamily: fonts.bold, fontSize: Math.round((small ? 15 : 17) * k) }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress, icon, tone }: { label: string; on?: boolean; onPress?: () => void; icon?: IconName; tone?: 'danger' }) {
  const { c, k } = useUI();
  const active = on && tone === 'danger' ? c.bad : c.brand;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      style={{
        minHeight: TOUCH * k * 0.92,
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: on ? active : c.line,
        backgroundColor: on ? active : c.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {icon ? <Icon name={icon} size={18} color={on ? '#FFFFFF' : c.ink} /> : null}
      <Text style={{ fontFamily: fonts.bold, fontSize: Math.round(15 * k), color: on ? '#FFFFFF' : c.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Tag({ label, tone = 'brand', icon }: { label: string; tone?: 'brand' | 'warn' | 'danger' | 'neutral' | 'ok'; icon?: IconName }) {
  const { c, k } = useUI();
  const map = {
    brand: [c.brandSoft, c.brand],
    warn: [c.warnSoft, c.warn],
    danger: [c.badSoft, c.bad],
    neutral: [c.surface2, c.muted],
    ok: [c.okSoft, c.ok],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 }}>
      {icon ? <Icon name={icon} size={14} color={fg} /> : null}
      <Text style={{ color: fg, fontFamily: fonts.heavy, fontSize: Math.round(13 * k) }}>{label}</Text>
    </View>
  );
}

export function Avatar({ initials, size = 40, brand }: { initials: string; size?: number; brand?: boolean }) {
  const { c } = useUI();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: brand ? c.brand : c.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.heavy, fontSize: size * 0.36, color: brand ? c.brandInk : c.brand }}>{initials}</Text>
    </View>
  );
}

// The Snout barbell: a barbell whose plates are pig snouts.
export function Mark({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="TrainHog">
      <Defs>
        <LinearGradient id="markGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2A6AF0" />
          <Stop offset="1" stopColor="#123E9C" />
        </LinearGradient>
      </Defs>
      <Rect width={100} height={100} rx={23} fill="url(#markGrad)" />
      <Rect x={26} y={46} width={48} height={8} rx={4} fill="#FFFFFF" />
      <Circle cx={25} cy={50} r={15} fill="#FFFFFF" />
      <Circle cx={75} cy={50} r={15} fill="#FFFFFF" />
      {[20.5, 29.5, 70.5, 79.5].map((x) => (
        <Ellipse key={x} cx={x} cy={50} rx={2.8} ry={5.5} fill="#1E5BD8" />
      ))}
    </Svg>
  );
}

export const FEEL_LABELS = ['', 'Really hard', 'Hard', 'About right', 'Fairly easy', 'Really easy'] as const;

export function Face({ feel, size = 32, selected }: { feel: Feel; size?: number; selected?: boolean }) {
  const { c } = useUI();
  const mouth = { 1: 'M8 16.8q4-3.6 8 0', 2: 'M8.5 16.2q3.5-1.8 7 0', 3: 'M8.5 15.5h7', 4: 'M8.5 14.6q3.5 2.4 7 0', 5: 'M8 14q4 4.4 8 0' }[feel];
  const ink = selected ? c.brandInk : c.ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityLabel={FEEL_LABELS[feel]}>
      <Circle cx={12} cy={12} r={10.2} fill={selected ? c.brand : c.surface2} stroke={ink} strokeWidth={1.4} />
      <Circle cx={9} cy={10} r={1.2} fill={ink} />
      <Circle cx={15} cy={10} r={1.2} fill={ink} />
      <Path d={mouth} stroke={ink} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// Stand-in for Hogan's video thumbnail until real videos are recorded.
export function Thumb({ label, duration, height, width, compact }: { label: string; duration?: string; height?: number; width?: number | `${number}%`; compact?: boolean }) {
  const { c } = useUI();
  return (
    <View
      accessibilityLabel={`Video of Hogan demonstrating ${label}`}
      style={{ width: width ?? '100%', height: height ?? undefined, aspectRatio: height ? undefined : 16 / 9, borderRadius: compact ? 12 : 16, overflow: 'hidden', backgroundColor: c.brand }}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0B2A6B', opacity: 0.35, transform: [{ translateX: 60 }, { rotate: '18deg' }, { scale: 1.6 }] }]} />
      <Svg viewBox="0 0 80 90" style={{ position: 'absolute', right: '8%', top: '8%', height: '88%', width: '45%' }}>
        <Circle cx={46} cy={14} r={8} fill="rgba(255,255,255,0.55)" />
        <Path d="M44 24 36 50l20 6 2 26M36 50l-14 8-2 24M42 32l20 4" stroke="rgba(255,255,255,0.55)" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <View style={{ position: 'absolute', left: compact ? 8 : 12, bottom: compact ? 8 : 12, width: compact ? 30 : 42, height: compact ? 30 : 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="play" size={compact ? 16 : 20} color="#0B1A3A" />
      </View>
      {duration && !compact ? (
        <View style={{ position: 'absolute', right: 10, top: 10, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 12 }}>{duration}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function LevelBars({ level }: { level: number }) {
  const { c } = useUI();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityLabel={`Level ${level}`}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ width: 4, height: 4 + i * 3, borderRadius: 2, backgroundColor: i <= level ? c.brand : c.line }} />
        ))}
      </View>
      <Small>Level {level}</Small>
    </View>
  );
}

export function Meta({ icon, text }: { icon?: IconName; text: string }) {
  const { c } = useUI();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      {icon ? <Icon name={icon} size={17} color={c.muted} /> : null}
      <Small>{text}</Small>
    </View>
  );
}

export const CATEGORY_ICON: Record<Category, IconName> = {
  Strength: 'dumbbell',
  Mobility: 'spin',
  Cardio: 'heart',
  Rehab: 'rehab',
  'Warm-ups': 'flame',
  'Home workouts': 'home',
  Balance: 'balance',
};

export function IconBadge({ name, size = 40, tone = 'brand' }: { name: IconName; size?: number; tone?: 'brand' | 'warn' | 'danger' }) {
  const { c } = useUI();
  const [bg, fg] = tone === 'warn' ? [c.warnSoft, c.warn] : tone === 'danger' ? [c.badSoft, c.bad] : [c.brandSoft, c.brand];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={size * 0.52} color={fg} />
    </View>
  );
}

// Scrollable page body with sensible padding at each size.
export function Page({ children, maxWidth = 1240, gap = 20 }: { children: React.ReactNode; maxWidth?: number; gap?: number }) {
  const { size } = useLayout();
  const { c } = useUI();
  const pad = size === 'wide' ? 40 : size === 'medium' ? 28 : 18;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingHorizontal: pad, paddingTop: size === 'compact' ? 12 : 28, paddingBottom: 40 }}>
      <View style={{ width: '100%', maxWidth, alignSelf: 'center', gap }}>{children}</View>
    </ScrollView>
  );
}

// Lays children out in a responsive set of columns.
export function Columns({ children, cols, gap = 16 }: { children: React.ReactNode; cols: number; gap?: number }) {
  const items = React.Children.toArray(children).filter(Boolean);
  if (cols <= 1) return <View style={{ gap }}>{items}</View>;
  return (
    <View style={{ flexDirection: 'row', gap, alignItems: 'flex-start' }}>
      {Array.from({ length: cols }, (_, i) => (
        <View key={i} style={{ flex: 1, minWidth: 0, gap }}>
          {items.filter((_, j) => j % cols === i)}
        </View>
      ))}
    </View>
  );
}

// A wrapping grid where each tile has a minimum width.
export function Grid({ children, min, gap = 12 }: { children: React.ReactNode; min: number; gap?: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {React.Children.toArray(children).map((child, i) => (
        <View key={i} style={{ flexGrow: 1, flexBasis: min, minWidth: Math.min(min, 260) }}>
          {child}
        </View>
      ))}
    </View>
  );
}

export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { c } = useUI();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <H3>{title}</H3>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={{ minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 4 }}>
          <Text style={{ color: c.brand, fontFamily: fonts.bold, fontSize: 15 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Divider() {
  const { c } = useUI();
  return <View style={{ height: 1, backgroundColor: c.line }} />;
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { c } = useUI();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{ width: 56, height: 32, borderRadius: 16, backgroundColor: value ? c.brand : c.line, padding: 3, justifyContent: 'center' }}
    >
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignSelf: value ? 'flex-end' : 'flex-start' }} />
    </Pressable>
  );
}

// Fake waveform for voice notes.
export function VoiceNote({ length, transcript }: { length: string; transcript: string }) {
  const { c } = useUI();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.surface2, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 8 }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="play" size={16} color={c.brandInk} />
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 24, overflow: 'hidden' }}>
          {Array.from({ length: 40 }, (_, i) => (
            <View key={i} style={{ width: 3, borderRadius: 2, backgroundColor: c.muted, opacity: 0.55, height: 6 + Math.round(16 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45))) }} />
          ))}
        </View>
        <Text style={{ fontFamily: fonts.bold, color: c.ink, fontSize: 14, paddingRight: 8 }}>{length}</Text>
      </View>
      <Small style={{ fontStyle: 'italic' }}>"{transcript}"</Small>
    </View>
  );
}
