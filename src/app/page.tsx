"use client";

import { useState, useRef, useEffect } from "react";
import { Metadata } from "../types";
import { parseMusicMetadata } from "../utils/parseMusicMetadata";
import { Play, Pause, FastForward, Rewind } from "lucide-react";
import gsap from "gsap";
import Image from "next/image";

export default function Home() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<Metadata>({
    title: "Sample Title",
    artist: "Unknown Artist",
    album: "",
    artworkUrl: null,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null); // Stores the background artwork URL

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vinylRef = useRef<HTMLDivElement | null>(null);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const uploadedFile = droppedFiles[0];
      setFile(uploadedFile);

      // Reset everything to the initial state
      if (audioRef.current) {
        audioRef.current.pause(); // Stop current audio
        audioRef.current.currentTime = 0; // Reset playback time
        gsap.killTweensOf(vinylRef.current); // Stop vinyl rotation
      }
      setIsPlaying(false); // Ensure play/pause state is reset

      try {
        const { metadata } = await parseMusicMetadata(uploadedFile);
        setMetadata(metadata);

        // Load the new audio file
        if (audioRef.current) {
          audioRef.current.src = URL.createObjectURL(uploadedFile);

          // Autoplay the audio after it is loaded
          audioRef.current.load(); // Ensure the audio is loaded
          audioRef.current.play(); // Play the audio

          // Start vinyl rotation animation
          gsap.killTweensOf(vinylRef.current); // Stop any ongoing animation
          gsap.to(vinylRef.current, {
            rotation: "+=360", // Continue rotating
            repeat: -1, // Infinite loop
            duration: 5, // Adjust duration as needed
            ease: "linear", // Maintain constant velocity
          });

          setIsPlaying(true); // Set play state to true
        }

        // Set the artwork as the background image
        if (metadata.artworkUrl) {
          setBackgroundImage(metadata.artworkUrl);
        }
      } catch (error) {
        console.error("Error parsing metadata:", error);
      }
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // Pause the audio and stop the vinyl rotation
      audioRef.current.pause();
      gsap.killTweensOf(vinylRef.current); // Stop vinyl rotation
    } else {
      // Play the audio and start vinyl rotation
      audioRef.current.play();
      gsap.killTweensOf(vinylRef.current); // Stop any ongoing animation
      gsap.to(vinylRef.current, {
        rotation: "+=360", // Continue rotating
        repeat: -1, // Infinite loop
        duration: 5, // Adjust duration as needed
        ease: "linear", // Maintain constant velocity
      });
    }

    setIsPlaying(!isPlaying);
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 5; // Rewind 5 seconds
    }
  };

  const handleFastForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 5; // Fast forward 5 seconds
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

  return (
    <section
      className="w-screen h-screen bg-[#282828] p-12 text-[#EBEBEB] relative overflow-hidden"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none", // Use the artwork as the background image
        backgroundSize: "110%", // Increase the size for a zoom effect

        backgroundPosition: "center", // Center the zoomed-in artwork
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
        <div className="absolute inset-0 bg-[#282828]/60 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <p className="text-2xl font-bold tracking-tight">
            Drop your music file here!
          </p>
        </div>
      )}
      <audio ref={audioRef} />
      <div className="grid grid-cols-1 md:grid-cols-2 h-full mx-auto ">
        <div className="flex items-center justify-center h-full">
          <div
            ref={vinylRef}
            className={`vinyl-disc flex items-center justify-center rounded-full ${
              metadata.artworkUrl ? "max-w-[70%]" : "w-[70%] "
            } aspect-square`}
          >
            {metadata.artworkUrl ? (
              <Image
                src={metadata.artworkUrl || ""}
                alt="Album Artwork"
                width={300} // Adjust size to match your design
                height={300}
                className="rounded-full z-10"
              />
            ) : (
              <div className="w-[70%] h-[70%] bg-gray-300 rounded-full flex items-center justify-center z-10">
                <p className="text-sm text-gray-700 p-12">No Artwork</p>
              </div>
            )}
          </div>
        </div>
        {/* Controls Section */}
        <div className="relative flex flex-col h-full">
          {/* Frosted Glass Overlay */}

          {/* Vertical Song Info */}
          <div className="absolute top-0 right-0 z-20">
            <div className="rotate-270" style={{ writingMode: "vertical-rl" }}>
              <div className="font-bold text-3xl overflow-hidden whitespace-nowrap tracking-tighter">
                {metadata.title || "Sample Title"}
              </div>
              <h2 className=" text-lg tracking-tight text-[#e7e7e7]">
                {metadata.artist || "Musician Name"}
              </h2>
            </div>
          </div>

          {/* Playback Buttons */}
          <div className="absolute bottom-0 right-0 flex flex-col z-20">
            {/* Rewind Button */}
            <div>
              <button
                onClick={handleRewind}
                className="p-4 hover:scale-95 transition duration-300"
              >
                <Rewind size={26} color="#EBEBEB" className="drop-shadow-lg" />
              </button>
            </div>

            {/* Play/Pause Button */}
            <div>
              <button
                onClick={handlePlayPause}
                className={`p-4 hover:scale-95 transition duration-300 ${
                  isPlaying ? "animate-play-to-pause" : "animate-pause-to-play"
                }`}
              >
                {isPlaying ? (
                  <Pause size={26} color="#EBEBEB" className="drop-shadow-lg" />
                ) : (
                  <Play size={26} color="#EBEBEB" className="drop-shadow-lg" />
                )}
              </button>
            </div>
            {/* Fast Forward Button */}
            <div>
              <button
                onClick={handleFastForward}
                className="p-4 hover:scale-95 transition duration-300 "
              >
                <FastForward
                  size={26}
                  color="#EBEBEB"
                  className="drop-shadow-lg"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
