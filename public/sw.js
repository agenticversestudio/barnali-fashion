// Minimal offline service worker shell for Barnali ERP (PWA)
const CACHE_NAME = "barnali-erp-v1";
const OFFLINE_URL = "/erp/login";

self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", OFFLINE_URL]);
    })
  );
  (self as any).skipWaiting();
});

self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  (self as any).clients.claim();
});

self.addEventListener("fetch", (event: any) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL) as Promise<Response>;
      })
    );
  }
});
