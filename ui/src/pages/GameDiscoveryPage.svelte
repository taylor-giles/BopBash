<script lang="ts">
    import type { GameState } from "../../../shared/types";
    import GameAPI from "../../api/api";
    import { joinGame } from "../../api/player-api";
    import { CurrentPage, Page } from "../../pageStore";
    import GameCard from "../components/GameCard.svelte";

    //"Refreshing" indicator is shown iff this is true
    let isRefreshing = false;

    //Initialize games list by performing a refresh
    let games: GameState[];
    refresh();

    /**
     * Query API for updated list of games
     */
    async function refresh() {
        isRefreshing = true;
        //TODO: Maybe add some artificial wait time in here to make it feel better
        games = await GameAPI.getGames();
        isRefreshing = false;
    }

    /**
     * Return to home page
     */
    function handleBackClick() {
        CurrentPage.set(Page.HOME);
    }
</script>

<main>
    <div id="button-container">
        <button class="header-btn" on:click={handleBackClick}>&lt Back</button>
        <button class="header-btn" on:click={refresh}>Refresh</button>
    </div>

    <div id="content">
        {#if isRefreshing}
            <!-- TODO: Replace with loading animation -->
            Refreshing...
        {:else if games.length}
            <div id="games-container">
                {#each games as game}
                    <div class="card-wrapper">
                        <GameCard {game} on:click={() => joinGame(game.id)} />
                    </div>
                {/each}
            </div>
        {:else}
            No games available. Make a new one!
        {/if}
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        height: 100%;
        width: 100%;
        gap: 20px;
    }

    #content {
        width: 100%;
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow-y: auto;
    }

    #games-container {
        width: max-content;
        max-width: 100%;
        height: min-content;
        max-height: 100%;
        flex-shrink: 1;
        display: flex;
        flex-wrap: wrap;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        gap: 20px;
    }

    #button-container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
    }

    .card-wrapper {
        flex: 1;
        max-width: 600px;
        min-width: 21.5rem;
        height: 19rem;
    }

    .header-btn {
        background-color: transparent;
        border: none;
        color: white;
        padding: 0px;
        outline: none;
    }
    .header-btn:hover {
        background-color: transparent;
        color: var(--spotify-green);
        border: 0px;
    }
</style>
