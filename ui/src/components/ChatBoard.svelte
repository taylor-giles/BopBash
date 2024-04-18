<script lang="ts">
  import { fly } from "svelte/transition";
  import type { ChatMessage } from "../../../shared/types";
  import { quintOut } from "svelte/easing";
  import ChatCard from "./cards/ChatCard.svelte";
  import { tick } from "svelte";
  import GameAPI from "../../api/api";
  import SendIcon from "svelte-material-icons/Send.svelte";

  export let chats: ChatMessage[];
  let main: HTMLDivElement;
  let chatContent: string = "";

  //Whenever a new chat comes in, scroll to bottom
  $: if (chats) {
    scrollToBottom();
  }

  async function scrollToBottom() {
    await tick();
    if (main) {
      main.scroll({ top: main.scrollHeight });
    }
  }

  /**
   * Sends the current chat content as a new chat
   */
  async function handleSendChat(e?: Event) {
    e?.preventDefault();

    //Send the chat
    if (chatContent) {
      GameAPI.sendChat(chatContent);
    }

    //Clear chat content
    chatContent = "";
  }
</script>

<div id="main">
  <div id="chat-board" bind:this={main}>
    {#each chats as chat, index (index)}
      <div
        class="chat-card-container"
        transition:fly={{ y: "0%", easing: quintOut }}
      >
        <ChatCard {chat} />
      </div>
    {/each}
  </div>

  <form id="chat-form" on:submit={handleSendChat}>
    <div id="chat-input-container">
      <input
        id="chat-input"
        bind:value={chatContent}
        placeholder="Write a message..."
        class="body-text"
        autocomplete="off"
      />
      <button id="chat-submit-btn" type="submit" disabled={!chatContent}>
        <SendIcon height="100%" width="100%" />
      </button>
    </div>
  </form>
</div>

<style>
  #chat-board {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .chat-card-container {
    width: 100%;
    font-size: 1rem;
  }

  #main {
    width: 100%;
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
    gap: 5px;
  }
  #chat-form {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 5px;
  }
  #chat-input-container {
    width: 100%;
    display: flex;
    flex-direction: row;
    border-radius: 10px;
    color: var(--primary-light);
    border: 2px solid var(--primary-dark);
  }
  #chat-input {
    color: var(--primary-light);
    flex: 1;
    border: 0px;
    border-radius: 10px 0px 0px 10px;
    padding-inline: 10px;
    outline: none;
    height: 2.5rem;
    overflow-x: auto;
    background-color: transparent;
    font-size: 1rem;
  }
  #chat-submit-btn {
    border-radius: 0px 10px 10px 0px;
    height: 100%;
    background-color: transparent;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0px;
    width: 20px;
    margin-inline: 10px;
    color: var(--primary-light);
  }
  #chat-submit-btn:disabled {
    color: var(--primary-dark);
  }
</style>
