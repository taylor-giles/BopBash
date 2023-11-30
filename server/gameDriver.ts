import { Game, Player } from './game';
import { PlayerConnection, Playlist } from './types';
import crypto from 'crypto';

//Maximum amount of time a game is allowed to exist as an "active game"
const MAX_GAME_LIFETIME = 60 * 60 * 1000; //One hour

//If a game is empty this long after creation, it will be deleted.
const MAX_EMPTY_GAME_LIFETIME = 5*60*1000; //5 minutes

// Dictionaries mapping IDs to currently active games/players
let activeGames: { [id: string]: Game } = {}
let activePlayers: { [id: string]: Player } = {}


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
        newPlayerId = crypto.randomBytes(12).toString('base64');
    } while (newPlayerId in activePlayers);
    return newPlayerId;
}


/**
 * Creates a new Player
 * @param name The name for the new player
 * @returns New Player object
 */
export async function registerNewPlayer(name: string){
    //Create new player object
    let newPlayer = new Player(generateNewPlayerId(), name);

    //Register the player
    activePlayers[newPlayer.id] = newPlayer;

    //Return new player object
    console.log(`Successfully created new player [${newPlayer.id}] (${newPlayer.name})`);
    return newPlayer;
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
    activeGames[newGame.id] = newGame;

    //Set up timeout to end this game if it is active for too long
    setTimeout(() => {
        stopGame(newGame.id);
        console.log(`Stopping game ${newGame.id} (${playlist.name}) due to being active for too long`);
    }, MAX_GAME_LIFETIME);

    //Set up timeout to end this game if it is empty a certain time after creation
    setTimeout(() => {
        if(Object.keys(newGame?.players ?? {}).length <= 0){
            stopGame(newGame.id);
            console.log(`Stopping game ${newGame.id} (${playlist.name}) due to lack of players`);
        }
    }, MAX_EMPTY_GAME_LIFETIME);

    //Return game object
    console.log(`Successfully created game [${newGame.id}] for playlist ${playlist.id} (${playlist.name})`);
    return newGame;
}


/**
 * Adds the given player to the specified game
 * @param playerId The ID of the player to add to the game
 * @param gameId The ID of the game to join
 */
export async function addPlayerToGame(connection: PlayerConnection, playerId: string, gameId: string) {
    let game = activeGames[gameId];
    let player = activePlayers[playerId];
    if (game && player) {
        connection.player = player;
        player.connection = connection;
        console.log(`Successfully connected player ${playerId} (${player.name})`);

        //Add the player to the game
        game.addPlayer(player);

        //Set the game as the player's active game
        player.activeGame = game;

        console.log(`Successfully added player ${player} (${player.name}) to game ${game.id} (${game.playlist.name})`);
    } else {
        let errorMsgs: string[] = [];
        if(!game){
            errorMsgs.push(`Unable to find game ${gameId}`);
        }
        if(!player){
            errorMsgs.push(`Unable to find player ${playerId}`);
        }
        // console.error(`Unable to add player ${playerId} to game ${gameId}: \n` + errorMsgs.join("\n\t"));
        throw new Error(errorMsgs.join("\n"));
    }
}


/**
 * Starts the given game
 * @param gameId The ID of the game to start
 */
export async function startGame(gameId: string) {
    let game = activeGames[gameId];
    if (game) {

    }
}


/**
 * Stops the indicated game
 * @param gameId The ID of the game to stop
 */
export function stopGame(gameId: string) {
    activeGames[gameId]?.stop();
    delete activeGames[gameId];
}


export function killPlayer(playerId: string){
    activePlayers[playerId]?.kill();
    delete activePlayers[playerId];
}