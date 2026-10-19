<script lang="ts">
  import EighthNotes from '@lucide/svelte/icons/eighth-notes';
  import Rewind from '@lucide/svelte/icons/rewind';
  import Play from '@lucide/svelte/icons/play';
  import Pause from '@lucide/svelte/icons/pause';
  import FastForward from '@lucide/svelte/icons/fast-forward';
  import ListMusic from '@lucide/svelte/icons/list-music';

  type Props = {
    isPlaying: boolean;
    onPlayPause: () => void;
    onRewind: () => void;
    onFastForward: () => void;
    onToggleLyrics: () => void;
    onTogglePlaylist: () => void;
  };

  let { isPlaying, onPlayPause, onRewind, onFastForward, onToggleLyrics, onTogglePlaylist }: Props =
    $props();

  // Removing the class and forcing a reflow restarts the CSS animation on repeated clicks.
  function bounce(node: HTMLElement) {
    node.classList.remove('bounce-once');
    void node.offsetWidth;
    node.classList.add('bounce-once');
  }
</script>

<div class="flex flex-col items-center justify-end gap-8">
  <button
    onclick={(e) => {
      onToggleLyrics();
      bounce(e.currentTarget);
    }}
    class="p-4 pressable"
    aria-label="Toggle lyrics"
  >
    <EighthNotes class="drop-shadow-lg" />
  </button>

  <button
    onclick={(e) => {
      onRewind();
      bounce(e.currentTarget);
    }}
    class="p-4 pressable"
    aria-label="Rewind"
  >
    <Rewind class="drop-shadow-lg" />
  </button>

  <button
    onclick={(e) => {
      onPlayPause();
      bounce(e.currentTarget);
    }}
    class="p-4 pressable"
    aria-label={isPlaying ? 'Pause' : 'Play'}
  >
    {#if isPlaying}
      <Pause class="drop-shadow-lg" />
    {:else}
      <Play class="drop-shadow-lg" />
    {/if}
  </button>

  <button
    onclick={(e) => {
      onFastForward();
      bounce(e.currentTarget);
    }}
    class="p-4 pressable"
    aria-label="Fast forward"
  >
    <FastForward class="drop-shadow-lg" />
  </button>

  <button onclick={onTogglePlaylist} class="p-4 pressable" aria-label="Toggle playlist">
    <ListMusic />
  </button>
</div>

<style>
  .pressable {
    transition: transform 160ms ease, opacity 160ms ease;
  }

  .pressable:active {
    transform: scale(0.9);
  }

  :global(.bounce-once) {
    animation: press-bounce 260ms ease-out;
  }

  @keyframes press-bounce {
    0% {
      transform: scale(0.92);
    }
    65% {
      transform: scale(1.06);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
