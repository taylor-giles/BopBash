<script lang="ts">
    import type { ComponentType } from "svelte";
    import { GameConnection, GameStore } from "../stores/gameStore";
    import { Page, CurrentPage, ErrorMessage } from "../stores/pageStore";
    import { BG_AUDIO, playClickSFX } from "../stores/audio";
    import GameLobbyPage from "./pages/GameLobbyPage.svelte";
    import HomePage from "./pages/HomePage.svelte";
    import LoginPage from "./pages/LoginPage.svelte";
    import GameplayPage from "./pages/GameplayPage.svelte";
    import { GameStatus, type GameState } from "../../shared/types";
    import GameDiscoveryPage from "./pages/GameDiscoveryPage.svelte";
    import GameAPI from "../api/api";
    import ErrorModal from "./components/modals/ErrorModal.svelte";
    import GameCreationPage from "./pages/GameCreationPage.svelte";
    import Appbar from "./components/Appbar.svelte";
    import SettingsModal from "./components/modals/SettingsModal.svelte";
    import Background from "./Background.svelte";
    import HelpModal from "./components/modals/HelpModal.svelte";

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
            $BG_AUDIO.play();
            if (gameToJoin) {
                value.onopen = () => {
                    //Attempt to join game from URL
                    GameAPI.joinGame(gameToJoin);
                };
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

    //Flags for toggling state of modals
    let isSettingsModalOpen = false;
    let isHelpModalOpen = false;

    /**
     * Checks if the clicked element or its (grand)parent is a button. If so, plays click sound.
     * @param e Click event
     */
    function checkClick(e: MouseEvent) {
        let clickedElement = e.target as HTMLElement;
        if (
            clickedElement.tagName === "BUTTON" || //Buttons
            clickedElement.parentElement?.tagName === "BUTTON" || //Buttons with content (button > div)
            clickedElement.parentElement?.parentElement?.tagName === "BUTTON" //Icon buttons (button > svg > path)
        ) {
            playClickSFX();
        }
    }

    //Page leave confirmation dialog
    window.addEventListener('beforeunload', function (event) {
        if($CurrentPage == Page.CREATE || $CurrentPage == Page.GAME || $CurrentPage == Page.LOBBY){
            const message = "Are you sure you want to leave the game?";
            event.returnValue = message;
            return message;
        }
    })
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<main on:click|capture={checkClick}>
    <Appbar
        on:settingsclick={() => (isSettingsModalOpen = true)}
        on:helpclick={() => (isHelpModalOpen = true)}
    />
    <div id="page-content">
        <svelte:component this={PAGES[$CurrentPage]} />
    </div>

    <!-- Settings Modal -->
    {#if isSettingsModalOpen}
        <SettingsModal on:close={() => (isSettingsModalOpen = false)} />
    {/if}

    <!-- Help Modal -->
    {#if isHelpModalOpen && $CurrentPage !== Page.LOGIN}
        <HelpModal on:close={() => (isHelpModalOpen = false)} />
    {/if}

    <!-- Error Modal (displays error message from store)-->
    {#if $ErrorMessage}
        <ErrorModal
            errorMsg={$ErrorMessage}
            on:close={() => ErrorMessage.set("")}
        />
    {/if}
</main>

<Background />

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
        flex: 1;
        width: 100%;
        height: 100%;
        overflow-y: auto;
        min-width: 320px;
        min-height: 500px;
    }
</style>
