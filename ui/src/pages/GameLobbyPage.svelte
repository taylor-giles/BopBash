<script lang="ts">
    import CheckIcon from "svelte-material-icons/CheckCircle.svelte";
    import CheckOutlineIcon from "svelte-material-icons/CheckCircleOutline.svelte";
    import ShareIcon from "svelte-material-icons/ShareVariant.svelte";
    import CloseIcon from "svelte-material-icons/Close.svelte";
    import BackIcon from "svelte-material-icons/ArrowLeft.svelte";
    import AddFriendsIcon from "svelte-material-icons/AccountMultiplePlus.svelte";
    import type { GameState, PlayerState } from "../../../shared/types";
    import { IFrameAPI } from "../../stores/IFrameAPI";
    import { GameStore, GameConnection } from "../../stores/gameStore";
    import GameAPI from "../../api/api";
    import PlayerCard from "../components/PlayerCard.svelte";
    import { CurrentPage, Page } from "../../stores/pageStore";
    import ConfirmationModal from "../components/ConfirmationModal.svelte";
    import { onMount, tick } from "svelte";
    import { scale } from "svelte/transition";
    import Modal from "../components/Modal.svelte";
    import { API_ADDRESS } from "../../../shared/constants";

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

    //Modals open iff this is true
    let isLeavingModalOpen = false;
    let isSharingModalOpen = false;

    //Generate share link for this game
    const shareLink = `${window.location.origin}?game=${$GameStore.id}`;

    /**
     * Toggle player's ready state
     */
    function toggleReady() {
        if (myPlayerState.isReady) {
            GameAPI.unreadyPlayer();
        } else {
            GameAPI.readyPlayer();

            //Create the audio context
            const audioContext = new AudioContext();

            //Obtain stream and convert it to a MediaSource
            GameAPI.getAudioStream().then((stream) => {
                let source = audioContext.createMediaElementSource(stream);
                source.connect(audioContext.destination);
                console.log(source);
                console.log(stream);
            });

            //Create the buffer
            // const audioBuffer = audioContext.createBuffer(2, 30*44100, 44100);
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
     * Shares the game join information
     */
    function handleShare() {
        if (navigator.canShare?.()) {
            navigator.share({
                url: shareLink,
                title: "Beat Blitz",
                text: "Join me for a thrilling song-based smackdown on Beat Blitz!",
            });
        }
    }

    /**
     * Render the embedded playlist using the Spotify IFrameAPI
     */
    async function renderEmbed() {
        await tick();

        //Render new embed with IFrameAPI
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
    <div id="header">
        <button
            id="leave-btn"
            class="text-button"
            on:click={() => (isLeavingModalOpen = true)}
        >
            <BackIcon /> Leave Game
        </button>

        <button
            id="open-share-btn"
            class="text-button"
            on:click={() => (isSharingModalOpen = true)}
        >
            <AddFriendsIcon height="0.9rem" width="0.9rem" />
            Invite friends
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
            {/if}
        </button>
    </div>
</main>

<!-- Confirmation modal for leaving game -->
{#if isLeavingModalOpen}
    <ConfirmationModal
        on:no={() => (isLeavingModalOpen = false)}
        on:yes={leave}
        bodyText="Are you sure you want to leave this game?"
    />
{/if}

<!-- Share modal -->
{#if isSharingModalOpen}
    <Modal on:close={() => (isSharingModalOpen = false)}>
        <div id="share-modal-content">
            <div style="width: 100%; margin-bottom: -20px;">
                <button
                    class="text-button"
                    on:click={() => (isSharingModalOpen = false)}
                >
                    <CloseIcon />
                </button>
            </div>

            <div id="share-modal-title">Ask your friends to join!</div>

            <!-- QR code, link, and Game ID -->
            <div id="share-modal-info-container">
                <div id="share-modal-game-id" class="header-text">
                    GAME ID:
                    <div id="game-id-display">
                        {$GameStore.id}
                    </div>
                </div>
                <div id="qr-code-container">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${shareLink}`}
                        alt="QR code"
                    />
                </div>
                <div id="share-modal-link">
                    <a href={shareLink}>
                        {shareLink}
                    </a>
                </div>
            </div>

            <!-- Share body information text -->
            <div class="body-text" id="share-modal-text">
                Others can join your game by:
                <ul>
                    <li>Entering the Game ID on the home page</li>
                    <li>Scanning the QR code above</li>
                    <li>Using the join link shown above</li>
                </ul>
            </div>

            <!-- Share button -->
            {#if navigator.canShare?.()}
                <button id="share-btn" on:click={handleShare}>
                    <ShareIcon />
                    Share
                </button>
            {/if}
        </div>
    </Modal>
{/if}

<style>
    main {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 0.8rem;
    }

    #content {
        width: 100%;
        flex-grow: 1;
        display: flex;
        flex-direction: row;
        gap: 20px;
        height: 0px;
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

    /* This instead of flex-wrap to allow for children to flex-grow along vertical axis */
    @media (max-width: 700px) {
        #content {
            flex-direction: column;
            gap: 0px;
        }

        #embed-section {
            flex-basis: 0;
        }

        #players-section {
            height: 0px;
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
    }

    #embed-container {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
    }

    #players-container {
        border: 2px solid gray;
        background-color: var(--accent-dark);
        border-radius: 0.75rem;
        flex: 1;
        width: 100%;
        overflow-y: auto;
    }

    #players-content {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-evenly;
        align-items: flex-start;
        gap: 15px;
        width: max-content;
        max-width: 100%;
        height: min-content;
        padding: 20px;
    }

    .ready-btn-display {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-weight: 700;
    }
    #ready-btn {
        padding: 0.7rem;
        width: 18rem;
        height: 4rem;
        transition: 0.8s ease;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 5px;
        outline: none;
        font-size: 1.9rem;
        max-width: 100%;
    }
    #ready-btn:hover {
        background-color: var(--accent-light);
    }
    #ready-btn.activated {
        font-size: 1.5rem;
        width: 22rem;
        background-color: var(--spotify-green);
    }
    #ready-btn-wrapper {
        width: 100%;
        height: max-content;
        display: flex;
        justify-content: center;
    }

    #leave-btn {
        color: var(--primary-light);
        font-size: 0.9rem;
        height: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
    }
    #leave-btn:hover {
        color: var(--red);
    }

    #open-share-btn {
        display: flex;
        flex-direction: row;
        align-items: center;
        color: var(--primary-light);
        padding: 10px;
        margin-bottom: 4px;
        border: 1px solid var(--primary-light);
        font-size: 0.8rem;
        gap: 5px;
    }

    #header {
        width: 100%;
        height: max-content;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    #share-modal-content {
        background-color: var(--primary-light);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid gray;
        color: var(--accent-dark);
        gap: 1rem;
        margin: 1rem;
        max-width: 500px;
    }

    #share-modal-game-id {
        display: flex;
        flex-direction: row;
        gap: 10px;
        font-size: 1.5rem;
        font-weight: 300;
        align-items: center;
        justify-content: center;
    }

    #game-id-display {
        font-weight: 800;
        color: var(--accent);
    }

    #share-modal-title {
        font-size: 1.3rem;
        font-weight: 700;
    }

    #share-modal-link {
        font-size: 0.8rem;
        display: flex;
        flex-direction: row;
        gap: 5px;
        justify-content: center;
    }

    #share-modal-info-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }

    #share-btn {
        border: 1px solid black;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
    }

    #qr-code-container {
        width: 130px;
        height: 130px;
        border: 5px solid white;
        outline: 5px solid var(--accent-dark);
        background-color: white;
        border-radius: 5px;
    }

    ul {
        margin: 0;
        padding-left: 1rem;
    }
</style>
