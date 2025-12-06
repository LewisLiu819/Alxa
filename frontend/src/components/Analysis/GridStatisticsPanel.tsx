import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Leaf, BarChart3, Calendar, Database } from 'lucide-react';
import { GridCell, GridStatsSummary } from '@/types/grid';
import { ndviApi } from '@/services/api';
import SparklineChart from './SparklineChart';


interface GridStatisticsPanelProps {
  selectedCell: GridCell | null;
  gridCells: GridCell[];
  selectedDate: string;
}

interface GlobalStats {
  min: number;
  max: number;
  mean: number;
  std: number;
  count: number;
  from_metadata?: boolean;
}

const GridStatisticsPanel: React.FC<GridStatisticsPanelProps> = ({
  selectedCell,
  gridCells,
  selectedDate
}) => {
  // Global statistics from API (metadata.json)
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Fetch global statistics when date changes
  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchGlobalStats = async () => {
      setIsLoadingStats(true);
      try {
        const result = await ndviApi.getStatisticsForDate(selectedDate);
        if (result && result.statistics) {
          setGlobalStats(result.statistics as GlobalStats);
        }
      } catch (error) {
        console.error('Failed to fetch global statistics:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    fetchGlobalStats();
  }, [selectedDate]);

  // Calculate grid-based statistics (for trend analysis from sampled cells)
  const gridStats: GridStatsSummary = React.useMemo(() => {
    if (gridCells.length === 0) {
      return {
        totalCells: 0,
        avgVegetation: 0,
        maxVegetation: 0,
        minVegetation: 0,
        increasingCells: 0,
        decreasingCells: 0,
        stableCells: 0,
        healthyVegetationCells: 0,
        avgNdvi: 0,
        totalArea: 0,
        dominantTrend: 'stable'
      };
    }

    const increasingCells = gridCells.filter(cell => cell.trendDirection === 'up').length;
    const decreasingCells = gridCells.filter(cell => cell.trendDirection === 'down').length;
    const stableCells = gridCells.filter(cell => cell.trendDirection === 'stable').length;
    // For desert, healthy is typically > 15% (NDVI > 0.15)
    const healthyVegetationCells = gridCells.filter(cell => cell.ndvi >= 0.15).length;

    return {
      totalCells: gridCells.length,
      avgVegetation: 0,
      maxVegetation: 0,
      minVegetation: 0,
      increasingCells,
      decreasingCells,
      stableCells,
      healthyVegetationCells,
      avgNdvi: 0,
      totalArea: 0,
      dominantTrend: 'stable'
    };
  }, [gridCells]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Loading...';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const currentYear = selectedDate ? new Date(selectedDate).getFullYear() : 2024;

  // Convert NDVI to vegetation percent for display
  const ndviToPercent = (ndvi: number) => Math.round(Math.max(0, ndvi) * 100);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {/* Professional Header */}
      <div className="p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-800">Tenggeli Desert Statistics</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(selectedDate)}</span>
        </div>
        {globalStats?.from_metadata && (
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <Database className="w-3 h-3" />
            <span>Data from {(globalStats.count / 1000000).toFixed(1)}M pixels</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Selected Cell Details */}
        {selectedCell && (
          <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <h3 className="font-semibold text-gray-800">Selected Grid Cell</h3>
              </div>
              <div className="text-xs text-gray-500 font-mono">
                R{selectedCell.row + 1}:C{selectedCell.col + 1}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500 block">Vegetation</span>
                <div className="font-bold text-green-600 text-lg">{selectedCell.vegetationPercent}%</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500 block">NDVI</span>
                <div className="font-bold text-blue-600 text-lg">{selectedCell.ndvi.toFixed(3)}</div>
              </div>
            </div>
            
            {/* Trend Chart */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">12-Month Trend</span>
                <span className={`text-xs font-medium flex items-center gap-1 ${
                  selectedCell.changeRate > 0 ? 'text-green-600' : selectedCell.changeRate < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {selectedCell.changeRate > 0 ? '+' : ''}{selectedCell.changeRate.toFixed(1)}% vs prev
                </span>
              </div>
              <div className="h-16 w-full bg-gray-50 rounded border border-gray-100 overflow-hidden">
                <SparklineChart 
                  lat={selectedCell.lat} 
                  lng={selectedCell.lon} 
                  year={currentYear} 
                  height={64}
                  color={selectedCell.ndvi < 0.2 ? '#eab308' : '#22c55e'}
                />
              </div>
            </div>
          </div>
        )}

        {/* Global Statistics from metadata.json */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" />
            Desert Overview
          </h3>
          
          {isLoadingStats ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center animate-pulse h-20"></div>
              <div className="bg-gray-50 rounded-lg p-3 text-center animate-pulse h-20"></div>
            </div>
          ) : globalStats ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Mean NDVI</div>
                <div className="text-2xl font-bold text-gray-800">{globalStats.mean.toFixed(3)}</div>
                <div className="text-xs text-green-600">{ndviToPercent(globalStats.mean)}% vegetation</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Max NDVI</div>
                <div className="text-2xl font-bold text-blue-600">{globalStats.max.toFixed(3)}</div>
                <div className="text-xs text-blue-500">{ndviToPercent(globalStats.max)}% peak</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Min NDVI</div>
                <div className="text-2xl font-bold text-orange-600">{globalStats.min.toFixed(3)}</div>
                <div className="text-xs text-orange-500">lowest value</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Std Dev</div>
                <div className="text-2xl font-bold text-purple-600">{globalStats.std.toFixed(3)}</div>
                <div className="text-xs text-purple-500">variability</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No statistics available
            </div>
          )}
        </div>

        {/* Vegetation Health Distribution - Visual Bar */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Vegetation Health</h3>
          
          <div className="space-y-4">
            {/* Health indicator based on mean NDVI */}
            {globalStats && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Desert Health Index</span>
                  <span className={`text-xs font-bold ${
                    globalStats.mean >= 0.15 ? 'text-green-600' : 
                    globalStats.mean >= 0.08 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {globalStats.mean >= 0.15 ? 'Good' : globalStats.mean >= 0.08 ? 'Moderate' : 'Low'}
                  </span>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      globalStats.mean >= 0.15 ? 'bg-green-500' : 
                      globalStats.mean >= 0.08 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, (globalStats.mean / 0.3) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                  <span>0%</span>
                  <span>15% (healthy)</span>
                  <span>30%</span>
                </div>
              </div>
            )}
            
            {/* Grid sampling summary */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium text-gray-600">Healthy (&ge;15%)</span>
                </div>
                <div className="text-lg font-bold text-gray-800">{gridStats.healthyVegetationCells}</div>
                <div className="text-xs text-gray-500">{Math.round((gridStats.healthyVegetationCells / gridStats.totalCells) * 100) || 0}% of cells</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                  <span className="text-xs font-medium text-gray-600">Sparse (&lt;15%)</span>
                </div>
                <div className="text-lg font-bold text-gray-800">{gridStats.totalCells - gridStats.healthyVegetationCells}</div>
                <div className="text-xs text-gray-500">{Math.round(((gridStats.totalCells - gridStats.healthyVegetationCells) / gridStats.totalCells) * 100) || 0}% of cells</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Analysis - Visual List */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">MoM Changes (Grid Sampling)</h3>
          <div className="space-y-2">
            {/* Improving */}
            <div className="relative">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-green-700 font-medium">
                  <TrendingUp className="w-3 h-3" /> Improving
                </span>
                <span className="font-bold text-gray-700">{gridStats.increasingCells} cells</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${(gridStats.increasingCells / gridStats.totalCells) * 100 || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Stable */}
            <div className="relative">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-gray-600 font-medium">
                  <Minus className="w-3 h-3" /> Stable
                </span>
                <span className="font-bold text-gray-700">{gridStats.stableCells} cells</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-400 rounded-full" 
                  style={{ width: `${(gridStats.stableCells / gridStats.totalCells) * 100 || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Declining */}
            <div className="relative">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-red-600 font-medium">
                  <TrendingDown className="w-3 h-3" /> Declining
                </span>
                <span className="font-bold text-gray-700">{gridStats.decreasingCells} cells</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full" 
                  style={{ width: `${(gridStats.decreasingCells / gridStats.totalCells) * 100 || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Insight Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2 text-xs uppercase tracking-wider">Analysis Insight</h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            {globalStats && globalStats.mean > 0.1 
              ? "The desert shows promising signs of vegetation retention this month." 
              : "Vegetation levels are typical for an arid desert environment."}
            <span className="block mt-1 text-xs text-blue-600">
              {gridStats.increasingCells > gridStats.decreasingCells 
                ? "Overall trend is positive with net growth." 
                : "Monitoring recommended for declining areas."}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GridStatisticsPanel;