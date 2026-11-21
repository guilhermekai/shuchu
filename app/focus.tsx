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
 * While paused it shows the frozen time and reports nothing.
 */
const Countdown = memo(function Countdown({
  endsAt,
  pausedAt,
  onFinalStretch,
  onDone,
  onLongPress,
}: {
  endsAt: number;
  pausedAt: number | null;
  onFinalStretch?: () => void;
  onDone: () => void;
  onLongPress?: () => void;
}) {
  const { t: L } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  const remaining = endsAt - (pausedAt ?? now);

  useEffect(() => {
    if (pausedAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setNow(Date.now()));
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [pausedAt]);

  useEffect(() => {
    if (pausedAt) return;
    if (remaining <= 0) onDone();
    else if (remaining <= FINAL_STRETCH_MS) onFinalStretch?.();
  }, [pausedAt, remaining, onDone, onFinalStretch]);

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
      <T v="largeTitle" style={[styles.clock, pausedAt ? { opacity: 0.45 } : null]}>
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
  const isBreak = active?.kind === 'break';
  const paused = !!active?.pausedAt;
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

  const offerNextSession = useCallback(() => {
    alert(L.breakOverTitle, L.breakOverBody, [
      { text: L.later, style: 'cancel' },
      {
        text: L.nextSession,
        onPress: () => {
          store.start(i18n.t.setup.defaultTask);
          router.navigate('/focus');
        },
      },
    ]);
  }, [L, store, i18n.t.setup.defaultTask]);

  const onDone = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    if (isBreak) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AccessibilityInfo.announceForAccessibility(L.breakOverTitle);
      setLeaving(true);
      store.endBreak();
      offerNextSession();
      return;
    }
    const s = store.complete();
    if (s) {
      AccessibilityInfo.announceForAccessibility(i18n.t.success.title);
      setLeaving(true);
      setSummary(s);
    }
  }, [isBreak, store, i18n.t.success.title, L.breakOverTitle, offerNextSession]);

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

  const endBreak = useCallback(() => {
    finished.current = true;
    setLeaving(true);
    store.endBreak();
  }, [store]);

  // Swipe-back is disabled on iOS; this catches Android back and the browser back button.
  // A break can be left freely: it keeps running and Home offers to go back to it.
  usePreventRemove(!!active && !leaving && !isBreak, confirmAbandon);

  // Progress: frozen while paused, otherwise one linear timing to 1 over what's left.
  const progress = useSharedValue(0);
  const total = active ? active.minutes * 60_000 : 1;
  useEffect(() => {
    if (!active) return;
    const at = active.pausedAt ?? Date.now();
    progress.set(Math.min(1, (at - active.startedAt) / total));
    if (!active.pausedAt) progress.set(withTiming(1, { duration: Math.max(0, active.endsAt - Date.now()), easing: Easing.linear }));
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
  const stretch = finalStretch && !isBreak && !paused;
  const mode = isBreak || paused ? 'idle' : stretch ? 'run' : 'walk';
  const status = paused ? `${L.paused} · ${L.pausedHint(hero.name)}` : isBreak ? L.resting(hero.name) : stretch ? L.finalStretch : L.training(hero.name, i18n.sceneName(scene.id));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Scenery sceneId={active.sceneId} width={width} height={sceneH} moving={!isBreak && !paused} speed={stretch ? 1.8 : 1}>
        {stretch && <MotionStreaks width={width} height={sceneH * 0.75} color={scene.dark ? '#FFFFFF' : '#1B1A1F'} />}
        <View style={{ position: 'absolute', left: (width - heroSize) / 2, top: ground - heroSize * (160 / 120) + 6 }}>
          <HeroSprite heroId={active.heroId} mode={mode} size={heroSize} />
        </View>

        {/* Episode (or break) title card */}
        <View style={[styles.episode, { top: insets.top + space.sm }]}>
          <View style={[styles.episodeCard, { backgroundColor: scene.dark ? 'rgba(18,16,25,0.6)' : 'rgba(255,255,255,0.88)', borderColor: ink }]}>
            <JP size={11} color={scene.dark ? '#FFFFFFB0' : '#5E5B66'}>
              {isBreak ? '休憩' : `第${arc}章 · 第${episode}話`}
            </JP>
            <T v="headline" color={ink} numberOfLines={1}>
              {isBreak ? L.breakTitle : active.task}
            </T>
          </View>
        </View>
      </Scenery>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
        <View style={{ alignItems: 'center' }}>
          <T v="footnote" color="secondary" numberOfLines={1}>
            {status}
          </T>
          <Countdown
            endsAt={active.endsAt}
            pausedAt={active.pausedAt ?? null}
            onFinalStretch={isBreak ? undefined : onFinalStretch}
            onDone={onDone}
            onLongPress={__DEV__ ? store.fastForward : undefined}
          />
        </View>

        <View
          style={[styles.track, { backgroundColor: t.border, width: trackW }]}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={isBreak ? L.breakTitle : L.arcEpisode(arc, episode)}
        >
          <Animated.View style={[styles.fill, { backgroundColor: isBreak ? t.success : stretch ? t.sakura : t.accent, width: trackW }, fillStyle]} />
        </View>
        <View style={styles.trackLabels}>
          <T v="caption" color="tertiary">{isBreak ? L.breakTitle : L.arcEpisode(arc, episode)}</T>
          <T v="caption" color="tertiary">{i18n.t.common.min(active.minutes)}</T>
        </View>

        {stretch ? (
          // Reduced motion keeps the words and drops only the fade.
          <Animated.View entering={reduced ? undefined : FadeIn.duration(220).easing(motion.easeOut)}>
            <JP size={15} color={t.sakura} style={{ textAlign: 'center' }}>
              あと少し！
            </JP>
          </Animated.View>
        ) : (
          <View style={{ height: 20 }} />
        )}

        <View style={styles.actions}>
          <Button
            label={paused ? L.resume : L.pause}
            kind={paused ? 'primary' : 'secondary'}
            onPress={paused ? store.resume : store.pause}
            haptic="selection"
            containerStyle={styles.action}
          />
          {isBreak ? (
            <Button label={L.skipBreak} kind="ghost" onPress={endBreak} haptic="selection" containerStyle={styles.action} />
          ) : (
            <Button label={L.abandon} kind="ghost" onPress={confirmAbandon} haptic="selection" containerStyle={styles.action} />
          )}
        </View>
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
  actions: { flexDirection: 'row', gap: space.sm, justifyContent: 'center' },
  action: { minWidth: 140 },
});
