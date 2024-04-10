<script lang="ts">
    import type { Artist } from "../../../../shared/types";
    import { playClickSFX } from "../../../stores/audio";

    export let highlighted: boolean = false;
    export let artist: Artist;
</script>

<button type="button" class="text-button" class:highlighted on:click on:mouseover on:focus on:mouseup={playClickSFX}>
    <div id="title" class="body-text">
        {artist.name}
    </div>
</button>

<style>
    button {
        width: 100%;
        height: var(--height, 4rem);
        color: var(--accent-dark);
        text-transform: none;
        padding-inline: 10px;
        border: 1px solid black;
        border-radius: 0px;
        transition-duration: 0.1s;
    }
    button.highlighted {
        outline: 3px solid var(--spotify-green);
    }
    button:hover {
        color: var(--accent);
    }

    #title {
        text-align: start;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        word-break: break-word;
    }
    #title {
        font-size: 1.05rem;
        font-weight: 700;
    }
</style>
