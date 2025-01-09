import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

interface SongInfoProps {
  title: string;
  artist: string;
}

const SongInfo: React.FC<SongInfoProps> = ({ title, artist }) => {
  const [displayedTitle, setDisplayedTitle] = useState(title);
  const [displayedArtist, setDisplayedArtist] = useState(artist);

  const titleRef = useRef<HTMLDivElement>(null);
  const artistRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (displayedTitle !== title) {
      // Animate out the old title
      gsap.to(titleRef.current, {
        x: "100%", // Slide out to the right
        opacity: 0,
        duration: 0.5,
        ease: "power2.in", // Eased transition
        onComplete: () => {
          // Update the displayed title
          setDisplayedTitle(title);

          // Animate in the new title
          gsap.fromTo(
            titleRef.current,
            { x: "-100%", opacity: 0 }, // Start position: off-screen to the left
            { x: "0%", opacity: 1, duration: 0.5, ease: "power2.out" } // End position: fully visible
          );
        },
      });
    }
  }, [title, displayedTitle]);

  useEffect(() => {
    if (displayedArtist !== artist) {
      // Animate out the old artist name
      gsap.to(artistRef.current, {
        x: "100%", // Slide out to the right
        opacity: 0,
        duration: 0.5,
        ease: "power2.in", // Eased transition
        onComplete: () => {
          // Update the displayed artist
          setDisplayedArtist(artist);

          // Animate in the new artist name
          gsap.fromTo(
            artistRef.current,
            { x: "-100%", opacity: 0 }, // Start position: off-screen to the left
            { x: "0%", opacity: 1, duration: 0.5, ease: "power2.out" } // End position: fully visible
          );
        },
      });
    }
  }, [artist, displayedArtist]);

  return (
    <div className="absolute top-0 right-0 z-20 overflow-hidden">
      <div className="rotate-270" style={{ writingMode: "vertical-rl" }}>
        <div
          ref={titleRef}
          className="font-bold text-3xl overflow-hidden whitespace-nowrap tracking-tighter"
        >
          {displayedTitle}
        </div>

        <h2
          ref={artistRef}
          className="text-lg tracking-tight text-[#e7e7e7] overflow-hidden whitespace-nowrap"
        >
          {displayedArtist}
        </h2>
      </div>
    </div>
  );
};

export default SongInfo;
