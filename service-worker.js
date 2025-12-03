// ===== Force fresh SW on every update =====
const CACHE_NAME = "bassam-invoice-v10";

// Files you want cached
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
];

// Install SW
self.addEventListener("install", (event) => {
  self.skipWaiting(); // IMPORTANT: activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate SW & delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim(); // apply new SW immediately
});

// Fetch
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    // Always load fresh index.html to avoid old versions
    return event.respondWith(fetch(event.request).catch(() => caches.match("./index.html")));
  }

  event.respondWith(
    caches.match(event.request).then((res) => {
      return (
        res ||
        fetch(event.request).then((fetchRes) => {
          // Do NOT cache print() or PDF to avoid breaking printing
          if (
            fetchRes.type === "opaque" ||
            event.request.url.includes("print") ||
            event.request.destination === "document"
          ) {
            return fetchRes;
          }

          const resClone = fetchRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return fetchRes;
        })
      );
    })
  );
});
