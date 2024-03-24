<script lang="ts">
    import type { PlaylistMetadata } from "../../../shared/types";
    import ExpandIcon from "svelte-material-icons/ChevronDown.svelte";
    import CollapseIcon from "svelte-material-icons/ChevronUp.svelte";
    import collapse from "svelte-collapse";
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let playlist: PlaylistMetadata;
    export let expanded = false;

    function handleSelect(e: Event) {
        e.stopPropagation();
        dispatch("select");
    }
</script>

<div id="main" class:expanded>
    <button
        id="header"
        class="text-button"
        on:click={() => (expanded = !expanded)}
    >
        <div id="img-container">
            <img
                id="playlist-img"
                src={playlist.images[0].url}
                alt={playlist.name}
            />
        </div>
        <div id="header-content">
            <div id="title" class="header-text">
                {playlist.name}
            </div>
            <div id="owner-container">
                <div id="owner-label">By</div>
                <div id="owner-content" class="header-text">
                    {playlist.owner.display_name}
                </div>
            </div>
        </div>
        <div id="btn-container">
            <div id="expand-icon">
                {#if expanded}
                    <CollapseIcon height="100%" width="100%" />
                {:else}
                    <ExpandIcon height="100%" width="100%" />
                {/if}
            </div>
            <button
                class:expanded
                on:click={handleSelect}
                id="select-btn-side"
                class="text-button select-btn"
            >
                Select
            </button>
        </div>
    </button>

    <div
        id="body"
        use:collapse={{ open: expanded, duration: 0.3, easing: "ease" }}
    >
        <div id="center-content">
            <div class="description-row-container">
                <div class="description-label">Full Title:</div>
                <div id="full-title">
                    {playlist.name}
                </div>
            </div>
            <div class="description-row-container">
                <div class="description-label">Owner:</div>
                <div id="full-owner">
                    {playlist.owner.display_name}
                </div>
            </div>
            <div id="description-container">
                <div class="description-label">Description:</div>
                {#if playlist.description.length > 0}
                    <div id="description-content">
                        <!-- Some descriptions have anchor tags - this extracts the content from them -->
                        {playlist.description.replace(
                            /<a\s*[^>]*>(.*?)<\/a>/g,
                            "$1",
                        )}
                    </div>
                {:else}
                    <em id="description-content">No description available.</em>
                {/if}
            </div>
        </div>
    </div>
    <div id="footer">
        {#if expanded}
            <div id="tracks-count">
                {playlist.tracks.total} Tracks
            </div>
        {/if}

        <button
            class:expanded
            on:click={handleSelect}
            id="select-btn-bottom"
            class="text-button select-btn"
        >
            Select
        </button>
    </div>
</div>

<style>
    #main {
        width: 100%;
        height: 100%;
        background-color: rgba(50, 50, 50, 0.5);
        border-radius: 5px;
        padding: 20px;
        color: var(--primary-light);
        font-size: 1rem;
        font-weight: 300;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0px;
        transition: gap 0.5s;
    }
    #main.expanded {
        gap: 15px;
    }
    #center-content {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    #header {
        font-weight: inherit;
        font-family: inherit;
        background-color: transparent;
        text-transform: inherit;
        color: inherit;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        flex: 1;
        gap: 15px;
        width: 100%;
    }
    #header-content {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
    }

    #footer {
        display: flex;
        flex-direction: row;
        width: 100%;
    }

    #playlist-img {
        width: 5rem;
        height: 5rem;
    }

    #title {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        font-size: 1.2rem;
        line-height: 1.25;
        font-weight: 700;
        text-overflow: ellipsis;
        overflow: hidden;
        text-align: left;
    }

    #body {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .description-row-container {
        display: flex;
        flex-direction: row;
        gap: 8px;
    }

    #description-container {
        display: flex;
        flex-direction: column;
        line-height: 1.35;
        font-size: 1rem;
        flex: 1;
    }
    #description-content {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        word-break: break-word;
    }
    .description-label {
        font-weight: 600;
        white-space: nowrap;
    }

    #expand-icon {
        height: 1.5rem;
        width: 1.5rem;
    }

    #owner-container {
        display: flex;
        flex-direction: row;
        gap: 0.4rem;
        align-items: flex-end;
    }
    #owner-label {
        font-size: 0.8rem;
    }
    #owner-content {
        font-weight: 600;
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        word-break: break-word;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
    }

    #tracks-count {
        font-weight: 400;
        flex: 1;
    }

    #footer {
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: flex-end;
        align-items: flex-end;
    }

    #btn-container {
        display: flex;
        flex-direction: row;
        gap: 10px;
        align-items: center;
    }

    .select-btn {
        height: max-content;
        border: 2px solid var(--primary-light);
        padding: 0.5rem;
        color: var(--primary-light);
    }
    .select-btn:hover {
        color: var(--spotify-green);
        border-color: var(--spotify-green);
    }

    #select-btn-bottom {
        width: 100%;
        display: none;
        transition: all 0.3s ease;
    }
    #select-btn-bottom.expanded {
        width: 6.5rem;
    }

    #select-btn-side {
        width: 6.5rem;
        display: block;
    }

    @media (max-width: 600px) {
        #select-btn-side {
            display: none;
        }
        #select-btn-bottom {
            display: block;
        }
        #main {
            gap: 3px;
        }
    }
</style>
