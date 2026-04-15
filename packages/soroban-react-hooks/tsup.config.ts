import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@stellar/stellar-sdk', '@stellar/freighter-api', '@tanstack/react-query'],
  esbuildOptions(options) {
    (options as Record<string, unknown>)['jsx'] = 'automatic';
  },
});
