import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js']
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      JWT_SECRET: 'test-secret-for-vitest-only'
    }
  }
})
