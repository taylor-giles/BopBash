<script lang="ts">
    import GameAPI from "../../api/api";
</script>

<div id="stats-display">
    <div id="player-count-container" class="stat-container">
        <div id="player-count" class="stat-number header-text">
            {#await GameAPI.getNumPlayers()}
                -
            {:then numPlayers}
                {numPlayers >= 0 ? numPlayers : '-'}
            {/await}
        </div>
        <div id="player-count-label" class="stat-label header-text">
            Players Online
        </div>
    </div>
    <div id="game-count-container" class="stat-container">
        <div id="game-count" class="stat-number header-text">
            {#await GameAPI.getNumGames()}
                -
            {:then numGames}
                {numGames >= 0 ? numGames : '-'}
            {/await}
        </div>
        <div id="game-count-label" class="stat-label header-text">
            Active Games
        </div>
    </div>
    <div id="total-game-count-container" class="stat-container">
        <div id="total-game-count" class="stat-number header-text">
            {#await GameAPI.getTotalGamesPlayed()}
                -
            {:then totalGamesPlayed}
                {totalGamesPlayed >= 0 ? totalGamesPlayed : '-'}
            {/await}
        </div>
        <div id="total-game-count-label" class="stat-label header-text">
            Games Played
        </div>
    </div>
</div>

<style>
    #stats-display {
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
        width: 100%;
        max-width: 900px;
        min-width: 300px;
        flex-wrap: wrap;
    }

    .stat-container {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
        justify-content: center;
        align-items: center;
        padding-inline: 1rem;
    }
    .stat-number {
        font-size: 2rem;
        color: var(--spotify-green);
        font-weight: 600;
    }
    .stat-label {
        font-size: 1.2rem;
        font-weight: 600;
    }
</style>