## Playback and Layout

- Previous/next track buttons. Next wraps from the last track to the first; previous restarts the song after its first 3 seconds, otherwise goes back a track (wrapping to the last).
- Media Session API: media keys and the OS lock screen or Control Center show the title, artist, and artwork, and can play, pause, skip, and seek.
- From md up, the controls sit beside a full-height vertical title, so titles no longer truncate on 720px-tall screens. Phones stack vinyl, a horizontal title ticker, lyrics, and a row of controls.
- Synced lyrics scroll the active line to the vertical centre; short or plain lyrics are centred; the panel fades out at its top and bottom edges.
- Old lyrics fade out before new ones fade in, instead of overlapping.
- A second click on Remove during the fade-out is ignored instead of removing the track twice.
- `play()` failures (no track, autoplay blocked, interrupted load) no longer leave the volume at 0, the vinyl spinning, or the Pause icon showing.

## Svelte 5 Cleanup

- Finished tracks are no longer deleted from the playlist and IndexedDB. The queue plays endlessly, wrapping from the last track back to the first.
- Components use Svelte 5 runes (`$props`, `$state`, `$derived`, `$effect`) and `onclick`-style events.
- Icons come from `@lucide/svelte` instead of pasted SVG markup.
- The song title is vertical (`writing-mode: vertical-rl`) with an `album · artist` line. On track change the old title leaves through the top and the next rises from the bottom; reduced motion keeps only the crossfade.
- The vinyl has a fixed light sheen outside the spinning disc, so the reflection stays put while the record turns.
- The vinyl drop shadow lives on a non-rotating frame. It no longer disappears after the first pause, and it no longer orbits the disc while it spins.
- Removing a track frees its audio and artwork blob URLs. Removing the last track resets the title, artwork, and lyrics to the empty state.
- Lyric lines carry line numbers and render in keyed each blocks.
- Synced lyric timestamps read the fraction as decimal seconds (`[00:14.77]` is 14.77s, not 14.077s), so lines no longer light up up to ~0.9s early.
- Removed Next.js leftovers (`tailwind.config.ts`, tsconfig plugin, starter SVGs), `LyricsPanel.svelte`, axios (now `fetch`), Zod, and a lyrics mask animation that never ran.

## UI and Playback Changes

- Lyrics moved into `src/lib/components/LyricsDisplay.svelte` with Svelte `fade` transitions on load/toggle, synced-vs-plain auto selection, smooth autoscroll to the active synced line, hidden scrollbar, and top/bottom gradient fades.
- Song info now has a subtle “now playing” equalizer indicator driven by `isPlaying`; animations pause when playback pauses (`src/lib/components/SongInfo.svelte`).
- Rewind/fast-forward now pause, seek, then resume with ramped playback and vinyl spin, plus a small rotation nudge so vinyl/audio stay in sync (`src/App.svelte`).
- Drag/drop keeps the vinyl/overlay motion cues; vinyl start/stop ramping and lyric toggling animations remain.

## YouTube Audio (serverless yt-dlp) Outline

If you want paste-to-play YouTube links/playlists:
1. Add a serverless route (e.g., `/api/youtube/resolve`) that shells out to `yt-dlp`:
   - Single video: `yt-dlp -f bestaudio --dump-json <url>` → parse `title`, `uploader`, `thumbnail`, `duration`, pick an audio-only URL (m4a/webm) from `formats`.
   - Playlist: `yt-dlp --yes-playlist --dump-json <playlistUrl>` → stream each JSON line into an `items` array with the same fields.
2. Return JSON:
   ```json
   { "source": "youtube", "title": "...", "artist": "...", "thumbnail": "...", "duration": 0, "audioUrl": "https://..." }
   // or for playlists: { "items": [ ... ] }
   ```
3. Client flow (Svelte):
   - On paste of a YouTube URL, call `/api/youtube/resolve`.
   - Set `audioElement.src` to `audioUrl`, set `metadata` (title/artist/thumbnail), and fetch lyrics with those fields.
   - For playlists, keep a queue (`tracks[]`, `currentIndex`) and wire FF/Rewind to next/prev when near the ends.

Notes:
- Keep the serverless function stateless; optionally cache responses by URL.
- If you prefer not to shell out, a YouTube Data API + `youtubei.js` can replace `yt-dlp`, but you still need to resolve a direct audio stream URL server-side.
