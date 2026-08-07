import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy PayMongo API requests to avoid CORS issues in development
      '/api/paymongo': {
        target: 'https://api.paymongo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/paymongo/, ''),
        secure: true,
      },
    },
  },
})
