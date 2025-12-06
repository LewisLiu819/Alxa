import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useNDVITimeSeries } from '@/hooks/useNDVIData';
import { parseISO, format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

interface SparklineChartProps {
  lat: number;
  lng: number;
  year: number;
  color?: string;
  height?: number;
}

const SparklineChart: React.FC<SparklineChartProps> = ({ 
  lat, 
  lng, 
  year,
  color = '#22c55e', // Default green-500
  height = 60
}) => {
  // Fetch data for the current year and previous year to show context
  const { data, isLoading } = useNDVITimeSeries(lat, lng, year - 1, year);

  if (isLoading) {
    return (
      <div className="w-full animate-pulse bg-gray-100 rounded" style={{ height }} />
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded" style={{ height }}>
        No trend data
      </div>
    );
  }

  // Process data
  const chartData = {
    labels: data.data.map((d: any) => d.date),
    datasets: [
      {
        data: data.data.map((d: any) => d.ndvi_value),
        borderColor: color,
        borderWidth: 1.5,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, `${color}33`); // 20% opacity
          gradient.addColorStop(1, `${color}00`); // 0% opacity
          return gradient;
        },
        fill: true,
        tension: 0.4, // Smooth curves
        pointRadius: 0, // Hide points by default
        pointHoverRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (items: any[]) => {
            if (!items.length) return '';
            const date = parseISO(items[0].label);
            return format(date, 'MMM yyyy');
          },
          label: (item: any) => `NDVI: ${item.raw.toFixed(3)}`
        },
        displayColors: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 6,
        titleFont: { size: 10, weight: 'bold' as const },
        bodyFont: { size: 10 }
      },
    },
    scales: {
      x: { display: false }, // Hide X axis
      y: { 
        display: false, // Hide Y axis
        min: -0.1,
        max: 0.9 // Fix scale for consistency
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div style={{ height, width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default SparklineChart;
