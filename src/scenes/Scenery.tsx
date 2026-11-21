/**
 * Parallax scenery the hero walks through. Three looping layers (far / mid / near),
 * each a tile rendered twice side by side and translated linearly on the UI thread.
 * Constant motion → linear easing. Paused = hold position (no snap back).
 */
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { sceneById, type SceneId } from '../data/scenes';
import { Petals } from '../components/Petals';

const TW = 400; // tile width (units)
const TH = 300; // tile height (units)

type Props = { sceneId: SceneId; width: number; height: number; moving: boolean; speed?: number; children?: ReactNode };

export function Scenery({ sceneId, width, height, moving, speed = 1, children }: Props) {
  const scene = sceneById(sceneId);
  const scale = height / TH;
  const L = SCENE_LAYERS[sceneId];
  const dimmed = useColorScheme() === 'dark' && !scene.dark;
  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <LinearGradient colors={scene.sky} style={StyleSheet.absoluteFill} />
      <Layer moving={moving} duration={40000 / speed} scale={scale} width={width}>{L.far}</Layer>
      <Layer moving={moving} duration={16000 / speed} scale={scale} width={width}>{L.mid}</Layer>
      <Layer moving={moving} duration={6000 / speed} scale={scale} width={width}>{L.near}</Layer>
      {/* Daytime scenes glare in dark mode: dim them a little. */}
      {dimmed && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,8,20,0.18)' }]} pointerEvents="none" />}
      {sceneId === 'sakura' && <Petals count={14} width={width} height={height} />}
      {sceneId === 'neon' && <Petals count={10} width={width} height={height} variant="rain" />}
      {children}
    </View>
  );
}

function Layer({ moving, duration, scale, width, children }: { moving: boolean; duration: number; scale: number; width: number; children: (i: number) => ReactNode }) {
  const tilePx = TW * scale;
  // Enough tiles to cover the view even after scrolling one tile left.
  const tiles = Math.ceil(width / tilePx) + 1;
  const x = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!moving || reduced) {
      cancelAnimation(x);
      return;
    }
    // Continue from wherever we paused; finish the current cycle, then loop.
    const from = x.get() % -tilePx;
    const remaining = (tilePx + from) / tilePx;
    x.set(from);
    x.set(
      withTiming(-tilePx, { duration: duration * remaining, easing: Easing.linear }, (done) => {
        'worklet';
        if (!done) return;
        x.set(0);
        x.set(withRepeat(withTiming(-tilePx, { duration, easing: Easing.linear }), -1, false));
      }),
    );
    return () => cancelAnimation(x);
  }, [moving, reduced, duration, tilePx, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { flexDirection: 'row', width: tilePx * tiles }, style]} pointerEvents="none">
      {Array.from({ length: tiles }, (_, i) => (
        <Svg key={i} width={tilePx} height={TH * scale} viewBox={`0 0 ${TW} ${TH}`}>
          {children(i)}
        </Svg>
      ))}
    </Animated.View>
  );
}

// ── Scene art ────────────────────────────────────────────────────────────────
type Layers = { far: (i: number) => ReactNode; mid: (i: number) => ReactNode; near: (i: number) => ReactNode };

function SakuraTree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-5 0 L-3 -60 Q-20 -80 -30 -84 M-3 -60 Q10 -86 26 -90 M-3 -60 L0 -100" stroke="#6B4F4F" strokeWidth={6} strokeLinecap="round" fill="none" />
      <Path d="M-5 0 L5 0 L3 -62 L-3 -62 Z" fill="#6B4F4F" />
      {[
        [-30, -92, 26], [0, -110, 30], [26, -96, 26], [-12, -82, 22], [16, -78, 20], [-40, -76, 16], [38, -80, 16],
      ].map(([cx, cy, r], k) => (
        <Circle key={k} cx={cx} cy={cy} r={r} fill={k % 2 ? '#FFC2D1' : '#FFB0C4'} />
      ))}
      {[[-18, -100], [10, -96], [-30, -84], [24, -88], [2, -120]].map(([cx, cy], k) => (
        <Circle key={`h${k}`} cx={cx} cy={cy} r={4} fill="#FFFFFF" opacity={0.7} />
      ))}
    </G>
  );
}

const SCENE_LAYERS: Record<SceneId, Layers> = {
  sakura: {
    far: () => (
      <G>
        <Path d="M0 210 Q60 170 130 190 Q200 150 270 185 Q340 160 400 195 L400 300 L0 300 Z" fill="#F8D7E0" />
        <Path d="M300 200 L300 160 L290 160 L310 140 L330 160 L320 160 L320 200 Z" fill="#F2C4D0" />
      </G>
    ),
    mid: () => (
      <G>
        <Rect x="40" y="170" width="70" height="60" fill="#FFF6EE" />
        <Path d="M30 172 L75 144 L120 172 Z" fill="#7C6A8A" />
        <Rect x="58" y="192" width="18" height="38" fill="#C9B6A6" />
        <Rect x="84" y="188" width="16" height="14" fill="#BFE3F2" />
        <SakuraTree x={190} y={232} s={1.05} />
        <G>
          <Rect x="318" y="150" width="4" height="82" fill="#3A3A48" />
          <Rect x="306" y="140" width="28" height="14" rx="4" fill="#3A3A48" />
          <Rect x="310" y="143" width="20" height="8" rx="2" fill="#FFF3C4" />
        </G>
        <SakuraTree x={350} y={232} s={0.8} />
      </G>
    ),
    near: () => (
      <G>
        <Rect x="0" y="232" width="400" height="68" fill="#E9DED6" />
        <Rect x="0" y="232" width="400" height="6" fill="#CFC0B5" />
        {[0, 80, 160, 240, 320].map((x) => (
          <Line key={x} x1={x} y1="238" x2={x - 20} y2="300" stroke="#D8CABF" strokeWidth={2} />
        ))}
        {[[40, 262], [130, 280], [210, 256], [300, 286], [360, 266]].map(([x, y], k) => (
          <Ellipse key={k} cx={x} cy={y} rx="4" ry="2.4" fill="#FFB0C4" transform={`rotate(${k * 40} ${x} ${y})`} />
        ))}
      </G>
    ),
  },
  neon: {
    far: () => (
      <G>
        {[[30, 30], [90, 60], [160, 24], [240, 50], [330, 34], [380, 70]].map(([x, y], k) => (
          <Circle key={k} cx={x} cy={y} r={1.4} fill="#FFFFFF" opacity={0.7} />
        ))}
        {[[0, 120, 50], [50, 90, 40], [90, 140, 60], [150, 70, 36], [186, 110, 54], [240, 60, 44], [284, 130, 50], [334, 96, 66]].map(([x, y, w], k) => (
          <G key={k}>
            <Rect x={x} y={y} width={w} height={300 - y} fill="#241A44" />
            {Array.from({ length: 5 }).map((_, r) => (
              <Rect key={r} x={x + 8} y={y + 14 + r * 22} width={w - 16} height={3} fill="#FFD27A" opacity={(k + r) % 3 === 0 ? 0.6 : 0.15} />
            ))}
          </G>
        ))}
      </G>
    ),
    mid: () => (
      <G>
        <Rect x="20" y="110" width="110" height="130" fill="#2C2150" />
        <Rect x="36" y="124" width="26" height="80" rx="4" fill="#120B26" stroke="#FF4FA3" strokeWidth={2.5} />
        <SvgText x="49" y="146" fontSize="16" fill="#FF8AC6" textAnchor="middle" fontWeight="700">ラ</SvgText>
        <SvgText x="49" y="166" fontSize="16" fill="#FF8AC6" textAnchor="middle" fontWeight="700">ー</SvgText>
        <SvgText x="49" y="186" fontSize="16" fill="#FF8AC6" textAnchor="middle" fontWeight="700">メ</SvgText>
        <SvgText x="49" y="200" fontSize="12" fill="#FF8AC6" textAnchor="middle" fontWeight="700">ン</SvgText>
        <Rect x="72" y="150" width="46" height="30" fill="#FFD27A" opacity={0.35} />
        <Rect x="200" y="80" width="130" height="160" fill="#33245E" />
        <Rect x="214" y="96" width="102" height="30" rx="6" fill="#0E1A2E" stroke="#38E1FF" strokeWidth={2.5} />
        <SvgText x="265" y="117" fontSize="16" fill="#7EEBFF" textAnchor="middle" fontWeight="700">集中カフェ</SvgText>
        {[0, 1, 2].map((r) => (
          <Rect key={r} x="214" y={142 + r * 30} width="102" height="18" fill="#FFB86B" opacity={0.18 + r * 0.08} />
        ))}
        <Rect x="356" y="190" width="30" height="50" rx="3" fill="#E5483B" />
        <Rect x="360" y="196" width="22" height="22" fill="#BFE3F2" opacity={0.9} />
      </G>
    ),
    near: () => (
      <G>
        <Rect x="0" y="240" width="400" height="60" fill="#1A1430" />
        <Rect x="0" y="240" width="400" height="3" fill="#FF4FA3" opacity={0.5} />
        {[30, 140, 250, 350].map((x, k) => (
          <Rect key={x} x={x} y={258 + (k % 2) * 16} width={40} height={2} fill={k % 2 ? '#38E1FF' : '#FF8AC6'} opacity={0.4} />
        ))}
      </G>
    ),
  },
  station: {
    far: () => (
      <G>
        <Circle cx="300" cy="120" r="36" fill="#FFF1D6" opacity={0.9} />
        <Path d="M0 200 L70 130 L130 180 L200 110 L280 190 L340 140 L400 190 L400 300 L0 300 Z" fill="#C98B7A" opacity={0.55} />
      </G>
    ),
    mid: () => (
      <G>
        <Rect x="0" y="200" width="400" height="40" fill="#9CC48B" />
        {[0, 1, 2, 3].map((r) => <Line key={r} x1="0" y1={208 + r * 9} x2="400" y2={208 + r * 9} stroke="#86B276" strokeWidth={2} />)}
        <Rect x="80" y="100" width="5" height="110" fill="#5B4636" />
        <Rect x="66" y="108" width="34" height="4" fill="#5B4636" />
        <Path d="M68 110 Q240 140 400 112 M0 112 Q40 118 68 110" stroke="#3E3A39" strokeWidth={1.2} fill="none" />
        <Path d="M98 110 Q260 150 400 118" stroke="#3E3A39" strokeWidth={1} fill="none" />
        <Rect x="250" y="150" width="110" height="60" fill="#E9D8BF" />
        <Path d="M240 152 L305 126 L370 152 Z" fill="#7A4E3A" />
        <Rect x="266" y="166" width="22" height="20" fill="#FFF1C9" />
        <Rect x="300" y="166" width="22" height="20" fill="#FFF1C9" />
      </G>
    ),
    near: () => (
      <G>
        <Rect x="0" y="240" width="400" height="60" fill="#B8A898" />
        <Rect x="0" y="240" width="400" height="7" fill="#F5D76E" />
        <Rect x="150" y="176" width="4" height="64" fill="#4B4B4B" />
        <Rect x="200" y="176" width="4" height="64" fill="#4B4B4B" />
        <Rect x="128" y="170" width="100" height="30" rx="3" fill="#FFFFFF" stroke="#2E5C8A" strokeWidth={3} />
        <SvgText x="178" y="191" fontSize="15" fill="#1B1A1F" textAnchor="middle" fontWeight="700">しゅうちゅう</SvgText>
        <Rect x="300" y="222" width="60" height="6" rx="2" fill="#7A5230" />
        <Rect x="306" y="228" width="4" height="12" fill="#5B4636" />
        <Rect x="350" y="228" width="4" height="12" fill="#5B4636" />
      </G>
    ),
  },
  hallway: {
    far: () => (
      <G>
        <Rect x="0" y="0" width="400" height="240" fill="#F3EEE3" />
        <Rect x="0" y="150" width="400" height="90" fill="#E7DCC9" />
      </G>
    ),
    mid: () => (
      <G>
        {[30, 230].map((x) => (
          <G key={x}>
            <Rect x={x} y="40" width="140" height="90" rx="4" fill="#BFE0F5" stroke="#B9A98F" strokeWidth={5} />
            <Line x1={x + 70} y1="40" x2={x + 70} y2="130" stroke="#B9A98F" strokeWidth={4} />
            <Ellipse cx={x + 40} cy="76" rx="22" ry="9" fill="#FFFFFF" opacity={0.85} />
            <Ellipse cx={x + 104} cy="96" rx="18" ry="7" fill="#FFFFFF" opacity={0.75} />
          </G>
        ))}
        <Rect x="180" y="120" width="40" height="120" fill="#C7A77C" stroke="#9C7F5B" strokeWidth={3} />
        <Rect x="186" y="128" width="28" height="30" fill="#E8F3FA" />
        <Rect x="178" y="96" width="44" height="18" rx="2" fill="#FFFFFF" stroke="#9C7F5B" strokeWidth={2} />
        <SvgText x="200" y="110" fontSize="12" fill="#1B1A1F" textAnchor="middle" fontWeight="700">2-B</SvgText>
        <Rect x="0" y="232" width="400" height="8" fill="#9C7F5B" />
      </G>
    ),
    near: () => (
      <G>
        <Rect x="0" y="240" width="400" height="60" fill="#D6B98C" />
        {[0, 1, 2, 3, 4].map((k) => <Line key={k} x1={k * 100} y1="240" x2={k * 100 - 40} y2="300" stroke="#C4A473" strokeWidth={2} />)}
        <Rect x="0" y="258" width="400" height="1.5" fill="#C4A473" />
      </G>
    ),
  },
};

/** Ground line in scene units — where feet go. */
export const GROUND_Y = { sakura: 236, neon: 244, station: 244, hallway: 244 } as const;
export const SCENE_TH = TH;
