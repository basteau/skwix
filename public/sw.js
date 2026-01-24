const CACHE_NAME = 'skwix-v1';

// Minimal service worker - no offline caching per requirements
// Just register to enable PWA installation

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Network-only strategy - no offline mode required
    event.respondWith(fetch(event.request));
});
