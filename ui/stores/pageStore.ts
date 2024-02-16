import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';


export enum Page {
  LOGIN = "Login",
  HOME = "Home",
  LOBBY = "Lobby",
  GAME = "Game",
  FIND = "Find",
}

/**
 * A Svelte store that provides access to the currently active UI page
 */
export const CurrentPage: Writable<Page> = writable<Page>(Page.LOGIN);

/**
 * A Svelte store that allows for setting an error message to be shown in an error modal.
 */
export const ErrorMessage: Writable<string> = writable<string>("");