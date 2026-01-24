# Service Worker Caching Strategies

## Strategy Selection Guide

| Strategy | Best For | Freshness | Speed |
|----------|----------|-----------|-------|
| **CacheFirst** | Static assets (images, fonts, CSS) | Low | Fast |
| **NetworkFirst** | API data, dynamic content | High | Variable |
| **StaleWhileRevalidate** | Mixed content, semi-dynamic | Medium | Fast |
| **NetworkOnly** | Real-time data, auth endpoints | Always fresh | Slow |
| **CacheOnly** | Precached assets only | Stale | Fastest |

## Workbox Runtime Caching Examples

```typescript
workbox: {
  runtimeCaching: [
    // Static assets - Cache First
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    },
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        }
      }
    },
    // API calls - Network First with timeout
    {
      urlPattern: /^https:\/\/api\..*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 // 1 hour
        }
      }
    },
    // HTML pages - Stale While Revalidate
    {
      urlPattern: /\.html$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'html-cache'
      }
    }
  ]
}
```

## Testing & Debugging

### Check service worker registration

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Service Workers:', registrations);
  });
}
```

### Check cache contents

```javascript
caches.keys().then(names => {
  names.forEach(name => {
    caches.open(name).then(cache => {
      cache.keys().then(keys => console.log(name, keys.length, 'items'));
    });
  });
});
```

### Clear PWA State

```javascript
// Unregister service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### Force update

```javascript
navigator.serviceWorker.ready.then(registration => {
  registration.update();
});
```

## Cache Invalidation

```typescript
// Version your cache names
const CACHE_VERSION = 'v1.2.3';
workbox: {
  cacheId: `my-app-${CACHE_VERSION}`,
  cleanupOutdatedCaches: true
}
```
