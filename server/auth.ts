import jwt from 'jsonwebtoken';
import crypto from 'crypto';

//Generate a secret key
const SECRET_KEY = crypto.randomBytes(30);

/**
 * Signs the given player ID to get a token
 * @param playerId The ID of the player for the token
 * @returns A JWT token that signs the given ID
 */
export function getToken(playerId: string){
    return jwt.sign(playerId, SECRET_KEY);
}


/**
 * Curried function for jwt.verify
 * @param token The token to verify
 * @returns The payload of the token
 */
export function verifyToken(token: string){
    return jwt.verify(token, SECRET_KEY);
}