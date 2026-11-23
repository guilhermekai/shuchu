/**
 * iOS Live Activity for a running session or break: Lock Screen banner and Dynamic Island.
 *
 * The countdown is a native SwiftUI timer (Text timerInterval), so it keeps ticking with the app
 * suspended; the app only updates the activity when the session is paused, resumed or ends.
 *
 * Rules of the 'widget' runtime (expo-widgets): the layout function runs isolated from the app.
 * No hooks, state, async work, or module-scope constants; only Expo UI components and modifiers.
 * Everything it shows (including translated text) comes in through props.
 */
import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { activityBackgroundTint, font, foregroundStyle, frame, monospacedDigit, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type FocusActivityProps = {
  /** e.g. "Haru is training" / "Haru is resting". */
  title: string;
  /** Mission text, or the break label. */
  subtitle: string;
  /** Shown instead of the subtitle while paused. */
  pausedLabel: string;
  startedAt: number;
  endsAt: number;
  /** Set while paused: the timer is replaced by this fixed remaining time (e.g. "3:17"). */
  pausedAt: number | null;
  pausedRemaining: string;
  isBreak: boolean;
};

const FocusActivity = (props: FocusActivityProps, environment: LiveActivityEnvironment) => {
  'widget';
  // The Lock Screen banner gets a fixed night-ink background (like the success screen), so
  // text colors don't depend on the reported color scheme, which can disagree with the banner.
  const accent = props.isBreak ? '#3FA27A' : '#E5483B';
  const symbol = props.isBreak ? 'cup.and.saucer.fill' : 'flame.fill';
  const ink = '#FFFFFF';
  const muted = environment.isLuminanceReduced ? '#8A8790' : '#B8B5BF';
  const interval = { lower: new Date(props.startedAt), upper: new Date(props.endsAt) };
  // Text(timerInterval:pauseTime:) kept ticking in the activity, so a paused timer is plain text.
  const paused = props.pausedAt !== null;

  return {
    banner: (
      <HStack spacing={12} modifiers={[padding({ all: 16 }), activityBackgroundTint('#1A1030')]}>
        <Image systemName={symbol} size={28} modifiers={[foregroundStyle(accent)]} />
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(ink)]}>{props.title}</Text>
          <Text modifiers={[font({ size: 13 }), foregroundStyle(muted)]}>{paused ? props.pausedLabel : props.subtitle}</Text>
        </VStack>
        <Spacer />
        {paused ? (
          <Text modifiers={[font({ size: 34, weight: 'bold', design: 'rounded' }), monospacedDigit(), foregroundStyle(accent), frame({ width: 110, alignment: 'trailing' })]}>{props.pausedRemaining}</Text>
        ) : (
          <Text timerInterval={interval} countsDown modifiers={[font({ size: 34, weight: 'bold', design: 'rounded' }), monospacedDigit(), foregroundStyle(accent), frame({ width: 110, alignment: 'trailing' })]} />
        )}
      </HStack>
    ),
    compactLeading: <Image systemName={symbol} modifiers={[foregroundStyle(accent)]} />,
    compactTrailing: paused ? (
      <Text modifiers={[monospacedDigit(), foregroundStyle(accent), frame({ width: 52, alignment: 'trailing' })]}>{props.pausedRemaining}</Text>
    ) : (
      <Text timerInterval={interval} countsDown modifiers={[monospacedDigit(), foregroundStyle(accent), frame({ width: 52, alignment: 'trailing' })]} />
    ),
    minimal: <Image systemName={symbol} modifiers={[foregroundStyle(accent)]} />,
    expandedLeading: (
      <HStack spacing={6} modifiers={[padding({ leading: 6 })]}>
        <Image systemName={symbol} modifiers={[foregroundStyle(accent)]} />
        <Text modifiers={[font({ size: 15, weight: 'semibold' })]}>{props.title}</Text>
      </HStack>
    ),
    expandedTrailing: paused ? (
      <Text modifiers={[font({ size: 22, weight: 'bold', design: 'rounded' }), monospacedDigit(), foregroundStyle(accent), frame({ width: 80, alignment: 'trailing' })]}>{props.pausedRemaining}</Text>
    ) : (
      <Text timerInterval={interval} countsDown modifiers={[font({ size: 22, weight: 'bold', design: 'rounded' }), monospacedDigit(), foregroundStyle(accent), frame({ width: 80, alignment: 'trailing' })]} />
    ),
    expandedBottom: (
      <Text modifiers={[font({ size: 13 }), foregroundStyle(muted), padding({ leading: 6 })]}>
        {paused ? props.pausedLabel : props.subtitle}
      </Text>
    ),
  };
};

export default createLiveActivity('ShuchuFocus', FocusActivity);
