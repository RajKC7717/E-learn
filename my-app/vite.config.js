import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      
      // 1. UPDATE: Add 'evosolve.apk' here so it is recognized as a static asset
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'evosolve.apk'], 
      
      workbox: {
        // 2. UPDATE: Increase cache limit to 50MB (Standard APKs are ~20-40MB)
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, 
        
        // 3. UPDATE: Add 'apk' to the list of file types to cache
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,apk}'],
      },
      
      manifest: {
        name: 'Offline Tutor AI',
        short_name: 'TutorAI',
        description: 'Offline AI Education Platform',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    allowedHosts: ['.ngrok-free.app'], // Allows any ngrok URL
  },
})