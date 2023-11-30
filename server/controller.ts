import { NextFunction, Request, Response } from "express";
import * as SpotifyAPI from "./caller";
import * as GameDriver from "./gameDriver";
import { Player } from "./game";
import WebSocket from "ws";
import { PlayerConnection, WebSocketRequest } from "./types";
import { WebSocketRoute } from "./router";

/**
 * Middleware to ensure the request has an id param
 */
export async function ensureId(req: Request, res: Response, next: NextFunction) {
    if (!req || !req.params || !req.params.id) {
        console.log(req)
        res.status(400).send("Request must include an id param");
        return;
    }
    next();
}


/**
 * GET /getPlaylist
 * Returns information about the requested playlist
 * 
 * Request Params:
 *  - id: The ID of the playlist
 * 
 * Request Body:
 *  - None
 * 
 * Response Body:
 *  - On Success:
 *      - Playlist object containing data for requested playlist
 *  - On Failure:
 *      - msg: string - String error message
 *      - error: Error - Error
 */
export async function getPlaylistData(req: Request, res: Response) {
    let id = req.params.id;
    console.log("Handling request for playlist data. ID: ", id);

    if (!id) {
        res.status(400).send("Playlist ID must be provided");
    }

    //Find and return playlist data to client
    SpotifyAPI.findPlaylistData(id).then((result) => {
        res.status(200).json(result);
    }).catch((error) => {
        res.status(500).json({ msg: `Unable to get playlist data for playlist ${id}`, error: error })
    });
}


/**
 * POST /newGame
 * Generates a new game and returns its ID
 * 
 * Request Params:
 *  - None.
 * 
 * Request Body:
 *  - playlistId: string - The ID of the playlist to make a game for
 *  - numRounds: number - The desired number of rounds for this game
 * 
 * Response Body:
 *  - On Success:
 *      - gameId: string - The ID of the new game
 *      - numRounds: number - The actual number of rounds in the new game
 *      - playlistId: string - The ID of the playlist for this game (same as playlistId in req)
 *  - On Failure:
 *      - msg: string - String error message
 *      - error: Error - Error
 */
export async function makeNewGame(req: Request, res: Response) {
    let playlistId = req?.body?.playlistId;
    let numRounds = req?.body?.numRounds;

    if (!playlistId || !numRounds) {
        res.status(400).send("Both playlistId and numRounds must be specified in request body.");
        return;
    }

    console.log("Handling request to create new game for playlist: ", playlistId);

    //Use API to get the playlist data
    let playlist = await SpotifyAPI.findPlaylistData(playlistId).catch((error) => {
        console.error(`Unable to make new game.\n\tUnable to get playlist data for playlist ${playlistId}`, error);
        return;
    });
    if (!playlist) {
        res.status(500).json({ msg: `Unable to make new game. Unable to get playlist data for playlist ${playlistId}` });
        return;
    }

    //Create the game and register it with game driver
    GameDriver.generateNewGame(playlist, numRounds).then((game) => {
        //Respond to sender with game ID
        res.status(200).json({ id: game.id, numRounds: game.rounds.length, playlistId: playlistId });
    }).catch((error) => {
        res.status(500).json({ msg: "Unable to create new game", error: error})
    });
}


/**
 * POST /registerNewPlayer
 * Adds a player to the specified game
 * 
 * Request Params:
 *  - None.
 * 
 * Request Body:
 *  - playerName: The user-chosen name for the new player
 * 
 * Response Body:
 *  - playerId: The ID of the new player
 */
export async function registerNewPlayer(req: Request, res: Response) {
    let name = req?.body?.playerName;

    if (!name) {
        res.status(400).send("Name must be specified in request body.");
        return;
    }

    console.log(`Handling request to create new player named ${name}`);

    //Create player object
    GameDriver.registerNewPlayer(name).then((player) => {
        //Return the ID of the player
        res.status(200).json({ playerId: player.id });
    });
}


//HANDLER FUNCTIONS FOR ALL WEBSOCKET ROUTES
export type WSHandler = (connection: PlayerConnection, data: any) => void;
export const wsHandlers: {[key in WebSocketRoute]: WSHandler} = {
    /**
     * 
     * @param connection WS object that made the request
     * @param data 
     *  - playerId: string - The ID of the player joining the game
     *  - gameId: string - The ID of the game the player is joining
     */
    [WebSocketRoute.JOIN_GAME]:
    async function joinGame(connection: PlayerConnection, data: any){
        let playerId = data?.playerId;
        let gameId = data?.gameId;

        if(!playerId || !gameId){
            console.error(`Unable to add player to game: Both player ID and game ID must be provided`);
        }
        GameDriver.addPlayerToGame(connection, playerId, gameId).catch(

        );
    },


    [WebSocketRoute.LEAVE_GAME]:
    async function leaveGame(connection: PlayerConnection, data: any){}
}