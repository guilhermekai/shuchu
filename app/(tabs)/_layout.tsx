import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '../../src/theme/tokens';
import { useI18n } from '../../src/i18n';

// Native tab bar: platform transitions, no slide between peers.
// iOS: screens pad themselves via useTabScrollInsets (automatic insets only reached the first tab).
const manualInsets = Platform.OS === 'ios';

export default function TabsLayout() {
  const t = useTheme();
  const { t: L } = useI18n();
  return (
    <NativeTabs tintColor={t.accent}>
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets={manualInsets}>
        <NativeTabs.Trigger.Label>{L.tabs.focus}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'timer', selected: 'timer' }} md="timer" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="heroes" disableAutomaticContentInsets={manualInsets}>
        <NativeTabs.Trigger.Label>{L.tabs.heroes}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="matsuri" disableAutomaticContentInsets={manualInsets}>
        <NativeTabs.Trigger.Label>{L.tabs.matsuri}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sparkles', selected: 'sparkles' }} md="celebration" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shop" disableAutomaticContentInsets={manualInsets}>
        <NativeTabs.Trigger.Label>{L.tabs.shop}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bag', selected: 'bag.fill' }} md="shopping_bag" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
