import axios from 'axios';
import type { Artist, GameOptions, GameState, GameType, GameVisibility, Playlist, PlaylistMetadata, Track } from '../../shared/types';
import { ErrorMessage } from '../stores/pageStore';

//Address of the REST server
const API_ADDRESS = import.meta.env.PUBLIC_API_ADDRESS;

const apiCaller = axios.create({
    baseURL: API_ADDRESS,
    timeout: 20000
});


/**
 * Displays the error message in modal and prints error data to console
 * @param errorMsg The error message to display in modal
 * @param error Additional error information to print to console
 */
function setError(errorMsg: string, error: any) {
    console.error(errorMsg, error);
    ErrorMessage.set(errorMsg);
}


/**
 * Requests information about the specified playlist
 * @param id The ID of the playlist to query for
 * @returns The playlist data
 */
export async function getPlaylistData(id: string): Promise<Playlist> {
    return apiCaller.get(`/getPlaylistData/${id}`).then((res) => {
        return res.data;
    }).catch((error) => {
        setError("Failed to get playlist data", error);
        return null;
    });
}


/**
 * Requests a Spotify search for playlists using the provided query
 * @param query Search query
 * @param offset The index of results to start query at
 * @param limit The max number of results to return
 */
export async function findPlaylists(query: string, offset?: number, limit?: number) : Promise<{nextOffset: number, results: PlaylistMetadata[]}> {
    return apiCaller.get(`/findPlaylists/${query}`, { params: { offset: offset, limit: limit } }).then((res) => {
        return res.data;
    }).catch((error) => {
        setError("Unable to perform search. Please try again.", error);
        return {nextOffset: -1, results: []};
    });
}


/**
 * Requests a Spotify search for playlists using the provided query
 * @param query Search query
 * @param offset The index of results to start query at
 * @param limit The max number of results to return
 */
export async function findArtists(query: string, offset?: number, limit?: number) : Promise<{nextOffset: number, results: Artist[]}> {
    return apiCaller.get(`/findArtists/${query}`, { params: { offset: offset, limit: limit } }).then((res) => {
        return res.data;
    }).catch((error) => {
        setError("Unable to perform search. Please try again.", error);
        return {nextOffset: -1, results: []};
    });
}


/**
 * Obtains the top tracks for the specified artist
 * @param id The ID of the artist
 * @returns A list of the specified artist's top tracks 
 */
export async function getArtistTopTracks(id: string): Promise<Track[]> {
    return apiCaller.get(`/getArtistTopTracks/${id}`).then((res) => {
        return res.data;
    }).catch((error) => {
        setError("Unable to perform search. Please try again.", error);
        return [];
    });
}


/**
 * Attempts to register a new player with the given name
 * @param name The name of the player to register
 * @returns A promise for the ID of the new player
 */
export async function registerPlayer(name: string): Promise<{ playerId: string, token: string } | undefined> {
    return apiCaller.post('/registerNewPlayer', { name: name }).then((res) => {
        if (res?.data?.error) {
            setError(`Failed to register new player. Please try again.`, res?.data?.error);
            return;
        }
        return res?.data;
    }).catch((error) => {
        setError(`Failed to register new player. Please try again.`, error);
        return;
    });
}


/**
 * Obtains a list of all available games
 * @returns The list of GameStates for available games
 */
export async function getGames(): Promise<GameState[]> {
    return apiCaller.get('/getGames').then((res) => {
        if (res?.data?.error) {
            setError("Failed to obtain list of games", res?.data?.error);
            return [];
        }
        return res?.data;
    }).catch((error) => {
        setError("Failed to obtain list of games", error);
        return [];
    });
}


/**
 * Creates a new game
 * @param playlistId The ID of the playlist for this game
 * @param type The GameType for this game
 * @param visibility The GameVisibility for this game
 * @param gameOptions Additional GameOptions for this game
 * @returns The ID of the created game, or null on error
 */
export async function createGame(playlistId: string, type: GameType, visibility: GameVisibility, gameOptions: GameOptions): Promise<string | null> {
    return apiCaller.post('/newGame', {
        playlistId: playlistId,
        type: type,
        visibility: visibility,
        gameOptions: gameOptions
    }).then((res) => {
        if(res?.data?.error){
            setError("Failed to create new game", res?.data?.error);
            return null;
        }
        return res?.data?.gameId;
    }).catch((error) => {
        setError("Failed to create new game", error);
        return null;
    })
}

export async function getNumPlayers(): Promise<number> {
    return apiCaller.get('/getNumPlayers').then((res) => {
        return res?.data ?? 0;
    }).catch((error) => {
        console.error("Failed to obtain number of players", error);
        return -1;
    });
}

export async function getNumGames(): Promise<number>{
    return apiCaller.get('/getNumGames').then((res) => {
        return res?.data ?? 0;
    }).catch((error) => {
        console.error("Failed to obtain number of games", error);
        return -1;
    });
}

export async function getTotalGamesPlayed(): Promise<number>{
    return apiCaller.get('/getTotalGamesPlayed').then((res) => {
        return res?.data ?? 0;
    }).catch((error) => {
        console.error("Failed to obtain number of total games played", error);
        return -1;
    });
}
