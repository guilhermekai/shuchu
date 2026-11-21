import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '../../src/theme/tokens';

// Native tab bar: platform transitions, no slide between peers.
export default function TabsLayout() {
  const t = useTheme();
  return (
    <NativeTabs tintColor={t.accent}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Focus</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'timer', selected: 'timer' }} md="timer" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="heroes">
        <NativeTabs.Trigger.Label>Heroes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="matsuri">
        <NativeTabs.Trigger.Label>Matsuri</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sparkles', selected: 'sparkles' }} md="celebration" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shop">
        <NativeTabs.Trigger.Label>Shop</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bag', selected: 'bag.fill' }} md="shopping_bag" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
