//WebSocket "routes"
export enum WebSocketRoute {
  LEAVE_GAME = "Leave Game",
  READY = "Ready",
  UNREADY = "Unready"
}

export type WebSocketRequest = {
  type: WebSocketRoute,
  data?: any
}