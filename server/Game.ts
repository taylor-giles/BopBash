import { PlayerConnection } from "./types";
import { ADVANCED_OPTIONS_DEFINITIONS, ChatMessage, GameOptions, GameType, GameVisibility, GuessResult, Playlist, Track, TrackChoice } from "../shared/types";
import lodash from 'lodash';
import * as SpotifyAPI from './caller';
import ObservableMap from "../utils/ObservableMap";
import { Round, GameStatus, GameState, PlayerState } from "../shared/types";
import { WebSocket } from "ws";
import { COUNTDOWN_INTERVAL, MAX_CHAT_LENGTH, POST_ROUND_WAIT_TIME, READY_TIMEOUT, REMATCH_TIMEOUT, SERVER_CHAT_NAME } from "../shared/constants";

/**
 * Class to represent the server-side view of a game
 */
export class Game {
    id: string;
    type: GameType;
    visibility: GameVisibility;
    playlist: Playlist;
    gameOptions: GameOptions;
    players: ObservableMap<string, Player>;
    rounds: Round[];
    status: GameStatus;
    chatMessages: ChatMessage[];
    currentRound?: {
        index: number,
        audioURL: string,
        duration: number,
        choices?: { id: string, name: string, artist: string }[]
        trackId?: string
    }

    //Timeout for starting the game when >50% of players are ready
    private gameStartTimeout?: NodeJS.Timeout;

    //Function to end the current round - resolves the promise returned by startRound
    private endCurrentRound: (value: void | PromiseLike<void>) => void = () => { };

    //Constructor
    private constructor(id: string, playlist: Playlist, type: GameType, visibility: GameVisibility, gameOptions: GameOptions) {
        this.id = id;
        this.type = type;
        this.visibility = visibility;
        this.playlist = playlist;

        this.players = new ObservableMap<string, Player>();
        this.rounds = [];
        this.status = GameStatus.PENDING;

        this.chatMessages = [];

        //Check gameOptions bounds and set defaults if needed - ensure that all game options are defined
        this.gameOptions = gameOptions;
        for (let [key, option] of Object.entries(ADVANCED_OPTIONS_DEFINITIONS)) {
            let currentValue = this.gameOptions[key as keyof GameOptions];
            if (currentValue === undefined || currentValue < option.min || currentValue > option.max) {
                this.gameOptions[key as keyof GameOptions] = option.default;
            }
        }
    }


    /**
     * Builds a new Game object and returns a Promise for it.
     * (Async replacement for a constructor)
     * @param id The ID of the new game
     * @param playlist The playlist that this game will be played on
     * @param type The type of this game
     * @param visibility The visibility of this game
     * @param gameOptions The desired parameters for this game
     */
    public static async newInstance(id: string, playlist: Playlist, type: GameType, visibility: GameVisibility, gameOptions: GameOptions): Promise<Game> {
        let newGame = new Game(id, playlist, type, visibility, gameOptions);
        await newGame.generateRounds();
        return newGame;
    }


    /**
     * Shuffles the tracks in the playlist and looks for preview URLs.
     * Attempts to find desiredNumRounds preview URLs. 
     * If unable to find enough previewURLs, repeats at random until reaching desired amount.
     * 
     * @returns The list of generated rounds
     */
    public async generateRounds() {
        //Clear selection
        this.rounds = [];

        //Remove local tracks and shuffle the remaining ones
        let viableTracks: Track[] = lodash.shuffle(this.playlist.tracks.items.map((value) => value.track).filter((track) => !(track?.is_local ?? true)));

        //Pick the tracks from this playlist
        //Look through all the (shuffled) non-local tracks until enough tracks with previewURLs are found (or all options are exhausted).
        let chosenTracks: Set<Track> = new Set();
        for (let trackNum = 0; chosenTracks.size < this.gameOptions.numRounds! && trackNum < viableTracks.length; trackNum++) {
            let chosenTrack = viableTracks[trackNum];
            chosenTrack.previewURL = await SpotifyAPI.getTrackPreviewURL(chosenTrack.id).catch((error) => {
                console.error(`Unable to get preview URL for track ${chosenTrack.id}: `, error.message);
                return undefined;
            });

            if (chosenTrack.previewURL) {
                chosenTracks.add(chosenTrack);
            }
        }

        //Helper function to convert a track into a round for this game
        const createRound = (track: Track) => {
            //Generate choices (if needed)
            let choices: TrackChoice[] | undefined;
            if (this.type == GameType.CHOICES) {
                let numChoices = this.gameOptions.numChoices ?? 1;

                //Remove correct answer by putting it first, removing all duplicates, then removing first element
                let possibleChoices = lodash.uniqBy([track, ...viableTracks], "id").slice(1);

                //Pick a random sample of incorrect answers and include the right answer
                choices = [track, ...lodash.sampleSize(possibleChoices, numChoices - 1)].map((chosenTrack) => {
                    return { id: chosenTrack.id, name: chosenTrack.name, artist: chosenTrack.artists.map((artist) => artist.name).join(", ") };
                });

                //Shuffle the choices
                choices = lodash.shuffle(choices);
            }

            //Determine round duration
            let roundDuration = this.gameOptions.roundDuration! * 1000;

            //Create and return the round
            return new Round(track.id, track.previewURL ?? "", roundDuration, choices);
        }

        //Convert chosen tracks set to list of Rounds
        this.rounds = Array.from(chosenTracks).map(createRound);

        //Throw error if no rounds were generated
        if (this.rounds.length <= 0) {
            throw new Error("No valid rounds could be generated");
        }

        //Repeat rounds at random until the desired number is reached
        if (this.rounds.length < this.gameOptions.numRounds!) {
            //This needs to be looped for the case where (desired num rounds - this.rounds.length) < this.rounds.length
            while (this.rounds.length < this.gameOptions.numRounds!) {
                this.rounds.push(...lodash.sampleSize(this.rounds, this.gameOptions.numRounds! - this.rounds.length)!);
            }

            //Re-shuffle the rounds
            this.rounds = lodash.shuffle(this.rounds);
        }
    }


    /**
     * Returns the requested player of this game, if the player is in the game.
     * Ensures existence of player and player's activeGameInfo
     * @param playerId The ID of the player to check for
     * @returns The requested player of this game
     * @throws Error if the requested player is not in this game
     */
    public getPlayer(playerId: string): Player {
        let player = this.players.get(playerId);
        if (!player || player.activeGameInfo?.gameId !== this.id) {
            throw new Error(`Player ${playerId} is not in game ${this.id} (${this.playlist.name})`);
        }
        return player;
    }


    /**
     * Adds the given player to this game
     * @param player The player to add to the game
     */
    public addPlayer(player: Player) {
        this.players.set(player.id, player);

        //Set the player's activeGameInfo
        player.activeGameInfo = {
            gameId: this.id,
            isReady: false,
            scores: Array.from(this.rounds, () => null)
        }

        //Force this player to skip the current round if game is in progress
        if (this.status === GameStatus.ACTIVE) {
            this.submitPlayerGuess(player.id, this.currentRound?.index ?? -1, "");
        }

        //Add a message to chat history
        this.chatMessages.push({ sender: SERVER_CHAT_NAME, content: `${player.name} has joined the game.` });

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

        //Add a message to chat history
        this.chatMessages.push({ sender: SERVER_CHAT_NAME, content: `${player.name} has left the game.` });

        //Update remaining players
        this.broadcastUpdate();

        //Perform readiness check on remaining players
        this.checkReadiness();
    }


    /**
     * Sets the given player's isReady status to 'true'
     * @param playerId The ID of the player to ready up
     * @throws Error if the player is not in this game
     */
    public readyPlayer(playerId: string) {
        let player = this.getPlayer(playerId);

        //Set player status to ready
        player.activeGameInfo!.isReady = true;

        // console.log(`Readied player ${player.id} (${player.name}) in game ${this.id} (${this.playlist.name})`);

        //Update all players
        this.broadcastUpdate();

        //Check if all players are ready
        this.checkReadiness();
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

        //Check if all players are ready
        this.checkReadiness();

        // console.log(`Unreadied player ${player.id} (${player.name}) in game ${this.id} (${this.playlist.name})`);
    }


    /**
     * Checks how many players are ready, and if so, takes appropriate action based on current game status
     */
    public checkReadiness() {
        let readyPlayers = Array.from(this.players.values()).filter((player) => player.activeGameInfo?.isReady);
        let allPlayersReady = readyPlayers.length === this.players.size;
        let halfPlayersReady = readyPlayers.length > this.players.size * 0.5;
        switch (this.status) {
            // Game is pending
            case GameStatus.PENDING:
                if (allPlayersReady) {
                    //If all players are ready during pending stage, the game is ready to start
                    clearTimeout(this.gameStartTimeout);
                    this.gameStartTimeout = undefined;
                    this.start();
                } else if (halfPlayersReady) {
                    //If over half the players are ready during pending stage, all players will be readied after timeout
                    if (!this.gameStartTimeout) {
                        this.gameStartTimeout = setTimeout(() => {
                            //Ready all players
                            this.players.forEach((player) => player.activeGameInfo!.isReady = true);

                            //Re-check readiness (start game)
                            this.checkReadiness();
                        }, READY_TIMEOUT);
                    }
                } else {
                    //If not enough players are ready, cancel the autostart timer
                    clearTimeout(this.gameStartTimeout);
                    this.gameStartTimeout = undefined;
                }
                break;

            // Game is active
            case GameStatus.ACTIVE:
                if (allPlayersReady) {
                    //If all players are "ready" during the game, they are all ready for next round
                    this.endCurrentRound();
                }
                break;
        }
    }


    /**
     * Updates the game state to reflect the specified player making the specified guess
     * @param playerId The ID of the player making the guess
     * @param roundNum The index of the round being played
     * @param trackId The ID of the track being guessed
     * @returns A GuessResult object indicating the result of the guess
     * @throws Error if player or round does not exist, or if player is already ready for round end
     */
    public async submitPlayerGuess(playerId: string, roundNum: number, trackId: string): Promise<GuessResult> {
        //Get the player
        let player = this.getPlayer(playerId);

        //Reject the guess if the player is already ready for round to end
        if (player.activeGameInfo!.isReady) {
            throw new Error(`Player ${player.id} (${player.name}) is already ready for round end.`);
        }

        //Reject the guess if the roundNum does not match the index of the round currently being played
        if (roundNum !== this.currentRound?.index ?? -1) {
            throw new Error("Provided round index does not match current round index.");
        }

        //Get the round
        let round = this.rounds?.[roundNum];
        if (!round) {
            throw new Error(`Round ${roundNum} does not exist in game ${this.id} (${this.playlist.name})`);
        }

        //Reject the guess if the player has already submitted a guess for this round
        if (player.activeGameInfo!.scores[roundNum] !== null) {
            throw new Error(`Player ${player.id} (${player.name}) has already submitted a guess for round ${roundNum}.`)
        }

        //If correct, grant between 0-1000 points depending on time taken, 0 otherwise
        let isCorrect = trackId === round.trackId;
        let timeRemaining = round.maxDuration - (new Date().getTime() - this.rounds?.[roundNum]?.startTime) + 3 * COUNTDOWN_INTERVAL;
        let numPoints = isCorrect ? Math.round((timeRemaining / round.maxDuration) * 1000) : 0;

        //Update this player's point count for this round
        player.activeGameInfo!.scores[roundNum] = numPoints

        //Ready this player
        this.readyPlayer(playerId);

        //Update all players
        this.broadcastUpdate();

        //Build result object
        let result = { isCorrect: isCorrect, score: numPoints, correctTrackId: round.trackId }

        // console.log(`Submitted guess "${trackId}" for game ${game.id} (${game.playlist.name}) round ${roundNum} for player ${playerId}. Result: ${JSON.stringify(result)}`);

        return result;
    }


    /**
     * Sends a new chat by the specified player
     * @param playerId The ID of the player sending the chat message
     * @param content The content of the new chat message
     */
    public async submitPlayerChat(playerId: string, content: string) {
        //Get the player
        let player = this.getPlayer(playerId);

        //Add the message to the list of messages for this game
        this.chatMessages.push({ sender: player.name, content: content.substring(0, MAX_CHAT_LENGTH) });

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
     * Ends the game
     */
    public async end() {
        if (this.status !== GameStatus.ENDED) {
            //End the current round if it is ongoing
            this.endCurrentRound();

            //Inform all players that the game has ended
            this.status = GameStatus.ENDED;
            this.broadcastUpdate();
            console.log(`Ended game ${this.id} (${this.playlist.name})`);

            //Set up rematch
            if (this.players.size > 0) {
                setTimeout(async () => {
                    //Reset each player's activeGameInfo
                    this.players.forEach((player) =>
                        player.activeGameInfo = {
                            gameId: this.id,
                            isReady: false,
                            scores: Array.from(this.rounds, () => null)
                        }
                    );

                    //Create new rounds
                    await this.generateRounds();

                    //Set the status to pending and inform players
                    this.status = GameStatus.PENDING;
                    this.broadcastUpdate();
                    console.log(`Starting rematch for game ${this.id} (${this.playlist.name})`);
                }, REMATCH_TIMEOUT);
            }
        }
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
        for (let i = 0; i < this.rounds.length; i++) {
            if (this.status === GameStatus.ACTIVE) {
                //Start round and wait for it to finish
                await this.startRound(i);

                //End the round by readying all players and sending the correct track ID
                this.currentRound!.trackId = this.rounds[i].trackId;
                for (let player of this.players.values()) {
                    player.activeGameInfo!.isReady = true;
                }
                this.broadcastUpdate();

                //Wait before starting next round to give clients time to view scoreboard
                await new Promise((resolve) => setTimeout(resolve, POST_ROUND_WAIT_TIME));
            }
        }

        //End the game
        this.end();
    }


    /**
     * Starts the given round
     * @returns A promise that resolves when the max round duration is over
     */
    private async startRound(index: number): Promise<void> {
        //Unready all players
        this.players.forEach((player) => player.activeGameInfo!.isReady = false);

        //Set the currentRound variable
        this.currentRound = {
            index: index,
            audioURL: this.rounds[index].previewURL,
            duration: this.rounds[index].maxDuration,
            choices: this.rounds[index].choices
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
            type: this.type,
            visibility: this.visibility,
            status: this.status,
            playlist: {
                id: this.playlist.id,
                name: this.playlist.name,
                uri: this.playlist.uri,
                description: this.playlist.description,
                numTracks: this.playlist.tracks.total
            },
            players: playerStates,
            currentRound: this.currentRound,
            options: this.gameOptions,
            chatMessages: this.chatMessages
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
        if (this.connection && this.connection.readyState === WebSocket.OPEN) {
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