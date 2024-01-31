<script lang="ts">
    import PlayIcon from "svelte-material-icons/Play.svelte";
    import PauseIcon from "svelte-material-icons/Pause.svelte";
    import SeekBackIcon from "svelte-material-icons/Rewind5.svelte";
    import SeekForwardIcon from "svelte-material-icons/FastForward5.svelte";
    import VolumeIcon from "svelte-material-icons/VolumeHigh.svelte";
    import MuteIcon from "svelte-material-icons/VolumeOff.svelte";

    export let audio: HTMLAudioElement;
    export let volumeLevel: number = 0.5;
    let volumeOpen: boolean = false;    //Determines if the volume slider should be shown
    let newVolumeOpen: boolean = true; //Used to avoid button press immediately undoing the effects of on:blur
    let isPaused: boolean = true;

    function togglePlay() {
        audio.paused ? audio.play() : audio.pause();
    }

    function handleSeekBack() {
        audio.currentTime = Math.max(0, audio.currentTime - 5);
        audio.play();
    }

    function handleSeekForward() {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
        audio.play();
    }

    // Adjust audio volume when volume level changes
    $: audio.volume = volumeLevel;

    //Ensure isPaused stays updated
    audio.onpause = audio.onplay = () => {
        isPaused = audio.paused;
    };
</script>

<main>
    <div id="buttons-container">
        <button id="back-btn" on:click={handleSeekBack}>
            <SeekBackIcon width="100%" height="100%" />
        </button>
        <button id="play-pause-btn" on:click={togglePlay}>
            {#if isPaused}
                <PlayIcon width="100%" height="100%" />
            {:else}
                <PauseIcon width="100%" height="100%" />
            {/if}
        </button>
        <button id="forward-btn" on:click={handleSeekForward}>
            <SeekForwardIcon width="100%" height="100%" />
        </button>
        <button
            id="volume-btn"
            on:mousedown={() => (newVolumeOpen = !volumeOpen)}
            on:click={() => (volumeOpen = newVolumeOpen)}
            class:activated={volumeOpen}
        >
            {#if volumeLevel <= 0}
                <MuteIcon width="100%" height="100%" />
            {:else}
                <VolumeIcon width="100%" height="100%" />
            {/if}
        </button>
    </div>

    {#if volumeOpen}
        <!-- svelte-ignore a11y-autofocus -->
        <input
            autofocus
            class="slider"
            type="range"
            min="0"
            max="1"
            step="0.1"
            bind:value={volumeLevel}
            on:blur={() => (volumeOpen = false)}
        />
    {/if}
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: min-content;
        gap: 5px;
    }

    #buttons-container {
        display: flex;
        flex-direction: row;
        height: max-content;
        width: max-content;
        gap: 0.5rem;
        justify-content: space-between;
    }

    button {
        padding: 0.1rem;
        height: 1.7rem;
        width: 1.7rem;
        background-color: transparent;
        color: var(--color, inherit);
        border-radius: 100%;
    }
    button:disabled {
        color: var(--disabled-color, gray);
    }
    button:hover:enabled {
        background-color: transparent;
        color: var(--hover-color, white);
    }
    button.activated {
        background-color: var(--color, white);
        color: var(--hover-color, black);
    }
    button.activated:hover:enabled {
        background-color: var(--color, white);
        color: var(--hover-color, black);
    }

    .slider {
        min-width: 0%;
        width: 100%;
        color: var(--hover-color, black);
    }
</style>
