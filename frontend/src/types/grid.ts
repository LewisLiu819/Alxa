import { LatLngBounds, LatLng } from 'leaflet';

export interface GridCell {
  id: string;
  bounds: LatLngBounds;
  row: number;
  col: number;
  lat: number;
  lon: number;
  ndvi: number;
  vegetationPercent: number;
  trendDirection: 'up' | 'down' | 'stable';
  changeRate: number;
  polygonPoints?: LatLng[]; // For terrain-aware irregular grids
}

export interface GridStatsSummary {
  totalCells: number;
  avgVegetation: number;
  maxVegetation: number;
  minVegetation: number;
  increasingCells: number;
  decreasingCells: number;
  stableCells: number;
  healthyVegetationCells: number;
  avgNdvi: number;
  totalArea: number; // in km²
  dominantTrend: 'increasing' | 'decreasing' | 'stable';
}