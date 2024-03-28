<script lang="ts">
    import { createEventDispatcher, tick } from "svelte";
    import { Stretch } from "svelte-loading-spinners";
    import type { Track } from "../../../shared/types";
    import TrackOptionCard from "./TrackOptionCard.svelte";
    import GameAPI from "../../api/api";
    const dispatch = createEventDispatcher();

    const SEARCH_DELAY = 450;

    export let guessQuery: string;
    export let guessTrackId: string = "";
    export let disabled: boolean;

    const accent = getComputedStyle(document.documentElement).getPropertyValue(
        "--accent",
    );

    let trackOptions: Track[] | null = null;
    let selectedTrackIndex: number = -1;
    let searchTimeout: NodeJS.Timeout;
    let trackGuessDisplay: HTMLInputElement;

    $: if (guessQuery.length < 3) {
        trackOptions = null;
    }

    async function onInput() {
        clearTimeout(searchTimeout);
        if (guessQuery.length > 3) {
            searchTimeout = setTimeout(async () => {
                trackOptions = (await GameAPI.findTracks(guessQuery, 0, 5))
                    .results;
            }, SEARCH_DELAY);
        }
    }

    async function onInputKeydown(event: KeyboardEvent) {
        if (trackOptions?.length ?? 0 > 0) {
            if (event.key === "ArrowUp") {
                event.preventDefault(); // Prevent the default behavior of the up arrow key

                //Loop selected track index backwards
                let trackOptionsLength = trackOptions?.length ?? -1;
                selectedTrackIndex =
                    trackOptionsLength > 0
                        ? (selectedTrackIndex - 1 + trackOptionsLength) %
                          trackOptionsLength
                        : -1;
            } else if (event.key === "ArrowDown") {
                event.preventDefault();

                //Loop selected track index forwards
                selectedTrackIndex =
                    (selectedTrackIndex + 1) % (trackOptions?.length ?? 0);
            } else if (event.key === "Enter") {
                if ((trackOptions?.length ?? 0 > 0) && selectedTrackIndex >= 0) {
                    event.preventDefault();

                    //Set the selected track option as the guess
                    guessTrackId = trackOptions![selectedTrackIndex].id;
                    await tick();
                    trackGuessDisplay.focus();
                }
            }
        }
    }
</script>

<form on:submit>
    <div class="input-container">
        <label for="track-input" class="body-text"> Your Guess: </label>
        {#if guessTrackId.length > 0}
            <input
                bind:this={trackGuessDisplay}
                id="track-input"
                class="header-text"
                type="text"
                autocomplete="off"
                value={`${trackOptions?.[selectedTrackIndex].name} - ${trackOptions?.[selectedTrackIndex].artists.map((artist) => artist.name).join(", ")}`}
                {disabled}
            />
        {:else}
            <input
                id="track-input"
                class="header-text"
                type="text"
                placeholder="Enter song guess here"
                autocomplete="off"
                bind:value={guessQuery}
                {disabled}
                on:input={onInput}
                on:keydown={onInputKeydown}
            />
        {/if}
        {#if guessTrackId.length <= 0}
            {#if trackOptions !== null}
                <div class="suggestions-container">
                    {#each trackOptions as track, index (track.id)}
                        <TrackOptionCard
                            {track}
                            highlighted={selectedTrackIndex == index}
                            on:click={() => (guessTrackId = track.id)}
                            on:mouseover={() => (selectedTrackIndex = index)}
                        />
                    {/each}
                </div>
            {:else if guessQuery.length > 3}
                <div class="suggestions-loading">
                    <Stretch
                        color={accent}
                        size={2.9}
                        unit="rem"
                        duration="1s"
                    />
                    Loading...
                </div>
            {/if}
        {/if}
    </div>
    <div id="button-container">
        <button
            type="button"
            id="skip-btn"
            class="submission-btn"
            on:click={() => dispatch("skip")}
            {disabled}
        >
            Skip
        </button>
        <button
            type="submit"
            id="submit-btn"
            class="submission-btn"
            disabled={disabled || guessTrackId.length <= 0}
        >
            Submit
        </button>
    </div>
</form>

<style>
    form {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: max-content;
        gap: 15px;
    }

    #button-container {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 3rem;
    }

    .input-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        position: relative;
    }

    label {
        font-size: 1.1rem;
        height: 1.8rem;
    }

    .submission-btn {
        width: 7rem;
    }

    input {
        font-size: 1.1rem;
        font-weight: 700;
        border-radius: 1px;
        padding-inline: 10px;
        border: 1px solid var(--primary-light);
        height: 2.5rem;
        overflow-x: auto;
        background-color: var(--primary-light);
    }

    .suggestions-container {
        height: 20rem;
        position: absolute;
        bottom: calc(100% - 1.8rem + 3px);
        width: 100%;
        background-color: var(--primary-light);
    }

    .suggestions-loading {
        height: 5rem;
        padding: 10px;
        position: absolute;
        bottom: calc(100% - 1.8rem + 4px);
        width: 100%;
        background-color: var(--primary-light);
        color: var(--accent);
        font-size: 1.3rem;

        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 5px;
    }
</style>
