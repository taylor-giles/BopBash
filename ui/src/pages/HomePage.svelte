<script lang="ts">
    import GameAPI from "../../api/api";
    import { CurrentPage, Page } from "../../pageStore";
    import GameIdForm from "../components/GameIDForm.svelte";
    import SelectionButton from "../components/SelectionButton.svelte";
</script>

<main>
    <div id="selection-buttons-container">
        <div style="flex:1; width:0px; box-sizing:border-box;">
            <SelectionButton
                title="Find Game"
                description="Find and join public games made by other players"
                instruction="Get Started"
                on:click={() => CurrentPage.set(Page.FIND)}
            />
        </div>
        <div style="text-align: center;">-OR-</div>
        <div id="selection-buttons-container">
            <div style="width: 100%; box-sizing:border-box;">
                <SelectionButton
                    title="Create Game"
                    description="Start a new game from any playlist"
                    on:click={GameAPI.createGame}
                />
            </div>

        <div style="flex:1; width:0px; box-sizing:border-box;">
            <SelectionButton
                title="Create Game"
                description="Start a new game from a playlist of your choice"
                instruction="Get Started"
            />
        </div>
    </div>

    <GameIdForm />
</main>

<style>
    main {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
    }

    #selection-buttons-container {
        box-sizing: border-box;
        width: 100%;
        max-width: 700px;
        min-width: 440px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: stretch;
        gap: 25px;
    }
</style>
