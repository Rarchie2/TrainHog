// A trainer business's own look, built from one or two colours they choose.
// Everything else (soft tints, readable text shades) is worked out here so
// any colour stays readable.

import type { Business } from '@/data/types';
import { colors, easyColors, type Palette } from './index';

const hex = (h: string) => {
  const m = h.trim().replace('#', '');
  const v = m.length === 3 ? m.split('').map((x) => x + x).join('') : m;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
};
const toHex = (rgb: number[]) => '#' + rgb.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('').toUpperCase();
export const isHex = (h: string) => /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h.trim());

function luminance(h: string) {
  const [r, g, b] = hex(h).map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => p - q);
  return (y + 0.05) / (x + 0.05);
}
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [hex(a), hex(b)];
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
};
// Darken until it reads on white (WCAG AA for normal text).
function readableOnWhite(h: string, target = 4.5) {
  let c = h;
  for (let i = 0; i < 20 && contrast(c, '#FFFFFF') < target; i++) c = mix(c, '#000000', 0.08);
  return c;
}

export type Branding = NonNullable<Business['theme']>;

export function paletteFor(theme: Branding | undefined, easy: boolean): Palette {
  const base: Palette = easy ? { ...easyColors } : { ...colors };
  if (!theme?.brand || !isHex(theme.brand)) return base;
  const brand = toHex(hex(theme.brand));
  const ink = theme.ink && isHex(theme.ink) ? toHex(hex(theme.ink)) : base.ink;
  // Black or white on the brand colour, whichever reads better. A business
  // can prefer its own ink (e.g. JMH's black on blue) when it reads well.
  const onBrand = contrast(ink, brand) >= 4.5 ? ink : contrast('#FFFFFF', brand) >= contrast('#111111', brand) ? '#FFFFFF' : '#111111';
  const brandText = readableOnWhite(brand);
  if (easy) {
    // Easy view: stronger colour throughout.
    return { ...base, ink: theme.ink ? ink : base.ink, brand: brandText, brandText: readableOnWhite(brand, 7), brandInk: contrast('#FFFFFF', brandText) >= 4.5 ? '#FFFFFF' : '#111111', brandSoft: mix(brand, '#FFFFFF', 0.86) };
  }
  return {
    ...base,
    ink,
    brand,
    brandInk: onBrand,
    brandText,
    brandSoft: mix(brand, '#FFFFFF', 0.87),
    bg: mix(brand, '#FFFFFF', 0.95),
    surface2: mix(brand, '#FFFFFF', 0.9),
    line: mix(mix(brand, '#808080', 0.7), '#FFFFFF', 0.72),
  };
}
