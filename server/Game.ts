import { PlayerConnection } from "./types";
import { Playlist, Track } from "../shared/types";
import lodash from 'lodash';
import * as SpotifyAPI from './caller';
import ObservableMap from "../utils/ObservableMap";
import { Round, GameStatus, GameState, PlayerState } from "../shared/types";

/**
 * Class to represent the server-side view of a game
 */
export class Game {
    public id: string;
    playlist: Playlist;
    players: ObservableMap<string, Player>;
    rounds: Round[];
    status: GameStatus;

    //A table (scores[playerId][roundNum]) to store scores for each player for each round
    scores: Record<string, Array<number | null>>

    //Constructor
    private constructor(id: string, playlist: Playlist) {
        this.id = id;
        this.playlist = playlist;
        this.players = new ObservableMap(() => this.broadcastUpdate(), () => this.broadcastUpdate());
        this.rounds = [];
        this.status = GameStatus.PENDING;
        this.scores = {};
    }


    /**
     * Builds a new Game object and returns a Promise for it.
     * (Async replacement for a constructor)
     * @param id The ID of the new game
     * @param playlist The playlist that this game will be played on
     * @param desiredNumRounds The desired number of rounds for this game
     */
    public static async newInstance(id: string, playlist: Playlist, desiredNumRounds: number): Promise<Game> {
        let newGame = new Game(id, playlist);
        await newGame.generateRounds(desiredNumRounds);
        return newGame;
    }


    /**
     * Shuffles the tracks in the playlist and looks for preview URLs.
     * Attempts to find desiredNumRounds preview URLs. 
     * Adds AT MOST desiredNumRounds tracks to this.rounds.
     * 
     * @param desiredNumRounds The desired number of rounds for this game.
     * @returns The list of generated rounds
     */
    public async generateRounds(desiredNumRounds: number) {
        //Clear selection
        this.rounds = [];

        //Remove local tracks and shuffle the remaining ones
        let viableTracks: Track[] = lodash.shuffle(this.playlist.tracks.items.map((value) => value.track).filter((track) => !track.is_local));

        //Pick the tracks from this playlist
        //Look through all the (shuffled) non-local tracks until enough tracks with previewURLs are found (or not).
        let chosenTracks: Set<Track> = new Set();
        for (let trackNum = 0; chosenTracks.size < desiredNumRounds && trackNum < viableTracks.length; trackNum++) {
            let chosenTrack = viableTracks[trackNum];
            chosenTrack.previewURL = await SpotifyAPI.getTrackPreviewURL(chosenTrack.id).catch((error) => {
                console.error(`Unable to get preview URL for track ${chosenTrack.id}: `, error.message);
                return undefined;
            });

            if (chosenTrack.previewURL) {
                chosenTracks.add(chosenTrack);
            }
        }

        //Convert chosen tracks set to list
        this.rounds = Array.from(chosenTracks).map((track) => new Round(track.id, track.previewURL ?? ""));

        //Broadcast update
        this.broadcastUpdate();
    }


    /**
     * Returns the requested player of this game
     * @param playerId The ID of the player to check for
     * @returns The requested player of this game
     * @throws Error if the requested player is not in this game
     */
    public getPlayer(playerId: string): Player{
        let player = this.players.get(playerId);
        if(!player || player.activeGameInfo?.gameId !== this.id){
            throw new Error(`Player ${playerId} is not in game ${this.id} (${this.playlist.name})`);
        }
        return player
    }


    /**
     * Adds the given player to this game
     * @param player The player to add to the game
     */
    public addPlayer(player: Player) {
        if (this.status !== GameStatus.PENDING) {
            throw new Error("Game not pending");
        }
        this.players.set(player.id, player);

        //Set the player's activeGameInfo
        player.activeGameInfo = {
            gameId: this.id,
            isReady: false,
            scores: Array.from(this.rounds, ()=>null)
        }

        //Broadcast update to all players
        this.broadcastUpdate();
    }


    /**
     * Removes the specified player from this game
     * @param playerId The ID of the player to remove
     * @throws Error if the player is not in this game
     */
    public removePlayer(playerId: string) {
        let player = this.getPlayer(playerId);

        //Clear the player's activeGameInfo
        player.activeGameInfo = null;

        //Remove this player from the players map
        this.players.delete(playerId);
    }


    /**
     * Sets the given player's isReady status to 'true'
     * @param playerId The ID of the player to ready up
     * @throws Error if the player is not in this game
     */
    public readyPlayer(playerId: string){
        let player = this.getPlayer(playerId);

        //Set player status to ready
        player.activeGameInfo!.isReady = true;

        //Inform other players
        this.broadcastUpdate();

        console.log(`Readied player ${player.id} (${player.name})`);

        //Start the game if all players are ready
        this.startIfReady();
    }


    /**
     * Sets the given player's isReady status to 'false'
     * @param playerId The ID of the player to unready
     * @throws Error if the player is not in this game
     */
    public unreadyPlayer(playerId: string) {
        let player = this.getPlayer(playerId)

        //Set player status to not ready
        player.activeGameInfo!.isReady = false;

        //Update all players
        this.broadcastUpdate();

        console.log(`Unreadied player ${player.id} (${player.name})`);
    }


    /**
     * Updates the game state to reflect the specified player making the specified guess
     * @param playerId The ID of the player making the guess
     * @param roundNum The index of the round being played
     * @param trackId The ID of the track being guessed
     */
    public submitPlayerGuess(playerId: string, roundNum: number, trackId: string) {
        //Get the player
        let player = this.getPlayer(playerId);

        //Get the round
        let round = this.rounds?.[roundNum];
        if (!round) {
            throw new Error(`Round ${roundNum} does not exist in game ${this.id} (${this.playlist.name})`);
        }

        //Determine the number of points for this guess
        let isCorrect = trackId === round.trackId;
        let timeElapsed = new Date().getTime() - this.rounds?.[roundNum]?.startTimes?.[playerId] ?? 0;
        let numPoints = (30 * 1000) - timeElapsed;

        //Update this player's point count for this round
        if (isCorrect) {
            this.scores[playerId][roundNum] = numPoints
        }

        //Update all players
        this.broadcastUpdate();
    }


    /**
     * Returns the number of active players in this game
     * @returns The number of players in this game
     */
    public getNumPlayers() {
        return this.players.size;
    }


    /**
     * Starts this game if it is ready to start.
     * A game is ready to start if it meets all the following criteria:
     *  - At least 2 players
     *  - All players ready
     */
    public startIfReady() {
        let allPlayersReady = Array.from(this.players.values()).every((player) => player.activeGameInfo?.isReady);

        //TODO: Replace 0 with 1
        if (allPlayersReady && this.players.size > 0) {
            this.start();
        }
    }


    /**
     * Stops the game
     */
    public async stop() {
        //Inform all players that the game has ended
        this.status = GameStatus.ENDED;
        this.broadcastUpdate();

        //Remove all players from this game
        this.players.forEach((player) => {
            this.removePlayer(player.id);
        });

        console.log(`Stopped game ${this.id} (${this.playlist.name})`);
    }


    /**
     * Starts the game by communicating with players
     */
    public async start() {
        this.status = GameStatus.ACTIVE;
        console.log(`Started game ${this.id} (${this.playlist.name})`);
        this.broadcastUpdate();
    }


    /**
     * Returns the current state of this game
     * Converts this game 
     */
    public getState(): GameState {
        //Generate the dictionary of player states
        let playerStates: Record<string, PlayerState> = {};
        for (let [key, value] of this.players) {
            playerStates[key] = value.getState();
        }

        //Build and return the state object
        return {
            id: this.id,
            status: this.status,
            playlist: {
                id: this.playlist.id,
                name: this.playlist.name,
                uri: this.playlist.uri,
                description: this.playlist.description,
                numTracks: this.playlist.tracks.total
            },
            players: playerStates,
            numRounds: this.rounds.length
        }
    }


    /**
     * Broadcasts this game's state to all its players
     */
    public async broadcastUpdate() {
        //Get the state to send to all players
        let state = this.getState();

        //Send the state
        for (let player of this.players.values()) {
            player.sendUpdate(state);
        }
    }
}


/**
 * Class to represent the server-side view of a player
 */
export class Player {
    id: string;
    name: string;
    connection?: PlayerConnection;

    //Player-specific information, managed by the player's active game
    //If this is null, the player is not in a game
    activeGameInfo: null | {
        gameId: string,
        isReady: boolean,
        scores: (number | null)[]
    };

    //Constructor
    public constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.activeGameInfo = null;
    }


    /**
     * Sends a game update to this player
     * @param update The GameUpdate to send
     */
    public async sendUpdate(update: GameState) {
        if (this.connection) {
            this.connection.send(JSON.stringify(update));
            console.log(`Sent update to player ${this.id}`);
        } else {
            console.error(`Unable to send game update to player ${this.id} - no connection established.`);
        }
    }


    /**
     * Prepare this player for deletion
     */
    public kill() {
        //Close the connection
        this.connection?.close();

        console.log(`Killing player ${this.id} (${this.name})`);
    }


    /**
     * Gets the current PlayerState for this player
     * @returns This player's current state
     */
    public getState(): PlayerState {
        return {
            id: this.id,
            name: this.name,
            isReady: this.activeGameInfo?.isReady ?? false,
            scores: this.activeGameInfo?.scores ?? []
        }
    }
}