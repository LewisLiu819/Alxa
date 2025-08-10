import React from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface TimeSliderProps {
  year: number;
  month: number;
  minYear: number;
  maxYear: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  availableFiles: Array<{ year: number; month: number }>;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const TimeSlider: React.FC<TimeSliderProps> = ({
  year,
  month,
  minYear,
  maxYear,
  onYearChange,
  onMonthChange,
  availableFiles,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const isDataAvailable = (checkYear: number, checkMonth: number) => {
    return availableFiles.some(f => f.year === checkYear && f.month === checkMonth);
  };

  const goToPrevious = () => {
    if (month === 1) {
      if (year > minYear) {
        onYearChange(year - 1);
        onMonthChange(12);
      }
    } else {
      onMonthChange(month - 1);
    }
  };

  const goToNext = () => {
    if (month === 12) {
      if (year < maxYear) {
        onYearChange(year + 1);
        onMonthChange(1);
      }
    } else {
      onMonthChange(month + 1);
    }
  };

  const canGoPrevious = () => {
    return !(year === minYear && month === 1);
  };

  const canGoNext = () => {
    return !(year === maxYear && month === 12);
  };

  // Auto-play functionality
  React.useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (canGoNext()) {
        goToNext();
      } else {
        setIsPlaying(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, year, month, minYear, maxYear]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const getYearProgress = () => {
    const totalYears = maxYear - minYear + 1;
    const currentYearIndex = year - minYear;
    return (currentYearIndex / (totalYears - 1)) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Main Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevious}
            disabled={!canGoPrevious()}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <button
            onClick={togglePlayback}
            className="p-2 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          
          <button
            onClick={goToNext}
            disabled={!canGoNext()}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {MONTHS[month - 1]} {year}
          </div>
          <div className="text-xs text-gray-500">
            {isDataAvailable(year, month) ? 'Data Available' : 'No Data'}
          </div>
        </div>

        <div className="text-right text-sm text-gray-600">
          {availableFiles.length} total datasets
        </div>
      </div>

      {/* Year Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{minYear}</span>
          <span>Year</span>
          <span>{maxYear}</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div 
            className="absolute top-0 h-2 bg-primary-500 rounded-lg pointer-events-none"
            style={{ width: `${getYearProgress()}%` }}
          />
        </div>
      </div>

      {/* Month Buttons */}
      <div className="grid grid-cols-6 gap-1">
        {MONTHS.map((monthName, index) => {
          const monthNum = index + 1;
          const available = isDataAvailable(year, monthNum);
          const selected = month === monthNum;
          
          return (
            <button
              key={monthName}
              onClick={() => onMonthChange(monthNum)}
              className={`
                px-2 py-1 text-xs rounded transition-colors
                ${selected 
                  ? 'bg-primary-600 text-white' 
                  : available 
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }
              `}
              disabled={!available}
            >
              {monthName}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlider;