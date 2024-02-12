<script lang="ts">
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    /**
     * Closes the modal when content loses focus
     * @param event The blur event
     */
    function handleBlur(
        event: FocusEvent & {
            currentTarget: EventTarget & HTMLDivElement;
        },
    ) {
        if (!event.currentTarget?.contains(event.relatedTarget as Node)) {
            dispatch("close");
        }
    }
</script>

<div class="modal">
    <!-- svelte-ignore a11y-autofocus -->
    <div id="modal-content-wrapper" tabindex="-1" autofocus on:blur={handleBlur}>
        <slot />
    </div>
</div>
