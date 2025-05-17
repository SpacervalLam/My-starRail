import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, 'client'),
  
  base: './',

  plugins: [vue()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'client/src'),
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3168',
        changeOrigin: true,
        rewrite: (p: string) => p.replace(/^\/api/, ''),
      },
    },
  },

  build: {
    // 3. 输出目录放到根下 dist-client
    outDir: resolve(__dirname, 'dist-client'),
    // 4. 清空旧的 dist-client
    emptyOutDir: true,
    // 5. 构建时仍然基于 client 根
    rollupOptions: {
      input: resolve(__dirname, 'client/index.html'),
    },
  },
});
