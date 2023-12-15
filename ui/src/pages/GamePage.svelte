<script lang="ts">
    import CheckIcon from "svelte-material-icons/CheckCircle.svelte";
    import CheckOutlineIcon from "svelte-material-icons/CheckCircleOutline.svelte";
    import type { GameState, PlayerState } from "../../../shared/types";
    import { IFrameAPI } from "../../IFrameAPI";
    import {
        GameStore,
        GameConnection,
        PlayerConnection,
    } from "../../gameStore";
    import SpotifyMetadataView from "../components/SpotifyMetadataView.svelte";
    import GameAPI from "../../api/api";
    import PlayerCard from "../components/PlayerCard.svelte";

    //Maintain a reference to the current state of the game
    let gameState: GameState;
    GameStore.subscribe((value) => {
        gameState = value;
    });

    //Maintain a reference to the current state of this player
    let myPlayerState: PlayerState;
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
            height: "200px",
        };
        const callback = (EmbedController: any) => {
            EmbedController.addListener("ready", () => {
                console.log(EmbedController);
                EmbedController.sendMessageToEmbed("hi");
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

    function toggleReady() {
        console.log(myPlayerState);
        if (myPlayerState.isReady) {
            GameAPI.unreadyPlayer();
        } else {
            GameAPI.readyPlayer();
        }
    }
</script>

<div id="id-view" class="header-text">
    <div id="id-view-label" class="header-text">GAME ID:</div>
    {gameState.id}
</div>
<main>
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
                <PlayerCard {player} highlight={player === myPlayerState}/>
            {/each}
        </div>
    </div>
</main>
<button id="ready-btn" on:click={toggleReady}>
    {#if myPlayerState?.isReady}
        <CheckIcon /> UNREADY
    {:else}
        <CheckOutlineIcon /> READY
    {/if}
</button>

<style>
    main {
        height: 100%;
        width: 100%;
        display: flex;
        box-sizing: border-box;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        padding-top: 70px;
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

    #embed-section {
        display: flex;
        width: 100%;
        height: max-content;
        flex-direction: column;
    }

    #players-section {
        height: 100%;
        width: 100%;
    }

    #players-container {
        width: max-content;
        max-width: 100%;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        padding: 10px;
        padding-inline: 0px;
        gap: 20px;
        margin-bottom: 200px;
    }

    #id-view {
        position: fixed;
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
            black 210%
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
</style>
