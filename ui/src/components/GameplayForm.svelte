<script lang="ts">
    import { createEventDispatcher, tick } from "svelte";
    import { Stretch } from "svelte-loading-spinners";
    import type { Artist, Track } from "../../../shared/types";
    import TrackOptionCard from "./TrackOptionCard.svelte";
    import GameAPI from "../../api/api";
    import ArtistOptionCard from "./ArtistOptionCard.svelte";
    const dispatch = createEventDispatcher();

    const SEARCH_DELAY = 400;

    export let trackQuery: string;
    export let guessTrackId: string = "";
    export let artistId: string = "";
    export let disabled: boolean;
    export let guessString: string = "";


    let artistQuery: string = "";

    const accent = getComputedStyle(document.documentElement).getPropertyValue(
        "--accent",
    );

    let trackOptions: Track[] | null = null;
    let artistOptions: Artist[] | null = null;
    let selectedOptionIndex: number = -1;
    let searchTimeout: NodeJS.Timeout;
    let trackGuessDisplay: HTMLInputElement;
    let trackGuessInput: HTMLInputElement;
    let artistInput: HTMLInputElement;

    //Maintain string representation of the selected track
    $: guessName = trackOptions?.[selectedOptionIndex]?.name
    $: guessArtists = trackOptions?.[selectedOptionIndex]?.artists?.map((artist) => artist.name).join(", ")
    $: guessString = guessTrackId?.length > 0 && guessName && guessArtists ? `${guessName} - ${guessArtists}` : "(No Answer)";

    //Reset options
    $: if (trackQuery.length < 3) {
        trackOptions = null;
        selectedOptionIndex = -1;
    }
    $: if (artistQuery.length < 3) {
        artistOptions = null;
        selectedOptionIndex = -1;
    }

    //Scroll to inputs when options are shown
    $: if (trackOptions !== null && guessTrackId.length <= 0) {
        snapTo(trackGuessInput);
    }
    $: if (artistOptions !== null && artistId.length <= 0) {
        snapTo(artistInput);
    }

    async function onTrackInput() {
        clearTimeout(searchTimeout);
        if (trackQuery.length > 3) {
            searchTimeout = setTimeout(async () => {
                trackOptions = await GameAPI.findGuessOptions(trackQuery, 0, 5);
            }, SEARCH_DELAY);
        }
        artistQuery = "";
    }

    async function onArtistInput() {
        clearTimeout(searchTimeout);
        if (artistQuery.length > 3) {
            searchTimeout = setTimeout(async () => {
                artistOptions = (await GameAPI.findArtists(artistQuery, 0, 5))
                    .results;
            }, SEARCH_DELAY);
        }
        trackQuery = "";
    }

    async function onInputKeydown(
        event: KeyboardEvent,
        options: Track[] | Artist[] | null,
    ): Promise<string | undefined> {
        if (options?.length ?? 0 > 0) {
            if (event.key === "ArrowUp") {
                event.preventDefault(); // Prevent the default behavior of the up arrow key

                //Loop selected track index backwards
                let optionsLength = options?.length ?? -1;
                selectedOptionIndex =
                    optionsLength > 0
                        ? (selectedOptionIndex - 1 + optionsLength) %
                          optionsLength
                        : -1;
            } else if (event.key === "ArrowDown") {
                event.preventDefault();

                //Loop selected track index forwards
                selectedOptionIndex =
                    (selectedOptionIndex + 1) % (options?.length ?? 0);
            } else if (event.key === "Enter") {
                if ((options?.length ?? 0 > 0) && selectedOptionIndex >= 0) {
                    event.preventDefault();

                    //Return the selected option
                    return options![selectedOptionIndex].id;
                }
            }
        }
    }

    async function onTrackInputKeydown(event: KeyboardEvent) {
        let selectedTrackId = await onInputKeydown(event, trackOptions);
        if (selectedTrackId) {
            guessTrackId = selectedTrackId;
        }
    }

    async function onArtistInputKeydown(event: KeyboardEvent) {
        let selectedArtistId = await onInputKeydown(event, artistOptions);
        if (selectedArtistId) {
            artistId = selectedArtistId;
        }
    }

    /**
     * Sets the track options to the top tracks for the selected artist
     */
    async function doArtistSearch() {
        trackOptions = (await GameAPI.getArtistTopTracks(artistId)).splice(5);
    }

    /**
     * Callback to be fired when text in guess display is changed.
     * Resets track ID and makes the display text into the new query.
     */
    async function changeGuess() {
        trackQuery = trackGuessDisplay.value;
        guessTrackId = "";
        await tick();
        trackGuessInput.focus();
    }

    async function snapTo(element: HTMLElement) {
        await tick();
        element.scrollIntoView({ behavior: "smooth", block: "end" });
    }
</script>

<form on:submit>
    <!-- Track search -->
    <div class="input-container">
        <label for="track-input" class="body-text"> Search by Title </label>
        <!-- {#if guessTrackId.length > 0}
            <input
                bind:this={trackGuessDisplay}
                id="track-input"
                class="header-text"
                type="text"
                autocomplete="off"
                value={`${trackOptions?.[selectedTrackIndex].name} - ${trackOptions?.[selectedTrackIndex].artists.map((artist) => artist.name).join(", ")}`}
                {disabled}
                on:input={changeGuess}
            />
        {:else} -->
        <input
            bind:this={trackGuessInput}
            id="track-input"
            class="header-text"
            type="text"
            placeholder="Enter song guess here"
            autocomplete="off"
            bind:value={trackQuery}
            {disabled}
            on:input={onTrackInput}
            on:keydown={onTrackInputKeydown}
        />
        <!-- {/if} -->

        {#if guessTrackId.length <= 0}
            <!-- Track guess options-->
            {#if trackOptions !== null && trackOptions.length > 0}
                <div
                    class="suggestions-container"
                    style="--height: {trackOptions.length * 4}rem"
                >
                    {#each trackOptions as track, index (track.id)}
                        <TrackOptionCard
                            --height="4rem"
                            {track}
                            highlighted={selectedOptionIndex == index}
                            on:click={() => {
                                guessTrackId = track.id;
                                dispatch("submit");
                            }}
                            on:mouseover={() => (selectedOptionIndex = index)}
                        />
                    {/each}
                </div>
            {:else if trackOptions !== null && (trackOptions?.length ?? 0) <= 0}
                <div class="suggestions-loading">No results found.</div>
            {:else if trackQuery.length > 3}
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

    <!-- Artist search -->
    <div class="input-container">
        <label for="track-input" class="body-text"> Search by Artist </label>
        <input
            bind:this={artistInput}
            id="artist-input"
            class="header-text"
            type="text"
            placeholder="Search an artist's top tracks"
            autocomplete="off"
            bind:value={artistQuery}
            {disabled}
            on:input={onArtistInput}
            on:keydown={onArtistInputKeydown}
        />
        {#if artistId.length <= 0}
            <!-- Artist guess options -->
            {#if artistOptions !== null && artistOptions.length > 0}
                <div
                    class="suggestions-container"
                    style="--height: {artistOptions.length * 3}rem"
                >
                    {#each artistOptions as artist, index (artist.id)}
                        <ArtistOptionCard
                            --height="3rem"
                            {artist}
                            highlighted={selectedOptionIndex == index}
                            on:click={() => {
                                artistId = artist.id;
                                doArtistSearch();
                            }}
                            on:mouseover={() => (selectedOptionIndex = index)}
                        />
                    {/each}
                </div>
            {:else if artistOptions !== null && (artistOptions?.length ?? 0) <= 0}
                <div class="suggestions-loading">No results found.</div>
            {:else if artistQuery.length > 3}
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
            Skip Round
        </button>
        <!-- <button
            type="button"
            id="submit-btn"
            class="submission-btn"
            disabled={disabled || guessTrackId.length <= 0}
        >
            Submit
        </button> -->
    </div>
</form>

<style>
    form {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: max-content;
        gap: 1.2rem;
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
        /*width: 7rem;*/
    }

    input {
        font-size: 1.1rem;
        font-weight: 700;
        border-radius: 1px;
        padding-inline: 10px;
        border: 1px solid var(--primary-dark);
        height: 2.5rem;
        overflow-x: auto;
        background-color: var(--primary-light);
    }

    .suggestions-container {
        height: var(--height);
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
