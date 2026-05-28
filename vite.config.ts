import { defineConfig } from 'vite';

// ADD AFTER FRAMEWORK DECISION:
// React:  import react from '@vitejs/plugin-react'
// Angular: import analog from '@analogjs/vite-plugin-angular'

export default defineConfig({
  plugins: [
    // ADD: react() or analog()
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/capture': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
