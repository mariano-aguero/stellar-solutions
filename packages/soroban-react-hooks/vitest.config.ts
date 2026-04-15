import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['src/__tests__/integration/**'],
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
    },
  },
});
