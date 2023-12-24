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
    [Page.GAME]: GameplayPage
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

  //Switch to lobby page when game status is pending
  $: if (gameState?.status == GameStatus.PENDING) {
    CurrentPage.set(Page.LOBBY);
  }
</script>

<main>
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
    flex: 1;
    width: 100%;
    height: 100%;
  }
</style>
