<script lang="ts">
    import type { ComponentType } from "svelte";
    import { GameConnection, GameStore } from "../stores/gameStore";
    import { Page, CurrentPage, ErrorMessage } from "../stores/pageStore";
    import { BG_AUDIO } from "../stores/audio";
    import GameLobbyPage from "./pages/GameLobbyPage.svelte";
    import HomePage from "./pages/HomePage.svelte";
    import LoginPage from "./pages/LoginPage.svelte";
    import GameplayPage from "./pages/GameplayPage.svelte";
    import { GameStatus, type GameState } from "../../shared/types";
    import GameDiscoveryPage from "./pages/GameDiscoveryPage.svelte";
    import GameAPI from "../api/api";
    import ErrorModal from "./components/modals/ErrorModal.svelte";
    import GameCreationPage from "./pages/GameCreationPage.svelte";

    const PAGES: Record<Page, ComponentType> = {
        [Page.LOGIN]: LoginPage,
        [Page.HOME]: HomePage,
        [Page.LOBBY]: GameLobbyPage,
        [Page.FIND]: GameDiscoveryPage,
        [Page.GAME]: GameplayPage,
        [Page.CREATE]: GameCreationPage,
    };

    //Obtain and remove game ID from URL if it exists
    const gameToJoin = new URLSearchParams(window.location.search).get("game");
    window.history.replaceState({}, "", "/");

    //When the player connects, go to home page and try to join game from URL, if it exists
    GameConnection.subscribe((value) => {
        if (value) {
            CurrentPage.set(Page.HOME);

            //Start background music
            $BG_AUDIO.loop = true;
            $BG_AUDIO.volume=0.5;
            $BG_AUDIO.play();

            //Attempt to join
            if (gameToJoin) {
                GameAPI.joinGame(gameToJoin);
            }
        }
    });

    //Maintain a reference to current game state
    let gameState: GameState;
    GameStore.subscribe((value) => {
        gameState = value;
    });

    //Change active page based on game status
    $: if (gameState?.status == GameStatus.PENDING) {
        CurrentPage.set(Page.LOBBY);
    } else if (gameState?.status == GameStatus.ACTIVE) {
        CurrentPage.set(Page.GAME);
    }
</script>

<main>
    <div id="appbar">BopBash</div>
    <div id="page-content">
        <svelte:component this={PAGES[$CurrentPage]} />
    </div>
</main>

<!-- Error Modal (displays error message from store)-->
{#if $ErrorMessage}
    <ErrorModal
        errorMsg={$ErrorMessage}
        on:close={() => ErrorMessage.set("")}
    />
{/if}

<style>
    main {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }
    #page-content {
        position: relative;
        padding: 1rem;
        padding-inline: 1rem;
        flex: 1;
        width: 100%;
        height: 100%;
        overflow-y: auto;
        min-width: 320px;
        min-height: 500px;
    }
    #appbar {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        padding-inline: 15px;
        background-color: var(--primary-dark);
        height: 3rem;
        font-size: 1.6rem;
    }
</style>
