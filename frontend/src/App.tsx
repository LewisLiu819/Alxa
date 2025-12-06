import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import GridMapContainer from '@/components/Map/GridMapContainer';
import EnhancedTimeSlider from '@/components/UI/EnhancedTimeSlider';
import GridStatisticsPanel from '@/components/Analysis/GridStatisticsPanel';
import GridCellDetailView from '@/components/Analysis/GridCellDetailView';
import { useAvailableFiles } from '@/hooks/useNDVIData';
import { ndviApi } from '@/services/api';
import { GridCell } from '@/types/grid';

const App: React.FC = () => {
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showDetailView, setShowDetailView] = useState<boolean>(false);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  
  const [apiFiles, setApiFiles] = useState<{files?: Array<{year: number; month: number}>; count?: number} | null>(null);
  const { data: availableFiles } = useAvailableFiles();
  
  // Direct API test as fallback for React Query
  useEffect(() => {
    const testDirectAPI = async () => {
      try {
        // Use the shared API client to ensure consistent URL handling
        const data = await ndviApi.getAvailableFiles();
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
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      {/* Header - Compact & Overlay-style compatible */}
      <header className="relative z-30 bg-gradient-to-r from-green-600 to-blue-600 shadow-md px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Tenggeli Desert</span>
              <span className="text-green-200 font-normal">Monitor</span>
            </h1>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-white">
              {formatDateForDisplay(selectedDate)}
            </div>
            <div className="text-xs text-green-100 opacity-80">
              {(availableFiles?.count || apiFiles?.count) ? `${availableFiles?.count || apiFiles?.count} datasets` : 'Loading...'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Relative for absolute positioning of children */}
      <div className="flex-1 relative overflow-hidden">
        
        {/* Map Background - Full Coverage */}
        <div className="absolute inset-0 z-0">
          <GridMapContainer
            selectedDate={selectedDate}
            ndviData={availableFiles}
            onCellSelect={handleCellSelect}
            selectedCell={selectedCell}
            onGridCellsUpdate={handleGridCellsUpdate}
          />
        </div>
        
        {/* Floating Time Slider - Bottom Center */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none px-4 pb-safe">
          <div className="w-full max-w-xl pointer-events-auto transform transition-all duration-300 hover:-translate-y-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 overflow-hidden">
              <EnhancedTimeSlider
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                availableDates={availableDates}
                isPlaying={isPlaying}
                onPlayStateChange={setIsPlaying}
              />
            </div>
          </div>
        </div>

        {/* Collapsible Statistics Panel - Right Side */}
        <div className={`absolute top-16 bottom-20 right-4 z-20 flex flex-row items-start gap-2 pointer-events-none transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-[calc(100%-0px)]'}`}>
          
          {/* Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mt-2 p-1.5 bg-white/90 backdrop-blur hover:bg-white text-gray-600 hover:text-blue-600 rounded-l-lg shadow-lg border-y border-l border-gray-200 pointer-events-auto transition-colors"
            aria-label={isSidebarOpen ? "Close statistics panel" : "Open statistics panel"}
          >
            {isSidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Panel Container */}
          <div className={`w-72 h-auto max-h-full bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col pointer-events-auto transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
             <GridStatisticsPanel
               selectedCell={selectedCell}
               gridCells={gridCells}
               selectedDate={selectedDate}
             />
          </div>
        </div>

      </div>

      {/* Detail View Modal - Z-Index 50 to sit on top of everything */}
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