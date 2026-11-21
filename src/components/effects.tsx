/** Anime effect layer: speed lines, aura, sparkle pops, petal burst. Decorative, UI-thread only. */
import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Path, RadialGradient, Rect, Stop, Circle } from 'react-native-svg';
import { motion } from '../theme/tokens';

const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Radial manga speed lines converging on the center. */
export const SpeedLines = memo(function SpeedLines({
  size,
  color = '#FFFFFF',
  count = 56,
  inner = 0.32,
  spin = true,
  opacity = 1,
}: {
  size: number;
  color?: string;
  count?: number;
  inner?: number;
  spin?: boolean;
  opacity?: number;
}) {
  const reduced = useReducedMotion();
  const rot = useSharedValue(0);
  useEffect(() => {
    if (!spin || reduced) return;
    rot.set(withRepeat(withTiming(360, { duration: 60000, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(rot);
  }, [spin, reduced, rot]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.get()}deg` }] }));

  const d = useMemo(() => {
    const c = 50;
    let path = '';
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand(i, 1) * 0.08;
      const w = 0.006 + rand(i, 2) * 0.016;
      const r0 = c * (inner + rand(i, 3) * 0.25);
      const r1 = c * 1.5;
      const p = (ang: number, r: number) => `${(c + Math.cos(ang) * r).toFixed(2)} ${(c + Math.sin(ang) * r).toFixed(2)}`;
      path += `M${p(a, r0)} L${p(a - w * 4, r1)} L${p(a + w * 4, r1)} Z `;
    }
    return path;
  }, [count, inner]);

  return (
    <Animated.View style={[{ width: size, height: size, opacity }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d={d} fill={color} />
      </Svg>
    </Animated.View>
  );
});

/** Soft radial glow. */
export function Aura({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <RadialGradient id="aura" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={color} stopOpacity={0.95} />
          <Stop offset="0.45" stopColor={color} stopOpacity={0.45} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#aura)" />
    </Svg>
  );
}

/** Four-point sparkle that pops once after `delay`, optionally twinkling after. */
export function Sparkle({ x, y, size, delay, color = '#FFF6C9', twinkle = false }: { x: number; y: number; size: number; delay: number; color?: string; twinkle?: boolean }) {
  const reduced = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      v.set(withDelay(delay, withTiming(0.8, { duration: 200 })));
      return;
    }
    const pop = withSequence(withTiming(1, { duration: 260, easing: motion.easeOut }), withTiming(twinkle ? 0.55 : 0, { duration: 520, easing: motion.easeOut }));
    v.set(withDelay(delay, twinkle ? withSequence(pop, withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.55, { duration: 700 })), -1)) : pop));
    return () => cancelAnimation(v);
  }, [delay, reduced, twinkle, v]);
  const style = useAnimatedStyle(() => ({
    opacity: v.get(),
    transform: [{ scale: interpolate(v.get(), [0, 1], [0.6, 1]) }, { rotate: `${v.get() * 45}deg` }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 20 20">
        <Path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0 Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

/** Petals explode outward from (cx, cy), then drift down and fade. */
export function PetalBurst({ cx, cy, count = 26, delay = 0, spread = 180 }: { cx: number; cy: number; count?: number; delay?: number; spread?: number }) {
  const reduced = useReducedMotion();
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + rand(i, 7) * 0.4;
        const dist = spread * (0.45 + rand(i, 8) * 0.55);
        return {
          dx: Math.cos(a) * dist,
          dy: Math.sin(a) * dist * 0.8,
          fall: 60 + rand(i, 9) * 120,
          size: 9 + rand(i, 10) * 8,
          spin: (rand(i, 11) - 0.5) * 900,
          tint: i % 3 === 0 ? '#FFFFFF' : i % 3 === 1 ? '#FFB0C4' : '#FF8FB1',
          duration: 1500 + rand(i, 12) * 900,
        };
      }),
    [count, spread],
  );
  if (reduced) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {parts.map((p, i) => (
        <BurstPetal key={i} {...p} cx={cx} cy={cy} delay={delay} />
      ))}
    </View>
  );
}

function BurstPetal({ cx, cy, dx, dy, fall, size, spin, tint, duration, delay }: { cx: number; cy: number; dx: number; dy: number; fall: number; size: number; spin: number; tint: string; duration: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withTiming(1, { duration, easing: Easing.linear })));
  }, [t, delay, duration]);
  const style = useAnimatedStyle(() => {
    const v = t.get();
    // fast ease-out explosion for the first 30%, then a slow drift down
    const burst = 1 - Math.pow(1 - Math.min(v / 0.3, 1), 3);
    const drift = Math.max(0, (v - 0.3) / 0.7);
    return {
      opacity: v === 0 ? 0 : v > 0.75 ? (1 - v) / 0.25 : 1,
      transform: [
        { translateX: cx + dx * burst + Math.sin(drift * 6) * 10 - size / 2 },
        { translateY: cy + dy * burst + fall * drift * drift - size / 2 },
        { rotate: `${spin * v}deg` },
        { scale: 0.7 + burst * 0.3 },
      ],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, style]}>
      <Svg width={size} height={size} viewBox="0 0 10 10">
        <Path d="M5 0 Q10 3 8 7 Q6 10 5 8.5 Q4 10 2 7 Q0 3 5 0 Z" fill={tint} />
      </Svg>
    </Animated.View>
  );
}

/** Horizontal motion streaks — used behind a running hero in the final stretch. */
export const MotionStreaks = memo(function MotionStreaks({ width, height, color = '#FFFFFF' }: { width: number; height: number; color?: string }) {
  const reduced = useReducedMotion();
  const lines = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ y: rand(i, 1) * height, w: 40 + rand(i, 2) * 90, d: 420 + rand(i, 3) * 380, delay: rand(i, 4) * 600 })), [height]);
  if (reduced) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {lines.map((l, i) => (
        <Streak key={i} {...l} width={width} color={color} />
      ))}
    </View>
  );
});

function Streak({ y, w, d, delay, width, color }: { y: number; w: number; d: number; delay: number; width: number; color: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration: d, easing: Easing.linear }), -1, false)));
    return () => cancelAnimation(t);
  }, [t, d, delay]);
  const style = useAnimatedStyle(() => ({ opacity: t.get() === 0 ? 0 : 0.55, transform: [{ translateX: width - t.get() * (width + w) }] }));
  return (
    <Animated.View style={[{ position: 'absolute', top: y, left: 0, width: w, height: 2, borderRadius: 1 }, style]}>
      <Svg width={w} height={2}>
        <Rect width={w} height={2} rx={1} fill={color} />
      </Svg>
    </Animated.View>
  );
}
