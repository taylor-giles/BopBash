<script lang="ts">
    import { fly } from "svelte/transition";
    import type { ChatMessage } from "../../../shared/types";
    import { quintOut } from "svelte/easing";
    import ChatCard from "./cards/ChatCard.svelte";
    import { tick } from "svelte";
  
    export let chats: ChatMessage[];
    let main: HTMLDivElement;

    //Whenever a new chat comes in, scroll to bottom
    $: if(chats){
        scrollToBottom();
    }

    async function scrollToBottom(){
        await tick();
        if(main){
            main.scrollTop = main.scrollHeight;
        }
    }
  </script>
  
  <div id="chat-board" bind:this={main}>
    {#each chats as chat, index (index)}
      <div class="chat-card-container" transition:fly={{ x: "100%", easing: quintOut}}>
        <ChatCard {chat} />
      </div>
    {/each}
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
  </style>
  