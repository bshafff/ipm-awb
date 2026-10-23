/* AWB Apps — Service Worker v12 */
const CACHE_NAME = 'awb-apps-v15';

const PRECACHE = [
  './',
  './index.html',
  './monitoring.html',
  './pestisida.html',
  './suhu.html',
  './analisis.html',
  './outbox.js',
  './core.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  './manifest.json',
  './LOGO_AWB.png',
  './icon-192.png',
  './icon-512.png',
  './version.json'
];

const isHtmlLike = (req) =>
  req.destination === 'document' ||
  req.destination === 'script' ||
  req.destination === 'style' ||
  /\.(html?|js|css)$/i.test(new URL(req.url).pathname);

const isImage = (req) =>
  req.destination === 'image' ||
  /\.(png|jpe?g|gif|svg|webp|ico)$/i.test(new URL(req.url).pathname);

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(PRECACHE.map(url => cache.add(url).catch(err => console.log('Gagal cache:', url, err))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('script.google.com')) return;

  if (isHtmlLike(e.request)) {
    e.respondWith(
      fetch(e.request)
        .then(res => { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, copy)); return res; })
        .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }
  if (isImage(e.request)) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, copy)); return res; })
      )
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).catch(() => caches.match('./index.html'))
    )
  );
});
