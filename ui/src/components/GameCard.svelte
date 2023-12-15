<script lang="ts">
    import type { GameState } from "../../../shared/types";

    export let game: GameState;
</script>

<button id="main" on:click>
    <div id="title" class="header-text">
        {game.playlist.name}
    </div>

    <div id="description-container">
        <div id="description-label">Playlist Description:</div>
        {#if game.playlist.description.length > 0}
            <div id="description-content">
                {game.playlist.description}
            </div>
        {:else}
            <em id="description-content">No description available.</em>
        {/if}
    </div>

    <div class="container">
        <div class="property-display body-text">
            Rounds: {game.rounds.length}
        </div>
        <div class="property-display body-text">
            Players: {Object.values(game.players ?? {}).length}
        </div>
    </div>

    <div id="game-id" class="header-text">
        {game.id}
    </div>
</button>

<style>
    #main {
        width: 100%;
        height: 100%;
        background-color: rgba(50, 50, 50, 0.75);
        border-radius: 5px;
        padding: 20px;
        color: white;
        font-size: 1rem;
        font-weight: 300;
        display: flex;
        flex-direction: column;
        gap: 15px;
        box-sizing: border-box;
        font-family: "Nunito Sans", sans-serif;
        text-transform: none;
        text-align: start;
    }

    #title {
        font-size: 1.6rem;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: clip;
    }

    #description-container {
        display: flex;
        flex-direction: column;
        line-height: 1.35;
        font-size: 1rem;
        flex: 1;
    }
    #description-content {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #description-label {
        font-weight: 500;
        display: inline-block;
    }
    .property-display {
        font-size: 1rem;
        font-weight: 400;
    }

    #game-id {
        display: flex;
        flex-direction: row;
        width: max-content;
        gap: 5px;
        font-weight: 400;
        font-size: 0.9rem;
    }
    #game-id::before {
        content: "Game ID:";
        font-weight: 300;
    }

    .container {
        width: 100%;
        font-size: 0.9rem;
        display: flex;
        flex-direction: row;
        gap: 25px;
        align-items: center;
        text-align: center;
    }
</style>
