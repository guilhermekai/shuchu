import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { alert } from '../src/lib/alert';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { heroById } from '../src/data/characters';
import { sceneById } from '../src/data/scenes';
import { HeroSprite } from '../src/chibi/HeroSprite';
import { Scenery, GROUND_Y, SCENE_TH } from '../src/scenes/Scenery';
import { MotionStreaks } from '../src/components/effects';
import { Button, JP, T } from '../src/components/ui';
import { arcOf, useStore } from '../src/state/store';
import { motion, radius, space, useTheme } from '../src/theme/tokens';

const FINAL_STRETCH_MS = 60_000;

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function Focus() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const store = useStore();
  const active = store.active;
  const reduced = useReducedMotion();
  const [now, setNow] = useState(Date.now());
  const finished = useRef(false);

  const remaining = active ? active.endsAt - now : 0;
  const total = active ? active.minutes * 60_000 : 1;
  const finalStretch = remaining <= FINAL_STRETCH_MS && remaining > 0;

  // Clock ticks 4×/s for the label only. Progress bar runs on the UI thread.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setNow(Date.now()));
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const summary = store.complete();
    if (summary) router.replace({ pathname: '/success', params: { s: JSON.stringify(summary) } });
  }, [store]);

  useEffect(() => {
    if (!active && !finished.current) router.back();
    else if (active && remaining <= 0) finish();
  }, [active, remaining, finish]);

  // Progress: one linear timing from current progress to 1 over what's left.
  const progress = useSharedValue(0);
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

  const giveUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    alert('Abandon training?', `${hero.name} will head home. No onigiri for this session.`, [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Abandon',
        style: 'destructive',
        onPress: () => {
          finished.current = true;
          store.abandon();
          router.back();
        },
      },
    ]);
  };

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
            <JP size={11} color={scene.dark ? '#FFFFFFB0' : '#5E5B66'}>第{arc}章 · 第{episode}話</JP>
            <T v="headline" color={ink} numberOfLines={1}>{active.task}</T>
          </View>
        </View>
      </Scenery>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
        <View style={{ alignItems: 'center' }}>
          <T v="footnote" color="secondary">
            {finalStretch ? 'Final stretch!' : `${hero.name} is training · ${scene.name}`}
          </T>
          <Pressable
            delayLongPress={600}
            onLongPress={__DEV__ ? store.fastForward : undefined}
            accessibilityLabel={`${Math.ceil(remaining / 60000)} minutes remaining`}
          >
            <T v="largeTitle" style={styles.clock}>{fmt(remaining)}</T>
          </Pressable>
        </View>

        <View style={[styles.track, { backgroundColor: t.border, width: trackW }]}>
          <Animated.View style={[styles.fill, { backgroundColor: finalStretch ? t.sakura : t.accent, width: trackW }, fillStyle]} />
        </View>
        <View style={styles.trackLabels}>
          <T v="caption" color="tertiary">Arc {arc} · Episode {episode}</T>
          <T v="caption" color="tertiary">{active.minutes} min</T>
        </View>

        {finalStretch && !reduced ? (
          <Animated.View entering={FadeIn.duration(220).easing(motion.easeOut)}>
            <JP size={15} color={t.sakura} style={{ textAlign: 'center' }}>あと少し！</JP>
          </Animated.View>
        ) : (
          <View style={{ height: 20 }} />
        )}

        <Button label="Abandon" kind="ghost" onPress={giveUp} haptic="selection" style={{ alignSelf: 'center' }} />
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
