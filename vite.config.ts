import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: 'src',
  base: './',
  resolve: {
    alias: {
      '@arch': path.resolve(__dirname, 'src/arch'),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2020',
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/arch/**/*.ts'],
    },
  },
})
