<script lang="ts">
import GameAPI from "../../api/api";
    import UsernameForm from "../components/forms/UsernameForm.svelte";
    import StatsDisplay from "../components/StatsDisplay.svelte";

    GameAPI.getNumPlayers().then(console.log)
</script>

<main>
    <div id="logo-container">
        <img class="logo-accent" src="floaters/music-circle-outline.svg" alt="Music note"/>
        <img id="logo" src="bop-bash-logo-clean.svg" alt="Bop Bash full logo"/>
        <img class="logo-accent" src="floaters/music-circle-outline.svg" alt="Music note"/>
    </div>
    <UsernameForm />
    <StatsDisplay />
</main>

<style>
    main {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 10px;
    }

    #logo-container {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 2rem;
    }
    #logo {
        height: 150px;
    }
    @media(max-width: 600px) {
        .logo-accent {
            display: none;
        }
    }

    .logo-accent {
        height: 50px;
        width: 50px;
        border-radius: 100%;
        animation: spin 60s infinite ease-in-out;
        animation-delay: 1s;
        opacity: 30%;
    }

    @keyframes spin {
        0% { transform: rotate(0deg);}
        100% { transform: rotate(360deg); }
    }

</style>
