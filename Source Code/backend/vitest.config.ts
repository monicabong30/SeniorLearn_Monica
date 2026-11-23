import { defineConfig } from 'vitest/config';

// Atlas integration requests can legitimately take longer than Vitest's 5s default.
export default defineConfig({ test: { testTimeout: 10000, exclude: ['src/integration/**', '**/node_modules/**', '**/dist/**'] } });
