/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly PROD: boolean;
    readonly DEV: boolean;
  };
} 
/** Date du build (YYYY-MM-DD), injectée par vite.config.ts. */
declare const __DATE_MAJ__: string;
