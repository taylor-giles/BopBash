<script lang="ts">
    import CheckIcon from "svelte-material-icons/CheckCircle.svelte";
    import CheckOutlineIcon from "svelte-material-icons/CheckCircleOutline.svelte";
    import BackIcon from "svelte-material-icons/ArrowLeft.svelte";
    import CopyIcon from "svelte-material-icons/ContentCopy.svelte";
    import type { GameState, PlayerState } from "../../../shared/types";
    import { IFrameAPI } from "../../IFrameAPI";
    import { GameStore, GameConnection } from "../../gameStore";
    import GameAPI from "../../api/api";
    import PlayerCard from "../components/PlayerCard.svelte";
    import { CurrentPage, Page } from "../../pageStore";
    import ConfirmationModal from "../components/ConfirmationModal.svelte";
    import { onMount, tick } from "svelte";
    import { scale } from "svelte/transition";

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
    <div id="footer">
        <button id="leave-btn" on:click={() => (isModalOpen = true)}>
            <BackIcon /> Leave Game
        </button>

        <div id="game-id-view">
            <div id="game-id-label" class={gameIdTextClass}>
                {gameIdText}
            </div>
            <div id="game-id">
                {gameState.id}
                <button id="game-id-btn" on:click={handleCopy}>
                    <CopyIcon height="0.9rem" width="0.9rem" />
                </button>
            </div>
        </div>
    </div>
    <div id="ready-btn-wrapper">
        <button
            id="ready-btn"
            class:activated={myPlayerState?.isReady}
            on:click={toggleReady}
        >
            {#if myPlayerState?.isReady}
                <div class="ready-btn-display">
                    <CheckIcon /> READY
                </div>
                <div style="font-size: 0.8rem;">Waiting for other players</div>
            {:else}
                <div class="ready-btn-display">
                    <CheckOutlineIcon /> READY UP
                </div>
                <!-- <div style="font-size: 0.7rem;">
                    Click to Start
                </div> -->
            {/if}
        </button>
    </div>
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
                    {#each playerList as player (player.id)}
                        <div transition:scale>
                            <PlayerCard
                                {player}
                                highlight={player === myPlayerState}
                            />
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</main>

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
        padding-bottom: 100px;
        gap: 30px;
    }
    #embed-section {
        display: flex;
        min-width: 260px;
        flex-direction: column;
        flex: 1;
        flex-basis: 100%;
    }
    #players-section {
        min-width: 260px;
        display: flex;
        flex-direction: column;
        flex: 1;
        flex-basis: 100%;
    }
    @media (max-width: 700px) {
        /* This instead of flex-wrap to allow for children to flex-grow along vertical axis */
        #content {
            flex-direction: column;
            overflow-y: auto;
            gap: 0px;
        }

        #embed-section {
            flex-basis: 0;
        }

        #ready-btn-wrapper {
        }
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

    #players-container {
        border: 2px solid gray;
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
    }
    #ready-btn {
        padding: 0.7rem;
        width: 18rem;
        height: 4rem;
        transition: 0.5s ease-out;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 5px;
        box-shadow: 0px 0px 100px 10px rgba(255, 255, 255, 0.5);
        outline: none;
    }
    #ready-btn.activated {
        height: 5rem;
        width: 20rem;
        background-color: var(--spotify-green);
        box-shadow: 0px 0px 100px 10px var(--spotify-green);
    }
    #ready-btn-wrapper {
        position: absolute;
        bottom: 20px;
        width: max-content;
        height: max-content;
        display: flex;
        justify-content: center;
    }

    #leave-btn {
        color: var(--primary-light);
        background-color: var(--accent-dark);
        padding: 0px;
        font-size: 0.9rem;
        height: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
        outline: none;
    }
    #leave-btn:hover {
        color: var(--red);
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
        outline: none;
    }
    #game-id-label {
        font-size: 0.8rem;
    }
    #game-id-label.activated {
        color: var(--spotify-green);
    }
    #footer {
        width: 100%;
        height: max-content;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
</style>
