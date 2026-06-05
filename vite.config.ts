import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const srcDir = path.resolve(__dirname, 'src/assets')
      const destDir = path.resolve(__dirname, 'dist/assets')
      if (fs.existsSync(srcDir)) {
        fs.cpSync(srcDir, destDir, { recursive: true, force: true })
      }
    }
  }
}

export default defineConfig({
  root: 'src',
  base: './',
  plugins: [copyStaticAssets()],
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
    setupFiles: ['./arch/storage/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/arch/**/*.ts'],
    },
  },
})
