import WebSocket from "ws"

export type PlayerConnection = WebSocket & { playerId?: string }

/**
 * Strings indicating what fields should be queried in API calls.
 * Should roughly match the types above.
 */
export const playlistFields: string = "name,id,uri,type,description,tracks(total),owner(display_name,id,uri,type),images(height,width,url)"
export const tracksFields: string = "items(track(id,name,is_local,artists(name),album(name,images),uri))"


