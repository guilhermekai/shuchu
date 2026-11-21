import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Chip, PressableScale, T } from '../src/components/ui';
import { useI18n, type LangSetting } from '../src/i18n';
import { useStore } from '../src/state/store';
import { radius, space, useTheme } from '../src/theme/tokens';

export default function Settings() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { t: L } = useI18n();
  const options: { value: LangSetting; label: string }[] = [
    { value: 'system', label: L.settings.system },
    { value: 'en', label: L.settings.english },
    { value: 'pt', label: L.settings.portuguese },
  ];

  // Sized by content (no flex: 1) so the sheet's fitToContents detent can measure it.
  return (
    <View style={{ backgroundColor: t.bg, paddingHorizontal: space.md, paddingTop: space.xl, paddingBottom: insets.bottom + space.lg }}>
      <View style={styles.titleRow}>
        <T v="title2">{L.settings.title}</T>
        <PressableScale onPress={() => router.back()} haptic="selection" accessibilityRole="button" accessibilityLabel={L.common.dismiss}>
          <T v="headline" color="accent">{L.common.ok}</T>
        </PressableScale>
      </View>

      <T v="footnote" color="secondary" style={styles.section}>
        {L.settings.language.toUpperCase()}
      </T>
      <View style={[styles.group, { backgroundColor: t.surface, borderColor: t.border }]} accessibilityRole="radiogroup">
        {options.map((o, i) => {
          const selected = store.lang === o.value;
          return (
            <PressableScale
              key={o.value}
              onPress={() => store.setLang(o.value)}
              haptic="selection"
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={o.label}
              style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }]}
            >
              <T v="body" style={{ flex: 1 }}>{o.label}</T>
              {selected && (
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={t.accent} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
            </PressableScale>
          );
        })}
      </View>

      <T v="footnote" color="secondary" style={[styles.section, { marginTop: space.xl }]}>
        {L.settings.breaks.toUpperCase()}
      </T>
      <View style={[styles.group, styles.groupPad, { backgroundColor: t.surface, borderColor: t.border }]}>
        <T v="subhead">{L.settings.shortBreak}</T>
        <View style={styles.chips}>
          {SHORT.map((m) => (
            <Chip key={m} grow label={String(m)} sub="min" selected={store.shortBreak === m} onPress={() => store.setBreaks({ shortBreak: m })} />
          ))}
        </View>
        <T v="subhead" style={{ marginTop: space.sm }}>{L.settings.longBreak}</T>
        <View style={styles.chips}>
          {LONG.map((m) => (
            <Chip key={m} grow label={String(m)} sub="min" selected={store.longBreak === m} onPress={() => store.setBreaks({ longBreak: m })} />
          ))}
        </View>
      </View>

      <T v="footnote" color="secondary" style={[styles.section, { marginTop: space.xl }]}>
        {L.settings.notifications.toUpperCase()}
      </T>
      <T v="footnote" color="secondary" style={{ marginHorizontal: space.md }}>
        {L.settings.notificationsHint}
      </T>
    </View>
  );
}

const SHORT = [3, 5, 10];
const LONG = [10, 15, 20, 30];

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg },
  section: { marginBottom: space.xs, marginLeft: space.md, letterSpacing: 0.4 },
  group: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: space.md },
  groupPad: { padding: space.md, gap: space.xs },
  chips: { flexDirection: 'row', gap: space.xs },
});
