import type { Readable, Writable } from 'svelte/store';
import { readable, writable } from 'svelte/store';
import type { GameState } from '../../shared/types';
import * as SessionAPI from '../api/session-api';

//Address of the WebSocket server
const WS_ADDRESS = import.meta.env.PUBLIC_WS_ADDRESS;

/**
 * Class that encapsulates all information needed for this player to communicate with the server API.
 * Wraps the WebSocket class for easy access to the WS stream.
 */
export class PlayerConnection extends WebSocket {
    playerId: string;
    playerName: string;
    token: string;

    constructor(url: string, protocols?: string | string[], playerId?: string, playerName?: string, token?: string) {
        super(url, protocols);
        this.playerId = playerId ?? "Unknown";
        this.playerName = playerName ?? "Unknown";
        this.token = token ?? "Unknown";
    }
}


/**
 * A Svelte store that provides access to the PlayerConnection for this session
 */
export const GameConnection: Writable<PlayerConnection> = writable<PlayerConnection>(undefined);


/**
 * A Svelte readable store that stays up-to-date with the latest game state
 */
export const GameStore: Readable<GameState> = readable<GameState>(undefined,
    //This callback is called by Svelte when this store gets its first subscriber.
    (set) => {
        return GameConnection.subscribe(
            //This callback is called whenever the value of GameConnection changes.
            (connection) => {
                //Whenever the GameConnection is re-defined, re-assign its onMessage listener.
                if (connection) {
                    connection.onmessage = (event) => {
                        //Setting the onMessage listener to set this readable store for every message
                        // ensures that this store always updates whenever a new message is received.
                        try {
                            //All messages received should be game states
                            let data = JSON.parse(event.data);

                            //TODO: Type-check the data to ensure it is GameState
                            set(data);
                        } catch (e) {
                            console.error(`Error parsing message from server: ${JSON.stringify(event.data)}`, e)
                        }
                    }
                }
            }
        );
    }
);


/**
 * Establishes the GameConnection as a new player with the given name
 */
export async function connectAs(name: string) {
    //Register the new player with the given name
    let res = await SessionAPI.registerPlayer(name);

    //If player was successfully registered...
    if (res) {
        GameConnection.set(new PlayerConnection(`${WS_ADDRESS}?token=${res.token}`, undefined, res.playerId, name, res.token));
    }
}
