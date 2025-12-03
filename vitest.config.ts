import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
    watch: false,
    passWithNoTests: true,
    teardownTimeout: 1000,
    pool: 'forks',
  },
});

