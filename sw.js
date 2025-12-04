// =============================
//   Service Worker – فاتورة بسام
//   النسخة المعدلة (v3)
// =============================

const CACHE_NAME = "bassam-invoice-v3"; 
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest"
];

// تثبيت الـ Service Worker وتخزين الملفات
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// تفعيل النسخة الجديدة ومسح الكاش القديم
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // حذف الكاش القديم
          }
        })
      )
    )
  );
});

// جلب الملفات من الكاش أولاً ثم من الشبكة
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
