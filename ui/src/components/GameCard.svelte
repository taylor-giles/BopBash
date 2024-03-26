<script lang="ts">
    import PeopleIcon from "svelte-material-icons/AccountMultiple.svelte";
    import DurationIcon from "svelte-material-icons/TimerMusic.svelte";
    import RoundsIcon from "svelte-material-icons/Music.svelte";
    import { GameType, type GameState } from "../../../shared/types";
    import { GAME_TYPES } from "../game-types";
    const ChoicesIcon = GAME_TYPES[GameType.CHOICES].icon;

    export let game: GameState;
</script>

<main>
    <div id="title" class="header-text">
        {game.playlist.name}
    </div>

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
            <RoundsIcon />
            <b>{game.options.numRounds}</b> Rounds
        </div>
        <div class="property-display body-text">
            <DurationIcon />
            <b>{game.options.roundDuration}s</b> Rounds
        </div>
        {#if game.type == GameType.CHOICES}
            <div class="property-display body-text">
                <ChoicesIcon />
                <b>{game.options.numChoices}</b> Choices
            </div>
        {/if}
    </div>

    <div id="footer">
        <div id="game-id" class="header-text">
            {game.id}
        </div>
        <button on:click> Join Game </button>
    </div>
</main>

<style>
    main {
        width: 100%;
        height: 100%;
        background-color: rgba(50, 50, 50, 0.5);
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
