// Design tokens in JMH Fitness colours: Jamie's blue (#009FE3) and black
// (#1D1D1B), on a mix of white and light blue backgrounds.
//   brand     the blue for buttons, bars and badges (black text on top)
//   brandText a deeper shade of the same blue for text and icons on white,
//             because #009FE3 is too light to read as text

export const colors = {
  bg: '#F2F8FC',
  surface: '#FFFFFF',
  surface2: '#E8F2F8',
  ink: '#1D1D1B',
  muted: '#575B61',
  line: '#D9E4EB',
  brand: '#009FE3',
  brandInk: '#1D1D1B',
  brandText: '#0076A8',
  brandSoft: '#E0F3FC',
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
  ink: '#111111',
  muted: '#33373C',
  line: '#8A98A3',
  brand: '#0076A8',
  brandInk: '#FFFFFF',
  brandText: '#00618C',
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
