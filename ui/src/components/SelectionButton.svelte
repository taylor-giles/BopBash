<script lang="ts">
    import { playClickSFX } from "../../stores/audio";

    export let title: string;
    export let description: string = "";
    export let instruction: string = "";
</script>

<button on:click on:mouseup={playClickSFX}>
    <div class="title">
        {title}
    </div>
    {#if description}
        <div class="body-text description">
            {description}
        </div>
    {/if}
    {#if instruction}
        <div class="instruction">
            {instruction}
        </div>
    {/if}
</button>

<style>
    button {
        height: 100%;
        width: 100%;
        padding: 20px;
        background-color: var(--primary-light);
        text-transform: none;
        border: none;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 10px;
        transition: 0.35s;
    }

    .title {
        color: var(--dark-accent);
        font-size: 1.5rem;
        font-weight: 600;
    }
    .description {
        flex: 1;
        color: var(--dark-accent);
        font-size: 1rem;
        font-weight: 100;
    }
    .instruction {
        color: var(--spotify-green);
        font-size: 0.9rem;
        font-weight: 300;
        margin-top: 0px;
    }
</style>
