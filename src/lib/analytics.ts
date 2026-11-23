/**
 * Product analytics, provider-agnostic. Screens and the store call `track`; nothing leaves the
 * device until a provider is plugged in with `setAnalyticsSink` (PostHog, Firebase, ...).
 *
 * Privacy: events carry no personal data. Never add the mission text, names or free-form input.
 *
 * The events answer the launch questions: do people come back (D1/D7/D30 from session_complete),
 * how far into a session they quit (session_abandon.progress), and whether the economy works
 * (hero_recruit / item_buy timing and deal usage).
 */
export type AnalyticsEvents = {
  session_start: { kind: 'focus' | 'break'; minutes: number; scene: string; hero: string };
  session_complete: { minutes: number; reward: number; streak: number; arc_cleared: boolean; first_today: boolean };
  session_abandon: { kind: 'focus' | 'break'; minutes: number; progress: number };
  hero_recruit: { hero: string; cost: number; sessions: number };
  item_buy: { item: string; price: number; deal: boolean; sessions: number };
  setting_change: { key: 'lang' | 'short_break' | 'long_break' | 'keep_awake'; value: string | number | boolean };
};

export type AnalyticsEvent = keyof AnalyticsEvents;
type Sink = <E extends AnalyticsEvent>(event: E, props: AnalyticsEvents[E]) => void;

let sink: Sink | null = null;

/** Plug in a provider once at startup, e.g. `setAnalyticsSink((e, p) => posthog.capture(e, p))`. */
export function setAnalyticsSink(next: Sink | null) {
  sink = next;
}

export function track<E extends AnalyticsEvent>(event: E, props: AnalyticsEvents[E]) {
  try {
    sink?.(event, props);
  } catch {
    // Analytics must never break the app.
  }
}
