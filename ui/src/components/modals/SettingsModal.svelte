<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { SFX_AUDIO, BG_AUDIO, playClickSFX } from "../../../stores/audio";
    import VolumeIcon from "svelte-material-icons/VolumeHigh.svelte";
    import MusicIcon from "svelte-material-icons/Music.svelte";
    import CloseIcon from "svelte-material-icons/Close.svelte";
    import Modal from "./Modal.svelte";
    const dispatch = createEventDispatcher();
</script>

<Modal>
    <main>
        <div id="title">SETTINGS</div>
        <div id="settings-container">
            <div class="slider-container">
                <div class="slider-label header-text">
                    <MusicIcon height="100%" />
                    <b>BACKGROUND MUSIC</b>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.025"
                    bind:value={$BG_AUDIO.volume}
                />
            </div>
            <div class="slider-container">
                <div class="slider-label header-text">
                    <VolumeIcon height="100%" />
                    <b>SOUND EFFECTS</b>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.025"
                    on:change={playClickSFX}
                    bind:value={$SFX_AUDIO.volume}
                />
            </div>
        </div>
        <button
            id="close-btn"
            class="text-button"
            on:click={() => {
                dispatch("close");
            }}
            on:mouseup={playClickSFX}
        >
            <CloseIcon height="1.5rem" width="1.5rem"/>
        </button>
    </main>
</Modal>

<style>
    main {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        background-color: var(--accent-dark);
        padding: 1.5rem;
        padding-top: 2rem;
        border: 2px solid gray;
        border-radius: 12px;
        gap: 15px;
        width: 90dvw;
        height: 90dvh;
    }

    #title {
        font-size: 1.5rem;
        font-weight: 800;
    }

    input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        background-color: transparent;
        max-width: 1000px;
        width: 100%;
        height: 48px;
    }

    input[type="range"]:focus {
        outline: none;
    }

    input[type="range"]::-webkit-slider-runnable-track,
    input[type="range"]::-moz-range-track {
        background-color: var(--accent-light);
        height: 8px;
        border-radius: 7px;
        border: 3px solid var(--accent-light);
    }

    input[type="range"]::-webkit-slider-thumb,
    input[type="range"]::-moz-range-thumb {
        height: 30px;
        width: 15px;
        border: 4px solid var(--accent-light);
        background-color: var(--accent);
        box-shadow:
            0px 0px 5px var(--accent-dark),
            0px 0px 1px var(--accent);
        border-radius: 4px;
    }

    #settings-container {
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 20px;
        justify-content: center;
    }

    .slider-container {
        width: 100%;
    }
    .slider-label {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        gap: 8px;
        font-size: 1.1rem;
        font-weight: 800;
    }
    .slider-label > b {
        margin-top: -2px;
    }

    #close-btn {
        position: absolute;
        top: 1.5rem;
        left: 1.5rem;
    }
</style>
