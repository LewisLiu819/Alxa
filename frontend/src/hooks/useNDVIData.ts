import { useQuery } from '@tanstack/react-query';
import { ndviApi } from '@/services/api';

export const useNDVITimeSeries = (
  lat: number,
  lon: number,
  startYear: number = 2017,
  endYear: number = 2019,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['ndvi-timeseries', lat, lon, startYear, endYear],
    queryFn: () => ndviApi.getTimeSeries(lat, lon, startYear, endYear),
    enabled: enabled && !isNaN(lat) && !isNaN(lon),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useAvailableFiles = () => {
  return useQuery({
    queryKey: ['ndvi-files'],
    queryFn: async () => {
      console.log('useAvailableFiles: Making API call...');
      try {
        const result = await ndviApi.getAvailableFiles();
        console.log('useAvailableFiles: Success!', result);
        return result;
      } catch (error) {
        console.error('useAvailableFiles: Failed!', error);
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
};

export const useNDVIStatistics = (year: number, month: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['ndvi-statistics', year, month],
    queryFn: () => ndviApi.getStatistics(year, month),
    enabled: enabled && year > 0 && month > 0 && month <= 12,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useNDVIValue = (lat: number, lon: number, year: number, month: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['ndvi-value', lat, lon, year, month],
    queryFn: () => ndviApi.getValue(lat, lon, year, month),
    enabled: enabled && !isNaN(lat) && !isNaN(lon) && year > 0 && month > 0 && month <= 12,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};