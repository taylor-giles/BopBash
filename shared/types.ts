export enum GameStatus {
    PENDING = "Pending",
    ACTIVE = "Active",
    ENDED = "Ended"
}

export enum GameType { NORMAL, CHOICES, THEATER }
export type GameTypeMetadata = {name: string, description: string}
export const GameTypes: Record<GameType, GameTypeMetadata> = {
    [GameType.NORMAL]: {name: "Normal", description: "A high-speed song guessing game. Type the title to earn points!"},
    [GameType.CHOICES]: {name: "Choices", description: "Lightning rounds with song choices. Be quick and click the right song choice to earn points!"},
    [GameType.THEATER]: {name: "Theater", description: "In-person song guessing fun. Each player uses their device to guess the track, which plays from one device."}
}

export enum GameVisibility { PUBLIC, PRIVATE }
export type GameVisibilityMetadata = { name: string, description: string}
export const GameVisibilities: Record<GameVisibility, GameVisibilityMetadata> = {
    [GameVisibility.PUBLIC]: {name: "Public", description: "Anyone can join this game from the Find Games page."},
    [GameVisibility.PRIVATE]: {name: "Private", description: "Only players with the Game ID will be able to join this game."}
}

export class Round {
    trackId: string;
    previewURL: string;
    maxDuration: number;    //Maximum duration of this round, in milliseconds
    startTime: number;      //Maps player ID to the time that player started this round

    public constructor(trackId: string, previewURL: string, maxDuration: number) {
        this.trackId = trackId;
        this.previewURL = previewURL;
        this.maxDuration = maxDuration;
        this.startTime = 0;
    }
}

export type PlayerState = {
    id: string,
    name: string,
    scores: Array<number | null>,
    isReady: boolean
}

export type GameState = {
    id: string,
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
        trackId?: string
    }
    status: GameStatus,
    numRounds: number,
}

export type GuessResult = {
    isCorrect: boolean,
    score: number,
    correctTrackId: string,
}

export type Track = {
    id: string,
    uri: string,
    is_local: boolean,
    name: string,
    album: { name: string, images: { url: string, height: number | null, width: number | null }[] },
    artists: { name: string }[],
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