<script lang="ts">
  import type { Component } from 'svelte';
  import EighthNotes from '@lucide/svelte/icons/eighth-notes';
  import SkipBack from '@lucide/svelte/icons/skip-back';
  import Rewind from '@lucide/svelte/icons/rewind';
  import Play from '@lucide/svelte/icons/play';
  import Pause from '@lucide/svelte/icons/pause';
  import FastForward from '@lucide/svelte/icons/fast-forward';
  import SkipForward from '@lucide/svelte/icons/skip-forward';
  import ListMusic from '@lucide/svelte/icons/list-music';

  type Props = {
    isPlaying: boolean;
    onPlayPause: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onRewind: () => void;
    onFastForward: () => void;
    onToggleLyrics: () => void;
    onTogglePlaylist: () => void;
  };

  let {
    isPlaying,
    onPlayPause,
    onPrevious,
    onNext,
    onRewind,
    onFastForward,
    onToggleLyrics,
    onTogglePlaylist,
  }: Props = $props();

  // Removing the class and forcing a reflow restarts the CSS animation on repeated clicks.
  function bounce(node: HTMLElement) {
    node.classList.remove('bounce-once');
    void node.offsetWidth;
    node.classList.add('bounce-once');
  }
</script>

{#snippet control(label: string, onPress: () => void, Icon: Component<{ class?: string }>)}
  <button
    onclick={(e) => {
      onPress();
      bounce(e.currentTarget);
    }}
    class="pressable p-2.5 md:p-4"
    aria-label={label}
  >
    <Icon class="drop-shadow-lg" />
  </button>
{/snippet}

<!-- A row under the lyrics on phones; a column beside the title from md up. -->
<div class="flex flex-row items-center justify-center gap-1 md:flex-col md:justify-end md:gap-6">
  {@render control('Toggle lyrics', onToggleLyrics, EighthNotes)}
  {@render control('Previous track', onPrevious, SkipBack)}
  {@render control('Rewind', onRewind, Rewind)}
  {@render control(isPlaying ? 'Pause' : 'Play', onPlayPause, isPlaying ? Pause : Play)}
  {@render control('Fast forward', onFastForward, FastForward)}
  {@render control('Next track', onNext, SkipForward)}
  {@render control('Toggle playlist', onTogglePlaylist, ListMusic)}
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
