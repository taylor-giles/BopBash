/**
 * The GameManager is responsible for maintaining information about active games and players,
 * and facilitating actions that happen outside of a particular game, such as:
 *  - Creating & destroying games & players
 *  - Adding & removing players to/from games
 *  - Keeping track of and serving game & player instances
 */
import ObservableMap from '../utils/ObservableMap';
import { Game, Player } from './Game';
import { PlayerConnection } from './types';
import { GameOptions, GameState, GameType, GameVisibility, Playlist } from "../shared/types";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as storage from 'node-persist';

//Maximum amount of time a game is allowed to exist as an "active game"
const MAX_GAME_LIFETIME = 24 * 60 * 60 * 1000; //24 hours

//Maps for storing currently active games/players by ID
let activeGames = new ObservableMap<string, Game>();
let activePlayers = new ObservableMap<string, Player>();

//Maps player ID to the ID of the player's active game
let playerGames = new ObservableMap<string, string>();

//Maps game ID to the timeout set to destroy it if active for too long
let gameTimeouts = new ObservableMap<string, NodeJS.Timeout>();

//Load the total number of games played (ever) from storage
export let totalGamesPlayed = 0;
storage.init().then(async () => {
    totalGamesPlayed = await (storage as any).default.getItem('totalGamesPlayed') ?? 0;
    console.log(`Loaded variable totalGamesPlayed: ${totalGamesPlayed}`);
}).catch((error) => {
    console.error(`Failed to load variable totalGamesPlayed`, error);
});


/**
 * Returns the number of currently active players
 * @returns The number of currently active players
 */
export function getNumPlayers(): number {
    return activePlayers.size;
}


/**
 * Returns the number of currently active games
 * @returns The number of currently active games
 */
export function getNumGames(): number {
    return activeGames.size;
}


/**
 * Checks if the requested playerId is present in activePlayers
 * @param playerId The ID of the player
 * @returns The requested Player object
 * @throws Error when the requested player does not exist
 */
export function getPlayer(playerId: string): Player {
    let player = activePlayers.get(playerId);
    if (!player) {
        throw new Error(`Unable to find player ${playerId}`);
    }
    return player;
}


/**
 * Checks if the requested gameId is present in activeGames
 * @param gameId The ID of the game
 * @returns The requested Game object
 * @throws Error when the requested game does not exist
 */
export function getGame(gameId: string): Game {
    let game = activeGames.get(gameId);
    if (!game) {
        throw new Error(`Unable to find game ${gameId}`);
    }
    return game;
}


/**
 * Convenience function for getting the game that a player is currently playing
 * @param playerId The ID of the player to query on
 * @returns The Game object for the player's active game
 * @throws Error if the player is not in an active game
 */
export function getPlayerActiveGame(playerId: string): Game {
    let gameId = playerGames.get(playerId);
    if (!gameId) {
        throw new Error(`Unable to find active game for player ${playerId}`);
    }
    return getGame(gameId);
}


/**
 * Returns a list of GameStates for all joinable (public & pending) games
 * @returns A list containing a GameState for each active pending game
 */
export function getGameStates(): GameState[] {
    let games = Array.from(activeGames.values()).filter((game) => (game.visibility == GameVisibility.PUBLIC));
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

    //Kill player when connection breaks
    connection.on("close", () => {
        console.log(`Connection broken for player ${player.id} (${player.name})`);
        killPlayer(player.id).catch((error) => {
            console.error(`Unable to kill player ${player.id}:`, error.message);
        });
    });

    console.log(`Connected player ${player.id} (${player.name})`);
}


/**
 * Creates a new game for the given playlist
 * @param playlist The playlist to be played in the new game
 * @param type The type of the new game
 * @param visibility The visibility of the new game
 * @param gameOptions The parameters for this game
 * @returns Game object for the new game
 */
export async function generateNewGame(playlist: Playlist, type: GameType, visibility: GameVisibility, gameOptions: GameOptions): Promise<Game> {
    //Create the game object
    let newGame = await Game.newInstance(generateNewGameId(), playlist, type, visibility, gameOptions);

    //Register the game 
    activeGames.set(newGame.id, newGame);

    //Set up timeout to end this game if it is active for too long
    gameTimeouts.set(newGame.id, setTimeout(() => {
        stopGame(newGame.id).then(() => { console.log(`Stopping game ${newGame.id} (${playlist.name}) due to being active for too long`); });
    }, MAX_GAME_LIFETIME));

    //Set up timeout to end this game if it is empty 1 minute after creation
    setTimeout(() => {
        if (newGame.players.size <= 0) {
            stopGame(newGame.id)
                .then(() => { console.log(`Stopping game ${newGame.id} (${playlist.name}) due to it being empty after creation`); })
                .catch((e) => { console.log(`Unable to stop game ${newGame.id} (${playlist.name}) due to it being empty after creation.`, e.message) });
        }
    }, 60000);

    //Update total game count, and persist to storage
    try {
        (storage as any).default.setItem('totalGamesPlayed', ++totalGamesPlayed);
    } catch (e) {
        console.error("Unable to set persistent variable totalGamesPlayed", e);
    }

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
    removePlayerFromGame(playerId);

    //Add the player to the game
    game.addPlayer(player);

    //Add an entry to the map
    playerGames.set(playerId, game.id);

    console.log(`Added player ${player.id} (${player.name}) to game ${game.id} (${game.playlist.name})`);
}


/**
 * Removes the specified player from their active game
 * @param playerId The ID of the player to remove from their game
 */
export async function removePlayerFromGame(playerId: string) {
    //Note - avoid using getPlayerActiveGame here since this function should NOT throw an error
    //  if the player is not in a game. It is sometimes used to ensure a player is not in a game.
    let player = getPlayer(playerId);

    //Check if the player is in a game
    if (player?.activeGameInfo?.gameId) {
        let game = getGame(player.activeGameInfo.gameId);

        //Remove the player from the game
        game.removePlayer(playerId);

        //Remove the map entry
        playerGames.delete(playerId);

        console.log(`Removed player ${player.id} (${player.name}) from game ${game.id} (${game.playlist.name})`);

        //Stop the game if it is now empty
        if (game.players.size <= 0) {
            console.log(`Ending game ${game.id} (${game.playlist.name}) due to the last player leaving`);
            stopGame(game.id);
        }
    }
    player.activeGameInfo = null;
}


/**
 * Stops the indicated game
 * @param gameId The ID of the game to stop
 */
export async function stopGame(gameId: string) {
    let game = getGame(gameId);

    //Remove all players from the game
    for (let playerId of game.players.keys()) {
        removePlayerFromGame(playerId);
    }

    //Stop the game
    game.end();

    //Remove this game from the activeGames list
    activeGames.delete(gameId);

    //Clear timeout and remove the timeout from the list of timeouts
    clearTimeout(gameTimeouts.get(gameId));
    gameTimeouts.delete(gameId);

    console.log(`Removed game ${gameId}`);
}


/**
 * Deletes a player
 * @param playerId The ID of the player to delete
 */
export async function killPlayer(playerId: string) {
    //Remove the player from their active game
    removePlayerFromGame(playerId);

    //Disconnect player
    getPlayer(playerId).disconnect();

    //Delete the player
    activePlayers.delete(playerId);
    console.log(`Killed player ${playerId}`);
}