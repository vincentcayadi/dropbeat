<script lang="ts">
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';

  type Props = {
    trackId: string | null;
    title: string;
    artist: string;
    album: string;
    isPlaying: boolean;
  };

  let { trackId, title, artist, album, isPlaying }: Props = $props();
</script>

<div class="flex min-h-0 flex-1 flex-col items-end gap-3">
  <div class="inline-flex gap-1 items-end h-3" aria-label="Now playing indicator">
    <span class={['bar', isPlaying ? 'playing' : 'paused']}></span>
    <span class={['bar delay-150', isPlaying ? 'playing' : 'paused']}></span>
    <span class={['bar delay-300', isPlaying ? 'playing' : 'paused']}></span>
  </div>

  <!-- Tracks ride up the column: the old one leaves through the top while the next rises from the bottom.
       Both share one grid cell so they overlap instead of pushing each other. Reduced motion keeps only the crossfade. -->
  <div class="stage">
    {#key trackId}
      <div class="card">
        <p
          class="truncate font-bold text-[1.8rem] leading-tight tracking-tight"
          in:fly={{ y: prefersReducedMotion.current ? 0 : '100%', duration: 600, easing: quintOut }}
          out:fly={{ y: prefersReducedMotion.current ? 0 : '-100%', duration: 350, easing: quintOut }}
        >
          {title}
        </p>
        <p
          class="subtitle truncate text-base text-[#e7e7e7] leading-tight"
          in:fly={{ y: prefersReducedMotion.current ? 0 : '100%', duration: 600, delay: 60, easing: quintOut }}
          out:fly={{ y: prefersReducedMotion.current ? 0 : '-100%', duration: 350, easing: quintOut }}
        >
          {album} · {artist}
        </p>
      </div>
    {/key}
  </div>
</div>

<style>
  .stage {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .card {
    grid-area: 1 / 1;
    justify-self: end;
    writing-mode: vertical-rl;
  }

  .subtitle {
    margin-block-start: 0.375rem;
  }

  .bar {
    width: 3px;
    background: #ffffff;
    opacity: 0.75;
    border-radius: 9999px;
    animation: eqBounce 0.9s ease-in-out infinite;
    animation-play-state: paused;
  }

  .bar.delay-150 {
    animation-delay: 0.15s;
  }

  .bar.delay-300 {
    animation-delay: 0.3s;
  }

  .bar.playing {
    animation-play-state: running;
  }

  .bar.paused {
    animation-play-state: paused;
    opacity: 0.45;
  }

  @keyframes eqBounce {
    0% {
      height: 4px;
    }
    35% {
      height: 12px;
    }
    70% {
      height: 6px;
    }
    100% {
      height: 4px;
    }
  }
</style>
