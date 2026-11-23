/**
 * Live Activity for the running timer (Lock Screen + Dynamic Island). One activity at a time:
 * started when a session or break begins, updated on pause/resume, ended when it finishes or
 * is abandoned. The countdown ticks natively, so no updates are needed while it runs.
 */
import FocusActivity from '../widgets/FocusActivity';
import type { LiveTimer } from './liveActivity';

export type { LiveTimer } from './liveActivity';

let lastKey = '';

export function syncLiveActivity(timer: LiveTimer | null) {
  try {
    const running = FocusActivity.getInstances();
    if (!timer) {
      lastKey = '';
      running.forEach((a) => a.end('immediate').catch(() => {}));
      return;
    }
    const key = JSON.stringify(timer);
    if (key === lastKey && running.length === 1) return;
    lastKey = key;
    const [current, ...extra] = running;
    extra.forEach((a) => a.end('immediate').catch(() => {}));
    // Past the end the system de-emphasizes it until the app closes it out.
    const stale = timer.pausedAt ? undefined : new Date(timer.endsAt);
    if (current) current.update(timer, stale).catch(() => {});
    else FocusActivity.start(timer, 'shuchu://focus', stale);
  } catch {
    // Live Activities can be disabled by the user or unavailable: the app works without them.
  }
}
