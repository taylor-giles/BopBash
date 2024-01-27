<script lang="ts">
    import CheckIcon from "svelte-material-icons/CheckCircle.svelte";
    import CheckOutlineIcon from "svelte-material-icons/CheckCircleOutline.svelte";
    import CopyIcon from "svelte-material-icons/ContentCopy.svelte";
    import type { GameState, PlayerState } from "../../../shared/types";
    import { IFrameAPI } from "../../IFrameAPI";
    import { GameStore, GameConnection } from "../../gameStore";
    import GameAPI from "../../api/api";
    import PlayerCard from "../components/PlayerCard.svelte";
    import { CurrentPage, Page } from "../../pageStore";
    import ConfirmationModal from "../components/ConfirmationModal.svelte";
    import { onMount, tick } from "svelte";

    //Maintain a reference to the current state of the game
    let gameState: GameState;
    GameStore.subscribe((value) => {
        gameState = value;
    });

    //Maintain a reference to the current state of this player
    $: myPlayerState = gameState.players[$GameConnection.playerId];

    //Show the playlist in an embedded iframe once everything is loaded
    let embed: HTMLIFrameElement;

    //Maintain a list of players and count of ready players
    let playerList: PlayerState[];
    let numReadyPlayers = 0;
    $: {
        playerList = Object.values(gameState?.players ?? {});
        numReadyPlayers = playerList.reduce((prevCount, player) => {
            return prevCount + (player.isReady ? 1 : 0);
        }, 0);
    }

    //Modal opens iff this is true
    let isModalOpen = false;

    //Text shown around game ID
    let gameIdText = "Ask your friends to join!";
    let gameIdTextClass = "";

    /**
     * Toggle player's ready state
     */
    function toggleReady() {
        console.log(myPlayerState);
        if (myPlayerState.isReady) {
            GameAPI.unreadyPlayer();
        } else {
            GameAPI.readyPlayer();
        }
    }

    /**
     * Removes this player from this game and leaves this page
     */
    function leave() {
        GameAPI.leaveGame();
        CurrentPage.set(Page.HOME);
    }

    /**
     * Copies the game ID to clipboard
     */
    function handleCopy() {
        navigator.clipboard.writeText(gameState.id);
        gameIdText = "Game ID copied!";
        gameIdTextClass = "activated";
        setTimeout(() => {
            gameIdText = "Ask your friends to join!";
            gameIdTextClass = "";
        }, 5000);
    }

    /**
     * Render the embedded playlist using the Spotify IFrameAPI
     */
    async function renderEmbed() {
        console.log("Rendering");
        await tick();

        //Render new embed with IFrameAPI
        let contentWidth = window.innerWidth;
        let contentHeight = embed.getBoundingClientRect().height;
        console.log(contentWidth, contentHeight);
        let options = {
            uri: `spotify:playlist:${gameState.playlist.id}`,
            height: `100%`,
        };
        let callback = (EmbedController: any) => {
            EmbedController.addListener("ready", () => {
                console.log("Embed controller is ready");
            });
        };
        $IFrameAPI.createController(embed, options, callback);
    }
    onMount(renderEmbed);
</script>

<main>
    <div id="content">
        <div id="embed-section">
            <div class="section-title">
                <div class="label body-text">Game Playlist:</div>
                <div class="title header-text">
                    {gameState?.playlist?.name}
                </div>
            </div>
            <div id="embed-container">
                <iframe
                    bind:this={embed}
                    title="Spotify-provided embedded playlist"
                />
            </div>
        </div>
        <div id="players-section">
            <div class="section-title header-text">
                Players ({numReadyPlayers}/{playerList.length} Ready)
            </div>
            <div id="players-container">
                <div id="players-content">
                    {#each playerList as player}
                        <PlayerCard
                            {player}
                            highlight={player === myPlayerState}
                        />
                    {/each}
                </div>
            </div>
        </div>
    </div>
    <div id="footer">
        <button id="leave-btn" on:click={() => (isModalOpen = true)}>
            &lt Leave Game
        </button>

        <div id="game-id-view">
            <div id="game-id-label" class={gameIdTextClass}>{gameIdText}</div>
            <div id="game-id">
                {gameState.id}
                <button id="game-id-btn" on:click={handleCopy}>
                    <CopyIcon height="0.9rem" width="0.9rem" />
                </button>
            </div>
        </div>
    </div>
</main>

<button
    id="ready-btn"
    class={myPlayerState?.isReady ? "activated" : ""}
    on:click={toggleReady}
>
    <div class="ready-btn-content">
        {#if myPlayerState?.isReady}
            <div class="ready-btn-display">
                <CheckIcon /> READY
            </div>
            <div style="font-size: 0.8rem; margin: 0 -50%;">
                Waiting for other players
            </div>
        {:else}
            <div class="ready-btn-display">
                <CheckOutlineIcon /> READY
            </div>
            <div style="font-size: 0.7rem; margin: 0 -50%;">Click to Start</div>
        {/if}
    </div>
</button>

<!-- Confirmation modal for leaving game -->
{#if isModalOpen}
    <ConfirmationModal
        on:no={() => (isModalOpen = false)}
        on:yes={leave}
        bodyText="Are you sure you want to leave this game?"
    />
{/if}

<style>
    main {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 20px;
    }

    #content {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 30px;
        overflow-y: auto;
        margin-top: 4.5rem;
    }

    .label {
        font-size: 0.9rem;
        color: white;
        font-weight: 200;
        margin-bottom: -6px;
    }

    .section-title {
        color: white;
        font-size: 1.3rem;
        font-weight: 600;
        padding-bottom: 5px;
        height: 3.6rem;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    }

    .title {
        font-size: 1.5rem;
        color: white;
        font-weight: 700;
        margin-bottom: 5px;
    }

    #embed-container {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
    }

    #embed-section {
        display: flex;
        flex: 1;
        min-width: 260px;
        flex-direction: column;
    }

    #players-section {
        flex: 1;
        height: 100%;
        position: relative;
        min-width: 260px;
        display: flex;
        flex-direction: column;
    }

    #players-container {
        border: 1px solid gray;
        background-color: var(--accent-dark);
        padding: 20px;
        border-radius: 0.75rem;
        flex: 1;
        width: 100%;
        height: max-content;
    }

    #players-content {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-start;
        gap: 20px;
        width: max-content;
        max-width: 100%;
        height: max-content;
        max-height: 100%;
    }

    .ready-btn-display {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 10px;

        font-weight: 700;
        font-size: 1.9rem;
        color: white;
    }
    .ready-btn-content {
        display: flex;
        flex-direction: column;
        gap: 5px;
        color: var(--primary-light);
        overflow: hidden;
        white-space: nowrap;
        overflow: hidden;
    }
    #ready-btn {
        position: absolute;
        top: 0px;
        left: 50%;
        transform: translate(-50%, 0);

        background-image: radial-gradient(circle at top left, #888, #ccc, #aaa);
        background-size: cover;

        padding: 0.7rem;
        height: 5.5rem;
        width: 15rem;

        /* Border stuff */
        border: solid 4px transparent;
        border-radius: 0px 0px 40px 40px;
        border-top: 0px;
        overflow: hidden; /* Ensure inner content doesn't overflow */

        transition: 0.5s ease-out;
    }
    #ready-btn.activated {
        height: 5.5rem;
        width: 18rem;
    }

    /* Handle glowing background as pseudo-element */
    #ready-btn:before {
        content: "";
        position: absolute;
        top: -90px;
        right: 0px;
        bottom: -10px;
        left: 0px;
        z-index: -1;
        border-radius: inherit;
        background: radial-gradient(
            ellipse at center top,
            var(--accent-light) -15%,
            var(--accent),
            var(--accent-dark) 110%
        );
        animation: pulse-glow 8s ease-in infinite;
        transition: top 0.5s ease-in-out;
    }
    #ready-btn.activated:before {
        animation: none;
        top: 0px;
    }
    @keyframes pulse-glow {
        0% {
            top: 0px;
        }
        50% {
            top: -90px;
        }
        100% {
            top: 0px;
        }
    }



    #leave-btn {
        color: var(--primary-light);
        background-color: var(--accent-dark);
        /* border: 1px solid var(--primary-light); */
        padding: 0px;
        font-size: 0.9rem;
        height: 100%;
    }
    #leave-btn:hover {
        color: var(--spotify-green);
    }

    #game-id-view {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    #game-id {
        font-size: 1.3rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        height: max-content;
        gap: 8px;
    }
    #game-id-btn {
        background-color: transparent;
        border: none;
        color: var(--primary-light);
        padding: 0px;
        margin-bottom: 4px;
        padding-inline: 2px;
    }
    #game-id-btn:hover {
        background-color: var(--primary-light);
        color: var(--primary-dark);
    }
    #game-id-label {
        font-size: 0.8rem;
    }
    #game-id-label.activated {
        color: var(--spotify-green);
    }
    #footer {
        width: 100%;
        height: 48px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin-bottom: -20px;
        margin-top: -4px;
    }
</style>
