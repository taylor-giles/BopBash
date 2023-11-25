import express from 'express';
import crypto from 'crypto';
import querystring from 'querystring';
import { updateAccessToken } from './caller';

const client_id = "SECRET";
const redirect_uri = "http://localhost:5000/home";

const app = express();
const port = 5000;
app.use(express.json());
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

app.get('/login', function(req, res) {
    let state = crypto.randomBytes(16).toString('hex');
    let scope = "playlist-read-private playlist-read-collaborative user-library-read";

    res.redirect("https://accounts.spotify.com/authorize?" + 
    querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }));
});

//Get access token
updateAccessToken();