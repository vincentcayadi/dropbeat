import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

interface SongInfoProps {
  title: string;
  artist: string;
}

const SongInfo: React.FC<SongInfoProps> = ({ title, artist }) => {
  const [displayedTitle, setDisplayedTitle] = useState(title);
  const [displayedArtist, setDisplayedArtist] = useState(artist);
  const isFirstRender = useRef(true); // Tracks if this is the first render

  const titleRef = useRef<HTMLDivElement>(null);
  const artistRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      // Skip animation on first render
      setDisplayedTitle(title);
      isFirstRender.current = false;
    } else if (displayedTitle !== title) {
      // Animate out the old title
      gsap.to(titleRef.current, {
        x: "100%",
        opacity: 0,
        duration: 0.75,
        ease: "power2.in",
        onComplete: () => {
          // Update the displayed title
          setDisplayedTitle(title);
          // Animate in the new title
          gsap.fromTo(
            titleRef.current,
            { x: "-100%", opacity: 0 },
            { x: "0%", opacity: 1, duration: 1, ease: "power2.out" }
          );
        },
      });
    }
  }, [title, displayedTitle]);

  useEffect(() => {
    if (isFirstRender.current) {
      // Skip animation on first render
      setDisplayedArtist(artist);
      isFirstRender.current = false;
    } else if (displayedArtist !== artist) {
      // Animate out the old artist name
      gsap.to(artistRef.current, {
        x: "100%",
        opacity: 0,
        duration: 0.75,
        ease: "power2.in",
        onComplete: () => {
          // Update the displayed artist
          setDisplayedArtist(artist);
          // Animate in the new artist name
          gsap.fromTo(
            artistRef.current,
            { x: "-100%", opacity: 0 },
            { x: "0%", opacity: 1, duration: 1, ease: "power2.out" }
          );
        },
      });
    }
  }, [artist, displayedArtist]);

  return (
    <div className="rotate-270" style={{ writingMode: "vertical-rl" }}>
      {/* Title */}
      <div ref={titleRef} className="font-bold text-3xl tracking-tighter">
        {displayedTitle}
      </div>
      {/* Artist */}
      <h2 ref={artistRef} className="text-lg tracking-tight text-[#e7e7e7]">
        {displayedArtist}
      </h2>
    </div>
  );
};

export default SongInfo;
