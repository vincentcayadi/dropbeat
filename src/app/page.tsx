"use client";

import { useState, useRef, useEffect } from "react";
import { Metadata } from "../types";
import { parseMusicMetadata } from "../utils/parseMusicMetadata";
import fetchLyrics from "@/utils/fetchLyrics";
import gsap from "gsap";
import Controls from "@/components/Controls";
import SongInfo from "@/components/SongInfo";

export default function Home() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<Metadata>({
    title: "Sample Title",
    artist: "Unknown Artist",
    album: "",
    artworkUrl: null,
  });
  const [lyrics, setLyrics] = useState<string>("No lyrics available");
  const [tempLyrics, setTempLyrics] = useState<string>("No lyrics available"); // Temporary lyrics state for animation
  const [isPlaying, setIsPlaying] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vinylRef = useRef<HTMLDivElement | null>(null);
  const lyricsRef = useRef<HTMLDivElement | null>(null);
  const initialLoadRef = useRef<boolean>(true); // Prevents animation on first render
  const timelineRef = useRef<GSAPTimeline | null>(null);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const uploadedFile = droppedFiles[0];
      setFile(uploadedFile);

      // Reset everything
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        gsap.killTweensOf(vinylRef.current);
      }
      setIsPlaying(false);

      try {
        const { metadata } = await parseMusicMetadata(uploadedFile);
        setMetadata(metadata);

        // Autoplay audio
        if (audioRef.current) {
          audioRef.current.src = URL.createObjectURL(uploadedFile);
          audioRef.current.load();
          audioRef.current.play();

          gsap.killTweensOf(vinylRef.current);
          gsap.to(vinylRef.current, {
            rotation: "+=360",
            repeat: -1,
            duration: 5,
            ease: "linear",
          });

          setIsPlaying(true);
        }

        setBackgroundImage(metadata.artworkUrl || null);

        // Fetch lyrics
        if (metadata.title && metadata.artist) {
          const fetchedLyrics = await fetchLyrics(
            metadata.artist,
            metadata.title
          );
          setLyrics(fetchedLyrics || "No lyrics available");
        }
      } catch (error) {
        console.error("Error parsing metadata or fetching lyrics:", error);
      }
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      gsap.killTweensOf(vinylRef.current);
    } else {
      audioRef.current.play();
      gsap.to(vinylRef.current, {
        rotation: "+=360",
        repeat: -1,
        duration: 5,
        ease: "linear",
      });
    }

    setIsPlaying(!isPlaying);
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 5;
    }
  };

  const handleFastForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 5;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      const handleTimeUpdate = () => {
        const remainingTime = audio.duration - audio.currentTime;

        if (remainingTime <= 5) {
          const speed = Math.max(remainingTime / 5, 0.1);
          gsap.to(vinylRef.current, {
            rotation: "+=360",
            duration: 5 / speed,
            ease: "sine.out",
          });
        }
      };

      const handleAudioEnd = () => {
        gsap.killTweensOf(vinylRef.current);
        setIsPlaying(false);
      };

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleAudioEnd);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", handleAudioEnd);
      };
    }
  }, []);

  useEffect(() => {
    if (!initialLoadRef.current && lyricsRef.current) {
      const timeline = gsap.timeline({
        onComplete: () => {
          // Update the tempLyrics state to new lyrics after fade-out completes
          setTempLyrics(lyrics);
        },
      });

      // Fade out old lyrics
      timeline.to(lyricsRef.current, {
        autoAlpha: 0,
        y: -10,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          // Update lyricsRef content immediately after fade-out
          setTempLyrics(lyrics);
        },
      });

      // Fade in new lyrics
      timeline.to(lyricsRef.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.75,
        ease: "power2.in",
      });
    } else {
      // On initial load, directly set tempLyrics without animation
      setTempLyrics(lyrics);
      initialLoadRef.current = false;
    }
  }, [lyrics]);

  return (
    <section
      className="w-screen h-screen bg-[#282828] p-12 text-[#EBEBEB] relative overflow-hidden"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
        backgroundSize: "110%",
        backgroundPosition: "center",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-96"></div>

      {dragging && (
        <div className="absolute inset-0 bg-[#282828]/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <p className="text-2xl font-bold tracking-tight">
            Drop your music file here!
          </p>
        </div>
      )}
      <audio ref={audioRef} />
      <div className="grid grid-cols-1 md:grid-cols-2 h-full mx-auto">
        <div className="flex items-center justify-center h-full">
          <div
            ref={vinylRef}
            className={`vinyl-disc flex items-center justify-center rounded-full ${
              metadata.artworkUrl ? "max-w-[70%]" : "w-[70%]"
            } aspect-square`}
          >
            {metadata.artworkUrl ? (
              <img
                src={metadata.artworkUrl}
                alt="Album Artwork"
                className="w-[70%] h-[70%] rounded-full z-10"
              />
            ) : (
              <div className="w-[70%] h-[70%] bg-gray-300 rounded-full flex items-center justify-center z-10">
                <p className="text-sm text-gray-700 p-12">No Artwork</p>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 grid-rows-2 h-full justify-items-end z-20 overflow-hidden">
          <div
            ref={lyricsRef}
            className="row-span-2 col-span-2 justify-self-start p-4 overflow-y-auto text-left font-semibold leading-relaxed text-lg"
          >
            {tempLyrics.split("\n\n").map((paragraph, pIndex) => (
              <div key={pIndex} className="mb-6">
                {paragraph.split("\n").map((line, lIndex) => (
                  <p key={lIndex}>{line}</p>
                ))}
              </div>
            ))}
          </div>
          <SongInfo title={metadata.title} artist={metadata.artist} />
          <Controls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onRewind={handleRewind}
            onFastForward={handleFastForward}
          />
        </div>
      </div>
    </section>
  );
}
