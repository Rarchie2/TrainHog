import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'home' | 'grid' | 'book' | 'user' | 'play' | 'clock' | 'alert' | 'mic' | 'search' | 'plus'
  | 'check' | 'inbox' | 'users' | 'chat' | 'dumbbell' | 'flame' | 'chev' | 'back' | 'spin' | 'heart'
  | 'rehab' | 'speaker' | 'bell' | 'lock' | 'cal' | 'send' | 'star' | 'starFilled' | 'x' | 'pause'
  | 'balance' | 'switch' | 'film' | 'list';

type Props = { name: IconName; size?: number; color: string; strokeWidth?: number };

// Simple line icons drawn on a 24 x 24 grid.
export function Icon({ name, size = 22, color, strokeWidth = 2 }: Props) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const body = (() => {
    switch (name) {
      case 'home': return <Path {...p} d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />;
      case 'grid': return <>
        <Rect {...p} x={3.5} y={3.5} width={7} height={7} rx={1.8} /><Rect {...p} x={13.5} y={3.5} width={7} height={7} rx={1.8} />
        <Rect {...p} x={3.5} y={13.5} width={7} height={7} rx={1.8} /><Rect {...p} x={13.5} y={13.5} width={7} height={7} rx={1.8} /></>;
      case 'book': return <><Path {...p} d="M5 4.5A1.5 1.5 0 0 1 6.5 3H20v15H6.5A1.5 1.5 0 0 0 5 19.5z" /><Path {...p} d="M5 19.5A1.5 1.5 0 0 0 6.5 21H20v-3" /></>;
      case 'user': return <><Circle {...p} cx={12} cy={8} r={4} /><Path {...p} d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>;
      case 'play': return <Path d="M8 5.5v13l10.5-6.5z" fill={color} />;
      case 'pause': return <><Rect x={6.5} y={5} width={4} height={14} rx={1} fill={color} /><Rect x={13.5} y={5} width={4} height={14} rx={1} fill={color} /></>;
      case 'clock': return <><Circle {...p} cx={12} cy={12} r={9} /><Path {...p} d="M12 7v5l3 2" /></>;
      case 'alert': return <><Path {...p} d="M12 3.5 2.5 20h19z" /><Path {...p} d="M12 10v4.5M12 17.2v.3" /></>;
      case 'mic': return <><Rect {...p} x={9} y={3} width={6} height={11} rx={3} /><Path {...p} d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>;
      case 'search': return <><Circle {...p} cx={11} cy={11} r={7} /><Path {...p} d="m20 20-4-4" /></>;
      case 'plus': return <Path {...p} d="M12 5v14M5 12h14" />;
      case 'check': return <Path {...p} d="m5 12.5 4.5 4.5L19 7.5" />;
      case 'x': return <Path {...p} d="M6 6l12 12M18 6 6 18" />;
      case 'inbox': return <><Path {...p} d="M3 13h5l1.5 3h5l1.5-3h5" /><Path {...p} d="M5.5 5h13L21 13v6H3v-6z" /></>;
      case 'users': return <><Circle {...p} cx={9} cy={8} r={3.5} /><Path {...p} d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" /><Path {...p} d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 15c2 .7 3 2.3 3.5 5" /></>;
      case 'chat': return <Path {...p} d="M4 5h16v11H10l-6 4.5z" />;
      case 'dumbbell': return <Path {...p} d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11" />;
      case 'flame': return <Path {...p} d="M12 3c.5 3.5 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2.6 1.4-3.8 2.3-5.3.7 1.3 1.2 2 1.7 2.3C11.5 8 12 5.5 12 3z" />;
      case 'chev': return <Path {...p} d="m9 6 6 6-6 6" />;
      case 'back': return <Path {...p} d="m15 6-6 6 6 6" />;
      case 'spin': return <><Path {...p} d="M20 12a8 8 0 1 1-2.3-5.7" /><Path {...p} d="M20 4v4.5h-4.5" /></>;
      case 'heart': return <Path {...p} d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />;
      case 'rehab': return <><Path {...p} d="M8.5 3.5h7v5h5v7h-5v5h-7v-5h-5v-7h5z" /></>;
      case 'balance': return <><Path {...p} d="M12 3v18M5 21h14" /><Path {...p} d="M4 9h16M4 9l-2 5h4zM20 9l-2 5h4z" /></>;
      case 'speaker': return <><Path {...p} d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><Path {...p} d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>;
      case 'bell': return <><Path {...p} d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><Path {...p} d="M10 20.5a2 2 0 0 0 4 0" /></>;
      case 'lock': return <><Rect {...p} x={5} y={10.5} width={14} height={10} rx={2} /><Path {...p} d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>;
      case 'cal': return <><Rect {...p} x={3.5} y={5} width={17} height={15.5} rx={2} /><Path {...p} d="M3.5 10h17M8 3v4M16 3v4" /></>;
      case 'send': return <><Path {...p} d="M4 12 20 4l-5 16-3.5-6.5z" /><Path {...p} d="m11.5 13.5 8.5-9.5" /></>;
      case 'star': return <Path {...p} d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />;
      case 'starFilled': return <Path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill={color} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />;
      case 'switch': return <><Path {...p} d="M4 8h13l-3-3M20 16H7l3 3" /></>;
      case 'film': return <><Rect {...p} x={3} y={5} width={18} height={14} rx={2} /><Path {...p} d="m10 9 5 3-5 3z" /></>;
      case 'list': return <Path {...p} d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />;
    }
  })();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {body}
    </Svg>
  );
}
