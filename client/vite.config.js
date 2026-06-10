import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // 프론트(/api/*) 요청을 백엔드(Express, 3000)로 프록시
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
