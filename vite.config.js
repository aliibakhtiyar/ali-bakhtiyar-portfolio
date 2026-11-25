import { existsSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

const cvFile = 'ali-bakhtiyar-cv.pdf';

export default defineConfig({
  define: {
    __CV_URL__: JSON.stringify(existsSync(new URL('./public/' + cvFile, import.meta.url)) ? '/' + cvFile : null),
  },
  plugins: [react(), tailwind()],
  server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
  build: { target: 'es2022', outDir: 'dist/client' },
});
