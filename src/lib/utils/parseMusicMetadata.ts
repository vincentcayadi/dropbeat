// @ts-ignore
import jsmediatags from "jsmediatags/dist/jsmediatags.min.js";
import type { Metadata } from "../../types";

export async function parseMusicMetadata(file: File): Promise<Metadata> {
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: (tag: any) => {
        const { title, artist, album, picture } = tag.tags;

        let artworkUrl = null;
        if (picture) {
          const { data, format } = picture;
          const blob = new Blob([new Uint8Array(data)], { type: format });
          artworkUrl = URL.createObjectURL(blob);
        }

        resolve({
          title: title || "Unknown Title",
          artist: artist || "Unknown Artist",
          album: album || "Unknown Album",
          artworkUrl,
        });
      },
      onError: () => {
        resolve({
          title: file.name,
          artist: "Unknown Artist",
          album: "Unknown Album",
          artworkUrl: null,
        });
      },
    });
  });
}
