import type { Writable } from 'svelte/store';
import { writable, get } from 'svelte/store';

/**
 * Svelte writable stores for each of the possible audio elements.
 * These need to be writable so properties like src and volume can be set
 */
export const SFX_AUDIO: Writable<HTMLAudioElement> = writable<HTMLAudioElement>(new Audio("click.mp3"));
export const MUSIC_AUDIO: Writable<HTMLAudioElement> = writable<HTMLAudioElement>(new Audio("data:audio/mp3;base64, SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzYwLjMxAAAAAAAAAAAAAAAAJAUHAAAAAAAAAYZiVsXQAAAAAAD/+xDEAAPAAAGkAAAAIAAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EMQpg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"));
export const BG_AUDIO: Writable<HTMLAudioElement> = writable<HTMLAudioElement>(new Audio("lobby_theme.mp3"));
export const AUDIO_ELEMENTS = [BG_AUDIO, SFX_AUDIO, MUSIC_AUDIO];

//Add names to each of the audio elements, to identify their settings in local storage
get(BG_AUDIO).setAttribute("data-name", "Background Music");
get(SFX_AUDIO).setAttribute("data-name", "Sound Effects");
get(MUSIC_AUDIO).setAttribute("data-name", "In-Game Music");

//Create stores for the audio context and in-game audio visualizer node
export const AUDIO_CONTEXT: Writable<AudioContext> = writable<AudioContext>();
export const VISUALIZER_NODE: Writable<AnalyserNode> = writable<AnalyserNode>();

let isAudioInitialized = false;

/**
 * Initializes all of the audio elements to be used in the app.
 * This should be called as the direct result of a button press,
 * to enable autoplay for each of the elements in most(?) browsers.
 */
export async function initAudio() {
    if (!isAudioInitialized) {
        //Initialize audio context
        AUDIO_CONTEXT.set(new AudioContext());

        //Connect visualizer node to music element
        VISUALIZER_NODE.set(get(AUDIO_CONTEXT).createAnalyser());
        let sourceNode = get(AUDIO_CONTEXT).createMediaElementSource(get(MUSIC_AUDIO));
        sourceNode.connect(get(VISUALIZER_NODE));
        sourceNode.connect(get(AUDIO_CONTEXT).destination);

        //Initialize (play then pause) each audio instance
        for (const audio of AUDIO_ELEMENTS) {
            let element = get(audio);
            await element.play().then(() => {
                //Pause after content is loaded
                element.pause();

                //Set volume according to local storage
                element.volume = parseFloat(window.localStorage.getItem(element.getAttribute("data-name") ?? "") ?? "0.5");
            }).catch(console.error);
        }

        //Mute all audio elements if the tab loses focus
        //Note that this unmutes all audio elements when the tab gets focus again - 
        //  This means that the `muted` property probably should not be used anywhere else.
        document.addEventListener("visibilitychange", () => {
            for (let audio of AUDIO_ELEMENTS) {
                get(audio).muted = document.hidden;
            }
        });

        isAudioInitialized = true;
    }
}

export async function playClickSFX() {
    if (isAudioInitialized) {
        get(SFX_AUDIO).src = "click.mp3";
        get(SFX_AUDIO)?.play().catch(console.error);
    }
}