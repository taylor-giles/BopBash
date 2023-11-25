import { IncomingMessage } from "http";
import { request, RequestOptions } from "https";
import querystring, { ParsedUrlQueryInput } from 'querystring';
const CLIENT_ID = "SECRET";
const CLIENT_SECRET = "SECRET";

export let accessToken = null;
let backoff = false;

type APICallResult = | {res: IncomingMessage, responseData: string} | {error: Error}

async function callAPI(callback: (result: APICallResult) => any, requestOptions: RequestOptions, formData?: ParsedUrlQueryInput) {
    //Set up callbacks and make request
    const req = request(requestOptions, (res: IncomingMessage) => {
        let responseData = "";

        //Build response data string as data comes in
        res.on("data", (chunk) => {
            responseData += chunk;
        });

        //Handle response end
        res.on("end", () => {
            //Check for "retry-after" header, indicating limit exceeded
            let retryAfter = parseInt(res.headers["retry-after"] ?? "0");
            backoff = retryAfter > 0;
            if (backoff) {
                setTimeout(() => { 
                    backoff = false; 
                }, retryAfter * 1000);
            }

            //Propagate results to caller
            callback({res: res, responseData: responseData});
        });
    });

    //Propagate errors
    req.on('error', (error) => {
        callback({error: error});
    });

    //Add form data
    if (formData) { 
        req.write(querystring.stringify(formData)); 
    }

    //End request
    req.end();
}

export function updateAccessToken() {
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

    //Make request
    callAPI((result: APICallResult) => {
        try {
            if('error' in result){
                throw result.error;
            }

            if (result.res.statusCode == 200){
                let body = JSON.parse(result.responseData);

                //Extract access token
                if (body["access_token"]) {
                    accessToken = body["access_token"];
                    console.log("Access token updated.");
    
                    //Set up timeout for renewing the token 1 minute before it expires
                    let expirationTime = body["expires_in"];
                    setTimeout(updateAccessToken, (expirationTime - 60) * 1000);
                } else {
                    //Error if access token not found
                    throw new Error(`Access token not present in response data. Response data: ${result.responseData}`);
                }
            } else {
                //Error if request failed
                throw new Error(`Bad status code: ${result.res.statusCode}. Message: ${result.res.statusMessage}`);
            }
        } catch (e) {
            console.error("Failed to update token. ", e);
        }
    }, requestOptions, formData);
}