import React from 'react';
import { X, MapPin, Calendar, Info } from 'lucide-react';
import NDVIChart from '@/components/Analysis/NDVIChart';
import { GridCell } from '@/types/grid';

interface GridCellDetailViewProps {
  selectedCell: GridCell;
  onClose: () => void;
  availableDates: string[];
}

const GridCellDetailView: React.FC<GridCellDetailViewProps> = ({
  selectedCell,
  onClose,
  availableDates
}) => {
  // Calculate date range from availableDates
  const startYear = availableDates.length > 0 
    ? new Date(availableDates[0]).getFullYear() 
    : 2015;
  const endYear = availableDates.length > 0 
    ? new Date(availableDates[availableDates.length - 1]).getFullYear() 
    : 2024;

  // Prevent clicks inside the modal from closing it
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={handleContentClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Grid Cell Analysis
            </h2>
            <div className="text-sm text-gray-500">
              Row {selectedCell.row + 1}, Column {selectedCell.col + 1} • {selectedCell.lat.toFixed(4)}°N, {selectedCell.lon.toFixed(4)}°E
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="text-sm text-green-800 font-medium mb-1">Current Vegetation</div>
              <div className="text-2xl font-bold text-green-600">{selectedCell.vegetationPercent}%</div>
              <div className="text-xs text-green-700 mt-1">Based on NDVI value</div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
               <div className="text-sm text-blue-800 font-medium mb-1">NDVI Value</div>
               <div className="text-2xl font-bold text-blue-600">{selectedCell.ndvi.toFixed(3)}</div>
               <div className="text-xs text-blue-700 mt-1">Normalized Index (-1 to 1)</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
               <div className="text-sm text-purple-800 font-medium mb-1">Monthly Change</div>
               <div className={`text-2xl font-bold ${selectedCell.changeRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                 {selectedCell.changeRate > 0 ? '+' : ''}{selectedCell.changeRate.toFixed(1)}%
               </div>
               <div className="text-xs text-purple-700 mt-1">vs Previous Month</div>
            </div>
          </div>

          {/* Chart Section */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              Historical Trend ({startYear} - {endYear})
            </h3>
            <div className="bg-white rounded-lg border p-4 min-h-[300px]">
              <NDVIChart 
                lat={selectedCell.lat} 
                lng={selectedCell.lon} 
                startYear={startYear} 
                endYear={endYear} 
              />
            </div>
          </div>
          
          {/* Info Section */}
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p>
              This detailed analysis shows the long-term vegetation trends for the selected 30m x 30m area. 
              Seasonal fluctuations are normal, but consistent upward trends indicate successful desertification control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridCellDetailView;