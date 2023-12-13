<script lang="ts">
    import { IFrameAPI } from "../../IFrameAPI";

    let iframe: HTMLIFrameElement;

    IFrameAPI.subscribe((api: any) => {
        if (api !== null) {
            console.log(`IFrameAPI:`, api);
            const element = iframe;
            const options = {
                uri: "spotify:track:02MiyVckOBtygUOEDnV7Pd",
            };
            const callback = (EmbedController: any) => {
                console.log("EmbedController: ", EmbedController);
                EmbedController.addListener("ready", () => {
                    // EmbedController.play();
                });
            };
            api.createController(element, options, callback);

            console.log(iframe.contentDocument || (iframe as any).contentWindow.document)
        }
    });
</script>

<main>
    <button
        on:click={() => {
            console.log("hi");
        }}
    >
        Play the song
    </button>

    <iframe title="Spotify-provided embedded song" sandbox="allow-scripts" bind:this={iframe}></iframe>
</main>

<style>
</style>
