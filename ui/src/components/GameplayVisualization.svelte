<script lang="ts">
    import type {
        ConstructorOptions,
        GradientOptions,
    } from "audiomotion-analyzer";
    import { RoundPhase } from "../../stores/pageStore";
    import { tick } from "svelte";
    import AudioMotionAnalyzer from "audiomotion-analyzer";
    import RoundProgressBar from "./RoundProgressBar.svelte";

    //Set to activate small layout (horizontal progress bar vs. circular)
    export let isSmall: boolean = false;

    //The current phase of the round
    export let currentPhase: RoundPhase;

    //Progress bar variables
    export let currentRoundDuration: number;
    export let progressGradientColors: string[] = ["lime", "red"];
    export let progressGradientPositions: number[] = [0.5, 1];

    //Millis between numbers shown in countdown
    export let countdownInterval = 400;

    //Audio visualization options
    export let visualizerOptions: ConstructorOptions = {
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
    };

    //Audio references
    export let beep: HTMLAudioElement | undefined;
    export let visualizerNode: AnalyserNode;

    //Element references
    let countdownView: HTMLDivElement;
    let visualizerView: HTMLDivElement;
    let audioAnalyzer: AudioMotionAnalyzer;

    //Gradient to use for visualizer bars
    export let visualizerGradient: GradientOptions = {
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
    };

    //Destroys the audio analyzer, if it exists
    export const destroyAnalyzer = () => {
        audioAnalyzer?.destroy();
    };

    //Returns false iff the audioAnalyzer exists and is not destroyed
    export const isDestroyed = () => {
        return !audioAnalyzer || audioAnalyzer.isDestroyed;
    };

    /**
     * Display a pre-round-start countdown
     */
    export async function doCountdown(): Promise<void> {
        //Wait for all stage changes to complete
        await tick();

        //Return a promise that will resolve when the countdown is done
        return new Promise(async (resolve) => {
            //Set up timeouts to perform the countdown
            for (let i = 3; i >= 0; i--) {
                setTimeout(
                    () => {
                        if (currentPhase === RoundPhase.COUNTDOWN) {
                            countdownView.innerHTML = `${i}`;
                            beep?.play();
                            if (i == 0) {
                                resolve();
                            }
                        }
                    },
                    (3 - i) * countdownInterval,
                );
            }
        });
    }

    export async function start() {
        await tick();
        if (isDestroyed()) {
            //Generate an audio visualizer
            audioAnalyzer = new AudioMotionAnalyzer(visualizerView, {
                //Set source
                source: visualizerNode,

                //Do not connect speakers
                connectSpeakers: false,

                //Set options
                ...visualizerOptions,
            });

            //Make and use audio visualizer gradient
            audioAnalyzer.registerGradient(
                "visualizer-gradient",
                visualizerGradient,
            );
            audioAnalyzer.gradient = "visualizer-gradient";
        }
    }
</script>

<main class:small={isSmall}>
    {#if currentPhase === RoundPhase.COUNTDOWN}
        <!-- Countdown display -->
        <div id="countdown" bind:this={countdownView}></div>
    {:else if currentPhase === RoundPhase.PLAYING}
        <!-- Audio visualization -->
        <div
            id="visualizer-view"
            class:small={isSmall}
            bind:this={visualizerView}
        ></div>

        <!-- Song timer -->
        <div id="song-timer-view" class:small={isSmall}>
            <RoundProgressBar
                progress={1}
                duration={currentRoundDuration}
                gradientColors={progressGradientColors}
                gradientPositions={progressGradientPositions}
                baseThickness={isSmall ? 1.5 : 2}
                thickness={isSmall ? 7 : 10}
                easing={(t) => t}
            />
        </div>
    {/if}
</main>

<style>
    main {
        margin: 1.5rem;
        position: relative;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: max-content;
        height: 15rem;
    }
    main.small {
        height: 11rem;
    }
    #countdown {
        font-size: 14rem;
        max-height: 11.5rem;
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    #visualizer-view {
        height: 9rem;
        width: 9rem;
    }
    #visualizer-view.small {
        height: 6rem;
        width: 6rem;
    }
    #song-timer-view {
        position: absolute;
        top: 0;
        bottom: 0;
        margin: auto;
        margin-inline: 0px;
        width: 100%;
        height: 100%;
    }
</style>
