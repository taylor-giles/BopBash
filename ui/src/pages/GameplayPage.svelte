<script lang="ts">
    import { onDestroy, tick } from "svelte";
    import BackIcon from "svelte-material-icons/ArrowLeft.svelte";
    import PodiumIcon from "svelte-material-icons/Podium.svelte";
    import GameAPI from "../../api/api";
    import { GameStore } from "../../stores/gameStore";
    import {
        GameStatus,
        GameType,
        type GuessResult,
    } from "../../../shared/types";
    import Scoreboard from "../components/Scoreboard.svelte";
    import { arraySum } from "../../../shared/utils";
    import { IFrameAPI } from "../../stores/IFrameAPI";
    import { fade } from "svelte/transition";
    import ConfirmationModal from "../components/ConfirmationModal.svelte";
    import { CurrentPage, Page, RoundPhase } from "../../stores/pageStore";
    import AudioControls from "../components/AudioControls.svelte";
    import GameplayForm from "../components/GameplayForm.svelte";
    import TrackChoice from "../components/TrackChoice.svelte";
    import GameplayVisualization from "../components/GameplayVisualization.svelte";
    import { COUNTDOWN_INTERVAL } from "../../../shared/constants";

    //Create audio context
    const audioContext = new AudioContext();

    //Create audio node to connect to visualizer
    const visualizerNode = audioContext.createAnalyser();

    //Create & connect beep sound node
    const beep = new Audio("/src/assets/beep.mp3");
    audioContext
        .createMediaElementSource(beep)
        .connect(audioContext.destination);

    //Round & game variables
    let currentPhase: RoundPhase = RoundPhase.COUNTDOWN;
    let audioLoaded: boolean = false;
    let guessTrackId: string = "";
    let guessArtistId: string = "";
    let guessResult: GuessResult | undefined;
    let correctTrackId: string | undefined;
    let showScoreboard: boolean = window.innerWidth > 800;
    let isModalOpen: boolean = false;
    let volumeLevel: number = 0.5;
    let currentRoundTime: number = 0;
    let isVisualizerSmall = false;

    //HTML element references
    let audioElement: HTMLAudioElement = new Audio();
    let sourceNode = audioContext.createMediaElementSource(audioElement);
    sourceNode.connect(visualizerNode);
    sourceNode.connect(audioContext.destination);
    let correctTrackEmbed: HTMLIFrameElement;
    let visualization: GameplayVisualization;
    let choicesContainer: HTMLDivElement;

    //Get colors from CSS
    const spotifyGreen = getComputedStyle(
        document.documentElement,
    ).getPropertyValue("--spotify-green");
    const red = getComputedStyle(document.documentElement).getPropertyValue(
        "--red",
    );

    //Maintain round & game variables
    $: currentRoundNum = $GameStore.currentRound?.index ?? -1;
    $: currentRoundDuration =
        ($GameStore.currentRound?.duration ?? COUNTDOWN_INTERVAL * 4) -
        COUNTDOWN_INTERVAL * 3;
    $: currentRoundChoices = $GameStore.currentRound?.choices ?? [];
    $: audioURL = $GameStore.currentRound?.audioURL;
    $: isGameDone = $GameStore.status === GameStatus.ENDED;

    $: console.log(isVisualizerSmall);

    //Every time the audio URL changes, start loading the next round
    $: if (audioURL) {
        audioElement.src = audioURL;
        loadRound();
    }

    //Keep track of how much time has passed in the audio
    let timestamp = -1;
    $: if (audioElement) {
        timestamp = audioElement.currentTime;
    }

    //When audio is ready, start the round
    $: if (audioLoaded) {
        doCountdownPhase().then(startPlayingPhase);
    }

    //If the correct answer has been delivered to the player, display the conclusion
    $: if ($GameStore.currentRound?.trackId) {
        correctTrackId = $GameStore.currentRound?.trackId;
        startConclusionPhase();
    }

    /**
     * Starts countdown phase and returns promise that resolves when countdown phase is complete
     */
    async function doCountdownPhase() {
        currentPhase = RoundPhase.COUNTDOWN;
        isVisualizerSmall = false;
        await tick();
        isVisualizerSmall =
            choicesContainer?.scrollHeight > choicesContainer?.clientHeight;
        await visualization.doCountdown();
    }

    /**
     * Prepares the next round by loading the audio
     */
    async function loadRound() {
        //Destroy audio analyzer
        visualization?.destroyAnalyzer();

        //Reset round variables
        guessResult = undefined;
        correctTrackId = undefined;
        guessTrackId = "";
        guessArtistId = "";
        currentRoundTime = 0;

        //Set audio callbacks & properties
        audioElement.crossOrigin = "anonymous";
        audioElement.oncanplaythrough = () => {
            audioLoaded = true;
        };
        audioElement.ontimeupdate = () => {
            timestamp = audioElement.currentTime;
        };

        //Start re-loading of audio element
        audioLoaded = false;
        audioElement.load();
    }

    /**
     * Begins the playing phase
     */
    async function startPlayingPhase() {
        if (visualization.isDestroyed()) {
            //Set the phase
            currentPhase = RoundPhase.PLAYING;
            await tick();

            //Play the audio
            audioElement.play();
            audioElement.loop = true;

            //Start the visualization
            visualization.start();
        }
    }

    /**
     * Skips the rest of this round
     */
    async function skipRound(e: Event) {
        e?.preventDefault();
        guessTrackId = "";
        handleSubmit(e);
    }

    /**
     * Submits the guess
     */
    async function handleSubmit(e?: Event) {
        e?.preventDefault();

        //Submit the guess
        let result = await GameAPI.submitGuess(currentRoundNum, guessTrackId);

        //If the submission was successful...
        if (result) {
            //Reset guess value
            guessTrackId = "";

            //Extract values from result
            guessResult = { ...result };
            correctTrackId = result.correctTrackId;

            //Move to conclusion phase
            startConclusionPhase();
        }
    }

    /**
     * Moves to conclusion phase
     */
    async function startConclusionPhase() {
        //Move to conclusion phase and wait for render updates
        audioElement.pause();
        currentPhase = RoundPhase.CONCLUSION;
        await tick();

        //Construct IFrameAPI request
        let iframeOptions = {
            uri: `spotify:track:${correctTrackId}`,
            height: "100%",
        };

        //Make the embed
        $IFrameAPI.createController(correctTrackEmbed, iframeOptions, () => {});
    }

    /**
     * Removes this player from this game and leaves this page
     */
    function leave() {
        audioElement.pause();
        GameAPI.leaveGame();
        CurrentPage.set(Page.HOME);
    }

    //Handle destruction
    onDestroy(() => {
        //Destroy audio analyzer
        visualization?.destroyAnalyzer();
    });
</script>

<main>
    {#if isGameDone}
        <div id="done-screen">Done!</div>
    {:else}
        <div id="main-content">
            {#if currentPhase === RoundPhase.CONCLUSION}
                <div id="conclusion-content">
                    <!-- Round results, including iframe -->
                    <div id="conclusion-results-container">
                        <div
                            id="conclusion-title"
                            style={`color: ${
                                guessResult?.isCorrect
                                    ? "var(--spotify-green)"
                                    : "var(--red)"
                            }`}
                        >
                            {guessResult?.isCorrect
                                ? "Nice job!"
                                : "Aww, shucks :("}
                        </div>
                        <iframe
                            title="View track on Spotify"
                            bind:this={correctTrackEmbed}
                        >
                            Loading...
                        </iframe>
                    </div>

                    <!-- Scoreboard in conclusion screen -->
                    <div id="conclusion-scoreboard-container">
                        <Scoreboard
                            players={Object.values($GameStore.players).toSorted(
                                (a, b) =>
                                    arraySum(b.scores) - arraySum(a.scores),
                            )}
                        />
                    </div>
                </div>
            {:else}
                <div id="gameplay-content">
                    <!-- Header -->
                    <div id="header">
                        <div id="title">
                            Round {currentRoundNum + 1}
                        </div>

                        <!-- Audio controls -->
                        {#if currentPhase === RoundPhase.PLAYING}
                            <div id="audio-controls-container">
                                <AudioControls
                                    bind:audio={audioElement}
                                    bind:volumeLevel
                                />
                            </div>
                        {/if}
                    </div>

                    <div id="center-display" class:condensed={isVisualizerSmall}>
                        <GameplayVisualization
                            bind:this={visualization}
                            bind:currentPhase
                            countdownInterval={COUNTDOWN_INTERVAL}
                            {visualizerNode}
                            {beep}
                            {currentRoundDuration}
                            progressGradientColors={[spotifyGreen, red]}
                            isSmall={isVisualizerSmall}
                        />
                    </div>
                    <div id="submission-section">
                        <div id="submission-panel">
                            {#if $GameStore.type === GameType.CHOICES}
                                <!-- Choices -->
                                <div
                                    id="choices-wrapper"
                                    bind:this={choicesContainer}
                                >
                                    {#each currentRoundChoices as choice (choice.id)}
                                        <div class="choice-wrapper">
                                            <TrackChoice
                                                on:click={() => {
                                                    guessTrackId = choice.id;
                                                    handleSubmit();
                                                }}
                                                {choice}
                                                --title-size={isVisualizerSmall
                                                    ? "1.1rem"
                                                    : "1.3rem"}
                                            />
                                        </div>
                                    {/each}
                                </div>

                                <!-- "Get Ready" overlay display -->
                                {#if currentPhase !== RoundPhase.PLAYING}
                                    <div
                                        id="get-ready-overlay"
                                        class="header-text"
                                        transition:fade={{ duration: 150 }}
                                    >
                                        Get ready!
                                    </div>
                                {/if}
                            {:else}
                                <!-- Form for entering guesses -->
                                <div id="form-wrapper">
                                    <GameplayForm
                                        bind:guessTrackId
                                        bind:guessArtistId
                                        disabled={currentPhase !==
                                            RoundPhase.PLAYING}
                                        on:submit={handleSubmit}
                                        on:skip={skipRound}
                                    />

                                    <!-- "Get Ready" overlay display -->
                                    {#if currentPhase !== RoundPhase.PLAYING}
                                        <div
                                            id="get-ready-overlay"
                                            class="header-text"
                                            transition:fade={{ duration: 150 }}
                                        >
                                            Get ready!
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Scoreboard -->
                {#if showScoreboard}
                    <div id="scoreboard-container">
                        <Scoreboard
                            players={Object.values($GameStore.players).toSorted(
                                (a, b) =>
                                    arraySum(b.scores) - arraySum(a.scores),
                            )}
                        />
                    </div>
                {/if}
            {/if}
        </div>

        <!-- Footer -->
        <div id="footer">
            <button id="leave-btn" on:click={() => (isModalOpen = true)}>
                <BackIcon />
                Leave Game
            </button>

            <!-- Button to show scoreboard -->
            {#if currentPhase !== RoundPhase.CONCLUSION}
                <button
                    id="show-scoreboard-btn"
                    on:click={() => (showScoreboard = !showScoreboard)}
                >
                    <PodiumIcon />
                    {showScoreboard ? "Hide" : "Show"}
                </button>
            {/if}
        </div>
    {/if}
</main>

<!-- Confirmation modal for leaving game -->
{#if isModalOpen}
    <ConfirmationModal
        on:no={() => (isModalOpen = false)}
        on:yes={leave}
        bodyText="Are you sure you want to leave this game?"
    />
{/if}

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 10px;
        height: 100%;
    }

    #header,
    #footer {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    #main-content {
        position: relative;
        display: flex;
        flex-direction: row;
        gap: 36px;
        flex: 1;
        width: 100%;
        height: 0px;
    }

    #gameplay-content {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        flex: 4;
        position: relative;
    }

    #center-display {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        height: max-content;
        flex-grow: 1;
    }
    #center-display.condensed {
        flex-grow: 0;
    }

    #scoreboard-container {
        flex: 1;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        border: 2px solid var(--primary-light);
        border-radius: 5px;
        min-width: 260px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    }
    @media (max-width: 800px) {
        #scoreboard-container {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
        }
    }

    #submission-section {
        flex: 5;
        height: 0px;
        display: flex;
        align-items: center;
    }

    #submission-panel {
        position: relative;
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 20px;
        height: max-content;
        max-height: 100%;
        flex: 1;
        overflow: hidden;
    }

    #form-wrapper {
        position: relative;
        height: max-content;
        width: 100%;
        max-width: 700px;
        min-width: 260px;
        padding: 2rem;
    }

    #choices-wrapper {
        width: 100%;
        height: max-content;
        max-height: 100%;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        flex-wrap: wrap;
        max-width: 95%;
        min-width: 260px;
        overflow-y: auto;
    }

    .choice-wrapper {
        min-width: calc(max(18rem, 50%));
        flex: 1;
        padding: 5px;
    }

    #get-ready-overlay {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background-color: rgba(0, 0, 0, 0.95);
        border-radius: 4px;
        border: 1px solid gray;
        font-size: 3rem;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #conclusion-content {
        flex: 1;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 36px;
    }

    #conclusion-results-container {
        flex: 1;
        min-width: 260px;
        white-space: nowrap;
        overflow: hidden;
    }

    #conclusion-title {
        font-weight: 700;
        font-size: 2rem;
    }

    #conclusion-scoreboard-container {
        flex: 1;
        background-color: rgba(0, 0, 0, 0.8);
        border: 2px solid var(--primary-light);
        border-radius: 5px;
        min-width: 260px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    }

    #done-screen {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 30px;
    }

    #show-scoreboard-btn {
        height: max-content;
        color: var(--primary-light);
        background-color: transparent;
        border: 1px solid gray;
        font-size: 0.9rem;
        width: max-content;
    }

    #leave-btn {
        color: var(--primary-light);
        background-color: transparent;
        padding: 0px;
        font-size: 0.9rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
        width: max-content;
    }
    #leave-btn:hover {
        color: var(--red);
    }
</style>
