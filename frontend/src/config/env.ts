export const config = {
  // Prefer a single source of truth. API base set in services/api.ts
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  appTitle: import.meta.env.VITE_APP_TITLE || 'Tenggeli Desert Monitoring',
  map: {
    centerLat: Number(import.meta.env.VITE_MAP_CENTER_LAT) || 38.5,
    centerLng: Number(import.meta.env.VITE_MAP_CENTER_LNG) || 105.0,
    defaultZoom: Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 11,
  },
  debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
} as const;