// sw.js (Stable)
const CACHE_NAME = "invoice-cache-v3"; // غيّر الرقم عند أي تحديث كبير

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

// تثبيت: كاش للملفات الأساسية
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// تفعيل: حذف الكاشات القديمة
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// جلب: صفحات (navigate) شبكة أولاً، والباقي كاش أولاً
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  // للصفحات: شبكة أولاً لتجنب بقاء صفحة قديمة تسبب مشاكل الطباعة
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./"))
    );
    return;
  }

  // للملفات: كاش أولاً
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
