<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        SFX_AUDIO,
        BG_AUDIO,
        MUSIC_AUDIO,
        playClickSFX,
        AUDIO_ELEMENTS,
    } from "../../../stores/audio";
    import VolumeIcon from "svelte-material-icons/VolumeHigh.svelte";
    import MusicIcon from "svelte-material-icons/Music.svelte";
    import NoteIcon from "svelte-material-icons/MusicCircle.svelte";
    import CloseIcon from "svelte-material-icons/Close.svelte";
    import Modal from "./Modal.svelte";
    import { CurrentPage, Page } from "../../../stores/pageStore";
    import { get } from "svelte/store";
    const dispatch = createEventDispatcher();

    /**
     * Save all settings in local storage for persistence across reloads
     */
    function storeSettings() {
        //Store all audio volumes in local storage
        for (let audio of AUDIO_ELEMENTS) {
            window.localStorage.setItem(
                get(audio).getAttribute("data-name") ?? "",
                get(audio).volume.toString(),
            );
        }
    }
</script>

<Modal>
    <main>
        <div id="title">SETTINGS</div>
        <div id="settings-container">
            <!-- Background music volume -->
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
                    on:change={storeSettings}
                    bind:value={$BG_AUDIO.volume}
                />
            </div>

            <!-- SFX Volume -->
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
                    on:change={() => {
                        playClickSFX();
                        storeSettings();
                    }}
                    bind:value={$SFX_AUDIO.volume}
                />
            </div>

            <!-- In-Game Music Volume -->
            {#if $CurrentPage === Page.GAME}
                <div class="slider-container">
                    <div class="slider-label header-text">
                        <NoteIcon height="100%" />
                        <b>IN-GAME MUSIC</b>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.025"
                        bind:value={$MUSIC_AUDIO.volume}
                        on:change={storeSettings}
                    />
                </div>
            {/if}
        </div>
        <div id="credits">
            <div id="credits-title">
                CREDITS
            </div>
            <table>
                <tr>
                    <th align="right" class="header-text">
                        Game Development:
                    </th>
                    <td>
                        <a href="https://taylorgiles.me" target="_blank">
                            © Taylor Giles
                        </a>
                    </td>
                </tr>
                <tr>
                    <th align="right" class="header-text">
                        Branding Consultant:
                    </th>
                    <td>
                        <a
                            href="https://josephromanodesign.com"
                            target="_blank"
                        >
                            Joseph Romano
                        </a>
                    </td>
                </tr>
                <tr>
                    <th align="right" class="header-text">
                        Background Music:
                    </th>
                    <td>
                        <a
                            href="https://open.spotify.com/artist/2140rXZh18HpvmCh9xDKil"
                            target="_blank"
                        >
                            Logan White
                        </a>
                    </td>
                </tr>
            </table>
            <table id="special-thanks">
                <tr>
                    <th class="header-text">
                        Special Thanks:
                    </th>
                    <td>
                        Morgan Giles, Niaz An-Noor, Aiden Gauer
                    </td>
                </tr>
            </table>
        </div>

        <button
            id="close-btn"
            class="text-button"
            on:click={() => {
                dispatch("close");
            }}
        >
            <CloseIcon height="1.5rem" width="1.5rem" />
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
        padding: 2rem;
        border: 2px solid gray;
        border-radius: 12px;
        width: 90dvw;
        height: 90dvh;
        max-width: 1000px;
    }

    #title {
        font-size: 1.5rem;
        font-weight: 800;
    }

    input[type="range"] {
        appearance: none;
        background-color: transparent;
        width: 100%;
        background-color: var(--accent-light);
        height: 8px;
        border-radius: 7px;
        border: 3px solid var(--accent-light);
    }

    input[type="range"]:focus {
        outline: none;
    }

    input[type="range"]::-moz-range-thumb {
        height: 30px;
        width: 15px;
        border: 4px solid var(--accent-light);
        background-color: var(--accent);
        box-shadow:
            0px 0px 5px var(--accent-dark),
            0px 0px 1px var(--accent);
        border-radius: 4px;
        cursor: pointer;
    }
    input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        height: 35px;
        width: 22px;
        border: 4px solid var(--accent-light);
        background-color: var(--accent);
        box-shadow:
            0px 0px 5px var(--accent-dark),
            0px 0px 1px var(--accent);
        border-radius: 4px;
        cursor: pointer;
    }

    #settings-container {
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 40px;
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
        margin-bottom: 5px;
    }
    .slider-label > b {
        margin-top: -2px;
    }

    #credits {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-size: calc(max(14px, 0.85rem));
    }

    #credits * > th {
        font-weight: 800;
    }

    #credits * > td > *,
    #credits * > td {
        font-weight: 300;
    }

    #credits-title {
        font-size: 0.9rem;
        font-weight: 700;
    }

    #close-btn {
        position: absolute;
        top: 1.5rem;
        left: 1.5rem;
    }
</style>
