import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Load .env.local before tests
import './load-env';

/**
 * Configuration Vitest pour tests d'intégration
 * Utilise un environnement Node pour les tests API/DB
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./__tests__/setup-integration.ts'],
    include: [
      '__tests__/integration/**/*.test.ts',
      '__tests__/integration/**/*.test.tsx'
    ],
    exclude: [
      '__tests__/unit/**',
      '__tests__/e2e/**'
    ],
    testTimeout: 60000,
    hookTimeout: 60000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    sequence: {
      hooks: 'list'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
