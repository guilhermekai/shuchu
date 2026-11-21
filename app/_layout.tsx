import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { useFonts, ZenMaruGothic_500Medium, ZenMaruGothic_700Bold, ZenMaruGothic_900Black } from '@expo-google-fonts/zen-maru-gothic';
import { StoreProvider } from '../src/state/store';
import { AlertHost } from '../src/lib/alert';
import { useTheme } from '../src/theme/tokens';

// Deep links to /focus or /success get the tabs underneath, so back always has somewhere to go.
export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  // The single-file web preview ships these fonts inline as @font-face, so skip loading them there.
  const [loaded, error] = useFonts(
    Platform.OS === 'web' && !__DEV__ ? {} : { ZenMaruGothic_500Medium, ZenMaruGothic_700Bold, ZenMaruGothic_900Black },
  );
  const t = useTheme();
  const reduced = useReducedMotion();
  if (!loaded && !error) return null;
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
          <Stack.Screen name="stats" options={{ presentation: 'modal' }} />
          {/* A short interruption → native form sheet sized to its content */}
          <Stack.Screen
            name="settings"
            options={{ presentation: 'formSheet', sheetAllowedDetents: 'fitToContents', sheetGrabberVisible: true, sheetCornerRadius: 24 }}
          />
        </Stack>
        <AlertHost />
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
