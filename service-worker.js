const CACHE_NAME = 'steep-tea-log-v12';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './supabase-config.js',
  './steep-data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // cache:'reload' bypasses the browser HTTP cache, so a fresh service worker
      // never re-caches a stale app.js that GitHub Pages was still serving from
      // its edge cache. This is what fixes "SW bumped but the refresh shows old UI".
      cache.addAll(FILES_TO_CACHE.map((u) => new Request(u, { cache: 'reload' })))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // cache same-origin GET requests as we go
        if (event.request.method === 'GET' && response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
