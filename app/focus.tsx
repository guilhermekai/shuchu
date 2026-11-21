import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router, usePreventRemove } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from '../src/lib/haptics';
import { alert } from '../src/lib/alert';
import { useI18n } from '../src/i18n';
import { heroById } from '../src/data/characters';
import { sceneById } from '../src/data/scenes';
import { HeroSprite } from '../src/chibi/HeroSprite';
import { Scenery, GROUND_Y, SCENE_TH } from '../src/scenes/Scenery';
import { MotionStreaks } from '../src/components/effects';
import { Button, JP, T } from '../src/components/ui';
import { arcOf, useStore, type CompletionSummary } from '../src/state/store';
import { motion, radius, space, useTheme } from '../src/theme/tokens';

const FINAL_STRETCH_MS = 60_000;

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * The only part of the screen that ticks. It re-renders 4×/s by itself and reports
 * two crossings to the parent: entering the final stretch, and reaching zero.
 */
const Countdown = memo(function Countdown({
  endsAt,
  onFinalStretch,
  onDone,
  onLongPress,
}: {
  endsAt: number;
  onFinalStretch: () => void;
  onDone: () => void;
  onLongPress?: () => void;
}) {
  const { t: L } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  const remaining = endsAt - now;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setNow(Date.now()));
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (remaining <= 0) onDone();
    else if (remaining <= FINAL_STRETCH_MS) onFinalStretch();
  }, [remaining, onDone, onFinalStretch]);

  const secs = Math.max(0, Math.ceil(remaining / 1000));
  return (
    <Pressable
      delayLongPress={600}
      onLongPress={onLongPress}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={L.focus.remainingA11y(Math.ceil(secs / 60))}
      accessibilityValue={{ text: fmt(remaining) }}
    >
      <T v="largeTitle" style={styles.clock}>
        {fmt(remaining)}
      </T>
    </Pressable>
  );
});

export default function Focus() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const store = useStore();
  const i18n = useI18n();
  const L = i18n.t.focus;
  const active = store.active;
  const reduced = useReducedMotion();
  const finished = useRef(false);
  const [finalStretch, setFinalStretch] = useState(false);
  const [summary, setSummary] = useState<CompletionSummary | null>(null);
  const [leaving, setLeaving] = useState(false);

  const leave = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/')), []);

  const onFinalStretch = useCallback(() => {
    setFinalStretch((was) => {
      if (!was) AccessibilityInfo.announceForAccessibility(L.finalStretch);
      return true;
    });
  }, [L.finalStretch]);

  const onDone = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const s = store.complete();
    if (s) {
      AccessibilityInfo.announceForAccessibility(i18n.t.success.title);
      setLeaving(true);
      setSummary(s);
    }
  }, [store, i18n.t.success.title]);

  // Navigate only after `leaving` has switched off the back-prevention below.
  useEffect(() => {
    if (!store.hydrated) return; // before hydration `active` is always null
    if (summary) router.replace({ pathname: '/success', params: { s: JSON.stringify(summary) } });
    else if (!active && !finished.current) leave();
    else if (!active && leaving) leave();
  }, [store.hydrated, summary, active, leaving, leave]);

  const confirmAbandon = useCallback(() => {
    if (!active) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    alert(L.abandonTitle, L.abandonBody(heroById(active.heroId).name), [
      { text: L.keepGoing, style: 'cancel' },
      {
        text: L.abandon,
        style: 'destructive',
        onPress: () => {
          if (finished.current) return; // the timer already finished while the dialog was open
          finished.current = true;
          setLeaving(true);
          store.abandon();
        },
      },
    ]);
  }, [active, L, store]);

  // Swipe-back is disabled on iOS; this catches Android back and the browser back button.
  usePreventRemove(!!active && !leaving, confirmAbandon);

  // Progress: one linear timing from current progress to 1 over what's left.
  const progress = useSharedValue(0);
  const total = active ? active.minutes * 60_000 : 1;
  useEffect(() => {
    if (!active) return;
    const p = Math.min(1, (Date.now() - active.startedAt) / total);
    progress.set(p);
    progress.set(withTiming(1, { duration: Math.max(0, active.endsAt - Date.now()), easing: Easing.linear }));
  }, [active, total, progress]);

  const trackW = width - space.xl * 2;
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (progress.get() - 1) * trackW }] }));

  if (!active) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  const hero = heroById(active.heroId);
  const scene = sceneById(active.sceneId);
  const { arc, episode } = arcOf(store.sessions.length);
  const sceneH = Math.round(height * 0.58);
  const heroSize = Math.min(150, width * 0.36);
  const ground = (GROUND_Y[active.sceneId] / SCENE_TH) * sceneH;
  const ink = scene.dark ? '#FFFFFF' : '#1B1A1F';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Scenery sceneId={active.sceneId} width={width} height={sceneH} moving speed={finalStretch ? 1.8 : 1}>
        {finalStretch && <MotionStreaks width={width} height={sceneH * 0.75} color={scene.dark ? '#FFFFFF' : '#1B1A1F'} />}
        <View style={{ position: 'absolute', left: (width - heroSize) / 2, top: ground - heroSize * (160 / 120) + 6 }}>
          <HeroSprite heroId={active.heroId} mode={finalStretch ? 'run' : 'walk'} size={heroSize} />
        </View>

        {/* Episode title card */}
        <View style={[styles.episode, { top: insets.top + space.sm }]}>
          <View style={[styles.episodeCard, { backgroundColor: scene.dark ? 'rgba(18,16,25,0.6)' : 'rgba(255,255,255,0.88)', borderColor: ink }]}>
            <JP size={11} color={scene.dark ? '#FFFFFFB0' : '#5E5B66'}>
              第{arc}章 · 第{episode}話
            </JP>
            <T v="headline" color={ink} numberOfLines={1}>
              {active.task}
            </T>
          </View>
        </View>
      </Scenery>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
        <View style={{ alignItems: 'center' }}>
          <T v="footnote" color="secondary">
            {finalStretch ? L.finalStretch : L.training(hero.name, i18n.sceneName(scene.id))}
          </T>
          <Countdown endsAt={active.endsAt} onFinalStretch={onFinalStretch} onDone={onDone} onLongPress={__DEV__ ? store.fastForward : undefined} />
        </View>

        <View
          style={[styles.track, { backgroundColor: t.border, width: trackW }]}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={L.arcEpisode(arc, episode)}
        >
          <Animated.View style={[styles.fill, { backgroundColor: finalStretch ? t.sakura : t.accent, width: trackW }, fillStyle]} />
        </View>
        <View style={styles.trackLabels}>
          <T v="caption" color="tertiary">{L.arcEpisode(arc, episode)}</T>
          <T v="caption" color="tertiary">{i18n.t.common.min(active.minutes)}</T>
        </View>

        {finalStretch ? (
          // Reduced motion keeps the words and drops only the fade.
          <Animated.View entering={reduced ? undefined : FadeIn.duration(220).easing(motion.easeOut)}>
            <JP size={15} color={t.sakura} style={{ textAlign: 'center' }}>
              あと少し！
            </JP>
          </Animated.View>
        ) : (
          <View style={{ height: 20 }} />
        )}

        <Button label={L.abandon} kind="ghost" onPress={confirmAbandon} haptic="selection" style={{ alignSelf: 'center' }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  episode: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: space.xl },
  episodeCard: { paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.md, borderWidth: 2, alignItems: 'center', maxWidth: '100%' },
  bottom: { flex: 1, justifyContent: 'space-between', paddingHorizontal: space.xl, paddingTop: space.lg },
  clock: { fontSize: 72, lineHeight: 80, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  track: { height: 10, borderRadius: 5, overflow: 'hidden', alignSelf: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 5 },
  trackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -space.sm },
});
