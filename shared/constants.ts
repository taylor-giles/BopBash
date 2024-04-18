//Maximum number of allowed characters in a username
export const MAX_USERNAME_LENGTH = 20;

//Regex that matches only valid Game IDs
export const GAME_ID_REGEX = /^[0-9A-Fa-f]{6}$/;

//Time (in millis) to wait after requesting to join a game
export const JOIN_GAME_TIMEOUT = 5000;

//Time (in millis) between each number in the countdown
export const COUNTDOWN_INTERVAL = 400;

//Time (in millis) before rematch game begins after game end
export const REMATCH_TIMEOUT = 20000;

//Maximum length of a chat message, in characters
export const MAX_CHAT_LENGTH = 200;

//Time (in millis) to remain in conclusion phase after all players ready
export const POST_ROUND_WAIT_TIME = 8000;
