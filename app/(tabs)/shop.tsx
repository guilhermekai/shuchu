import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SHOP, SLOTS, type ShopItem, type Slot } from '../../src/data/shop';
import { heroById } from '../../src/data/characters';
import { HeroSprite } from '../../src/chibi/HeroSprite';
import { ItemIcon } from '../../src/chibi/ItemIcon';
import { Button, Chip, JP, Onigiri, OnigiriBalance, Panel, PressableScale, T } from '../../src/components/ui';
import { useStore } from '../../src/state/store';
import { radius, space, useTheme } from '../../src/theme/tokens';

export default function Shop() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const store = useStore();
  const [slot, setSlot] = useState<Slot>('head');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const hero = heroById(store.heroId);
  const mine = store.equipped[store.heroId] ?? {};
  const items = SHOP.filter((i) => i.slot === slot);
  const preview = SHOP.find((i) => i.id === previewId) ?? null;
  const cardW = (width - space.md * 2 - space.sm * 2) / 3;

  const tryOn = useMemo(() => (preview ? { ...mine, [preview.slot]: preview.id } : mine), [mine, preview]);

  const owned = preview ? store.ownedItems.includes(preview.id) : false;
  const isEquipped = preview ? mine[preview.slot] === preview.id : false;
  const short = preview ? preview.price - store.onigiri : 0;

  const act = () => {
    if (!preview) return;
    if (!owned) {
      if (store.buyItem(preview.id)) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    store.toggleEquip(preview.id);
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: insets.top + space.xs, paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.md }}>
      <View style={styles.header}>
        <View>
          <JP size={13} color={t.accent}>商店</JP>
          <T v="largeTitle">Shop</T>
        </View>
        <OnigiriBalance amount={store.onigiri} />
      </View>

      {/* Fitting room */}
      <Panel style={{ marginBottom: space.lg }}>
        <View style={[styles.fitting, { backgroundColor: t.goldSoft }]}>
          <View style={{ width: 130, alignItems: 'center', paddingLeft: 24 }}>
            <HeroSprite heroId={store.heroId} equipped={tryOn} mode="idle" size={104} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            {preview ? (
              <>
                <JP size={12} color={t.textSecondary}>{preview.jp}</JP>
                <T v="title3" numberOfLines={2}>{preview.name}</T>
                <T v="footnote" color="secondary">
                  {owned ? (isEquipped ? `${hero.name} is wearing this` : 'In your collection') : `${preview.price} onigiri`}
                </T>
                <Button
                  label={owned ? (isEquipped ? 'Unequip' : 'Equip') : short > 0 ? `Need ${short} more` : 'Buy'}
                  kind={owned ? 'secondary' : 'primary'}
                  disabled={!owned && short > 0}
                  onPress={act}
                  style={{ marginTop: space.xs, minHeight: 44, alignSelf: 'flex-start', paddingHorizontal: space.lg }}
                  icon={!owned && short <= 0 ? <Onigiri size={16} /> : undefined}
                />
              </>
            ) : (
              <>
                <T v="headline">Fitting room</T>
                <T v="footnote" color="secondary">Tap an item to try it on {hero.name}.</T>
              </>
            )}
          </View>
        </View>
      </Panel>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.md, marginBottom: space.md }} contentContainerStyle={{ gap: space.xs, paddingHorizontal: space.md }}>
        {SLOTS.map((s) => (
          <Chip key={s.slot} label={s.label} sub={s.jp} selected={slot === s.slot} onPress={() => setSlot(s.slot)} />
        ))}
      </ScrollView>

      <View style={styles.grid}>
        {items.map((item) => {
          const has = store.ownedItems.includes(item.id);
          const on = mine[item.slot] === item.id;
          const sel = previewId === item.id;
          return (
            <PressableScale
              key={item.id}
              onPress={() => setPreviewId(sel ? null : item.id)}
              haptic="selection"
              style={{ width: cardW }}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`${item.name}, ${has ? (on ? 'equipped' : 'owned') : `${item.price} onigiri`}`}
            >
              <View style={[styles.item, { backgroundColor: t.surface, borderColor: sel ? t.accent : t.border, borderWidth: sel ? 2 : 1 }]}>
                <ItemIcon item={item} size={56} />
                <T v="caption" numberOfLines={1} style={{ textAlign: 'center' }}>{item.name}</T>
                {has ? (
                  <T v="caption" color={on ? 'accent' : 'tertiary'} style={{ fontWeight: '700' }}>{on ? 'Equipped' : 'Owned'}</T>
                ) : (
                  <View style={styles.price}>
                    <Onigiri size={12} />
                    <T v="caption" style={{ fontWeight: '700' }}>{item.price}</T>
                  </View>
                )}
              </View>
            </PressableScale>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: space.md },
  fitting: { flexDirection: 'row', alignItems: 'center', padding: space.md, minHeight: 170, gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  item: { borderRadius: radius.md, padding: space.sm, alignItems: 'center', gap: 4, minHeight: 124 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
