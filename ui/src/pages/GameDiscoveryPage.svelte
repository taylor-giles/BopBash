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
    function handleBackClick(){
        CurrentPage.set(Page.HOME);
    }
</script>

<main>
    <button id="back-btn" on:click={handleBackClick}>&lt Back</button>
    <div id="content">
        {#if !isRefreshing}
            <div id="games-container">
                {#each games as game}
                    <div class="card-wrapper">
                        <GameCard {game} on:click={() => joinGame(game.id)}/>
                    </div>
                {/each}
            </div>
        {:else}
            <!-- TODO: Replace with loading animation -->
            Refreshing...
        {/if}
    </div>
    <button on:click={refresh}>Refresh</button>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        height: 100%;
        width: 100%;
    }

    #content {
        width: 100%;
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
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

    .card-wrapper {
        width: 400px;
        max-width: 100%;
        height: 270px;
    }

    #back-btn {
        background-color: transparent;
        border: none;
        color: white;
        padding: 0px;
    }
</style>
