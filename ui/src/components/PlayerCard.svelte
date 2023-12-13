<script lang="ts">
    import CheckIcon from "svelte-material-icons/CheckCircle.svelte";
    import WaitingIcon from "svelte-material-icons/ProgressClock.svelte";
    import type { PlayerState } from "../../../shared/types";

    export let player: PlayerState;
    export let highlight: boolean;
</script>

<main class:highlighted={highlight}>
    {#if player?.isReady}
        <CheckIcon color={highlight ? "black" : "white"}/>
    {:else}
        <WaitingIcon color={highlight ? "gray" : "gray"}/>
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
        padding: 20px;
        justify-content: center;
        align-items: center;
        font-size: 18pt;
    }
    main.highlighted {
        background-color: rgba(255, 255, 255, 0.7);
        color: black;
    }
</style>
