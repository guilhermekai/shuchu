import Svg, { G } from 'react-native-svg';
import type { ShopItem } from '../data/shop';
import { HandItem, HeadItem, OutfitItem, PetArt, TreatItem } from './items';

export function ItemIcon({ item, size = 56 }: { item: ShopItem; size?: number }) {
  const art =
    item.slot === 'head' ? (
      <G transform="translate(30 32)"><HeadItem item={item} worn={false} /></G>
    ) : item.slot === 'outfit' ? (
      <G transform={item.kind === 'mecha-armor' ? 'translate(30 32) scale(0.85)' : 'translate(30 30)'}><OutfitItem item={item} worn={false} /></G>
    ) : item.slot === 'hand' ? (
      <G transform="translate(30 50) rotate(30)"><HandItem item={item} /></G>
    ) : item.slot === 'treat' ? (
      <G transform={item.kind === 'dango' ? 'translate(30 46)' : 'translate(30 36)'}><TreatItem item={item} /></G>
    ) : (
      <G transform="translate(3 4)"><PetArt item={item} /></G>
    );
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      {art}
    </Svg>
  );
}
