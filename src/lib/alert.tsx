/**
 * Alert that works everywhere. Native: the system alert. Web: an in-app dialog,
 * because browser confirm() is unavailable in embedded previews.
 */
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View, type AlertButton } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button, T } from '../components/ui';
import { motion, radius, space, useTheme } from '../theme/tokens';
import { useI18n } from '../i18n';

type Req = { title: string; message?: string; buttons: AlertButton[] };
let show: ((r: Req | null) => void) | null = null;

export function alert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  show?.({ title, message, buttons: buttons ?? [] });
}

/** Mount once at the root. Renders nothing on native. */
export function AlertHost() {
  const t = useTheme();
  const { t: L } = useI18n();
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
  // Actions first, cancel last (iOS order for stacked buttons); a bare alert gets a single OK.
  // With a destructive choice, the safe option is the filled button (and listed first).
  const hasDestructive = req.buttons.some((b) => b.style === 'destructive');
  const ordered: AlertButton[] = req.buttons.length
    ? [...req.buttons.filter((b) => b.style !== 'cancel'), ...req.buttons.filter((b) => b.style === 'cancel')]
    : [{ text: L.common.ok }];
  const buttons = hasDestructive ? [...ordered].reverse() : ordered;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)} style={[StyleSheet.absoluteFill, styles.scrim]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close(cancel)} accessibilityLabel={L.common.dismiss} />
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
            {buttons.map((b, i) => (
              <Button
                key={i}
                label={b.text ?? L.common.ok}
                kind={hasDestructive ? (b.style === 'cancel' ? 'primary' : 'ghost') : b.style === 'cancel' ? 'ghost' : 'primary'}
                color={b.style === 'destructive' ? t.accent : undefined}
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
