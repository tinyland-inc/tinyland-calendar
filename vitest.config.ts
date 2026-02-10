import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'tinyland-calendar',
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
