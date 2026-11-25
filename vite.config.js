import { existsSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

const cvFile = 'ali-bakhtiyar-cv.pdf';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'SITE_URL');
  const siteUrl = env.SITE_URL || process.env.RENDER_EXTERNAL_URL;
  const plugins = [react(), tailwind()];
  if (siteUrl) {
    const url = new URL(siteUrl);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('SITE_URL must use HTTP or HTTPS.');
    plugins.push({
      name: 'portfolio-site-origin',
      transformIndexHtml(html) {
        return html.replaceAll('https://ali-bakhtiyar-portfolio.rockycanal8.chatgpt.site/', url.origin + '/');
      },
    });
  }

  return {
    define: {
      __CV_URL__: JSON.stringify(existsSync(new URL('./public/' + cvFile, import.meta.url)) ? '/' + cvFile : null),
    },
    plugins,
    server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
    build: { target: 'es2022', outDir: 'dist/client' },
  };
});
