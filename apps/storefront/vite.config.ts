/* eslint-disable import/no-extraneous-dependencies */
/// <reference types="vitest" />
import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import path from 'path' // eslint-disable-line
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
      minify: true,
      rollupOptions: {
        manualChunks: {
          intl: ['react-intl'],
          redux: ['react-redux'],
          dateFns: ['date-fns'],
          lang: ['@b3/lang'],
          pdfobject: ['pdfobject'],
          resizable: ['react-resizable'],
          pdf: ['react-pdf'],
          toolkit: ['@reduxjs/toolkit'],
          form: ['react-hook-form'],
          router: ['react-router-dom'],
          store: ['@b3/store'],
          lodashEs: ['lodash-es'],
          dropzone: ['react-dropzone'],
          draggable: ['react-draggable'],
          eCache: ['@emotion/cache'],
          eReact: ['@emotion/react'],
          eStyled: ['@emotion/styled'],
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
