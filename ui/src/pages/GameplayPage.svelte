<script lang="ts">
    import { onDestroy, tick } from "svelte";
    import BackIcon from "svelte-material-icons/ArrowLeft.svelte";
    import ChatIcon from "svelte-material-icons/Message.svelte";
    import ChatOffIcon from "svelte-material-icons/MessageOff.svelte";
    import { Stretch } from "svelte-loading-spinners";
    import GameAPI from "../../api/api";
    import { GameStore, GameConnection } from "../../stores/gameStore";
    import {
        MUSIC_AUDIO,
        BG_AUDIO,
        VISUALIZER_NODE,
        playClickSFX,
    } from "../../stores/audio";
    import {
        GameStatus,
        GameType,
        type GuessResult,
    } from "../../../shared/types";
    import Scoreboard from "../components/Scoreboard.svelte";
    import { arraySum } from "../../../shared/utils";
    import { fade, blur } from "svelte/transition";
    import ConfirmationModal from "../components/modals/ConfirmationModal.svelte";
    import { CurrentPage, Page, RoundPhase } from "../../stores/pageStore";
    import AudioControls from "../components/AudioControls.svelte";
    import GameplayForm from "../components/forms/GameplayForm.svelte";
    import TrackChoice from "../components/cards/TrackChoice.svelte";
    import GameplayVisualization from "../components/GameplayVisualization.svelte";
    import {
        COUNTDOWN_INTERVAL,
        REMATCH_TIMEOUT,
    } from "../../../shared/constants";
    import RoundConclusionScreen from "../components/RoundConclusionScreen.svelte";
    import GameEndScreen from "../components/GameEndScreen.svelte";
    import ChatBoard from "../components/ChatBoard.svelte";

    //Stop background music
    $BG_AUDIO.pause();
    $BG_AUDIO.currentTime = 0;

    //Round & game variables
    let currentPhase: RoundPhase = RoundPhase.COUNTDOWN;
    let audioLoaded: boolean = false;
    let guessTrackId: string = "";
    let guessResult: GuessResult | undefined;
    let correctTrackId: string | undefined;
    let showChatWindow: boolean = window.innerWidth > 800;
    let isModalOpen: boolean = false;
    let volumeLevel: number = 0.5;
    let currentRoundTime: number = 0;
    let isVisualizerSmall = false;
    let guessString: string;
    let timeToRematch: number = REMATCH_TIMEOUT / 1000;


    //HTML element references
    let visualization: GameplayVisualization;
    let choicesContainer: HTMLDivElement;
    let mainContentDiv: HTMLDivElement;

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
    $: allPlayersReady = Object.values($GameStore.players).every(
        (player) => player.isReady,
    );

    //Every time the audio URL changes, start loading the next round
    $: if (audioURL) {
        loadRound(audioURL);
    }

    //When audio is ready, start the round
    $: if (audioLoaded) {
        doCountdownPhase().then(startPlayingPhase);
    }

    //If all players are ready, display round conclusion
    $: if (allPlayersReady) {
        startConclusionPhase();
    }

    //If this player joined late, display round conclusion (this should NOT be reactive with $:)
    if ($GameStore.players[$GameConnection.playerId].isReady) {
        startConclusionPhase();
    }

    //Keep correct answer track ID updated with updates from server
    $: correctTrackId = $GameStore.currentRound?.trackId ?? correctTrackId;

    //If the game has ended, start the rematch countdown timer
    $: if (
        $GameStore.status === GameStatus.ENDED &&
        timeToRematch === REMATCH_TIMEOUT / 1000
    ) {
        let interval = setInterval(() => {
            timeToRematch = timeToRematch - 1;
            if (timeToRematch <= 0) {
                clearInterval(interval);
            }
        }, 1000);
    }

    /**
     * Starts countdown phase and returns promise that resolves when countdown phase is complete
     */
    async function doCountdownPhase() {
        currentPhase = RoundPhase.COUNTDOWN;
        isVisualizerSmall = false;
        await tick();
        isVisualizerSmall =
            choicesContainer?.scrollHeight > choicesContainer?.clientHeight ||
            mainContentDiv?.scrollHeight > mainContentDiv?.clientHeight;
        await visualization?.doCountdown();
    }

    /**
     * Prepares the next round by loading the audio
     */
    async function loadRound(url: string) {
        //Only continue if this player is not ready (which would happen if the player joined late)
        if (!$GameStore.players[$GameConnection.playerId].isReady) {
            //Put round into countdown phase
            currentPhase = RoundPhase.COUNTDOWN;

            //Destroy audio analyzer
            visualization?.destroyAnalyzer?.();

            //Reset round variables
            guessResult = undefined;
            correctTrackId = undefined;
            guessTrackId = "";
            guessString = "(No Answer)";
            currentRoundTime = 0;

            //Set audio callbacks & properties
            $MUSIC_AUDIO.crossOrigin = "anonymous";
            $MUSIC_AUDIO.oncanplay = () => {
                audioLoaded = true;
            };

            //Start re-loading of audio element
            audioLoaded = false;
            $MUSIC_AUDIO.src = url;
            $MUSIC_AUDIO.load();
        }
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
            $MUSIC_AUDIO.play();
            $MUSIC_AUDIO.loop = true;

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
            //Extract values from result
            guessResult = { ...result };
            correctTrackId = result.correctTrackId;
        }
    }

    /**
     * Moves to conclusion phase
     */
    async function startConclusionPhase() {
        await tick();

        //Move to conclusion phase and wait for render updates
        $MUSIC_AUDIO.pause();
        currentPhase = RoundPhase.CONCLUSION;
        await tick();
    }

    /**
     * Removes this player from this game and leaves this page
     */
    function leave() {
        $MUSIC_AUDIO.pause();
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
    {#if $GameStore.status === GameStatus.ENDED}
        <GameEndScreen />
    {:else}
        <div id="main-content" bind:this={mainContentDiv}>
            {#if currentPhase === RoundPhase.CONCLUSION}
                <RoundConclusionScreen
                    {correctTrackId}
                    {guessResult}
                    {guessString}
                />
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
                                    bind:audio={$MUSIC_AUDIO}
                                    bind:volumeLevel
                                />
                            </div>
                        {/if}
                    </div>

                    <!-- Visualization (and countdown) -->
                    <div
                        id="center-display"
                        class:condensed={isVisualizerSmall}
                    >
                        <GameplayVisualization
                            bind:this={visualization}
                            bind:currentPhase
                            countdownInterval={COUNTDOWN_INTERVAL}
                            visualizerNode={$VISUALIZER_NODE}
                            {currentRoundDuration}
                            progressGradientColors={[spotifyGreen, red]}
                            isSmall={isVisualizerSmall}
                        />
                    </div>

                    <!-- Guess submission section -->
                    <div id="submission-section">
                        <div id="submission-panel">
                            <!-- Section for entering guesses -->
                            <div
                                id="guess-section"
                                class:gone={$GameStore.type ===
                                    GameType.CHOICES}
                            >
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
                                                        guessTrackId =
                                                            choice.id;
                                                        guessString =
                                                            choice.name +
                                                            " - " +
                                                            choice.artist;
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
                                {:else}
                                    <!-- Search form -->
                                    <GameplayForm
                                        bind:guessString
                                        bind:guessTrackId
                                        disabled={currentPhase !==
                                            RoundPhase.PLAYING}
                                        on:submit={handleSubmit}
                                        on:skip={skipRound}
                                    />
                                {/if}

                                <!-- "Get Ready" overlay display -->
                                {#if currentPhase === RoundPhase.COUNTDOWN}
                                    <div
                                        class="overlay header-text"
                                        transition:blur={{ duration: 150 }}
                                    >
                                        Get ready!
                                    </div>
                                {/if}

                                <!-- Post-guess overlay display -->
                                {#if guessResult}
                                    <div
                                        class="overlay small header-text"
                                        transition:blur={{ duration: 150 }}
                                    >
                                        Waiting for other players...
                                        <Stretch color="white" />
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chat window -->
                <div id="chat-section" class:shown={showChatWindow}>
                    <div id="chat-window-title" class="header-text">
                        Game Chat
                    </div>
                    <ChatBoard chats={$GameStore.chatMessages} />
                </div>
            {/if}
        </div>
    {/if}

    <!-- Footer -->
    <div id="footer">
        <button
            id="leave-btn"
            on:click={() => (isModalOpen = true)}
            on:mouseup={playClickSFX}
        >
            <BackIcon />
            Leave Game
        </button>

        {#if $GameStore.status === GameStatus.ENDED}
            <div id="next-round-timer-container">
                <div class="header-text">REMATCH</div>
                <div id="next-round-container" class="header-text">
                    {`STARTS IN ${timeToRematch}s`}
                </div>
            </div>
        {:else if currentPhase === RoundPhase.COUNTDOWN || currentPhase === RoundPhase.PLAYING}
            <!-- Button to show chat window -->
            <button
                id="show-chat-btn"
                on:click={() => (showChatWindow = !showChatWindow)}
            >
                {#if showChatWindow}
                    <ChatOffIcon />
                    Hide Chat
                {:else}
                    <ChatIcon />
                    Show Chat
                {/if}
            </button>
        {:else if currentPhase === RoundPhase.CONCLUSION && currentRoundNum < ($GameStore.options.numRounds ?? 0) - 1}
            <!-- Display for when next round will start -->
            <div id="next-round-timer-container">
                <div>Next Round:</div>
                <div id="next-round-container" class="header-text">
                    {allPlayersReady
                        ? "STARTING SOON"
                        : "WAITING FOR OTHER PLAYERS"}
                </div>
            </div>
        {/if}
    </div>
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
    #footer {
        min-height: 42px;
    }

    #title {
        font-size: 1.2rem;
    }

    #main-content {
        position: relative;
        display: flex;
        flex-direction: row;
        flex: 1;
        width: 100%;
        height: 0px;
        overflow-x: hidden;
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
        padding-top: 1rem;
    }
    #center-display.condensed {
        padding-top: 0px;
    }

    #chat-section {
        display: flex;
        flex-direction: column;
        width: 0px;
        height: 100%;
        gap: 5px;
        max-width: 100%;
        max-height: 100%;
        margin-left: 0px;
        transition-property: width, margin-left;
        transition-duration: 300ms;
        transition-timing-function: ease-out;
    }
    #chat-section.shown {
        width: 380px;
        margin-left: 2rem;
    }
    #chat-window-title {
        text-align: center;
        font-size: 1.3rem;
        font-weight: 600;
        white-space: nowrap;
    }
    @media (max-width: 800px) {
        #chat-section {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            margin: 0px;
            background-color: rgba(0, 0, 0, 0.9);
            border-radius: 5px;
            pointer-events: none;
            width: 100%;
            opacity: 0;
            transition: opacity 150ms ease;
        }
        #chat-section.shown {
            margin: 0px;
            opacity: 100;
            pointer-events: inherit;
            width: 100%;
        }
        #chat-container {
            background-color: transparent;
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
    }

    #guess-section {
        position: relative;
        height: max-content;
        width: 100%;
        max-width: 700px;
        min-width: 260px;
        padding: 2rem;
    }
    #guess-section.gone {
        display: contents;
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

    .overlay {
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
        flex-direction: column;
        gap: 10px;
        justify-content: center;
        align-items: center;
        text-align: center;
    }
    .overlay.small {
        font-size: 2rem;
    }

    #show-chat-btn {
        height: max-content;
        color: var(--primary-light);
        background-color: transparent;
        border: 1px solid gray;
        font-size: 0.9rem;
        width: max-content;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
    }

    #next-round-timer-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 42px;
        font-size: 0.9rem;
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
