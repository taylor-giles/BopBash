import { WebSocket } from 'ws';
import { GameUpdate, GameUpdateType, PlayerConnection, Playlist, Track } from "./types";
import lodash from 'lodash';
import * as SpotifyAPI from './caller';

export type Round = {
    trackId: string,
    previewURL: string
}

export class Game {
    public id: string;
    playlist: Playlist;
    players:  { [id: string]: Player }
    rounds: Round[];

    private constructor(id: string, playlist: Playlist){
        this.id = id;
        this.playlist = playlist;
        this.players = {};
        this.rounds = [];
    }


    /**
     * Builds a new Game object and returns a Promise for it.
     * (Async replacement for a constructor)
     * @param id The ID of the new game
     * @param playlist The playlist that this game will be played on
     */
    public static async newInstance(id: string, playlist: Playlist, desiredNumRounds: number): Promise<Game>{
        let newGame = new Game(id, playlist);
        await newGame.generateRounds(desiredNumRounds);
        return newGame;
    }


    /**
     * Shuffles the tracks in the playlist and looks for preview URLs.
     * Attempts to find numRounds preview URLs. 
     * Adds AT MOST numRounds tracks to this.rounds.
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
                console.error(`Unable to get preview URL for track ${chosenTrack.id}: `, error);
                return undefined;
            });

            if (chosenTrack.previewURL) {
                chosenTracks.add(chosenTrack);
            }
        }

        //Convert chosen tracks set to list
        this.rounds = Array.from(chosenTracks).map((track) => {return {trackId: track.id, previewURL: track.previewURL ?? ""};});
    }


    /**
     * Adds the given player to this game
     * @param player The player to add to the game
     */
    public addPlayer(player: Player){
        if(!(player.id in this.players)){
            this.players[player.id] = player;
        } else {
            throw new Error(`Player ${player.id} (${player.name}) already in game ${this.id} (${this.playlist.name})`);
        }
    }


    /**
     * Stops the game
     */
    public async stop() {
        //Force all players to leave this game
        for(let playerId in this.players){
            this.players[playerId].leaveGame();
        }
    }


    /**
     * Starts the game by communicating with players
     */
    public async start(){
        for(let playerId in this.players){
            this.players[playerId].sendUpdate({type: GameUpdateType.GAME_START, data: this.rounds.map((round) => round.previewURL)});
        }
    }
}


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
    public sendUpdate(update: GameUpdate){
        if(this.connection){
            this.connection?.send(Buffer.from(JSON.stringify(update)));
        } else {
            console.error(`Unable to send game update to player ${this.id} - no connection established.`);
        }
    }


    /**
     * Connects this Player to a WebSocket connection with the client
     * @param ws The WebSocket connection established with the client
     */
    public connect(ws: WebSocket){
        this.connection = ws;
    }


    /**
     * Ensures that this player has no active game
     */
    public leaveGame(){
        if(this.activeGame){
            this.sendUpdate({type: GameUpdateType.GAME_OVER});
        }
        this.activeGame = undefined;
    }


    /**
     * Prepare this player for deletion
     */
    public kill(){
        //Leave active game (if it exists)
        this.leaveGame();

        //Close the connection
        this.connection?.close();
    }
}