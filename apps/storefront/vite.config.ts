/* eslint-disable import/no-extraneous-dependencies */
/// <reference types="vitest" />
import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults'],
    }),
    react(),
  ],
  server: {
    port: 3001,
    proxy: {
      '/bigcommerce': {
        target: 'https://storefront-staging.mybigcommerce.com/',
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
      '@': path.resolve(__dirname, './src'),
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
