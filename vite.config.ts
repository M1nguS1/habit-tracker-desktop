import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Crear el equivalente a __dirname de forma segura para ES Modules
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Punto de entrada del proceso principal de Electron
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              // Le decimos a Vite que no empaquete better-sqlite3 en el main process
              external: ['better-sqlite3'],
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})