import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { useNDVITimeSeries } from '@/hooks/useNDVIData';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface NDVIChartProps {
  lat: number;
  lng: number;
  startYear: number;
  endYear: number;
}

const NDVIChart: React.FC<NDVIChartProps> = ({ lat, lng, startYear, endYear }) => {
  const { data, isLoading, error } = useNDVITimeSeries(lat, lng, startYear, endYear);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <div className="text-sm text-gray-500">Loading NDVI data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('NDVI Chart Error:', error);
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center text-red-500">
          <div className="text-lg font-medium mb-2">Error Loading Data</div>
          <div className="text-sm mb-2">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </div>
          <div className="text-xs text-gray-500">
            Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
          <div className="text-xs text-gray-500">
            Range: {startYear}-{endYear}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <div className="text-sm">No NDVI data found for this location</div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.data.map(point => point.date),
    datasets: [
      {
        label: 'NDVI',
        data: data.data.map(point => ({
          x: point.date,
          y: point.ndvi_value,
        })),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'NDVI Time Series',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            return format(parseISO(context[0].label), 'MMM yyyy');
          },
          label: (context: any) => {
            return `NDVI: ${context.parsed.y.toFixed(3)}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'month' as const,
          displayFormats: {
            month: 'MMM yyyy',
          },
        },
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'NDVI Value',
        },
        min: -0.5,
        max: 1.0,
        ticks: {
          stepSize: 0.1,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const getVegetationStatus = (value: number) => {
    if (value < 0.2) return { status: 'Bare/Sparse', color: 'text-red-600' };
    if (value < 0.4) return { status: 'Low Vegetation', color: 'text-yellow-600' };
    if (value < 0.7) return { status: 'Moderate Vegetation', color: 'text-green-500' };
    return { status: 'Dense Vegetation', color: 'text-green-700' };
  };

  const currentNDVI = data.data[data.data.length - 1]?.ndvi_value || 0;
  const vegetationStatus = getVegetationStatus(currentNDVI);

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-600">Data Points</div>
          <div className="text-lg font-semibold">{data.data.length}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-600">Average NDVI</div>
          <div className="text-lg font-semibold">{data.statistics.mean.toFixed(3)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-600">Min NDVI</div>
          <div className="text-lg font-semibold">{data.statistics.min.toFixed(3)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-600">Max NDVI</div>
          <div className="text-lg font-semibold">{data.statistics.max.toFixed(3)}</div>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="text-sm text-blue-900 mb-1">Current Status</div>
        <div className={`font-semibold ${vegetationStatus.color}`}>
          {vegetationStatus.status}
        </div>
        <div className="text-sm text-blue-700">
          Latest NDVI: {currentNDVI.toFixed(3)}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>

      {/* Trend Analysis */}
      <div className="text-xs text-gray-600 space-y-1">
        <div>• Higher NDVI values indicate healthier vegetation</div>
        <div>• Seasonal patterns show natural vegetation cycles</div>
        <div>• Upward trends may indicate successful restoration</div>
      </div>
    </div>
  );
};

export default NDVIChart;