import { defineConfig } from 'vitest/config';

// Integration tests deliberately use only MONGODB_TEST_URI. The isolated Atlas
// cluster is in Sydney, so index setup/cleanup can legitimately outlast local
// unit-test limits. Keep this scoped to integration tests only.
export default defineConfig({ test: { include: ['src/integration/**/*.test.ts'], testTimeout: 120000, hookTimeout: 120000 } });
