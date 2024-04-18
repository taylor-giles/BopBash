<script lang="ts">
    import PodiumIcon from "svelte-material-icons/Podium.svelte";
    import { Stretch } from "svelte-loading-spinners";
    import { tick } from "svelte";
    import { IFrameAPI } from "../../stores/IFrameAPI";
    import type { GuessResult } from "../../../shared/types";
    import { GameStore } from "../../stores/gameStore";
    import { arraySum } from "../../../shared/utils";
    import Scoreboard from "./Scoreboard.svelte";
    import Modal from "./modals/Modal.svelte";
    import ChatBoard from "./ChatBoard.svelte";

    const CONTENT_TYPES = ["Leaderboard", "Chat"] as const;

    export let correctTrackId: string | undefined;
    export let guessResult: GuessResult | undefined;
    export let guessString: string;
    let correctTrackEmbed: HTMLIFrameElement;
    let isResultsModalShown = true;
    let currentRoundScore: number | null | undefined;
    let currentContentType: (typeof CONTENT_TYPES)[number] = "Leaderboard";

    //This should NOT be reactive (with $:) to avoid flashes of incorrect data when the round changes.
    //  (The round shown on the conclusion screen should never change)
    let currentRoundIndex = $GameStore.currentRound?.index ?? -1;

    //Keep the border and text color of the results modal updated according to results
    $: correctnessColor = !correctTrackId
        ? "gray"
        : guessResult?.isCorrect
          ? "var(--spotify-green)"
          : "var(--red)";

    //Make sure correct track display stays updated
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
    <div id="content-selectors-container">
        {#each CONTENT_TYPES as contentType}
            <button
                class="content-selector-btn"
                on:click={() => (currentContentType = contentType)}
                class:selected={currentContentType === contentType}
            >
                {contentType}
            </button>
        {/each}
    </div>

    <!-- Scoreboard and chat in conclusion screen -->
    <div id="conclusion-content-container">
        {#if currentContentType === "Leaderboard"}
            <Scoreboard
                bind:currentRoundScore
                players={Object.values($GameStore.players).toSorted(
                    (a, b) => arraySum(b.scores) - arraySum(a.scores),
                )}
            />
        {:else if currentContentType === "Chat"}
            <ChatBoard chats={$GameStore.chatMessages} />
        {/if}
    </div>

    <button
        class="modal-btn"
        on:click={() => (isResultsModalShown = true)}
    >
        Show Round Results
    </button>
</div>

{#if isResultsModalShown}
    <Modal>
        <div id="results-modal" style="--border-color: {correctnessColor}">
            {#if correctTrackId}
                <!-- Round results, including iframe -->
                <div id="conclusion-results-container">
                    <div
                        class="conclusion-title"
                        style="color: {correctnessColor}"
                    >
                        {guessResult?.isCorrect
                            ? "Nice job!"
                            : "Aww, shucks :("}
                    </div>
                    <div id="guess-display">
                        <div class="label">Your Guess:</div>
                        <div>{guessString}</div>
                    </div>
                    <div id="iframe-container">
                        <div class="label">Correct Track:</div>
                        <iframe
                            title="View track on Spotify"
                            bind:this={correctTrackEmbed}
                        >
                            Loading...
                        </iframe>
                    </div>
                    <div id="results-container">
                        <div
                            class="conclusion-title"
                            style="font-size: 1.3rem;"
                        >
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
            {:else}
                <div id="waiting-container">
                    <div class="conclusion-title">
                        Please wait for the results of this round.
                    </div>
                    <Stretch color="var(--primary-light)" />
                </div>
            {/if}
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
        min-width: 17rem;
        max-width: 50rem;
        width: calc(90dvw);

        min-height: 24rem;
        max-height: 30rem;
        height: calc(80dvh);

        background-color: var(--accent-dark);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
    }

    .conclusion-title {
        font-weight: 700;
        font-size: 2rem;
        width: max-content;
        max-width: 90%;
        text-align: center;
    }

    #content-selectors-container {
        display: flex;
        flex-direction: row;
        width: 100%;
        min-width: 260px;
        max-width: 900px;
        justify-content: space-around;
        margin-bottom: -10px;
        background-color: var(--primary-dark);
        border-radius: 5px 5px 0px 0px;
        overflow: hidden;
    }

    .content-selector-btn {
        flex: 1;
        border-radius: 0px;
        background-color: var(--primary-dark);
        color: var(--primary-light);
    }
    .content-selector-btn.selected {
        background-color: var(--primary-light);
        color: var(--accent-dark);
    }
    .content-selector-btn:hover {
        background-color: var(--primary-dark);
        color: var(--primary-light);
    }
    .content-selector-btn.selected:hover {
        background-color: var(--primary-light);
        color: var(--accent-dark);
    }

    #conclusion-content-container {
        flex: 1;
        background-color: rgba(0, 0, 0, 0.8);
        border: 2px solid var(--primary-light);
        border-radius: 0px 0px 5px 5px;
        min-width: 260px;
        max-width: 900px;
        width: 100%;
        height: 0px;
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

    .label {
        font-size: 1.4rem;
        font-weight: 500;
    }

    #guess-display {
        width: 100%;
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

    #waiting-container {
        min-width: 17rem;
        max-width: 50rem;
        width: calc(90dvw);

        max-height: calc(90dvh);
        height: max-content;

        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
        align-items: center;
    }
</style>
