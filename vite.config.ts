import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react'

const alias = {
  '@shared': path.resolve(__dirname, 'src/shared'),
  '@renderer': path.resolve(__dirname, 'src/renderer'),
  '@main': path.resolve(__dirname, 'src/main'),
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['better-sqlite3'],
            },
          },
          resolve: {
            alias,
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
  ],

  server: {
    host: '127.0.0.1',     // ← обязательно
    port: 5173,
    strictPort: true,
    hmr: {
      host: '127.0.0.1',
    }
  },

  resolve: {
    alias,
  },
  optimizeDeps: {
    exclude: ['better-sqlite3'],
  },
})
