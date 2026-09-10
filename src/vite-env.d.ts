/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTHORITY?: string;
  readonly VITE_CLIENT_ID?: string;
  readonly VITE_PROJECT_ID?: string;
  readonly VITE_GRAPHQL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
