self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("invoice-cache").then((cache) => {
      return cache.addAll([
        "./",
        "index.html",
        "styles.css",
        "app.js",
        "manifest.json",
        "html2pdf.bundle.min.js"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request);
    })
  );
});
