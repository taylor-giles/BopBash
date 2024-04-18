<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Modal from "./Modal.svelte";
    import AlertIcon from "svelte-material-icons/AlertOutline.svelte";
    const dispatch = createEventDispatcher();

    export let errorMsg = "";
</script>

<Modal on:close>
    <main>
        <div id="error-modal-content">
            <div id="alert-icon">
                <AlertIcon width="60px" height="60px" />
            </div>
            <div id="error-msg-content">
                {errorMsg}
            </div>
        </div>

        <button on:click={() => dispatch("close")}> Close </button>
    </main>
</Modal>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: var(--accent-dark);
        padding: 1.5rem;
        border: 2px solid gray;
        border-radius: 12px;
        gap: 15px;
        max-width: 50rem;
    }
    #error-modal-content {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        font-size: 1.2rem;
        width: 100%;
        padding: 0.5rem;
    }
    #error-msg-content {
        flex: 1;
        min-width: 15rem;
    }
    #alert-icon {
        color: var(--red);
    }
</style>
