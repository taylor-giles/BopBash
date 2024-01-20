export enum GameStatus {
    PENDING="Pending",
    ACTIVE="Active",
    ENDED="Ended"
}

export class Round {
    trackId: string;
    previewURL: string;
    maxDuration: number;   //Maximum duration of this round, in milliseconds
    startTime: number; //Maps player ID to the time that player started this round

    public constructor(trackId: string, previewURL: string, maxDuration: number){
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
        audioURL: string
    }
    status: GameStatus,
    numRounds: number,
}

// export enum GameUpdateType {
//     ROUND = "Round",
//     SCORE = "Score",
//     GAME_OVER = "End",
//     GAME_START = "Start"
// }

// export type GameUpdateTypePayloads = {
//     [GameUpdateType.ROUND]: {
//         audioURL: string
//     },

//     [GameUpdateType.SCORE]: {
//         playerId: string,
//         score: number
//     }[],

//     [GameUpdateType.GAME_OVER]: void,

//     [GameUpdateType.GAME_START]: {
//         playlist: Playlist, 
//     }
// }

// export type GameUpdate = GameState


export type Track = {
    id: string,
    uri: string,
    is_local: boolean,
    name: string,
    album: { name: string, images: { url: string, height: number | null, width: number | null }[] },
    artists: { name: string }[],
    previewURL?: string
}

export type Playlist = {
    name: string,
    id: string,
    uri: string,
    type: "playlist",
    description: string,
    tracks: {
        total: number,
        items: { track: Track }[]
    }
}