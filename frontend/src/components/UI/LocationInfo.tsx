import React from 'react';
import { MapPin, Calendar, TrendingUp } from 'lucide-react';
import { useNDVIStatistics } from '@/hooks/useNDVIData';

interface LocationInfoProps {
  location: { lat: number; lng: number } | null;
  year: number;
  month: number;
}

const LocationInfo: React.FC<LocationInfoProps> = ({ location, year, month }) => {
  const { data: statistics, isLoading, error } = useNDVIStatistics(
    year,
    month,
    !!location
  );

  if (!location) {
    return (
      <div className="text-center text-gray-500">
        <MapPin className="h-8 w-8 mx-auto mb-2" />
        <div className="font-medium">No Location Selected</div>
        <div className="text-sm">Click on the map to select a location</div>
      </div>
    );
  }

  const formatCoordinate = (value: number, isLongitude: boolean = false) => {
    const direction = isLongitude 
      ? (value >= 0 ? 'E' : 'W') 
      : (value >= 0 ? 'N' : 'S');
    return `${Math.abs(value).toFixed(4)}°${direction}`;
  };

  return (
    <div className="space-y-4">
      {/* Location Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <MapPin className="h-5 w-5 text-primary-600 mr-2" />
          <span className="font-semibold text-gray-900">Selected Location</span>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Lat: {formatCoordinate(location.lat)}</div>
          <div>Lng: {formatCoordinate(location.lng, true)}</div>
        </div>
      </div>

      {/* Current Period Info */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center mb-2">
          <Calendar className="h-4 w-4 text-gray-600 mr-2" />
          <span className="text-sm font-medium text-gray-900">
            Current Period
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {new Date(year, month - 1).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
          })}
        </div>
      </div>

      {/* Dataset Statistics */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center mb-2">
          <TrendingUp className="h-4 w-4 text-gray-600 mr-2" />
          <span className="text-sm font-medium text-gray-900">
            Dataset Statistics
          </span>
        </div>
        
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading statistics...</div>
        ) : error ? (
          <div className="text-sm text-red-500">No data available</div>
        ) : statistics ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Min NDVI:</span>
              <span className="font-mono">{statistics.statistics.min.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max NDVI:</span>
              <span className="font-mono">{statistics.statistics.max.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mean NDVI:</span>
              <span className="font-mono">{statistics.statistics.mean.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Std Dev:</span>
              <span className="font-mono">{statistics.statistics.std.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Valid Pixels:</span>
              <span className="font-mono">{statistics.statistics.count.toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No statistics available</div>
        )}
      </div>

      {/* NDVI Interpretation */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="text-sm font-medium text-blue-900 mb-2">
          NDVI Interpretation
        </div>
        <div className="space-y-1 text-xs text-blue-800">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>&lt; 0.2: Bare soil, rock, sand</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span>0.2-0.4: Sparse vegetation</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded mr-2"></div>
            <span>0.4-0.7: Moderate vegetation</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-700 rounded mr-2"></div>
            <span>&gt; 0.7: Dense vegetation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationInfo;