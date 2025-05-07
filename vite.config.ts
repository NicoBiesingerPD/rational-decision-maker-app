/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy';
// @ts-expect-error react-import
import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy(),
    commonjs(), // Fügt Unterstützung für CommonJS-Module hinzu
  ],
  resolve: {
    alias: {
      // Falls React Native auf Web umgesetzt wird
      'react-native': 'react-native-web',
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Workaround für mögliche Konflikte bei der Modulauflösung
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});
