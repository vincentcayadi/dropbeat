export type Metadata = {
  title: string;
  artist: string;
  album: string;
  artworkUrl: string | null;
};

export type Lyric = {
  time: number; // Time in seconds
  text: string; // Lyric line
};
