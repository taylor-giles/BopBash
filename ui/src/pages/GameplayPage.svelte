<script lang="ts">
    import { tick } from "svelte";
    import GameAPI from "../../api/api";
    import { GameStore } from "../../gameStore";

    enum RoundPhase {
        COUNTDOWN,
        PLAYING,
    }

    const beep = new Audio(
        "data:audio/wav;base64,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",
    );

    let isGameDone = false;

    let currentPhase: RoundPhase = RoundPhase.COUNTDOWN;
    let currentRound = 0;
    let audioLoaded: boolean = false;
    let audioURL;

    let audioElement: HTMLAudioElement;
    let countdownView: HTMLDivElement;

    //Keep track of how much time has passed in the audio
    let timestamp = -1;
    $: if (audioElement) {
        timestamp = audioElement.currentTime;
    }

    //When ready to play, start the round
    $: if (audioLoaded) {
        doCountdown().then(startPlayingPhase);
    }

    //Update audio URL whenever currentRound updates
    $: currentRound, updateAudioURL();
    async function updateAudioURL() {}

    async function nextRound() {
        if (currentRound < $GameStore.numRounds - 1) {
            currentRound += 1;
            audioLoaded = false;
        } else {
            audioElement.pause();
            isGameDone = true;
        }
    }

    /**
     * Display a pre-round-start countdown
     */
    async function doCountdown(): Promise<void> {
        //Wait for all stage changes to complete
        await tick();

        return new Promise((resolve) => {
            //Set up timeouts to perform the countdown
            for (let i = 3; i >= 0; i--) {
                setTimeout(
                    () => {
                        countdownView.innerHTML = `${i}`;
                        beep.play();

                        if (i == 0) {
                            resolve();
                        }
                    },
                    (3 - i) * 500,
                );
            }
        });
    }

    console.log("t");

    /**
     * Begins the playing phase
     */
    function startPlayingPhase() {
        currentPhase = RoundPhase.PLAYING;
        audioElement.play();
    }
</script>

<main>
    <!-- Start the round, and get the audio URL from the response -->
    {#await GameAPI.startRound(currentRound) then audioURL}
        <audio
            bind:this={audioElement}
            on:canplay={() => (audioLoaded = true)}
            on:timeupdate={(event) => {
                timestamp = event.currentTarget.currentTime;
            }}
        >
            <source src={audioURL} type="audio/mpeg" />
        </audio>
    {/await}

    {#if isGameDone}
        <div id="done-screen">Done!</div>
    {:else}
        <div id="countdown" bind:this={countdownView}></div>
    {/if}
    <div style="flex: 1;"></div>
    <button on:click={nextRound}>Next round</button>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
    }

    #countdown {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 300px;
    }

    #done-screen {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 300px;
    }
</style>
