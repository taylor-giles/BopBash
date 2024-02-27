<script lang="ts">
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    //Determines whether or not the modal should close when the user clicks outside of its content
    export let closeOnBlur = true;

    /**
     * Closes the modal when content loses focus
     * @param event The blur event
     */
    function handleBlur(
        event: FocusEvent & {
            currentTarget: EventTarget & HTMLDivElement;
        },
    ) {
        if (closeOnBlur && !event.currentTarget?.contains(event.relatedTarget as Node)) {
            dispatch("close");
        }
    }
</script>

<div class="modal">
    <!-- svelte-ignore a11y-autofocus -->
    <div id="modal-content-wrapper" style="outline: none;" tabindex="-1" autofocus on:blur={handleBlur}>
        <slot />
    </div>
</div>
