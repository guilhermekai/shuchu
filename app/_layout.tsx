import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { useFonts, ZenMaruGothic_500Medium, ZenMaruGothic_700Bold, ZenMaruGothic_900Black } from '@expo-google-fonts/zen-maru-gothic';
import { StoreProvider } from '../src/state/store';
import { useTheme } from '../src/theme/tokens';

export default function RootLayout() {
  const [loaded] = useFonts({ ZenMaruGothic_500Medium, ZenMaruGothic_700Bold, ZenMaruGothic_900Black });
  const t = useTheme();
  const reduced = useReducedMotion();
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: t.bg }}>
      <StoreProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
          <Stack.Screen name="(tabs)" />
          {/* A self-contained task the user can abandon → full-screen modal */}
          <Stack.Screen name="focus" options={{ presentation: 'fullScreenModal', animation: reduced ? 'fade' : 'slide_from_bottom', gestureEnabled: false }} />
          {/* The reward moment draws its own entrance; the native transition is a plain fade */}
          <Stack.Screen name="success" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
        </Stack>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
