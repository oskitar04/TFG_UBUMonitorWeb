import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Desde aquí se modifica para que desde el front se pueda hacer peticiones a la api_rest
  server: {
    proxy: {
      // Cualquier petición a /api/... se reenvía al backend en el puerto 8080
      // SIRVE PARA EVITAR ERROR DE CORS 
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
