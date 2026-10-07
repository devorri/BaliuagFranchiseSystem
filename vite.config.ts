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
        configure: proxy => proxy.on('proxyReq', proxyReq => {
          const secretKey = process.env.PAYMONGO_SECRET_KEY;
          if (secretKey) proxyReq.setHeader('Authorization', `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`);
        }),
      },
      // Proxy Semaphore SMS API requests to avoid CORS issues in development
      '/api/semaphore': {
        target: 'https://api.semaphore.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/semaphore/, ''),
        secure: true,
        configure: proxy => proxy.on('proxyReq', proxyReq => {
          const apiKey = process.env.SEMAPHORE_API_KEY;
          if (!apiKey) return;
          const separator = proxyReq.path.includes('?') ? '&' : '?';
          proxyReq.path = `${proxyReq.path}${separator}apikey=${encodeURIComponent(apiKey)}`;
        }),
      },
    },
  },
})
