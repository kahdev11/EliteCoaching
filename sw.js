const CACHE = 'lagutvikling-v2';
const ASSETS = ['./', './index.html', './app.js', './manifest.json', './chart.umd.js', './chartjs-adapter-date-fns.bundle.min.js'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(()=>{}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for own-origin files: always try to fetch the latest version,
// only fall back to cache when offline. This means new app deploys reach the
// user immediately instead of getting stuck on an old cached version.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, resClone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
