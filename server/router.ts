import * as express from 'express';
import * as Controller from './controller';
import { PlayerConnection, WebSocketRequest } from './types';
const router = express.Router();


/**
 * Routes for the REST API.
 * For documentation for each endpoint, see corresponding controller function.
 */
router.get('/getPlaylistData/:id', Controller.ensureId, Controller.getPlaylistData);
router.post('/newGame', Controller.makeNewGame);
router.post('/newPlayer', Controller.registerNewPlayer);

export { router };


//WebSocket "routes"
export enum WebSocketRoute {
  JOIN_GAME="Join Game",
  LEAVE_GAME="Leave Game"
}

export function routeWebsocketRequest(clientConnection: PlayerConnection, req: WebSocketRequest){
  Controller.wsHandlers[req.type](clientConnection, req.data)
}