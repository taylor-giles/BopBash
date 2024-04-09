<script lang="ts">
    import CheckIcon from "svelte-material-icons/CheckCircle.svelte";
    import WaitingIcon from "svelte-material-icons/ProgressClock.svelte";
    import type { PlayerState } from "../../../../shared/types";

    export let player: PlayerState;
    export let highlight: boolean;
</script>

<main class:highlighted={highlight}>
    {#if player?.isReady}
        <CheckIcon color="white" />
    {:else}
        <WaitingIcon color="gray" />
    {/if}

    {player.name}
</main>

<style>
    main {
        display: flex;
        flex-direction: row;
        gap: 10px;
        border-radius: 10px;
        background-color: rgba(50, 50, 50, 0.5);
        color: white;
        width: max-content;
        padding: 0.9rem;
        justify-content: center;
        align-items: center;
        font-size: 1rem;
    }
    main.highlighted {
        /* background-color: rgba(235, 235, 235, 0.7);
        color: black; */
        color: var(--spotify-green);
    }
</style>
