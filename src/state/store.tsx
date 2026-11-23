import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { HEROES, heroById, type HeroId } from '../data/characters';
import { dealPrice, itemById, SHOP, type Slot } from '../data/shop';
import { track } from '../lib/analytics';
import type { SceneId } from '../data/scenes';
import { getLocales } from 'expo-localization';
import { dictFor, resolveLang, type LangSetting } from '../i18n/strings';
import { cancelEnd, scheduleEnd } from '../lib/notify';

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
  /** Absent in data saved before breaks existed: treat as 'focus'. */
  kind?: 'focus' | 'break';
  /** Set while paused; resuming shifts startedAt/endsAt by the paused time. */
  pausedAt?: number | null;
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
  shortBreak: number;
  longBreak: number;
  /** Keep the screen on while a session or break runs. */
  keepAwake: boolean;
  /** Today's shop deal, picked once a day from unowned items (null when everything is owned). */
  deal: { day: string; itemId: string | null } | null;
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
  shortBreak: 5,
  longBreak: 15,
  keepAwake: true,
  deal: null,
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
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'startBreak'; minutes: number; now: number }
  | { type: 'setBreaks'; shortBreak?: number; longBreak?: number }
  | { type: 'setKeepAwake'; on: boolean }
  | { type: 'rollDeal'; now: number; pick: number }
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
      const price = item ? itemPrice(s, item.id) : Infinity;
      if (!item || s.ownedItems.includes(item.id) || s.onigiri < price) return s;
      const mine = { ...(s.equipped[s.heroId] ?? {}), [item.slot]: item.id };
      return {
        ...s,
        onigiri: s.onigiri - price,
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
          kind: 'focus',
          pausedAt: null,
        },
      };
    case 'startBreak':
      return {
        ...s,
        active: {
          heroId: s.heroId,
          task: '',
          minutes: a.minutes,
          sceneId: s.sceneId,
          startedAt: a.now,
          endsAt: a.now + a.minutes * 60_000,
          kind: 'break',
          pausedAt: null,
        },
      };
    case 'pause':
      return s.active && !s.active.pausedAt ? { ...s, active: { ...s.active, pausedAt: a.now } } : s;
    case 'resume': {
      const act = s.active;
      if (!act?.pausedAt) return s;
      const gap = a.now - act.pausedAt;
      return { ...s, active: { ...act, startedAt: act.startedAt + gap, endsAt: act.endsAt + gap, pausedAt: null } };
    }
    case 'setBreaks':
      return { ...s, shortBreak: a.shortBreak ?? s.shortBreak, longBreak: a.longBreak ?? s.longBreak };
    case 'rollDeal': {
      const day = dayKey(a.now);
      if (s.deal?.day === day) return s;
      const unowned = SHOP.filter((i) => !s.ownedItems.includes(i.id));
      return { ...s, deal: { day, itemId: unowned.length ? unowned[Math.floor(a.pick * unowned.length)].id : null } };
    }
    case 'setKeepAwake':
      return { ...s, keepAwake: a.on };
    case 'abandon':
      return { ...s, active: null };
    case 'fastForward':
      // Dev only: jump to 65s left so the final stretch → completion can be checked quickly.
      return s.active ? { ...s, active: { ...s.active, startedAt: a.now + 65_000 - s.active.minutes * 60_000, endsAt: a.now + 65_000, pausedAt: null } } : s;
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

/** True when `itemId` is today's deal. */
export function isDeal(s: Pick<State, 'deal'>, itemId: string, now = Date.now()) {
  return s.deal?.day === dayKey(now) && s.deal.itemId === itemId;
}

/** What an item costs right now (today's deal is discounted). */
export function itemPrice(s: Pick<State, 'deal'>, itemId: string, now = Date.now()) {
  const item = itemById(itemId);
  if (!item) return Infinity;
  return isDeal(s, itemId, now) ? dealPrice(item.price) : item.price;
}

/**
 * Rest days: one missed day doesn't break a streak, at most once in any 7 days. Life happens,
 * and losing a long streak to one bad day is the classic reason people quit habit apps.
 * Only days with a session count toward the streak length.
 */
export const REST_DAY_WINDOW = 7;

const dayBefore = (t: number) => {
  const d = new Date(t);
  d.setHours(12, 0, 0, 0); // noon: safe across DST shifts
  d.setDate(d.getDate() - 1);
  return d.getTime();
};

/**
 * Length of the streak whose most recent active day is `end`. `sinceRest` is how many active days
 * ago the last rest day was (0 when the day right after `end` was just used as one).
 */
function streakEndingAt(days: Set<string>, end: number, sinceRest = Infinity) {
  let streak = 0;
  let cursor = end;
  while (true) {
    if (days.has(dayKey(cursor))) {
      streak++;
      sinceRest++;
      cursor = dayBefore(cursor);
      continue;
    }
    // A single missing day, with activity the day before it and no other rest day nearby.
    const prev = dayBefore(cursor);
    if (streak > 0 && sinceRest >= REST_DAY_WINDOW && days.has(dayKey(prev))) {
      sinceRest = 0;
      cursor = prev;
      continue;
    }
    return streak;
  }
}

export function streakOf(sessions: Session[], now = Date.now()) {
  const days = new Set(sessions.map((x) => dayKey(x.endedAt)));
  const yesterday = dayBefore(now);
  const twoDaysAgo = dayBefore(yesterday);
  if (days.has(dayKey(now))) return streakEndingAt(days, now);
  // Today not done yet doesn't break the streak.
  if (days.has(dayKey(yesterday))) return streakEndingAt(days, yesterday);
  // Yesterday missed: it can be the rest day, if the run before it hasn't used one recently.
  if (days.has(dayKey(twoDaysAgo))) return streakEndingAt(days, twoDaysAgo, 0);
  return 0;
}

export function todaysSessions(sessions: Session[], now = Date.now()) {
  const k = dayKey(now);
  return sessions.filter((x) => dayKey(x.endedAt) === k);
}

/** Focus minutes per day for the last `days` days, oldest first. */
export function minutesByDay(sessions: Session[], days: number, now = Date.now()) {
  const out: { day: number; minutes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0); // noon: safe across DST shifts
    d.setDate(d.getDate() - i);
    const k = dayKey(d.getTime());
    out.push({ day: d.getTime(), minutes: sessions.filter((x) => dayKey(x.endedAt) === k).reduce((a, x) => a + x.minutes, 0) });
  }
  return out;
}

export function bestStreakOf(sessions: Session[]) {
  const days = new Set(sessions.map((x) => dayKey(x.endedAt)));
  let best = 0;
  for (const x of sessions) best = Math.max(best, streakEndingAt(days, x.endedAt));
  return best;
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
  pause: () => void;
  resume: () => void;
  /** Starts a break; long after an arc's 4th episode. */
  startBreak: (long: boolean) => void;
  setBreaks: (b: { shortBreak?: number; longBreak?: number }) => void;
  setKeepAwake: (on: boolean) => void;
  /** Pick today's shop deal if the day changed. */
  rollDeal: () => void;
  /** Ends the active break (finished or skipped). */
  endBreak: () => void;
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

  // One pending notification mirrors the running timer: scheduled while it runs,
  // cancelled when it's paused, abandoned, completed or replaced.
  useEffect(() => {
    if (!state.hydrated) return;
    const a = state.active;
    if (!a || a.pausedAt) {
      cancelEnd();
      return;
    }
    const t = dictFor(resolveLang(state.lang, getLocales()[0]?.languageCode));
    const name = heroById(a.heroId).name;
    if (a.kind === 'break') scheduleEnd(a.endsAt, t.notify.breakTitle, t.notify.breakBody(name));
    else scheduleEnd(a.endsAt, t.notify.focusTitle(name), t.notify.focusBody(a.minutes));
  }, [state.hydrated, state.active, state.lang]);

  const complete = useCallback((): CompletionSummary | null => {
    const s = stateRef.current;
    const a = s.active;
    if (!a || a.kind === 'break') return null;
    if (completedRef.current === a.startedAt) return null; // already completed this one
    completedRef.current = a.startedAt;
    // A timer that ran out while the app was closed counts on the day it ended.
    const now = Math.min(Date.now(), a.endsAt);
    const prior = s.sessions.length;
    const { arc, episode } = arcOf(prior);
    const arcCleared = episode === EPISODES_PER_ARC;
    const streak = streakOf([...s.sessions, { endedAt: now } as Session], now);
    // The streak bonus is paid once a day (first session), so short sessions can't farm it.
    const firstToday = todaysSessions(s.sessions, now).length === 0;
    const reward = rewardFor(a.minutes, firstToday ? streak : 0, arcCleared);
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
    track('session_complete', { minutes: a.minutes, reward: reward.total, streak, arc_cleared: arcCleared, first_today: firstToday });
    return { heroId: a.heroId, minutes: a.minutes, task: a.task, reward, streak, arc, episode, arcCleared, balance: s.onigiri + reward.total };
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      selectHero: (heroId) => dispatch({ type: 'selectHero', heroId }),
      buyHero: (heroId) => {
        const s = stateRef.current;
        const cost = heroById(heroId).cost;
        if (s.ownedHeroes.includes(heroId) || s.onigiri < cost) return false;
        dispatch({ type: 'buyHero', heroId });
        track('hero_recruit', { hero: heroId, cost, sessions: s.sessions.length });
        return true;
      },
      buyItem: (itemId) => {
        const s = stateRef.current;
        const it = itemById(itemId);
        const price = itemPrice(s, itemId);
        if (!it || s.ownedItems.includes(itemId) || s.onigiri < price) return false;
        dispatch({ type: 'buyItem', itemId });
        track('item_buy', { item: itemId, price, deal: isDeal(s, itemId), sessions: s.sessions.length });
        return true;
      },
      toggleEquip: (itemId) => dispatch({ type: 'toggleEquip', itemId }),
      setScene: (sceneId) => dispatch({ type: 'setScene', sceneId }),
      setMinutes: (minutes) => dispatch({ type: 'setMinutes', minutes }),
      setLang: (lang) => {
        dispatch({ type: 'setLang', lang });
        track('setting_change', { key: 'lang', value: lang });
      },
      dismissIntro: () => dispatch({ type: 'dismissIntro' }),
      start: (task) => {
        const s = stateRef.current;
        dispatch({ type: 'start', task, now: Date.now() });
        track('session_start', { kind: 'focus', minutes: s.minutes, scene: s.sceneId, hero: s.heroId });
      },
      abandon: () => {
        const a = stateRef.current.active;
        dispatch({ type: 'abandon' });
        if (a) {
          const progress = ((a.pausedAt ?? Date.now()) - a.startedAt) / (a.endsAt - a.startedAt);
          track('session_abandon', { kind: a.kind ?? 'focus', minutes: a.minutes, progress: Math.round(Math.min(1, Math.max(0, progress)) * 100) / 100 });
        }
      },
      pause: () => dispatch({ type: 'pause', now: Date.now() }),
      resume: () => dispatch({ type: 'resume', now: Date.now() }),
      startBreak: (long) => {
        const s = stateRef.current;
        const minutes = long ? s.longBreak : s.shortBreak;
        dispatch({ type: 'startBreak', minutes, now: Date.now() });
        track('session_start', { kind: 'break', minutes, scene: s.sceneId, hero: s.heroId });
      },
      setBreaks: (b) => {
        dispatch({ type: 'setBreaks', ...b });
        if (b.shortBreak !== undefined) track('setting_change', { key: 'short_break', value: b.shortBreak });
        if (b.longBreak !== undefined) track('setting_change', { key: 'long_break', value: b.longBreak });
      },
      setKeepAwake: (on) => {
        dispatch({ type: 'setKeepAwake', on });
        track('setting_change', { key: 'keep_awake', value: on });
      },
      rollDeal: () => dispatch({ type: 'rollDeal', now: Date.now(), pick: Math.random() }),
      endBreak: () => dispatch({ type: 'abandon' }),
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
