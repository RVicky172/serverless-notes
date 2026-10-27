/// <reference types="vite/client" />

/** Build-time variables from `.env.local` (see `.env.example`). */
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_USER_POOL_ID: string;
  readonly VITE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
