<script lang="ts">
    import { tick } from "svelte";
    import {
        GameType,
        GameTypes,
        type PlaylistMetadata,
    } from "../../../shared/types";
    import GameAPI from "../../api/api";
    import PlaylistCard from "../components/PlaylistCard.svelte";

    const SEARCH_LIMIT = 10;
    let searchQuery = "";
    let results: PlaylistMetadata[] = [];
    let expandAll = false;
    let nextOffset = 0;
    let isLoading = false;
    let selectedGameType = GameTypes[GameType.NORMAL];

    $: canSearch = !isLoading && nextOffset >= 0;

    /**
     * Obtains the next "page" of search results
     */
    async function doNextSearch() {
        //Do not allow for whitespace search queries
        if (searchQuery.replace(/\s/g, "").length <= 0) {
            nextOffset = -1;
            return;
        }

        //Do the search if not loading and not at end of results
        if (canSearch) {
            isLoading = true;

            //Make search request
            let searchOutput = await GameAPI.findPlaylists(
                encodeURIComponent(searchQuery),
                nextOffset,
                SEARCH_LIMIT,
            );

            //Store results
            nextOffset = searchOutput.nextOffset;
            results = [...results, ...searchOutput.results];
            isLoading = false;
        }
    }

    /**
     * Submits a new search query
     */
    async function handleSubmit(e: Event) {
        e.preventDefault();

        //Reset search variables
        results = [];
        nextOffset = 0;

        //Make search request
        await tick(); //Make sure canSearch is updated before performing search
        doNextSearch();
    }
</script>

<main>
    <div id="sections-container">
        <div id="playlist-search-section" class="section">
            <div class="section-header header-text">Find a Playlist</div>
            <div id="playlist-search-container">
                <form on:submit={handleSubmit}>
                    <input type="text" id="playlist-search-input" bind:value={searchQuery} />
                </form>
            </div>
        </div>
        <div class="section">
            <div class="section-header header-text">Pick a Game Type</div>
            <div id="game-type-container">
                {#each Object.values(GameTypes) as type}
                    <button
                        class="game-type-btn"
                        class:selected={selectedGameType === type}
                        on:click={() => (selectedGameType = type)}
                    >
                        {type.name}
                    </button>
                {/each}
            </div>
            <div id="game-type-description">
                {selectedGameType.description}
            </div>
        </div>
    </div>

    <div id="divider-borders">
        <div style="border-left: 2px solid gray; height: 15px; flex: 1;" />
        <div
            style="border-radius: 0px 0px 0px 10px; border: 2px solid gray; border-top: none; border-right: none; flex: 1; position: relative; height: 15px; margin-left: -19px;"
        />
    </div>

    <!-- {#if results.length > 0}
        <button
            on:click={() => {
                expandAll = !expandAll;
            }}
        >
            {#if expandAll}
                Collapse All
            {:else}
                Expand All
            {/if}
        </button>
    {/if} -->

    <div id="results-container">
        {#each results as playlist (playlist.id)}
            <PlaylistCard {playlist} expanded={expandAll} />
        {/each}

        <!-- Search content loading information -->
        {#if nextOffset < 0}
            <div id="end-display">
                No
                {#if results.length > 0}
                    more
                {/if}
                results to show!
            </div>
        {:else if isLoading}
            <div id="loading">Loading...</div>
        {:else if results.length > 0}
            <button
                id="load-more-btn"
                class="text-button"
                on:click={doNextSearch}
                disabled={!canSearch}
            >
                Load More Results
            </button>
        {/if}
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    #playlist-search-container {
        display: flex;
        flex-direction: row;
    }

    #playlist-search-input {
        font-size: 1.1rem;
        font-weight: 700;
        border-radius: 1px;
        padding-inline: 10px;
        border: 1px solid var(--primary-light);
        height: 2.5rem;
        overflow-x: auto;
        background-color: var(--primary-light);
    }

    #results-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
        overflow-y: auto;
        align-items: center;
        border: 2px solid gray;
        border-radius: 0px 0px 12px 12px;
        border-top: none;
        flex: 1;
        padding: 15px;
    }

    #game-type-container {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        flex-wrap: wrap;
        gap: 1rem;
    }

    #sections-container {
        width: 100%;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap-reverse;
        gap: 15px;
    }

    #divider-borders {
        display: flex;
        flex-direction: row;
    }

    .section {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 15px;
        border: 2px solid gray;
        border-radius: 12px;
        padding: 1rem;
        min-width: 320px;
    }

    .section-header {
        font-size: 1.5rem;
    }

    #playlist-search-section {
        border-bottom: none;
        border-radius: 12px 12px 0px 0px;
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
    #game-type-description {
        width: 100%;
        text-align: center;
    }

    #load-more-btn {
        width: max-content;
        color: var(--primary-light);
        margin: 0.5rem;
    }
    #load-more-btn:hover {
        color: var(--spotify-green);
    }
</style>
