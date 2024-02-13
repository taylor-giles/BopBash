import axios from 'axios';
import { API_ADDRESS } from '../../shared/constants';
import type { GameState } from '../../shared/types';
import { ErrorMessage } from '../pageStore';

const apiCaller = axios.create({
    baseURL: API_ADDRESS,
    timeout: 10000
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
export async function getPlaylistData(id: string): Promise<any> {
    return apiCaller.get(`/getPlaylistData/${id}`).then((res) => {
        return res.data;
    }).catch((error) => {
        setError("Failed to get playlist data", error);
        return null;
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
            console.error("Failed to obtain list of games", res?.data?.error);
            return [];
        }
        return res?.data;
    }).catch((error) => {
        console.error("Failed to obtain list of games", error);
        return [];
    });
}


export async function createGame() {
    apiCaller.post('/newGame', {
        playlistId: "0xXeznNbTyIj3tpnt3841Y",
        numRounds: 10
    })
}