<script lang="ts">
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let guessTrackId: string;
    export let disabled: boolean;
    export let guessArtistId: string;
</script>

<form on:submit>
    <div class="input-container">
        <label for="track-input" class="body-text"> Track: </label>
        <input
            id="track-input"
            class="header-text"
            type="text"
            placeholder="Enter track guess here"
            bind:value={guessTrackId}
            {disabled}
        />
    </div>

    <div class="input-container">
        <label for="artist-input" class="body-text"> Artist: </label>
        <input
            id="artist-input"
            class="header-text"
            type="text"
            placeholder="Enter artist guess here"
            bind:value={guessArtistId}
            {disabled}
        />
    </div>

    <div id="button-container">
        <button
            type="button"
            id="skip-btn"
            class="submission-btn"
            on:click={() => dispatch("skip")}
            {disabled}
        >
            Skip
        </button>
        <button type="submit" id="submit-btn" class="submission-btn" {disabled}>
            Submit
        </button>
    </div>
</form>

<style>
    form {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: max-content;
        gap: 15px;
    }

    #button-container {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 3rem;
    }

    .input-container {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    label {
        font-size: 1.1rem;
    }

    .submission-btn {
        width: 7rem;
    }

    input {
        font-size: 1.1rem;
        font-weight: 700;
        border-radius: 1px;
        padding-inline: 10px;
        border: 1px solid var(--primary-light);
        height: 2.5rem;
        overflow-x: auto;
        background-color: var(--primary-light);
    }
</style>
