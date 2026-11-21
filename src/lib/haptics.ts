/**
 * Haptics that stay silent on web: browsers block navigator.vibrate without a recent
 * tap (e.g. when a session completes on its own), and desktop has no vibration anyway.
 */
import { Platform } from 'react-native';
import * as H from 'expo-haptics';

export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';

const web = Platform.OS === 'web';
export const selectionAsync = () => (web ? Promise.resolve() : H.selectionAsync());
export const impactAsync = (style?: H.ImpactFeedbackStyle) => (web ? Promise.resolve() : H.impactAsync(style));
export const notificationAsync = (type?: H.NotificationFeedbackType) => (web ? Promise.resolve() : H.notificationAsync(type));
