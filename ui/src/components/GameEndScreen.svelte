<script lang="ts">
    import { arraySum } from "../../../shared/utils";
    import { GameStore } from "../../stores/gameStore";
    import Scoreboard from "./Scoreboard.svelte";
</script>

<main>
    <div id="conclusion-content">
        <div class="conclusion-title header-text">
            GAME OVER
        </div>
        <div id="scoreboard-title" class="header-text">- Final Scoreboard -</div>

        <!-- Scoreboard in conclusion screen -->
        <div id="conclusion-scoreboard-container">
            <Scoreboard
                showScoreChange={false}
                players={Object.values($GameStore.players).toSorted(
                    (a, b) => arraySum(b.scores) - arraySum(a.scores),
                )}
            />
        </div>
    </div>
</main>

<style>
    main {
        width: 100%;
        height: 100%;
    }
    #conclusion-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        width: 100%;
        height: 100%;
    }
    .conclusion-title {
        font-weight: 700;
        font-size: 2rem;
        width: max-content;
    }
    #scoreboard-title {
        font-size: 1.7rem;
        font-weight: 400;
        margin-top: -10px;
    }
    #conclusion-scoreboard-container {
        flex: 1;
        background-color: rgba(0, 0, 0, 0.8);
        border: 2px solid var(--primary-light);
        border-radius: 5px;
        min-width: 260px;
        max-width: 900px;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
    }
</style>
