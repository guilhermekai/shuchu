import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { heroById } from '../../src/data/characters';
import { SCENES, sceneById } from '../../src/data/scenes';
import { HeroSprite } from '../../src/chibi/HeroSprite';
import { Scenery, GROUND_Y, SCENE_TH } from '../../src/scenes/Scenery';
import { Button, Chip, JP, OnigiriBalance, Panel, PressableScale, T, useTabScrollInsets } from '../../src/components/ui';
import { arcOf, EPISODES_PER_ARC, streakOf, useStore } from '../../src/state/store';
import { radius, space, type, useTheme } from '../../src/theme/tokens';
import { useI18n } from '../../src/i18n';
import Svg, { Circle, Path } from 'react-native-svg';

const DURATIONS = __DEV__ ? [1, 15, 25, 45, 60] : [15, 25, 45, 60];

export default function FocusSetup() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const store = useStore();
  const i18n = useI18n();
  const L = i18n.t.setup;
  const [task, setTask] = useState('');
  const scrollInsets = useTabScrollInsets();
  // Ignore a second tap on Begin until this session is over (two taps = two Focus screens).
  const starting = useRef(false);
  useEffect(() => {
    if (!store.active) starting.current = false;
  }, [store.active]);
  const begin = () => {
    if (starting.current || store.active) {
      router.navigate('/focus');
      return;
    }
    starting.current = true;
    store.start(task.trim() || L.defaultTask);
    setTask('');
    router.navigate('/focus');
  };
  const hero = heroById(store.heroId);
  const scene = sceneById(store.sceneId);
  const { arc, episode } = arcOf(store.sessions.length);
  const streak = streakOf(store.sessions);

  // Resume an in-flight session (app was killed or backgrounded mid-focus).
  useEffect(() => {
    if (store.hydrated && store.active) router.push('/focus');
  }, [store.hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const stageW = width - space.md * 2;
  const stageH = 180;
  const heroSize = 92;
  const ground = (GROUND_Y[store.sceneId] / SCENE_TH) * stageH;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ paddingTop: scrollInsets.top + space.xs, paddingBottom: space.xl, paddingHorizontal: space.md }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <JP size={13} color={t.accent}>集中</JP>
            <T v="largeTitle">Shūchū</T>
          </View>
          <View style={styles.headerRight}>
            <OnigiriBalance amount={store.onigiri} />
            <PressableScale
              onPress={() => router.push('/settings')}
              haptic="selection"
              accessibilityRole="button"
              accessibilityLabel={L.settings}
              style={[styles.iconButton, { backgroundColor: t.surface, borderColor: t.border }]}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Circle cx="12" cy="12" r="3" stroke={t.text} strokeWidth={1.8} fill="none" />
                <Path
                  d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"
                  stroke={t.text}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              </Svg>
            </PressableScale>
          </View>
        </View>

        {/* Training arc */}
        <View style={[styles.arcRow]}>
          <View style={{ flex: 1 }}>
            <T v="footnote" color="secondary">{L.arc(arc)}</T>
            <T v="headline">{L.episode(episode, EPISODES_PER_ARC)}</T>
          </View>
          <View style={styles.pips} accessible accessibilityLabel={L.episodesA11y(episode - 1, EPISODES_PER_ARC)}>
            {Array.from({ length: EPISODES_PER_ARC }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.pip,
                  { borderColor: t.panelStroke, backgroundColor: i < episode - 1 ? t.accent : i === episode - 1 ? t.accentSoft : 'transparent' },
                ]}
              />
            ))}
          </View>
          {streak > 0 && (
            <View style={[styles.streak, { backgroundColor: t.accentSoft }]} accessible accessibilityLabel={L.streakA11y(streak)}>
              <T v="footnote" color="accent" style={{ fontWeight: '700' }}>{streak}日</T>
            </View>
          )}
        </View>

        {store.hydrated && !store.introSeen && store.sessions.length === 0 && (
          <Panel tone="gold" style={{ marginBottom: space.md }}>
            <View style={styles.intro}>
              <T v="headline">{L.introTitle}</T>
              {L.intro.map((line, i) => (
                <View key={i} style={styles.introRow}>
                  <T v="subhead" color="accent" style={styles.introNum}>
                    {i + 1}
                  </T>
                  <T v="subhead" color="secondary" style={{ flex: 1 }}>
                    {line}
                  </T>
                </View>
              ))}
              <Button label={L.introDismiss} kind="secondary" onPress={store.dismissIntro} haptic="selection" style={{ minHeight: 44, marginTop: space.xs }} />
            </View>
          </Panel>
        )}

        {/* Stage */}
        <Panel style={{ marginBottom: space.lg }}>
          <PressableScale onPress={() => router.navigate('/heroes')} accessibilityLabel={L.changeHero(hero.name)} accessibilityRole="button" style={{ transform: [] }}>
            <Scenery sceneId={store.sceneId} width={stageW - 4} height={stageH} moving={false}>
              <View style={{ position: 'absolute', left: (stageW - heroSize) / 2, top: ground - heroSize * (160 / 120) + 4 }}>
                <HeroSprite heroId={store.heroId} mode="idle" size={heroSize} />
              </View>
              <View style={[styles.stageTag, { backgroundColor: scene.dark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.85)' }]}>
                <T v="footnote" color={scene.dark ? '#FFFFFF' : '#1B1A1F'} style={{ fontWeight: '600' }}>{hero.name}</T>
                <JP size={11} color={scene.dark ? '#FFFFFFAA' : '#5E5B66'}>{hero.archetypeJp}</JP>
              </View>
            </Scenery>
          </PressableScale>
        </Panel>

        {/* Task */}
        <T v="headline" style={styles.label}>{L.mission}</T>
        <TextInput
          value={task}
          onChangeText={setTask}
          placeholder={L.missionPlaceholder}
          accessibilityLabel={L.mission}
          placeholderTextColor={t.textTertiary}
          returnKeyType="done"
          maxLength={60}
          style={[styles.input, type.body, { color: t.text, backgroundColor: t.surface, borderColor: t.border }]}
        />

        {/* Duration */}
        <T v="headline" style={styles.label}>{L.duration}</T>
        <View style={styles.row}>
          {DURATIONS.map((m) => (
            <Chip key={m} grow label={String(m)} sub="min" selected={store.minutes === m} onPress={() => store.setMinutes(m)} />
          ))}
        </View>

        {/* Scenery */}
        <T v="headline" style={styles.label}>{L.scenery}</T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={{ marginHorizontal: -space.md }}>
          <View style={{ width: space.md - space.xs }} />
          {SCENES.map((s) => (
            <Chip key={s.id} label={i18n.sceneName(s.id)} sub={s.jp} selected={store.sceneId === s.id} onPress={() => store.setScene(s.id)} />
          ))}
          <View style={{ width: space.md - space.xs }} />
        </ScrollView>

        <Button label={store.active ? L.resume : L.begin(store.minutes)} onPress={begin} style={{ marginTop: space.xs }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: space.md },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  arcRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { width: 14, height: 18, borderWidth: 2, borderRadius: 3, transform: [{ skewX: '-12deg' }] },
  streak: { paddingHorizontal: 10, minHeight: 28, borderRadius: radius.pill, justifyContent: 'center' },
  stageTag: { position: 'absolute', left: space.sm, top: space.sm, flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  label: { marginBottom: space.xs, marginTop: space.xs },
  input: { minHeight: 50, paddingVertical: space.sm, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space.md, marginBottom: space.md },
  row: { flexDirection: 'row', gap: space.xs, flexWrap: 'nowrap', marginBottom: space.md },
  intro: { padding: space.md, gap: space.xs },
  introRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  introNum: { width: 16, fontWeight: '700' },
});

