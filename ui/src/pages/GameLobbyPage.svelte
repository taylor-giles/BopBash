<script lang="ts">
    import CheckIcon from "svelte-material-icons/CheckCircle.svelte";
    import CheckOutlineIcon from "svelte-material-icons/CheckCircleOutline.svelte";
    import type { GameState, PlayerState } from "../../../shared/types";
    import { IFrameAPI } from "../../IFrameAPI";
    import { GameStore, GameConnection } from "../../gameStore";
    import GameAPI from "../../api/api";
    import PlayerCard from "../components/PlayerCard.svelte";
    import { CurrentPage, Page } from "../../pageStore";
    import ConfirmationModal from "../components/ConfirmationModal.svelte";

    //Maintain a reference to the current state of the game
    let gameState: GameState;
    GameStore.subscribe((value) => {
        gameState = value;
    });

    //Maintain a reference to the current state of this player
    $: myPlayerState = gameState.players[$GameConnection.playerId];

    //Show the playlist in an embedded iframe once everything is loaded
    let embed: HTMLIFrameElement;
    let embedAPI: any;
    IFrameAPI.subscribe((api: any) => {
        embedAPI = api;
    });
    $: if (embedAPI && embed && gameState) {
        const element = embed;
        const options = {
            uri: `spotify:playlist:${gameState.playlist.id}`,
            height: "152px",
        };
        const callback = (EmbedController: any) => {
            EmbedController.addListener("ready", () => {
                console.log("Embed controller is ready");
            });
        };
        embedAPI.createController(element, options, callback);
    }

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
</script>

<main>
    <div id="content">
        <div id="header">
            <button id="back-btn" on:click={() => (isModalOpen = true)}>
                &lt Leave Game
            </button>
        </div>
        <div id="embed-section">
            <div id="playlist-label" class="body-text">Game Playlist:</div>
            <div id="playlist-title" class="header-text">
                {gameState?.playlist?.name}
            </div>
            <iframe
                title="Spotify-provided embedded playlist"
                sandbox="allow-scripts"
                bind:this={embed}
            ></iframe>
        </div>
        <div id="players-section">
            <div class="section-label body-text">
                Players ({numReadyPlayers}/{playerList.length} Ready)
            </div>
            <div id="players-container">
                {#each playerList as player}
                    <PlayerCard {player} highlight={player === myPlayerState} />
                {/each}

                <!-- Spacer for scrolling -->
                <div style="height: 200px; width: 100%;" />

                <!-- Ready button -->
                <!-- <div id="ready-btn-container"> -->

                <!-- </div> -->
            </div>
        </div>
    </div>
</main>

<div id="id-view" class="header-text">
    <div id="id-view-label" class="header-text">GAME ID:</div>
    {gameState.id}
</div>

<button id="ready-btn" on:click={toggleReady}>
    {#if myPlayerState?.isReady}
        <CheckIcon /> UNREADY
    {:else}
        <CheckOutlineIcon /> READY
    {/if}
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
        position: relative;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 20px;
    }

    #header {
        width: 100%;
        max-width: 900px;
        height: 48px;
    }

    #content {
        max-width: 1200px;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 30px;
        overflow-y: auto;
    }

    #playlist-label {
        font-size: 1rem;
        color: white;
        font-weight: 200;
        margin-bottom: -5px;
    }

    .section-label {
        color: white;
        font-size: 1.3rem;
        font-weight: 400;
    }

    #playlist-title {
        font-size: 1.9rem;
        color: white;
        font-weight: 700;
        margin-bottom: 5px;
    }

    iframe {
        height: 100%;
    }

    #embed-section {
        box-sizing: border-box;
        display: flex;
        flex: 1;
        min-width: 300px;
        height: max-content;
        flex-direction: column;
    }

    #players-section {
        box-sizing: border-box;
        position: relative;
        height: max-content;
        min-width: 300px;
        width: 100%;
    }

    #players-container {
        width: max-content;
        max-width: 100%;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
        padding: 10px;
        padding-inline: 0px;
        gap: 20px;
    }

    #id-view {
        position: absolute;
        top: 0px;
        left: 50%;
        transform: translate(-50%, 0);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-image: radial-gradient(circle at top left, #888, #ccc, #aaa);
        background-size: cover;
        font-weight: 700;
        font-size: 1.9rem;
        color: white;
        padding: 5px;
        padding-inline: 50px;

        /* Border stuff */
        border: solid 4px transparent;
        border-radius: 0px 0px 40px 40px;
        border-top: 0px;
        overflow: hidden; /* Ensure inner content doesn't overflow */
    }

    #id-view:before {
        content: "";
        position: absolute;
        top: -5px;
        right: -5px;
        bottom: -5px;
        left: -5px;
        z-index: -1;
        border-radius: inherit;
        background: radial-gradient(
            ellipse at center top,
            var(--accent),
            var(--accent-dark) 120%
        );
    }

    #id-view-label {
        font-weight: 500;
        font-size: 0.9rem;
        margin-bottom: -5px;
    }

    #ready-btn {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 10px;
        position: fixed;
        bottom: 0px;
        left: 50%;
        transform: translate(-50%);
        font-size: 2.4rem;
        padding: 20px;
        padding-inline: 30px;
        font-weight: 800;
        margin-bottom: 50px;
    }

    #ready-btn:hover {
        box-shadow: 0px 0px 200px -10px var(--accent-light);
    }

    #back-btn {
        background-color: transparent;
        border: none;
        color: white;
        padding: 0px;
    }
    #back-btn:hover {
        color: var(--spotify-green);
        background-color: transparent;
    }
</style>
