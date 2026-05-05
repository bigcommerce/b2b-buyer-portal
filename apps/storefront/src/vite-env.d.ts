/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_API?: string;
  readonly VITE_B2B_URL?: string;
  readonly VITE_STOREFRONT_GRAPHQL_URL?: string;
}

declare module '*.graphql?raw' {
  const schema: string;
  export default schema;
}
