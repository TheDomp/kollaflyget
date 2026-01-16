import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/swedavia-api': {
        target: 'https://www.swedavia.se/services/publicflightsboard/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/swedavia-api/, ''),
        headers: {
          'Referer': 'https://www.swedavia.se/',
          'Origin': 'https://www.swedavia.se'
        }
      }
    }
  }
})
