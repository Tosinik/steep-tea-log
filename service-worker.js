const CACHE_NAME = 'steep-tea-log-v25';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './supabase-config.js',
  './steep-data.js',
  './steep-core.js',
  './steep-settings.js',
  './steep-dashboard.js',
  './steep-teas.js',
  './steep-passport.js',
  './steep-social.js',
  './steep-sessions.js',
  './steep-boot.js',
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
  const req = event.request;
  const url = new URL(req.url);
  // Only the app shell (same-origin GET) and the pinned Supabase-js CDN script are
  // cacheable. Everything else — Supabase REST/auth/storage, any cross-origin or
  // non-GET request — goes straight to the network and is NEVER cached. Caching
  // data responses was serving stale teas/photos until a hard reload.
  const cacheable = req.method === 'GET' &&
    (url.origin === self.location.origin ||
     url.href === 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
  if (!cacheable) { event.respondWith(fetch(req)); return; }
  event.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
