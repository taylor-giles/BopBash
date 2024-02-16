import { writable } from 'svelte/store';

/**
 * A Svelte store that allows access to the Spotify IFrameAPI object
 */
export const IFrameAPI = writable();

window.onSpotifyIframeApiReady = (api) => {
    IFrameAPI.set(api);
};
