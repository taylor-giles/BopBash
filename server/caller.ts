import { IncomingMessage } from "http";
import { request, RequestOptions } from "https";
import querystring, { ParsedUrlQueryInput } from 'querystring';
import { load as cheerio } from "cheerio";
import { Playlist, playlistFields, Track, tracksFields } from "./types";

const CLIENT_ID = "SECRET";
const CLIENT_SECRET = "SECRET";
const TRACK_NUM_LIMIT = 2000; //Global hard limit on the number of tracks to pull from a playlist

//API Access Variables
let accessToken: string;
let isTokenValid = false;
let invalidationTimeout: NodeJS.Timeout;
let backoff = false;

//Type definitions
type APIResponse = { res: IncomingMessage, responseData: string }
type FailedAPIResult = { error: Error, res?: IncomingMessage, responseData?: string }
type RequestResult = APIResponse
type APICallback = (result: APIResponse) => any
type FailedAPICallback = (result: FailedAPIResult) => any


/**
 * Effective lock implementation to allow for waiting until the API is ready to be called before proceeding with some function.
 * Waits for both the access token to be valid and the backoff period to elapse.
 * @param cb Function to be called when the API is ready.
 * @param skipAccessToken Set to true if the access token is not needed for the API call. Should only be true if the API call is for updating the token.
 */
function whenAPIReady(cb: () => void, skipAccessToken = false) {
    if ((isTokenValid || skipAccessToken) && !backoff) {
        cb();
    } else {
        setTimeout(() => { whenAPIReady(cb) }, 100);
    }
}


/**
 * Wrapper for making an HTTPS request. Propagates result using the provided callback.
 * @param requestOptions Request options object to be used for the request.
 * @param formData Optional dictionary containing form data to be included with the request.
 * @returns A promise containing the result of the request in the form of a RequestResult typed object.
 */
async function makeRequest(requestOptions: RequestOptions, formData?: ParsedUrlQueryInput): Promise<RequestResult> {
    return new Promise((resolve, reject) => {
        //Set up callbacks and make request
        const req = request(requestOptions, (res: IncomingMessage) => {
            let responseData = "";

            //Build response data string as data comes in
            res.on("data", (chunk) => {
                responseData += chunk;
            });

            //Handle response end
            res.on("end", () => {
                //Propagate results to caller
                resolve({ res: res, responseData: responseData });
            });
        });

        //Propagate errors
        req.on('error', reject);

        //Add form data
        if (formData) {
            req.write(querystring.stringify(formData));
        }

        //End request
        req.end();
    });
}


/**
 * Calls the Spotify API using the provided request options and optional form data.
 * @param requestOptions Request options object to be used for the request.
 * @param formData Optional dictionary containing form data to be included with the request.
 * @returns A promise containing the response in the form of an APIResponse typed object
 */
async function callAPI(requestOptions: RequestOptions, formData?: ParsedUrlQueryInput): Promise<APIResponse> {
    return new Promise((resolve, reject) => {
        //Wait for access token validity and backoff
        requestOptions.headers = requestOptions.headers ?? {}
        let skipAccessToken = "Authorization" in requestOptions.headers; //Skip access token checking if Authorization header is already provided
        whenAPIReady(() => {
            //Inject access token if necessary
            if (!skipAccessToken) {
                //Add authorization header with access token
                requestOptions.headers = {
                    ...requestOptions.headers,
                    'Authorization': 'Bearer ' + accessToken
                };
            }

            //Make the request
            makeRequest(requestOptions, formData).then(result => {
                //Check for "retry-after" header, indicating limit exceeded
                let retryAfter = parseInt(result.res.headers["retry-after"] ?? "0");
                backoff = retryAfter > 0;
                if (backoff) {
                    console.log("Retry-After header detected. Backing off.");
                    setTimeout(() => {
                        backoff = false;
                        console.log("Backoff period has elapsed - proceeding with requests.");
                    }, retryAfter * 1000);
                }

                //Check result status code
                if (result.res.statusCode != 200) {
                    reject({ ...result, error: new Error(`Bad status code: ${result.res.statusCode}. Message: ${result.res.statusMessage}`) });
                } else {
                    resolve(result);
                }
            }).catch((error) => {
                reject({ error: error });
            });
        }, skipAccessToken);
    });
}


/**
 * Updates the value of the access token and sets up a timer to monitor its expiration
 * @param token The updated token value
 * @param expirationTime The time, in seconds, before this token expires
 */
function updateAccessToken(token: string, expirationTime: number) {
    accessToken = token;
    isTokenValid = true;
    console.log("Access token updated.");

    //Set new invalidation timer - If expiration time elapses, mark token as invalid
    clearTimeout(invalidationTimeout);
    invalidationTimeout = setTimeout(() => { isTokenValid = false }, expirationTime * 1000);
}


/**
 * Ensures that the access token is always updated.
 * Call this once to set up a recurring timer that updates the token whenever it is about to expire.
 */
export async function maintainAccessToken() {
    //Build request options object
    let requestOptions: RequestOptions = {
        hostname: "accounts.spotify.com",
        path: "/api/token",
        method: "POST",
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }

    //Build form data
    let formData = { "grant_type": "client_credentials" };

    //Configure failure callback
    let onFailure: FailedAPICallback = (result: FailedAPIResult) => {
        console.error(`Failed to obtain access token. Result: ${JSON.stringify(result)}`)
    }

    //Configure success callback
    let onSuccess: APICallback = (result: APIResponse) => {
        let body = JSON.parse(result.responseData);

        //Extract access token
        let accessToken = body["access_token"]
        if (accessToken) {
            //Get expiration time for this token, in SECONDS
            let expirationTime = body["expires_in"];

            updateAccessToken(accessToken, expirationTime);

            //Set timer to update token 1 minute before it expires
            setTimeout(() => {
                maintainAccessToken();
            }, (expirationTime - 60) * 1000);
        } else {
            //Error if access token not found
            onFailure({ ...result, error: Error(`Access token not present in response data.`) })
        }
    }

    //Make API call
    callAPI(requestOptions, formData).then(onSuccess).catch(onFailure);
}


/**
 * Uses the Spotify API to obtain information about a playlist (including information about its tracks)
 * @param id ID of the playlist to query
 * @returns Object containing the playlist data, including list of tracks
 */
export async function findPlaylistData(id: string): Promise<Playlist> {
    //First get the information about the playlist itself, including number of tracks, then get track data
    let requestOptions: RequestOptions = {
        hostname: "api.spotify.com",
        path: `/v1/playlists/${id}?limit=0&fields=${playlistFields}`,
        method: "GET",
    }

    let onFailure: FailedAPICallback = (result: FailedAPIResult) => {
        console.error(result.error);
    }

    //Make request to get playlist data
    let result = await callAPI(requestOptions).catch(onFailure);
    if(!result){
        throw new Error("Playlist not found");
    }
    
    let data = JSON.parse(result?.responseData);
    let numTracks: number = data.tracks.total < TRACK_NUM_LIMIT ? data.tracks.total : TRACK_NUM_LIMIT; //Enforce track num limit

    //Get track data, 100 tracks at a time
    let tracks: Track[] = [];
    for (let offset = 0; tracks.length < numTracks; offset += 100) {
        let newTracks = await findPlaylistTracks(id, offset).catch(onFailure);
        tracks = [...tracks, ...newTracks]; 
    }

    //Store the tracks in the playlist object
    data.tracks.items = tracks;
    console.log(`Successfully obtained data for playlist: ${id} (${data.name})`);
    return data;
}


/**
 * Uses the Spotify API to get information about at most 100 tracks in a playlist
 * Note: This does NOT include preview URL for each track, to avoid excessive requests.
 * @param playlistId ID of the playlist to query
 * @param offset Index to start query at
 * @param limit Max number of tracks to get in query. Max is 100.
 * @returns List of tracks in the playlist starting at the specified offset
 */
export async function findPlaylistTracks(playlistId: string, offset: number, limit: number=100): Promise<Track[]> {
    let requestOptions: RequestOptions = {
        hostname: "api.spotify.com",
        path: `/v1/playlists/${playlistId}/tracks?fields=${tracksFields}&offset=${offset}&limit=${limit}`,
        method: "GET"
    }

    //Configure callbacks
    let onFailure: FailedAPICallback = (result: FailedAPIResult) => {
        console.error(result.error);
    }

    //Make request
    let result = await callAPI(requestOptions).catch(onFailure);

    //Return resulting list of tracks
    return JSON.parse(result.responseData).items;
}


/**
 * Uses the Spotify embed API to get the preview URL for the given track
 * Note: This is necessary because the data returned by the normal API does not contain preview URL for around 50% of tracks
 * @param id ID of the track
 * @returns The playlist URL for the given track as a string, or null if not found
 */
export async function getTrackPreviewURL(id: string): Promise<string> {
    let requestOptions: RequestOptions = {
        hostname: "open.spotify.com",
        path: `/embed/track/${id}`,
        method: "GET",
        headers: {
            "User-Agent": "Node.js" //This can be anything, as long as the header is set
        }
    }

    let onSuccess = (result: APIResponse) => {
        const data = JSON.parse(cheerio(result.responseData)("#__NEXT_DATA__").html() ?? "");
        return data.props.pageProps.state.data.entity.audioPreview.url;
    }

    return callAPI(requestOptions).then(onSuccess);
}


// export async function getTrackData(id: string) {
//     let requestOptions: RequestOptions = {
//         hostname: "api.spotify.com",
//         path: `/v1/tracks/${id}`,
//         method: "GET",
//     }

//     //Configure callbacks
//     let onSuccess: APICallback = (result: APIResponse) => {
//         console.log(JSON.parse(result.responseData).preview_url)
//     }
//     let onFailure: FailedAPICallback = (result: FailedAPIResult) => {
//         console.error(result.error)
//     }

//     //Make request
//     callAPI(requestOptions).then(onSuccess).catch(onFailure);
// }



// export async function getTrackEmbed(id: string) {
//     let requestOptions: RequestOptions = {
//         hostname: "open.spotify.com",
//         path: `/embed/track/${id}}`,
//         method: "GET",
//         headers: {
//             "User-Agent": "Someone"
//         }
//     }

//     let onSuccess = (result: APIResponse) => {
//         console.log(result.responseData);
//     }

//     callAPI(requestOptions).then(onSuccess);
// }