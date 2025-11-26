<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  export let title: string;
  export let artist: string;
  export let isPlaying: boolean = false;

  let titleElement: HTMLDivElement;
  let artistElement: HTMLHeadingElement;
  let isFirstRender = true;
  let displayedTitle = title;
  let displayedArtist = artist;

  $: if (!isFirstRender && titleElement && title !== displayedTitle) {
    const tl = gsap.timeline();
    tl.to(titleElement, {
      x: '100%',
      opacity: 0,
      duration: 0.75,
      ease: 'power2.in',
      onComplete: () => {
        displayedTitle = title;
      },
    });
    tl.fromTo(
      titleElement,
      { x: '-100%', opacity: 0 },
      { x: '0%', opacity: 1, duration: 1, ease: 'power2.out' }
    );
  }

  $: if (!isFirstRender && artistElement && artist !== displayedArtist) {
    const tl = gsap.timeline();
    tl.to(artistElement, {
      x: '100%',
      opacity: 0,
      duration: 0.75,
      ease: 'power2.in',
      onComplete: () => {
        displayedArtist = artist;
      },
    });
    tl.fromTo(
      artistElement,
      { x: '-100%', opacity: 0 },
      { x: '0%', opacity: 1, duration: 1, ease: 'power2.out' }
    );
  }

  onMount(() => {
    requestAnimationFrame(() => {
      isFirstRender = false;
    });
  });
</script>

<div class="flex flex-col items-end gap-1.5 text-right w-full">
  <div class="inline-flex gap-1 items-end h-3 mb-1" aria-label="Now playing indicator">
    <span class={`bar ${isPlaying ? 'playing' : 'paused'}`}></span>
    <span class={`bar delay-150 ${isPlaying ? 'playing' : 'paused'}`}></span>
    <span class={`bar delay-300 ${isPlaying ? 'playing' : 'paused'}`}></span>
  </div>
  <div class="relative w-full min-h-[2.5rem] overflow-hidden">
    <div bind:this={titleElement} class="font-bold text-[1.8rem] leading-tight tracking-tight relative w-full">
      {displayedTitle}
    </div>
  </div>
  <div class="relative w-full min-h-[1.5rem] overflow-hidden">
    <h2 bind:this={artistElement} class="text-base text-[#e7e7e7] leading-tight relative w-full">
      {displayedArtist}
    </h2>
  </div>
</div>

<style>
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
