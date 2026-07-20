// Minimal service worker — exists mainly so the site qualifies as an
// installable PWA if a visitor chooses to. Deliberately light-touch:
// no offline-first strategy, since this is a marketing site, not an app
// that needs to work without a connection.

const CACHE_NAME = 'eazify-static-v1';
const PRECACHE_URLS = ['/styles.css', '/script.js', '/assets/eazify-logo-black-text.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
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

// Network-first for HTML (always get the freshest page), cache-first for
// static assets (css/js/images) so repeat visits feel a little snappier.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isHTML = req.headers.get('accept')?.includes('text/html');
  if (isHTML) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && (req.url.endsWith('.css') || req.url.endsWith('.js') || req.url.match(/\.(png|jpg|jpeg|svg)$/))) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
