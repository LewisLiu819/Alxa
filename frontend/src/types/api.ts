export interface NDVIDataPoint {
  year: number;
  month: number;
  date: string;
  ndvi_value: number;
  latitude: number;
  longitude: number;
}

export interface NDVITimeSeriesResponse {
  latitude: number;
  longitude: number;
  data: NDVIDataPoint[];
  statistics: {
    min: number;
    max: number;
    mean: number;
    count: number;
  };
}

export interface NDVIStatistics {
  year: number;
  month: number;
  statistics: {
    min: number;
    max: number;
    mean: number;
    std: number;
    count: number;
  };
}

export interface AvailableFiles {
  files: Array<{
    year: number;
    month: number;
  }>;
  count: number;
}