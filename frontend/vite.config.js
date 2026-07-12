import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the browser calls /api/* which is proxied to the backend (http://localhost:4000).
// In Docker, nginx proxies /api/* to the backend service. Same relative base works in both.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
  },
});
