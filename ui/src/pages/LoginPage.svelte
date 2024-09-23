<script lang="ts">
import GameAPI from "../../api/api";
    import UsernameForm from "../components/forms/UsernameForm.svelte";
    import StatsDisplay from "../components/StatsDisplay.svelte";
</script>

<main>
    <div id="logo-container">
        <img class="logo-accent" src="music-circle-outline.svg" alt="Music note"/>
        <img id="logo" src="bop-bash-logo-clean.svg" alt="Bop Bash full logo"/>
        <img class="logo-accent" src="music-circle-outline.svg" alt="Music note"/>
    </div>
    <UsernameForm />
    <div id="stats-display-container">
        <StatsDisplay />
    </div>
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
        max-width: 100%;
        max-height: 7rem;
    }
    .logo-accent {
        height: 30px;
        width: 30px;
        border-radius: 100%;
        animation: spin 60s infinite ease-in-out;
        animation-delay: 1s;
        opacity: 30%;
    }
    @media(max-width: 600px) {
        .logo-accent {
            display: none;
        }
    }
    @keyframes spin {
        0% { transform: rotate(0deg);}
        100% { transform: rotate(360deg); }
    }

    #stats-display-container {
        max-width: 900px;
        width: 100%;
    }

</style>
