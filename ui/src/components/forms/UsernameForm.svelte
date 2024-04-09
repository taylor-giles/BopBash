<script lang="ts">
    import { MAX_USERNAME_LENGTH } from "../../../../shared/constants";
    import { connectAs } from "../../../stores/gameStore";
    import { initAudio } from "../../../stores/audio";

    let username = "";
    let failed = false;
    let ready = false;
    let failText = "";

    /**
     * Submits the form by attempting to connect via API
     */
    function handleSubmit(e?: Event) {
        e?.preventDefault();

        //Initialize audio
        //This MUST be done in DIRECT response to a button press to enable autoplay on all platforms
        initAudio();

        if (!failed) {
            //Establish the GameConnection
            connectAs(username);
        }
    }

    //Input validation
    $: {
        failed = username.length > MAX_USERNAME_LENGTH;
        ready = username.length > 0 && !failed;
        if (username?.length > MAX_USERNAME_LENGTH) {
            failText = `Username cannot exceed ${MAX_USERNAME_LENGTH} characters in length.`;
        } else if (!username) {
            failText = "Username must be provided";
        } else {
            failText = "";
        }
    }
</script>

<main>
    <div id="username-label" class="header-text">Enter a Username</div>

    <form on:submit={handleSubmit}>
        <input
            id="username-input"
            class="header-text"
            type="text"
            placeholder="Username"
            bind:value={username}
        />
        <div
            id="fail-text"
            class="body-text"
            style={`display: ${failed ? "flex" : "none"}`}
        >
            {failText}
        </div>

        <div id="info-text" class="body-text">
            No login required!<br />
            Rude or offensive names will not be tolerated.
        </div>

        <button
            on:click={handleSubmit}
            type="button"
            id="submit-btn"
            disabled={!ready}
        >
            Start
        </button>
    </form>
</main>

<style>
    main {
        background-color: rgba(50, 50, 50, 0.5);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: 10px;
        flex-shrink: 0;
        padding: 40px;
        padding-inline: 40px;
        border-radius: 10px;
        border: 1px solid gray;
        width: 100%;
        max-width: 900px;
        min-width: 300px;
    }

    form {
        display: contents;
    }

    #username-label {
        font-size: 1.3rem;
        color: white;
        font-weight: 500;
    }

    #username-input {
        height: 50px;
        background-color: var(--primary-light);
        color: var(--accent);
        font-size: 1.5rem;
        font-weight: 700;
        width: 100%;
        border: none;
        border-radius: 1px;
        padding: 5px;
        padding-inline: 10px;
    }
    #username-input::placeholder {
        color: var(--primary-dark);
    }

    #info-text {
        color: var(--primary-light);
    }

    #fail-text {
        color: var(--red);
    }

    #submit-btn {
        font-size: 1.1rem;
        margin-top: 20px;
        border-radius: 1px;
        width: 100%;
    }
</style>
