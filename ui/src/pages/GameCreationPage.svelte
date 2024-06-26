<script lang="ts">
    import { onMount, tick } from "svelte";
    import SearchIcon from "svelte-material-icons/Magnify.svelte";
    import BackIcon from "svelte-material-icons/ArrowLeft.svelte";
    import WebSearchIcon from "svelte-material-icons/SearchWeb.svelte";
    import ExpandIcon from "svelte-material-icons/ChevronDown.svelte";
    import CollapseIcon from "svelte-material-icons/ChevronUp.svelte";
    import collapse from "svelte-collapse";
    import {
        GameType,
        GameVisibility,
        type GameOptionMetadata,
        type GameOptions,
        type PlaylistMetadata,
        ADVANCED_OPTIONS_DEFINITIONS,
        GAME_TYPE_OPTIONS,
        GAME_VISIBILITY_OPTIONS,
    } from "../../../shared/types";
    import GameAPI from "../../api/api";
    import PlaylistCard from "../components/cards/PlaylistCard.svelte";
    import { CurrentPage, ErrorMessage, Page } from "../../stores/pageStore";
    import ConfirmationModal from "../components/modals/ConfirmationModal.svelte";
    import { GAME_TYPES, GAME_VISIBILITIES } from "../game-types";
    import LoadingModal from "../components/modals/LoadingModal.svelte";
    import { BG_AUDIO } from "../../stores/audio";
    import SpotifyEmbed from "../components/SpotifyEmbed.svelte";

    //Play background music
    $BG_AUDIO.play();

    const SEARCH_LIMIT = 10;
    const DEFAULT_SEARCH = "Top 50 Spotify";

    //A typed iterator representation of the advanced options definitions
    const ADVANCED_OPTIONS_ENTRIES: [keyof GameOptions, GameOptionMetadata][] =
        Object.entries(ADVANCED_OPTIONS_DEFINITIONS).map(([key, value]) => [
            key as keyof GameOptions,
            value,
        ]);

    let searchQuery = "";
    let linkQuery = "";
    let lastQuery = "";
    let results: PlaylistMetadata[] = [];
    let gameOptionsExpanded = false;
    let showAdvancedOptions = false;
    let expandAll = false;
    let nextOffset = 0;
    let isLoadingSearchResults = false;
    let isLoading = false;

    let selectedGameType: GameType = GameType.SEARCH;
    let selectedVisibility: GameVisibility = GameVisibility.PUBLIC;
    let selectedPlaylistId: string;

    //Get color from CSS
    const spotifyGreen = getComputedStyle(
        document.documentElement,
    ).getPropertyValue("--accent-light");

    //Flag to indicate if current search can be performed
    $: canSearch = !isLoadingSearchResults && nextOffset >= 0;

    //Flag to indicate if the game can be created
    $: isComplete =
        selectedPlaylistId !== undefined &&
        selectedGameType !== undefined &&
        selectedVisibility !== undefined;

    let showCancelModal = false;

    //Initialize advanced options values
    let advancedOptions: GameOptions = {};
    for (let [key, value] of ADVANCED_OPTIONS_ENTRIES) {
        advancedOptions[key as keyof GameOptions] = value.default;
    }

    /**
     * Obtains the next "page" of search results
     */
    async function doNextSearch(query: string) {
        //Do not allow for whitespace-only search queries
        if (query.replace(/\s/g, "").length <= 0) {
            lastQuery = " ";
            nextOffset = -1;
            return;
        }

        //Do the search if not loading and not at end of results
        if (canSearch) {
            isLoadingSearchResults = true;

            //Make search request
            let searchOutput = await GameAPI.findPlaylists(
                encodeURIComponent(query),
                nextOffset,
                SEARCH_LIMIT,
            );

            //Store results
            nextOffset = searchOutput.nextOffset;
            results = Array.from(
                new Set([...results, ...searchOutput.results]),
            );
            isLoadingSearchResults = false;
        }
    }

    /**
     * Submits a new search query
     */
    async function handleSearch(e: Event) {
        e.preventDefault();

        //Reset search variables
        results = [];
        nextOffset = 0;

        //Make search request
        await tick(); //Make sure canSearch is updated before performing search
        lastQuery = searchQuery;
        doNextSearch(lastQuery);
    }

    /**
     * Search for playlist from provided link
     */
    async function handleLinkSearch(e: Event) {
        e.preventDefault();
        lastQuery = " ";
        results = [];
        nextOffset = 0;
        isLoadingSearchResults = true;
        await tick();

        //Extract playlist ID
        try {
            let playlistId = new URL(linkQuery).pathname?.split("/")?.[2];
            handleSelect((await GameAPI.getPlaylistData(playlistId)).id);
        } catch (e) {
            ErrorMessage.set("Please provide a valid Spotify playlist URL.");
        }

        isLoadingSearchResults = false;
    }

    /**
     * Select the playlist with the given ID
     */
    async function handleSelect(playlistId: string) {
        selectedPlaylistId = playlistId;
    }

    /**
     * Perform input checks and create the game
     */
    async function handleFinish() {
        isLoading = true;

        //Fall back to default values when chosen values are out of bounds for advanced options
        for (let [key, option] of ADVANCED_OPTIONS_ENTRIES) {
            let value = advancedOptions[key as keyof GameOptions];
            if (
                value !== undefined &&
                option.min !== undefined &&
                option.max !== undefined
            ) {
                if (value > option.max || value < option.min) {
                    advancedOptions[key as keyof GameOptions] = option.default;
                }
            }
        }

        //Verify that a valid playlist has been selected
        if (
            !selectedPlaylistId ||
            !(await GameAPI.getPlaylistData(selectedPlaylistId))
        ) {
            ErrorMessage.set("Please select a valid playlist");
            return;
        }

        //Create the game
        let gameId = await GameAPI.createGame(
            selectedPlaylistId,
            selectedGameType,
            selectedVisibility,
            advancedOptions,
        );
        isLoading = false;

        //Join the game
        if (gameId) {
            GameAPI.joinGame(gameId);
        }
    }

    async function setAdvancedOption(
        optionName: keyof GameOptions,
        newValue: number,
    ) {
        advancedOptions[optionName] = newValue;
    }

    onMount(() => {
        doNextSearch(DEFAULT_SEARCH);
    });
</script>

<main>
    <div id="header">
        <button
            class="header-btn text-button"
            on:click={() => (showCancelModal = true)}
        >
            <BackIcon /> Back
        </button>
    </div>

    <div id="game-options-container" class="section">
        <button
            id="game-options-header"
            class="text-button"
            on:click={() => (gameOptionsExpanded = !gameOptionsExpanded)}
        >
            <div
                style="padding-top: 1.5px; display: flex; align-items: center; gap: 0.5rem;"
            >
                <div class="section-header header-text">Game Options</div>
                <div class="game-option-icons-container">
                    <svelte:component
                        this={GAME_TYPES[selectedGameType].icon}
                    />
                    <svelte:component
                        this={GAME_VISIBILITIES[selectedVisibility].icon}
                    />
                </div>
            </div>

            <div id="expand-icon">
                {#if gameOptionsExpanded}
                    <CollapseIcon height="100%" width="100%" />
                {:else}
                    <ExpandIcon height="100%" width="100%" />
                {/if}
            </div>
        </button>

        <div
            id="game-options-section"
            use:collapse={{
                open: gameOptionsExpanded,
                duration: 0.3,
                easing: "ease",
            }}
        >
            <div class="options-sections-container">
                <div class="options-section">
                    <div class="section-header header-text">
                        Pick a Game Type
                    </div>
                    <div class="options-container">
                        {#each GAME_TYPE_OPTIONS as type}
                            <button
                                class="selection-btn"
                                class:selected={selectedGameType === type}
                                on:click={() => (selectedGameType = type)}
                            >
                                {GAME_TYPES[type].name}
                            </button>
                        {/each}
                    </div>
                    <div class="option-description-display">
                        {GAME_TYPES[selectedGameType].description}
                    </div>
                </div>
                <div class="options-section">
                    <div class="section-header header-text">Who's Playing?</div>
                    <div class="options-container">
                        {#each GAME_VISIBILITY_OPTIONS as visibilityOption}
                            <button
                                class="selection-btn"
                                class:selected={selectedVisibility ===
                                    visibilityOption}
                                on:click={() =>
                                    (selectedVisibility = visibilityOption)}
                            >
                                {GAME_VISIBILITIES[visibilityOption].name}
                            </button>
                        {/each}
                    </div>
                    <div class="option-description-display">
                        {GAME_VISIBILITIES[selectedVisibility].description}
                    </div>
                </div>
            </div>

            <!-- Advanced options -->
            <div
                use:collapse={{
                    open: showAdvancedOptions,
                    duration: 0.3,
                    easing: "ease",
                }}
                style="width: 100%;"
            >
                <div class="section-header header-text">Advanced Options</div>
                <div class="options-sections-container advanced">
                    {#each ADVANCED_OPTIONS_ENTRIES as [key, option] (key)}
                        {#if option.gameTypes.includes(selectedGameType)}
                            <div class="options-section advanced">
                                <div class="section-header header-text">
                                    {option.name}
                                </div>
                                <input
                                    class="{option.type}-option"
                                    type={option.type}
                                    name={key}
                                    min={option.min}
                                    max={option.max}
                                    value={advancedOptions[key]}
                                    on:change={(e) => {
                                        setAdvancedOption(
                                            key,
                                            parseInt(e.currentTarget.value),
                                        );
                                    }}
                                />
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>

            <button
                id="advanced-options-btn"
                class="selection-btn"
                on:click={() => (showAdvancedOptions = !showAdvancedOptions)}
            >
                {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
            </button>
        </div>
    </div>

    <div id="playlist-search-section" class="section">
        {#if selectedPlaylistId}
            <!-- Embedded playlist preview -->
            <div class="section-header header-text">Game Playlist</div>
            <div class="section-description">
                Each round, a random song will be selected from this playlist.
            </div>
            <div id="embed-container">
                <SpotifyEmbed
                    uri={`spotify:playlist:${selectedPlaylistId}`}
                    title="Spotify-provided embedded playlist"
                />
            </div>
            <div
                style="margin-top: -5px; display:flex; justify-content: center;"
            >
                <button
                    class="selection-btn"
                    on:click={() => (selectedPlaylistId = "")}
                >
                    Select a Different Playlist
                </button>
            </div>
        {:else}
            <!-- Playlist search content -->
            <div class="section-header header-text">Find a Playlist</div>
            <div class="section-description">
                Every game needs music! Each round, a random song will be
                selected from the Spotify playlist that you select. <br /> You can
                choose any public playlist on Spotify, including genre and artist
                mixes.
            </div>
            <div id="playlist-search-container">
                <!-- Search by query -->
                <form on:submit={handleSearch}>
                    <input
                        type="text"
                        id="playlist-search-input"
                        bind:value={searchQuery}
                        placeholder="Search for playlists"
                    />
                    <button type="submit" class="search-btn text-button">
                        <SearchIcon height="100%" />
                    </button>
                </form>

                <!-- Search by link -->
                <form on:submit={handleLinkSearch}>
                    <input
                        type="text"
                        id="playlist-search-input"
                        bind:value={linkQuery}
                        placeholder="Find playlist by Spotify link"
                    />
                    <button type="submit" class="search-btn text-button">
                        <WebSearchIcon height="100%" />
                    </button>
                </form>
            </div>
            <div id="results-container">
                <!-- Show a PlaylistCard for each playlist in the search results list -->
                {#each results as playlist (playlist.id)}
                    <PlaylistCard
                        {playlist}
                        expanded={expandAll}
                        on:select={() => handleSelect(playlist.id)}
                    />
                {/each}

                <!-- Search content loading information -->
                {#if lastQuery}
                    {#if nextOffset < 0}
                        <div id="end-display">
                            No
                            {#if results.length > 0}
                                more
                            {/if}
                            results. Try another search!
                        </div>
                    {:else if isLoadingSearchResults}
                        <div id="loading">Loading...</div>
                    {:else if results.length > 0}
                        <button
                            id="load-more-btn"
                            class="text-button"
                            on:click={() => {
                                doNextSearch(lastQuery);
                            }}
                            disabled={!canSearch}
                        >
                            Load More Results
                        </button>
                    {/if}
                {/if}
            </div>
        {/if}
    </div>
    <div id="footer">
        <button
            class="footer-btn selection-btn"
            on:click={() => (showCancelModal = true)}
        >
            Cancel
        </button>
        <button
            class="footer-btn"
            on:click={handleFinish}
            disabled={!isComplete || isLoading || isLoadingSearchResults}
        >
            Finish
        </button>
    </div>
</main>

{#if showCancelModal}
    <ConfirmationModal
        headerText="CANCEL"
        bodyText="Are you sure you want to abandon this new game?"
        on:yes={() => CurrentPage.set(Page.HOME)}
        on:no={() => (showCancelModal = false)}
    />
{/if}

{#if isLoading}
    <LoadingModal message="Creating game" color={spotifyGreen} />
{/if}

<style>
    main {
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 100%;
        gap: 1rem;
    }
    #header {
        display: flex;
        flex-direction: row;
        width: 100%;
    }

    .header-btn {
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
        padding: 10px;
    }

    #game-options-header {
        font-weight: inherit;
        font-family: inherit;
        text-transform: inherit;
        color: inherit;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        flex: 1;
        gap: 15px;
        width: 100%;
    }

    #game-options-container {
        gap: 0px;
        background-color: var(--accent-dark);
    }

    .game-option-icons-container {
        color: var(--accent-light);
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 5px;
    }

    #playlist-search-container {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 20px;
        flex-wrap: wrap;
    }

    form {
        border-radius: 5px;
        padding-inline: 10px;
        border: 1px solid var(--accent-light);
        background-color: transparent;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        flex: 1;
        flex-basis: 0px;
        transition: flex-basis 0.4s ease-out;
    }
    form:focus-within {
        border: 1px solid var(--spotify-green);
        flex-basis: 20%;
    }

    input {
        flex: 1;
        overflow-x: auto;
        font-size: 1rem;
        font-weight: 500;
        height: 2.5rem;
        background-color: transparent;
        color: var(--primary-light);
        outline: none;
        border: none;
    }
    input:invalid {
        border-color: var(--red);
    }

    .search-btn {
        color: var(--spotify-green);
        height: 100%;
    }
    .search-btn:hover {
        color: var(--spotify-green);
    }

    #results-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
        overflow-y: auto;
        align-items: center;
        flex: 1;
        padding-top: 15px;
    }

    #embed-container {
        flex: 1;
        display: grid; /* ??? (embed doesnt size right without it) ??? */
        place-items: center;
        padding: 1rem;
        padding-inline: 0px;
    }

    .options-container {
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .option-description-display {
        width: 100%;
        text-align: center;
    }

    .options-sections-container {
        width: 100%;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 2px;
        background-color: gray;
    }
    .options-sections-container.advanced {
        border: 2px solid gray;
        border-radius: 6px;
        gap: 2px;
    }

    #game-options-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
    }

    .section,
    .options-section {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: stretch;
        gap: 15px;
        border: 2px solid gray;
        border-radius: 12px;
        padding: 1rem;
    }
    .options-section {
        flex: 1;
        border: none;
        align-items: center;
        border-radius: 0px;
        background-color: var(--accent-dark);
    }
    .options-section.advanced {
        margin-top: 0px;
        border-radius: 6px;
    }

    .number-option {
        border: 1px solid var(--spotify-green);
        text-align: center;
        width: max-content;
        border-radius: 4px;
        padding: 5px;
        width: 8rem;
    }

    .section-header {
        font-size: 1.4rem;
        width: max-content;
    }

    .section-description {
        text-align: justify;
    }

    #playlist-search-section {
        min-width: 100%;
        flex: 1;
        gap: 0.75rem;
    }

    .selection-btn {
        width: max-content;
        color: var(--primary-light);
        background-color: transparent;
        border: 2px solid var(--primary-light);
        border-radius: 8px;
        font-size: 1rem;
    }
    .selection-btn:hover,
    .selection-btn.selected {
        color: var(--spotify-green);
        background-color: transparent;
        border: 2px solid var(--spotify-green);
        outline: none;
    }

    #load-more-btn {
        width: max-content;
        color: var(--primary-light);
        margin: 0.5rem;
    }
    #load-more-btn:hover {
        color: var(--spotify-green);
    }

    #advanced-options-btn {
        font-size: 0.8rem;
        border-width: 1px;
    }

    #expand-icon {
        height: 1.8rem;
        width: 1.8rem;
    }

    #footer {
        padding-inline: 1rem;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        gap: 1rem;
        border-radius: 20px 20px 0px 0px;
        width: 100%;
        background-color: var(--accent-dark) AA;
        opacity: 0.8;
    }
    .footer-btn {
        width: 9rem;
        opacity: 1;
    }
</style>
