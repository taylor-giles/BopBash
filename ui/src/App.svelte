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
    
  const PAGES: Record<Page, ComponentType> = {
    [Page.LOGIN]: LoginPage,
    [Page.HOME]: HomePage,
    [Page.LOBBY]: GameLobbyPage,
    [Page.FIND]: GameDiscoveryPage,
    [Page.GAME]: GameplayPage,
  };

  //Maintain a reference to the player information and WebSocket connection object
  let connection: PlayerConnection;
  GameConnection.subscribe((value) => {
    if (value) {
      connection = value;
      CurrentPage.set(Page.HOME);
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
  <div id="appbar">
    Beat Blitz
  </div>
  
  <div id="page-content">
    <svelte:component this={PAGES[$CurrentPage]} />
  </div>
</main>

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
