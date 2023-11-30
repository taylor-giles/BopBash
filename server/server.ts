import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';
import * as SpotifyAPI from "./caller";
import { WebSocketRoute, routeWebsocketRequest, router } from './router';
import * as consoleStamp from 'console-stamp';
import { generateNewPlayerId } from './gameDriver';
import { PlayerConnection } from './types';

const EXPRESS_PORT = 5000;
const WS_PORT = 5001;
const WS_PING_INTERVAL = 20000;

//Add timestamps to all logs
consoleStamp.default(console, {
  format: ':date(mm/dd/yy HH:MM:ss):label'
});

//Configure express server
const app = express();
app.use(express.json());
app.listen(EXPRESS_PORT, () => {
    console.log(`Express server listening on port ${EXPRESS_PORT}.`);
});
app.use('/api', router);

//Configure web socket server
const wsServer = new WebSocketServer({ port: WS_PORT });
wsServer.on('connection', (ws: PlayerConnection) => {
    console.log("New connection:", ws);
    
    //Set up heartbeat
    ws.on('pong', () => {
        setInterval(() => {
            ws.ping();
        }, WS_PING_INTERVAL);
    });
    ws.ping();

    //Set up handler
    ws.onmessage = ((event: WebSocket.MessageEvent) => {
        let msg = event.data.toString();
        try {
            let data = JSON.parse(msg);
            if(!('type' in data)){
                throw new Error("All WebSocket messages must specify a type.");
            }
            if(!(data.type in Object.values(WebSocketRoute))){
                throw new Error("WebSocket message type must be a valid route.");
            }
            routeWebsocketRequest(ws, data);
        } catch (e) {
            console.error(`Received badly formatted message on WebSocket: ${msg}`, e);
        }
    });
});
wsServer.on('listening', () => {
    console.log(`Websocket server listening on port ${WS_PORT}.`);
});
wsServer.on("close", () => {
    console.log("Websocket server stopped.")
})


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