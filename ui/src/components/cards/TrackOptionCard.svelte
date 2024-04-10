<script lang="ts">
    import type { Track } from "../../../../shared/types";
    import { playClickSFX } from "../../../stores/audio";

    export let highlighted: boolean = false;
    export let track: Track;
</script>

<button type="button" class="text-button" class:highlighted on:mouseover on:click on:focus on:mouseup={playClickSFX}>
    <div id="title" class="body-text">
        {track.name}
    </div>
    <div id="artist" class="body-text">
        by <b>{track.artists.map((artist) => artist.name).join(", ")}</b>
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

    #title, #artist {
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
    #artist{
        font-size: 0.95rem;
        font-weight: 300;
    }
    #artist > b {
        font-weight: 600;
    }
</style>
