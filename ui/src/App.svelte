<script lang="ts">
  import type { ComponentType } from "svelte";
  import { GameConnection, GameStore, PlayerConnection } from "../gameStore";
  import { Page, CurrentPage } from "../pageStore";
  import GameLobbyPage from "./pages/GameLobbyPage.svelte";
  import HomePage from "./pages/HomePage.svelte";
  import LoginPage from "./pages/LoginPage.svelte";
  import GameplayPage from "./pages/GameplayPage.svelte";
  import { GameStatus, type GameState } from "../../shared/types";
  import GameDiscoveryPage from "./pages/GameDiscoveryPage.svelte";
  import GameAPI from "../api/api";
  import ErrorModal from "./components/ErrorModal.svelte";

  const PAGES: Record<Page, ComponentType> = {
    [Page.LOGIN]: LoginPage,
    [Page.HOME]: HomePage,
    [Page.LOBBY]: GameLobbyPage,
    [Page.FIND]: GameDiscoveryPage,
    [Page.GAME]: GameplayPage,
  };

  //If this is non-empty, the error modal will be shown
  let errorMsg = "";

  //Obtain and remove game ID from URL if it exists
  const gameToJoin = new URLSearchParams(window.location.search).get("game");
  window.history.replaceState({}, "", "/");

  //When the player connects, go to home page and try to join game from URL, if it exists
  GameConnection.subscribe((value) => {
    if (value) {
      CurrentPage.set(Page.HOME);

      //Attempt to join
      if (gameToJoin) {
        GameAPI.joinGame(gameToJoin).then((error) => {
          //Show error modal on failure
          if (error) {
            errorMsg = `Unable to join game '${gameToJoin}'`;
          }
        });
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
  <div id="appbar">Beat Blitz</div>

  <div id="page-content">
    <svelte:component this={PAGES[$CurrentPage]} />
  </div>
</main>

{#if errorMsg}
  <ErrorModal {errorMsg} on:close={() => (errorMsg = "")} />
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
    padding-inline: 2rem;
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
