<script lang="ts">
    export let title: string;
    export let description: string = "";
    export let instruction: string = "";
</script>

<button>
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
        width: max-content;
        max-width: 100%;
        padding: 25px;
        background-color: rgba(0, 0, 0, 0.5);
        text-transform: none;
        border: none;
        display: flex;
        flex-direction: column;
        gap: 10px;
        transition: 0.35s;
    }

    .title {
        color: white;
        font-size: 20pt;
        font-weight: 600;
    }
    .description {
        color: white;
        font-size: 14pt;
        font-weight: 100;
    }
    .instruction {
        color: var(--primary-light);
        font-size: 12pt;
        font-weight: 300;
        margin-top: 0px;
    }


</style>
