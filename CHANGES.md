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
