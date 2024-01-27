<script lang="ts">
    import { onMount, tick } from "svelte";
    import GameAPI from "../../api/api";
    import { GameStore, GameConnection } from "../../gameStore";
    import AudioMotionAnalyzer from "audiomotion-analyzer";
    import { GameStatus, Round, type GuessResult } from "../../../shared/types";
    import Scoreboard from "../components/Scoreboard.svelte";
    import { arraySum } from "../../../shared/utils";
    import { IFrameAPI } from "../../IFrameAPI";

    enum RoundPhase {
        COUNTDOWN,
        PLAYING,
        CONCLUSION,
    }

    const beep = new Audio(
        "data:audio/wav;base64,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",
    );

    let currentPhase: RoundPhase = RoundPhase.COUNTDOWN;
    let audioLoaded: boolean = false;
    let guessTrackId: string = "";
    let guessResult: GuessResult | undefined;
    let correctTrackId: string | undefined;

    let audioAnalyzer: AudioMotionAnalyzer;
    let audioElement: HTMLAudioElement;
    let countdownView: HTMLDivElement;
    let visualizerView: HTMLDivElement;
    let correctTrackEmbed: HTMLIFrameElement;

    //Maintain game variables
    $: currentRoundNum = $GameStore.currentRound?.index ?? -1;
    $: audioURL = $GameStore.currentRound?.audioURL;
    $: isGameDone = $GameStore.status === GameStatus.ENDED;

    //Every time the audio URL changes, start the next round
    $: if (audioURL) {
        loadRound();
    }

    //Keep track of how much time has passed in the audio
    let timestamp = -1;
    $: if (audioElement) {
        timestamp = audioElement.currentTime;
    }

    //When audio is ready, start playing
    $: if (audioLoaded) {
        doCountdown().then(startPlayingPhase);
    }

    //If the player runs out of time, display the conclusion
    $: if ($GameStore.currentRound?.trackId) {
        correctTrackId = $GameStore.currentRound?.trackId;
        showConclusion();
    }

    /**
     * Prepares the next round by loading the audio
     */
    async function loadRound() {
        //Destroy audio analyzer
        if (audioAnalyzer) {
            audioAnalyzer.destroy();
        }

        //Reset round variables
        guessResult = undefined;
        correctTrackId = undefined;

        //Start re-loading of audio element
        audioLoaded = false;
        audioElement = new Audio(audioURL);

        //Set audio callbacks & properties
        audioElement.crossOrigin = "anonymous";
        audioElement.oncanplay = () => {
            audioLoaded = true;
        };
        audioElement.ontimeupdate = () => {
            timestamp = audioElement.currentTime;
        };
        audioElement.load();
    }

    /**
     * Display a pre-round-start countdown
     */
    async function doCountdown(): Promise<void> {
        //Set phase
        currentPhase = RoundPhase.COUNTDOWN;

        //Wait for all stage changes to complete
        await tick();

        return new Promise(async (resolve) => {
            //Set up timeouts to perform the countdown
            for (let i = 3; i >= 0; i--) {
                setTimeout(
                    () => {
                        if (currentPhase === RoundPhase.COUNTDOWN) {
                            countdownView.innerHTML = `${i}`;
                            beep.play();

                            if (i == 0) {
                                resolve();
                            }
                        }
                    },
                    (3 - i) * 750,
                );
            }
        });
    }

    /**
     * Begins the playing phase
     */
    function startPlayingPhase() {
        if (!audioAnalyzer || audioAnalyzer.isDestroyed) {
            //Set phase
            currentPhase = RoundPhase.PLAYING;

            //Play the audio
            audioElement.play();

            //Generate an audio visualizer
            audioAnalyzer = new AudioMotionAnalyzer(visualizerView, {
                //Set source
                source: audioElement,

                //Set options
                showScaleX: false,
                roundBars: true,
                overlay: true,
                showBgColor: true,
                bgAlpha: 0,
                showPeaks: false,
                mode: 8,
                barSpace: 0.1,
                height: 200,
                width: 200,
                maxFreq: 15000,
                smoothing: 0.95,
                reflexAlpha: 1,
                reflexRatio: 0.5,
                colorMode: "bar-level",
                weightingFilter: "B",
                alphaBars: true,
            });

            //Make and use audio visualizer gradient
            audioAnalyzer.registerGradient("spotify-accent", {
                bgColor: "transparent",
                dir: "h",
                colorStops: [
                    { color: "#1db954", level: 1 },
                    { color: "#1bb468", level: 0.9 },
                    { color: "#18ae7b", level: 0.85 },
                    { color: "#16a98e", level: 0.8 },
                    { color: "#14a39f", level: 0.75 },
                    { color: "#128d9e", level: 0.7 },
                    { color: "#107398", level: 0.65 },
                    { color: "#0f5a92", level: 0.6 },
                    { color: "#0d428c", level: 0.55 },
                    { color: "#0b2c86", level: 0.5 },
                    { color: "#1d0773", level: 0.45 },
                    { color: "#2a066d", level: 0.4 },
                    { color: "#360566", level: 0.3 },
                ],
            });
            audioAnalyzer.gradient = "spotify-accent";
        }
    }

    /**
     * Votes to skip the rest of this round
     */
    async function voteSkip(e: Event) {
        guessTrackId = "";
        handleSubmit(e);
    }

    /**
     * Submit the guess
     */
    async function handleSubmit(e: Event) {
        e.preventDefault();

        //Submit the guess
        let result = await GameAPI.submitGuess(currentRoundNum, guessTrackId);

        //If the submission was successful...
        if (result) {
            //Reset guess value
            guessTrackId = "";

            //Extract values from result
            guessResult = { ...result };
            correctTrackId = result.correctTrackId;
            console.log(guessResult, correctTrackId);
            showConclusion();
        }
    }

    /**
     * Shows the embedded IFrame element of the correct answer track
     */
    async function showConclusion() {
        //Move to conclusion phase and wait for render updates
        audioElement.pause();
        currentPhase = RoundPhase.CONCLUSION;
        await tick();

        //Construct IFrameAPI request
        let iframeOptions = {
            uri: `spotify:track:${correctTrackId}`,
        };
        let callback = (EmbedController: any) => {
            console.log("EmbedController: ", EmbedController);
            EmbedController.addListener("ready", () => {
                //TODO: Determine if there is something to be done here (autoplay, etc)
            });
        };

        //Make the embed
        $IFrameAPI.createController(
            correctTrackEmbed,
            iframeOptions,
            callback,
        );
    }
</script>

<main>
    {#if isGameDone}
        <div id="done-screen">Done!</div>
    {:else}
        <div id="gameplay-content">
            <div id="title">
                Round {currentRoundNum + 1}
            </div>

            <div id="center-display">
                {#if currentPhase === RoundPhase.COUNTDOWN}
                    <!-- Container for countdown display -->
                    <div id="countdown" bind:this={countdownView}></div>
                {/if}

                <!-- Container for audio visualization -->
                <div bind:this={visualizerView}></div>
            </div>

            <div id="submission-panel">
                <form on:submit={handleSubmit}>
                    <input
                        id="guess-input"
                        class="header-text"
                        type="text"
                        placeholder="Start entering your guess here"
                        bind:value={guessTrackId}
                    />

                    <button type="submit" id="submit-btn"> Submit </button>
                    <button type="button" id="skip-btn" on:click={voteSkip}>
                        Skip
                    </button>
                </form>
            </div>
        </div>
        <div id="scoreboard-container">
            <Scoreboard
                players={Object.values($GameStore.players).toSorted(
                    (a, b) => arraySum(b.scores) - arraySum(a.scores),
                )}
            />
        </div>
    {/if}

    {#if currentPhase === RoundPhase.CONCLUSION}
        <div class="modal">
            <div id="conclusion-modal-content">
                <div id="conclusion-message-container">
                    <div
                        id="conclusion-title"
                        style={`color: ${
                            guessResult?.isCorrect
                                ? "var(--spotify-green)"
                                : "red"
                        }`}
                    >
                        {guessResult?.isCorrect
                            ? "Nice job!"
                            : "Aww, shucks :("}
                    </div>
                </div>

                <iframe
                    title="View track on Spotify"
                    bind:this={correctTrackEmbed}
                >
                    Loading...
                </iframe>

                <div id="conclusion-scoreboard-label">Scoreboard:</div>
                <div id="conclusion-scoreboard-container">
                    <Scoreboard
                        players={Object.values($GameStore.players).toSorted(
                            (a, b) => arraySum(b.scores) - arraySum(a.scores),
                        )}
                    />
                </div>

                <div>
                    The next round will start soon - please wait.
                </div>
            </div>
        </div>
    {/if}
</main>

<style>
    main {
        display: flex;
        flex-direction: row;
        height: 100%;
    }

    #gameplay-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }

    #center-display {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #scoreboard-container {
        height: 100%;
        background-color: rgba(0, 0, 0, 0.4);
        border: 2px solid var(--primary-light);
        border-radius: 5px;
        margin-left: 50px;
        margin-bottom: 2px;
    }

    #countdown {
        font-size: 300px;
    }

    #submission-panel {
        width: 100%;
        height: max-content;
        display: flex;
        flex-direction: row;
        gap: 20px;
    }

    #guess-input {
        flex: 1;
        font-size: 1.1rem;
        font-weight: 700;
        border-radius: 1px;
        padding-inline: 10px;
        border: 1px solid var(--primary-light);
    }

    #conclusion-modal-content {
        width: 70%;
        height: calc(100% - 60px);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 10px;
    }

    #conclusion-title {
        font-weight: 700;
        font-size: 2rem;
    }

    #conclusion-scoreboard-container {
        flex: 1;
        width: 100%;
        font-size: 1.3rem;
        background-color: rgba(0, 0, 0, 0.4);
        border: 2px solid var(--primary-light);
        border-radius: 5px;
    }

    #conclusion-scoreboard-label {
        margin-left: 10px;
        font-size: 1.5rem;
        margin-top: 30px;
    }

    #done-screen {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 300px;
    }

    form {
        display: contents;
    }
</style>
