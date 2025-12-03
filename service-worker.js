// service-worker.js – كاش جديد لإجبار المتصفح على تحديث الملفات

const CACHE_NAME = "bassam-invoice-cache-v5"; // غير الاسم كل مرة لو احتجت تحديث قوي

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js?v=900",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
];

// تثبيت الكاش
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// تفعيل وحذف الكاشات القديمة
self.addEventListener("activate", (event) => {
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

// جلب من الكاش أو من الشبكة
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
