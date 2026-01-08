import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load các biến môi trường từ process.env (Vercel)
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Truyền biến API_KEY vào ứng dụng an toàn
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      outDir: 'dist',
    }
  };
});