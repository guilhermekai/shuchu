/**
 * Web-only tab layout. The native tab bar renders as a floating bar over the
 * top of each screen on web, covering headers, so the web build uses a
 * conventional bottom bar instead. iOS/Android keep NativeTabs (_layout.tsx).
 */
import { Tabs } from 'expo-router/tabs';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../src/theme/tokens';
import { useI18n } from '../../src/i18n';

type IconName = 'focus' | 'heroes' | 'matsuri' | 'shop';

function TabIcon({ name, color }: { name: IconName; color: string }) {
  const p = { stroke: color, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {name === 'focus' && (
        <>
          <Circle cx="12" cy="13" r="8" {...p} />
          <Path d="M12 9v4l2.5 2.5M9.5 2.5h5" {...p} />
        </>
      )}
      {name === 'heroes' && (
        <>
          <Circle cx="9" cy="8" r="3.5" {...p} />
          <Path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" {...p} />
          <Path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.9c1.6.8 2.7 2.5 3 5.1" {...p} />
        </>
      )}
      {name === 'matsuri' && (
        <>
          <Path d="M12 2.5v2" {...p} />
          <Path d="M7 7.5h10M7 17.5h10M12 21.5v-2" {...p} />
          <Path d="M7.5 7.5c-1.4 1.4-2 3-2 5s.6 3.6 2 5h9c1.4-1.4 2-3 2-5s-.6-3.6-2-5" {...p} />
          <Path d="M8.5 4.5h7v3h-7z" {...p} />
        </>
      )}
      {name === 'shop' && (
        <>
          <Path d="M5 8h14l-1.2 12.5H6.2z" {...p} />
          <Path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3" {...p} />
        </>
      )}
    </Svg>
  );
}

export default function TabsLayoutWeb() {
  const t = useTheme();
  const { t: L } = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'none', // tabs are peers: never slide between them
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.textTertiary,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border, height: 64 },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
        tabBarItemStyle: { paddingTop: 4, paddingBottom: 6 },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: L.tabs.focus, tabBarIcon: ({ color }) => <TabIcon name="focus" color={String(color)} /> }} />
      <Tabs.Screen name="heroes" options={{ title: L.tabs.heroes, tabBarIcon: ({ color }) => <TabIcon name="heroes" color={String(color)} /> }} />
      <Tabs.Screen name="matsuri" options={{ title: L.tabs.matsuri, tabBarIcon: ({ color }) => <TabIcon name="matsuri" color={String(color)} /> }} />
      <Tabs.Screen name="shop" options={{ title: L.tabs.shop, tabBarIcon: ({ color }) => <TabIcon name="shop" color={String(color)} /> }} />
    </Tabs>
  );
}
