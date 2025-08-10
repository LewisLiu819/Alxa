import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Calendar, TrendingUp } from 'lucide-react';

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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const formatFullDate = (dateString: string) => {
    if (!dateString) return 'No data available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate date range for display
  const getDateRange = () => {
    if (availableDates.length === 0) return { start: '', end: '', years: 0 };
    const start = new Date(availableDates[0]);
    const end = new Date(availableDates[availableDates.length - 1]);
    const years = end.getFullYear() - start.getFullYear();
    return {
      start: start.getFullYear().toString(),
      end: end.getFullYear().toString(),
      years: years + 1
    };
  };

  const dateRange = getDateRange();

  if (availableDates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg border p-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading time navigation...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Time Navigation</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>{dateRange.years} years of data ({dateRange.start}-{dateRange.end})</span>
        </div>
      </div>

      {/* Current Date Display */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-gray-800 mb-1">
          {formatFullDate(selectedDate)}
        </div>
        <div className="text-sm text-gray-600">
          Data point {currentIndex + 1} of {availableDates.length}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={handleStepBack}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous month"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        
        <button
          onClick={handlePlayPause}
          className={`p-3 rounded-lg transition-colors ${
            isPlaying 
              ? 'bg-red-100 hover:bg-red-200 text-red-600' 
              : 'bg-green-100 hover:bg-green-200 text-green-600'
          }`}
          title={isPlaying ? 'Pause animation' : 'Play animation'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        
        <button
          onClick={handleStepForward}
          disabled={currentIndex === availableDates.length - 1}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next month"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={availableDates.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        
        {/* Date markers */}
        {availableDates.length > 0 && (
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{formatDate(availableDates[0])}</span>
            <span>{formatDate(availableDates[Math.floor(availableDates.length / 2)])}</span>
            <span>{formatDate(availableDates[availableDates.length - 1])}</span>
          </div>
        )}
      </div>

      {/* Playback Speed Control */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Animation Speed:</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Slow</span>
          <input
            type="range"
            min="500"
            max="2000"
            step="250"
            value={playSpeed}
            onChange={(e) => setPlaySpeed(parseInt(e.target.value))}
            className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-500">Fast</span>
        </div>
      </div>

      {/* Quick Jump Buttons */}
      {availableDates.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              const index = 0;
              setCurrentIndex(index);
              onDateChange(availableDates[index]);
            }}
            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors"
          >
            Start ({new Date(availableDates[0]).getFullYear()})
          </button>
          <button
            onClick={() => {
              const index = availableDates.length - 1;
              setCurrentIndex(index);
              onDateChange(availableDates[index]);
            }}
            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors"
          >
            Latest ({new Date(availableDates[availableDates.length - 1]).getFullYear()})
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        `
      }} />
    </div>
  );
};

export default EnhancedTimeSlider;