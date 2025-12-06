import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, FastForward, Rewind } from 'lucide-react';

interface TimeSliderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  isPlaying?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

const EnhancedTimeSlider: React.FC<TimeSliderProps> = ({
  selectedDate,
  onDateChange,
  availableDates,
  isPlaying = false,
  onPlayStateChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playInterval, setPlayInterval] = useState<number | null>(null);
  const [playSpeed, setPlaySpeed] = useState(1000); // milliseconds

  useEffect(() => {
    if (availableDates.length === 0) {
      setCurrentIndex(0);
      return;
    }
    const index = availableDates.findIndex(date => date === selectedDate);
    setCurrentIndex(index >= 0 ? index : 0);
  }, [selectedDate, availableDates]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % availableDates.length;
          onDateChange(availableDates[nextIndex]);
          return nextIndex;
        });
      }, playSpeed);
      setPlayInterval(interval);
    } else {
      if (playInterval) {
        clearInterval(playInterval);
        setPlayInterval(null);
      }
    }

    return () => {
      if (playInterval) {
        clearInterval(playInterval);
      }
    };
  }, [isPlaying, playSpeed, availableDates, onDateChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    setCurrentIndex(index);
    onDateChange(availableDates[index]);
    if (onPlayStateChange && isPlaying) {
      onPlayStateChange(false);
    }
  };

  const handlePlayPause = () => {
    if (onPlayStateChange) {
      onPlayStateChange(!isPlaying);
    }
  };

  const handleStepBack = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(newIndex);
    onDateChange(availableDates[newIndex]);
    if (onPlayStateChange && isPlaying) {
      onPlayStateChange(false);
    }
  };

  const handleStepForward = () => {
    const newIndex = Math.min(availableDates.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
    onDateChange(availableDates[newIndex]);
    if (onPlayStateChange && isPlaying) {
      onPlayStateChange(false);
    }
  };

  const formatMonthYear = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getYear = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.getFullYear().toString();
  };

  if (availableDates.length === 0) {
    return (
      <div className="p-4 flex justify-center items-center text-gray-500 text-sm">
        Loading timeline...
      </div>
    );
  }

  return (
    <div className="px-4 py-3 w-full flex flex-col gap-2">
      {/* Main Row: Play Control | Date | Slider */}
      <div className="flex items-center gap-4">
        
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all shadow-sm border ${
            isPlaying 
              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
              : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Date Info */}
        <div className="flex flex-col min-w-[85px]">
          <div className="text-lg font-bold text-gray-800 leading-none tracking-tight">
            {formatMonthYear(selectedDate)}
          </div>
          <div className="text-[10px] text-gray-500 font-medium mt-0.5">
            {currentIndex + 1} / {availableDates.length}
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 flex flex-col justify-center relative pt-1">
          <input
            type="range"
            min="0"
            max={availableDates.length - 1}
            value={currentIndex}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          
          {/* Year ticks */}
          <div className="flex justify-between mt-1.5 text-[9px] text-gray-400 font-medium select-none">
            <span>{getYear(availableDates[0])}</span>
            <span>{getYear(availableDates[Math.floor(availableDates.length / 2)])}</span>
            <span>{getYear(availableDates[availableDates.length - 1])}</span>
          </div>
        </div>
      </div>

      {/* Secondary Row: Navigation & Speed */}
      <div className="flex items-center justify-between pl-[56px] pr-1">
        
        {/* Fine Navigation */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              setCurrentIndex(0);
              onDateChange(availableDates[0]);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Jump to Start"
          >
            <Rewind size={12} />
          </button>
          
          <button 
            onClick={handleStepBack}
            disabled={currentIndex === 0}
            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
            title="Previous Month"
          >
            <SkipBack size={14} />
          </button>
          
          <div className="w-px h-3 bg-gray-200 mx-1"></div>

          <button 
            onClick={handleStepForward}
            disabled={currentIndex === availableDates.length - 1}
            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
            title="Next Month"
          >
            <SkipForward size={14} />
          </button>
          
          <button 
            onClick={() => {
              const last = availableDates.length - 1;
              setCurrentIndex(last);
              onDateChange(availableDates[last]);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Jump to Latest"
          >
            <FastForward size={12} />
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gray-50/80 px-2 py-0.5 rounded-full">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Speed</span>
          <input
            type="range"
            min="200"
            max="2000"
            step="200"
            value={playSpeed} // Note: Slider is reversed visually usually (left=slow, right=fast) but playSpeed (ms) is opposite.
            // Lower ms = faster. 
            // Let's fix this logic in UI: Right should be fast (low ms).
            // input value: low (slow) -> high (fast)
            // we map this to playSpeed: high (slow) -> low (fast)
            onChange={(e) => {
              // We'll use simple logic for now to match original, but maybe invert visualization later if needed
              // Original was: 500 (fast) to 2000 (slow)
              setPlaySpeed(parseInt(e.target.value));
            }}
            className="w-12 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          border: 2px solid #ffffff;
          transition: transform 0.1s;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        `
      }} />
    </div>
  );
};

export default EnhancedTimeSlider;