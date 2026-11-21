// public/sw.js
const CACHE_NAME = 'sportschool-cache-v1';

// Archivos que se guardarán en caché para que la app funcione offline
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/style.css',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// 1. Evento INSTALL: Se ejecuta cuando se instala el SW por primera vez
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Guardando archivos en caché...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Fuerza al SW a activarse de inmediato
});

// 2. Evento ACTIVATE: Se ejecuta cuando el SW se activa (limpia cachés viejas)
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activo.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Evento FETCH: Intercepta las peticiones para servir desde caché si no hay red
self.addEventListener('fetch', (event) => {
  // Ignoramos peticiones que no sean GET (como nuestro POST a JSONPlaceholder)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si el recurso está en caché, lo devolvemos (Funcionamiento Offline)
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Si no está en caché, lo buscamos en la red
      return fetch(event.request).then((networkResponse) => {
        // Guardamos dinámicamente los recursos nuevos en caché
        return caches.open(CACHE_NAME).then((cache) => {
          // Solo guardamos peticiones exitosas
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      }).catch(() => {
        // Si falla la red y no hay caché, podríamos mostrar una página offline, 
        // pero como nuestra app es una SPA, el HTML principal ya está en caché.
        console.log('[SW] Red caída y recurso no encontrado en caché.');
      });
    })
  );
});