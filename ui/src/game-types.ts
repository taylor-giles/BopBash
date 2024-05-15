import type { ComponentType } from "svelte";
import SearchIcon from "svelte-material-icons/MusicCircle.svelte"
import ChoicesIcon from "svelte-material-icons/MusicBoxMultiple.svelte"
import PublicIcon from "svelte-material-icons/Earth.svelte"
import PrivateIcon from "svelte-material-icons/Lock.svelte"
import DurationIcon from "svelte-material-icons/TimerMusic.svelte";
import RoundsIcon from "svelte-material-icons/Music.svelte";
import { ADVANCED_OPTIONS_DEFINITIONS, GameType, GameVisibility, type GameOptions, type GameOptionMetadata } from "../../shared/types"
import type { TransformKeys } from "../../shared/utils";


// Define names and descriptions for each of the game type options
export type GameTypeMetadata = { name: string, description: string, instructions: string, icon: ComponentType }
export const GAME_TYPES: Record<GameType, GameTypeMetadata> = {
    [GameType.SEARCH]: { name: "Search", description: "A high-speed guessing game. Find the right song to earn points!", instructions: "Search for the song by title, artist, and/or album (for example, \"love story\", \"swift love story\", or \"taylor swift fearless\"). Choose from the options that appear. If the song you are trying to find does not appear, try a more specific search.", icon: SearchIcon },
    [GameType.CHOICES]: { name: "Choices", description: "Be quick and click the right song choice to earn points!", instructions: "Pick the right song (or take your best guess) from the choices that appear.", icon: ChoicesIcon },
}

// Define names and descriptions for each of the game visibility options
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

// Define lists of phrases to display when the player gets the answer correct or incorrect
export const CONCLUSION_PHRASES_CORRECT  =  [
    "Nice job!", 
    "Nicely done!",
    "Perfect",
    "Excellent",
    "True genius",
    "(*＾ᴗ＾*)",
    "That is correct!",
    "Bravo! Encore!",
    "Exactly as planned",
    "You're a great listener",
    "😎👍",
    "🎶&nbsp;I feel good, da-da-da...&nbsp;🎶",
    "🎶&nbsp;Walking on sunshine, woah-oh&nbsp;🎶",
    "🎶&nbsp;Celebrate good times, come on!&nbsp;🎶",
    "🎶&nbsp;Don't stop me now&nbsp;🎶",
    "🎶&nbsp;We are the champions&nbsp;🎶",
    "🎶&nbsp;Bop to the top!&nbsp;🎶",
];
export const CONCLUSION_PHRASES_INCORRECT = [
    "Aww, shucks", 
    "¯\\_(ツ)_/¯", 
    "Better luck next round", 
    "Sorry, but no.",
    "You'll get the next one",
    "Just a bump in the road",
    "Almost had it!",
    "(´╥︵╥`)",
    "Dang it!",
    "Honest mistake",
    "Maybe you misclicked?",
    "🎧&nbsp;Shake it off, shake it off&nbsp;🎧",
    "🎧&nbsp;Can't always get what you want&nbsp;🎧",
    "🎧&nbsp;Hello darkness, my old friend&nbsp;🎧",
    "🎧&nbsp;Oops, I did it again&nbsp;🎧",
    "🎧&nbsp;I'm blue, da-ba-dee...&nbsp;🎧",
];
