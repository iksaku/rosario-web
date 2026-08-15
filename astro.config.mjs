import { defineConfig } from 'astro/config';
import solidjs from '@astrojs/solid-js';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [solidjs()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    host: true,
  }
});
