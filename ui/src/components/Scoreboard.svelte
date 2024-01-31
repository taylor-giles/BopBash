<script lang="ts">
  import type { PlayerState } from "../../../shared/types";
  import { GameConnection, GameStore } from "../../gameStore";
  import PlayerScoreCard from "./PlayerScoreCard.svelte";
  
  export let players: PlayerState[];
</script>

<main>
  <table>
    <thead>
      <tr>
        <th/>
        <th> Name </th>
        <th> Score </th>
      </tr>
    </thead>

    {#each players as player (player.id)}
      <PlayerScoreCard {player} highlight={player.id === $GameConnection.playerId}/>
    {/each}
  </table>
</main>

<style>
  table {
    width: max-content;
    height: max-content;
    border-collapse: separate;
    border-spacing: 20px 5px;
  }

  th {
    text-align: start;
    font-size: 1.1em;
  }
</style>
