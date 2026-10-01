/* AWB Apps — Service Worker v4
 * Strategi:
 *  - HTML/CSS/JS  → network-first (selalu coba ambil terbaru)
 *  - Gambar/icon  → cache-first (jarang berubah, biar cepat)
 *  - Apps Script  → bypass total (jangan di-cache)
 */
const CACHE_NAME = 'awb-apps-v4'; // naikkan angka ini tiap kali mau paksa update

const PRECACHE = [
  './',
  './index.html',
  './monitoring.html',
  './pestisida.html',
  './manifest.json',
  './LOGO_AWB.png',
  './icon-192.png',
  './icon-512.png'
];

const isHtmlLike = (req) =>
  req.destination === 'document' ||
  req.destination === 'script' ||
  req.destination === 'style' ||
  /\.(html?|js|css)$/i.test(new URL(req.url).pathname);

const isImage = (req) =>
  req.destination === 'image' ||
  /\.(png|jpe?g|gif|svg|webp|ico)$/i.test(new URL(req.url).pathname);

// Install: precache + langsung aktif
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        PRECACHE.map(url =>
          cache.add(url).catch(err => console.log('Gagal cache:', url, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// Activate: hapus semua cache versi lama
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1. Apps Script → bypass total
  if (url.hostname.includes('script.google.com')) return;

  // 2. HTML/JS/CSS → network-first (kunci utama agar update langsung kelihatan)
  if (isHtmlLike(e.request)) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // 3. Gambar/icon → cache-first
  if (isImage(e.request)) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
          return res;
        })
      )
    );
    return;
  }

  // 4. Sisanya → cache-first dengan fallback network
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).catch(() => caches.match('./index.html'))
    )
  );
});
