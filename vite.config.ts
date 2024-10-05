import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/Space-apps-orrery-web-app/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        map: path.resolve(__dirname, 'map.html')
      }
    }
  }
});
