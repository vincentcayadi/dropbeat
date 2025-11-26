<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { SyncedLyricLine } from '../utils/parseSyncedLyrics';

  export let visible: boolean;
  export let syncedLines: SyncedLyricLine[] = [];
  export let plainLyrics: string;
  export let currentLineIndex: number;
  export let version: number;

  let container: HTMLDivElement;

  const paragraphs = () => plainLyrics.split('\n\n');

  let contentElement: HTMLDivElement;

  $: if (contentElement && syncedLines.length && currentLineIndex >= 0 && visible) {
    const lines = contentElement.querySelectorAll('.synced-line');
    const active = lines[currentLineIndex] as HTMLElement | undefined;
    if (active) {
      const centerOffset =
        active.offsetTop - contentElement.clientHeight / 2 + active.clientHeight / 2;
      const maxScroll = Math.max(0, contentElement.scrollHeight - contentElement.clientHeight);
      const target = Math.min(Math.max(0, centerOffset), maxScroll);
      contentElement.scrollTo({ top: target, behavior: 'smooth' });
    }
  }
</script>

{#if visible}
  <div class="relative w-full max-w-3xl h-[70vh]">
    {#key version}
      <div
        bind:this={contentElement}
        class="absolute inset-0 overflow-y-auto text-left font-semibold leading-relaxed text-lg lyrics-panel p-4"
        transition:fade={{ duration: 350 }}
      >
        {#if syncedLines.length}
          {#each syncedLines as line, index}
            <p
              class={`synced-line mb-3 transition-all duration-200 ${index === currentLineIndex ? 'text-white font-bold' : 'text-white/70'}`}
            >
              {line.text}
            </p>
          {/each}
        {:else}
          {#each paragraphs() as paragraph, pIndex}
            <div class="mb-6">
              {#each paragraph.split('\n') as line, lIndex}
                <p>{line}</p>
              {/each}
            </div>
          {/each}
        {/if}
      </div>
    {/key}
  </div>
{/if}

<style>
  .lyrics-panel {
    scrollbar-width: none;
  }

  .lyrics-panel::-webkit-scrollbar {
    display: none;
  }
</style>
