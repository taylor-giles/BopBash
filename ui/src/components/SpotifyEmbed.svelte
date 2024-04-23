<script lang="ts">
    import { Stretch } from "svelte-loading-spinners";
    import { onMount, tick } from "svelte";
    import { IFrameAPI } from "../../stores/IFrameAPI";
    import { BG_AUDIO } from "../../stores/audio";

    export let uri: string;
    export let height: string = "100%";
    export let width: string = "100%";
    export let title: string = "Spotify embedded element";

    let iframe: HTMLIFrameElement;
    let mainElement: HTMLDivElement;
    let isLoading: boolean = true;
    let mainHeight: string = "100%";

    /**
     * Load the embedded content into the iframe
     */
    async function load() {
        isLoading = true;

        //Compute height of containing div
        let parentHeight = mainElement.parentElement?.offsetHeight ?? 400;
        mainHeight = parentHeight < 152 ? "80px" : (parentHeight < 352 ? "152px" : "100%");

        //Construct IFrameAPI request
        let options = {
            uri: uri,
            height: height,
            width: width,
        };

        //Make the embed
        $IFrameAPI.createController(iframe, options, (controller: any) => {
            //Make sure background music does not play while embedded element is playing
            controller.onPlaybackUpdate = (playbackState: any) => {
                if (!$BG_AUDIO.paused) {
                    if (playbackState.isPaused) {
                        $BG_AUDIO.play();
                    } else {
                        $BG_AUDIO.pause();
                    }
                }
            };

            //When ready, get rid of loading background
            controller.addListener("ready", () => {
                isLoading = false;
            });
        });
    }

    onMount(load);
</script>

<div id="main" bind:this={mainElement} style="height: {mainHeight};">
    <iframe bind:this={iframe} {title} />

    <!-- Spinner -->
    {#if isLoading}
        <div id="loading-spinner">
            <Stretch color="var(--primary-light)" />
        </div>
    {/if}
</div>

<style>
    #main {
        position: relative;
        height: 100%;
        width: 100%;
    }
    #loading-spinner {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: -1;
    }
    iframe {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 100%;
    }
</style>
