<script lang="ts">
  import { fade } from 'svelte/transition';

  export let lyrics: string;
  export let visible: boolean;
</script>

{#if visible}
  <div
    class="lyrics-panel max-h-[60vh] overflow-y-auto p-6 bg-black/30 backdrop-blur-sm rounded-lg text-white"
    transition:fade={{ duration: 300 }}
  >
    {#if lyrics === 'No lyrics available'}
      <p class="text-gray-400 italic text-center">{lyrics}</p>
    {:else}
      {#each lyrics.split('\n\n') as paragraph}
        <p class="mb-4 leading-relaxed">
          {#each paragraph.split('\n') as line}
            {line}<br />
          {/each}
        </p>
      {/each}
    {/if}
  </div>
{/if}

<style>
  .lyrics-panel::-webkit-scrollbar {
    width: 8px;
  }

  .lyrics-panel::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .lyrics-panel::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }

  .lyrics-panel::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
</style>
