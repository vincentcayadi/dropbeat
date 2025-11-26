<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import gsap from 'gsap';
  import type { Metadata } from './types';
  import { parseMusicMetadata } from './lib/utils/parseMusicMetadata';
  import { fetchLyrics } from './lib/utils/fetchLyrics';
  import { parseSyncedLyrics, type SyncedLyricLine } from './lib/utils/parseSyncedLyrics';
  import Controls from './lib/components/Controls.svelte';
  import SongInfo from './lib/components/SongInfo.svelte';
  import LyricsDisplay from './lib/components/LyricsDisplay.svelte';
  import Playlist from './lib/components/Playlist.svelte';
  import { saveTrack, deleteTrack, loadTracks } from './lib/utils/idbPlaylist';
  import type { TrackEntry } from './lib/utils/playlistTypes';
  import { PLAYLIST_ORDER_KEY } from './lib/utils/playlistTypes';
  import { getCachedLyrics, setCachedLyrics, deleteCachedLyrics } from './lib/utils/lyricsCache';

  let dragging = false;
  let dragCounter = 0;
  let metadata: Metadata = {
    title: 'Sample Title',
    artist: 'Unknown Artist',
    album: 'Unknown Album',
    artworkUrl: null,
  };
  let lyrics = 'No lyrics available';
  let displayedLyrics = lyrics;
  let syncedLyrics: SyncedLyricLine[] = [];
  let displayedSynced: SyncedLyricLine[] = [];
  let lyricsVersion = 0;
  let appliedLyricsVersion = -1;
  let isInitialLyrics = true;
  let currentLineIndex = -1;
  let isPlaying = false;
  let lyricsVisible = true;
  let backgroundImage: string | null = null;
  let tracks: TrackEntry[] = [];
  let currentTrackId: string | null = null;
  let playlistOpen = false;

  let audioElement: HTMLAudioElement;
  let vinylElement: HTMLDivElement;
  let maskElement: HTMLDivElement;
  let dropOverlayElement: HTMLDivElement;
  let vinylAnimation: any = null;
  let currentAudioUrl: string | null = null;

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
      gsap.to(vinylElement, { scale: 1.05, duration: 0.2, ease: 'power1.out' });
      if (dropOverlayElement) {
        gsap.fromTo(
          dropOverlayElement,
          { autoAlpha: 0.4, scale: 0.98 },
          { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power1.out' }
        );
      }
    }
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = Math.max(0, dragCounter - 1);
    if (dragCounter === 0) {
      dragging = false;
      gsap.to(vinylElement, { scale: 1, duration: 0.25, ease: 'power1.out' });
      if (dropOverlayElement) {
        gsap.to(dropOverlayElement, { autoAlpha: 0, duration: 0.2, ease: 'power1.in' });
      }
    }
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    dragging = false;
    gsap.to(vinylElement, { scale: 1, duration: 0.25, ease: 'power1.out' });
    if (dropOverlayElement) {
      gsap.to(dropOverlayElement, { autoAlpha: 0, duration: 0.2, ease: 'power1.in' });
    }

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
    const cleanedOrder = tracks.map((t) => t.id);
    saveOrder(cleanedOrder);

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
    backgroundImage = metadata.artworkUrl;

    currentAudioUrl = track.objectUrl;
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

  function saveOrder(order?: string[]) {
    try {
      const payload = order ?? tracks.map((t) => t.id);
      localStorage.setItem(PLAYLIST_ORDER_KEY, JSON.stringify(payload));
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

  async function removeTrack(id: string, opts: { advanceOnRemove?: boolean } = {}) {
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

    const [removed] = tracks.splice(idx, 1);
    if (removed.objectUrl) URL.revokeObjectURL(removed.objectUrl);
    await deleteTrack(id);
    await deleteCachedLyrics(id);
    tracks = [...tracks];
    saveOrder();

    if (wasCurrentTrack) {
      const next = opts.advanceOnRemove ? tracks[idx] || tracks[idx - 1] : null;
      if (next) {
        // Smoothly transition to next track
        await playTrack(next.id);
        if (audioElement) audioElement.volume = 1;
      } else {
        isPlaying = false;
        currentTrackId = null;
        if (audioElement) {
          audioElement.pause();
          audioElement.removeAttribute('src');
          audioElement.volume = 1;
        }
        currentAudioUrl = null;
      }
    }
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
    if (vinylAnimation) {
      vinylAnimation.kill();
    }

    // Scale animation
    gsap.fromTo(
      vinylElement,
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
    if (vinylAnimation) {
      vinylAnimation.kill();
    }
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
    if (vinylAnimation) {
      vinylAnimation.kill();
      vinylAnimation = null;
    }
    gsap.killTweensOf(vinylElement);
    gsap.to(vinylElement, {
      rotation: '+=120',
      duration: 1.2,
      ease: 'power3.out',
      boxShadow: '0 0 0 rgba(0,0,0,0)',
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

  async function handleRewind() {
    await seekBy(-5, 'backward');
  }

  async function handleFastForward() {
    await seekBy(5, 'forward');
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
      if (vinylAnimation) {
        vinylAnimation.kill();
        vinylAnimation = null;
      }
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

  function handleToggleLyrics() {
    lyricsVisible = !lyricsVisible;
  }

  function togglePlaylist() {
    playlistOpen = !playlistOpen;
  }

  async function handleAudioEnded() {
    slowStopVinyl();
    isPlaying = false;
    if (audioElement) {
      audioElement.playbackRate = 1;
    }
    if (currentTrackId) {
      await removeTrack(currentTrackId, { advanceOnRemove: true });
    }
  }

  function nextIndex(): number | null {
    if (!tracks.length) return null;
    const idx = tracks.findIndex((t) => t.id === currentTrackId);
    if (idx === -1) return 0;
    if (idx < tracks.length - 1) return idx + 1;
    return null;
  }

  function prevIndex(): number | null {
    if (!tracks.length) return null;
    const idx = tracks.findIndex((t) => t.id === currentTrackId);
    if (idx > 0) return idx - 1;
    return null;
  }

  function updateCurrentLine(time: number) {
    if (!displayedSynced.length) return;
    let idx = -1;
    for (let i = 0; i < displayedSynced.length; i++) {
      if (time + 0.05 >= displayedSynced[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    currentLineIndex = idx;
  }

  $: if (lyricsVersion !== appliedLyricsVersion) {
    displayedLyrics = lyrics;
    displayedSynced = syncedLyrics;
    appliedLyricsVersion = lyricsVersion;
    isInitialLyrics = false;
    currentLineIndex = -1;
  }

  $: if (maskElement && lyricsVersion !== appliedLyricsVersion) {
    gsap.fromTo(
      maskElement,
      { opacity: 0, xPercent: -5 },
      { opacity: 1, xPercent: 0, duration: 0.8, ease: 'power2.out' }
    );
  }

  onDestroy(() => {
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl);
    }
    if (metadata.artworkUrl) {
      URL.revokeObjectURL(metadata.artworkUrl);
    }
    tracks.forEach((t) => t.objectUrl && URL.revokeObjectURL(t.objectUrl));
    if (vinylAnimation) {
      vinylAnimation.kill();
    }
  });
</script>

<section
  class="w-screen h-screen bg-[#282828] p-12 text-[#EBEBEB] relative overflow-hidden"
    style:background-image={backgroundImage ? `url(${backgroundImage})` : null}
    style:background-size={backgroundImage ? '110%' : null}
    style:background-position={backgroundImage ? 'center' : null}
    on:dragover={handleDragOver}
    on:dragenter={handleDragEnter}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    role="main"
  >
  <div class="absolute inset-0 bg-black/30 backdrop-blur-96"></div>
  <div
    bind:this={maskElement}
    class="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/65 via-black/45 to-transparent"
  ></div>

  {#if dragging}
    <div
      bind:this={dropOverlayElement}
      class="absolute inset-0 bg-[#282828]/60 flex items-center justify-center z-50 backdrop-blur-sm"
    >
      <p class="text-2xl font-bold tracking-tight">
        Drop your music file here!
      </p>
    </div>
  {/if}

  <audio
    bind:this={audioElement}
    on:ended={handleAudioEnded}
    on:pause={() => (isPlaying = false)}
    on:play={() => (isPlaying = true)}
    on:timeupdate={(e) => updateCurrentLine((e.target as HTMLAudioElement).currentTime)}
  ></audio>

  <div class="relative w-full h-full max-w-9xl mx-auto flex flex-col md:flex-row items-center md:items-stretch md:justify-between gap-8">
    <!-- Left: Vinyl -->
    <div class="flex items-center justify-center flex-[1.2]">
      <div
        bind:this={vinylElement}
        class="vinyl-disc flex items-center justify-center rounded-full w-full max-w-[580px] aspect-square select-none cursor-default"
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
    </div>

    <!-- Center: Lyrics -->
    <div class="flex-1 flex items-center justify-center">
      <LyricsDisplay
        visible={lyricsVisible}
        syncedLines={displayedSynced}
        plainLyrics={displayedLyrics}
        currentLineIndex={currentLineIndex}
        version={appliedLyricsVersion}
      />
    </div>

    <!-- Right: Song Info + Controls -->
    <div class="flex flex-col justify-between items-end min-w-[220px]">
      <SongInfo title={metadata.title} artist={metadata.artist} isPlaying={isPlaying} />
      <Controls
        {isPlaying}
        onPlayPause={handlePlayPause}
        onRewind={handleRewind}
        onFastForward={handleFastForward}
        onToggleLyrics={handleToggleLyrics}
        onTogglePlaylist={togglePlaylist}
      />
    </div>
  </div>

  <div class={`playlist-drawer ${playlistOpen ? 'open' : ''}`}>
    <div class="drawer-header">
      <div class="title">Playlist</div>
      <button class="close-btn" on:click={() => (playlistOpen = false)} aria-label="Close playlist">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
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
        onPlay={(id) => playTrack(id)}
        onRemove={(id) => removeTrack(id, { advanceOnRemove: true })}
        onMoveUp={(id) => moveTrack(id, -1)}
        onMoveDown={(id) => moveTrack(id, 1)}
      />
    </div>
  </div>
</section>

<style>
  .lyrics-panel::-webkit-scrollbar {
    display: none;
  }

  .lyrics-panel {
    scrollbar-width: none;
  }

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
