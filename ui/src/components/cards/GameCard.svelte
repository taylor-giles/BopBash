<script lang="ts">
    import PeopleIcon from "svelte-material-icons/AccountMultiple.svelte";
    import {
        type GameState,
        GameStatus,
    } from "../../../../shared/types";
    import {
        ADVANCED_OPTIONS_DEFINITIONS_WITH_ICONS,
        GAME_TYPES,
    } from "../../game-types";

    export let game: GameState;
</script>

<main>
    <!-- Title -->
    <div id="title" class="header-text">
        {game.status !== GameStatus.PENDING ? "*" : ""}{game.playlist.name}
    </div>

    <!-- Game type and player count -->
    <div id="subtitle-container">
        <div id="game-type-label">
            <svelte:component this={GAME_TYPES[game.type].icon} />
            {GAME_TYPES[game.type].name}
        </div>
        <div class="property-display body-text">
            <PeopleIcon />
            Players: <b>{Object.values(game.players ?? {}).length}</b>
        </div>
    </div>

    <!-- Description -->
    <div id="description-container">
        <div id="description-label">Playlist Description:</div>
        {#if game.playlist.description.length > 0}
            <div id="description-content">
                <!-- Some descriptions have anchor tags - this extracts the content from them -->
                {game.playlist.description.replace(
                    /<a\s*[^>]*>(.*?)<\/a>/g,
                    "$1",
                )}
            </div>
        {:else}
            <em id="description-content">No description available.</em>
        {/if}
    </div>

    <!-- Advanced options displays -->
    <div class="container">
        {#each Object.values(ADVANCED_OPTIONS_DEFINITIONS_WITH_ICONS) as option}
            {#if option.gameTypes.includes(game.type)}
                <div class="property-display body-text">
                    <svelte:component this={option.icon} />
                    <div>
                        <b>{game.options[option.key]}</b>{option.label}
                    </div>
                </div>
            {/if}
        {/each}
    </div>

    <!-- Game ID and Join Game button -->
    <div id="footer">
        <div id="footer-game-info-container">
            {#if game.status !== GameStatus.PENDING}
                <div id="game-status" class="header-text">
                    *GAME IN PROGRESS
                </div>
            {/if}
            <div id="game-id" class="header-text">
                {game.id}
            </div>
        </div>

        <button on:click> Join Game </button>
    </div>
</main>

<style>
    main {
        width: 100%;
        height: 100%;
        background-color: var(--accent-overlay);
        border-radius: 5px;
        padding: 20px;
        color: var(--primary-light);
        font-size: 1rem;
        font-weight: 300;
        display: flex;
        flex-direction: column;
        gap: 15px;
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

    #subtitle-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 20px;
        margin-top: -15px;
    }

    #game-type-label {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        font-weight: 700;
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
        word-break: break-word;
    }
    #description-label {
        font-weight: 500;
        display: inline-block;
    }
    .property-display {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
        font-size: 1rem;
        font-weight: 400;
        margin-inline: 10px;
    }

    #footer {
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-end;
    }

    #game-status {
        font-weight: 800;
        font-size: 0.85rem;
    }

    #game-id {
        display: flex;
        flex-direction: row;
        width: max-content;
        gap: 5px;
        font-weight: 400;
        font-size: 0.8rem;
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
        gap: 10px;
        align-items: center;
        text-align: center;
        justify-content: flex-start;
        flex-wrap: wrap;
    }
</style>
