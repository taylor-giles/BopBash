<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Modal from "./Modal.svelte";
    import CloseIcon from "svelte-material-icons/Close.svelte";
    import { GAME_TYPES } from "../../game-types";
    import { GAME_TYPE_OPTIONS } from "../../../../shared/types";
    import { READY_TIMEOUT } from "../../../../shared/constants";
    const dispatch = createEventDispatcher();

    window.localStorage.setItem("seen-help", "true");
</script>

<Modal on:close>
    <main>
        <div id="title">How to Play</div>

        <ol>
            <li class="step">
                <div class="step-title">Join a Game</div>
                <div class="step-content">
                    Join an existing game or create a new one from the home
                    page. When creating a game, you can choose any public
                    Spotify playlist to draw music from, and customize game
                    options.
                </div>
            </li>
            <li class="step">
                <div class="step-title">Ready Up!</div>
                <div class="step-content">
                    The game will begin once enough players in lobby are ready.
                </div>
            </li>
            <li class="step">
                <div class="step-title">Gameplay</div>
                <div class="step-content">
                    Each round, a song from the chosen playlist will play. Guess
                    the song as quickly as possible to earn points.
                    <br /> There are {GAME_TYPE_OPTIONS.length} different game types:
                    <ul>
                        {#each Object.values(GAME_TYPES) as type}
                            <li class="type">
                                <div class="type-title">
                                    {type.name}
                                </div>
                                <div class="type-content">
                                    {type.instructions}
                                </div>
                            </li>
                        {/each}
                    </ul>
                </div>
            </li>
        </ol>

        <div id="closer" class="header-text">
            Have fun!
        </div>

        <div style="flex: 1; width: 100%;">
            <div id="tips-title">Tips:</div>
            <ul>
                <li>
                    In all game types, faster answers earn more points, so be
                    quick!
                </li>
                <li>
                    When playing with friends in-person, try playing audio from just one player's device, to avoid confusion.
                </li>
            </ul>
        </div>

        <button
            on:click={() => {
                dispatch("close");
            }}
        >
            Got it!
        </button>

        <button
            id="close-btn"
            class="text-button"
            on:click={() => {
                dispatch("close");
            }}
        >
            <CloseIcon height="1.5rem" width="1.5rem" />
        </button>
    </main>
</Modal>

<style>
    main {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        background-color: var(--accent-dark);
        padding: 2rem;
        border: 2px solid gray;
        border-radius: 12px;
        width: 90dvw;
        height: 90dvh;
        max-width: 1000px;
        overflow-y: auto;
        gap: 1.2rem;
    }

    ol,
    ul {
        width: 100%;
        padding-left: 1rem;
        margin: 0px;
        flex: 1;
    }

    .step {
        width: 100%;
        padding: 0.5rem;
    }

    .step-title,
    #tips-title {
        font-size: 1.1rem;
        font-weight: 700;
    }

    .type {
        padding: 0.2rem;
    }

    .type-title {
        font-size: 1rem;
        font-weight: 700;
    }

    #title {
        font-size: 1.5rem;
        font-weight: 800;
    }

    #closer {
        font-size: 1.5rem;
        font-weight: 600;
        flex: 1;
        height: 50px;
        display: flex;
        align-items: center;
    }

    #close-btn {
        position: absolute;
        top: 1.5rem;
        left: 1.5rem;
    }
</style>
