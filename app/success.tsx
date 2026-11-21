/**
 * Mission Complete — the anime power-up moment. Rare tier: this is where the delight budget lives.
 *
 * Timeline (ms) — one causal beat, everything else hangs off it:
 *    0  aura blooms behind hero (500, ease-out) · speed lines fade in, then drift-rotate
 *   80  hero rises into frame (450, ease-out) and starts cheering
 *  160  white power-up flash (60 in / 260 out)
 *  220  sakura petal burst from the hero + sparkle pops (staggered 60)
 *  420  ★ "Mission Complete!" title card slams in (300, ease-out) — success haptic on this frame
 *  640  reward panel → arc panel → streak panel, 80ms stagger (300, ease-out)
 *  760  onigiri counter rolls 0 → total (800, ease-out) — one light impact when it lands
 * 1250  arc pip for this episode pops in
 * 1300  actions fade in
 * Reduced motion: no flash, burst, slam, rotation or rise — just opacity fades; counter shows the total.
 */
import { useEffect, useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, useWindowDimensions, View, type TextStyle } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from '../src/lib/haptics';
import { HEROES } from '../src/data/characters';
import { HeroSprite } from '../src/chibi/HeroSprite';
import { Aura, PetalBurst, Sparkle, SpeedLines } from '../src/components/effects';
import { Button, JP, Onigiri, Panel, T } from '../src/components/ui';
import { EPISODES_PER_ARC, useStore, type CompletionSummary } from '../src/state/store';
import { useI18n } from '../src/i18n';
import { light, motion, radius, space, ThemeOverride, type } from '../src/theme/tokens';

const AnimatedText = Animated.createAnimatedComponent(TextInput);

const BG: [string, string, string] = ['#1A1030', '#2B1647', '#120B22'];

export default function Success() {
  const { s } = useLocalSearchParams<{ s: string }>();
  // Params can come from a deep link or an edited URL: never trust them to parse.
  const data = useMemo(() => {
    try {
      const d = JSON.parse(s ?? 'null') as CompletionSummary | null;
      return d && typeof d.reward?.total === 'number' && HEROES.some((h) => h.id === d.heroId) ? d : null;
    } catch {
      return null;
    }
  }, [s]);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const L = useI18n().t.success;
  const store = useStore();

  const aura = useSharedValue(0);
  const rise = useSharedValue(0);
  const flash = useSharedValue(0);
  const title = useSharedValue(0);
  const count = useSharedValue(0);

  useEffect(() => {
    if (!data) return;
    const out = motion.easeOut;
    if (reduced) {
      aura.set(withTiming(1, { duration: 300 }));
      rise.set(withTiming(1, { duration: 300 }));
      title.set(withDelay(200, withTiming(1, { duration: 250 })));
      count.set(data.reward.total);
      const h = setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 200);
      return () => clearTimeout(h);
    }
    aura.set(withTiming(1, { duration: 500, easing: out }));
    rise.set(withDelay(80, withTiming(1, { duration: 450, easing: out })));
    flash.set(withDelay(160, withSequence(withTiming(0.5, { duration: 60 }), withTiming(0, { duration: 260, easing: out }))));
    title.set(withDelay(420, withTiming(1, { duration: 300, easing: out })));
    count.set(
      withDelay(
        560,
        withTiming(data.reward.total, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) }, (done) => {
          'worklet';
          if (done) scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Light);
        }),
      ),
    );
    // Haptic on the same frame the title lands.
    const h = setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 420);
    return () => clearTimeout(h);
  }, [data, reduced, aura, rise, flash, title, count]);

  const auraStyle = useAnimatedStyle(() => ({ opacity: aura.get(), transform: [{ scale: interpolate(aura.get(), [0, 1], [0.6, 1]) }] }));
  const heroStyle = useAnimatedStyle(() => ({
    opacity: rise.get(),
    transform: reduced ? [] : [{ translateY: interpolate(rise.get(), [0, 1], [40, 0]) }, { scale: interpolate(rise.get(), [0, 1], [0.92, 1]) }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.get() }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: title.get(),
    transform: reduced
      ? [{ rotate: '-2deg' }]
      : [{ scale: interpolate(title.get(), [0, 1], [1.18, 1]) }, { rotate: `${interpolate(title.get(), [0, 1], [-6, -2])}deg` }],
  }));
  const countProps = useAnimatedProps(() => {
    const v = `+${Math.round(count.get())}`;
    return { text: v, defaultValue: v } as never;
  });

  if (!data) return <Redirect href="/" />;

  // The panels and buttons need ~470pt; the stage takes what's left (but never under 170).
  const stageH = Math.max(170, Math.min(340, height * 0.42, height - insets.top - insets.bottom - 470));
  const heroSize = Math.min(150, width * 0.38, stageH * 0.62);
  const cx = width / 2;
  const cy = insets.top + stageH * 0.55;
  const sparkles = [
    [-0.36, -0.2, 22, 260], [0.34, -0.28, 16, 320], [-0.28, 0.22, 14, 380], [0.38, 0.12, 20, 440], [0.05, -0.42, 12, 500], [-0.44, -0.02, 10, 560],
  ] as const;
  // Web: opacity only. Chromium can leave a stale paint of translated layers after the
  // layout animation ends, which drew one panel over another in the preview.
  const enter = (i: number) =>
    reduced || Platform.OS === 'web'
      ? FadeIn.delay((reduced ? 400 : 450) + i * 70).duration(reduced ? 250 : 300)
      : FadeInDown.delay(450 + i * 70).duration(300).easing(motion.easeOut).withInitialValues({ transform: [{ translateY: 12 }] });

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={BG} style={StyleSheet.absoluteFill} />

      {/* Stage */}
      <View style={{ height: insets.top + stageH }}>
        <Animated.View style={[styles.center, { left: cx - width * 0.8, top: cy - width * 0.8, width: width * 1.6, height: width * 1.6 }, auraStyle]}>
          <SpeedLines size={width * 1.6} color="#FFFFFF" opacity={0.1} />
        </Animated.View>
        <Animated.View style={[styles.center, { left: cx - 170, top: cy - 170 }, auraStyle]}>
          <Aura size={340} color="#FF8FB1" />
        </Animated.View>
        <Animated.View style={[styles.center, { left: cx - 90, top: cy - 90 }, auraStyle]}>
          <Aura size={180} color="#FFE9A8" />
        </Animated.View>

        <Animated.View style={[{ position: 'absolute', left: cx - heroSize / 2, top: cy - heroSize * 0.72 }, heroStyle]}>
          <HeroSprite heroId={data.heroId} mode={reduced ? 'idle' : 'cheer'} size={heroSize} />
        </Animated.View>

        {sparkles.map(([dx, dy, size, delay], i) => (
          <Sparkle key={i} x={cx + dx * width} y={cy + dy * stageH} size={size} delay={delay} twinkle={i % 2 === 0} />
        ))}
        <PetalBurst cx={cx} cy={cy} delay={220} spread={width * 0.55} />
      </View>

      {/* Title card */}
      <Animated.View style={[styles.titleWrap, titleStyle]}>
        <View style={styles.titleCard}>
          <JP size={13} color="#E5483B" style={{ textAlign: 'center' }}>任務完了</JP>
          <T v="title1" color="#1B1A1F" style={styles.title} header>{L.title}</T>
        </View>
        {data.arcCleared && <ArcStamp arc={data.arc} reduced={reduced} />}
      </Animated.View>

      {/* Panels */}
      <ThemeOverride value={light}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.panels, { paddingBottom: insets.bottom + space.md }]} bounces={false}>
        <Animated.View entering={enter(0)}>
          <Panel tone="gold">
            <View style={styles.rewardRow}>
              <Onigiri size={40} />
              <View style={{ flex: 1 }} accessible accessibilityLabel={L.earnedA11y(data.reward.total)}>
                <T v="footnote" color="secondary">{L.earned}</T>
                <AnimatedText
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  editable={false}
                  animatedProps={countProps}
                  defaultValue={reduced ? `+${data.reward.total}` : '+0'}
                  style={[type.title1 as TextStyle, styles.counter, { color: light.text }]}
                />
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Line label={L.focusLine(data.minutes)} value={data.reward.base} />
                {data.reward.streakBonus > 0 && <Line label={L.streakBonus} value={data.reward.streakBonus} />}
                {data.reward.arcBonus > 0 && <Line label={L.arcFinale} value={data.reward.arcBonus} />}
              </View>
            </View>
          </Panel>
        </Animated.View>

        {/* flexShrink 0: when the screen is short the list scrolls instead of squashing this row */}
        <View style={{ flexDirection: 'row', gap: space.sm, flexShrink: 0 }}>
          <Animated.View entering={enter(1)} style={{ flexGrow: 1.4, flexBasis: 0 }}>
            <Panel style={{ flexGrow: 1 }}>
              <View style={styles.small}>
                <T v="footnote" color="secondary">{data.arcCleared ? L.arcComplete(data.arc) : L.arc(data.arc)}</T>
                <T v="headline">{L.episodeCleared(data.episode)}</T>
                <View style={styles.pips}>
                  {Array.from({ length: EPISODES_PER_ARC }).map((_, i) => (
                    <Pip key={i} ink={light.panelStroke} filled={i < data.episode - 1} fresh={i === data.episode - 1} reduced={reduced} />
                  ))}
                </View>
              </View>
            </Panel>
          </Animated.View>
          <Animated.View entering={enter(2)} style={{ flexGrow: 1, flexBasis: 0 }}>
            <Panel tone="accent" style={{ flexGrow: 1 }}>
              <View style={styles.small}>
                <T v="footnote" color="secondary">{L.streak}</T>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <T v="title1" color="#E5483B" style={{ fontVariant: ['tabular-nums'] }}>{data.streak}</T>
                  <JP size={15} color="#E5483B">日</JP>
                </View>
                <T v="caption" color="secondary">{data.streak === 1 ? L.dayOne : L.daysInARow}</T>
              </View>
            </Panel>
          </Animated.View>
        </View>

        <Animated.View entering={reduced ? FadeIn.delay(500) : FadeIn.delay(900).duration(220)} style={{ gap: space.xs, marginTop: space.xs }}>
          {/* dismissTo pops back to the existing tabs instead of stacking a new copy */}
          {/* Pomodoro rhythm: a short break, or a long one after the arc's 4th episode */}
          <Button
            label={data.arcCleared ? L.longBreak(store.longBreak) : L.shortBreak(store.shortBreak)}
            onPress={() => {
              store.startBreak(data.arcCleared);
              router.replace('/focus');
            }}
          />
          <View style={{ flexDirection: 'row', gap: space.xs }}>
            <Button label={L.toMatsuri} kind="ghost" color="#FFFFFF" onPress={() => router.dismissTo('/matsuri')} haptic="selection" containerStyle={{ flex: 1 }} />
            <Button label={L.done} kind="ghost" color="#FFFFFFCC" onPress={() => router.dismissTo('/')} haptic="selection" containerStyle={{ flex: 1 }} />
          </View>
        </Animated.View>
      </ScrollView>
      </ThemeOverride>

      {/* Flash covers the stage only, so the panels never wash out */}
      <Animated.View style={[styles.flash, { height: insets.top + stageH }, flashStyle]} pointerEvents="none" />
    </View>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <T v="caption" color="secondary">
      {label} <T v="caption" style={{ fontWeight: '700' }}>+{value}</T>
    </T>
  );
}

function Pip({ filled, fresh, reduced, ink }: { filled: boolean; fresh: boolean; reduced: boolean; ink: string }) {
  const v = useSharedValue(fresh && !reduced ? 0 : 1);
  useEffect(() => {
    if (fresh && !reduced) v.set(withDelay(1250, withTiming(1, { duration: 280, easing: motion.easeOut })));
  }, [fresh, reduced, v]);
  const style = useAnimatedStyle(() => ({ opacity: v.get(), transform: [{ scale: interpolate(v.get(), [0, 1], [0.6, 1]) }] }));
  return (
    <View style={[styles.pip, { borderColor: ink }]}>
      {(filled || fresh) && <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: fresh ? '#F07C9A' : '#E5483B' }, style]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { alignItems: 'center', marginTop: -space.xxl, marginBottom: space.sm, zIndex: 2 },
  flash: { position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: '#FFFFFF' },
  stamp: { position: 'absolute', right: space.lg, top: -space.lg, borderWidth: 2.5, borderColor: '#C73A2E', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#FFF7F2' },
  titleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#1B1A1F',
    borderRadius: radius.sm,
    paddingHorizontal: space.xl,
    paddingVertical: space.xs,
    shadowColor: '#E5483B',
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 5, height: 5 },
  },
  title: { fontFamily: undefined, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' },
  panels: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: space.md, gap: space.sm },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md },
  counter: { padding: 0, margin: 0, fontVariant: ['tabular-nums'] },
  small: { padding: space.md, gap: 2 },
  pips: { flexDirection: 'row', gap: 5, marginTop: space.xs },
  pip: { width: 16, height: 20, borderWidth: 2, borderRadius: 3, overflow: 'hidden', transform: [{ skewX: '-12deg' }] },
});


/** Arc finale gets its own beat: a hanko-style stamp that thumps onto the title card. */
function ArcStamp({ arc, reduced }: { arc: number; reduced: boolean }) {
  const v = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    v.set(withDelay(760, withTiming(1, { duration: 220, easing: motion.easeOut })));
    const h = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 760 + 220);
    return () => clearTimeout(h);
  }, [reduced, v]);
  const style = useAnimatedStyle(() => ({
    opacity: v.get(),
    transform: [{ scale: interpolate(v.get(), [0, 1], [1.6, 1]) }, { rotate: '12deg' }],
  }));
  return (
    <Animated.View style={[styles.stamp, style]} pointerEvents="none">
      <JP size={15} color="#C73A2E">第{arc}章 完</JP>
    </Animated.View>
  );
}
