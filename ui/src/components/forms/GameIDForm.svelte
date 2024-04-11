<script lang="ts">
    import { GAME_ID_REGEX } from "../../../../shared/constants";
    import GameAPI from "../../../api/api";
    import { playClickSFX } from "../../../stores/audio";

    let gameId = "";
    let failed = false;
    let failText = "";

    /**
     * Submits the form by attempting to join game via API call
     */
    async function handleSubmit(e: Event) {
        e.preventDefault();

        //Input validation
        if (GAME_ID_REGEX.test(gameId)) {
            GameAPI.joinGame(gameId).then((errorMsg) => {
                if (errorMsg) {
                    failed = true;
                    failText = `Unable to join game`;
                }
            });
        } else {
            failed = true;
            failText = "Please provide a valid game ID.";
        }
    }

    //Reset failure message when text is edited
    $: {
        gameId;
        failText = "";
        failed = false;
    }
</script>

<main>
    <div id="title" class="header-text">Join Game</div>
    <div id="description" class="body-text">
        Join any game by entering its ID here
    </div>
    <div
        id="fail-text"
        class="body-text"
        style={`visibility: ${failed ? "visible" : "collapse"}`}
    >
        {failText}
    </div>

    <form on:submit={handleSubmit}>
        <input
            id="gameid-input"
            class="header-text"
            type="text"
            placeholder="---  Game ID  ---"
            bind:value={gameId}
        />

        <button type="submit" id="submit-btn" on:mouseup={playClickSFX}> Join Game </button>
    </form>
</main>

<style>
    main {
        background-color: var(--accent-overlay);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 5px;
        flex-shrink: 0;
        padding: 1.5rem;
        border-radius: 10px;
        border: 1px solid gray;
        width: 100%;
        min-width: 21.5rem;
        height: 100%;
    }

    form {
        display: contents;
    }

    #title {
        font-size: 1.5rem;
        color: var(--primary-light);
        font-weight: 600;
    }

    #description {
        color: var(--primary-light);
    }

    #gameid-input {
        height: 2.8rem;
        background-color: var(--primary-light);
        color: var(--accent);
        font-size: 1.3rem;
        font-weight: 700;
        width: 100%;
        border: none;
        border-radius: 1px;
        padding: 5px;
        padding-inline: 0px;
        text-align: center;
        margin-top: 5px;
    }
    #gameid-input::placeholder {
        color: var(--primary-dark);
    }

    #fail-text {
        color: var(--red);
    }

    #submit-btn {
        font-size: 1rem;
        margin-top: 5px;
        border-radius: 1px;
        width: 100%;
    }
</style>
