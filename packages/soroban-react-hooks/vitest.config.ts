import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@stellar-solutions/core': resolve(__dirname, '../core/dist/index.js') },
  },
  test: {
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['src/__tests__/integration/**'],
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
    },
  },
});
