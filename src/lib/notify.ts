/**
 * Local notification for the end of a session or break. One pending notification at a
 * time, under a fixed identifier, so rescheduling (resume) and cancelling (pause,
 * abandon) never leave a stale one behind. Web has no scheduled notifications: no-op.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const ID = 'shuchu-session-end';
const native = Platform.OS !== 'web';

if (native) {
  // While the app is open, the in-app celebration is the alert: stay quiet.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Ask once, at the moment it's useful (first Begin). Returns whether we may notify. */
export async function ensurePermission(): Promise<boolean> {
  if (!native) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function scheduleEnd(at: number, title: string, body: string) {
  if (!native || at <= Date.now()) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(ID);
    await Notifications.scheduleNotificationAsync({
      identifier: ID,
      content: { title, body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
  } catch {
    // Notifications are a convenience; the in-app timer still works without them.
  }
}

export async function cancelEnd() {
  if (!native) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(ID);
  } catch {
    // nothing scheduled
  }
}
