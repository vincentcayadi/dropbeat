export type SyncedLyricLine = {
  id: number; // line number after sorting; lyrics never reorder, so position is the line's identity
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
      const [, m, s, fraction, text] = match;
      // Digits after the dot are a decimal fraction (LRC writes hundredths: `.34` = 0.34s), not milliseconds.
      const time = Number(m) * 60 + Number(s) + (fraction ? Number(`0.${fraction}`) : 0);
      if (!text) return null;
      return { time, text };
    })
    .filter((entry) => entry !== null)
    .sort((a, b) => a.time - b.time)
    .map((entry, id) => ({ id, ...entry }));
}
