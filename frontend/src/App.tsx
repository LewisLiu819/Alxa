import React, { useState, useMemo, useEffect } from 'react';
import GridMapContainer from '@/components/Map/GridMapContainer';
import EnhancedTimeSlider from '@/components/UI/EnhancedTimeSlider';
import GridStatisticsPanel from '@/components/Analysis/GridStatisticsPanel';
import GridCellDetailView from '@/components/Analysis/GridCellDetailView';
import { useAvailableFiles } from '@/hooks/useNDVIData';
import { GridCell } from '@/types/grid';

const App: React.FC = () => {
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showDetailView, setShowDetailView] = useState<boolean>(false);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  
  const [apiFiles, setApiFiles] = useState<{files?: Array<{year: number; month: number}>; count?: number} | null>(null);
  const { data: availableFiles } = useAvailableFiles();
  
  // Direct API test as fallback for React Query
  useEffect(() => {
    const testDirectAPI = async () => {
      try {
        const response = await fetch('/api/v1/ndvi/files');
        const data = await response.json();
        setApiFiles(data);
      } catch (error) {
        console.error('Direct API fallback failed', error);
      }
    };
    testDirectAPI();
  }, []);

  // Set initial date when data loads
  useEffect(() => {
    const files = availableFiles?.files || apiFiles?.files;
    if (files && files.length > 0 && !selectedDate) {
      // Set to a date that has a previous month for trend calculation
      // Look for the second available month, not the first
      const sortedFiles = [...files]
        .sort((a, b) => a.year - b.year || a.month - b.month);
      
      // Find a file that has a previous month available for trend calculation
      let selectedFile = sortedFiles[0]; // fallback to first
      for (let i = 1; i < sortedFiles.length; i++) {
        const current = sortedFiles[i];
        const prev = sortedFiles[i-1];
        
        // Check if previous month exists (consecutive months or consecutive years)
        const isConsecutive = 
          (current.year === prev.year && current.month === prev.month + 1) ||
          (current.year === prev.year + 1 && current.month === 1 && prev.month === 12);
          
        if (isConsecutive) {
          selectedFile = current;
          break;
        }
      }
      
      const initialDate = `${selectedFile.year}-${selectedFile.month.toString().padStart(2, '0')}-01`;
      console.log('Setting initial date to:', initialDate, 'for better trend calculation');
      setSelectedDate(initialDate);
    }
  }, [availableFiles, apiFiles, selectedDate]);

  const handleCellSelect = (cell: GridCell | null) => {
    setSelectedCell(cell);
    if (cell) {
      setShowDetailView(true);
    }
  };

  const handleCloseDetailView = () => {
    setShowDetailView(false);
  };

  const handleGridCellsUpdate = (cells: GridCell[]) => {
    setGridCells(cells);
  };

  // Generate available dates from the data index
  const availableDates = useMemo(() => {
    // Try React Query data first, then fallback to direct API
    const files = availableFiles?.files || apiFiles?.files;
    if (!files) {
      return [];
    }
    
    const dates = files
      .map((file) => `${file.year}-${file.month.toString().padStart(2, '0')}-01`)
      .sort();
    
    console.log('Generated dates from files:', files.length, 'dates:', dates.length);
    return dates;
  }, [availableFiles, apiFiles]);

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Loading...';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-blue-600 shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Tenggeli Desert Grid Analysis
            </h1>
            <p className="text-sm text-green-100">
              Grid-based vegetation monitoring and trend analysis system
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-white">
              {formatDateForDisplay(selectedDate)}
            </div>
            <div className="text-xs text-green-100">
              {(availableFiles?.count || apiFiles?.count) ? `${availableFiles?.count || apiFiles?.count} datasets • 225 grid cells` : 'Loading...'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 bg-gray-50">
        {/* Map Section */}
        <div className="flex-1 flex flex-col gap-4 relative z-0">
          {/* Grid Map */}
          <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden relative">
            <GridMapContainer
              selectedDate={selectedDate}
              ndviData={availableFiles}
              onCellSelect={handleCellSelect}
              selectedCell={selectedCell}
              onGridCellsUpdate={handleGridCellsUpdate}
            />
          </div>
          
          {/* Time Controls */}
          <div className="h-auto">
            <EnhancedTimeSlider
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              availableDates={availableDates}
              isPlaying={isPlaying}
              onPlayStateChange={setIsPlaying}
            />
          </div>
        </div>

        {/* Statistics Panel */}
        <div className="w-96 relative z-10">
          <GridStatisticsPanel
            selectedCell={selectedCell}
            gridCells={gridCells}
            selectedDate={selectedDate}
          />
        </div>
      </div>

      {/* Detail View Modal */}
      {showDetailView && selectedCell && (
        <GridCellDetailView
          selectedCell={selectedCell}
          onClose={handleCloseDetailView}
          availableDates={availableDates}
        />
      )}
    </div>
  );
};

export default App;