import type { ComponentType } from "svelte";
import SearchIcon from "svelte-material-icons/MusicCircle.svelte"
import ChoicesIcon from "svelte-material-icons/MusicBoxMultiple.svelte"
import PublicIcon from "svelte-material-icons/Earth.svelte"
import PrivateIcon from "svelte-material-icons/Lock.svelte"
import DurationIcon from "svelte-material-icons/TimerMusic.svelte";
import RoundsIcon from "svelte-material-icons/Music.svelte";
import { ADVANCED_OPTIONS_DEFINITIONS, GameType, GameVisibility, type GameOptions, type GameOptionMetadata } from "../../shared/types"
import type { TransformKeys } from "../../shared/utils";


export type GameTypeMetadata = { name: string, description: string, icon: ComponentType }
export const GAME_TYPES: Record<GameType, GameTypeMetadata> = {
    [GameType.SEARCH]: { name: "Search", description: "A high-speed guessing game. Find the right song to earn points!", icon: SearchIcon },
    [GameType.CHOICES]: { name: "Choices", description: "Be quick and click the right song choice to earn points!", icon: ChoicesIcon },
}

export type GameVisibilityMetadata = { name: string, description: string, icon: ComponentType }
export const GAME_VISIBILITIES: Record<GameVisibility, GameVisibilityMetadata> = {
    [GameVisibility.PUBLIC]: { name: "Public", description: "Anyone can join this game from the Find Games page.", icon: PublicIcon },
    [GameVisibility.PRIVATE]: { name: "Private", description: "Only players with the Game ID will be able to join this game.", icon: PrivateIcon }
}

// Attach icons to the definitions of the advanced options
export const ADVANCED_OPTIONS_DEFINITIONS_WITH_ICONS: TransformKeys<GameOptions, GameOptionMetadata & { icon?: ComponentType }> = { ...ADVANCED_OPTIONS_DEFINITIONS };
ADVANCED_OPTIONS_DEFINITIONS_WITH_ICONS.numRounds!.icon = RoundsIcon;
ADVANCED_OPTIONS_DEFINITIONS_WITH_ICONS.roundDuration!.icon = DurationIcon;
ADVANCED_OPTIONS_DEFINITIONS_WITH_ICONS.numChoices!.icon = ChoicesIcon;
