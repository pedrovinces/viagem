const CACHE = 'nossa-viagem-v3';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/components.css',
  './css/dark-mode.css',
  './css/sections/agenda.css',
  './css/sections/map.css',
  './css/sections/transport.css',
  './css/sections/phrases.css',
  './css/sections/weather.css',
  './css/sections/religion.css',
  './css/sections/destinations.css',
  './css/sections/documents.css',
  './js/pwa.js',
  './js/app.js',
  './js/modules/agenda.js',
  './js/modules/map.js',
  './js/modules/transport.js',
  './js/modules/phrases.js',
  './js/modules/weather.js',
  './js/modules/religion.js',
  './js/modules/destinations.js',
  './js/modules/documents.js',
  './data/itinerary.json',
  './data/phrases-it.json',
  './data/phrases-fr.json',
  './data/transport.json',
  './data/religion.json',
  './data/destinations.json',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg',
  './assets/icons/icon-maskable.svg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Lato:wght@300;400;700&display=swap',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Open-Meteo: network first, cache fallback (clima)
  if (url.hostname === 'api.open-meteo.com') {
    event.respondWith(networkFirstWithTimeout(request, 4000));
    return;
  }

  // OSM tiles: cache first (tiles não mudam)
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Google Fonts e Unpkg: stale-while-revalidate
  if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'unpkg.com' || url.hostname === 'fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Tudo mais (app shell, dados, imagens): cache first
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithTimeout(request, timeout) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || fetchPromise;
}

// Notificar clientes sobre nova versão disponível
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
