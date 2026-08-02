/* Shark Life — service worker
   Strategy: cache-first for everything, with the network used to fill and
   refresh the cache in the background. This is what makes the game load
   instantly and work offline after the first visit.

   IMPORTANT: bump CACHE_NAME any time you update the game files and push a
   new version. Browsers keep old service workers running until all tabs are
   closed, and the cache name is what forces a clean break to the new files. */
const CACHE_NAME = "shark-life-v3";

// Same-origin files that must always be available offline.
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle simple GETs — POST/PUT etc. always go straight to network.
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          // Cache a copy of anything we successfully fetch (this is how the
          // Three.js CDN script and Google Fonts end up cached too, even
          // though they're cross-origin).
          if (response && (response.ok || response.type === "opaque")) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached); // offline and not cached: fall back silently

      // Cache-first: serve instantly if we have it, refresh in the background.
      return cached || networkFetch;
    })
  );
});
