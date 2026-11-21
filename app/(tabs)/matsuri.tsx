import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { heroById } from '../../src/data/characters';
import { HeroSprite } from '../../src/chibi/HeroSprite';
import { Button, JP, Panel, PressableScale, T } from '../../src/components/ui';
import { todaysSessions, useStore, type Session } from '../../src/state/store';
import { motion, radius, space, useTheme } from '../../src/theme/tokens';

const VW = 800; // festival width in units
const VH = 460;

export default function Matsuri() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const store = useStore();
  const today = todaysSessions(store.sessions);
  const [picked, setPicked] = useState<string | null>(null);
  const pan = useRef<ScrollViewInstance>(null);

  const sceneH = 440;
  const s = sceneH / VH;
  const sceneW = VW * s;

  // One spot per guest; a hero who finished twice shows up once with a count.
  const guests = useMemo(() => {
    const byHero = new Map<string, Session[]>();
    today.forEach((x) => byHero.set(x.heroId, [...(byHero.get(x.heroId) ?? []), x]));
    return [...byHero.entries()].map(([heroId, list]) => ({ heroId: heroId as Session['heroId'], list, last: list[list.length - 1] }));
  }, [today]);
  const newest = today[today.length - 1]?.heroId;
  // Foreground spots, in front of the stalls and pool; alternate depth so a crowd reads as a crowd.
  const SPOTS = [400, 300, 500, 200, 610, 100, 710, 40];
  const pickedGuest = guests.find((g) => g.heroId === picked);
  const totalMin = today.reduce((a, x) => a + x.minutes, 0);

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}>
      <View style={{ height: sceneH + insets.top }}>
        <LinearGradient colors={['#0B0820', '#22143F', '#3A1E4F']} style={StyleSheet.absoluteFill} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={pan}
          onContentSizeChange={() => pan.current?.scrollTo({ x: (sceneW - width) / 2, animated: false })}
          style={{ marginTop: insets.top }}
          decelerationRate="fast"
        >
          <View style={{ width: sceneW, height: sceneH }}>
            <Fireworks s={s} />
            <Svg width={sceneW} height={sceneH} viewBox={`0 0 ${VW} ${VH}`} style={StyleSheet.absoluteFill}>
              <FestivalBackdrop />
            </Svg>
            <Lanterns s={s} />
            <Goldfish s={s} />

            {guests.map((g, i) => {
              const x = SPOTS[i % SPOTS.length] * s;
              const size = 78;
              return (
                <PressableScale
                  key={g.heroId}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPicked(picked === g.heroId ? null : g.heroId);
                  }}
                  style={{ position: 'absolute', left: x - size / 2, top: (428 - (i % 2) * 16) * s - size * (160 / 120), zIndex: 10 + (i % 2 ? 0 : 1) }}
                  accessibilityRole="button"
                  accessibilityLabel={`${heroById(g.heroId).name}, ${g.list.length} session${g.list.length > 1 ? 's' : ''}`}
                >
                  <HeroSprite heroId={g.heroId} size={size} mode={g.heroId === newest ? 'cheer' : 'idle'} offset={i * 0.21} />
                  <View style={[styles.nameTag, { borderColor: picked === g.heroId ? '#FFD27A' : 'transparent' }]}>
                    <T v="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>{heroById(g.heroId).name}</T>
                    {g.list.length > 1 && <T v="caption" color="#FFD27A">×{g.list.length}</T>}
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.overlay, { top: insets.top + space.xs }]} pointerEvents="none">
          <JP size={13} color="#FFB0C4">夏祭り</JP>
          <T v="largeTitle" color="#FFFFFF">Matsuri</T>
          <T v="footnote" color="#FFFFFFB3">
            {guests.length === 0 ? 'The festival opens after your first mission.' : `${guests.length} hero${guests.length > 1 ? 'es' : ''} celebrating · ${totalMin} min focused today`}
          </T>
        </View>
      </View>

      <View style={{ paddingHorizontal: space.md, paddingTop: space.lg, gap: space.sm }}>
        {pickedGuest && (
          <Animated.View key={pickedGuest.heroId} entering={FadeIn.duration(180).easing(motion.easeOut)}>
            <Panel tone="accent">
              <View style={{ padding: space.md, gap: 2 }}>
                <T v="headline">{heroById(pickedGuest.heroId).name} finished {pickedGuest.list.length} mission{pickedGuest.list.length > 1 ? 's' : ''}</T>
                {pickedGuest.list.map((x) => (
                  <T key={x.id} v="footnote" color="secondary">
                    {x.task} · {x.minutes} min · +{x.reward} onigiri
                  </T>
                ))}
              </View>
            </Panel>
          </Animated.View>
        )}

        {guests.length === 0 ? (
          <Panel>
            <View style={{ padding: space.lg, gap: space.sm, alignItems: 'flex-start' }}>
              <T v="headline">No guests yet tonight</T>
              <T v="subhead" color="secondary">Every hero who completes a focus session today comes to the festival.</T>
              <Button label="Start a session" onPress={() => router.navigate('/')} style={{ alignSelf: 'stretch', marginTop: space.xs }} />
            </View>
          </Panel>
        ) : (
          <>
            <T v="title3" style={{ marginTop: space.xs }}>Tonight's guests</T>
            {[...today].reverse().map((x) => (
              <View key={x.id} style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}>
                <View style={[styles.rowAvatar, { backgroundColor: t.accentSoft }]}>
                  <JP size={18} color={t.accent}>{heroById(x.heroId).kanji}</JP>
                </View>
                <View style={{ flex: 1 }}>
                  <T v="subhead" style={{ fontWeight: '600' }} numberOfLines={1}>{x.task}</T>
                  <T v="caption" color="secondary">
                    {heroById(x.heroId).name} · {x.minutes} min · {new Date(x.endedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </T>
                </View>
                <T v="footnote" style={{ fontWeight: '700' }}>+{x.reward}</T>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

// ── Static backdrop ──────────────────────────────────────────────────────────
function Stall({ x, label, color }: { x: number; label: string; color: string }) {
  return (
    <G transform={`translate(${x} 300)`}>
      <Rect x="-8" y="-58" width="6" height="104" fill="#5B3A29" />
      <Rect x="102" y="-58" width="6" height="104" fill="#5B3A29" />
      <Path d="M-18 -60 L50 -84 L118 -60 Z" fill={color} />
      <Rect x="-14" y="-60" width="128" height="26" fill="#FFF7EA" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
        <Rect key={k} x={-14 + k * 16} y="-60" width="8" height="26" fill={color} opacity={0.9} />
      ))}
      <Rect x="14" y="-30" width="72" height="18" rx="3" fill="#1B1A1F" />
      <SvgText x="50" y="-16" fontSize="13" fill="#FFD27A" textAnchor="middle" fontWeight="700">{label}</SvgText>
      <Rect x="-10" y="10" width="120" height="36" fill="#8B5E3C" />
      <Rect x="-10" y="10" width="120" height="5" fill="#A87850" />
      <Ellipse cx="50" cy="-2" rx="54" ry="10" fill="#FFD27A" opacity={0.18} />
    </G>
  );
}

function FestivalBackdrop() {
  return (
    <G>
      {[[60, 40], [140, 90], [230, 30], [330, 70], [470, 26], [560, 84], [650, 40], [740, 76], [700, 16], [100, 150], [520, 140]].map(([x, y], k) => (
        <Circle key={k} cx={x} cy={y} r={1.3} fill="#FFFFFF" opacity={0.6} />
      ))}
      {/* hills + trees */}
      <Path d="M0 300 Q120 230 240 270 Q330 220 420 260 Q540 210 640 262 Q720 236 800 270 L800 340 L0 340 Z" fill="#1A1233" />
      {[30, 90, 700, 760].map((x) => (
        <Path key={x} d={`M${x} 300 L${x + 22} 220 L${x + 44} 300 Z`} fill="#140E28" />
      ))}
      {/* torii */}
      <G transform="translate(400 330)">
        <Rect x="-70" y="-160" width="14" height="160" fill="#E5483B" />
        <Rect x="56" y="-160" width="14" height="160" fill="#E5483B" />
        <Rect x="-74" y="-12" width="22" height="12" fill="#1B1A1F" />
        <Rect x="52" y="-12" width="22" height="12" fill="#1B1A1F" />
        <Rect x="-86" y="-132" width="172" height="12" fill="#E5483B" />
        <Path d="M-104 -168 Q0 -158 104 -168 L98 -150 Q0 -144 -98 -150 Z" fill="#E5483B" />
        <Path d="M-108 -176 Q0 -164 108 -176 L104 -166 Q0 -156 -104 -166 Z" fill="#1B1A1F" />
        <Rect x="-14" y="-148" width="28" height="28" fill="#1B1A1F" />
        <SvgText x="0" y="-129" fontSize="14" fill="#FFD27A" textAnchor="middle" fontWeight="700">祭</SvgText>
      </G>
      {/* ground */}
      <Rect x="0" y="330" width="800" height="130" fill="#2A1A2E" />
      <Path d="M0 330 L800 330" stroke="#4A2E44" strokeWidth={3} />
      {[120, 300, 500, 690].map((x) => (
        <Ellipse key={x} cx={x} cy={360} rx={90} ry={16} fill="#FFB86B" opacity={0.08} />
      ))}
      {/* stone path toward torii */}
      <Path d="M360 460 L380 330 L420 330 L440 460 Z" fill="#3A2738" />
      <Stall x={30} label="たこ焼き" color="#E5483B" />
      <Stall x={180} label="金魚すくい" color="#3B5BDB" />
      <Stall x={530} label="りんご飴" color="#E5483B" />
      <Stall x={670} label="かき氷" color="#2BA3B8" />
      {/* goldfish pool */}
      <Rect x="176" y="368" width="116" height="34" rx="6" fill="#2F7FD0" stroke="#A9D6FF" strokeWidth={2} />
      <Line x1="186" y1="376" x2="282" y2="376" stroke="#A9D6FF" strokeWidth={1} opacity={0.4} />
    </G>
  );
}

// ── Lanterns: a string of chōchin swaying on their hooks ─────────────────────
function Lanterns({ s }: { s: number }) {
  const xs = Array.from({ length: 15 }, (_, i) => 20 + i * 55);
  const yAt = (x: number) => 64 + Math.sin((x / VW) * Math.PI) * 30;
  return (
    <>
      <Svg width={VW * s} height={140 * s} viewBox={`0 0 ${VW} 140`} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
        <Path d={`M0 60 Q400 ${60 + 60} 800 60`} stroke="#3B2A38" strokeWidth={2} fill="none" />
      </Svg>
      {xs.map((x, i) => (
        <Lantern key={x} x={x * s} y={yAt(x) * s} s={s} i={i} />
      ))}
    </>
  );
}

function Lantern({ x, y, s, i }: { x: number; y: number; s: number; i: number }) {
  const reduced = useReducedMotion();
  const r = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    const d = 2400 + (i % 4) * 300;
    r.set(withDelay(i * 120, withRepeat(withSequence(withTiming(1, { duration: d / 2, easing: motion.easeInOut }), withTiming(-1, { duration: d / 2, easing: motion.easeInOut })), -1, true)));
    return () => cancelAnimation(r);
  }, [i, reduced, r]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.get() * 5}deg` }] }));
  const w = 26 * s;
  const h = 44 * s;
  const red = i % 3 !== 1;
  return (
    <Animated.View style={[{ position: 'absolute', left: x - w / 2, top: y, width: w, height: h, transformOrigin: 'top' }, style]} pointerEvents="none">
      <Svg width={w} height={h} viewBox="0 0 26 44">
        <Line x1="13" y1="0" x2="13" y2="6" stroke="#3B2A38" strokeWidth={1.5} />
        <Ellipse cx="13" cy="24" rx="16" ry="16" fill={red ? '#FF7A5C' : '#FFE9A8'} opacity={0.25} />
        <Rect x="7" y="5" width="12" height="4" rx="1" fill="#1B1A1F" />
        <Ellipse cx="13" cy="22" rx="11" ry="13" fill={red ? '#E5483B' : '#FFF3D6'} />
        <Path d="M3 18 Q13 20 23 18 M2.5 24 Q13 26 23.5 24 M3 30 Q13 32 23 30" stroke={red ? '#B2302A' : '#E8CFA0'} strokeWidth={1} fill="none" />
        <Rect x="7" y="34" width="12" height="4" rx="1" fill="#1B1A1F" />
        <Line x1="13" y1="38" x2="13" y2="44" stroke="#E5483B" strokeWidth={2} />
      </Svg>
    </Animated.View>
  );
}

// ── Goldfish darting in the scooping pool ────────────────────────────────────
function Goldfish({ s }: { s: number }) {
  return (
    <>
      {[0, 1, 2].map((k) => (
        <Fish key={k} k={k} s={s} />
      ))}
    </>
  );
}

function Fish({ k, s }: { k: number; s: number }) {
  const reduced = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    v.set(withDelay(k * 500, withRepeat(withTiming(1, { duration: 2600 + k * 700, easing: motion.easeInOut }), -1, true)));
    return () => cancelAnimation(v);
  }, [k, reduced, v]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: v.get() * 70 * s }, { scaleX: v.get() > 0.5 ? 1 : -1 }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: (190 + k * 8) * s, top: (374 + k * 8) * s, width: 18 * s, height: 10 * s }, style]} pointerEvents="none">
      <Svg width={18 * s} height={10 * s} viewBox="0 0 18 10">
        <Ellipse cx="7" cy="5" rx="6" ry="3.5" fill={k === 1 ? '#FFFFFF' : '#FF7A3D'} />
        <Path d="M12 5 L18 1 L17 5 L18 9 Z" fill="#FF7A3D" />
      </Svg>
    </Animated.View>
  );
}

// ── Fireworks: a rising trail, then a ring of sparks, on a long loop ────────
function Fireworks({ s }: { s: number }) {
  const shows = [
    { x: 160, y: 90, color: '#FFB0C4', delay: 0, period: 4200 },
    { x: 610, y: 70, color: '#FFD27A', delay: 1300, period: 4600 },
    { x: 400, y: 50, color: '#7EEBFF', delay: 2500, period: 5200 },
    { x: 720, y: 140, color: '#C6A6FF', delay: 3400, period: 4800 },
  ];
  return (
    <>
      {shows.map((f, i) => (
        <Firework key={i} {...f} s={s} />
      ))}
    </>
  );
}

function Firework({ x, y, color, delay, period, s }: { x: number; y: number; color: string; delay: number; period: number; s: number }) {
  const reduced = useReducedMotion();
  const tt = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    tt.set(withDelay(delay, withRepeat(withTiming(1, { duration: period, easing: Easing.linear }), -1, false)));
    return () => cancelAnimation(tt);
  }, [delay, period, reduced, tt]);

  const RISE = 0.18; // fraction of the loop spent rising
  const BURST = 0.55; // fraction by which the burst has faded
  const trail = useAnimatedStyle(() => {
    const v = tt.get();
    const k = Math.min(v / RISE, 1);
    const eased = 1 - Math.pow(1 - k, 2);
    return { opacity: v > 0 && v < RISE ? 1 : 0, transform: [{ translateY: (1 - eased) * (330 - y) * s }] };
  });
  if (reduced) return null;
  const sparks = Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2);
  return (
    <View style={{ position: 'absolute', left: x * s, top: y * s }} pointerEvents="none">
      <Animated.View style={[styles.trail, { backgroundColor: color }, trail]} />
      {sparks.map((a, i) => (
        <Spark key={i} a={a} t={tt} color={color} s={s} rise={RISE} burst={BURST} long={i % 2 === 0} />
      ))}
    </View>
  );
}

function Spark({ a, t, color, s, rise, burst, long }: { a: number; t: SharedValue<number>; color: string; s: number; rise: number; burst: number; long: boolean }) {
  const R = (long ? 64 : 44) * s;
  const style = useAnimatedStyle(() => {
    const v = t.get();
    if (v < rise || v > burst) return { opacity: 0 };
    const k = (v - rise) / (burst - rise);
    const out = 1 - Math.pow(1 - k, 3);
    return {
      opacity: 1 - k * k,
      transform: [{ translateX: Math.cos(a) * R * out }, { translateY: Math.sin(a) * R * out + k * k * 14 * s }, { scale: 1 - k * 0.5 }],
    };
  });
  return <Animated.View style={[styles.spark, { backgroundColor: color, shadowColor: color }, style]} />;
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: space.md, right: space.md },
  nameTag: { flexDirection: 'row', gap: 3, alignSelf: 'center', marginTop: -2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm, borderRadius: radius.md, borderWidth: 1 },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  trail: { position: 'absolute', left: -1.5, top: -1.5, width: 3, height: 10, borderRadius: 1.5 },
  spark: { position: 'absolute', left: -2.5, top: -2.5, width: 5, height: 5, borderRadius: 2.5, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
});
