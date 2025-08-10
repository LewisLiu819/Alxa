import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Rectangle, Polygon, useMap } from 'react-leaflet';
import { LatLngBounds, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GridCell, GridStatsSummary } from '@/types/grid';
import { ndviApi } from '@/services/api';

interface GridMapProps {
  selectedDate: string;
  ndviData?: any; // Not currently used in the component
  onCellSelect: (cell: GridCell | null) => void;
  selectedCell: GridCell | null;
  selectedCells?: GridCell[]; // Multi-selection support
  onMultiCellSelect?: (cells: GridCell[]) => void;
  onGridCellsUpdate?: (cells: GridCell[]) => void;
  showStatsSummary?: boolean;
}

type ViewMode = 'satellite' | 'ndvi' | 'hybrid';
type GridMode = 'regular' | 'terrain-aware';

interface LayerControls {
  viewMode: ViewMode;
  gridOpacity: number;
  showGrid: boolean;
  showBoundaries: boolean;
  gridMode: GridMode;
}

const TENGGELI_BOUNDS = {
  north: 39.00,
  south: 37.50,
  east: 105.20,
  west: 103.00
};

// Grid sizes are now handled directly in getGridSize function

// Landsat pixel size alignment (30m) - adjusted for better practical use
const LANDSAT_PIXEL_SIZE = 0.0003; // degrees (approximately 30m at this latitude)

// Zoom handler component to detect zoom changes
interface ZoomHandlerProps {
  onZoomChange: (zoom: number) => void;
}

const ZoomHandler: React.FC<ZoomHandlerProps> = ({ onZoomChange }) => {
  const map = useMap();
  
  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };
    
    map.on('zoomend', handleZoom);
    handleZoom(); // Initial zoom
    
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);
  
  return null;
};

const GridMapContainer: React.FC<GridMapProps> = ({ 
  selectedDate, 
  onCellSelect, 
  selectedCell,
  selectedCells = [],
  onMultiCellSelect,
  onGridCellsUpdate,
  showStatsSummary = false
}) => {
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [layerControls, setLayerControls] = useState<LayerControls>({
    viewMode: 'hybrid',
    // 基础填充透明度更低，默认弱化显示
    gridOpacity: 0.28,
    showGrid: true,
    // 默认显示非常轻的边界线，避免“一整片色块”错觉
    showBoundaries: true,
    gridMode: 'regular'
  });
  
  // Multi-selection state
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [internalSelectedCells, setInternalSelectedCells] = useState<GridCell[]>([]);
  
  // Use external selectedCells if provided, otherwise use internal state
  const activeSelectedCells = selectedCells.length > 0 ? selectedCells : internalSelectedCells;

  // 设备像素比修正，得到“发丝线”粗细
  const devicePixelRatioSafe = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
  const hairlineWeight = Math.max(0.5 / devicePixelRatioSafe, 0.25);

  // Fixed 15x15 grid size (zoom no longer affects grid size)
  const getGridSize = useCallback((): number => {
    return 15; // Always return 15x15 grid
  }, []);
  
  // Generate terrain-aware irregular grid cells (with safety checks)
  const generateTerrainAwareGrid = useCallback((gridSize: number) => {
    const cells: GridCell[] = [];
    
    // Safety check for grid size
    if (gridSize <= 0 || gridSize > 50) {
      console.warn(`Invalid grid size: ${gridSize}, using default 10`);
      gridSize = 10;
    }
    
    const latStep = (TENGGELI_BOUNDS.north - TENGGELI_BOUNDS.south) / gridSize;
    const lngStep = (TENGGELI_BOUNDS.east - TENGGELI_BOUNDS.west) / gridSize;
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const centerLat = TENGGELI_BOUNDS.south + (row + 0.5) * latStep;
        const centerLng = TENGGELI_BOUNDS.west + (col + 0.5) * lngStep;
        
        // Add terrain variation to create irregular shapes
        const terrainVariation = 0.3; // 30% variation
        const latVar = (Math.sin(row * 0.5 + col * 0.3) * terrainVariation * latStep) / 2;
        const lngVar = (Math.cos(row * 0.7 + col * 0.4) * terrainVariation * lngStep) / 2;
        
        // Create irregular polygon points
        const points: LatLng[] = [
          new LatLng(centerLat - latStep/2 + latVar, centerLng - lngStep/2 + lngVar),
          new LatLng(centerLat - latStep/2 - latVar/2, centerLng + lngStep/2 - lngVar),
          new LatLng(centerLat + latStep/2 - latVar, centerLng + lngStep/2 + lngVar/2),
          new LatLng(centerLat + latStep/2 + latVar/2, centerLng - lngStep/2 - lngVar)
        ];
        
        // Calculate bounds from polygon
        const lats = points.map(p => p.lat);
        const lngs = points.map(p => p.lng);
        const bounds = new LatLngBounds(
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)]
        );
        
        // Generate NDVI data (same logic as before)
        const baseNdvi = 0.1 + (row * 0.02) + (col * 0.01);
        const seasonalVariation = Math.sin((new Date(selectedDate).getMonth() / 12) * 2 * Math.PI) * 0.05;
        const seedValue = (row * gridSize + col + new Date(selectedDate).getMonth()) * 0.001;
        const pseudoRandom = (Math.sin(seedValue) + 1) / 2;
        const variation = (pseudoRandom * 0.1 - 0.05);
        const ndvi = Math.max(0, Math.min(1, baseNdvi + seasonalVariation + variation));
        
        const vegetationPercent = Math.round(ndvi * 100);
        
        // Calculate trend
        const currentMonth = new Date(selectedDate).getMonth();
        let prevMonth = currentMonth - 1;
        if (prevMonth < 0) prevMonth = 11;
        
        const prevSeasonalVariation = Math.sin((prevMonth / 12) * 2 * Math.PI) * 0.05;
        const prevSeedValue = (row * gridSize + col + prevMonth) * 0.001;
        const prevPseudoRandom = (Math.sin(prevSeedValue) + 1) / 2;
        const prevVariation = (prevPseudoRandom * 0.1 - 0.05);
        const prevNdvi = Math.max(0, Math.min(1, baseNdvi + prevSeasonalVariation + prevVariation));
        
        // Use absolute change (percentage points) instead of relative change
        const absoluteChange = (ndvi - prevNdvi) * 100; // percentage points
        const changeRate = Math.round(absoluteChange * 10) / 10;
        const trendDirection: 'up' | 'down' | 'stable' = 
          absoluteChange > 1.0 ? 'up' : absoluteChange < -1.0 ? 'down' : 'stable';
        
        cells.push({
          id: `cell-${row}-${col}`,
          bounds,
          row,
          col,
          lat: centerLat,
          lon: centerLng,
          ndvi,
          vegetationPercent,
          trendDirection,
          changeRate,
          polygonPoints: points
        });
      }
    }
    return cells;
  }, [selectedDate]);
  
  // Generate regular grid cells (with safety checks)
  const generateRegularGrid = useCallback((gridSize: number) => {
    const cells: GridCell[] = [];
    
    // Safety check for grid size
    if (gridSize <= 0 || gridSize > 50) {
      console.warn(`Invalid grid size: ${gridSize}, using default 10`);
      gridSize = 10;
    }
    
    // Align to Landsat pixel boundaries for smart positioning
    const alignedWest = Math.floor(TENGGELI_BOUNDS.west / LANDSAT_PIXEL_SIZE) * LANDSAT_PIXEL_SIZE;
    const alignedSouth = Math.floor(TENGGELI_BOUNDS.south / LANDSAT_PIXEL_SIZE) * LANDSAT_PIXEL_SIZE;
    const alignedEast = Math.ceil(TENGGELI_BOUNDS.east / LANDSAT_PIXEL_SIZE) * LANDSAT_PIXEL_SIZE;
    const alignedNorth = Math.ceil(TENGGELI_BOUNDS.north / LANDSAT_PIXEL_SIZE) * LANDSAT_PIXEL_SIZE;
    
    const latStep = (alignedNorth - alignedSouth) / gridSize;
    const lngStep = (alignedEast - alignedWest) / gridSize;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const south = alignedSouth + (row * latStep);
        const north = south + latStep;
        const west = alignedWest + (col * lngStep);
        const east = west + lngStep;

        const bounds = new LatLngBounds([south, west], [north, east]);
        
        // Get center coordinates for this cell
        const centerLat = (south + north) / 2;
        const centerLon = (west + east) / 2;
        
        // Initialize with reasonable values based on desert location and season
        // This prevents showing 0% everywhere before real data loads
        const currentMonth = new Date(selectedDate).getMonth() + 1;
        const seasonalBase = 0.08 + (Math.sin((currentMonth - 4) / 12 * 2 * Math.PI) * 0.04);  // Peak in July
        const locationVariation = (Math.sin(centerLat * 0.5) + Math.cos(centerLon * 0.3)) * 0.02;
        const initialNdvi = Math.max(0.03, Math.min(0.20, seasonalBase + locationVariation));
        
        const ndvi = initialNdvi;
        const vegetationPercent = Math.round(initialNdvi * 100);
        
        // Trend calculation - placeholder until real data is loaded
        const changeRate = 0; // Will be calculated from real data
        const trendDirection: 'up' | 'down' | 'stable' = 'stable';

        cells.push({
          id: `cell-${row}-${col}`,
          bounds,
          row,
          col,
          lat: centerLat,
          lon: centerLon,
          ndvi,
          vegetationPercent,
          trendDirection,
          changeRate
        });
      }
    }
    return cells;
  }, [selectedDate]);
  
  // Main grid generation logic (fixed dependencies)
  const generateGridCells = useMemo(() => {
    const gridSize = getGridSize();
    
    if (layerControls.gridMode === 'terrain-aware') {
      return generateTerrainAwareGrid(gridSize);
    } else {
      return generateRegularGrid(gridSize);
    }
  }, [selectedDate, layerControls.gridMode, getGridSize, generateTerrainAwareGrid, generateRegularGrid]);
  
  // Handle zoom changes
  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);


  useEffect(() => {
    setGridCells(generateGridCells);
    // Pass the generated grid cells back to parent component
    if (onGridCellsUpdate) {
      onGridCellsUpdate(generateGridCells);
    }
  }, [generateGridCells, onGridCellsUpdate]);

  // —— 使用后端真实 NDVI 覆盖前端模拟值 ——
  const [ndviCache, setNdviCache] = useState<Map<string, number | null>>(new Map());

  useEffect(() => {
    let isCancelled = false;
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Clear cache when date changes to ensure fresh data for new time period
    setNdviCache(new Map());

    if (!gridCells || gridCells.length === 0) return;

    const getCenter = (cell: GridCell): { lat: number; lon: number } => {
      if (cell.polygonPoints && cell.polygonPoints.length > 0) {
        const avgLat = cell.polygonPoints.reduce((s, p) => s + p.lat, 0) / cell.polygonPoints.length;
        const avgLng = cell.polygonPoints.reduce((s, p) => s + p.lng, 0) / cell.polygonPoints.length;
        return { lat: avgLat, lon: avgLng };
      }
      const center = cell.bounds.getCenter();
      return { lat: center.lat, lon: center.lng };
    };

    const keyOf = (y: number, m: number, lat: number, lon: number) => `${y}-${m}-${lat.toFixed(4)}-${lon.toFixed(4)}`;

    const concurrency = 1; // Ultra-conservative to debug API issues
    const tasks = gridCells.map((cell) => async () => {
      const { lat, lon } = getCenter(cell);
      console.log(`Fetching NDVI for cell at (${lat.toFixed(4)}, ${lon.toFixed(4)}) for ${year}-${month}`);
      
      const kNow = keyOf(year, month, lat, lon);
      let nowVal = ndviCache.get(kNow);
      
      if (nowVal === undefined) {
        try {
          const resp = await ndviApi.getValue(lat, lon, year, month);
          nowVal = (resp && typeof resp.ndvi_value === 'number') ? resp.ndvi_value : null;
          setNdviCache(prev => new Map(prev.set(kNow, nowVal!)));
          
          // Small delay to avoid overwhelming the backend
          await new Promise(resolve => setTimeout(resolve, 25));
        } catch (error) {
          console.error(`❌ FAILED to fetch NDVI for cell (${lat.toFixed(4)}, ${lon.toFixed(4)}) at ${year}-${month}:`, error);
          nowVal = null;
          setNdviCache(prev => new Map(prev.set(kNow, null)));
        }
      }

      // Try to find a previous month for trend calculation
      let prevVal = null;
      let attempts = 0;
      let prevYear = year;
      let prevMonth = month - 1;
      
      // Try up to 3 previous months to find valid data
      while (prevVal === null && attempts < 3) {
        if (prevMonth <= 0) { prevMonth = 12; prevYear = year - 1; }
        
        const kPrev = keyOf(prevYear, prevMonth, lat, lon);
        let cachedPrevVal = ndviCache.get(kPrev);
        
        if (cachedPrevVal === undefined) {
          try {
            const resp = await ndviApi.getValue(lat, lon, prevYear, prevMonth);
            cachedPrevVal = (resp && typeof resp.ndvi_value === 'number') ? resp.ndvi_value : null;
            setNdviCache(prev => new Map(prev.set(kPrev, cachedPrevVal!)));
            
            // Small delay to avoid overwhelming the backend
            await new Promise(resolve => setTimeout(resolve, 25));
          } catch (error) {
            console.warn(`Failed to fetch NDVI for cell (${lat.toFixed(4)}, ${lon.toFixed(4)}) at ${prevYear}-${prevMonth}:`, error);
            cachedPrevVal = null;
            setNdviCache(prev => new Map(prev.set(kPrev, null)));
          }
        }
        
        if (cachedPrevVal !== null) {
          prevVal = cachedPrevVal;
          console.log(`Found previous NDVI data: ${prevVal} for ${prevYear}-${prevMonth}`);
          break;
        }
        
        // Try the month before
        prevMonth--;
        attempts++;
      }

      console.log(`Cell ${cell.id}: nowVal=${nowVal}, prevVal=${prevVal}`);
      return { id: cell.id, nowVal, prevVal };
    });

    const runPool = async <T,>(taskFns: Array<() => Promise<T>>, limit: number): Promise<T[]> => {
      const results: T[] = [];
      let i = 0;
      const workers = new Array(Math.min(limit, taskFns.length)).fill(0).map(async () => {
        while (i < taskFns.length) {
          const cur = i++;
          const r = await taskFns[cur]();
          results[cur] = r;
        }
      });
      await Promise.all(workers);
      return results;
    };

    (async () => {
      try {
        const fetched = await runPool(tasks, concurrency);
        if (isCancelled) return;
        const byId = new Map<string, { nowVal: number | null; prevVal: number | null }>();
        fetched.forEach((f) => byId.set((f as any).id, { nowVal: (f as any).nowVal, prevVal: (f as any).prevVal }));

        const updated = gridCells.map((cell) => {
          const f = byId.get(cell.id);
          if (!f || f.nowVal === null) {
            console.warn(`⚠️  No NDVI data for cell ${cell.id} - using fallback values`);
            // Keep current initialized value instead of defaulting to 0
            // This maintains visual consistency for cells outside data coverage
            return { 
              ...cell,
              // Keep existing values if they're already reasonable
              ndvi: (typeof cell.ndvi === 'number' && cell.ndvi > 0) ? cell.ndvi : 0.05,
              vegetationPercent: (typeof cell.vegetationPercent === 'number' && cell.vegetationPercent > 0) ? cell.vegetationPercent : 5,
              trendDirection: 'stable' as const,
              changeRate: 0 
            };
          }
          
          // Safely handle NDVI normalization
          const rawNdvi = typeof f.nowVal === 'number' ? f.nowVal : 0;
          const normalized = Math.max(0, Math.min(1, rawNdvi));
          const vegetationPercent = Math.round(normalized * 100);
          
          let trendDirection: 'up' | 'down' | 'stable' = 'stable';
          let changeRate = 0;
          
          if (typeof f.prevVal === 'number' && !isNaN(f.prevVal)) {
            const prevRaw = f.prevVal;
            const prevNorm = Math.max(0, Math.min(1, prevRaw));
            
            // Calculate absolute difference (in percentage points)
            const absoluteChange = (normalized - prevNorm) * 100; // e.g., 0.08 to 0.10 = +2 percentage points
            
            // For desert conditions, use absolute thresholds instead of relative percentages
            // This prevents extreme relative changes from small baseline values
            if (Math.abs(absoluteChange) >= 0.5) { // At least 0.5 percentage point change
              changeRate = Math.round(absoluteChange * 10) / 10; // Round to 1 decimal place
              
              // Use more reasonable thresholds for desert vegetation
              if (absoluteChange > 1.0) { // More than 1 percentage point increase
                trendDirection = 'up';
              } else if (absoluteChange < -1.0) { // More than 1 percentage point decrease  
                trendDirection = 'down';
              } else {
                trendDirection = 'stable';
              }
            } else {
              // Very small changes are considered stable
              changeRate = Math.round(absoluteChange * 10) / 10;
              trendDirection = 'stable';
            }
          }
          
          console.log(`✅ Cell ${cell.id}: NDVI=${normalized.toFixed(3)}, trend=${trendDirection}, change=${changeRate.toFixed(1)}%`);
          return { ...cell, ndvi: normalized, vegetationPercent, trendDirection, changeRate };
        });

        // 仅当确实有变化时再更新
        const changed = updated.some((c, idx) => c.ndvi !== gridCells[idx].ndvi || c.vegetationPercent !== gridCells[idx].vegetationPercent);
        if (changed) {
          setGridCells(updated);
          if (onGridCellsUpdate) {
            onGridCellsUpdate(updated);
          }
        }
      } catch (error) {
        console.error('Critical error in NDVI data fetching:', error);
        // Keep fallback values - no UI disruption
      }
    })();

    return () => { isCancelled = true; };
  }, [gridCells, selectedDate, ndviCache]);

  // Desert-optimized NDVI color mapping for 0-25% vegetation range
  const getNdviHeatmapColor = (
    ndvi: number
  ): string => {
    // Safety checks for input values
    if (typeof ndvi !== 'number' || isNaN(ndvi)) {
      console.warn('Invalid NDVI value:', ndvi);
      ndvi = 0;
    }

    // Convert NDVI to percentage and focus on 0-25% range
    const vegetationPercent = Math.max(0, Math.min(100, ndvi * 100));
    
    let r: number, g: number, b: number;

    if (vegetationPercent <= 2) {
      // Bare sand/rock - Light tan/beige
      r = 245; g = 222; b = 179; // #F5DEB3 (wheat)
    } else if (vegetationPercent <= 5) {
      // Very sparse - Sand to light brown transition
      const t = (vegetationPercent - 2) / 3; // 0-1
      r = 245 - t * 35;  // 245-210
      g = 222 - t * 42;  // 222-180  
      b = 179 - t * 69;  // 179-110
    } else if (vegetationPercent <= 8) {
      // Sparse - Brown to reddish-brown
      const t = (vegetationPercent - 5) / 3; // 0-1
      r = 210 - t * 20;  // 210-190
      g = 180 - t * 60;  // 180-120
      b = 110 - t * 40;  // 110-70
    } else if (vegetationPercent <= 12) {
      // Low-moderate - Reddish-brown to orange-brown
      const t = (vegetationPercent - 8) / 4; // 0-1
      r = 190 + t * 29;  // 190-219
      g = 120 + t * 45;  // 120-165
      b = 70 + t * 20;   // 70-90
    } else if (vegetationPercent <= 17) {
      // Moderate - Orange-brown to yellow-brown
      const t = (vegetationPercent - 12) / 5; // 0-1
      r = 219 + t * 15;  // 219-234
      g = 165 + t * 44;  // 165-209
      b = 90 + t * 25;   // 90-115
    } else if (vegetationPercent <= 22) {
      // Good (for desert) - Yellow-green transition
      const t = (vegetationPercent - 17) / 5; // 0-1
      r = 234 - t * 65;  // 234-169
      g = 209 + t * 20;  // 209-229
      b = 115 - t * 35;  // 115-80
    } else {
      // Excellent (for desert) - Light green (25%+)
      const t = Math.min(1, (vegetationPercent - 22) / 8); // 0-1, capped
      r = 169 - t * 44;  // 169-125
      g = 229 + t * 15;  // 229-244
      b = 80 + t * 45;   // 80-125
    }

    // Ensure RGB values are within valid range
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Calculate statistics for selected cells
  const calculateStatsSummary = useCallback((cells: GridCell[]): GridStatsSummary => {
    if (cells.length === 0) {
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

    const totalCells = cells.length;
    const vegetationValues = cells.map(c => c.vegetationPercent);
    const ndviValues = cells.map(c => c.ndvi);
    
    // Calculate area (approximate)
    const latDiff = TENGGELI_BOUNDS.north - TENGGELI_BOUNDS.south;
    const lngDiff = TENGGELI_BOUNDS.east - TENGGELI_BOUNDS.west;
    const totalGridArea = latDiff * lngDiff * 111 * 111; // Rough km² conversion
    const cellArea = totalGridArea / (getGridSize() ** 2);
    const totalArea = cellArea * totalCells;

    const avgVegetation = vegetationValues.reduce((a, b) => a + b, 0) / totalCells;
    const maxVegetation = Math.max(...vegetationValues);
    const minVegetation = Math.min(...vegetationValues);
    const avgNdvi = ndviValues.reduce((a, b) => a + b, 0) / totalCells;

    const increasingCells = cells.filter(c => c.trendDirection === 'up').length;
    const decreasingCells = cells.filter(c => c.trendDirection === 'down').length;
    const stableCells = cells.filter(c => c.trendDirection === 'stable').length;
    const healthyVegetationCells = cells.filter(c => c.vegetationPercent > 12).length; // Desert threshold

    const dominantTrend = increasingCells > decreasingCells && increasingCells > stableCells 
      ? 'increasing' 
      : decreasingCells > stableCells 
      ? 'decreasing' 
      : 'stable';

    return {
      totalCells,
      avgVegetation: Math.round(avgVegetation * 100) / 100,
      maxVegetation,
      minVegetation,
      increasingCells,
      decreasingCells,
      stableCells,
      healthyVegetationCells,
      avgNdvi: Math.round(avgNdvi * 1000) / 1000,
      totalArea: Math.round(totalArea * 100) / 100,
      dominantTrend
    };
  }, [currentZoom]);

  const handleCellClick = (cell: GridCell, event?: Pick<MouseEvent, 'ctrlKey' | 'metaKey'>) => {
    if (!cell || !cell.id) {
      console.warn('Invalid cell clicked:', cell);
      return;
    }

    // Multi-selection mode with Ctrl/Cmd key
    if (multiSelectMode || (event && (event.ctrlKey || event.metaKey))) {
      const isAlreadySelected = activeSelectedCells.some(c => c.id === cell.id);
      let newSelectedCells: GridCell[];
      
      if (isAlreadySelected) {
        // Remove from selection
        newSelectedCells = activeSelectedCells.filter(c => c.id !== cell.id);
      } else {
        // Add to selection
        newSelectedCells = [...activeSelectedCells, cell];
      }
      
      if (onMultiCellSelect) {
        onMultiCellSelect(newSelectedCells);
      } else {
        setInternalSelectedCells(newSelectedCells);
      }
      
      // Also trigger single selection for backward compatibility
      onCellSelect(newSelectedCells.length > 0 ? newSelectedCells[0] : null);
    } else {
      // Single selection mode
      onCellSelect(selectedCell?.id === cell.id ? null : cell);
      if (onMultiCellSelect) {
        onMultiCellSelect([]);
      } else {
        setInternalSelectedCells([]);
      }
    }
  };

  return (
    <div className="relative h-full w-full" style={{ zIndex: 1 }}>
      <MapContainer
        center={[
          (TENGGELI_BOUNDS.north + TENGGELI_BOUNDS.south) / 2,
          (TENGGELI_BOUNDS.east + TENGGELI_BOUNDS.west) / 2
        ]}
        zoom={10}
        className="h-full w-full"
        zoomControl={true}
        style={{ zIndex: 1 }}
      >
        <ZoomHandler onZoomChange={handleZoomChange} />
        {/* Conditional base layers based on view mode */}
        {(layerControls.viewMode === 'hybrid' || layerControls.viewMode === 'satellite') && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri'
            opacity={layerControls.viewMode === 'satellite' ? 1 : 0.4}
          />
        )}
        
        {(layerControls.viewMode === 'hybrid' || layerControls.viewMode === 'ndvi') && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            opacity={layerControls.viewMode === 'ndvi' ? 1 : 0.6}
          />
        )}

        {layerControls.showGrid && gridCells && gridCells.length > 0 && gridCells.filter(cell => cell && cell.id).map((cell) => {
          const isSelected = selectedCell?.id === cell.id;
          const isMultiSelected = activeSelectedCells.some(c => c.id === cell.id);
          const isHovered = hoveredCell?.id === cell.id;
          
          // Enhanced visual options - FIXED opacity handling with multi-selection support
          const strokeColor = isSelected ? '#ff6b35'           // 单选：橙色
                            : isMultiSelected ? '#9333ea'     // 多选：紫色
                            : isHovered ? '#4a90e2'           // 悬停：蓝色
                            : layerControls.showBoundaries ? 'rgba(255,255,255,0.35)' : 'transparent';
          
          const strokeWeight = isSelected ? Math.max(1.5, hairlineWeight * 3)
                             : isMultiSelected ? Math.max(1.25, hairlineWeight * 2.5)
                             : isHovered ? Math.max(1, hairlineWeight * 2)
                             : layerControls.showBoundaries ? hairlineWeight : 0;
          const strokeOpacity = (isSelected || isMultiSelected || layerControls.showBoundaries) ? 0.9 : 0;
          // 默认使用细虚线，降低存在感；交互时改为实线
          const dashArray = (isSelected || isMultiSelected || isHovered) ? undefined : (layerControls.showBoundaries ? '2 6' : undefined);
          
          // Calculate proper fill opacity based on user controls
          let baseFillOpacity = layerControls.gridOpacity;
          
          // Boost opacity for selected/hovered cells
          if (isSelected) baseFillOpacity = Math.min(1, baseFillOpacity + 0.2);
          else if (isMultiSelected) baseFillOpacity = Math.min(1, baseFillOpacity + 0.15);
          else if (isHovered) baseFillOpacity = Math.min(1, baseFillOpacity + 0.1);
          
          // Reduce opacity in satellite mode for better integration
          if (layerControls.viewMode === 'satellite' && !isSelected && !isHovered) {
            baseFillOpacity *= 0.30; // 卫星底图时进一步弱化
          }
          
          // Generate color with proper alpha embedded
          const fillColor = getNdviHeatmapColor(cell.ndvi);
          
          // Use the calculated opacity as fillOpacity (this controls the final render opacity)
          const fillOpacity = baseFillOpacity;
          
          // Render polygon for terrain-aware mode or rectangle for regular mode
          if (cell.polygonPoints && layerControls.gridMode === 'terrain-aware') {
            return (
              <Polygon
                key={cell.id}
                positions={cell.polygonPoints}
                pathOptions={{
                  fillColor,
                  fillOpacity,
                  color: strokeColor,
                  weight: strokeWeight,
                  opacity: strokeOpacity,
                  dashArray,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
                eventHandlers={{
                  click: (e) => handleCellClick(cell, { ctrlKey: (e.originalEvent as any)?.ctrlKey, metaKey: (e.originalEvent as any)?.metaKey }),
                  mouseover: () => setHoveredCell(cell),
                  mouseout: () => setHoveredCell(null)
                }}
              />
            );
          } else {
            return (
              <Rectangle
                key={cell.id}
                bounds={cell.bounds}
                pathOptions={{
                  fillColor,
                  fillOpacity,
                  color: strokeColor,
                  weight: strokeWeight,
                  opacity: strokeOpacity,
                  dashArray,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
                eventHandlers={{
                  click: (e) => handleCellClick(cell, { ctrlKey: (e.originalEvent as any)?.ctrlKey, metaKey: (e.originalEvent as any)?.metaKey }),
                  mouseover: () => setHoveredCell(cell),
                  mouseout: () => setHoveredCell(null)
                }}
              />
            );
          }
        })}
      </MapContainer>

      {/* 轻微径向遮罩，软化栅格边缘，与底图更好融合 */}
      <div className="ndvi-layer-mask" style={{ zIndex: 5 }} />

      {/* Interactive Layer Controls */}
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border z-20 max-w-xs">
        <div className="text-sm font-semibold text-gray-800 mb-3">Map Controls</div>
        
        {/* View Mode Toggle */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 mb-1 block">View Mode</label>
          <div className="flex gap-1">
            {(['satellite', 'ndvi', 'hybrid'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setLayerControls(prev => ({ ...prev, viewMode: mode }))}
                className={`px-2 py-1 text-xs rounded ${
                  layerControls.viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Mode Toggle */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Grid Type</label>
          <div className="flex gap-1">
            {(['regular', 'terrain-aware'] as GridMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setLayerControls(prev => ({ ...prev, gridMode: mode }))}
                className={`px-2 py-1 text-xs rounded ${
                  layerControls.gridMode === mode
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode === 'terrain-aware' ? 'Terrain' : 'Regular'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Opacity Slider */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Grid Opacity: {Math.round(layerControls.gridOpacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={layerControls.gridOpacity}
            onChange={(e) => setLayerControls(prev => ({ 
              ...prev, 
              gridOpacity: parseFloat(e.target.value) 
            }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Multi-Selection Controls */}
        <div className="mb-3 pb-3 border-b">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="multiSelect"
              checked={multiSelectMode}
              onChange={(e) => setMultiSelectMode(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="multiSelect" className="text-xs font-medium text-gray-700">
              Multi-Selection Mode
            </label>
          </div>
          
          {activeSelectedCells.length > 0 && (
            <div className="text-xs text-purple-600 mb-2">
              {activeSelectedCells.length} cell{activeSelectedCells.length > 1 ? 's' : ''} selected
            </div>
          )}
          
          {activeSelectedCells.length > 1 && (
            <button
              onClick={() => {
                if (onMultiCellSelect) {
                  onMultiCellSelect([]);
                } else {
                  setInternalSelectedCells([]);
                }
              }}
              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Toggle Options */}
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showGrid"
              checked={layerControls.showGrid}
              onChange={(e) => setLayerControls(prev => ({ 
                ...prev, 
                showGrid: e.target.checked 
              }))}
              className="mr-2"
            />
            <label htmlFor="showGrid" className="text-xs text-gray-700">Show Grid</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showBoundaries"
              checked={layerControls.showBoundaries}
              onChange={(e) => setLayerControls(prev => ({ 
                ...prev, 
                showBoundaries: e.target.checked 
              }))}
              className="mr-2"
            />
            <label htmlFor="showBoundaries" className="text-xs text-gray-700">Show Boundaries</label>
          </div>
        </div>

        {/* Zoom Info */}
        <div className="mt-3 pt-2 border-t text-xs text-gray-500">
          Zoom: {currentZoom} | Grid: {getGridSize()}×{getGridSize()} (Fixed)
          <div className="text-xs text-gray-400 mt-1">
            {!multiSelectMode && "Ctrl+Click for multi-selection"}
          </div>
        </div>
      </div>

      {/* Statistics Summary Panel */}
      {(showStatsSummary || activeSelectedCells.length > 1) && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-20 max-w-sm">
          <div className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <span className="w-3 h-3 bg-purple-500 rounded mr-2"></span>
            Selection Statistics
          </div>
          
          {activeSelectedCells.length > 0 ? (
            (() => {
              const stats = calculateStatsSummary(activeSelectedCells);
              return (
                <div className="space-y-3">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="font-medium text-gray-700">Selected Area</div>
                      <div className="text-lg font-bold text-gray-800">{stats.totalCells}</div>
                      <div className="text-gray-500">cells ({stats.totalArea} km²)</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="font-medium text-green-700">Avg Vegetation</div>
                      <div className="text-lg font-bold text-green-800">{stats.avgVegetation}%</div>
                      <div className="text-green-600">NDVI: {stats.avgNdvi}</div>
                    </div>
                  </div>

                  {/* Vegetation Range */}
                  <div className="bg-blue-50 p-2 rounded text-xs">
                    <div className="font-medium text-blue-700 mb-1">Vegetation Range</div>
                    <div className="flex justify-between">
                      <span>Min: <strong>{stats.minVegetation}%</strong></span>
                      <span>Max: <strong>{stats.maxVegetation}%</strong></span>
                    </div>
                  </div>

                  {/* Trend Analysis */}
                  <div className="text-xs">
                    <div className="font-medium text-gray-700 mb-2">Trend Analysis</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded mr-1"></span>
                          Increasing
                        </span>
                        <span className="font-medium">{stats.increasingCells} cells</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded mr-1"></span>
                          Decreasing
                        </span>
                        <span className="font-medium">{stats.decreasingCells} cells</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-gray-400 rounded mr-1"></span>
                          Stable
                        </span>
                        <span className="font-medium">{stats.stableCells} cells</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Good desert vegetation (&gt;12%)</span>
                        <span className="font-medium text-green-600">
                          {stats.healthyVegetationCells} cells
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t bg-gray-100 -mx-2 -mb-2 px-2 pb-2 rounded-b">
                      <div className="font-medium text-center">
                        Dominant Trend: <span className={`capitalize ${
                          stats.dominantTrend === 'increasing' ? 'text-green-600' :
                          stats.dominantTrend === 'decreasing' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {stats.dominantTrend}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-xs text-gray-500 text-center py-4">
              Select multiple grid cells to view statistics
              <div className="mt-2 text-gray-400">
                Use Ctrl+Click or enable Multi-Selection Mode
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hover tooltip - positioned to avoid conflicts */}
      {hoveredCell && (
        <div className="absolute top-20 right-4 bg-white p-3 rounded-lg shadow-lg border z-15 pointer-events-none">
          <div className="text-sm font-semibold text-gray-800">
            Grid Cell ({hoveredCell.row + 1}, {hoveredCell.col + 1})
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">NDVI:</span> {hoveredCell.ndvi.toFixed(3)}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Vegetation:</span> {hoveredCell.vegetationPercent}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Monthly change: {hoveredCell.trendDirection === 'up' ? '↗ +' :
             hoveredCell.trendDirection === 'down' ? '↘ ' :
             '→ '}{hoveredCell.changeRate.toFixed(1)} pts
          </div>
        </div>
      )}

      {/* Enhanced Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border z-10 max-w-xs">
        <div className="text-sm font-semibold text-gray-800 mb-2">
          Desert Vegetation Scale
        </div>
        <div className="text-xs text-gray-600 mb-3">Optimized for arid conditions (0-25%)</div>
        
        {/* Desert vegetation heat map gradient */}
        <div className="mb-3">
          <div className="flex items-center gap-1">
            <div className="flex flex-col gap-1">
              <div className="w-4 h-2" style={{ backgroundColor: getNdviHeatmapColor(0.25) }}></div>
              <div className="w-4 h-2" style={{ backgroundColor: getNdviHeatmapColor(0.20) }}></div>
              <div className="w-4 h-2" style={{ backgroundColor: getNdviHeatmapColor(0.15) }}></div>
              <div className="w-4 h-2" style={{ backgroundColor: getNdviHeatmapColor(0.10) }}></div>
              <div className="w-4 h-2" style={{ backgroundColor: getNdviHeatmapColor(0.05) }}></div>
              <div className="w-4 h-2" style={{ backgroundColor: getNdviHeatmapColor(0.02) }}></div>
            </div>
            <div className="flex flex-col gap-1 text-xs text-gray-600 ml-1">
              <div className="h-2 flex items-center">25%</div>
              <div className="h-2 flex items-center">20%</div>
              <div className="h-2 flex items-center">15%</div>
              <div className="h-2 flex items-center">10%</div>
              <div className="h-2 flex items-center">5%</div>
              <div className="h-2 flex items-center">2%</div>
            </div>
            <div className="flex flex-col gap-1 text-xs text-gray-700 ml-2">
              <div className="h-2 flex items-center">Dense (Desert)</div>
              <div className="h-2 flex items-center">Good</div>
              <div className="h-2 flex items-center">Moderate</div>
              <div className="h-2 flex items-center">Sparse</div>
              <div className="h-2 flex items-center">Very Sparse</div>
              <div className="h-2 flex items-center">Bare Sand</div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 border-t pt-2">
          <div className="mb-1">
            Grid: {layerControls.gridMode === 'terrain-aware' ? 'Terrain-Aware' : 'Regular'}
          </div>
          <div className="mb-1">
            Resolution: {getGridSize()}×{getGridSize()} cells (Fixed)
          </div>
          <div>
            {layerControls.viewMode === 'satellite' && 'Satellite base with NDVI overlay'}
            {layerControls.viewMode === 'ndvi' && 'NDVI heatmap with topographic base'}
            {layerControls.viewMode === 'hybrid' && 'Combined satellite and topographic view'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridMapContainer;