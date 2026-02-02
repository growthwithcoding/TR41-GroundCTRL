import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Tier 1: Core React vendor (most stable, best caching)
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          
          // Tier 2: UI component libraries
          'vendor-ui': [
            'lucide-react',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-progress',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch',
            '@radix-ui/react-slot'
          ],
          
          // Tier 3: Firebase & heavy dependencies
          'vendor-firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore'
          ],
          
          // Tier 3b: Socket.io (large, separate)
          'vendor-socket': [
            'socket.io-client'
          ],
          
          // Tier 4: Form & validation libraries
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ]
        }
      }
    },
    // Increase chunk size warning limit for vendor bundles
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging in dev, disabled in production
    sourcemap: false
  },
  optimizeDeps: {
    include: ['socket.io-client', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
})
