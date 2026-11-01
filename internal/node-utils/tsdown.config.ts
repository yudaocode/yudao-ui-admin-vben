import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: false,
  deps: {
    neverBundle: true,
  },
  entry: ['src/index.ts'],
  format: ['esm'],
});
