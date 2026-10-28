import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify('0.1.64') },
  build: { outDir: 'dist/client', sourcemap: true },
})
