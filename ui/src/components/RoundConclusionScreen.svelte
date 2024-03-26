<script lang="ts">
    import PodiumIcon from "svelte-material-icons/Podium.svelte";
    import { tick } from "svelte";
    import { IFrameAPI } from "../../stores/IFrameAPI";
    import type { GuessResult } from "../../../shared/types";
    import { GameStore } from "../../stores/gameStore";
    import { arraySum } from "../../../shared/utils";
    import Scoreboard from "./Scoreboard.svelte";
    import Modal from "./modals/Modal.svelte";

    export let correctTrackId: string | undefined;
    export let guessResult: GuessResult | undefined;
    let correctTrackEmbed: HTMLIFrameElement;
    let isResultsModalShown = true;
    let currentRoundScore: number | null | undefined;

    //This should NOT be reactive (with $:) to avoid flashes of incorrect data when the round changes.
    //  (The round shown on the conclusion screen should never change)
    let currentRoundIndex = $GameStore.currentRound?.index ?? -1;

    //make sure correct track display stays updated
    $: if (correctTrackId && isResultsModalShown) {
        displayCorrectTrack();
    }

    /**
     * Updates the iFrame to display the embedded preview for this round's correct track
     */
    async function displayCorrectTrack() {
        await tick();

        //Construct IFrameAPI request
        let iframeOptions = {
            uri: `spotify:track:${correctTrackId}`,
            height: "100%",
            width: "100%",
        };

        //Make the embed
        $IFrameAPI.createController(correctTrackEmbed, iframeOptions, () => {});
    }
</script>

<div id="conclusion-content">
    <div class="conclusion-title">
        Round {currentRoundIndex + 1}
    </div>
    <div id="scoreboard-title" class="header-text">Game Leaderboard</div>

    <!-- Scoreboard in conclusion screen -->
    <div id="conclusion-scoreboard-container">
        <Scoreboard
            bind:currentRoundScore
            players={Object.values($GameStore.players).toSorted(
                (a, b) => arraySum(b.scores) - arraySum(a.scores),
            )}
        />
    </div>
    <button class="modal-btn" on:click={() => (isResultsModalShown = true)}>
        Show Round Results
    </button>
</div>

{#if isResultsModalShown}
    <Modal>
        <div
            id="results-modal"
            style="--border-color: {guessResult?.isCorrect
                ? 'var(--spotify-green)'
                : 'var(--red)'}"
        >
            <!-- Round results, including iframe -->
            <div id="conclusion-results-container">
                <div
                    class="conclusion-title"
                    style={`color: ${
                        guessResult?.isCorrect
                            ? "var(--spotify-green)"
                            : "var(--red)"
                    }`}
                >
                    {guessResult?.isCorrect ? "Nice job!" : "Aww, shucks :("}
                </div>
                <div id="iframe-container">
                    <div id="correct-track-label">Correct Track:</div>
                    <iframe
                        title="View track on Spotify"
                        bind:this={correctTrackEmbed}
                    >
                        Loading...
                    </iframe>
                </div>
                <div id="results-container">
                    <div class="conclusion-title" style="font-size: 1.3rem;">
                        Round {currentRoundIndex + 1} Score:
                    </div>

                    <div
                        id="results-display"
                        style={`color: ${
                            guessResult?.isCorrect
                                ? "var(--spotify-green)"
                                : "var(--red)"
                        }`}
                    >
                        +{currentRoundScore ?? 0}
                    </div>
                </div>
            </div>
            <button
                class="modal-btn"
                on:click={() => (isResultsModalShown = false)}
            >
                <PodiumIcon />
                View Leaderboard
            </button>
        </div>
    </Modal>
{/if}

<style>
    #conclusion-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        width: 100%;
    }

    #conclusion-results-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
        gap: 1rem;
        min-width: 260px;
        max-width: 900px;
        width: calc(90vw);

        min-height: 200px;
        max-height: 500px;
        height: calc(80vh);

        background-color: var(--accent-dark);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
    }

    .conclusion-title {
        font-weight: 700;
        font-size: 2rem;
        width: max-content;
    }

    #conclusion-scoreboard-container {
        flex: 1;
        background-color: rgba(0, 0, 0, 0.8);
        border: 2px solid var(--primary-light);
        border-radius: 5px;
        min-width: 260px;
        max-width: 900px;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    }

    .modal-btn {
        height: max-content;
        color: var(--primary-light);
        background-color: transparent;
        border: 1px solid gray;
        font-size: 0.9rem;
        width: max-content;
    }

    #results-modal {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }

    #results-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        width: 100%;
        justify-content: flex-start;
    }

    #results-display {
        text-align: start;
        width: max-content;
        font-size: 1.3rem;
    }

    #correct-track-label {
        font-size: 1.4rem;
        font-weight: 500;
    }

    #iframe-container {
        width: 100%;
        height: 275px;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    @media (max-width: 600px) {
        #conclusion-results-container {
            padding: 1rem;
            height: 300px;
        }
        #iframe-container {
            height: 120px;
            flex: 0;
        }
    }

    #scoreboard-title {
        font-size: 1.7rem;
        font-weight: 700;
        margin-top: -10px;
    }
</style>
