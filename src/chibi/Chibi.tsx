/**
 * SVG chibi — the placeholder for the Rive characters.
 *
 * Layers (back → front): back hair/tail · arms · legs · body+head · items.
 * Limbs are separate Animated.Views so walking runs entirely on the UI thread
 * from one shared phase value; React never re-renders per frame.
 */
import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { heroById, type HeroId, type HeroLook } from '../data/characters';
import { itemById, type Slot } from '../data/shop';
import { HandItem, HeadItem, OutfitItem, PetArt, TreatItem } from './items';

export type ChibiMode = 'idle' | 'walk' | 'run' | 'cheer';

const W = 120;
const H = 160;
const PERIOD: Record<ChibiMode, number> = { idle: 2400, walk: 760, run: 440, cheer: 620 };
const TAU = Math.PI * 2;

type Props = {
  heroId: HeroId;
  equipped?: Partial<Record<Slot, string>>;
  size?: number;
  mode?: ChibiMode;
  /** Phase offset (0–1) so a crowd doesn't move in lockstep. */
  offset?: number;
  showPet?: boolean;
};

export const Chibi = memo(function Chibi({ heroId, equipped = {}, size = 120, mode = 'idle', offset = 0, showPet = true }: Props) {
  const look = heroById(heroId).look;
  const s = size / W;
  const reduced = useReducedMotion();
  const phase = useSharedValue(offset);

  useEffect(() => {
    if (reduced && mode !== 'idle') {
      cancelAnimation(phase);
      return;
    }
    phase.set(offset);
    phase.set(withRepeat(withTiming(offset + 1, { duration: PERIOD[mode], easing: Easing.linear }), -1, false));
    return () => cancelAnimation(phase);
  }, [mode, reduced, offset, phase]);

  const head = itemById(equipped.head ?? '');
  const outfit = itemById(equipped.outfit ?? '');
  const hand = itemById(equipped.hand ?? '');
  const treat = itemById(equipped.treat ?? '');
  const pet = itemById(equipped.pet ?? '');

  const bodyStyle = useAnimatedStyle(() => {
    const p = phase.get() * TAU;
    if (mode === 'idle') return { transform: [{ translateY: Math.sin(p) * 1.2 * s }, { scaleY: 1 + Math.sin(p) * 0.008 }] };
    if (mode === 'cheer') return { transform: [{ translateY: -Math.abs(Math.sin(p)) * 14 * s }] };
    const amp = mode === 'run' ? 6 : 3;
    return { transform: [{ translateY: -Math.abs(Math.sin(p)) * amp * s }, { rotate: mode === 'run' ? '4deg' : '0deg' }] };
  });

  const limbColor = outfit ? outfit.color : look.outfit;

  return (
    <View style={{ width: size, height: size * (H / W) + (pet && showPet ? 0 : 0) }} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
        {/* back layer */}
        <Svg width={size} height={size * (H / W)} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
          <BackHair look={look} />
        </Svg>

        {/* arms (behind torso) */}
        <Limb phase={phase} mode={mode} side={-1} kind="arm" s={s} color={limbColor} skin={look.skin} />
        <Limb phase={phase} mode={mode} side={1} kind="arm" s={s} color={limbColor} skin={look.skin}>
          {hand && (
            <Svg width={40 * s} height={60 * s} viewBox="-20 -50 40 60" style={{ position: 'absolute', left: -14.5 * s, top: -30 * s }}>
              <HandItem item={hand} />
            </Svg>
          )}
          {!hand && look.signature === 'wand' && (
            <Svg width={40 * s} height={60 * s} viewBox="-20 -50 40 60" style={{ position: 'absolute', left: -14.5 * s, top: -30 * s }}>
              <Rect x="-1.5" y="-26" width="3" height="30" rx="1.5" fill="#F7A1C4" />
              <Path d="M0 -40 l3.5 7 l7.5 1 l-5.5 5 l1.5 7.5 l-7 -3.5 l-7 3.5 l1.5 -7.5 l-5.5 -5 l7.5 -1 Z" fill="#F5B83D" />
            </Svg>
          )}
          {!hand && look.signature === 'gohei' && (
            <Svg width={40 * s} height={60 * s} viewBox="-20 -50 40 60" style={{ position: 'absolute', left: -14.5 * s, top: -30 * s }}>
              <Rect x="-1.2" y="-36" width="2.4" height="40" fill="#8D6E3F" />
              <Path d="M1 -36 l8 4 l-6 4 l8 4 l-6 4 l8 4" stroke="#FFFFFF" strokeWidth={3} fill="none" />
              <Path d="M1 -36 l8 4 l-6 4 l8 4 l-6 4 l8 4" stroke="#1B1A1F" strokeWidth={0.6} fill="none" />
            </Svg>
          )}
        </Limb>

        {/* legs */}
        <Limb phase={phase} mode={mode} side={-1} kind="leg" s={s} color={look.signature === 'gohei' && !outfit ? look.outfitAccent : '#2A2733'} skin={look.skin} />
        <Limb phase={phase} mode={mode} side={1} kind="leg" s={s} color={look.signature === 'gohei' && !outfit ? look.outfitAccent : '#2A2733'} skin={look.skin} />

        {/* body + head */}
        <Svg width={size} height={size * (H / W)} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
          <Torso look={look} />
          {outfit && <OutfitItem item={outfit} worn />}
          {treat && (
            <G transform="translate(30 118)">
              <TreatItem item={treat} />
            </G>
          )}
          <Head look={look} />
          {head && <HeadItem item={head} worn />}
        </Svg>
      </Animated.View>

      {pet && showPet && <Pet petId={pet.id} phase={phase} mode={mode} s={s} />}
    </View>
  );
});

// ── Limbs ────────────────────────────────────────────────────────────────────
function Limb({
  phase,
  mode,
  side,
  kind,
  s,
  color,
  skin,
  children,
}: {
  phase: SharedValue<number>;
  mode: ChibiMode;
  side: -1 | 1;
  kind: 'arm' | 'leg';
  s: number;
  color: string;
  skin: string;
  children?: React.ReactNode;
}) {
  const isLeg = kind === 'leg';
  const w = isLeg ? 13 : 11;
  const h = isLeg ? 28 : 26;
  const x = isLeg ? 60 + side * 9 : 60 + side * 17;
  const y = isLeg ? 122 : 92;

  const style = useAnimatedStyle(() => {
    const p = phase.get() * TAU;
    let deg = 0;
    if (mode === 'walk') deg = Math.sin(p) * (isLeg ? 24 : 26) * side * (isLeg ? 1 : -1);
    else if (mode === 'run') deg = Math.sin(p) * (isLeg ? 40 : 55) * side * (isLeg ? 1 : -1);
    else if (mode === 'cheer') deg = isLeg ? 0 : side * (150 + Math.sin(p * 2) * 12);
    else deg = isLeg ? 0 : side * (8 + Math.sin(p) * 2);
    return { transform: [{ rotate: `${deg}deg` }] };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: (x - w / 2) * s,
          top: y * s,
          width: w * s,
          height: h * s,
          transformOrigin: 'top',
        },
        style,
      ]}
    >
      <Svg width={w * s} height={h * s} viewBox={`0 0 ${w} ${h}`}>
        {isLeg ? (
          <>
            <Rect x={1.5} y={0} width={w - 3} height={h - 6} rx={4} fill={color} />
            <Rect x={0.5} y={h - 9} width={w - 1} height={9} rx={4.5} fill="#1B1A1F" />
            <Rect x={2} y={h - 8} width={w - 4} height={2} rx={1} fill="#FFFFFF" opacity={0.25} />
          </>
        ) : (
          <>
            <Rect x={0.5} y={0} width={w - 1} height={h - 7} rx={5} fill={color} />
            <Circle cx={w / 2} cy={h - 6} r={5} fill={skin} />
          </>
        )}
      </Svg>
      {children}
    </Animated.View>
  );
}

// ── Body parts ───────────────────────────────────────────────────────────────
function BackHair({ look }: { look: HeroLook }) {
  const c = look.hair;
  return (
    <G>
      {look.signature === 'tail' && (
        <Path d="M78 120 Q116 118 112 82 Q108 70 100 78 Q104 104 74 110 Z" fill={c} stroke="#FFFFFF" strokeWidth={0} />
      )}
      {look.signature === 'tail' && <Path d="M112 82 Q108 70 100 78 Q106 80 106 88 Z" fill="#FFFFFF" />}
      {look.hairStyle === 'long' && <Path d="M24 50 Q20 108 36 120 L84 120 Q100 108 96 50 Z" fill={c} />}
      {look.hairStyle === 'bob' && <Path d="M22 54 Q20 92 34 96 L86 96 Q100 92 98 54 Z" fill={c} />}
      {look.hairStyle === 'twintails' && (
        <>
          <Path d="M26 44 Q2 60 8 104 Q12 116 20 108 Q14 80 30 60 Z" fill={c} />
          <Path d="M94 44 Q118 60 112 104 Q108 116 100 108 Q106 80 90 60 Z" fill={c} />
        </>
      )}
      {look.signature === 'sheath' && <Rect x="22" y="112" width="70" height="6" rx="3" fill="#2A1E1A" transform="rotate(-24 60 116)" />}
      {look.signature === 'mask' && <Path d="M70 92 Q96 96 104 112 Q92 104 76 100 Z" fill={look.outfitAccent} />}
    </G>
  );
}

function Torso({ look }: { look: HeroLook }) {
  const torso = 'M44 92 Q60 86 76 92 L80 128 Q60 134 40 128 Z';
  return (
    <G>
      <Path d={torso} fill={look.outfit} />
      {look.signature === 'satchel' && (
        <>
          <Path d="M46 90 L60 102 L74 90 L70 98 L60 106 L50 98 Z" fill="#FFFFFF" />
          <Path d="M57 102 L63 102 L62 114 L60 116 L58 114 Z" fill={look.outfitAccent} />
          <Path d="M74 92 L46 124" stroke="#7A5230" strokeWidth={3} />
          <Rect x="34" y="118" width="16" height="12" rx="3" fill="#7A5230" />
        </>
      )}
      {look.signature === 'gohei' && (
        <>
          <Path d="M42 112 L78 112 L80 128 Q60 134 40 128 Z" fill={look.outfitAccent} />
          <Path d="M52 89 L60 102 L68 89" stroke={look.outfitAccent} strokeWidth={2} fill="none" />
        </>
      )}
      {look.signature === 'towel' && (
        <>
          <Path d="M48 98 L72 98 L76 130 Q60 134 44 130 Z" fill={look.outfitAccent} />
          <Path d="M48 98 L44 92 M72 98 L76 92" stroke={look.outfitAccent} strokeWidth={2} />
        </>
      )}
      {look.signature === 'visor' && (
        <>
          <Rect x="52" y="96" width="16" height="10" rx="3" fill={look.outfitAccent} />
          <Circle cx="60" cy="101" r="2.5" fill="#7DD3FC" />
          <Path d="M44 116 L76 116" stroke={look.outfitAccent} strokeWidth={3} />
        </>
      )}
      {look.signature === 'wand' && (
        <>
          <Path d="M60 98 L50 92 L50 104 Z M60 98 L70 92 L70 104 Z" fill={look.outfitAccent} />
          <Circle cx="60" cy="98" r="3" fill="#F5B83D" />
          <Path d="M42 118 Q60 126 78 118 L82 130 Q60 136 38 130 Z" fill={look.outfitAccent} opacity={0.85} />
        </>
      )}
      {(look.signature === 'mask' || look.signature === 'sheath' || look.signature === 'tail') && (
        <>
          <Path d="M52 89 L60 104 L68 89" stroke={look.outfitAccent} strokeWidth={3} fill="none" />
          <Rect x="41" y="110" width="38" height="7" fill={look.outfitAccent} />
        </>
      )}
    </G>
  );
}

function Head({ look }: { look: HeroLook }) {
  const c = look.hair;
  return (
    <G>
      {/* neck shadow */}
      <Ellipse cx="60" cy="88" rx="9" ry="4" fill="#000" opacity={0.12} />
      {/* ears */}
      <Circle cx="24" cy="62" r="6" fill={look.skin} />
      <Circle cx="96" cy="62" r="6" fill={look.skin} />
      {/* face */}
      <Ellipse cx="60" cy="56" rx="37" ry="34" fill={look.skin} />
      {/* eyes */}
      {[46, 74].map((x) => (
        <G key={x}>
          <Ellipse cx={x} cy="64" rx="6.5" ry="8.5" fill={look.eye} />
          <Ellipse cx={x} cy="66.5" rx="4.2" ry="5" fill="#000" opacity={0.35} />
          <Circle cx={x - 2.2} cy="60.5" r="2.6" fill="#FFF" />
          <Circle cx={x + 2.2} cy="68" r="1.2" fill="#FFF" />
          <Path d={`M${x - 7} 55 Q${x} 51 ${x + 7} 55`} stroke="#1B1A1F" strokeWidth={2} strokeLinecap="round" fill="none" />
        </G>
      ))}
      <Ellipse cx="37" cy="75" rx="5.5" ry="3" fill="#F07C9A" opacity={0.45} />
      <Ellipse cx="83" cy="75" rx="5.5" ry="3" fill="#F07C9A" opacity={0.45} />
      {look.signature === 'mask' ? (
        <Path d="M25 70 Q60 64 95 70 Q94 90 60 92 Q26 90 25 70 Z" fill={look.outfit} />
      ) : (
        <Path d="M55 78 Q60 83 65 78" stroke="#1B1A1F" strokeWidth={2} strokeLinecap="round" fill="none" />
      )}
      <FrontHair look={look} c={c} />
      {look.signature === 'visor' && (
        <>
          <Path d="M22 56 Q20 30 38 22" stroke={look.outfitAccent} strokeWidth={4} fill="none" />
          <Rect x="15" y="52" width="10" height="18" rx="4" fill={look.outfitAccent} />
          <Rect x="95" y="52" width="10" height="18" rx="4" fill={look.outfitAccent} />
          <Path d="M100 52 L106 30" stroke={look.outfitAccent} strokeWidth={2} />
          <Circle cx="106" cy="29" r="3" fill="#F26B21" />
        </>
      )}
    </G>
  );
}

function FrontHair({ look, c }: { look: HeroLook; c: string }) {
  switch (look.hairStyle) {
    case 'spiky':
      return <Path d="M22 60 Q16 36 28 26 L26 12 L40 20 L46 4 L56 16 L66 2 L72 16 L86 8 L86 22 Q102 30 98 60 Q92 44 80 42 L74 50 L68 40 L58 48 L52 38 L42 48 L36 40 Q26 46 22 60 Z" fill={c} />;
    case 'topknot':
      return (
        <G>
          <Circle cx="60" cy="14" r="10" fill={c} />
          <Rect x="54" y="20" width="12" height="4" rx="2" fill={look.outfitAccent} />
          <Path d="M23 60 Q20 22 60 20 Q100 22 97 60 Q94 42 84 38 Q72 44 60 36 Q48 44 36 38 Q26 42 23 60 Z" fill={c} />
        </G>
      );
    case 'twintails':
      return (
        <G>
          <Path d="M23 62 Q18 20 60 18 Q102 20 97 62 Q92 40 80 44 Q74 32 64 44 Q58 30 48 44 Q38 34 32 46 Q26 50 23 62 Z" fill={c} />
          <Circle cx="27" cy="40" r="6" fill="#8E6CEF" />
          <Circle cx="93" cy="40" r="6" fill="#8E6CEF" />
        </G>
      );
    case 'long':
      return <Path d="M23 70 Q18 18 60 18 Q102 18 97 70 L92 46 Q84 42 78 46 L76 36 L44 36 L42 46 Q36 42 28 46 Z" fill={c} />;
    case 'bob':
      return <Path d="M22 66 Q18 18 60 18 Q102 18 98 66 Q94 44 86 40 Q70 46 58 36 Q50 46 34 42 Q26 48 22 66 Z" fill={c} />;
    case 'fox':
      return (
        <G>
          <Path d="M26 34 L22 4 L46 22 Z" fill={c} />
          <Path d="M94 34 L98 4 L74 22 Z" fill={c} />
          <Path d="M28 28 L26 12 L40 23 Z" fill="#FFF3E0" />
          <Path d="M92 28 L94 12 L80 23 Z" fill="#FFF3E0" />
          <Path d="M23 60 Q20 20 60 20 Q100 20 97 60 Q92 42 82 44 L76 36 L68 46 L60 34 L52 46 L44 36 L38 44 Q28 42 23 60 Z" fill={c} />
        </G>
      );
    case 'bandana':
      return (
        <G>
          <Path d="M23 60 Q20 30 40 30 L80 30 Q100 30 97 60 Q90 46 80 46 Q60 40 40 46 Q30 46 23 60 Z" fill={c} />
          <Path d="M22 44 Q22 14 60 14 Q98 14 98 44 Q60 32 22 44 Z" fill={look.outfitAccent} />
          <Path d="M96 38 L110 30 L108 44 Z" fill={look.outfitAccent} />
        </G>
      );
    case 'short':
    default:
      return <Path d="M23 60 Q20 18 60 18 Q100 18 97 60 Q90 40 76 42 Q68 32 56 42 Q42 34 34 48 Q28 50 23 60 Z" fill={c} />;
  }
}

// ── Pet ──────────────────────────────────────────────────────────────────────
function Pet({ petId, phase, mode, s }: { petId: string; phase: SharedValue<number>; mode: ChibiMode; s: number }) {
  const item = itemById(petId)!;
  const style = useAnimatedStyle(() => {
    const p = (phase.get() + 0.25) * TAU;
    const hop = mode === 'idle' ? Math.abs(Math.sin(p)) * 1.5 : Math.abs(Math.sin(p * 1.0)) * (mode === 'run' ? 7 : 4);
    return { transform: [{ translateY: -hop * s }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: -38 * s, bottom: 2 * s, width: 60 * s, height: 50 * s }, style]}>
      <Svg width={60 * s} height={50 * s} viewBox="0 0 60 50">
        <PetArt item={item} />
      </Svg>
    </Animated.View>
  );
}
