<script lang="ts">
    import UsernameForm from "../components/UsernameForm.svelte";
    import { connectAs } from "../../gameStore";

    const onStart = (e: any) => {
        let username = e.detail;

        //Establish the GameConnection
        connectAs(username);
    };
</script>

<main>
    <UsernameForm on:start={onStart} />
</main>

<style>
    main {
        height: 100%;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
