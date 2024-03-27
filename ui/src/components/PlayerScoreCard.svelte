<script lang="ts">
    import CheckIcon from "svelte-material-icons/CheckCircle.svelte";
    import WaitingIcon from "svelte-material-icons/ProgressClock.svelte";
    import type { PlayerState } from "../../../shared/types";
    import { GameStore } from "../../stores/gameStore";
    import { arraySum } from "../../../shared/utils";

    export let player: PlayerState;
    export let highlight: boolean = false;
    export let position: number = 0;
    export let showScoreChange: boolean = true;
    export let currentRoundScore: number | null | undefined = 0;

    // Update currentRoundScore every time it changes
    $: currentRoundIndex = $GameStore?.currentRound?.index;
    $: currentRoundScore =
        currentRoundIndex !== undefined
            ? player.scores[currentRoundIndex]
            : undefined;
</script>

<main class:highlighted={highlight}>
    <div id="icons-container">
        <!-- Position indicator -->
        <div id="position-label">
            {#if position > 0}
                {position}.
            {:else}
                -
            {/if}
        </div>
    </div>
    <div id="main-content">
        <div id="name-container" class="row-container">
            <div id="name-display">
                {player.name}
            </div>

            <!-- Ready icon -->
            {#if player?.isReady}
                <CheckIcon />
            {:else}
                <WaitingIcon />
            {/if}
        </div>

        <div id="score-container">
            <div id="score-display" class="header-text">
                {arraySum(player.scores).toString().padStart(6, "0")}
            </div>
            {#if showScoreChange}
                <div id="score-change-display">
                    {#if currentRoundScore !== undefined && currentRoundScore !== null}
                        ({currentRoundScore < 0 ? "" : "+"}{currentRoundScore})
                    {:else}
                        (No Answer)
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</main>

<style>
    main {
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1rem;
        padding: 0.8rem;
        background-color: var(--primary-dark);
        border-radius: 1px;
        color: var(--primary-light);
        border: 1px solid gray;
        white-space: nowrap;
    }
    main.highlighted {
        color: var(--spotify-green);
        font-weight: 600;
    }

    .row-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 6px;
    }

    #main-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
    }
    #icons-container {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    }
    #score-container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 5px;
        color: white;
    }

    #name-display {
        font-size: 1.25rem;
        font-weight: 700;
    }
    #name-container {
        margin-bottom: -2px;
    }
    #position-label {
        font-size: 1.4rem;
        font-weight: 700;
    }

    #position-label {
        color: white;
    }

    #score-display {
        font-size: 1rem;
        font-weight: 600;
    }

    #score-change-display {
        font-size: 0.9rem;
        font-weight: 400;
    }
</style>
