import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { alert } from '../../src/lib/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { HEROES, heroById, type Hero } from '../../src/data/characters';
import { itemById } from '../../src/data/shop';
import { HeroSprite } from '../../src/chibi/HeroSprite';
import { SpeedLines } from '../../src/components/effects';
import { JP, Onigiri, OnigiriBalance, Panel, PressableScale, T } from '../../src/components/ui';
import { useStore } from '../../src/state/store';
import { font, motion, radius, space, useTheme } from '../../src/theme/tokens';

export default function Heroes() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const store = useStore();
  const hero = heroById(store.heroId);
  const equipped = Object.values(store.equipped[store.heroId] ?? {}).map((id) => itemById(id!)?.name).filter(Boolean);
  const cardW = (width - space.md * 2 - space.sm) / 2;

  const onPick = (h: Hero) => {
    if (store.ownedHeroes.includes(h.id)) {
      if (h.id !== store.heroId) Haptics.selectionAsync();
      store.selectHero(h.id);
      return;
    }
    if (store.onigiri < h.cost) {
      alert(`${h.name} is locked`, `You need ${h.cost - store.onigiri} more onigiri. Finish a focus session to earn more.`);
      return;
    }
    alert(`Recruit ${h.name}?`, `${h.archetype} · ${h.cost} onigiri`, [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Recruit',
        onPress: () => {
          if (store.buyHero(h.id)) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: insets.top + space.xs, paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.md }}>
      <View style={styles.header}>
        <View>
          <JP size={13} color={t.accent}>仲間</JP>
          <T v="largeTitle">Heroes</T>
        </View>
        <OnigiriBalance amount={store.onigiri} />
      </View>

      {/* Featured */}
      <Panel style={{ marginBottom: space.xl }}>
        <View style={[styles.featured, { backgroundColor: t.accentSoft }]}>
          <View style={styles.featuredLines} pointerEvents="none">
            <SpeedLines size={420} color={t.accent} opacity={0.12} inner={0.28} />
          </View>
          <Text style={[styles.kanji, { color: t.accent }]}>{hero.kanji}</Text>
          {/* key forces a crossfade when the hero changes, rather than a hard swap */}
          <Animated.View key={hero.id} entering={FadeIn.duration(180).easing(motion.easeOut)} style={styles.featuredHero}>
            <HeroSprite heroId={hero.id} mode="idle" size={120} />
          </Animated.View>
          <View style={styles.featuredText}>
            <JP size={12} color={t.textSecondary}>{hero.archetypeJp}</JP>
            <T v="title2">{hero.name}</T>
            <T v="subhead" color="secondary">{hero.archetype}</T>
            <T v="footnote" color="secondary" style={{ marginTop: space.xs }}>{hero.tagline}</T>
            {equipped.length > 0 && (
              <T v="caption" color="tertiary" style={{ marginTop: space.xs }} numberOfLines={2}>
                Wearing {equipped.join(', ')}
              </T>
            )}
          </View>
        </View>
      </Panel>

      <T v="title3" style={{ marginBottom: space.sm }}>Roster</T>
      <View style={styles.grid}>
        {HEROES.map((h, i) => {
          const owned = store.ownedHeroes.includes(h.id);
          const selected = h.id === store.heroId;
          return (
            <PressableScale
              key={h.id}
              onPress={() => onPick(h)}
              style={{ width: cardW }}
              accessibilityRole="button"
              accessibilityLabel={`${h.name}, ${h.archetype}${owned ? (selected ? ', selected' : '') : `, locked, ${h.cost} onigiri`}`}
            >
              <Panel tilt={i % 2 ? 0.6 : -0.6} tone={selected ? 'accent' : 'surface'}>
                <View style={styles.card}>
                  <Text style={[styles.cardKanji, { color: t.text }]}>{h.kanji}</Text>
                  <View style={{ alignItems: 'center', opacity: owned ? 1 : 0.35 }}>
                    <HeroSprite heroId={h.id} mode="idle" size={74} offset={i * 0.13} showPet={false} />
                  </View>
                  <View style={styles.cardFooter}>
                    <View style={{ flex: 1 }}>
                      <T v="headline">{h.name}</T>
                      <T v="caption" color="secondary">{h.archetype}</T>
                    </View>
                    {!owned ? (
                      <View style={[styles.price, { backgroundColor: t.goldSoft }]}>
                        <Onigiri size={13} />
                        <T v="caption" style={{ fontWeight: '700' }}>{h.cost}</T>
                      </View>
                    ) : selected ? (
                      <View style={[styles.price, { backgroundColor: t.accent }]}>
                        <T v="caption" color="onAccent" style={{ fontWeight: '700' }}>Active</T>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Panel>
            </PressableScale>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: space.md },
  featured: { flexDirection: 'row', alignItems: 'center', padding: space.md, minHeight: 200, overflow: 'hidden' },
  featuredLines: { position: 'absolute', left: -150, top: -110, width: 420, height: 420 },
  featuredHero: { width: 120, alignItems: 'center' },
  featuredText: { flex: 1, paddingLeft: space.sm },
  kanji: { position: 'absolute', right: -6, bottom: -26, fontFamily: font.jpBlack, fontSize: 130, opacity: 0.1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  card: { padding: space.sm, paddingTop: space.md, gap: space.xs, overflow: 'hidden' },
  cardKanji: { position: 'absolute', right: 6, top: 2, fontFamily: font.jpBlack, fontSize: 40, opacity: 0.08 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, height: 24, borderRadius: radius.pill },
});
