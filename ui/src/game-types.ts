import type { ComponentType } from "svelte";
import NormalIcon from "svelte-material-icons/MusicCircle.svelte"
import ChoicesIcon from "svelte-material-icons/MusicBoxMultiple.svelte"
import TheaterIcon from "svelte-material-icons/Theater.svelte"
import PublicIcon from "svelte-material-icons/Earth.svelte"
import PrivateIcon from "svelte-material-icons/Lock.svelte"
import { GameType, GameVisibility } from "../../shared/types"


export type GameTypeMetadata = {name: string, description: string, icon: ComponentType}
export const GameTypes: Record<GameType, GameTypeMetadata> = {
    [GameType.NORMAL]: {name: "Normal", description: "A high-speed song guessing game. Type the title to earn points!", icon: NormalIcon},
    [GameType.CHOICES]: {name: "Choices", description: "Lightning rounds with song choices. Be quick and click the right song choice to earn points!", icon: ChoicesIcon},
    [GameType.THEATER]: {name: "Theater", description: "In-person song guessing fun. Each player uses their device to guess the track, which plays from one device.", icon: TheaterIcon}
}

export type GameVisibilityMetadata = { name: string, description: string, icon: ComponentType}
export const GameVisibilities: Record<GameVisibility, GameVisibilityMetadata> = {
    [GameVisibility.PUBLIC]: {name: "Public", description: "Anyone can join this game from the Find Games page.", icon: PublicIcon},
    [GameVisibility.PRIVATE]: {name: "Private", description: "Only players with the Game ID will be able to join this game.", icon: PrivateIcon}
}