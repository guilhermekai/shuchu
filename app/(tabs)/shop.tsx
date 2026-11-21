import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import * as Haptics from '../../src/lib/haptics';
import { SHOP, SLOTS, type Slot } from '../../src/data/shop';
import { heroById } from '../../src/data/characters';
import { HeroSprite } from '../../src/chibi/HeroSprite';
import { ItemIcon } from '../../src/chibi/ItemIcon';
import { Button, Chip, JP, Onigiri, OnigiriBalance, Panel, PressableScale, T, useTabScrollInsets } from '../../src/components/ui';
import { useStore } from '../../src/state/store';
import { useI18n } from '../../src/i18n';
import { radius, space, useTheme } from '../../src/theme/tokens';

export default function Shop() {
  const t = useTheme();
  const scrollInsets = useTabScrollInsets();
  const { width } = useWindowDimensions();
  const store = useStore();
  const i18n = useI18n();
  const L = i18n.t.shop;
  const [slot, setSlot] = useState<Slot>('head');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const hero = heroById(store.heroId);
  const saved = store.equipped[store.heroId];
  const mine = useMemo(() => saved ?? {}, [saved]);
  const items = SHOP.filter((i) => i.slot === slot);
  const preview = SHOP.find((i) => i.id === previewId) ?? null;
  const cardW = (width - space.md * 2 - space.sm * 2) / 3;

  const tryOn = useMemo(() => (preview ? { ...mine, [preview.slot]: preview.id } : mine), [mine, preview]);

  const owned = preview ? store.ownedItems.includes(preview.id) : false;
  const isEquipped = preview ? mine[preview.slot] === preview.id : false;
  const short = preview ? preview.price - store.onigiri : 0;

  const lastAct = useRef(0);
  const act = () => {
    if (!preview) return;
    // Buy turns into Unequip under the finger; ignore an accidental double tap.
    if (Date.now() - lastAct.current < 600) return;
    lastAct.current = Date.now();
    if (!owned) {
      if (store.buyItem(preview.id)) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    store.toggleEquip(preview.id);
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: scrollInsets.top + space.xs, paddingBottom: space.xxl, paddingHorizontal: space.md }}>
      <View style={styles.header}>
        <View>
          <JP size={13} color={t.accent}>商店</JP>
          <T v="largeTitle">{L.title}</T>
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
                <T v="title3" numberOfLines={2}>{i18n.itemName(preview.id)}</T>
                <T v="footnote" color="secondary">
                  {owned ? (isEquipped ? L.wearing(hero.name) : L.inCollection) : `${preview.price} onigiri`}
                </T>
                <Button
                  label={owned ? (isEquipped ? L.unequip : L.equip) : short > 0 ? L.needMore(short) : L.buy}
                  kind={owned ? 'secondary' : 'primary'}
                  disabled={!owned && short > 0}
                  onPress={act}
                  style={{ marginTop: space.xs, minHeight: 44, alignSelf: 'flex-start', paddingHorizontal: space.lg }}
                  icon={!owned && short <= 0 ? <Onigiri size={16} /> : undefined}
                />
              </>
            ) : (
              <>
                <T v="headline">{L.fittingRoom}</T>
                <T v="footnote" color="secondary">{L.fittingHint(hero.name)}</T>
              </>
            )}
          </View>
        </View>
      </Panel>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.md, marginBottom: space.md }} contentContainerStyle={{ gap: space.xs, paddingHorizontal: space.md }}>
        {SLOTS.map((s) => (
          <Chip key={s.slot} label={i18n.slotLabel(s.slot)} sub={s.jp} selected={slot === s.slot} onPress={() => setSlot(s.slot)} />
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
              accessibilityLabel={`${i18n.itemName(item.id)}, ${has ? (on ? L.equipped : L.owned) : `${item.price} onigiri`}`}
            >
              <View style={[styles.item, { backgroundColor: t.surface, borderColor: sel ? t.accent : t.border, borderWidth: sel ? 2 : 1 }]}>
                <ItemIcon item={item} size={56} />
                <T v="caption" numberOfLines={2} style={{ textAlign: 'center' }}>{i18n.itemName(item.id)}</T>
                {has ? (
                  <T v="caption" color={on ? 'accent' : 'tertiary'} style={{ fontWeight: '700' }}>{on ? L.equipped : L.owned}</T>
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
