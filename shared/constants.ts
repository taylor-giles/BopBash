//Address of the WebSocket server
export const WS_ADDRESS = "ws://192.168.1.21:4001";

//Address of the REST server
export const API_ADDRESS = "http://192.168.1.21:4000/api";

//Maximum number of allowed characters in a username
export const MAX_USERNAME_LENGTH = 20;

//Regex that matches only valid Game IDs
export const GAME_ID_REGEX = /^[0-9A-Fa-f]{6}$/;

//Time (in millis) to wait after requesting to join a game
export const JOIN_GAME_TIMEOUT = 5000;

//Time (in millis) between each number in the countdown
export const COUNTDOWN_INTERVAL = 400;
