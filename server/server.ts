import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';
import * as SpotifyAPI from "./caller";
import { routeWebsocketRequest, router } from './router';
import * as consoleStamp from 'console-stamp';
import { PlayerConnection } from './types';
import { IncomingMessage } from 'http';
import { verifyToken } from './auth';
import * as GameDriver from './GameManager';
import { WebSocketRoute } from '../shared/ws-routes';
import cors from 'cors';

const EXPRESS_PORT = 5000;
const WS_PORT = 5001;
const WS_PING_INTERVAL = 20000;

//Add timestamps to all logs
consoleStamp.default(console, {
    format: ':date(mm/dd/yy HH:MM:ss):label'
});

//Configure express server
const app = express();
// Enable CORS for all routes or specific routes as needed
app.use(cors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
app.use(express.json());
app.listen(EXPRESS_PORT, () => {
    console.log(`Express server listening on port ${EXPRESS_PORT}.`);
});
app.use('/api', router);

//Configure web socket server
const wsServer = new WebSocketServer({ port: WS_PORT });
wsServer.on('connection', (ws: PlayerConnection, req: IncomingMessage) => {
    console.log("New WS connection received");

    //Authenticate the user (verify the token)
    try {
        if (!req.url) {
            throw new Error("Request URL not available.");
        }

        //Get ID and token
        let url = new URL(req.url, `http://${req.headers.host}`);
        let token = url.searchParams.get("token");
        if (!token) {
            throw new Error("Token not provided.");
        }

        //Verify (throws error on failure)
        let playerId = verifyToken(token).toString();

        //Attach player to WS
        GameDriver.establishPlayerConnection(playerId, ws).catch((error) => {
            ws.close();
            console.error(`Unable to establish player connection for player ${playerId}:`, error.message);
        });
    } catch (error: any) {
        //If authentication fails, close the connection and do not continue
        console.error(`Unable to authenticate WS connection - closing connection.`, error.message);
        ws.close();
        return;
    }

    //Set up heartbeat
    ws.on('pong', () => {
        setTimeout(() => {
            ws.ping();
        }, WS_PING_INTERVAL);
    });
    ws.ping();

    //Set up handler
    ws.onmessage = ((event: WebSocket.MessageEvent) => {
        let msg = event.data.toString();
        try {
            let data = JSON.parse(msg);
            if (!('type' in data)) {
                throw new Error("All WebSocket messages must specify a type.");
            }
            if (!(Object.values(WebSocketRoute).includes(data.type))) {
                throw new Error(`Unrecognized type: ${data.type}`);
            }
            routeWebsocketRequest(ws, data);
        } catch (e) {
            console.error(`Received badly formatted message on WebSocket: \n${msg}\n`, e);
        }
    });
});
wsServer.on('listening', () => {
    console.log(`Websocket server listening on port ${WS_PORT}.`);
});
wsServer.on("close", () => {
    console.log("Websocket server stopped.")
});


//Make sure access token is maintained (initialize API caller)
console.log("Initializing Spotify API.");
SpotifyAPI.maintainAccessToken();

// for(let i = 0; i < 50; i++){
//     console.log(generateNewPlayerId());
// }


// getTrackPreviewURL("02MiyVckOBtygUOEDnV7Pd")
// getPreviewURL("https://open.spotify.com/track/02MiyVckOBtygUOEDnV7Pd?si=806f650e57ee4216")
// getTrackEmbed("https://open.spotify.com/track/02MiyVckOBtygUOEDnV7Pd?si=806f650e57ee4216")
// getPlaylistTrackURIs("5H25eIw19USrnyVRluSL5B");
// getPlaylistData("5H25eIw19USrnyVRluSL5B").then((result) => console.log(JSON.stringify(result, null, 2)))

//Login endpoint
// app.get('/login', function(req, res) {
//     let state = crypto.randomBytes(16).toString('hex');
//     let scope = "playlist-read-private playlist-read-collaborative user-library-read";

//     res.redirect("https://accounts.spotify.com/authorize?" + 
//     querystring.stringify({
//         response_type: 'code',
//         client_id: client_id,
//         scope: scope,
//         redirect_uri: redirect_uri,
//         state: state
//       }));
// });