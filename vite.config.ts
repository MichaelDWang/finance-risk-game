import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({ mode }) => ({
  base: loadEnv(mode, process.cwd(), '').VITE_BASE_PATH || '/finance-risk-game/',
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 1500 },
}));
