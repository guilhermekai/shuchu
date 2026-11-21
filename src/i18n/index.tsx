/** Translation hook. Dictionaries live in ./strings. */
import { useLocales } from 'expo-localization';
import { HEROES, type HeroId } from '../data/characters';
import { SCENES, type SceneId } from '../data/scenes';
import { SHOP, SLOTS, type Slot } from '../data/shop';
import { useStore } from '../state/store';
import { dictFor, resolveLang } from './strings';

export { dictFor, resolveLang, type Dict, type Lang, type LangSetting } from './strings';

export function useI18n() {
  const { lang: setting } = useStore();
  const [locale] = useLocales();
  const lang = resolveLang(setting, locale?.languageCode);
  const t = dictFor(lang);
  const pick = <K extends string>(map: Partial<Record<K, string>>, key: K, fallback: string) => map[key] ?? fallback;
  return {
    t,
    lang,
    /** BCP-47 tag for Intl / toLocaleTimeString. */
    locale: lang === 'pt' ? 'pt-BR' : 'en-US',
    archetype: (id: HeroId) => pick(t.data.archetype, id, HEROES.find((h) => h.id === id)!.archetype),
    tagline: (id: HeroId) => pick(t.data.tagline, id, HEROES.find((h) => h.id === id)!.tagline),
    sceneName: (id: SceneId) => pick(t.data.scene, id, SCENES.find((s) => s.id === id)!.name),
    itemName: (id: string) => pick(t.data.item, id, SHOP.find((i) => i.id === id)?.name ?? id),
    slotLabel: (slot: Slot) => pick(t.data.slot, slot, SLOTS.find((s) => s.slot === slot)!.label),
  };
}
