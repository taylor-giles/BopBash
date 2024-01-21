<script lang="ts">
    import { onMount, tick } from "svelte";
    import GameAPI from "../../api/api";
    import { GameStore } from "../../gameStore";
    import AudioMotionAnalyzer from "audiomotion-analyzer";
    import { GameStatus } from "../../../shared/types";

    enum RoundPhase {
        COUNTDOWN,
        PLAYING,
    }

    const beep = new Audio(
        "data:audio/wav;base64,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",
    );

    let currentPhase: RoundPhase = RoundPhase.COUNTDOWN;
    let audioLoaded: boolean = false;
    let guessTrackId: string = "";

    let audioAnalyzer: AudioMotionAnalyzer;
    let audioElement: HTMLAudioElement;
    let countdownView: HTMLDivElement;
    let visualizerView: HTMLDivElement;

    $: currentRoundNum = $GameStore.currentRound?.index ?? -1;
    $: audioURL = $GameStore.currentRound?.audioURL;
    $: isGameDone = $GameStore.status === GameStatus.ENDED;

    /**
     * Every time the audio URL changes, start the next round
     */
    $: if (audioURL && audioElement) {
        loadRound();
    }

    //Keep track of how much time has passed in the audio
    let timestamp = -1;
    $: if (audioElement) {
        timestamp = audioElement.currentTime;
    }

    /**
     * When audio is ready, start playing
     */
    $: if (audioLoaded) {
        doCountdown().then(startPlayingPhase);
    }

    /**
     * Votes to skip the rest of this round
     */
    async function voteSkip() {
        GameAPI.readyPlayer();
    }

    /**
     * Prepares the next round by loading the audio
     */
    async function loadRound() {
        //Destroy audio analyzer
        if (audioAnalyzer) {
            audioAnalyzer.destroy();
        }

        //Start re-loading of audio element
        audioLoaded = false;
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
                    (3 - i) * 500,
                );
            }
        });
    }

    /**
     * Begins the playing phase
     */
    function startPlayingPhase() {
        if (!audioAnalyzer || audioAnalyzer.isDestroyed) {
            //Clear the countdown view
            countdownView.innerHTML = "";

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
                maxFreq: 20000,
                smoothing: 0.95,
                // mirror: -0.5,
                reflexAlpha: 1,
                reflexRatio: 0.5,
                colorMode: "bar-level",
                weightingFilter: "B",
                alphaBars: true,
                // minDecibels: -80
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
     * Submit the guess
     */
    async function handleSubmit(e: Event) {
        e.preventDefault();
        let { isCorrect, score } = (await GameAPI.submitGuess(
            currentRoundNum,
            guessTrackId,
        )) as { isCorrect: boolean; score: number };
        guessTrackId = "";
        console.log("Correct:", isCorrect, "\tScore", score);
    }
</script>

<main>
    {#if isGameDone}
        <div id="done-screen">Done!</div>
    {:else}
        <!-- Audio element (to play audio) -->
        <audio
            loop
            bind:this={audioElement}
            on:canplay={() => (audioLoaded = true)}
            on:timeupdate={(event) => {
                timestamp = event.currentTarget.currentTime;
            }}
            crossorigin="anonymous"
        >
            <source src={audioURL} type="audio/mpeg" />
        </audio>

        <!-- Container for countdown display -->
        <div id="countdown" bind:this={countdownView}></div>

        <!-- Container for audio visualization -->
        <div id="visualizer-container">
            <div bind:this={visualizerView}></div>
        </div>

        <div id="title">
            Round {currentRoundNum + 1}
        </div>

        <div style="flex: 1;"></div>

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
    {/if}
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    #countdown {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 300px;
    }

    #visualizer-container {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        height: 200px;
        width: 200px;
    }

    #submission-panel {
        box-sizing: border-box;
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
        box-sizing: border-box;
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
