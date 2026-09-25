import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Rutas relativas: la app funciona en cualquier carpeta del servidor,
  // por ejemplo en GitHub Pages (usuario.github.io/Auto-Atlas/) o en la raíz de Vercel.
  base: './',
})
