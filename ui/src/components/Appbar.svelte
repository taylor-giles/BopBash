<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SettingsIcon from "svelte-material-icons/Cog.svelte";
    import HelpIcon from "svelte-material-icons/HelpCircle.svelte";
    import { CurrentPage, Page } from "../../stores/pageStore";
    const dispatch = createEventDispatcher();
</script>

<main>
    <img src="bop-bash-logo-clean.svg" height="100%" alt="logo" />

    <div id="buttons-container">
        {#if $CurrentPage !== Page.LOGIN}
            <button
                on:click={() => {
                    dispatch("helpclick");
                }}
            >
                <HelpIcon />
            </button>
            <button
                on:click={() => {
                    dispatch("settingsclick");
                }}
            >
                <SettingsIcon />
            </button>
        {/if}
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding-inline: 15px;
        background-color: rgba(30, 30, 30, 0.9);
        height: 3rem;
        font-size: 1.6rem;
    }

    #buttons-container {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
        align-items: center;
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
