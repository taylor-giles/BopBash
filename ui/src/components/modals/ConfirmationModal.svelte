<script lang="ts">
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let headerText = "CONFIRM";
    export let bodyText = "";
    export let yesText = "Yes";
    export let noText = "No";
</script>

<main class="modal">
    <div id="content">
        <div id="header" class="header-text">
            {headerText}
        </div>
        <div id="body" class="body-text">
            {bodyText}
        </div>

        <div id="button-container">
            <button id="no-btn" on:click={() => dispatch("no")}>
                {noText}
            </button>
            <button id="yes-btn" on:click={() => dispatch("yes")}>
                {yesText}
            </button>
        </div>
    </div>
</main>

<style>
    #content {
        width: max-content;
        height: max-content;
        padding: 2.8rem;
        background-color: var(--accent-dark);
        border-radius: 12px;
        border: 1px solid gray;
        color: var(--primary-light);
    }

    #header {
        font-size: 1.5rem;
        font-weight: 800;
    }

    #body {
        font-size: 1.3rem;
        font-weight: 400;
    }

    #button-container {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-top: 20px;
    }
    button {
        border: 1px solid var(--primary-dark);
    }
</style>
