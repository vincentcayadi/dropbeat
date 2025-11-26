export type SyncedLyricLine = {
  time: number; // seconds
  text: string;
};

export function parseSyncedLyrics(raw: string | null | undefined): SyncedLyricLine[] {
  if (!raw) return [];

  return raw
    .split('\n')
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/);
      if (!match) return null;
      const [, m, s, ms, text] = match;
      const minutes = Number(m);
      const seconds = Number(s);
      const millis = ms ? Number(ms) : 0;
      const time = minutes * 60 + seconds + millis / 1000;
      if (!text) return null;
      return { time, text } as SyncedLyricLine;
    })
    .filter((entry): entry is SyncedLyricLine => Boolean(entry))
    .sort((a, b) => a.time - b.time);
}
