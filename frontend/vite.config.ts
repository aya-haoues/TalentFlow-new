import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // ✅ Alias — confort quotidien
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ✅ Port fixe — évite les bugs CORS
  server: {
    port: 5173,
    strictPort: true,
  },
})