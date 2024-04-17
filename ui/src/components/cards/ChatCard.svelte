<script lang="ts">
    import type { ChatMessage } from "../../../../shared/types";

    export let chat: ChatMessage;
</script>

<main>
    <div id="name-container">
        <div id="name-display">
            {chat.sender.name}
        </div>
    </div>

    <div id="content-display">
        {chat.content}
    </div>
</main>

<style>
    main {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        padding: 0.6rem;
        padding-inline: 0.8rem;
        color: var(--primary-light);
        border-top: 1px solid gray;
    }
    #name-display {
        font-size: 1.1rem;
        font-weight: 700;
    }
    #name-container {
        margin-bottom: -2px;
    }

    #content-display {
        font-size: 1rem;
        font-weight: 400;
        word-break: break-all;
    }
</style>
