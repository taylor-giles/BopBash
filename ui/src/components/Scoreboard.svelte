<script lang="ts">
  import { flip } from "svelte/animate";
  import type { PlayerState } from "../../../shared/types";
  import { GameConnection, GameStore } from "../../stores/gameStore";
  import PlayerScoreCard from "./PlayerScoreCard.svelte";

  export let players: PlayerState[];
</script>

<main>
  {#each players as player, index (player.id)}
    <div class="score-card-container" animate:flip={{ duration: 200 }}>
      <PlayerScoreCard
        {player}
        highlight={player.id === $GameConnection.playerId}
        position={index + 1}
      />
    </div>
  {/each}
</main>

<style>
  main {
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }

  .score-card-container {
    width: 100%;
    font-size: 1rem;
  }
</style>
