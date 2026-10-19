export type LyricsResult = {
  plain: string;
  synced: string | null;
};

const NO_LYRICS: LyricsResult = { plain: "No lyrics available", synced: null };

export async function fetchLyrics(
  artist: string,
  title: string
): Promise<LyricsResult> {
  const params = new URLSearchParams({ artist_name: artist, track_name: title });
  try {
    const response = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { "Lrclib-Client": "Dropbeat/1.0" },
    });
    if (!response.ok) return NO_LYRICS;
    const data = await response.json();
    return {
      plain: data.plainLyrics || NO_LYRICS.plain,
      synced: data.syncedLyrics || null,
    };
  } catch {
    return NO_LYRICS;
  }
}
