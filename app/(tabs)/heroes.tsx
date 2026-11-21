import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { alert } from '../../src/lib/alert';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from '../../src/lib/haptics';
import { HEROES, heroById, type Hero } from '../../src/data/characters';
import { HeroSprite } from '../../src/chibi/HeroSprite';
import { SpeedLines } from '../../src/components/effects';
import { JP, Onigiri, OnigiriBalance, Panel, PressableScale, T, useTabScrollInsets } from '../../src/components/ui';
import { useStore } from '../../src/state/store';
import { useI18n } from '../../src/i18n';
import { font, motion, radius, space, useTheme } from '../../src/theme/tokens';

export default function Heroes() {
  const t = useTheme();
  const scrollInsets = useTabScrollInsets();
  const { width } = useWindowDimensions();
  const store = useStore();
  const i18n = useI18n();
  const L = i18n.t.heroes;
  const hero = heroById(store.heroId);
  const equipped = Object.values(store.equipped[store.heroId] ?? {}).filter(Boolean).map((id) => i18n.itemName(id!));
  const cardW = (width - space.md * 2 - space.sm) / 2;

  const onPick = (h: Hero) => {
    if (store.ownedHeroes.includes(h.id)) {
      if (h.id !== store.heroId) Haptics.selectionAsync();
      store.selectHero(h.id);
      return;
    }
    if (store.onigiri < h.cost) {
      alert(L.lockedTitle(h.name), L.lockedBody(h.cost - store.onigiri));
      return;
    }
    alert(L.recruitTitle(h.name), `${i18n.archetype(h.id)} · ${h.cost} onigiri`, [
      { text: L.notNow, style: 'cancel' },
      {
        text: L.recruit,
        onPress: () => {
          if (store.buyHero(h.id)) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: scrollInsets.top + space.xs, paddingBottom: space.xxl, paddingHorizontal: space.md }}>
      <View style={styles.header}>
        <View>
          <JP size={13} color={t.accent}>仲間</JP>
          <T v="largeTitle">{L.title}</T>
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
            <T v="subhead" color="secondary">{i18n.archetype(hero.id)}</T>
            <T v="footnote" color="secondary" style={{ marginTop: space.xs }}>{i18n.tagline(hero.id)}</T>
            {equipped.length > 0 && (
              <T v="caption" color="tertiary" style={{ marginTop: space.xs }} numberOfLines={2}>
                {L.wearing(equipped.join(', '))}
              </T>
            )}
          </View>
        </View>
      </Panel>

      <T v="title3" style={{ marginBottom: space.sm }}>{L.roster}</T>
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
              accessibilityLabel={`${h.name}, ${i18n.archetype(h.id)}${owned ? (selected ? `, ${L.a11ySelected}` : '') : `, ${L.a11yLocked(h.cost)}`}`}
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
                      <T v="caption" color="secondary">{i18n.archetype(h.id)}</T>
                    </View>
                    {!owned ? (
                      <View style={[styles.price, { backgroundColor: t.goldSoft }]}>
                        <Onigiri size={13} />
                        <T v="caption" style={{ fontWeight: '700' }}>{h.cost}</T>
                      </View>
                    ) : selected ? (
                      <View style={[styles.price, { backgroundColor: t.accentFill }]}>
                        <T v="caption" color="onAccent" style={{ fontWeight: '700' }}>{L.active}</T>
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
  featuredHero: { width: 150, paddingLeft: 30, alignItems: 'center' }, // room for an equipped pet
  featuredText: { flex: 1, paddingLeft: space.sm },
  kanji: { position: 'absolute', right: -6, bottom: -26, fontFamily: font.jpBlack, fontSize: 130, opacity: 0.1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  card: { padding: space.sm, paddingTop: space.md, gap: space.xs, overflow: 'hidden' },
  cardKanji: { position: 'absolute', right: 6, top: 2, fontFamily: font.jpBlack, fontSize: 40, opacity: 0.08 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, height: 24, borderRadius: radius.pill },
});
