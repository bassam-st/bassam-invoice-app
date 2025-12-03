// sw.js - Service Worker بسيط مع تنظيف الكاش عند كل إصدار جديد

const CACHE_NAME = "bassam-invoice-v3"; // غيّر الرقم لو حبيت تجبر تحديث جديد
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.webmanifest"
];

// عند التثبيت: نخزن الملفات الأساسية
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {
        // لو فشل واحد من الملفات ما نخرب التشغيل
        return Promise.resolve();
      });
    })
  );

  // تفعيل سريع بدون انتظار إغلاق التابات القديمة
  self.skipWaiting();
});

// عند التفعيل: نحذف أي كاش قديم باسم مختلف
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

// التعامل مع الطلبات
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // لا نتدخل في POST/PUT/... فقط GET
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // لو موجود في الكاش -> رجعه
      if (cachedResponse) {
        return cachedResponse;
      }
      // وإلا -> طلب من النت وخزّنه (بهدوء) لمرات قادمة
      return fetch(request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return networkResponse;
        })
        .catch(() => {
          // لو بدون نت ومافي كاش -> نخليها تفشل عادي
          return new Response("Offline ولم يتم العثور على الملف في الكاش", {
            status: 503,
            statusText: "Service Unavailable"
          });
        });
    })
  );
});
