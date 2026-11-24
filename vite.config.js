import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        id: '/',
        name: 'PokéSearch — Pokémon GO Pokédex & Search Builder',
        short_name: 'PokéSearch',
        description: 'Offline-first Pokémon GO Pokédex, Search String Builder, Tag System, and Storage Triage Tool.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#bfeaf6',
        background_color: '#bfeaf6',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        globIgnores: ['**/pwa-192x192.png', '**/pwa-512x512.png'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokemon-sprites',
              expiration: {
                maxEntries: 3000,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                // Only cache verified CORS 200 responses (never opaque status 0) to avoid 7 MB/file iOS quota bloat
                statuses: [200],
              },
            },
          },
          {
            // Explicit user "Sync Live" calls must always hit the network; offline fallback is handled by metaCacheStore
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/pvpoke\/pvpoke\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
      },
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/data/pokedex.json')) return 'data-pokedex';
          if (id.includes('/src/data/meta_cache.json') || id.includes('/src/data/meta_snapshot.json')) {
            return 'data-meta';
          }
          if (id.includes('/src/data/events_archive.json')) return 'data-events';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'node',
  },
})
