import React from 'react';
import { TrendingUp, TrendingDown, Minus, Leaf, BarChart3, Calendar } from 'lucide-react';
import { GridCell, GridStatsSummary } from '@/types/grid';


interface GridStatisticsPanelProps {
  selectedCell: GridCell | null;
  gridCells: GridCell[];
  selectedDate: string;
}

const GridStatisticsPanel: React.FC<GridStatisticsPanelProps> = ({
  selectedCell,
  gridCells,
  selectedDate
}) => {
  // Calculate overall statistics
  const stats: GridStatsSummary = React.useMemo(() => {
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

    const vegetationValues = gridCells.map(cell => cell.vegetationPercent);
    const avgVegetation = vegetationValues.reduce((sum, val) => sum + val, 0) / vegetationValues.length;
    const maxVegetation = Math.max(...vegetationValues);
    const minVegetation = Math.min(...vegetationValues);
    
    const increasingCells = gridCells.filter(cell => cell.trendDirection === 'up').length;
    const decreasingCells = gridCells.filter(cell => cell.trendDirection === 'down').length;
    const stableCells = gridCells.filter(cell => cell.trendDirection === 'stable').length;
    const healthyVegetationCells = gridCells.filter(cell => cell.vegetationPercent >= 30).length;

    // Provide placeholders for fields only used in GridMapContainer summary
    return {
      totalCells: gridCells.length,
      avgVegetation: Math.round(avgVegetation),
      maxVegetation,
      minVegetation,
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatPreviousMonth = (dateString: string) => {
    const currentDate = new Date(dateString);
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(currentDate.getMonth() - 1);
    
    return prevMonth.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border h-full overflow-y-auto">
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
        <div className="text-xs text-gray-500 mt-1">
          Trends vs {formatPreviousMonth(selectedDate)}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Selected Cell Details */}
        {selectedCell && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-800">Selected Grid Cell</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Position:</span>
                <div className="font-medium">Row {selectedCell.row + 1}, Col {selectedCell.col + 1}</div>
              </div>
              <div>
                <span className="text-gray-600">Vegetation:</span>
                <div className="font-medium text-green-600">{selectedCell.vegetationPercent}%</div>
              </div>
              <div>
                <span className="text-gray-600">NDVI:</span>
                <div className="font-medium">{selectedCell.ndvi.toFixed(3)}</div>
              </div>
              <div>
                <span className="text-gray-600">Monthly Change:</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(selectedCell.trendDirection)}
                  <span className={`font-medium ${
                    selectedCell.trendDirection === 'up' ? 'text-green-600' :
                    selectedCell.trendDirection === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {selectedCell.changeRate > 0 ? '+' : ''}{selectedCell.changeRate.toFixed(1)}% vs prev month
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overall Statistics */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" />
            Desert Overview
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-800">{stats.totalCells}</div>
              <div className="text-sm text-gray-600">Total Grid Cells</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{stats.avgVegetation}%</div>
              <div className="text-sm text-gray-600">Avg Vegetation</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{stats.maxVegetation}%</div>
              <div className="text-sm text-gray-600">Max Vegetation</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-600">{stats.minVegetation}%</div>
              <div className="text-sm text-gray-600">Min Vegetation</div>
            </div>
          </div>
        </div>

        {/* Vegetation Health */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Vegetation Health Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span className="text-sm font-medium">Healthy (&ge;30%)</span>
              </div>
              <div className="text-sm font-bold text-green-600">
                {stats.healthyVegetationCells} cells ({Math.round((stats.healthyVegetationCells / stats.totalCells) * 100)}%)
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                <span className="text-sm font-medium">Sparse (&lt;30%)</span>
              </div>
              <div className="text-sm font-bold text-orange-600">
                {stats.totalCells - stats.healthyVegetationCells} cells ({Math.round(((stats.totalCells - stats.healthyVegetationCells) / stats.totalCells) * 100)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Month-over-Month Changes</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm">Improving (&gt;2%)</span>
              </div>
              <span className="text-sm font-semibold text-green-600">
                {stats.increasingCells} cells ({Math.round((stats.increasingCells / stats.totalCells) * 100)}%)
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-gray-600" />
                <span className="text-sm">Stable (±2%)</span>
              </div>
              <span className="text-sm font-semibold text-gray-600">
                {stats.stableCells} cells ({Math.round((stats.stableCells / stats.totalCells) * 100)}%)
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-50 rounded">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm">Declining (&lt;-2%)</span>
              </div>
              <span className="text-sm font-semibold text-red-600">
                {stats.decreasingCells} cells ({Math.round((stats.decreasingCells / stats.totalCells) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Key Insights</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div>• Vegetation coverage ranges from {stats.minVegetation}% to {stats.maxVegetation}%</div>
            <div>• {Math.round((stats.healthyVegetationCells / stats.totalCells) * 100)}% of the desert shows healthy vegetation</div>
            <div>• {Math.round((stats.increasingCells / stats.totalCells) * 100)}% of areas improved from previous month</div>
            <div>• {Math.round((stats.decreasingCells / stats.totalCells) * 100)}% of areas declined from previous month</div>
            {stats.avgVegetation > 25 && <div>• Above-average vegetation levels detected for this time period</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridStatisticsPanel;