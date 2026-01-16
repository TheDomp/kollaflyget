import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/swedavia-api': {
        target: 'https://api.swedavia.se',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/swedavia-api/, ''),
      }
    }
  }
})
