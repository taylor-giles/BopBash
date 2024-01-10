import ObservableMap from '../utils/ObservableMap';
import { Game, Player } from './Game';
import { PlayerConnection } from './types';
import { GameState, GameStatus, Playlist } from "../shared/types";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

//Maximum amount of time a game is allowed to exist as an "active game"
const MAX_GAME_LIFETIME = 60 * 60 * 1000; //One hour

//If a game is empty for this long after creation, it will be deleted.
const MAX_EMPTY_GAME_LIFETIME = 5 * 60 * 1000; //5 minutes

// Maps for storing currently active games/players by ID
let activeGames = new ObservableMap<string, Game>();
let activePlayers = new ObservableMap<string, Player>();

export function getPlayer(playerId: string): Player {
    let player = activePlayers.get(playerId);
    if (!player) {
        throw new Error(`Unable to find player ${playerId}`);
    }
    return player;
}

export function getGame(gameId: string): Game {
    let game = activeGames.get(gameId);
    if (!game) {
        throw new Error(`Unable to find game ${gameId}`);
    }
    return game;
}


/**
 * Returns a list of GameStates for all joinable games
 * @returns A list containing a GameState for each active pending game
 */
export function getGameStates(): GameState[] {
    let games = Array.from(activeGames.values()).filter((game) => game.status == GameStatus.PENDING);
    return games.map((game) => game.getState());
}

/**
 * Generates a unique game ID
 * @returns A new game ID
 */
export function generateNewGameId() {
    let newGameId: string;
    do {
        newGameId = crypto.randomBytes(3).toString('hex').toUpperCase();
    } while (newGameId in activeGames);
    return newGameId;
}


/**
 * Generates a unique player ID
 * @returns A new player ID
 */
export function generateNewPlayerId() {
    let newPlayerId: string;
    do {
        newPlayerId = uuidv4();
    } while (activePlayers.has(newPlayerId));
    return newPlayerId;
}


/**
 * Creates a new Player
 * @param name The name for the new player
 * @returns New Player object
 * @throws Error if unable to find
 */
export async function registerNewPlayer(name: string) {
    //Create new player object
    let newPlayer = new Player(generateNewPlayerId(), name);

    //Register the player
    activePlayers.set(newPlayer.id, newPlayer);

    //Return new player object
    console.log(`Created new player ${newPlayer.id} (${newPlayer.name})`);
    return newPlayer;
}


export async function establishPlayerConnection(playerId: string, connection: PlayerConnection) {
    let player = getPlayer(playerId);

    //Set the connections
    connection.playerId = player.id;
    player.connection = connection;

    //Configure behavior for broken connection
    connection.on("close", () => {
        console.log(`Connection broken for player ${player.id} (${player.name})`);
        removePlayerFromGame(player.id).catch((error) => {
            console.error(`Unable to remove player ${player.id} from game:`, error.message);
        });
    });

    console.log(`Connected player ${player.id} (${player.name})`);
}


/**
 * Creates a new game for the given playlist
 * @param playlist The playlist to be played in the new game
 * @param numRounds The number of rounds in this game
 * @returns Game object for the new game
 */
export async function generateNewGame(playlist: Playlist, numRounds: number): Promise<Game> {
    //Create the game object
    let newGame = await Game.newInstance(generateNewGameId(), playlist, numRounds);

    //Register the game 
    activeGames.set(newGame.id, newGame);

    //Set up timeout to end this game if it is active for too long
    setTimeout(() => {
        console.log(`Stopping game ${newGame.id} (${playlist.name}) due to being active for too long`);
        stopGame(newGame.id).catch((error) => {
            console.error(`Failed to stop game ${newGame.id} (${newGame.playlist.name}) due to being active for too long:`, error.message);
        });
    }, MAX_GAME_LIFETIME);

    //Return game object
    console.log(`Created game ${newGame.id} for playlist ${playlist.id} (${playlist.name})`);
    return newGame;
}


/**
 * Adds the specified player to the specified game
 * @param playerId The ID of the player to add to the game
 * @param gameId The ID of the game to join
 */
export async function addPlayerToGame(playerId: string, gameId: string) {
    let player = getPlayer(playerId);
    let game = getGame(gameId.toUpperCase());

    //Remove player from current game
    player.leaveGame();

    //Add the player to the game
    game.addPlayer(player);

    //Set the game as the player's active game
    player.activeGame = game;

    console.log(`Added player ${player.id} (${player.name}) to game ${game.id} (${game.playlist.name})`);
}


/**
 * Removes the specified player from their active game
 * @param playerId The ID of the player to remove from their game
 */
export async function removePlayerFromGame(playerId: string) {
    let player = getPlayer(playerId);
    let game = player.activeGame;
    if (!game) {
        return;
    }
    player.leaveGame();
    console.log(`Removed player ${player.id} (${player.name}) from game ${game.id} (${game.playlist.name})`);
}


/**
 * Sets the status of the given player to READY
 * @param playerId The ID of the player to ready
 */
export async function readyPlayer(playerId: string) {
    let player = getPlayer(playerId);

    //Set player status to ready
    player.isReady = true;

    let playerGame = player.activeGame
    if (playerGame) {
        //Update all players of this player's active game
        playerGame.broadcastUpdate();

        //Start game if game is ready to start
        playerGame.startIfReady();
    }

    console.log(`Readied player ${player.id} (${player.name})`);
}


/**
 * Sets the status of the given player to NOT READY
 * @param playerId The ID of the player to unready
 */
export async function unreadyPlayer(playerId: string) {
    let player = getPlayer(playerId);

    //Set player status to ready
    player.isReady = false;

    //Update all players of this player's active game
    player.activeGame?.broadcastUpdate();

    console.log(`Unreadied player ${player.id} (${player.name})`);
}


/**
 * Starts the indicated round for the indicated player
 * @param playerId The ID of the player starting this round
 * @param roundNum The index of the round to start
 */
export async function startRoundForPlayer(playerId: string, roundNum: number): Promise<string | undefined>{
    let player = getPlayer(playerId);
    return player.startRound(roundNum);
}


/**
 * Stops the indicated game
 * @param gameId The ID of the game to stop
 */
export async function stopGame(gameId: string) {
    getGame(gameId).stop();
    activeGames.delete(gameId);
    console.log(`Removed game ${gameId}`)
}


/**
 * Deletes a player
 * @param playerId The ID of the player to delete
 */
export async function killPlayer(playerId: string) {
    getPlayer(playerId).kill();
    activePlayers.delete(playerId);
    console.log(`Killed player ${playerId}`);
}