<script lang="ts">
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();
    import { GAME_ID_REGEX } from "../../../shared/constants";
    import GameAPI from "../../api/api";
    import { GameStore } from "../../gameStore";

    let gameId = "";
    let failed = false;
    let failText = "";

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
    <div id="join-game-label" class="header-text">Join Game</div>
    <div id="description" class="body-text">
        Join a friend's game by entering the game ID below
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

        <button type="submit" id="submit-btn"> Join Game </button>
    </form>
</main>

<style>
    main {
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 5px;
        flex-shrink: 0;
        padding: 30px;
        border-radius: 10px;
        box-sizing: border-box;
        width: max-content;
        max-width: 900px;
        margin: 20px;
    }

    form {
        display: contents;
    }

    #join-game-label {
        font-size: 20pt;
        color: white;
        font-weight: 600;
    }

    #description {
        color: var(--primary-light);
    }

    #gameid-input {
        height: 50px;
        background-color: var(--primary-light);
        color: var(--accent);
        font-size: 18pt;
        font-weight: 700;
        width: 100%;
        border: none;
        border-radius: 1px;
        padding: 5px;
        padding-inline: 10px;
        box-sizing: border-box;
        text-align: center;
        margin-top: 5px;
    }
    #gameid-input::placeholder {
        color: var(--primary-dark);
    }

    #fail-text {
        color: rgb(255, 50, 50);
    }

    #submit-btn {
        font-size: 13pt;
        margin-top: 5px;
        border-radius: 1px;
        width: 100%;
    }
</style>
