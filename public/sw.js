// Service Worker for Audiobook Player PWA
const CACHE_NAME = 'audiobook-player-v13';
// Caminhos relativos à pasta do service worker (funciona também numa subpasta, como no GitHub Pages)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/favicon.png',
  './icons/app-icon-180.png',
  './icons/app-icon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('SW Precache non-fatal error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
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
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Never intercept or cache large audio files, blob URLs, or Vite development requests
  if (
    request.method !== 'GET' ||
    request.url.startsWith('blob:') ||
    request.url.includes('/@vite/') ||
    request.url.includes('/@fs/') ||
    request.url.includes('/@id/') ||
    request.url.includes('/src/') ||
    request.url.includes(':5173') ||
    request.url.match(/\.(mp3|m4a|m4b|aac|wav|ogg|flac)(\?.*)?$/i) ||
    request.headers.get('range')
  ) {
    return;
  }

  // Páginas (index.html): a rede, se responder em até 0,7 s (uma versão nova aparece na hora). Com a rede lenta
  // ou sem conexão, abre a cópia salva sem esperar, e a rede atualiza a cópia para a próxima abertura
  if (request.mode === 'navigate') {
    const network = fetch(request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return networkResponse;
    });
    const saved = () => caches.match(request).then((cached) => cached || caches.match('./index.html'));
    event.waitUntil(network.catch(() => {}));
    event.respondWith(
      new Promise((resolve) => {
        let done = false;
        const finish = (response) => { if (!done && response) { done = true; resolve(response); } };
        const timer = setTimeout(() => saved().then(finish), 700);
        network.then((r) => { clearTimeout(timer); finish(r); }).catch(() => { clearTimeout(timer); saved().then((r) => finish(r || Response.error())); });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and refresh in background
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse.clone()));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback to index.html for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// Tocar numa notificação abre o app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients[0];
      return open ? open.focus() : self.clients.openWindow('./');
    })
  );
});
