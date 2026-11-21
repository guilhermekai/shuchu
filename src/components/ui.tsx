/** Design-system primitives with the anime accents layered on top. */
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from '../lib/haptics';
import { font, radius, space, type as typeScale, useTheme } from '../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Press feedback: scale 0.97 on press-in, 120ms strong ease-out (Emil) ────
export function PressableScale({
  children,
  style,
  haptic,
  containerStyle,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle>; containerStyle?: StyleProp<ViewStyle>; children: ReactNode; haptic?: 'selection' | 'light' }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      hitSlop={8}
      pressRetentionOffset={16}
      style={containerStyle}
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        if (haptic === 'selection') Haptics.selectionAsync();
        if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        rest.onPressOut?.(e);
      }}
    >
      <Animated.View style={[styles.pressBase, style, pressed && !rest.disabled && styles.pressed]}>{children}</Animated.View>
    </Pressable>
  );
}

/**
 * Insets for the scroll view at the top of a tab screen.
 * iOS: NativeTabs enables automatic content insets on that scroll view (status bar and tab bar).
 * Android: NativeTabs pads the bottom; the top is ours. Web: the JS tab bar sits below the content.
 */
export function useTabScrollInsets() {
  const insets = useSafeAreaInsets();
  return { top: Platform.OS === 'ios' ? 0 : insets.top };
}

// ── Text ─────────────────────────────────────────────────────────────────────
type TextVariant = keyof typeof typeScale;
export function T({
  v = 'body',
  color,
  style,
  children,
  numberOfLines,
  header,
}: {
  v?: TextVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'onAccent' | string;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
  /** Announce as a heading. Large titles are headings by default. */
  header?: boolean;
}) {
  const t = useTheme();
  const c =
    color === undefined || color === 'primary'
      ? t.text
      : color === 'secondary'
        ? t.textSecondary
        : color === 'tertiary'
          ? t.textTertiary
          : color === 'accent'
            ? t.accent
            : color === 'onAccent'
              ? t.onAccent
              : color;
  return (
    <Text numberOfLines={numberOfLines} accessibilityRole={header ?? v === 'largeTitle' ? 'header' : undefined} style={[typeScale[v] as TextStyle, { color: c }, style]}>
      {children}
    </Text>
  );
}

/** Japanese accent label — small, rounded, never the primary reading text. */
export function JP({ children, size = 13, color, style }: { children: ReactNode; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ fontFamily: font.jp, fontSize: size, color: color ?? t.textTertiary, letterSpacing: 1 }, style]}>{children}</Text>;
}

// ── Manga-panel card: hard 2pt ink stroke + offset "print" shadow ───────────
export function Panel({ children, style, tone = 'surface', tilt = 0 }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'surface' | 'accent' | 'gold'; tilt?: number }) {
  const t = useTheme();
  const bg = tone === 'accent' ? t.accentSoft : tone === 'gold' ? t.goldSoft : t.surface;
  return (
    <View style={[{ transform: tilt ? [{ rotate: `${tilt}deg` }] : undefined }, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: t.panelStroke, borderRadius: radius.md, transform: [{ translateX: 3 }, { translateY: 3 }] }]} />
      <View style={{ backgroundColor: bg, borderRadius: radius.md, borderWidth: 2, borderColor: t.panelStroke, overflow: 'hidden', flexGrow: 1 }}>{children}</View>
    </View>
  );
}

// ── Buttons ─────────────────────────────────────────────────────────────────
export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  icon,
  style,
  haptic = 'light',
  color,
  containerStyle,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: 'selection' | 'light';
  /** Label color override, e.g. a ghost button on a dark stage. */
  color?: string;
  /** Layout of the outer pressable (flex, alignSelf); `style` styles the visible button. */
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  // Disabled buttons stay legible: an outline with secondary text instead of a faded fill.
  const bg = disabled ? 'transparent' : kind === 'primary' ? t.accentFill : kind === 'secondary' ? t.surface : 'transparent';
  const fg = disabled ? t.textSecondary : (color ?? (kind === 'primary' ? t.onAccent : t.text));
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic={haptic}
      containerStyle={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        styles.button,
        { backgroundColor: bg },
        (kind === 'secondary' || (disabled && kind === 'primary')) && { borderWidth: 2, borderColor: disabled ? t.border : t.panelStroke },
        style,
      ]}
    >
      {icon}
      <Text style={[typeScale.headline as TextStyle, { color: fg }]}>{label}</Text>
    </PressableScale>
  );
}

export function Chip({ label, sub, selected, onPress, grow }: { label: string; sub?: string; selected: boolean; onPress: () => void; grow?: boolean }) {
  const t = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityState={{ selected }}
      containerStyle={grow ? { flex: 1 } : undefined}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? t.text : t.surface,
          borderColor: selected ? t.text : t.border,
          transitionProperty: ['backgroundColor', 'borderColor'],
          transitionDuration: 150,
        } as ViewStyle,
      ]}
    >
      <Text style={[typeScale.subhead as TextStyle, { color: selected ? t.bg : t.text, fontWeight: '600' }]}>{label}</Text>
      {sub ? <Text style={{ fontFamily: font.jp, fontSize: 10, color: selected ? t.bg : t.textTertiary, opacity: 0.8 }}>{sub}</Text> : null}
    </PressableScale>
  );
}

// ── Onigiri currency ─────────────────────────────────────────────────────────
export function Onigiri({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2.5 Q14.5 2.5 17 7 L21.2 15 Q23 19.8 18.5 21 L5.5 21 Q1 19.8 2.8 15 L7 7 Q9.5 2.5 12 2.5 Z" fill="#FFFFFF" stroke="#1B1A1F" strokeWidth={1.6} />
      <Rect x="7" y="13.5" width="10" height="7.5" rx="1.2" fill="#1F3B2D" />
    </Svg>
  );
}

export function OnigiriBalance({ amount, compact }: { amount: number; compact?: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.balance, { backgroundColor: t.goldSoft, paddingHorizontal: compact ? 10 : 12 }]} accessible accessibilityLabel={`${amount} onigiri`}>
      <Onigiri size={compact ? 16 : 18} />
      <Text style={[typeScale.headline as TextStyle, { color: t.text, fontVariant: ['tabular-nums'] }]}>{amount}</Text>
    </View>
  );
}

export function SectionHeader({ title, jp, right }: { title: string; jp?: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <T v="title3">{title}</T>
        {jp ? <JP>{jp}</JP> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  pressBase: {
    transform: [{ scale: 1 }],
    transitionProperty: 'transform',
    transitionDuration: '120ms',
    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
  } as ViewStyle,
  pressed: { transform: [{ scale: 0.97 }] },
  button: {
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.xs,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balance: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 34, paddingVertical: 4, borderRadius: radius.pill },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
});
