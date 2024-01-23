<script lang="ts">
    import CheckIcon from "svelte-material-icons/CheckCircle.svelte";
    import WaitingIcon from "svelte-material-icons/ProgressClock.svelte";
    import type { PlayerState } from "../../../shared/types";
    import { GameStore } from "../../gameStore";

    export let player: PlayerState;
    export let highlight: boolean = false;

    console.log(player);

    $: currentRoundIndex = $GameStore?.currentRound?.index;
    $: currentRoundScore =
        currentRoundIndex !== undefined
            ? player.scores[currentRoundIndex]
            : undefined;
</script>

<tr class:highlighted={highlight}>
    <td>
        <div id="icon-container">
            {#if player?.isReady}
                <CheckIcon color={highlight ? "white" : "white"} />
            {:else}
                <WaitingIcon color={highlight ? "white" : "white"} />
            {/if}
        </div>
    </td>
    <td id="name-cell">
        <div id="name-display">
            {player.name}
        </div>
    </td>

    <td id="score-cell">
        <div id="score-container">
            <div id="score-display">
                {player.scores.reduce((a, b) => {
                    return (a ?? 0) + (b ?? 0);
                }, 0)}
            </div>
            {#if currentRoundScore !== undefined && currentRoundScore !== null}
                <div id="score-change-display">
                    ({currentRoundScore < 0 ? "" : "+"}{currentRoundScore})
                </div>
            {/if}
        </div>
    </td>
</tr>

<style>
    #score-cell {
        min-width: 120px;
        text-align: start;
    }
    #icon-container {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    #score-container {
        text-align: center;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        gap: 5px;
    }
    tr.highlighted {
        color: var(--spotify-green);
        font-weight: 600;
    }

    #name-display {
        font-size: 1rem;
    }

    #score-display {
        font-size: 1rem;
    }

    #score-change-display {
        font-size: 0.7rem;
    }
</style>
