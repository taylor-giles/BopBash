<script lang="ts">
    import { CurrentPage, Page } from "../../pageStore";
    import GameIdForm from "../components/GameIDForm.svelte";
    import SelectionButton from "../components/SelectionButton.svelte";
</script>

<main>
    <div id="content">
        <div style="flex: 1;">
            <GameIdForm />
        </div>
        <div style="text-align: center;">-OR-</div>
        <div id="selection-buttons-container">
            <div style="width: 100%; box-sizing:border-box;">
                <SelectionButton
                    title="Create Game"
                    description="Start a new game from any playlist"
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
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        height: 100%;
    }

    #content {
        box-sizing: border-box;
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
        box-sizing: border-box;
        width: max-content;
        max-width: 700px;
        min-width: 300px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 25px;
    }
</style>
