import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/api/src/**/*.spec.ts'],
    root: resolve(__dirname, '../..'),
    setupFiles: [resolve(__dirname, 'src/__tests__/setup.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/main.ts'],
    },
  },
  resolve: {
    alias: {
      '@raio-x/utils': resolve(__dirname, '../../libs/shared/utils/src/index.ts'),
      '@raio-x/types': resolve(__dirname, '../../libs/shared/types/src/index.ts'),
    },
  },
})
