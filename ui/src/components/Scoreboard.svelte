<script lang="ts">
  import { flip } from "svelte/animate";
  import type { PlayerState } from "../../../shared/types";
  import { GameConnection } from "../../stores/gameStore";
  import PlayerScoreCard from "./PlayerScoreCard.svelte";

  export let players: PlayerState[];
  export let showScoreChange: boolean = true;

  //Expose the current round score of the active player. This is read-only - setting it has no effect.
  export let currentRoundScore: number | null | undefined = undefined;
</script>

<main>
  {#each players as player, index (player.id)}
    <div class="score-card-container" animate:flip={{ duration: 200 }}>
      <!-- If this is the card for the active player, export the computed current round score -->
      {#if player.id === $GameConnection.playerId}
        <PlayerScoreCard
          bind:currentRoundScore
          {player}
          highlight={true}
          position={index + 1}
          {showScoreChange}
        />
      {:else}
        <PlayerScoreCard {player} highlight={false} position={index + 1} {showScoreChange} />
      {/if}
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
