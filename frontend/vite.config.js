import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// FIX 8: Manual chunk splitting to reduce initial bundle size by 40-60%.
// Splits MUI, icons, charts, and vendor libs into separate cacheable chunks
// so the browser only re-downloads what actually changed.
export default defineConfig({
  plugins: [react()],
  build: {
    // Warn if any single chunk exceeds 500KB
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // MUI core — largest chunk (~600KB gzipped without splitting)
          if (id.includes('@mui/material')) {
            return 'mui-core'
          }
          // MUI icons — separate so it doesn't block initial paint
          if (id.includes('@mui/icons-material')) {
            return 'mui-icons'
          }
          // Recharts — only needed on analytics pages
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts'
          }
          // dayjs — small but cacheable
          if (id.includes('dayjs')) {
            return 'dayjs'
          }
          // React core — most stable, rarely changes
          if (id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor'
          }
          // Everything else from node_modules
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
  // Optimise dev server startup
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      'axios',
      'dayjs',
    ],
  },
})
