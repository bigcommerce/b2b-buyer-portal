// cspell:ignore onwarn, pdfobject
import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      legacy({
        targets: ['defaults'],
      }),
      react(),
    ],
    experimental: {
      renderBuiltUrl(filename: string) {
        const isCustomBuyerPortal = env.VITE_ASSETS_ABSOLUTE_PATH !== undefined;
        return isCustomBuyerPortal
          ? `${env.VITE_ASSETS_ABSOLUTE_PATH}${filename}`
          : {
              runtime: `window.b2b.__get_asset_location(${JSON.stringify(filename)})`,
            };
      },
    },
    server: {
      port: 3001,
      cors: true,
      proxy: {
        '/bigcommerce': {
          target:
            env?.VITE_PROXY_SHOPPING_URL || 'https://msfremote-frontend-demo.mybigcommerce.com/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/bigcommerce/, ''),
        },
      },
    },
    test: {
      // We override the default timeout in CI to account for slower test execution.
      // This is necessary because the default timeout of 5 seconds is not enough for some tests
      // that involve network requests or complex component interactions.
      testTimeout: process.env.CI === 'true' ? 40_000 : 5_000,
      slowTestThreshold: 3_000,
      env: {
        VITE_B2B_URL: 'https://api-b2b.bigcommerce.com',
        VITE_IS_LOCAL_ENVIRONMENT: 'TRUE',
      },
      clearMocks: true,
      mockReset: true,
      restoreMocks: true,
      globals: true,
      environment: 'jsdom',
      globalSetup: './tests/global-setup.ts',
      setupFiles: ['./tests/jsdom-polyfills.ts', './tests/setup-test-environment.ts'],
      coverage: {
        provider: 'istanbul',
        cleanOnRerun: process.env.CI === 'true',
        reporter: ['text', 'html', 'clover', 'json', 'lcov'],
      },
      deps: {
        optimizer: {
          web: {
            include: ['react-intl'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        tests: path.resolve(__dirname, './tests'),
      },
    },
    build: {
      minify: true,
      sourcemap: true,
      rollupOptions: {
        input: {
          index: 'src/main.ts',
          headless: 'src/headless.ts',
        },
        output: {
          entryFileNames({ name }) {
            if (name.includes('headless') || env.VITE_DISABLE_BUILD_HASH) {
              return '[name].js';
            }
            return '[name].[hash].js';
          },
          manualChunks: {
            reactVendor: ['react', 'react-dom'],
            intl: ['react-intl'],
            mui: ['@emotion/react', '@emotion/styled', '@mui/material'],
            muiIcon: ['@mui/icons-material'],
            redux: ['react-redux'],
            dateFns: ['date-fns'],
            lang: ['@b3/lang'],
            pdfobject: ['pdfobject'],
            resizable: ['react-resizable'],
            pdf: ['react-pdf'],
            toolkit: ['@reduxjs/toolkit'],
            form: ['react-hook-form'],
            router: ['react-router-dom'],
            lodashEs: ['lodash-es'],
            dropzone: ['react-dropzone'],
            draggable: ['react-draggable'],
            eCache: ['@emotion/cache'],
          },
        },
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return;
          }
          warn(warning);
        },
        plugins: env.VITE_VISUALIZER === '1' && [
          visualizer({
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
        ],
      },
    },
  };
});
