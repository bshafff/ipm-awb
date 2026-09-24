const CACHE_NAME = 'awb-apps-v2';
const ASSETS = [
  './',
  './index.html',
  './monitoring/',
  './monitoring/index.html',
  './pestisida/',
  './pestisida/index.html',
  './manifest.json',
  './LOGO_AWB.png',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache semua aset
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        ASSETS.map(url => cache.add(url).catch(err => console.log('Gagal cache:', url, err)))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: hapus cache lama
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first untuk aset, network-first untuk API
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Jangan cache request ke Apps Script (POST/GET)
  if (url.hostname.includes('script.google.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
