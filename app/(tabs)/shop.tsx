import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from '../../src/lib/haptics';
import { DEAL_DISCOUNT, SHOP, SLOTS, itemById, type Slot } from '../../src/data/shop';
import { heroById } from '../../src/data/characters';
import { HeroSprite } from '../../src/chibi/HeroSprite';
import { ItemIcon } from '../../src/chibi/ItemIcon';
import { Button, Chip, JP, Onigiri, OnigiriBalance, Panel, PressableScale, T, useTabScrollInsets } from '../../src/components/ui';
import { isDeal, itemPrice, useStore } from '../../src/state/store';
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
  const priceOf = (id: string) => itemPrice(store, id);
  const short = preview ? priceOf(preview.id) - store.onigiri : 0;

  // A new deal each day, picked the first time the shop is opened that day.
  const { rollDeal } = store;
  useFocusEffect(useCallback(() => rollDeal(), [rollDeal]));
  const dealItem = store.deal?.itemId && isDeal(store, store.deal.itemId) && !store.ownedItems.includes(store.deal.itemId) ? itemById(store.deal.itemId) : undefined;
  const pct = Math.round(DEAL_DISCOUNT * 100);

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
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: scrollInsets.top + space.xs, paddingBottom: scrollInsets.bottom + space.xxl, paddingHorizontal: space.md }}>
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
                  {owned ? (isEquipped ? L.wearing(hero.name) : L.inCollection) : `${priceOf(preview.id)} onigiri`}
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

      {dealItem && (
        <PressableScale
          onPress={() => {
            setSlot(dealItem.slot);
            setPreviewId(dealItem.id);
          }}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel={L.dealA11y(i18n.itemName(dealItem.id), priceOf(dealItem.id), dealItem.price)}
          style={[styles.deal, { backgroundColor: t.accentSoft, borderColor: t.accent }]}
        >
          <ItemIcon item={dealItem} size={40} />
          <View style={{ flex: 1 }}>
            <T v="footnote" color="accent" style={{ fontWeight: '700' }}>{L.dealTitle}</T>
            <T v="subhead" numberOfLines={1}>{i18n.itemName(dealItem.id)}</T>
            <T v="caption" color="secondary">{L.dealBody(pct)}</T>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <T v="caption" color="tertiary" style={styles.was}>{dealItem.price}</T>
            <View style={styles.price}>
              <Onigiri size={14} />
              <T v="headline">{priceOf(dealItem.id)}</T>
            </View>
          </View>
        </PressableScale>
      )}

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
          const deal = !has && isDeal(store, item.id);
          return (
            <PressableScale
              key={item.id}
              onPress={() => setPreviewId(sel ? null : item.id)}
              haptic="selection"
              style={{ width: cardW }}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={
                deal
                  ? L.dealA11y(i18n.itemName(item.id), priceOf(item.id), item.price)
                  : `${i18n.itemName(item.id)}, ${has ? (on ? L.equipped : L.owned) : `${item.price} onigiri`}`
              }
            >
              <View style={[styles.item, { backgroundColor: t.surface, borderColor: sel ? t.accent : t.border, borderWidth: sel ? 2 : 1 }]}>
                {deal && (
                  <View style={[styles.badge, { backgroundColor: t.accent }]}>
                    <T v="caption" color="onAccent" style={{ fontWeight: '700' }}>-{pct}%</T>
                  </View>
                )}
                <ItemIcon item={item} size={56} />
                <T v="caption" numberOfLines={2} maxScale={1.4} style={{ textAlign: 'center' }}>{i18n.itemName(item.id)}</T>
                {has ? (
                  <T v="caption" color={on ? 'accent' : 'tertiary'} style={{ fontWeight: '700' }}>{on ? L.equipped : L.owned}</T>
                ) : (
                  <View style={styles.price}>
                    <Onigiri size={12} />
                    {deal && <T v="caption" color="tertiary" style={styles.was}>{item.price}</T>}
                    <T v="caption" color={deal ? 'accent' : undefined} style={{ fontWeight: '700' }}>{priceOf(item.id)}</T>
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
  was: { textDecorationLine: 'line-through' },
  deal: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm, borderRadius: radius.md, borderWidth: 1.5, marginBottom: space.md },
  badge: { position: 'absolute', top: 6, right: 6, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 1, zIndex: 1 },
});
