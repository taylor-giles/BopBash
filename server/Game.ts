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
     * Adds the given player to this game
     * @param player The player to add to the game
     */
    public addPlayer(player: Player) {
        if (this.status !== GameStatus.PENDING) {
            throw new Error("Game not pending");
        }
        this.players.set(player.id, player);

        //Add a row in the points table for this player - one cell for each round, where every value is null
        this.scores[player.id] = Array.from(this.rounds, ()=>null);

        //Broadcast update to all players
        this.broadcastUpdate();
    }


    /**
     * Updates the game state to reflect the specified player making the specified guess
     * @param playerId The ID of the player making the guess
     * @param roundNum The index of the round being played
     * @param trackId The ID of the track being guessed
     */
    public submitPlayerGuess(playerId: string, roundNum: number, trackId: string){
        //Ensure this player is part of this game
        if(!this.players.has(playerId)){
            throw new Error(`Player ${playerId} is not part of game ${this.id} (${this.playlist.name})`);
        }

        //Get the round
        let round = this.rounds?.[roundNum];
        if(!round){
            throw new Error(`Round ${roundNum} does not exist in game ${this.id} (${this.playlist.name})`);
        }

        //Determine the number of points for this guess
        let isCorrect = trackId === round.trackId;
        let timeElapsed = new Date().getTime() - this.rounds?.[roundNum]?.startTimes?.[playerId] ?? 0;
        let numPoints = (30*1000) - timeElapsed;

        //Update this player's point count for this round
        if(isCorrect){
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
        let allPlayersReady = Array.from(this.players.values()).every((player) => player.isReady);

        //TODO: Replace 0 with 1
        if (allPlayersReady && this.players.size > 0) {
            this.start();
        }
    }


    /**
     * Stops the game
     */
    public async stop() {
        this.status = GameStatus.ENDED;
        this.broadcastUpdate();

        //Force all players to leave this game
        this.players.forEach((player) => {
            player.leaveGame();
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
    isReady: boolean = false;
    activeGame?: Game;

    public constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.isReady = false;
        this.activeGame = undefined;
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
     * Marks this player as starting the indicated round of the active game
     * @param roundNum The index of the round to start
     * @returns The audio URL for the specified round
     */
    public startRound(roundNum: number): string {
        //Make sure the game and round exist
        if (this.activeGame && this.activeGame.rounds.length > roundNum) {
            //Set this player's start time for this round to right now
            this.activeGame.rounds[roundNum].startTimes[this.id] = new Date().getTime();
            console.log(`Started round ${roundNum} of game ${this.activeGame.id} (${this.activeGame.playlist.name}) for player ${this.id} (${this.name})`);

            //Return the audio URL for the round
            return this.activeGame.rounds[roundNum].previewURL;
        } else {
            throw new Error(`Round ${roundNum} does not exist in game ${this.activeGame?.id}`);
        }
    }


    /**
     * Submits the specified guess to the specified round of the active game
     * @param roundNum The index of the round being played
     * @param trackId The ID of the track being guessed
     */
    public submitGuess(roundNum: number, trackId: string){
        if(this.activeGame){
            this.activeGame.submitPlayerGuess(this.id, roundNum, trackId);
        } else {
            throw new Error(`Player not currently in a game`);
        }
    }


    /**
     * Ensures that this player has no active game
     */
    public leaveGame() {
        if (this.activeGame) {
            //Remove this player from the game
            this.activeGame.players.delete(this.id);
        }
        this.activeGame = undefined;
        this.isReady = false;
    }


    /**
     * Prepare this player for deletion
     */
    public kill() {
        //Leave active game (if it exists)
        this.leaveGame();

        //Close the connection
        this.connection?.close();

        console.log(`Killing player ${this.id} (${this.name})`);
    }

    public getState(): PlayerState {
        return {
            id: this.id,
            name: this.name,
            scores: this.activeGame?.scores?.[this.id] ?? [],
            isReady: this.isReady
        }
    }
}