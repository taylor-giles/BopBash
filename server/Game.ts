import { PlayerConnection } from "./types";
import { Playlist, Track } from "../shared/types";
import lodash from 'lodash';
import * as SpotifyAPI from './caller';
import ObservableMap from "../utils/ObservableMap";
import { Round, GameStatus, GameState, PlayerState } from "../shared/types";
import { WebSocket } from "ws";

/**
 * Class to represent the server-side view of a game
 */
export class Game {
    id: string;
    playlist: Playlist;
    players: ObservableMap<string, Player>;
    rounds: Round[];
    status: GameStatus;
    currentRound?: {
        index: number,
        audioURL: string
    }

    //Function to end the current round - resolves the promise returned by startRound
    private endCurrentRound: (value: void | PromiseLike<void>) => void = ()=>{};

    //Constructor
    private constructor(id: string, playlist: Playlist) {
        this.id = id;
        this.playlist = playlist;
        this.players = new ObservableMap<string, Player>();
        this.rounds = [];
        this.status = GameStatus.PENDING;
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

        //Convert chosen tracks set to list of Rounds
        this.rounds = Array.from(chosenTracks).map((track) => new Round(track.id, track.previewURL ?? "", 40000));
    }


    /**
     * Returns the requested player of this game, if the player is in the game.
     * Ensures existence of player and player's activeGameInfo
     * @param playerId The ID of the player to check for
     * @returns The requested player of this game
     * @throws Error if the requested player is not in this game
     */
    public getPlayer(playerId: string): Player{
        let player = this.players.get(playerId);
        if(!player || player.activeGameInfo?.gameId !== this.id){
            throw new Error(`Player ${playerId} is not in game ${this.id} (${this.playlist.name})`);
        }
        return player;
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

        //Update remaining players
        this.broadcastUpdate();
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

        console.log(`Readied player ${player.id} (${player.name}) in game ${this.id} (${this.playlist.name})`);

        //Update all players
        this.broadcastUpdate();

        //Check if all players are ready
        if(Array.from(this.players.values()).every((player) => player.activeGameInfo?.isReady)){
            if(this.status === GameStatus.PENDING){
                //If all players are ready during pending stage, the game is ready to start
                this.start();
            } else if(this.status === GameStatus.ACTIVE){
                //If all players are "ready" during the game, they have all voted to skip to next round
                this.endCurrentRound();
            }
        }
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

        console.log(`Unreadied player ${player.id} (${player.name}) in game ${this.id} (${this.playlist.name})`);
    }


    /**
     * Updates the game state to reflect the specified player making the specified guess
     * @param playerId The ID of the player making the guess
     * @param roundNum The index of the round being played
     * @param trackId The ID of the track being guessed
     * @returns An object dictating whether or not the guess was correct and the score earned for it
     */
    public async submitPlayerGuess(playerId: string, roundNum: number, trackId: string): Promise<{isCorrect: boolean, score: number}> {
        //TODO: Reject guess if roundNum does not match current round index
        //Get the player
        let player = this.getPlayer(playerId);

        //Get the round
        let round = this.rounds?.[roundNum];
        if (!round) {
            throw new Error(`Round ${roundNum} does not exist in game ${this.id} (${this.playlist.name})`);
        }

        //Determine the number of points for this guess
        let isCorrect = trackId === round.trackId;
        let timeElapsed = new Date().getTime() - this.rounds?.[roundNum]?.startTime;
        let numPoints = isCorrect ? (30 * 1000) - timeElapsed : 0;

        //Update this player's point count for this round
        if (isCorrect) {
            player.activeGameInfo!.scores[roundNum] = numPoints
        }

        //Update all players
        this.broadcastUpdate();

        return {isCorrect: isCorrect, score: numPoints};
    }


    /**
     * Returns the number of active players in this game
     * @returns The number of players in this game
     */
    public getNumPlayers() {
        return this.players.size;
    }


    /**
     * Ends the game
     */
    public async end() {
        //Inform all players that the game has ended
        this.status = GameStatus.ENDED;
        this.broadcastUpdate();
        console.log(`Stopped game ${this.id} (${this.playlist.name})`);
    }


    /**
     * Runs the game by starting each round in sequence, then ending the game
     */
    public async start() {
        //Set status to active
        this.status = GameStatus.ACTIVE;

        //Unready all players
        this.players.forEach((player) => player.activeGameInfo!.isReady = false);
        
        //Inform all players
        this.broadcastUpdate();
        console.log(`Started game ${this.id} (${this.playlist.name})`);

        //Run each round, in sequence
        //The promise returned by startRound will resolve when the round ends
        for(let i=0; i<this.rounds.length; i++){
            await this.startRound(i);
        }

        //End the game
        this.end();
    }


    /**
     * Starts the given round
     * @returns A promise that resolves when the max round duration is over
     */
    private async startRound(index: number): Promise<void>{
        //Unready all players
        this.players.forEach((player) => player.activeGameInfo!.isReady = false);

        //Set the currentRound variable
        this.currentRound = {
            index: index,
            audioURL: this.rounds[index].previewURL
        };

        //Inform players
        this.broadcastUpdate();
        console.log(`Started round ${index} of game ${this.id} (${this.playlist.name}) - Track ID ${this.rounds[index].trackId}`);

        //Set the startTime for the round
        this.rounds[index].startTime = new Date().getTime();

        //Return promise that resolves when round is over.
        //Will resolve after max duration expires, or earlier by calling this.endCurrentRound
        return new Promise((resolve) => {
            this.endCurrentRound = resolve;
            setTimeout(resolve, this.rounds[index].maxDuration);
        });
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
            numRounds: this.rounds.length,
            currentRound: this.currentRound
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
        isReady: boolean, //Indicates "ready to progress" - either ready to start game or ready for next round
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
        //Send the update if the connection is open
        if (this.connection && this.connection.readyState === WebSocket.OPEN) {
            this.connection.send(JSON.stringify(update));
        } else {
            console.error(`Unable to send game update to player ${this.id} - no connection established.`);
        }
    }


    /**
     * Disconnect this player's WebSocket connection
     */
    public disconnect() {
        //Close the connection if it is open
        if(this.connection && this.connection.readyState === WebSocket.OPEN){
            this.connection?.close();
            console.log(`Disconnected player ${this.id} (${this.name})`);
        }
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