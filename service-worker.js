self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

// لا نستخدم fetch هنا حتى لا نخرب الطباعة أو نحجز نسخة قديمة من الملفات
