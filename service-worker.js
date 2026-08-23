const CACHE_NAME = 'planejador-academico-v1';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './disciplinas.js',
  './storage.js',
  './academic.js',
  './utils.js',
  './theme.js',
  './clipboard.js',
  './dashboard.js',
  './modals.js',
  './search.js',
  './planner.js',
  './render.js',
  './pdf.js',
  './events.js',
  './app.js'
];

const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        [...APP_SHELL, ...EXTERNAL_ASSETS].map(url =>
          cache.add(url).catch(error => console.warn('Falha ao pré-cachear', url, error))
        )
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        const url = new URL(event.request.url);
        const allowed =
          url.origin === self.location.origin ||
          ['fonts.googleapis.com','fonts.gstatic.com','cdn.tailwindcss.com','cdnjs.cloudflare.com'].includes(url.hostname);

        if (allowed && response.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone())).catch(() => {});
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
