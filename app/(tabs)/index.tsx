import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { heroById } from '../../src/data/characters';
import { SCENES, sceneById } from '../../src/data/scenes';
import { HeroSprite } from '../../src/chibi/HeroSprite';
import { Scenery, GROUND_Y, SCENE_TH } from '../../src/scenes/Scenery';
import { Button, Chip, JP, OnigiriBalance, Panel, PressableScale, T } from '../../src/components/ui';
import { arcOf, EPISODES_PER_ARC, streakOf, useStore } from '../../src/state/store';
import { radius, space, type, useTheme } from '../../src/theme/tokens';

const DURATIONS = __DEV__ ? [1, 15, 25, 45, 60] : [15, 25, 45, 60];

export default function FocusSetup() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const store = useStore();
  const [task, setTask] = useState('');
  const hero = heroById(store.heroId);
  const scene = sceneById(store.sceneId);
  const { arc, episode } = arcOf(store.sessions.length);
  const streak = streakOf(store.sessions);

  // Resume an in-flight session (app was killed or backgrounded mid-focus).
  useEffect(() => {
    if (store.hydrated && store.active) router.push('/focus');
  }, [store.hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const stageW = width - space.md * 2;
  const stageH = 220;
  const heroSize = 92;
  const ground = (GROUND_Y[store.sceneId] / SCENE_TH) * stageH;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + space.xs, paddingBottom: insets.bottom + 96, paddingHorizontal: space.md }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <JP size={13} color={t.accent}>集中</JP>
            <T v="largeTitle">Shūchū</T>
          </View>
          <OnigiriBalance amount={store.onigiri} />
        </View>

        {/* Training arc */}
        <View style={[styles.arcRow]}>
          <View style={{ flex: 1 }}>
            <T v="footnote" color="secondary">Training Arc {arc}</T>
            <T v="headline">Episode {episode} of {EPISODES_PER_ARC}</T>
          </View>
          <View style={styles.pips} accessibilityLabel={`${episode - 1} of ${EPISODES_PER_ARC} episodes cleared`}>
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
            <View style={[styles.streak, { backgroundColor: t.accentSoft }]}>
              <T v="footnote" color="accent" style={{ fontWeight: '700' }}>{streak}日</T>
            </View>
          )}
        </View>

        {/* Stage */}
        <Panel style={{ marginBottom: space.lg }}>
          <PressableScale onPress={() => router.navigate('/heroes')} accessibilityLabel={`${hero.name}, change hero`} accessibilityRole="button" style={{ transform: [] }}>
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
        <T v="headline" style={styles.label}>Today’s mission</T>
        <TextInput
          value={task}
          onChangeText={setTask}
          placeholder="What are you training?"
          placeholderTextColor={t.textTertiary}
          returnKeyType="done"
          maxLength={60}
          style={[styles.input, type.body, { color: t.text, backgroundColor: t.surface, borderColor: t.border }]}
        />

        {/* Duration */}
        <T v="headline" style={styles.label}>Duration</T>
        <View style={styles.row}>
          {DURATIONS.map((m) => (
            <Chip key={m} grow label={`${m}m`} selected={store.minutes === m} onPress={() => store.setMinutes(m)} />
          ))}
        </View>

        {/* Scenery */}
        <T v="headline" style={styles.label}>Scenery</T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={{ marginHorizontal: -space.md }}>
          <View style={{ width: space.md - space.xs }} />
          {SCENES.map((s) => (
            <Chip key={s.id} label={s.name} sub={s.jp} selected={store.sceneId === s.id} onPress={() => store.setScene(s.id)} />
          ))}
          <View style={{ width: space.md - space.xs }} />
        </ScrollView>
      </ScrollView>

      {/* Start */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + space.sm, backgroundColor: t.bg }]}>
        <Button
          label={`Begin ${store.minutes}-minute training`}
          onPress={() => {
            store.start(task.trim() || 'Focus training');
            router.push('/focus');
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: space.md },
  arcRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { width: 14, height: 18, borderWidth: 2, borderRadius: 3, transform: [{ skewX: '-12deg' }] },
  streak: { paddingHorizontal: 10, height: 28, borderRadius: radius.pill, justifyContent: 'center' },
  stageTag: { position: 'absolute', left: space.sm, top: space.sm, flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  label: { marginBottom: space.xs, marginTop: space.xs },
  input: { height: 50, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space.md, marginBottom: space.md },
  row: { flexDirection: 'row', gap: space.xs, flexWrap: 'nowrap', marginBottom: space.md },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, paddingTop: space.sm },
});

