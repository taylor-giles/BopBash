<script lang="ts">
    import { BG_AUDIO } from "../../stores/audio";
    import { CurrentPage, Page } from "../../stores/pageStore";
    import GameIdForm from "../components/forms/GameIDForm.svelte";
    import SelectionButton from "../components/SelectionButton.svelte";

    //Play background music
    $BG_AUDIO.play();
</script>

<main>
    <div id="content">
        <div style="flex: 1;">
            <GameIdForm />
        </div>
        <div id="separator">-OR-</div>
        <div id="selection-buttons-container">
            <div style="width: 100%; box-sizing:border-box;">
                <SelectionButton
                    title="Create Game"
                    description="Start a new game from any playlist"
                    on:click={() => CurrentPage.set(Page.CREATE)}
                />
            </div>

            <div style="width: 100%; box-sizing:border-box;">
                <SelectionButton
                    title="Find Game"
                    description="Find and join public games"
                    on:click={() => CurrentPage.set(Page.FIND)}
                />
            </div>
        </div>
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        height: 100%;
    }

    #content {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        height: max-content;
        gap: 30px;
        max-width: 1050px;
        width: 100%;
        flex-wrap: wrap;
    }

    #selection-buttons-container {
        flex: 1;
        width: max-content;
        max-width: 700px;
        min-width: 300px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 25px;
    }

    #separator {
        text-align: center;
    }
    @media(max-width: 860px) {
        #separator {
            width: 100%;
        }
    }
</style>
