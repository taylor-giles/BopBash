import { NextFunction, Request, Response } from "express";
import * as SpotifyAPI from "./caller";
import * as GameDriver from "./GameManager";
import { PlayerConnection } from "./types";
import { getToken, verifyToken } from "./auth";
import { MAX_USERNAME_LENGTH } from "../shared/constants";

type PlayerRequest = Request & { playerId?: string }


/**
 * Middleware to ensure the request has an id param
 */
export async function ensureId(req: Request, res: Response, next: NextFunction) {
    if (!req?.params?.id) {
        return res.status(400).json({ error: "Request must include an id param" });
    }
    next();
}


/**
 * Middleware to ensure user is authenticated.
 * Adds playerId to the req object
 */
export async function authenticate(req: PlayerRequest, res: Response, next: NextFunction) {
    const token = req?.headers?.authorization?.split(' ')[1];
    if (!token || !req?.headers?.authorization?.startsWith("Bearer")) {
        console.log(JSON.stringify(req.headers))
        return res.status(401).json({ error: "Authentication failed: Token not provided" });
    }

    try {
        let playerId = verifyToken(token).toString();
        GameDriver.getPlayer(playerId);
        req.playerId = playerId;
    } catch (e: any) {
        return res.status(401).json({ error: `Authentication failed: ${e.message}` });
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
 *      - error: string - Error message
 */
export async function getPlaylistData(req: Request, res: Response) {
    let id = req.params.id;
    console.log("Handling request for playlist data. ID: ", id);

    if (!id) {
        return res.status(400).json({ error: "Playlist ID must be provided" });
    }

    //Find and return playlist data to client
    SpotifyAPI.findPlaylistData(id).then((result) => {
        return res.status(200).json(result);
    }).catch((error) => {
        console.error(`Unable to get playlist data for playlist ${id}`, error.message);
        return res.status(500).json({ error: error.message });
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
 *      - error: string - Error message
 */
export async function makeNewGame(req: Request, res: Response) {
    let playlistId = req?.body?.playlistId;
    let numRounds = req?.body?.numRounds;

    if (!playlistId || !numRounds) {
        return res.status(400).json({ error: "Both playlistId and numRounds must be specified in request body." });
    }

    console.log("Handling request to create new game for playlist: ", playlistId);

    //Use API to get the playlist data
    let playlist = await SpotifyAPI.findPlaylistData(playlistId).catch((error) => {
        console.error(`Unable to make new game.\n\tUnable to get playlist data for playlist ${playlistId}`, error.message);
        return;
    });
    if (!playlist) {
        return res.status(500).json({ error: `Unable to make new game. Unable to get playlist data for playlist ${playlistId}` });
    }

    //Create the game and register it with game driver
    GameDriver.generateNewGame(playlist, numRounds).then((game) => {
        //Respond to sender with game ID
        res.status(200).json({ id: game.id, numRounds: game.rounds.length, playlistId: playlistId });
    }).catch((error) => {
        console.error("Unable to create new game", error.message);
        res.status(500).json({ error: error.message });
    });
}


/**
 * POST /registerNewPlayer
 * Creates a new player with the given name
 * 
 * Request Params:
 *  - None.
 * 
 * Request Body:
 *  - name: The user-chosen name for the new player
 * 
 * Response Body:
 *  
 *  - On Success:
 *      - playerId: string - The ID of the new player
 *      - token: string - JWT auth token for this player
 *  - On Failure:
 *      - error: string - Error message
 */
export async function registerNewPlayer(req: Request, res: Response) {
    let name = req?.body?.name;

    if (!name) {
        return res.status(400).json({ error: "Name must be specified in request body." });
    }

    console.log(`Handling request to create new player named ${name}`);

    //Enforce username length limit
    if (name.length > MAX_USERNAME_LENGTH) {
        console.error(`Unable to create new player named ${name} - name too long.`);
        return res.status(400).json({ error: `Max username length is ${MAX_USERNAME_LENGTH}` });
    }

    //Create player object
    GameDriver.registerNewPlayer(name).then((player) => {
        //Get the token for the player
        let token = getToken(player.id);

        //Return the token and ID
        res.status(200).json({ playerId: player.id, token: token });
    }).catch((error) => {
        console.error(`Unable to create new player named ${name}`, error.message);
        return res.status(500).json({ error: error.message })
    });
}


/**
 * POST /joinGame
 * Adds the authenticated player to the requested game
 * 
 * PRECONDITIONS: 
 *  - Requester is authenticated
 * 
 * Headers:
 *  - Authentication: Bearer <token>
 * 
 * Request Params:
 *  - id: The ID of the game to join
 * 
 * Request Body:
 *  - None.
 * 
 * Response Body:
 *  - On Success:
 *      - None.
 *  - On Failure:
 *      - msg: string - String error message
 *      - error: Error - Error
 */
export async function joinGame(req: PlayerRequest, res: Response) {
    let playerId = req.playerId;
    let gameId = req?.params?.id;

    if (!gameId || !playerId) {
        //Middleware should ensure this never happens
        return res.status(400).json({ error: `Malformed request` });
    }

    console.log(`Handling request to add player ${playerId} to game ${gameId}`);
    GameDriver.addPlayerToGame(playerId, gameId).then(() => {
        return res.status(200).send("Successfully added player to game");
    }).catch((error) => {
        console.error(`Unable to add player ${playerId} to game ${gameId}:`, error.message);
        return res.status(500).json({ error: error.message });
    });
}


/**
 * GET /getGames
 * Returns a list of all joinable games
 * 
 * Request Params:
 *  - None.
 * 
 * Request Body:
 *  - None.
 * 
 * Response Body:
 *  - GameState[] List containing a state for each joinable game
 */
export async function getGames(req: PlayerRequest, res: Response) {
    res.status(200).json(GameDriver.getGameStates());
}


// /**
//  * WS JOIN_GAME
//  * Adds the player that made the request to the requested game
//  * 
//  * Data: (string) The ID of the game to join
//  */
// export async function joinGameWS(connection: PlayerConnection, data: any) {
//     let playerId = connection.playerId;
//     let gameId = data;
//     console.log(`Handling request to add player ${playerId} to game ${gameId}`);

//     if (!playerId || !gameId) {
//         console.error(`Unable to add player to game: Both player ID and game ID must be provided`);
//         return;
//     }
//     GameDriver.addPlayerToGame(playerId, gameId).catch((error) => {
//         console.error(`Unable to add player ${playerId} to game ${gameId}:`, error.message);
//     });
// }


/**
 * WS LEAVE_GAME
 * Removes the player that made the request from their active game
 * 
 * Data: None.
 */
export async function leaveGame(connection: PlayerConnection, data: any) {
    let playerId = connection?.playerId;
    console.log("Handling request to leave game");

    if (!playerId) {
        console.error("Unable to leave game: Connection not linked to a player");
        return;
    }

    GameDriver.removePlayerFromGame(playerId).catch((error) => {
        console.error(`Unable to remove player ${playerId} from game.`, error.message);
    });
}


/**
 * WS READY
 * Sets player status to "READY"
 * 
 * Data: None.
 */
export async function readyPlayer(connection: PlayerConnection, data: any) {
    let playerId = connection?.playerId;
    if (!playerId) {
        console.error("Unable to ready player: Connection not linked to a player");
        return;
    }

    GameDriver.readyPlayer(playerId).catch((error) => {
        console.error(`Unable to ready player ${playerId}`, error.message);
    });
}


/**
 * WS UNREADY
 * Sets player status to "NOT READY"
 * 
 * Data: None.
 */
export async function unreadyPlayer(connection: PlayerConnection, data: any) {
    let playerId = connection?.playerId;
    if (!playerId) {
        console.error("Unable to unready player: Connection not linked to a player");
        return;
    }

    GameDriver.unreadyPlayer(playerId).catch((error) => {
        console.error(`Unable to unready player ${playerId}`, error.message);
    });
}