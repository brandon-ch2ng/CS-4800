// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react-swc'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // needed in Codespaces
    port: 5173, //frontend
    proxy: { 
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/patients': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/doctors': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/appointments': { 
        target: 'http://localhost:5000', 
        changeOrigin: true, 
        secure: false,
      },
    },
  },
})
