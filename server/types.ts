import WebSocket from "ws"
import { WebSocketRoute } from "./router"
import { Player } from "./game"

export type PlayerConnection = WebSocket & { player?: Player }

export type WebSocketRequest = {
    type: WebSocketRoute,
    data?: any
}

export enum GameUpdateType {
    ROUND = "Round",
    SCORE = "Score",
    GAME_OVER = "End",
    GAME_START = "Start"
}

export type GameUpdate = {
    type: GameUpdateType,
    data?: any
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

/**
 * Strings indicating what fields should be queried in API calls.
 * Should roughly match the types above.
 */
export const playlistFields: string = "name,id,uri,type,description,tracks(total)"
export const tracksFields: string = "items(track(id,name,is_local,artists(name),album(name,images),uri))"


