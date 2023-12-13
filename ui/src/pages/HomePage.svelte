<script lang="ts">
    import GameIdForm from "../components/GameIDForm.svelte";
    import SelectionButton from "../components/SelectionButton.svelte";
</script>

<main>
    <div id="selection-buttons-container">
        <div style="flex:1; width:0px;">
            <SelectionButton
                title="Find Games"
                description="Find and join public games made by other players"
                instruction="Get Started"
            />
        </div>

        <div style="flex:1; width:0px;">
            <SelectionButton
                title="Create New Game"
                description="Start a new game from a playlist of your choice"
                instruction="Get Started"
            />
        </div>
    </div>

    <GameIdForm />
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
    }

    #selection-buttons-container {
        width: 100%;
        max-width: 700px;
        min-width: 430px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: stretch;
        gap: 25px;
    }

    #filler {
        flex: 1;
        height: 100%;
        width: 100%;
    }
</style>
