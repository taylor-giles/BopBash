//Address of the WebSocket server
export const WS_ADDRESS = "ws://localhost:5001";

//Address of the REST server
export const API_ADDRESS = "http://localhost:5000/api";

//Maximum number of allowed characters in a username
export const MAX_USERNAME_LENGTH = 20;

//Regex that matches only valid Game IDs
export const GAME_ID_REGEX = /^[0-9A-Fa-f]{6}$/;

//Time (in millis) to wait after requesting to join a game
export const JOIN_GAME_TIMEOUT = 5000;