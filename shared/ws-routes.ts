//WebSocket "routes"
export enum WebSocketRoute {
    JOIN_GAME = "Join Game",
    LEAVE_GAME = "Leave Game",
    READY = "Ready",
    UNREADY = "Unready"
  }
  
  export type WebSocketRequest = {
    type: WebSocketRoute,
    data?: any
  }