// Design tokens for the white and blue direction (concept A, "Clean cards").
// Swap `brand` for Hogan's exact brand blue once we have it.

export const colors = {
  bg: '#F5F7FB',
  surface: '#FFFFFF',
  surface2: '#EDF1F8',
  ink: '#0F1A2E',
  muted: '#55617A',
  line: '#DCE2EC',
  brand: '#1E5BD8',
  brandInk: '#FFFFFF',
  brandSoft: '#E3ECFD',
  warn: '#9A5B00',
  warnSoft: '#FCF0DC',
  // Red is reserved for pain and safety. Never use it for anything else.
  bad: '#C0282D',
  badSoft: '#FCE5E5',
  ok: '#1F7A4D',
  okSoft: '#E1F3E9',
} as const;

// Easy view swaps in stronger outlines and darker secondary text.
export const easyColors = {
  ...colors,
  bg: '#FFFFFF',
  ink: '#07101F',
  muted: '#2E3A50',
  line: '#8C99B0',
  brand: '#1748B0',
} as const;

export type Palette = { [K in keyof typeof colors]: string };

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displayHeavy: 'BricolageGrotesque_800ExtraBold',
  body: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  heavy: 'Figtree_800ExtraBold',
} as const;

export const radius = { sm: 10, md: 16, lg: 20, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

// Minimum touch target from the spec (48 x 48 points).
export const TOUCH = 48;

// Layout breakpoints. Phone: bottom tabs. iPad: side rail. Laptop: full sidebar.
export const BREAKPOINTS = { medium: 700, wide: 1280 } as const;
