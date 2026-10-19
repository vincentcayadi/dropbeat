<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { SyncedLyricLine } from '../utils/parseSyncedLyrics';

  type Props = {
    visible: boolean;
    syncedLines: SyncedLyricLine[];
    plainLyrics: string;
    currentLineIndex: number;
    version: number;
  };

  let { visible, syncedLines, plainLyrics, currentLineIndex, version }: Props = $props();

  let contentElement = $state<HTMLDivElement>();
  // Plain lyrics are static text, so a line's position is its identity; number them for keyed each blocks.
  const paragraphs = $derived(
    plainLyrics.split('\n\n').map((block, id) => ({
      id,
      lines: block.split('\n').map((text, lineId) => ({ id: lineId, text })),
    }))
  );

  // Keep the active synced line centred in the panel.
  $effect(() => {
    if (!contentElement || !syncedLines.length || currentLineIndex < 0 || !visible) return;
    const active = contentElement.querySelectorAll<HTMLElement>('.synced-line')[currentLineIndex];
    if (!active) return;
    const centerOffset = active.offsetTop - contentElement.clientHeight / 2 + active.clientHeight / 2;
    const maxScroll = Math.max(0, contentElement.scrollHeight - contentElement.clientHeight);
    contentElement.scrollTo({ top: Math.min(Math.max(0, centerOffset), maxScroll), behavior: 'smooth' });
  });
</script>

{#if visible}
  <div class="relative w-full max-w-3xl h-full md:h-[70vh]">
    {#key version}
      <!-- Out before in: the old lyrics are gone before the new ones fade up, so the two never overlap. -->
      <div
        bind:this={contentElement}
        class="absolute inset-0 flex flex-col overflow-y-auto text-left font-semibold leading-relaxed text-lg lyrics-panel p-4"
        in:fade={{ duration: 250, delay: 150 }}
        out:fade={{ duration: 150 }}
      >
        {#if syncedLines.length}
          <!-- Half-height spacers let every line, including the first and last, scroll to the vertical centre. -->
          <div class="h-1/2 shrink-0" aria-hidden="true"></div>
          {#each syncedLines as line (line.id)}
            <p
              class={[
                'synced-line mb-3 transition-all duration-200',
                line.id === currentLineIndex ? 'text-white font-bold' : 'text-white/70',
              ]}
            >
              {line.text}
            </p>
          {/each}
          <div class="h-1/2 shrink-0" aria-hidden="true"></div>
        {:else}
          <!-- Auto margins centre short text and collapse to zero once it overflows and scrolls. -->
          <div class="my-auto">
            {#each paragraphs as paragraph (paragraph.id)}
              <div class="mb-6">
                {#each paragraph.lines as line (line.id)}
                  <p>{line.text}</p>
                {/each}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/key}
  </div>
{/if}

<style>
  .lyrics-panel {
    scrollbar-width: none;
    -webkit-mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent);
    mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent);
  }

  .lyrics-panel::-webkit-scrollbar {
    display: none;
  }
</style>
