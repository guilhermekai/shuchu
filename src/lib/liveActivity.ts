/**
 * Live Activity for the running timer. iOS only (liveActivity.ios.ts); a no-op elsewhere,
 * so web and Android never load the native module.
 */
export type LiveTimer = {
  title: string;
  subtitle: string;
  pausedLabel: string;
  startedAt: number;
  endsAt: number;
  pausedAt: number | null;
  /** Remaining time shown while paused, e.g. "3:17". */
  pausedRemaining: string;
  isBreak: boolean;
};

/** Mirror the running timer (or its absence) in the Live Activity. */
export function syncLiveActivity(_timer: LiveTimer | null) {}
