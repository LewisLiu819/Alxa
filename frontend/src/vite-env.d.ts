/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_MAP_CENTER_LAT: string
  readonly VITE_MAP_CENTER_LNG: string
  readonly VITE_MAP_DEFAULT_ZOOM: string
  readonly VITE_ENABLE_DEBUG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}