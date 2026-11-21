/**
 * Alert that works everywhere. Native: the system alert. Web: an in-app dialog,
 * because browser confirm() is unavailable in embedded previews.
 */
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View, type AlertButton } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button, T } from '../components/ui';
import { motion, radius, space, useTheme } from '../theme/tokens';

type Req = { title: string; message?: string; buttons: AlertButton[] };
let show: ((r: Req | null) => void) | null = null;

export function alert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  show?.({ title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] });
}

/** Mount once at the root. Renders nothing on native. */
export function AlertHost() {
  const t = useTheme();
  const [req, setReq] = useState<Req | null>(null);
  useEffect(() => {
    show = setReq;
    return () => {
      show = null;
    };
  }, []);
  if (Platform.OS !== 'web' || !req) return null;
  const close = (b?: AlertButton) => {
    setReq(null);
    b?.onPress?.();
  };
  const cancel = req.buttons.find((b) => b.style === 'cancel');
  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)} style={[StyleSheet.absoluteFill, styles.scrim]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close(cancel)} accessibilityLabel="Dismiss" />
      </Animated.View>
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          entering={FadeIn.duration(180).easing(motion.easeOut)}
          style={[styles.card, { backgroundColor: t.surface, borderColor: t.panelStroke }]}
          accessibilityRole="alert"
        >
          <T v="headline" style={{ textAlign: 'center' }}>{req.title}</T>
          {req.message ? <T v="subhead" color="secondary" style={{ textAlign: 'center' }}>{req.message}</T> : null}
          <View style={{ gap: space.xs, marginTop: space.sm }}>
            {[...req.buttons].sort((a) => (a.style === 'cancel' ? 1 : -1)).map((b, i) => (
              <Button
                key={i}
                label={b.text ?? 'OK'}
                kind={b.style === 'cancel' ? 'ghost' : 'primary'}
                onPress={() => close(b)}
                haptic="selection"
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(0,0,0,0.35)' },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: { width: '100%', maxWidth: 320, borderRadius: radius.lg, borderWidth: 2, padding: space.lg, gap: space.xs },
});
