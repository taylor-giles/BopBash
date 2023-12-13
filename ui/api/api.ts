import * as SESSION from './session-api';
import * as PLAYER from './player-api';

const GameAPI = {
    ...SESSION,
    ...PLAYER
}

export default GameAPI;