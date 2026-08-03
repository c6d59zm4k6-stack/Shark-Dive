/* Shark Life — service worker
   Strategy: cache-first for everything, with the network used to fill and
   refresh the cache in the background. This is what makes the game load
   instantly and work offline after the first visit.

   IMPORTANT: bump CACHE_NAME any time you update the game files and push a
   new version. Browsers keep old service workers running until all tabs are
   closed, and the cache name is what forces a clean break to the new files. */
const CACHE_NAME = "shark-life-v9";

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
    caches.open(CACHE_NAME).then((cache) =>
      // NOTE: deliberately NOT cache.addAll(). addAll() is atomic — a single
      // 404 (a renamed or missing icon, say) rejects the whole promise and
      // the service worker silently never installs, so offline support just
      // stops working with no obvious error. Adding each URL individually
      // means one missing asset costs you that asset, not the entire PWA.
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[sw] precache skipped:", url, err);
          })
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Lets the page ask THIS running service worker instance what version it is,
// so the on-screen tag always reflects the actual controller, not a guess.
self.addEventListener("message", (event) => {
  if (event.data === "GET_VERSION") {
    event.source.postMessage({ type: "VERSION", version: CACHE_NAME });
  }
});

self.addEventListener("fetch", (event) => {
  // Only handle simple GETs — POST/PUT etc. always go straight to network.
  if (event.request.method !== "GET") return;

  // Page navigations (loading/reloading index.html itself) go NETWORK-FIRST.
  // This app is under active iteration, so "always show the latest version"
  // matters more here than the instant-load benefit of cache-first — that's
  // what was causing "I updated sw.js but still see the old page": the shell
  // itself was being served from cache before the new version ever had a
  // chance to load.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  // Everything else (icons, manifest, the Three.js CDN script, fonts) stays
  // cache-first — these rarely change, so instant-load wins here.
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
