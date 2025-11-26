import axios from "axios";

export type LyricsResult = {
  plain: string;
  synced: string | null;
};

export async function fetchLyrics(
  artist: string,
  title: string
): Promise<LyricsResult> {
  try {
    const response = await axios.get("https://lrclib.net/api/get", {
      params: { artist_name: artist, track_name: title },
      headers: {
        "Lrclib-Client": "Dropbeat/1.0",
      },
    });

    return {
      plain: response.data.plainLyrics || "No lyrics available",
      synced: response.data.syncedLyrics || null,
    };
  } catch (error) {
    return { plain: "No lyrics available", synced: null };
  }
}
