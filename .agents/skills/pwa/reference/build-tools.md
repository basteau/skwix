# Build Tool Configuration

PWA plugins for popular build tools that generate service workers and manifests.

## Vite (vite-plugin-pwa)

Dev dependency: `vite-plugin-pwa`

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My App',
        short_name: 'App',
        theme_color: '#000000',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\..*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ]
});
```

### Update Prompt (React)

```typescript
import { useRegisterSW } from 'virtual:pwa-register/react';

function App() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  return needRefresh && (
    <button onClick={() => updateServiceWorker(true)}>Update available</button>
  );
}
```

---

## Next.js (next-pwa)

Dependency: `next-pwa`

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  // Next.js config
});
```

Create `public/manifest.json` manually.

---

## Nuxt 3 (@vite-pwa/nuxt)

Dev dependency: `@vite-pwa/nuxt`

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],
  pwa: {
    manifest: {
      name: 'My App',
      short_name: 'App',
      theme_color: '#000000'
    }
  }
});
```

---

## SvelteKit (@vite-pwa/sveltekit)

Dev dependency: `@vite-pwa/sveltekit`

```typescript
// vite.config.ts
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
  plugins: [sveltekit(), SvelteKitPWA()]
});
```

---

## Icon Generation

Dev dependency: `@vite-pwa/assets-generator`

```typescript
// pwa-assets.config.ts
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/logo.svg']
});
```

Run: `npx pwa-assets-generator`

### Required Sizes

| Size | Purpose |
|------|---------|
| 192x192 | Standard PWA icon |
| 512x512 | Splash screen |
| 512x512 maskable | Android adaptive (20% safe zone) |
| 180x180 | Apple touch icon |

---

## Offline Fallback Page

Create `public/offline.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline</title>
</head>
<body>
  <h1>You're offline</h1>
  <p>Check your connection and try again.</p>
</body>
</html>
```

Configure in workbox:

```javascript
workbox: {
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [/^\/api/]
}
```
