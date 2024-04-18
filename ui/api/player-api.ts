import axios from 'axios';
import { GameConnection, type PlayerConnection } from '../stores/gameStore';
import { WebSocketRoute, type WebSocketRequest } from "../../shared/ws-routes"
import type { GuessResult, Track } from '../../shared/types';
import { ErrorMessage } from '../stores/pageStore';

//Address of the REST server
const API_ADDRESS = import.meta.env.PUBLIC_API_ADDRESS;

const apiCaller = axios.create({
    baseURL: API_ADDRESS,
    timeout: 10000
});

let playerConnection: PlayerConnection;
GameConnection.subscribe((value) => playerConnection = value);

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
 * Sends a WebSocketRequest to the desired WebSocketRoute
 * @param type The WebSocketRoute endpoint to hit with this request
 * @param payload The data to be sent with this request
 */
function sendWSRequest(type: WebSocketRoute, payload?: any) {
    let request: WebSocketRequest = { type: type, data: payload };
    playerConnection.send(JSON.stringify(request));
}


//Configure an axios interceptor to add token to every request
apiCaller.interceptors.request.use((config) => {
    const token = playerConnection.token;
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    console.error(error);
});


/**
 * Attempts to register a new player with the given name
 * @param name The name of the player to register
 * @returns A promise for the error message if the request fails
 */
export async function joinGame(gameId: string): Promise<string | void> {
    return apiCaller.post(`/joinGame/${gameId}`).then((res) => {
        if (res.data.error) {
            console.error(`Failed to join game '${gameId}'. Please try again.`, res?.data?.error);
            return res?.data?.error;
        }
        return;
    }).catch((error) => {
        setError(`Failed to join game '${gameId}'. Please try again.`, error);
        return error.message;
    });
}


/**
 * Requests a Spotify search for game track guess options using the provided query
 * @param query Search query
 * @param offset The index of results to start query at
 * @param limit The max number of results to return
 */
export async function findGuessOptions(query: string, offset:number=0, limit:number=5): Promise<Track[]> {
    return apiCaller.get(`/findGuessOptions/${query}`, { params: {offset: offset, limit: limit }}).then((res) => {
        return res.data;
    }).catch((error) => {
        setError("Unable to perform search. Please try again.", error);
        return [];
    });
}


/**
 * Submits the player's guess for the specified round
 * @param roundNum The index of the round being played
 * @param trackId The ID of the track being guessed
 * @returns The result of the guess as a GuessResult object
 */
export async function submitGuess(roundNum: number, trackId: string): Promise<GuessResult | void> {
    return apiCaller.post(`/submitGuess`, { roundNum: roundNum, trackId: trackId }).then((res) => {
        if (res.data.error) {
            console.error("Failed to submit guess", res.data?.error);
        } else {
            return res.data;
        }
    }).catch((error) => {
        console.error("Failed to submit guess", error);
    });
}


/**
 * Submits a new chat message with the specified content
 * @param content The content for the chat message
 */
export async function sendChat(content: string): Promise<void> {
    return apiCaller.post(`/submitChat`, { content: content }).then((res) => {
        if (res.data.error) {
            console.error("Failed to send chat message", res.data?.error);
        } else {
            return res.data;
        }
    }).catch((error) => {
        console.error("Failed to send chat message", error);
    });
}


/**
 * Informs the server that this player is READY
 */
export async function readyPlayer() {
    sendWSRequest(WebSocketRoute.READY);
}


/**
 * Informs the server that this player is NOT READY
 */
export async function unreadyPlayer() {
    sendWSRequest(WebSocketRoute.UNREADY);
}


/**
 * Removes this player from their active game
 */
export async function leaveGame() {
    sendWSRequest(WebSocketRoute.LEAVE_GAME);
}
