import { Play, Pause, FastForward, Rewind } from "lucide-react";

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayPause,
  onRewind,
  onFastForward,
}) => {
  return (
    <div className="absolute bottom-0 right-0 flex flex-col z-20">
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
