import jsmediatags from "jsmediatags/dist/jsmediatags.min.js";
import { Metadata } from "../types";

export const parseMusicMetadata = (
  file: File
): Promise<{ metadata: Metadata }> => {
  return new Promise((resolve, reject) => {
    new jsmediatags.Reader(file).read({
      onSuccess: (tag: any) => {
        const { title, artist, album, picture } = tag.tags;

        // Convert artwork to base64
        let artworkUrl: string | null = null;
        if (picture && picture.data && picture.format) {
          const base64String = picture.data
            .map((byte: number) => String.fromCharCode(byte))
            .join("");
          artworkUrl = `data:${picture.format};base64,${btoa(base64String)}`;
        }

        const metadata = {
          title: title || "Unknown Title",
          artist: artist || "Unknown Artist",
          album: album || "Unknown Album",
          artworkUrl,
        };

        resolve({ metadata });
      },
      onError: (error: Error) => {
        reject(error);
      },
    });
  });
};
