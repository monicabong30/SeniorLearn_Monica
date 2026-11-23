import { defineConfig } from 'vitest/config';

// Integration tests deliberately use only MONGODB_TEST_URI and may take longer than unit tests.
export default defineConfig({ test: { include: ['src/integration/**/*.test.ts'], testTimeout: 30000, hookTimeout: 30000 } });
