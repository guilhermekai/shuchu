/**
 * Translations. English is the source of truth; `pt` must match its shape, so a
 * missing Portuguese string is a type error. Language follows the device unless
 * the user picks one in Settings (stored as `lang` in the store).
 */
import { useLocales } from 'expo-localization';
import { HEROES, type HeroId } from '../data/characters';
import { SCENES, type SceneId } from '../data/scenes';
import { SHOP, SLOTS, type Slot } from '../data/shop';
import { useStore } from '../state/store';

export type Lang = 'en' | 'pt';
export type LangSetting = 'system' | Lang;

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const en = {
  tabs: { focus: 'Focus', heroes: 'Heroes', matsuri: 'Matsuri', shop: 'Shop' },
  common: { onigiri: (n: number) => `${n} onigiri`, ok: 'OK', dismiss: 'Dismiss', min: (m: number) => `${m} min` },
  setup: {
    arc: (n: number) => `Training Arc ${n}`,
    episode: (e: number, of: number) => `Episode ${e} of ${of}`,
    episodesA11y: (done: number, of: number) => `${done} of ${of} episodes cleared`,
    streakA11y: (n: number) => `${n}-day streak`,
    changeHero: (name: string) => `${name}, change hero`,
    mission: 'Today’s mission',
    missionPlaceholder: 'What are you training?',
    duration: 'Duration',
    scenery: 'Scenery',
    begin: (m: number) => `Begin ${m}-minute training`,
    defaultTask: 'Focus training',
    resume: 'Resume session',
    settings: 'Settings',
    introTitle: 'How it works',
    intro: [
      'Start a session. Your hero walks while you focus.',
      'Finish it to earn onigiri and clear an episode. Four episodes make a training arc.',
      'Every hero who finishes today joins the Matsuri. Spend onigiri on heroes and gear.',
    ],
    introDismiss: 'Got it',
  },
  focus: {
    training: (name: string, scene: string) => `${name} is training · ${scene}`,
    finalStretch: 'Final stretch!',
    remainingA11y: (m: number) => `${m} ${plural(m, 'minute', 'minutes')} remaining`,
    arcEpisode: (a: number, e: number) => `Arc ${a} · Episode ${e}`,
    abandon: 'Abandon',
    abandonTitle: 'Abandon training?',
    abandonBody: (name: string) => `${name} will head home. No onigiri for this session.`,
    keepGoing: 'Keep going',
  },
  success: {
    title: 'Mission Complete!',
    earned: 'Onigiri earned',
    earnedA11y: (n: number) => `${n} onigiri earned`,
    focusLine: (m: number) => `${m} min focus`,
    streakBonus: 'Streak bonus',
    arcFinale: 'Arc finale',
    arc: (n: number) => `Arc ${n}`,
    arcComplete: (n: number) => `Arc ${n} complete`,
    episodeCleared: (n: number) => `Episode ${n} cleared`,
    streak: 'Streak',
    dayOne: 'Day one. Keep it up.',
    daysInARow: 'days in a row',
    toMatsuri: 'See the festival',
    done: 'Done',
  },
  heroes: {
    title: 'Heroes',
    roster: 'Roster',
    wearing: (list: string) => `Wearing ${list}`,
    active: 'Active',
    lockedTitle: (name: string) => `${name} is locked`,
    lockedBody: (n: number) => `You need ${n} more onigiri. Finish a focus session to earn more.`,
    recruitTitle: (name: string) => `Recruit ${name}?`,
    recruit: 'Recruit',
    notNow: 'Not now',
    a11ySelected: 'selected',
    a11yLocked: (cost: number) => `locked, ${cost} onigiri`,
  },
  matsuri: {
    closed: 'Finish a session to open today’s festival.',
    celebrating: (n: number, min: number) => `${n} ${plural(n, 'hero', 'heroes')} celebrating · ${min} min focused today`,
    emptyTitle: 'No guests yet today',
    emptyBody: 'Every hero who completes a focus session today comes to the festival.',
    start: 'Start a session',
    guests: 'Today’s guests',
    finished: (name: string, n: number) => `${name} finished ${n} ${plural(n, 'mission', 'missions')}`,
    sessionsA11y: (name: string, n: number) => `${name}, ${n} ${plural(n, 'session', 'sessions')}`,
  },
  shop: {
    title: 'Shop',
    fittingRoom: 'Fitting room',
    fittingHint: (name: string) => `Tap an item to try it on ${name}.`,
    wearing: (name: string) => `${name} is wearing this`,
    inCollection: 'In your collection',
    equip: 'Equip',
    unequip: 'Unequip',
    buy: 'Buy',
    needMore: (n: number) => `Need ${n} more`,
    equipped: 'Equipped',
    owned: 'Owned',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    system: 'Automatic (device language)',
    english: 'English',
    portuguese: 'Português',
  },
  // Content: English comes from src/data; only translations live here.
  data: {
    archetype: {} as Partial<Record<HeroId, string>>,
    tagline: {} as Partial<Record<HeroId, string>>,
    scene: {} as Partial<Record<SceneId, string>>,
    item: {} as Partial<Record<string, string>>,
    slot: {} as Partial<Record<Slot, string>>,
  },
};

type Dict = typeof en;

const pt: Dict = {
  tabs: { focus: 'Foco', heroes: 'Heróis', matsuri: 'Matsuri', shop: 'Loja' },
  common: { onigiri: (n) => `${n} onigiri`, ok: 'OK', dismiss: 'Fechar', min: (m) => `${m} min` },
  setup: {
    arc: (n) => `Arco de treino ${n}`,
    episode: (e, of) => `Episódio ${e} de ${of}`,
    episodesA11y: (done, of) => `${done} de ${of} episódios concluídos`,
    streakA11y: (n) => `Sequência de ${n} ${plural(n, 'dia', 'dias')}`,
    changeHero: (name) => `${name}, trocar herói`,
    mission: 'Missão de hoje',
    missionPlaceholder: 'O que você vai treinar?',
    duration: 'Duração',
    scenery: 'Cenário',
    begin: (m) => `Começar treino de ${m} min`,
    defaultTask: 'Treino de foco',
    resume: 'Voltar à sessão',
    settings: 'Ajustes',
    introTitle: 'Como funciona',
    intro: [
      'Comece uma sessão. Seu herói caminha enquanto você foca.',
      'Ao terminar, você ganha onigiri e conclui um episódio. Quatro episódios formam um arco de treino.',
      'Todo herói que terminar hoje vai para o Matsuri. Use os onigiri em heróis e itens.',
    ],
    introDismiss: 'Entendi',
  },
  focus: {
    training: (name, scene) => `${name} está treinando · ${scene}`,
    finalStretch: 'Reta final!',
    remainingA11y: (m) => `${m} ${plural(m, 'minuto restante', 'minutos restantes')}`,
    arcEpisode: (a, e) => `Arco ${a} · Episódio ${e}`,
    abandon: 'Abandonar',
    abandonTitle: 'Abandonar o treino?',
    abandonBody: (name) => `${name} vai voltar para casa. Nenhum onigiri nesta sessão.`,
    keepGoing: 'Continuar',
  },
  success: {
    title: 'Missão cumprida!',
    earned: 'Onigiri ganhos',
    earnedA11y: (n) => `${n} onigiri ganhos`,
    focusLine: (m) => `${m} min de foco`,
    streakBonus: 'Bônus de sequência',
    arcFinale: 'Final do arco',
    arc: (n) => `Arco ${n}`,
    arcComplete: (n) => `Arco ${n} concluído`,
    episodeCleared: (n) => `Episódio ${n} concluído`,
    streak: 'Sequência',
    dayOne: 'Primeiro dia. Continue assim.',
    daysInARow: 'dias seguidos',
    toMatsuri: 'Ver o festival',
    done: 'Concluir',
  },
  heroes: {
    title: 'Heróis',
    roster: 'Elenco',
    wearing: (list) => `Usando ${list}`,
    active: 'Ativo',
    lockedTitle: (name) => `${name} ainda está bloqueado`,
    lockedBody: (n) => `Faltam ${n} onigiri. Conclua uma sessão de foco para ganhar mais.`,
    recruitTitle: (name) => `Recrutar ${name}?`,
    recruit: 'Recrutar',
    notNow: 'Agora não',
    a11ySelected: 'selecionado',
    a11yLocked: (cost) => `bloqueado, ${cost} onigiri`,
  },
  matsuri: {
    closed: 'Conclua uma sessão para abrir o festival de hoje.',
    celebrating: (n, min) => `${n} ${plural(n, 'herói comemorando', 'heróis comemorando')} · ${min} min de foco hoje`,
    emptyTitle: 'Nenhum convidado ainda',
    emptyBody: 'Todo herói que concluir uma sessão de foco hoje vem para o festival.',
    start: 'Começar uma sessão',
    guests: 'Convidados de hoje',
    finished: (name, n) => `${name} concluiu ${n} ${plural(n, 'missão', 'missões')}`,
    sessionsA11y: (name, n) => `${name}, ${n} ${plural(n, 'sessão', 'sessões')}`,
  },
  shop: {
    title: 'Loja',
    fittingRoom: 'Provador',
    fittingHint: (name) => `Toque em um item para experimentar em ${name}.`,
    wearing: (name) => `${name} está usando`,
    inCollection: 'Na sua coleção',
    equip: 'Equipar',
    unequip: 'Desequipar',
    buy: 'Comprar',
    needMore: (n) => `Faltam ${n}`,
    equipped: 'Equipado',
    owned: 'Seu',
  },
  settings: {
    title: 'Ajustes',
    language: 'Idioma',
    system: 'Automático (idioma do aparelho)',
    english: 'English',
    portuguese: 'Português',
  },
  data: {
    archetype: {
      haru: 'Estudante',
      kaze: 'Ninja',
      suzu: 'Sacerdotisa',
      tetsu: 'Samurai',
      menma: 'Chef de lámen',
      hoshi: 'Garota mágica',
      jin: 'Piloto de mecha',
      kon: 'Kitsune',
    },
    tagline: {
      haru: 'Primeira fila, lápis apontado, imparável.',
      kaze: 'Rápido para começar. Mais rápido para terminar.',
      suzu: 'Calma como o sino da manhã.',
      tetsu: 'Um corte. Uma tarefa. Zero distrações.',
      menma: 'Cozinha por horas. Vale a pena.',
      hoshi: 'O foco é a verdadeira transformação.',
      jin: 'Sistemas no verde. Distrações desligadas.',
      kon: 'Nove caudas, um só foco.',
    },
    scene: { sakura: 'Rua das Cerejeiras', neon: 'Cidade Neon', station: 'Estação do Interior', hallway: 'Corredor da Escola' },
    item: {
      'hachimaki-red': 'Hachimaki',
      'hachimaki-indigo': 'Hachimaki índigo',
      'kitsune-mask': 'Máscara de kitsune',
      'straw-hat': 'Chapéu kasa',
      'yukata-asagao': 'Yukata de ipomeia',
      'yukata-sakura': 'Yukata de sakura',
      'kimono-crane': 'Quimono do grou',
      'mecha-armor': 'Armadura mecha',
      bokken: 'Katana de treino',
      'katana-moon': 'Katana do luar',
      uchiwa: 'Leque uchiwa',
      tanuki: 'Tanuki',
      shiba: 'Shiba',
      ramen: 'Lámen tonkotsu',
      dango: 'Dango hanami',
    },
    slot: { head: 'Cabeça', outfit: 'Roupas', hand: 'Equipamento', pet: 'Mascotes', treat: 'Petiscos' },
  },
};

const DICTS: Record<Lang, Dict> = { en, pt };

export function resolveLang(setting: LangSetting, deviceLanguage: string | null | undefined): Lang {
  if (setting !== 'system') return setting;
  return deviceLanguage?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

export function useI18n() {
  const { lang: setting } = useStore();
  const [locale] = useLocales();
  const lang = resolveLang(setting, locale?.languageCode);
  const t = DICTS[lang];
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
