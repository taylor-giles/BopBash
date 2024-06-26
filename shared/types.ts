import type { TransformKeys } from "./utils";

//A list of the possible game types
export enum GameType { SEARCH, CHOICES }
export const GAME_TYPE_OPTIONS = [
    GameType.SEARCH,
    GameType.CHOICES
];

//A list of the possible game visibilities
export enum GameVisibility { PUBLIC, PRIVATE }
export const GAME_VISIBILITY_OPTIONS = [
    GameVisibility.PUBLIC,
    GameVisibility.PRIVATE,
];

export interface GameOptions {
    numRounds?: number,
    roundDuration?: number,
    numChoices?: number
}


//A list of the possible game options
export type GameOptionMetadata = { key: keyof (GameOptions), name: string, label: string, type: "number", default: number, min: number, max: number, gameTypes: GameType[] }
export const ADVANCED_OPTIONS_DEFINITIONS: TransformKeys<GameOptions, GameOptionMetadata> = {
    numRounds: { key: "numRounds", name: "Number of Rounds", label: " Rounds", type: "number", default: 10, min: 1, max: 50, gameTypes: GAME_TYPE_OPTIONS },
    roundDuration: { key: "roundDuration", name: "Round Duration", label: "s Rounds", type: "number", default: 30, min: 10, max: 60, gameTypes: GAME_TYPE_OPTIONS },
    numChoices: { key: "numChoices", name: "Number of Choices", label: " Choices", type: "number", default: 4, min: 2, max: 8, gameTypes: [GameType.CHOICES] }
}

export enum GameStatus {
    PENDING = "Pending",
    ACTIVE = "Active",
    ENDED = "Ended"
}

export type TrackChoice = {
    id: string,
    name: string,
    artist: string
}

export class Round {
    trackId: string;
    previewURL: string;
    maxDuration: number;    //Maximum duration of this round, in milliseconds
    startTime: number;      //Maps player ID to the time that player started this round
    choices?: { id: string, name: string, artist: string }[]; //The choices to be used in a choices-style game

    public constructor(trackId: string, previewURL: string, maxDuration: number, choices?: TrackChoice[]) {
        this.trackId = trackId;
        this.previewURL = previewURL;
        this.maxDuration = maxDuration;
        this.startTime = 0;
        this.choices = choices;
    }
}

export type ChatMessage = {
    sender: string,
    content: string
}

export type PlayerState = {
    id: string,
    name: string,
    scores: Array<number | null>,
    isReady: boolean
}

export type GameState = {
    id: string,
    type: GameType,
    visibility: GameVisibility,
    players: Record<string, PlayerState>,
    playlist: {
        name: string,
        id: string,
        uri: string,
        description: string,
        numTracks: number
    },
    currentRound?: {
        index: number,
        audioURL: string,
        duration: number,
        choices?: TrackChoice[]
        trackId?: string
    }
    status: GameStatus,
    options: GameOptions,
    chatMessages: ChatMessage[]
}

export type GuessResult = {
    isCorrect: boolean,
    score: number,
    correctTrackId: string,
}

export type Artist = {
    id: string;
    name: string;
}

export type Album = {
    name: string, 
    images: { url: string, height: number | null, width: number | null }[]
}

export type Track = {
    id: string,
    uri: string,
    is_local: boolean,
    name: string,
    album: Album,
    artists: Artist[],
    previewURL?: string
}

export type PlaylistMetadata = {
    name: string,
    id: string,
    uri: string,
    external_urls: { spotify: string }
    type: "playlist",
    description: string,
    images: { height: number | null, width: number | null, url: string }[],
    owner: { display_name: string, id: string, type: "user", uri: string, external_urls: { spotify: string } }
    tracks: { total: number }
}

export type Playlist = PlaylistMetadata & {
    tracks: {
        total: number,
        items: { track: Track }[]
    }
}

//Helper type to describe the information given in a component of a Spotify search result.
type SpotifySearchResultComponent = {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
}

//Type to describe the results of a Spotify search. Includes only relevant properties.
export type SpotifySearchResult = {
    tracks: SpotifySearchResultComponent & {
        items: Track[];
    },
    artists: SpotifySearchResultComponent & {
        items: Artist[];
    },
    albums: SpotifySearchResultComponent & {
        items: Album[];
    },
    playlists: SpotifySearchResultComponent & {
        items: PlaylistMetadata[];
    }
}