<script lang="ts">
    import { createEventDispatcher, tick } from "svelte";
    import { Stretch } from "svelte-loading-spinners";
    import type { Artist, Track } from "../../../../shared/types";
    import TrackOptionCard from "../cards/TrackOptionCard.svelte";
    import GameAPI from "../../../api/api";
    import ArtistOptionCard from "../cards/ArtistOptionCard.svelte";
    const dispatch = createEventDispatcher();

    const SEARCH_DELAY = 400;

    export let trackQuery: string = "";
    export let guessTrackId: string = "";
    export let artistId: string = "";
    export let disabled: boolean;
    export let guessString: string = "";

    let artistQuery: string = "";
    let artistName: string = "";

    const accent = getComputedStyle(document.documentElement).getPropertyValue(
        "--accent",
    );

    let trackOptions: Track[] | null = null;
    let artistOptions: Artist[] | null = null;
    let showingArtistSongs: boolean = false;
    let selectedOptionIndex: number = -1;
    let searchTimeout: NodeJS.Timeout;
    let trackGuessInput: HTMLInputElement;
    let artistInput: HTMLInputElement;

    //Maintain string representation of the selected track
    $: guessName = trackOptions?.[selectedOptionIndex]?.name;
    $: guessArtists = trackOptions?.[selectedOptionIndex]?.artists
        ?.map((artist) => artist.name)
        .join(", ");
    $: guessString =
        guessTrackId?.length > 0 && guessName && guessArtists
            ? `${guessName} - ${guessArtists}`
            : "(No Answer)";

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

    /**
     * Callback which fires when the track input field receives input
     */
    async function onTrackInput() {
        clearTimeout(searchTimeout);
        if (trackQuery.length > 0 && trackQuery.length % 8 == 0) {
            trackOptions = await GameAPI.findGuessOptions(trackQuery, 0, 5);
        } else if (trackQuery.length > 3) {
            searchTimeout = setTimeout(async () => {
                trackOptions = await GameAPI.findGuessOptions(trackQuery, 0, 5);
            }, SEARCH_DELAY);
        }
        artistQuery = "";
    }

    /**
     * Callback which fires when the artist input field receives input
     */
    async function onArtistInput() {
        clearTimeout(searchTimeout);
        if (artistQuery.length > 0 && artistQuery.length % 10 == 0) {
            artistOptions = (await GameAPI.findArtists(artistQuery, 0, 5))
                .results;
        } else if (artistQuery.length > 3) {
            searchTimeout = setTimeout(async () => {
                artistOptions = (await GameAPI.findArtists(artistQuery, 0, 5))
                    .results;
            }, SEARCH_DELAY);
        }
        trackQuery = "";
    }

    /**
     * Helper function for analyzing keyboard input for search fields
     * @param event The keyboard event that caused the callback to be fired
     * @param numOptions The number of options to search through
     */
    async function onInputKeydown(
        event: KeyboardEvent,
        numOptions: number,
    ): Promise<number | undefined> {
        if (numOptions > 0) {
            if (event.key === "ArrowUp") {
                //Prevent default behavior
                event.preventDefault();

                //Loop selected track index backwards
                let optionsLength = numOptions;
                selectedOptionIndex =
                    optionsLength > 0
                        ? (selectedOptionIndex - 1 + optionsLength) %
                          optionsLength
                        : -1;
            } else if (event.key === "ArrowDown") {
                //Prevent default behavior
                event.preventDefault();

                //Loop selected track index forwards
                selectedOptionIndex = (selectedOptionIndex + 1) % numOptions;
            } else if (event.key === "Enter") {
                if (selectedOptionIndex >= 0) {
                    //Prevent default behavior
                    event.preventDefault();

                    //Return the index of the selected option
                    return selectedOptionIndex;
                }
            }
        }
    }

    async function onTrackInputKeydown(event: KeyboardEvent) {
        //Handle track selection by keyboard
        let selectedTrackIndex = await onInputKeydown(
            event,
            trackOptions?.length ?? 0,
        );
        if (selectedTrackIndex !== undefined) {
            guessTrackId = trackOptions![selectedTrackIndex].id;
            dispatch("submit");
        }
    }

    async function onArtistInputKeydown(event: KeyboardEvent) {
        //Handle artist selection by keyboard
        let selectedArtistIndex = await onInputKeydown(
            event,
            artistOptions?.length ?? 0,
        );
        if (selectedArtistIndex !== undefined) {
            let selectedArtist = artistOptions![selectedArtistIndex];
            artistName = selectedArtist.name;
            artistId = selectedArtist.id;
            doArtistSearch();
        }
    }

    /**
     * Sets the track options to the top tracks for the selected artist
     */
    async function doArtistSearch() {
        trackOptions = (await GameAPI.getArtistTopTracks(artistId)).splice(5);
        trackQuery = `[Top Songs by ${artistName}]`;
        artistQuery = "";
        artistId = "";
        showingArtistSongs = true;
        trackGuessInput.onfocus = () => {
            //If currently showing artist tracks, then reset the query
            if (showingArtistSongs) {
                showingArtistSongs = false;
                trackQuery = "";
                trackGuessInput.onfocus = () => {}
            }
        };
    }

    async function snapTo(element: HTMLElement) {
        await tick();
        element.scrollIntoView({ behavior: "smooth", block: "end" });
    }
</script>

<form on:submit>
    <!-- Track search -->
    <div class="input-container">
        <label for="track-input" class="body-text"> Search Song </label>
        <input
            class:italics={showingArtistSongs}
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

        {#if guessTrackId.length <= 0}
            <!-- Track guess options-->
            {#if trackOptions !== null && trackOptions.length > 0}
                <div
                    class="suggestions-container"
                    style="--height: {trackOptions.length * 3.5}rem"
                >
                    {#each trackOptions as track, index (track.id)}
                        <TrackOptionCard
                            --height="3.5rem"
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
        <label for="track-input" class="body-text"> Search by Artist's Top Tracks </label>
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
                                artistName = artist.name;
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
    input.italics {
        font-style: italic;
        color: rgba(0, 0, 0, 0.8);
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
