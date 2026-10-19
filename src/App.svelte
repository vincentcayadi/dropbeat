<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import gsap from 'gsap';
  import X from '@lucide/svelte/icons/x';
  import type { Metadata } from './types';
  import { parseMusicMetadata } from './lib/utils/parseMusicMetadata';
  import { fetchLyrics } from './lib/utils/fetchLyrics';
  import { parseSyncedLyrics, type SyncedLyricLine } from './lib/utils/parseSyncedLyrics';
  import Controls from './lib/components/Controls.svelte';
  import SongInfo from './lib/components/SongInfo.svelte';
  import LyricsDisplay from './lib/components/LyricsDisplay.svelte';
  import Playlist from './lib/components/Playlist.svelte';
  import { saveTrack, deleteTrack, loadTracks } from './lib/utils/idbPlaylist';
  import { PLAYLIST_ORDER_KEY, type TrackEntry } from './lib/utils/playlistTypes';
  import { getCachedLyrics, setCachedLyrics, deleteCachedLyrics } from './lib/utils/lyricsCache';

  let dragging = $state(false);
  let dragCounter = 0;
  const EMPTY_METADATA: Metadata = {
    title: 'Sample Title',
    artist: 'Unknown Artist',
    album: 'Unknown Album',
    artworkUrl: null,
  };
  let metadata = $state.raw<Metadata>(EMPTY_METADATA);
  let lyrics = $state('No lyrics available');
  let syncedLyrics = $state.raw<SyncedLyricLine[]>([]);
  let lyricsVersion = $state(0);
  let currentLineIndex = $state(-1);
  let isPlaying = $state(false);
  let lyricsVisible = $state(true);
  let tracks = $state.raw<TrackEntry[]>([]);
  let currentTrackId = $state<string | null>(null);
  let playlistOpen = $state(false);

  let audioElement: HTMLAudioElement;
  // Scale tweens go on the frame, rotation on the disc, so the sheen (a sibling of the disc) scales but never spins.
  let vinylFrame: HTMLDivElement;
  let vinylElement: HTMLDivElement;
  let vinylAnimation: gsap.core.Tween | null = null;

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter += 1;
    if (!dragging) {
      dragging = true;
      gsap.to(vinylFrame, { scale: 1.05, duration: 0.2, ease: 'power1.out' });
    }
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = Math.max(0, dragCounter - 1);
    if (dragCounter === 0) {
      dragging = false;
      gsap.to(vinylFrame, { scale: 1, duration: 0.25, ease: 'power1.out' });
    }
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    dragging = false;
    gsap.to(vinylFrame, { scale: 1, duration: 0.25, ease: 'power1.out' });

    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    if (!droppedFiles.length) return;

    await addTracks(droppedFiles);
    if (tracks.length && !currentTrackId) {
      playTrack(tracks[0].id);
    }
  }

  onMount(async () => {
    await hydratePlaylist();
    if (tracks.length) {
      playTrack(tracks[0].id, false);
    }
  });

  async function hydratePlaylist() {
    const stored = await loadTracks();
    const order = loadOrder();
    const ordered = [...stored].sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    const hydrated: TrackEntry[] = [];
    for (const rec of ordered) {
      const fileObj = new File([rec.file], rec.fileName, { lastModified: rec.lastModified });
      const meta = await parseMusicMetadata(fileObj);
      hydrated.push({
        id: rec.id,
        metadata: meta,
        objectUrl: URL.createObjectURL(rec.file),
        fileName: rec.fileName,
        lastModified: rec.lastModified,
      });
    }
    tracks = hydrated;
    saveOrder();

    // Prefetch lyrics for hydrated tracks if not cached
    for (const t of tracks) {
      getCachedLyrics(t.id).then((cache) => {
        if (cache) return;
        fetchLyrics(t.metadata.artist, t.metadata.title)
          .then(({ plain, synced }) => setCachedLyrics({
            id: t.id,
            plain: plain || 'No lyrics available',
            synced: synced || null,
            updatedAt: Date.now(),
          }))
          .catch(() => {});
      });
    }
  }

  async function playTrack(id: string, shouldRamp = true) {
    if (!audioElement) return;
    const track = tracks.find((t) => t.id === id);
    if (!track || !track.objectUrl) return;
    currentTrackId = id;
    metadata = track.metadata;

    audioElement.src = track.objectUrl;
    audioElement.load();
    if (shouldRamp) {
      await rampToPlay();
      startVinylRotation();
      isPlaying = true;
    }

    const cache = await getCachedLyrics(id);
    if (cache) {
      lyrics = cache.plain || 'No lyrics available';
      syncedLyrics = parseSyncedLyrics(cache.synced);
      currentLineIndex = -1;
      lyricsVersion += 1;
    } else {
      lyrics = 'Loading lyrics...';
      syncedLyrics = [];
      currentLineIndex = -1;
      lyricsVersion += 1;
      const currentId = currentTrackId;
      fetchLyrics(metadata.artist, metadata.title)
        .then(({ plain, synced }) => {
          if (currentTrackId !== currentId) return;
          lyrics = plain || 'No lyrics available';
          syncedLyrics = parseSyncedLyrics(synced);
          currentLineIndex = -1;
          lyricsVersion += 1;
          setCachedLyrics({
            id,
            plain: lyrics,
            synced: synced || null,
            updatedAt: Date.now(),
          }).catch(() => {});
        })
        .catch(() => {
          if (currentTrackId !== currentId) return;
          lyrics = 'No lyrics available';
          syncedLyrics = [];
          currentLineIndex = -1;
          lyricsVersion += 1;
        });
    }
  }

  function saveOrder() {
    try {
      localStorage.setItem(PLAYLIST_ORDER_KEY, JSON.stringify(tracks.map((t) => t.id)));
    } catch (err) {
      console.warn('Failed saving order', err);
    }
  }

  function loadOrder(): string[] {
    try {
      const raw = localStorage.getItem(PLAYLIST_ORDER_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  function moveTrack(id: string, delta: number) {
    const idx = tracks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const target = Math.min(Math.max(0, idx + delta), tracks.length - 1);
    if (idx === target) return;
    const clone = [...tracks];
    const [item] = clone.splice(idx, 1);
    clone.splice(target, 0, item);
    tracks = clone;
    saveOrder();
  }

  async function removeTrack(id: string) {
    const idx = tracks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const wasCurrentTrack = currentTrackId === id;
    const wasPlaying = isPlaying && wasCurrentTrack;

    // Smoothly fade out if currently playing
    if (wasPlaying && audioElement) {
      slowStopVinyl();
      await new Promise(resolve => {
        gsap.to(audioElement, {
          volume: 0,
          duration: 0.4,
          ease: 'power2.in',
          onComplete: resolve
        });
      });
    }

    const removed = tracks[idx];
    await deleteTrack(id);
    await deleteCachedLyrics(id);
    tracks = tracks.filter((t) => t.id !== id);
    saveOrder();

    if (wasCurrentTrack) {
      const next = tracks[idx] || tracks[idx - 1];
      if (next) {
        await playTrack(next.id);
        if (audioElement) audioElement.volume = 1;
      } else {
        isPlaying = false;
        currentTrackId = null;
        metadata = EMPTY_METADATA;
        lyrics = 'No lyrics available';
        syncedLyrics = [];
        currentLineIndex = -1;
        lyricsVersion += 1;
        if (audioElement) {
          audioElement.pause();
          audioElement.removeAttribute('src');
          audioElement.volume = 1;
        }
      }
    }

    // Free the blobs only after the audio element and artwork have switched away from them.
    if (removed.objectUrl) URL.revokeObjectURL(removed.objectUrl);
    if (removed.metadata.artworkUrl) URL.revokeObjectURL(removed.metadata.artworkUrl);
  }

  async function addTracks(files: File[]) {
    for (const f of files) {
      try {
        const meta = await parseMusicMetadata(f);
        const id = crypto.randomUUID();
        const objectUrl = URL.createObjectURL(f);

        tracks = [...tracks, {
          id,
          metadata: meta,
          objectUrl,
          fileName: f.name,
          lastModified: f.lastModified,
        }];

        saveOrder();

        await saveTrack({
          id,
          metadata: meta,
          file: f,
          fileName: f.name,
          lastModified: f.lastModified,
        });

        // Prefetch lyrics in the background
        fetchLyrics(meta.artist, meta.title).then(({ plain, synced }) =>
          setCachedLyrics({
            id,
            plain: plain || 'No lyrics available',
            synced: synced || null,
            updatedAt: Date.now(),
          })
        ).catch(() => {});
      } catch (err) {
        console.error('Failed to add track', err);
      }
    }
  }

  function startVinylRotation() {
    if (!vinylElement) return;
    gsap.killTweensOf(vinylElement);
    gsap.killTweensOf(vinylFrame);
    vinylAnimation?.kill();

    // Scale animation
    gsap.fromTo(
      vinylFrame,
      { scale: 0.96 },
      { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.6)' }
    );

    // Acceleration phase, then seamless transition to continuous rotation
    gsap.to(vinylElement, {
      rotation: '+=180',
      duration: 0.9,
      ease: 'power2.out',
      onComplete: () => {
        // Start continuous rotation after acceleration completes
        vinylAnimation = gsap.to(vinylElement, {
          rotation: '+=360',
          duration: 5,
          ease: 'linear',
          repeat: -1,
        });
      }
    });
  }

  function continueVinylRotation() {
    // Continue rotation without acceleration (for seeking while playing)
    if (!vinylElement) return;
    vinylAnimation?.kill();
    gsap.killTweensOf(vinylElement);

    vinylAnimation = gsap.to(vinylElement, {
      rotation: '+=360',
      duration: 5,
      ease: 'linear',
      repeat: -1,
    });
  }

  function slowStopVinyl() {
    if (!vinylElement) return;
    vinylAnimation?.kill();
    vinylAnimation = null;
    gsap.killTweensOf(vinylElement);
    gsap.to(vinylElement, {
      rotation: '+=120',
      duration: 1.2,
      ease: 'power3.out',
    });
  }

  async function rampToPlay() {
    if (!audioElement) return;
    gsap.killTweensOf(audioElement);
    audioElement.playbackRate = 0.85;
    await audioElement.play();
    gsap.to(audioElement, {
      playbackRate: 1,
      duration: 0.6,
      ease: 'power2.out',
    });
  }

  function rampToPause() {
    if (!audioElement) return;
    gsap.killTweensOf(audioElement);
    gsap.to(audioElement, {
      playbackRate: 0.4,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: () => {
        audioElement.pause();
        audioElement.playbackRate = 1;
      },
    });
  }

  function handlePlayPause() {
    if (!audioElement) return;

    if (isPlaying) {
      rampToPause();
      slowStopVinyl();
    } else {
      rampToPlay();
      startVinylRotation();
    }
    isPlaying = !isPlaying;
  }

  async function seekBy(deltaSeconds: number, direction: 'forward' | 'backward') {
    if (!audioElement) return;
    const wasPlaying = isPlaying;

    // Add vinyl-style audio scrubbing during seek
    if (wasPlaying && audioElement) {
      // Speed up for both forward and backward
      const scrubRate = 3.0;

      // Scrub effect while seeking
      gsap.killTweensOf(audioElement);
      gsap.to(audioElement, {
        playbackRate: scrubRate,
        duration: 0.1,
        ease: 'power2.out',
        onComplete: () => {
          // After brief scrub, seek to new position
          setTimeout(() => {
            const nextTime = Math.min(
              Math.max(0, audioElement.currentTime + deltaSeconds),
              audioElement.duration || audioElement.currentTime + deltaSeconds
            );
            audioElement.currentTime = nextTime;

            // Return to normal playback
            gsap.to(audioElement, {
              playbackRate: 1,
              duration: 0.2,
              ease: 'power2.out'
            });
          }, 50);
        }
      });
    } else {
      const nextTime = Math.min(
        Math.max(0, audioElement.currentTime + deltaSeconds),
        audioElement.duration || audioElement.currentTime + deltaSeconds
      );
      audioElement.currentTime = nextTime;
    }

    // Animate vinyl spinning in the seek direction
    if (vinylElement) {
      const spinAmount = direction === 'forward' ? 120 : -120;

      // Kill existing animations
      vinylAnimation?.kill();
      vinylAnimation = null;
      gsap.killTweensOf(vinylElement);

      // Quick spin in the seek direction
      gsap.to(vinylElement, {
        rotation: `+=${spinAmount}`,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          // Resume normal rotation if still playing (without re-acceleration)
          if (wasPlaying && vinylElement) {
            continueVinylRotation();
          }
        }
      });
    }
  }

  // Endless queue: a finished track hands off to the next one, wrapping from the last back to the first.
  function handleAudioEnded() {
    if (!tracks.length) return;
    const idx = tracks.findIndex((t) => t.id === currentTrackId);
    playTrack(tracks[(idx + 1) % tracks.length].id);
  }

  function updateCurrentLine(time: number) {
    if (!syncedLyrics.length) return;
    let idx = -1;
    for (let i = 0; i < syncedLyrics.length; i++) {
      if (time + 0.05 >= syncedLyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    currentLineIndex = idx;
  }

  onDestroy(() => {
    for (const t of tracks) {
      if (t.objectUrl) URL.revokeObjectURL(t.objectUrl);
      if (t.metadata.artworkUrl) URL.revokeObjectURL(t.metadata.artworkUrl);
    }
    vinylAnimation?.kill();
  });
</script>

<section
  class="w-screen h-screen bg-[#282828] p-12 text-[#EBEBEB] relative overflow-hidden"
  style:background-image={metadata.artworkUrl ? `url(${metadata.artworkUrl})` : null}
  style:background-size={metadata.artworkUrl ? '110%' : null}
  style:background-position={metadata.artworkUrl ? 'center' : null}
  ondragover={handleDragOver}
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  role="main"
>
  <div class="absolute inset-0 bg-black/30 backdrop-blur-96"></div>
  <div
    class="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/65 via-black/45 to-transparent"
  ></div>

  {#if dragging}
    <div
      transition:fade={{ duration: 150 }}
      class="absolute inset-0 bg-[#282828]/60 flex items-center justify-center z-50 backdrop-blur-sm"
    >
      <p class="text-2xl font-bold tracking-tight">
        Drop your music file here!
      </p>
    </div>
  {/if}

  <audio
    bind:this={audioElement}
    onended={handleAudioEnded}
    onpause={() => (isPlaying = false)}
    onplay={() => (isPlaying = true)}
    ontimeupdate={(e) => updateCurrentLine(e.currentTarget.currentTime)}
  ></audio>

  <div class="relative w-full h-full flex flex-col md:flex-row items-center md:items-stretch md:justify-between gap-8">
    <!-- Left: Vinyl -->
    <div class="flex items-center justify-center flex-[1.2]">
      <div bind:this={vinylFrame} class="vinyl-frame relative w-full max-w-[580px] aspect-square">
        <div
          bind:this={vinylElement}
          class="vinyl-disc flex items-center justify-center rounded-full w-full h-full select-none cursor-default"
        >
          {#if metadata.artworkUrl}
            <img
              src={metadata.artworkUrl}
              alt="Album Artwork"
              class="w-[70%] h-[70%] rounded-full z-10"
            />
          {:else}
            <div class="w-[70%] h-[70%] bg-gray-300 rounded-full flex items-center justify-center z-10">
              <p class="text-sm text-gray-700 p-12">No Artwork</p>
            </div>
          {/if}
        </div>
        <div class="vinyl-sheen" aria-hidden="true"></div>
      </div>
    </div>

    <!-- Center: Lyrics -->
    <div class="flex-1 flex items-center justify-center">
      <LyricsDisplay
        visible={lyricsVisible}
        syncedLines={syncedLyrics}
        plainLyrics={lyrics}
        {currentLineIndex}
        version={lyricsVersion}
      />
    </div>

    <!-- Right: Song Info + Controls -->
    <div class="flex flex-col items-end gap-8 min-w-[220px]">
      <SongInfo
        trackId={currentTrackId}
        title={metadata.title}
        artist={metadata.artist}
        album={metadata.album}
        {isPlaying}
      />
      <Controls
        {isPlaying}
        onPlayPause={handlePlayPause}
        onRewind={() => seekBy(-5, 'backward')}
        onFastForward={() => seekBy(5, 'forward')}
        onToggleLyrics={() => (lyricsVisible = !lyricsVisible)}
        onTogglePlaylist={() => (playlistOpen = !playlistOpen)}
      />
    </div>
  </div>

  <div class={['playlist-drawer', playlistOpen && 'open']}>
    <div class="drawer-header">
      <div class="title">Playlist</div>
      <button class="close-btn" onclick={() => (playlistOpen = false)} aria-label="Close playlist">
        <X size={20} />
      </button>
    </div>
    <div class="drawer-body">
      <Playlist
        items={tracks.map((t) => ({
          id: t.id,
          title: t.metadata.title,
          artist: t.metadata.artist,
          hasBlob: Boolean(t.objectUrl),
        }))}
        currentId={currentTrackId}
        onPlay={playTrack}
        onRemove={removeTrack}
        onMoveUp={(id) => moveTrack(id, -1)}
        onMoveDown={(id) => moveTrack(id, 1)}
      />
    </div>
  </div>
</section>

<style>
  .playlist-drawer {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: min(420px, 90vw);
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(14px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    padding: 16px;
    transform: translateX(100%);
    opacity: 0;
    transition: transform 0.25s ease, opacity 0.25s ease;
    z-index: 50;
    display: flex;
    flex-direction: column;
    pointer-events: none;
    visibility: hidden;
  }

  .playlist-drawer.open {
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
    visibility: visible;
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .drawer-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .drawer-header .title {
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 6px;
    color: #f4f4f4;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.14);
  }
</style>
