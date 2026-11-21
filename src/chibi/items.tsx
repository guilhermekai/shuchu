/**
 * Cosmetic item drawings. Each draws in its own local coordinates centered on (0,0),
 * so the same art is placed on the chibi (via <G transform>) and in shop icons.
 */
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { ShopItem } from '../data/shop';

export function HeadItem({ item, worn }: { item: ShopItem; worn: boolean }) {
  switch (item.kind) {
    case 'headband':
      return worn ? (
        <G>
          <Path d="M24 44 Q60 30 96 44 L96 52 Q60 38 24 52 Z" fill={item.color} />
          <Circle cx="60" cy="40" r="6" fill={item.accent} />
          <Path d="M95 46 L110 40 L106 50 Z M95 48 L112 54 L104 58 Z" fill={item.color} />
        </G>
      ) : (
        <G>
          <Path d="M-22 -4 Q0 -14 22 -4 L22 5 Q0 -5 -22 5 Z" fill={item.color} stroke="#1B1A1F" strokeWidth={1.5} />
          <Circle cx="0" cy="-5" r="5" fill={item.accent} />
          <Path d="M21 0 L32 -8 L30 4 Z M21 2 L34 10 L26 12 Z" fill={item.color} stroke="#1B1A1F" strokeWidth={1.5} />
        </G>
      );
    case 'kitsune-mask':
      return (
        <G transform={worn ? 'translate(88 30) rotate(18) scale(0.7)' : undefined}>
          <Path d="M-16 -14 L-12 -26 L-4 -16 Q0 -18 4 -16 L12 -26 L16 -14 Q20 0 0 20 Q-20 0 -16 -14 Z" fill={item.color} stroke="#1B1A1F" strokeWidth={1.5} />
          <Path d="M-10 -4 L-4 -1 M10 -4 L4 -1" stroke={item.accent} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M-12 -18 L-10 -12 M12 -18 L10 -12" stroke={item.accent} strokeWidth={2.5} strokeLinecap="round" />
          <Circle cx="0" cy="12" r="2" fill="#1B1A1F" />
        </G>
      );
    case 'straw-hat':
      return (
        <G transform={worn ? 'translate(60 26)' : 'translate(0 6)'}>
          <Path d="M-44 6 Q0 -30 44 6 Q0 14 -44 6 Z" fill={item.color} stroke={item.accent} strokeWidth={1.5} />
          <Path d="M-30 0 Q0 -6 30 0 M-20 -8 Q0 -12 20 -8" stroke={item.accent} strokeWidth={1} fill="none" opacity={0.6} />
          <Circle cx="0" cy="-17" r="3" fill={item.accent} />
        </G>
      );
    default:
      return null;
  }
}

/** Outfits are drawn over the torso (worn) or as a small garment (icon). */
export function OutfitItem({ item, worn }: { item: ShopItem; worn: boolean }) {
  const torso = 'M44 92 Q60 86 76 92 L80 128 Q60 134 40 128 Z';
  const garment = 'M-16 -18 Q0 -24 16 -18 L22 20 Q0 26 -22 20 Z';
  const shape = worn ? torso : garment;
  if (item.kind === 'mecha-armor') {
    return (
      <G transform={worn ? undefined : 'translate(-60 -110)'}>
        <Path d={torso} fill={item.color} transform={worn ? undefined : 'translate(0 0)'} />
        <Path d="M48 100 L72 100 L70 116 L50 116 Z" fill={item.accent} />
        <Rect x="55" y="104" width="10" height="5" rx="2" fill="#7DD3FC" />
        <Ellipse cx="42" cy="96" rx="9" ry="7" fill={item.color} stroke="#64748B" strokeWidth={1.5} />
        <Ellipse cx="78" cy="96" rx="9" ry="7" fill={item.color} stroke="#64748B" strokeWidth={1.5} />
        <Line x1="44" y1="122" x2="76" y2="122" stroke="#64748B" strokeWidth={2} />
      </G>
    );
  }
  // yukata / kimono: wrapped collar + obi sash
  const dx = worn ? 0 : 0;
  return (
    <G transform={worn ? undefined : `translate(${dx} 0)`}>
      <Path d={shape} fill={item.color} />
      {worn ? (
        <>
          <Path d="M52 89 L60 104 L68 89" stroke={item.accent} strokeWidth={3} fill="none" />
          <Rect x="41" y="108" width="38" height="9" fill={item.accent} />
          {item.kind === 'kimono' && <Path d="M46 120 l4 -3 l4 3 M64 122 l4 -3 l4 3" stroke={item.accent} strokeWidth={1.5} fill="none" />}
          {item.kind === 'yukata' && <><Circle cx="48" cy="98" r="2" fill={item.accent} /><Circle cx="72" cy="124" r="2.5" fill={item.accent} /><Circle cx="66" cy="96" r="1.6" fill={item.accent} /></>}
        </>
      ) : (
        <>
          <Path d="M-8 -21 L0 -6 L8 -21" stroke={item.accent} strokeWidth={3} fill="none" />
          <Rect x="-20" y="2" width="40" height="8" fill={item.accent} />
          <Path d={shape} fill="none" stroke="#1B1A1F" strokeWidth={1.5} />
        </>
      )}
    </G>
  );
}

/** Hand items drawn with the grip at (0,0), blade/head pointing up. */
export function HandItem({ item }: { item: ShopItem }) {
  switch (item.kind) {
    case 'katana':
      return (
        <G>
          <Rect x="-2.5" y="-4" width="5" height="12" rx="1.5" fill={item.accent} />
          <Rect x="-6" y="-6" width="12" height="3" rx="1.5" fill="#C9A227" />
          <Path d="M-2 -6 L-2 -40 Q0 -46 3 -40 L2 -6 Z" fill={item.color} stroke="#1B1A1F" strokeWidth={1} />
        </G>
      );
    case 'fan':
      return (
        <G>
          <Rect x="-1.5" y="-8" width="3" height="14" fill="#8D6E3F" />
          <Circle cx="0" cy="-18" r="12" fill={item.color} stroke="#1B1A1F" strokeWidth={1.2} />
          <Circle cx="0" cy="-18" r="6" fill={item.accent} />
        </G>
      );
    default:
      return null;
  }
}

export function TreatItem({ item }: { item: ShopItem }) {
  switch (item.kind) {
    case 'ramen':
      return (
        <G>
          <Path d="M-14 -6 L14 -6 Q12 8 0 9 Q-12 8 -14 -6 Z" fill={item.color} stroke="#1B1A1F" strokeWidth={1.2} />
          <Ellipse cx="0" cy="-6" rx="14" ry="3.5" fill={item.accent} />
          <Path d="M-8 -6 q3 -3 6 0 q3 3 6 0" stroke="#E9C46A" strokeWidth={1.5} fill="none" />
          <Circle cx="6" cy="-7" r="2.5" fill="#FFF" stroke="#F5B83D" strokeWidth={1.2} />
          <Line x1="-4" y1="-8" x2="10" y2="-20" stroke="#8D6E3F" strokeWidth={1.5} />
          <Line x1="-1" y1="-8" x2="13" y2="-18" stroke="#8D6E3F" strokeWidth={1.5} />
        </G>
      );
    case 'dango':
      return (
        <G>
          <Line x1="0" y1="8" x2="0" y2="-30" stroke="#8D6E3F" strokeWidth={2} />
          <Circle cx="0" cy="-24" r="5.5" fill={item.color} stroke="#1B1A1F" strokeWidth={1} />
          <Circle cx="0" cy="-14" r="5.5" fill="#FFFFFF" stroke="#1B1A1F" strokeWidth={1} />
          <Circle cx="0" cy="-4" r="5.5" fill={item.accent} stroke="#1B1A1F" strokeWidth={1} />
        </G>
      );
    default:
      return null;
  }
}

export function PetArt({ item }: { item: ShopItem }) {
  // Pet drawn in a 60×50 box.
  const isShiba = item.kind === 'shiba';
  return (
    <G>
      <Ellipse cx="30" cy="46" rx="18" ry="3" fill="#000" opacity={0.12} />
      {isShiba ? (
        <Path d="M46 30 Q56 22 52 14 Q50 24 44 26 Z" fill={item.color} />
      ) : (
        <Path d="M44 34 Q58 30 56 20 Q52 26 44 28 Z" fill={item.accent} />
      )}
      <Ellipse cx="32" cy="34" rx="14" ry="10" fill={item.color} />
      <Ellipse cx="32" cy="37" rx="8" ry="6" fill={isShiba ? item.accent : '#D9C6B0'} />
      <Path d={isShiba ? 'M12 14 L15 4 L21 12 Z M33 12 L39 4 L41 14 Z' : 'M13 12 Q14 6 19 10 Z M35 10 Q40 6 41 12 Z'} fill={item.color} />
      <Circle cx="27" cy="20" r="13" fill={item.color} />
      {isShiba ? (
        <Path d="M18 24 Q27 34 36 24 Q32 30 27 30 Q22 30 18 24 Z" fill={item.accent} />
      ) : (
        <Path d="M15 20 Q20 15 25 20 Q20 25 15 20 Z M29 20 Q34 15 39 20 Q34 25 29 20 Z" fill={item.accent} />
      )}
      <Circle cx="21" cy="20" r="2" fill="#1B1A1F" />
      <Circle cx="33" cy="20" r="2" fill="#1B1A1F" />
      <Ellipse cx="27" cy="25" rx="2" ry="1.4" fill="#1B1A1F" />
    </G>
  );
}
