<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SettingsIcon from "svelte-material-icons/Cog.svelte";
    import { playClickSFX } from "../../stores/audio";
    const dispatch = createEventDispatcher();
</script>

<main>
    <img src="bop-bash-logo.svg" height="100%" alt="logo"/>
    <button
        on:click={() => {
            dispatch("settingsclick");
        }}
        on:mouseup={playClickSFX}
    >
        <SettingsIcon />
    </button>
</main>

<style>
    main {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding-inline: 15px;
        background-color: rgba(0, 0, 0, 0.9);
        height: 3rem;
        font-size: 1.6rem;
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
</style>
