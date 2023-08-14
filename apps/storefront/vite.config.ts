/* eslint-disable import/no-extraneous-dependencies */
/// <reference types="vitest" />
import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
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
          target:
            env?.VITE_PROXY_SHOPPING_URL ||
            'https://msfremote-frontend-demo.mybigcommerce.com/',
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
          dropzone: ['react-mui-dropzone'],
          muiPickers: ['@mui/x-date-pickers'],
          dateFns: ['date-fns'],
          lang: ['@b3/lang'],
          pdfobject: ['pdfobject'],
          resizable: ['react-resizable'],
          pdf: ['react-pdf'],
          toolkit: ['@reduxjs/toolkit'],
          form: ['react-hook-form'],
        },
        plugins: [
          env.VITE_VISUALIZER === '1' &&
            visualizer({
              open: true,
              gzipSize: true,
              brotliSize: true,
            }),
        ],
      },
    },
  }
})
