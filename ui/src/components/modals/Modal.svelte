<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { blur } from "svelte/transition";
    const dispatch = createEventDispatcher();

    //Determines whether or not the modal should close when the user clicks outside of its content
    export let closeOnBlur = true;

    let outerDiv: HTMLDivElement;

    /**
     * Fires the close event if the user clicks outside of the content
     * @param event
     */
    function handleCloseClick(event: MouseEvent) {
        if (event.target === outerDiv && closeOnBlur) {
            dispatch("close");
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    class="modal"
    transition:blur={{ duration: 150 }}
    on:click={handleCloseClick}
    bind:this={outerDiv}
>
    <div id="modal-content-wrapper" style="outline: none;" tabindex="-1">
        <slot />
    </div>
</div>

<style>
    .modal {
        position: fixed;
        left: 0;
        top: 0;
        width: 100dvw;
        height: 100dvh;
        background-color: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1rem;
        outline: none;
    }

    #modal-content-wrapper {
        max-width: 100%;
        max-height: 100%;
    }
</style>
