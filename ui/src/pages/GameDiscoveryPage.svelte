<script lang="ts">
    import RefreshIcon from "svelte-material-icons/Refresh.svelte";
    import BackIcon from "svelte-material-icons/ArrowLeft.svelte";
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
        <button class="header-btn text-button" on:click={handleBackClick}>
            <BackIcon /> Back
        </button>
        <button class="header-btn text-button" on:click={refresh}>
            <RefreshIcon /> Refresh
        </button>
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
        padding-top: 1rem;
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
        min-width: 20rem;
        height: 19rem;
    }

    .header-btn {
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
    }
    .header-btn:hover {
        color: var(--spotify-green);
    }
</style>
