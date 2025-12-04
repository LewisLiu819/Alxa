import axios from 'axios';
import { NDVITimeSeriesResponse, NDVIStatistics, AvailableFiles } from '@/types/api';

// Determine API base URL:
// 1. If VITE_API_BASE_URL is set, use it
// 2. If running on Railway (*.up.railway.app), use the hardcoded backend URL
// 3. Otherwise use relative path for local dev (Vite proxy)
function getApiBaseUrl(): string {
  const envBase = (import.meta as any).env.VITE_API_BASE_URL;
  if (envBase) {
    return `${envBase.replace(/\/$/, '')}/api/v1`;
  }
  
  // Railway production environment - use the actual backend URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('.up.railway.app')) {
    return 'https://backend-production-acfe.up.railway.app/api/v1';
  }
  
  // Local development - use Vite proxy
  return '/api/v1';
}

const API_BASE_URL = getApiBaseUrl();
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const ndviApi = {
  getTimeSeries: async (
    lat: number,
    lon: number,
    startYear: number = 2017,
    endYear: number = 2019
  ): Promise<NDVITimeSeriesResponse> => {
    const response = await api.get('/ndvi/timeseries', {
      params: { lat, lon, start_year: startYear, end_year: endYear },
    });
    return response.data;
  },

  getAvailableFiles: async (): Promise<AvailableFiles> => {
    const response = await api.get('/ndvi/files');
    return response.data;
  },

  getStatistics: async (year: number, month: number): Promise<NDVIStatistics> => {
    const response = await api.get('/ndvi/statistics', {
      params: { year, month },
    });
    return response.data;
  },

  getValue: async (
    lat: number,
    lon: number,
    year: number,
    month: number
  ): Promise<{ year: number; month: number; latitude: number; longitude: number; ndvi_value: number | null }> => {
    const response = await api.get('/ndvi/value', {
      params: { lat, lon, year, month },
    });
    return response.data;
  },

  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;