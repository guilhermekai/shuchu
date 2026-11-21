/**
 * The one place screens ask for a character. Today it renders the SVG chibi.
 *
 * Rive hand-off: when the .riv files are ready,
 *   1. `npx expo install rive-react-native` (needs a dev build — not Expo Go),
 *   2. drop `shuchu.riv` into assets/ and register it in app.json,
 *   3. render <Rive resourceName="shuchu" artboardName={hero.riveArtboard}
 *        stateMachineName="Locomotion" /> below, driving the state machine's
 *      `mode` number input from MODE_INPUT[mode] and boolean inputs per equipped slot.
 * Screens don't change — they only pass heroId / mode / equipped / size.
 */
import { Chibi, type ChibiMode } from './Chibi';
import { useEquipped } from '../state/store';
import type { HeroId } from '../data/characters';
import type { Slot } from '../data/shop';

export const MODE_INPUT: Record<ChibiMode, number> = { idle: 0, walk: 1, run: 2, cheer: 3 };

type Props = {
  heroId: HeroId;
  mode?: ChibiMode;
  size?: number;
  offset?: number;
  showPet?: boolean;
  /** Override equipped items (e.g. shop preview); defaults to the hero's saved loadout. */
  equipped?: Partial<Record<Slot, string>>;
};

export function HeroSprite({ heroId, equipped, ...rest }: Props) {
  const saved = useEquipped(heroId);
  return <Chibi heroId={heroId} equipped={equipped ?? saved} {...rest} />;
}
