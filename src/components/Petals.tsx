/** Ambient falling sakura petals (or neon rain). Purely decorative, UI-thread only. */
import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

type Props = { count: number; width: number; height: number; variant?: 'sakura' | 'rain' };

// Deterministic pseudo-random so petals don't reshuffle between renders.
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const Petals = memo(function Petals({ count, width, height, variant = 'sakura' }: Props) {
  const reduced = useReducedMotion();
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: rand(i, 1) * width,
        delay: rand(i, 2) * (variant === 'rain' ? 1400 : 6000),
        duration: variant === 'rain' ? 900 + rand(i, 3) * 500 : 5200 + rand(i, 3) * 3600,
        size: variant === 'rain' ? 14 + rand(i, 4) * 10 : 7 + rand(i, 4) * 6,
        sway: 14 + rand(i, 5) * 26,
        spin: rand(i, 6) > 0.5 ? 1 : -1,
      })),
    [count, width, variant],
  );
  if (reduced) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {petals.map((p, i) => (
        <Petal key={i} {...p} height={height} variant={variant} />
      ))}
    </View>
  );
});

function Petal({ x, delay, duration, size, sway, spin, height, variant }: { x: number; delay: number; duration: number; size: number; sway: number; spin: number; height: number; variant: 'sakura' | 'rain' }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false)));
    return () => cancelAnimation(t);
  }, [t, delay, duration]);

  const style = useAnimatedStyle(() => {
    const v = t.get();
    if (variant === 'rain') {
      return { opacity: v === 0 ? 0 : 0.5, transform: [{ translateX: x - v * 30 }, { translateY: -30 + v * (height + 60) }, { rotate: '12deg' }] };
    }
    return {
      opacity: v === 0 ? 0 : v < 0.1 ? v * 10 : v > 0.9 ? (1 - v) * 10 : 1,
      transform: [
        { translateX: x + Math.sin(v * Math.PI * 3) * sway - v * 40 },
        { translateY: -20 + v * (height + 40) },
        { rotate: `${spin * v * 540}deg` },
        { scaleX: 0.6 + Math.abs(Math.cos(v * Math.PI * 4)) * 0.4 },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, style]}>
      <Svg width={variant === 'rain' ? 2 : size} height={size} viewBox={variant === 'rain' ? '0 0 2 20' : '0 0 10 10'}>
        {variant === 'rain' ? (
          <Rect x="0" y="0" width="2" height="20" rx="1" fill="#9FD8FF" />
        ) : (
          <Path d="M5 0 Q10 3 8 7 Q6 10 5 8.5 Q4 10 2 7 Q0 3 5 0 Z" fill="#FFB0C4" />
        )}
      </Svg>
    </Animated.View>
  );
}
