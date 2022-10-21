/// <reference types="vitest" />
import path from 'path'
import {
  defineConfig,
} from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults'],
    }),
    react(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/bigcommerce': {
        target: 'https://store-al0cfwwv8r.mybigcommerce.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bigcommerce/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(
        __dirname,
        './src',
      ),
    },
  },
  build: {
    rollupOptions: {
      manualChunks: {
        mui: ['@mui/material'],
        dropzone: ['react-mui-dropzone'],
        muiIcon: ['@mui/icons-material'],
        muiPickers: ['@mui/x-date-pickers'],
        dateFns: ['date-fns'],
        lang: ['@b3/lang'],
      },
    },
  },
})
