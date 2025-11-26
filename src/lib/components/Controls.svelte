<script lang="ts">
  export let isPlaying: boolean;
  export let disabled: boolean = false;
  export let onPlayPause: () => void;
  export let onRewind: () => void;
  export let onFastForward: () => void;
  export let onToggleLyrics: () => void;
  export let onTogglePlaylist: () => void;

  let lyricsBtn: HTMLButtonElement;
  let rewindBtn: HTMLButtonElement;
  let playBtn: HTMLButtonElement;
  let fastForwardBtn: HTMLButtonElement;

  const bounce = (node?: HTMLButtonElement) => {
    if (!node) return;
    node.classList.remove('bounce-once');
    // Force reflow to restart animation
    void node.offsetWidth;
    node.classList.add('bounce-once');
  };

  const glowOn = () => {};
  const glowOff = () => {};
</script>

<div class="flex flex-col items-center justify-end gap-8">
  <!-- Lyrics Toggle Button -->
  <button
    bind:this={lyricsBtn}
    on:click={() => {
      onToggleLyrics();
      bounce(lyricsBtn);
    }}
    class="p-4 pressable"
    disabled={disabled}
    aria-label="Toggle lyrics"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#EBEBEB"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="drop-shadow-lg lucide lucide-music-icon"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  </button>

  <!-- Rewind Button -->
  <button
    bind:this={rewindBtn}
    on:click={() => {
      onRewind();
      bounce(rewindBtn);
    }}
    class="p-4 pressable"
    disabled={disabled}
    aria-label="Rewind"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="drop-shadow-lg lucide lucide-rewind-icon"
    >
      <path d="M12 6a2 2 0 0 0-3.414-1.414l-6 6a2 2 0 0 0 0 2.828l6 6A2 2 0 0 0 12 18z" />
      <path d="M22 6a2 2 0 0 0-3.414-1.414l-6 6a2 2 0 0 0 0 2.828l6 6A2 2 0 0 0 22 18z" />
    </svg>
  </button>

  <!-- Play/Pause Button -->
  <button
    bind:this={playBtn}
    on:click={() => {
      onPlayPause();
      bounce(playBtn);
    }}
    on:mouseenter={glowOn}
    on:mouseleave={glowOff}
    class="p-4 pressable"
    disabled={disabled}
    aria-label={isPlaying ? 'Pause' : 'Play'}
  >
    {#if isPlaying}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#EBEBEB"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="drop-shadow-lg"
      >
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </svg>
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="drop-shadow-lg lucide lucide-play-icon"
      >
        <path
          d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
        />
      </svg>
    {/if}
  </button>

  <!-- Fast Forward Button -->
  <button
    bind:this={fastForwardBtn}
    on:click={() => {
      onFastForward();
      bounce(fastForwardBtn);
    }}
    class="p-4 pressable"
    disabled={disabled}
    aria-label="Fast forward"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="drop-shadow-lg lucide lucide-fast-forward-icon"
    >
      <path d="M12 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 12 18z" />
      <path d="M2 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 2 18z" />
    </svg>
  </button>

  <!-- Playlist Toggle -->
  <button
    on:click={onTogglePlaylist}
    class="p-4 pressable"
    disabled={disabled}
    aria-label="Toggle playlist"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 5H3" />
      <path d="M11 12H3" />
      <path d="M11 19H3" />
      <path d="M21 16V5" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  </button>
</div>

<style>
  .pressable {
    transition: transform 160ms ease, opacity 160ms ease;
  }

  .pressable:active {
    transform: scale(0.9);
  }

  .pressable:disabled {
    opacity: 0.4;
    pointer-events: none;
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
