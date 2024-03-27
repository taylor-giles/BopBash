/**
 * The Controller is responsible for handling/forwarding user requests.
 * Some requests get forwarded to the GameManager, while others
 * are forwarded to particular game instances, obtained from the GameManager.
 */

import { NextFunction, Request, Response } from "express";
import * as SpotifyAPI from "./caller";
import * as GameManager from "./GameManager";
import { PlayerConnection } from "./types";
import { getToken, verifyToken } from "./auth";
import { MAX_USERNAME_LENGTH } from "../shared/constants";

type PlayerRequest = Request & { playerId?: string }

/**
 * Middleware to ensure the request has an id param
 */
export async function ensureId(req: Request, res: Response, next: NextFunction) {
    //Verify id is present
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

    //Ensure token is present
    if (!token || !req?.headers?.authorization?.startsWith("Bearer")) {
        return res.status(401).json({ error: "Authentication failed: Token not provided" });
    }

    //Verify the player
    try {
        let playerId = verifyToken(token).toString();
        GameManager.getPlayer(playerId);
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
 *  - id: string - The ID of the playlist
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

    //Ensure ID is provided
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
 * GET /findPlaylists
 * Returns a set of metadata for each playlist matching the query
 * 
 * Request Params:
 *  - query: string - The search query
 * 
 * Request Query Parameters:
 *  - limit: number - The max number of results to include. Max is 50
 *  - offset: number - The index of search results to start query at
 * 
 * Response Body:
 *  - On Success:
 *      - nextOffset: number - The offset to use to search the next "page" of results
 *      - results: PlaylistMetadata[] - List of playlists matching query
 *  - On Failure:
 *      - error: string - Error message
 */
export async function findPlaylists(req: Request, res: Response) {
    let query = req.params.query;
    let limit: number | undefined = parseInt(req?.query?.limit as string);
    let offset: number | undefined = parseInt(req?.query?.offset as string);

    //Make limit and offset undefined if they are NaN (so default values will be used)
    limit = isNaN(limit) ? undefined : limit;
    offset = isNaN(offset) ? undefined : offset;

    //Ensure query is provided and is not only whitespace
    if (!query || query.replace(/\s/g, '').length <= 0) {
        return res.status(400).json({ error: "Query must be provided" });
    }

    //Use Spotify API to search for playlist
    SpotifyAPI.searchPlaylist(query, offset, limit).then((result) => {
        return res.status(200).json(result);
    }).catch((error) => {
        console.error(`Unable to perform playlist search for query: ${query}`, error.message);
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
 *  - type: GameType - The type for this game
 *  - visibility: GameVisibility - The visibility of this game
 *  - gameOptions: GameOptions - The options for this game
 * 
 * Response Body:
 *  - On Success:
 *      - gameId: string - The ID of the new game
 *  - On Failure:
 *      - error: string - Error message
 */
export async function makeNewGame(req: Request, res: Response) {
    let playlistId = req?.body?.playlistId;
    let type = req?.body?.type;
    let visibility = req?.body?.visibility;
    let gameOptions = req?.body?.gameOptions;

    //Ensure all needed information is provided
    if (!playlistId || !gameOptions || type === undefined || visibility === undefined) {
        return res.status(400).json({ error: "All of the following must be specified in request body: playlistId, gameOptions, type, visibility" });
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
    GameManager.generateNewGame(playlist, type, visibility, gameOptions).then((game) => {
        //Respond to sender with game ID
        res.status(200).json({ gameId: game.id });
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

    //Ensure name is provided
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
    GameManager.registerNewPlayer(name).then((player) => {
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
 *      - error: string - Error message
 */
export async function joinGame(req: PlayerRequest, res: Response) {
    let playerId = req.playerId; //Guaranteed by middleware
    let gameId = req?.params?.id;

    //Ensure player ID and game ID are provided
    //(Middleware should ensure this never happens, but just in case)
    if (!gameId || !playerId) {
        return res.status(400).json({ error: `Malformed request` });
    }

    console.log(`Handling request to add player ${playerId} to game ${gameId}`);

    //Add the player to the game
    GameManager.addPlayerToGame(playerId, gameId).then(() => {
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
    return res.status(200).json(GameManager.getGameStates());
}


/**
 * POST /submitGuess
 * Registers the specified track as the player's guess for the specified round
 * 
 * Request Params:
 *  - None.
 * 
 * Request Body:
 *  - roundNum: number - The index of the round to start
 *  - trackId: string - The ID of the guessed track
 * 
 * Response Body:
 *  - On Success:
 *      - GuessResult object indicating the result of the guess
 *  - On Failure:
 *      - error: string - Error message
 */
export async function submitGuess(req: PlayerRequest, res: Response) {
    let playerId = req.playerId; //Guaranteed by middleware
    let roundNum = req.body?.roundNum;
    let trackId = req.body?.trackId;

    //Ensure playerId is provided
    if (!playerId) {
        //Middleware should guarantee that this never happens
        return res.status(400).json({ error: "playerId must be provided" })
    }

    //Ensure round number and track ID are provided
    if (roundNum === undefined || trackId === undefined) {
        return res.status(400).json({ error: "roundNum and trackId must be specified" });
    }

    // console.log(`Handling request to submit guess ${trackId} for round ${roundNum} for player ${playerId}`);

    //Get the active game and submit the guess
    try {
        let game = GameManager.getPlayerActiveGame(playerId);
        let result = await game.submitPlayerGuess(playerId, roundNum, trackId);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error(`Unable to submit guess ${trackId} for round ${roundNum} for player ${playerId}.`, error.message);
        return res.status(500).json({ error: error.message });
    }
}


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

    GameManager.removePlayerFromGame(playerId).catch((error) => {
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

    try {
        //Get the game for this player
        let game = GameManager.getPlayerActiveGame(playerId);

        //Ready the player
        game.readyPlayer(playerId);
    } catch (error: any) {
        console.error(`Unable to ready player ${playerId}`, error.message);
    }
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

    try {
        //Get the game for this player
        let game = GameManager.getPlayerActiveGame(playerId);

        //Unready the player
        game.unreadyPlayer(playerId);
    } catch (error: any) {
        console.error(`Unable to unready player ${playerId}`, error.message);
    }
}


