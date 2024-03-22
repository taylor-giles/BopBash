<script lang="ts">
    import type { ComponentType } from "svelte";
    import Modal from "./Modal.svelte";
    import { Pulse } from 'svelte-loading-spinners';

    export let spinner: ComponentType = Pulse;
    export let message = "Loading";
    export let color="white";
</script>

<Modal>
    <main>
        <svelte:component this={spinner} {color}/>
        {message}
    </main>
</Modal>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 30px;
        font-size: 1.2rem;
    }
</style>
