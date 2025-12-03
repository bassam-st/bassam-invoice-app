// service-worker.js – إصدار جديد يجبر المتصفح على كاش جديد

const CACHE_NAME = 'bassam-invoice-v3'; // غيرنا اسم الكاش هنا

const FILES_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js?v=500',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
];

// تثبيت الـ SW وتخزين الملفات
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

// تفعيل وإزالة أي كاش قديم بإسم آخر
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// جلب الملفات من الكاش أو من الشبكة
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
