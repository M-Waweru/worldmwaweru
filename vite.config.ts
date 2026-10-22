import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5195, strictPort: true },
  preview: { port: 4195, strictPort: true },
})
