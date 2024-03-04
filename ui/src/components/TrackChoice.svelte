<script lang="ts">
    import type { TrackChoice } from "../../../shared/types";

    export let choice: TrackChoice;

</script>

<button on:click>
    <div class="title">
        {choice.name}
    </div>
    <div class="artist">
        <div>
            by
        </div>
        <b>{choice.artist}</b>
    </div>
</button>

<style>
    button {
        height: 100%;
        width: 100%;
        padding: 1rem;
        color: var(--primary-light);
        background-color: var(--background-color, var(--accent-dark));
        text-transform: none;
        border: 2px solid var(--primary-light);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0.35rem;
        transition: 0.35s;
    }
    button:hover {
        background-color: var(--spotify-green);
        color: var(--accent-dark);
        border-color: var(--accent);
    }

    .title {
        font-size: var(--title-size, 1.4rem);
        font-weight: 600;
    }

    .artist {
        font-size: 1rem;
        display: flex;
        flex-direction: row;
        gap: 8px;
        font-weight: 300;
    }
    .artist > b {
        font-weight: 600;
    }
</style>
