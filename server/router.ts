import * as express from 'express';
import * as Controller from './controller';
import { PlayerConnection } from './types';
import { WebSocketRequest, WebSocketRoute } from '../shared/ws-routes';
const router = express.Router();

/**
 * Routes for the REST API.
 * For documentation for each endpoint, see corresponding controller function.
 */
router.get('/getPlaylistData/:id', Controller.ensureId, Controller.getPlaylistData);
router.get('/getGames', Controller.getGames);
router.post('/newGame', Controller.makeNewGame);
router.post('/registerNewPlayer', Controller.registerNewPlayer);
router.post('/joinGame/:id', Controller.authenticate, Controller.ensureId, Controller.joinGame);

export { router };

export function routeWebsocketRequest(clientConnection: PlayerConnection, req: WebSocketRequest) {
  type WSHandler = (connection: PlayerConnection, data: any) => void;
  let handler: WSHandler;

  //Determine which function to use based on the provided route
  switch (req.type) {
    case WebSocketRoute.LEAVE_GAME:
      handler = Controller.leaveGame;
      break;
    case WebSocketRoute.READY:
      handler = Controller.readyPlayer;
      break;
    case WebSocketRoute.UNREADY:
      handler = Controller.unreadyPlayer;
      break;
    default:
      handler = () => console.error(`Unknown WS route ${req.type}`);
      break;
  }
  handler(clientConnection, req.data);
}