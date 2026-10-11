/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api calls are proxied to the Spring Boot app, so no CORS setup is needed locally.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3345', '/actuator': 'http://localhost:3345' } },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts', css: false },
});
