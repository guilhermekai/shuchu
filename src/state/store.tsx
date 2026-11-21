import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { HEROES, heroById, type HeroId } from '../data/characters';
import { itemById, type Slot } from '../data/shop';
import type { SceneId } from '../data/scenes';
import type { LangSetting } from '../i18n';

export type Session = {
  id: string;
  heroId: HeroId;
  task: string;
  minutes: number;
  sceneId: SceneId;
  endedAt: number;
  reward: number;
};

export type ActiveSession = {
  heroId: HeroId;
  task: string;
  minutes: number;
  sceneId: SceneId;
  startedAt: number;
  endsAt: number;
};

type State = {
  hydrated: boolean;
  /** False when saved data failed to load; saving is then disabled. */
  persistent: boolean;
  onigiri: number;
  heroId: HeroId;
  ownedHeroes: HeroId[];
  ownedItems: string[];
  equipped: Partial<Record<HeroId, Partial<Record<Slot, string>>>>;
  sessions: Session[];
  active: ActiveSession | null;
  sceneId: SceneId;
  minutes: number;
  lang: LangSetting;
  introSeen: boolean;
};

const INITIAL: State = {
  hydrated: false,
  persistent: false,
  onigiri: 20,
  heroId: 'haru',
  ownedHeroes: ['haru', 'kaze'],
  ownedItems: [],
  equipped: {},
  sessions: [],
  active: null,
  sceneId: 'sakura',
  minutes: 25,
  lang: 'system',
  introSeen: false,
};

type Action =
  | { type: 'hydrate'; state: Partial<State>; persist?: boolean }
  | { type: 'selectHero'; heroId: HeroId }
  | { type: 'buyHero'; heroId: HeroId }
  | { type: 'buyItem'; itemId: string }
  | { type: 'toggleEquip'; itemId: string }
  | { type: 'setScene'; sceneId: SceneId }
  | { type: 'setMinutes'; minutes: number }
  | { type: 'setLang'; lang: LangSetting }
  | { type: 'dismissIntro' }
  | { type: 'start'; task: string; now: number }
  | { type: 'abandon' }
  | { type: 'fastForward'; now: number }
  | { type: 'complete'; session: Session };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'hydrate':
      return { ...s, ...a.state, hydrated: true, persistent: a.persist !== false };
    case 'selectHero':
      return s.ownedHeroes.includes(a.heroId) ? { ...s, heroId: a.heroId } : s;
    case 'buyHero': {
      const cost = heroById(a.heroId).cost;
      if (s.ownedHeroes.includes(a.heroId) || s.onigiri < cost) return s;
      return { ...s, onigiri: s.onigiri - cost, ownedHeroes: [...s.ownedHeroes, a.heroId], heroId: a.heroId };
    }
    case 'buyItem': {
      const item = itemById(a.itemId);
      if (!item || s.ownedItems.includes(item.id) || s.onigiri < item.price) return s;
      const mine = { ...(s.equipped[s.heroId] ?? {}), [item.slot]: item.id };
      return {
        ...s,
        onigiri: s.onigiri - item.price,
        ownedItems: [...s.ownedItems, item.id],
        equipped: { ...s.equipped, [s.heroId]: mine },
      };
    }
    case 'toggleEquip': {
      const item = itemById(a.itemId);
      if (!item || !s.ownedItems.includes(item.id)) return s;
      const mine = { ...(s.equipped[s.heroId] ?? {}) };
      if (mine[item.slot] === item.id) delete mine[item.slot];
      else mine[item.slot] = item.id;
      return { ...s, equipped: { ...s.equipped, [s.heroId]: mine } };
    }
    case 'setScene':
      return { ...s, sceneId: a.sceneId };
    case 'setMinutes':
      return { ...s, minutes: a.minutes };
    case 'setLang':
      return { ...s, lang: a.lang };
    case 'dismissIntro':
      return { ...s, introSeen: true };
    case 'start':
      return {
        ...s,
        active: {
          heroId: s.heroId,
          task: a.task,
          minutes: s.minutes,
          sceneId: s.sceneId,
          startedAt: a.now,
          endsAt: a.now + s.minutes * 60_000,
        },
      };
    case 'abandon':
      return { ...s, active: null };
    case 'fastForward':
      // Dev only: jump to 65s left so the final stretch → completion can be checked quickly.
      return s.active ? { ...s, active: { ...s.active, startedAt: a.now + 65_000 - s.active.minutes * 60_000, endsAt: a.now + 65_000 } } : s;
    case 'complete':
      return { ...s, active: null, onigiri: s.onigiri + a.session.reward, sessions: [...s.sessions, a.session] };
  }
}

const PERSIST_KEY = 'shuchu/v1';

// ── Derived progress ─────────────────────────────────────────────────────────
export const EPISODES_PER_ARC = 4;

export function arcOf(sessionCount: number) {
  return {
    arc: Math.floor(sessionCount / EPISODES_PER_ARC) + 1,
    episode: (sessionCount % EPISODES_PER_ARC) + 1,
  };
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function streakOf(sessions: Session[], now = Date.now()) {
  const days = new Set(sessions.map((x) => dayKey(x.endedAt)));
  let streak = 0;
  const cursor = new Date(now);
  // Today not done yet doesn't break the streak.
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function todaysSessions(sessions: Session[], now = Date.now()) {
  const k = dayKey(now);
  return sessions.filter((x) => dayKey(x.endedAt) === k);
}

export function rewardFor(minutes: number, streakAfter: number, finishesArc: boolean) {
  const base = minutes;
  const streakBonus = Math.min(streakAfter, 5) * 2;
  const arcBonus = finishesArc ? 10 : 0;
  return { base, streakBonus, arcBonus, total: base + streakBonus + arcBonus };
}

// ── Context ──────────────────────────────────────────────────────────────────
type Store = State & {
  selectHero: (id: HeroId) => void;
  buyHero: (id: HeroId) => boolean;
  buyItem: (id: string) => boolean;
  toggleEquip: (id: string) => void;
  setScene: (id: SceneId) => void;
  setMinutes: (m: number) => void;
  setLang: (lang: LangSetting) => void;
  dismissIntro: () => void;
  start: (task: string) => void;
  abandon: () => void;
  fastForward: () => void;
  /** Completes the active session; returns the payload the success screen shows. */
  complete: () => CompletionSummary | null;
};

export type CompletionSummary = {
  heroId: HeroId;
  minutes: number;
  task: string;
  reward: ReturnType<typeof rewardFor>;
  streak: number;
  arc: number;
  episode: number; // the episode just cleared
  arcCleared: boolean;
  balance: number;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  // Latest state for callbacks (complete/buy) without re-creating them on every change.
  const stateRef = useRef(state);
  const completedRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    AsyncStorage.getItem(PERSIST_KEY)
      .then((raw) => dispatch({ type: 'hydrate', state: sanitize(raw ? JSON.parse(raw) : {}) }))
      // If the saved data can't be read, run in memory with saving turned off, so the
      // starting state never overwrites real progress.
      .catch(() => dispatch({ type: 'hydrate', state: {}, persist: false }));
  }, []);

  useEffect(() => {
    if (!state.hydrated || !state.persistent) return;
    const { hydrated, persistent, ...rest } = state;
    AsyncStorage.setItem(PERSIST_KEY, JSON.stringify(rest)).catch(() => {});
  }, [state]);

  const complete = useCallback((): CompletionSummary | null => {
    const s = stateRef.current;
    const a = s.active;
    if (!a) return null;
    if (completedRef.current === a.startedAt) return null; // already completed this one
    completedRef.current = a.startedAt;
    // A timer that ran out while the app was closed counts on the day it ended.
    const now = Math.min(Date.now(), a.endsAt);
    const prior = s.sessions.length;
    const { arc, episode } = arcOf(prior);
    const arcCleared = episode === EPISODES_PER_ARC;
    const streak = streakOf([...s.sessions, { endedAt: now } as Session], now);
    const reward = rewardFor(a.minutes, streak, arcCleared);
    const session: Session = {
      id: `${now}`,
      heroId: a.heroId,
      task: a.task,
      minutes: a.minutes,
      sceneId: a.sceneId,
      endedAt: now,
      reward: reward.total,
    };
    dispatch({ type: 'complete', session });
    return { heroId: a.heroId, minutes: a.minutes, task: a.task, reward, streak, arc, episode, arcCleared, balance: s.onigiri + reward.total };
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      selectHero: (heroId) => dispatch({ type: 'selectHero', heroId }),
      buyHero: (heroId) => {
        const s = stateRef.current;
        if (s.onigiri < heroById(heroId).cost) return false;
        dispatch({ type: 'buyHero', heroId });
        return true;
      },
      buyItem: (itemId) => {
        const it = itemById(itemId);
        if (!it || stateRef.current.onigiri < it.price) return false;
        dispatch({ type: 'buyItem', itemId });
        return true;
      },
      toggleEquip: (itemId) => dispatch({ type: 'toggleEquip', itemId }),
      setScene: (sceneId) => dispatch({ type: 'setScene', sceneId }),
      setMinutes: (minutes) => dispatch({ type: 'setMinutes', minutes }),
      setLang: (lang) => dispatch({ type: 'setLang', lang }),
      dismissIntro: () => dispatch({ type: 'dismissIntro' }),
      start: (task) => dispatch({ type: 'start', task, now: Date.now() }),
      abandon: () => dispatch({ type: 'abandon' }),
      fastForward: () => dispatch({ type: 'fastForward', now: Date.now() }),
      complete,
    }),
    [state, complete],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}

const NONE: Partial<Record<Slot, string>> = Object.freeze({});

/** Stable empty object when nothing is equipped, so memoized sprites don't re-render. */
export function useEquipped(heroId: HeroId) {
  const { equipped } = useStore();
  return equipped[heroId] ?? NONE;
}

/** Drop saved values that no longer match the current content (renamed heroes, items, scenes). */
function sanitize(saved: Partial<State>): Partial<State> {
  const out = { ...saved };
  const heroIds = new Set(HEROES.map((h) => h.id));
  if (out.heroId && !heroIds.has(out.heroId)) delete out.heroId;
  if (out.ownedHeroes) out.ownedHeroes = out.ownedHeroes.filter((id) => heroIds.has(id));
  if (out.sessions) out.sessions = out.sessions.filter((x) => heroIds.has(x.heroId));
  if (out.active && !heroIds.has(out.active.heroId)) out.active = null;
  if (out.ownedItems) out.ownedItems = out.ownedItems.filter((id) => itemById(id));
  return out;
}
