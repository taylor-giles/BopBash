<script lang="ts">
    import { onMount, tick } from "svelte";
    import SearchIcon from "svelte-material-icons/Magnify.svelte";
    import WebSearchIcon from "svelte-material-icons/SearchWeb.svelte";
    import ExpandIcon from "svelte-material-icons/ChevronDown.svelte";
    import CollapseIcon from "svelte-material-icons/ChevronUp.svelte";
    import collapse from "svelte-collapse";
    import {
        GameType,
        GameTypes,
        GameVisibilities,
        GameVisibility,
        type PlaylistMetadata,
    } from "../../../shared/types";
    import GameAPI from "../../api/api";
    import PlaylistCard from "../components/PlaylistCard.svelte";
    import { ErrorMessage } from "../../stores/pageStore";

    const SEARCH_LIMIT = 10;
    const DEFAULT_SEARCH = "Top 50";

    const GAME_TYPE_OPTIONS = [
        GameType.NORMAL,
        GameType.CHOICES,
        GameType.THEATER,
    ];
    const GAME_VISIBILITY_OPTIONS = [
        GameVisibility.PUBLIC,
        GameVisibility.PRIVATE,
    ];

    let searchQuery = "";
    let linkQuery = "";
    let lastQuery = "";
    let results: PlaylistMetadata[] = [];
    let gameOptionsExpanded = false;
    let expandAll = false;
    let nextOffset = 0;
    let isLoading = false;
    let selectedGameType: GameType = GameType.NORMAL;
    let selectedVisibility: GameVisibility = GameVisibility.PUBLIC;
    let selectedPlaylist: PlaylistMetadata;

    $: canSearch = !isLoading && nextOffset >= 0;
    $: isComplete =
        selectedPlaylist !== undefined &&
        selectedGameType !== undefined &&
        selectedVisibility !== undefined;

    /**
     * Obtains the next "page" of search results
     */
    async function doNextSearch(query: string) {
        //Do not allow for whitespace search queries
        if (query.replace(/\s/g, "").length <= 0) {
            nextOffset = -1;
            return;
        }

        //Do the search if not loading and not at end of results
        if (canSearch) {
            isLoading = true;

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
            isLoading = false;
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

    async function handleLinkSearch(e: Event) {
        e.preventDefault();
        isLoading = true;

        //Extract playlist ID
        try {
            let playlistId = new URL(linkQuery).pathname?.split("/")?.[2];
            selectedPlaylist = await GameAPI.getPlaylistData(playlistId);
        } catch (e) {
            ErrorMessage.set("Please provide a valid Spotify playlist URL.");
        }

        isLoading = false;
    }

    onMount(() => {
        doNextSearch(DEFAULT_SEARCH);
    });
</script>

<main>
    <div id="game-options-container" class="section">
        <button
            id="game-options-header"
            class="text-button"
            on:click={() => (gameOptionsExpanded = !gameOptionsExpanded)}
        >
            <div class="section-header header-text">Game Options</div>
            <div id="expand-icon">
                {#if gameOptionsExpanded}
                    <CollapseIcon height="100%" width="100%" />
                {:else}
                    <ExpandIcon height="100%" width="100%" />
                {/if}
            </div>
        </button>

        <div
            id="sections-container"
            use:collapse={{
                open: gameOptionsExpanded,
                duration: 0.3,
                easing: "ease",
            }}
        >
            <div class="options-section">
                <div class="section-header header-text">Pick a Game Type</div>
                <div class="options-container">
                    {#each GAME_TYPE_OPTIONS as type}
                        <button
                            class="game-type-btn"
                            class:selected={selectedGameType === type}
                            on:click={() => (selectedGameType = type)}
                        >
                            {GameTypes[type].name}
                        </button>
                    {/each}
                </div>
                <div class="option-description-display">
                    {GameTypes[selectedGameType].description}
                </div>
            </div>
            <div class="options-section">
                <div class="section-header header-text">Who's Playing?</div>
                <div class="options-container">
                    {#each GAME_VISIBILITY_OPTIONS as visibilityOption}
                        <button
                            class="game-type-btn"
                            class:selected={selectedVisibility ===
                                visibilityOption}
                            on:click={() =>
                                (selectedVisibility = visibilityOption)}
                        >
                            {GameVisibilities[visibilityOption].name}
                        </button>
                    {/each}
                </div>
                <div class="option-description-display">
                    {GameVisibilities[selectedVisibility].description}
                </div>
            </div>
        </div>
    </div>

    <div id="playlist-search-section" class="section">
        <div class="section-header header-text">Find a Playlist</div>
        <div>
            Every game needs music! Each round, a random song will be selected
            from the Spotify playlist that you select. You can choose any <b>
                public
            </b> playlist on Spotify.
        </div>
        <div id="playlist-search-container">
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
            {#each results as playlist (playlist.id)}
                <PlaylistCard {playlist} expanded={expandAll} />
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
                {:else if isLoading}
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
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 15px;
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
        transition: flex-basis 0.5s ease-out;
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

    #sections-container {
        width: 100%;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 2px;
        background-color: gray;
    }

    .section,
    .options-section {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 15px;
        border: 2px solid gray;
        border-radius: 12px;
        padding: 1rem;
        min-width: 290px;
    }
    .options-section {
        flex: 1;
        border: none;
        align-items: center;
        min-width: 300px;
        border-radius: 0px;
        background-color: var(--accent-dark);
    }

    .section-header {
        font-size: 1.5rem;
        width: max-content;
    }

    #playlist-search-section {
        min-width: 100%;
        flex: 1;
    }

    .game-type-btn {
        color: var(--primary-light);
        background-color: transparent;
        border: 2px solid var(--primary-light);
        border-radius: 8px;
        font-size: 1rem;
    }
    .game-type-btn:hover,
    .game-type-btn.selected {
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

    #expand-icon {
        height: 2rem;
        width: 2rem;
    }

    #v-div {
        background-color: gray;
        width: 2px;
    }
    @media(max-width: 720px) {
        #v-div {
            display: none;
        }
    }
</style>
