/**
 * Design tokens.
 *
 * ⚠️ PLACEHOLDER VALUES. The design system artifact linked in the brief could not
 * be read from this session, so these tokens are a neutral, iOS-native baseline.
 * Every component reads from here and nowhere else — swap the values in this one
 * file to bring the app onto the real design system.
 */
import { Easing } from 'react-native-reanimated';
import { useColorScheme } from 'react-native';

const palette = {
  paper: '#F6F3EE',
  paperRaised: '#FFFFFF',
  ink: '#1B1A1F',
  inkSoft: '#5E5B66',
  inkFaint: '#9A96A3',
  hairline: 'rgba(27,26,31,0.10)',

  night: '#121019',
  nightRaised: '#1D1A27',
  nightInk: '#F4F1F8',
  nightInkSoft: '#B3AEC0',
  nightInkFaint: '#7A7588',
  nightHairline: 'rgba(244,241,248,0.12)',

  // Anime accents — used sparingly
  sakura: '#F07C9A',
  sakuraSoft: '#FFE3EA',
  shu: '#E5483B', // 朱 vermilion (torii, primary action)
  shuSoft: '#FFE4DF',
  matcha: '#4FA36B',
  ai: '#3B5BDB', // 藍 indigo
  kin: '#F5B83D', // 金 gold (onigiri / rewards)
  kinSoft: '#FFF2D6',
};

export const light = {
  bg: palette.paper,
  surface: palette.paperRaised,
  text: palette.ink,
  textSecondary: palette.inkSoft,
  textTertiary: palette.inkFaint,
  border: palette.hairline,
  panelStroke: palette.ink, // manga panel outline
  accent: palette.shu,
  accentSoft: palette.shuSoft,
  sakura: palette.sakura,
  sakuraSoft: palette.sakuraSoft,
  gold: palette.kin,
  goldSoft: palette.kinSoft,
  success: palette.matcha,
  info: palette.ai,
  onAccent: '#FFFFFF',
};

export type Theme = typeof light;

export const dark: Theme = {
  bg: palette.night,
  surface: palette.nightRaised,
  text: palette.nightInk,
  textSecondary: palette.nightInkSoft,
  textTertiary: palette.nightInkFaint,
  border: palette.nightHairline,
  panelStroke: '#4B4560', // softer ink on night paper: a white offset shadow glares
  accent: '#FF6A5C',
  accentSoft: 'rgba(255,106,92,0.16)',
  sakura: palette.sakura,
  sakuraSoft: 'rgba(240,124,154,0.16)',
  gold: palette.kin,
  goldSoft: 'rgba(245,184,61,0.16)',
  success: '#6CC488',
  info: '#748FFC',
  onAccent: '#FFFFFF',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

/** System font (SF Pro) for UI; Zen Maru Gothic only for Japanese accents. */
export const font = {
  jp: 'ZenMaruGothic_700Bold',
  jpBlack: 'ZenMaruGothic_900Black',
  jpRegular: 'ZenMaruGothic_500Medium',
};

/** iOS text styles (size / line height / weight). */
export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.37 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: 0.36 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: 0.35 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: 0.38 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.41 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.41 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400', letterSpacing: -0.32 },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.24 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: -0.08 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0 },
} as const;

/** Motion — curves and springs from Emil's animate-expo tables. */
export const motion = {
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
  easeSheet: Easing.bezier(0.32, 0.72, 0, 1),
  springSettle: { duration: 400, dampingRatio: 1 },
  springSnap: { duration: 400, dampingRatio: 0.8 },
  press: 120,
  small: 180,
};
