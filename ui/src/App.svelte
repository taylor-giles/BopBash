<script lang="ts">
  import type { ComponentType } from "svelte";
  import { GameConnection, GameStore, PlayerConnection } from "../gameStore";
  import { Page, CurrentPage } from "../pageStore";
  import GamePage from "./pages/GamePage.svelte";
  import HomePage from "./pages/HomePage.svelte";
  import LoginPage from "./pages/LoginPage.svelte";
  import type { GameState } from "../../shared/types";
  import GameDiscoveryPage from "./pages/GameDiscoveryPage.svelte";

  const PAGES: Record<Page, ComponentType> = {
    [Page.LOGIN]: LoginPage,
    [Page.HOME]: HomePage,
    [Page.GAME]: GamePage,
    [Page.FIND]: GameDiscoveryPage,
  };

  //Maintain a reference to the player information and WebSocket connection object
  let connection: PlayerConnection;
  GameConnection.subscribe((value) => {
    if (value) {
      connection = value;
      CurrentPage.set(Page.HOME);
    }
  });

  let gameState: GameState;
  GameStore.subscribe((value) => {
    gameState = value;
  });
  $: if (gameState) {
    CurrentPage.set(Page.GAME);
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
