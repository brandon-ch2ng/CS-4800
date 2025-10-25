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
    proxy: { //React code can just call fetch('/auth/login').
      // forward API calls to Flask dev server
      // '/auth': 'http://localhost:5000',
      // '/patients': 'http://localhost:5000',
      // '/doctors': 'http://localhost:5000',
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
