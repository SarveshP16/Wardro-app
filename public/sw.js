// Minimal hand-written service worker for PWA installability + an
// offline-capable app shell. Network-first (so wardrobe/outfit UI stays
// fresh whenever the Tailscale connection is up), falling back to the
// cache when offline. API routes are always network-only -- wardrobe and
// outfit data must never be served stale.
const CACHE_NAME = "wardro-shell-v1";
const APP_SHELL = [
  "/",
  "/wardrobe",
  "/outfits",
  "/settings",
  "/manifest.json",
  "/icons/icon-1024.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(request, copy))
          .catch(() => {});
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/"))),
  );
});
