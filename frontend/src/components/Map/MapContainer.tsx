import React, { useCallback } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { config } from '@/config/env';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  selectedYear: number;
  selectedMonth: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Tenggeli Desert center coordinates from environment config
const TENGGELI_CENTER: [number, number] = [config.map.centerLat, config.map.centerLng];
const DEFAULT_ZOOM = config.map.defaultZoom;

const MapClickHandler: React.FC<{
  onLocationSelect: (lat: number, lng: number) => void;
}> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e: { latlng: LatLng }) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapContainer: React.FC<MapContainerProps> = ({
  onLocationSelect,
}) => {
  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      onLocationSelect(lat, lng);
    },
    [onLocationSelect]
  );

  return (
    <div className="h-full w-full">
      <LeafletMapContainer
        center={TENGGELI_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Satellite imagery alternative */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          opacity={0.7}
        />

        <MapClickHandler onLocationSelect={handleLocationSelect} />
      </LeafletMapContainer>
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-sm font-semibold mb-2">Map Legend</div>
        <div className="text-xs space-y-1">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>High NDVI (Vegetation)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span>Medium NDVI</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>Low NDVI (Desert)</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Click anywhere to analyze
        </div>
      </div>
    </div>
  );
};

export default MapContainer;