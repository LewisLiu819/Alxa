import axios from 'axios';
import { NDVITimeSeriesResponse, NDVIStatistics, AvailableFiles } from '@/types/api';

// Unified base URL logic:
// - Dev: rely on Vite proxy, use relative '/api/v1'
// - Prod: if VITE_API_BASE_URL is defined, prefix it with '/api/v1'
const base = (import.meta as any).env.VITE_API_BASE_URL;
const API_BASE_URL = base ? `${base.replace(/\/$/, '')}/api/v1` : '/api/v1';

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