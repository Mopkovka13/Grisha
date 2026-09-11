import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Uploaded media — photos, thumbnails, previews, HLS. In production
      // Spring serves these and the SPA from one origin, so this is dev-only:
      // without it Vite answers /media/* with its own index.html fallback and
      // every <img> gets HTML instead of an image.
      '/media': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
