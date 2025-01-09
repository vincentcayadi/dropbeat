import { Play, Pause, FastForward, Rewind, Music3 } from "lucide-react";

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  lyricsVisible: boolean; // New prop for lyrics visibility
  onToggleLyrics: () => void; // New prop for toggling lyrics
}

const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayPause,
  onRewind,
  onFastForward,
  lyricsVisible,
  onToggleLyrics,
}) => {
  return (
    <div className="flex flex-col justify-end">
      <button
        onClick={onToggleLyrics}
        className="p-4 hover:scale-95 transition duration-300"
      >
        <Music3
          size={26}
          color="#EBEBEB"
          fill={lyricsVisible ? "#EBEBEB" : "none"} // Filled when enabled
          className="drop-shadow-lg"
        />
      </button>
      <button
        onClick={onRewind}
        className="p-4 hover:scale-95 transition duration-300"
      >
        <Rewind size={26} color="#EBEBEB" className="drop-shadow-lg" />
      </button>
      <button
        onClick={onPlayPause}
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
      <button
        onClick={onFastForward}
        className="p-4 hover:scale-95 transition duration-300"
      >
        <FastForward size={26} color="#EBEBEB" className="drop-shadow-lg" />
      </button>
    </div>
  );
};

export default Controls;
