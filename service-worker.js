/* Ruteo Bogotá · service worker
   - Guarda el "cascarón" de la app (HTML, manifest, iconos) para que abra rápido y sin conexión.
   - Guarda también las librerías del mapa (MapLibre) y la tipografía, para que la app arranque offline.
   - NO guarda tiles del mapa, rutas (OSRM), búsquedas ni nada dinámico: eso siempre necesita internet. */
const VERSION = 'ruteo-shell-v7';
const SHELL = ['./', 'index.html', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];
const CDN = ['unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];     // solo librerías estáticas
const NET_MS = 4000;                                                         // con caché disponible, no se espera a una red lenta

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))       // un archivo ausente no rompe la instalación
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x !== VERSION).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});

/* Propios: red primero (siempre la versión nueva). Si hay copia y la red tarda más de NET_MS o falla, se usa la copia. */
async function ownFile(r) {
  const cached = await caches.match(r, { ignoreSearch: true });
  const net = fetch(r).then(x => {
    if (x.ok && x.status === 200) { const k = x.clone(); caches.open(VERSION).then(h => h.put(r, k)).catch(() => {}); }
    return x;
  });
  net.catch(() => {});                                                       // evita "unhandled rejection" si perdió la carrera
  try {
    return await (cached ? Promise.race([net, new Promise((_, j) => setTimeout(j, NET_MS))]) : net);
  } catch (_) {
    if (cached) return cached;
    if (r.mode === 'navigate') return (await caches.match('./')) || (await caches.match('index.html')) || Response.error();
    return Response.error();
  }
}
/* Librerías estáticas: caché primero y se actualiza en segundo plano */
async function staticLib(r) {
  const c = await caches.open(VERSION), m = await c.match(r);
  const net = fetch(r).then(x => { if (x.ok || x.type === 'opaque') c.put(r, x.clone()).catch(() => {}); return x; });
  if (m) { net.catch(() => {}); return m; }
  try { return await net; } catch (_) { return Response.error(); }
}
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) return e.respondWith(ownFile(r));
  if (CDN.includes(u.hostname)) e.respondWith(staticLib(r));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
