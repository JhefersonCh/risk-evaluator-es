import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
  server: { port: 5173, open: false },
  build: { target: 'es2022', outDir: 'dist' },
});
