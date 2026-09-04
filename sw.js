/* ============================================================
   HNK Trade Intelligence — Service Worker
   Estratégia: cache-first para o app shell (offline-first).
   Ao publicar uma nova versão do conteúdo/código, altere o
   CACHE_VERSION para forçar a atualização do cache local.
   ============================================================ */
const CACHE_VERSION = 'hnk-trade-v20';
const APP_SHELL = [
  './',
  'index.html',
  'viz_data.js',
  'viz_render.js',
  'app.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap'
];

/* Instala e pré-cacheia o app shell */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      cache.addAll(APP_SHELL).catch(() => {
        /* falha de rede em algum recurso externo não bloqueia a instalação */
        return Promise.all(APP_SHELL.map(u => cache.add(u).catch(() => null)));
      })
    ).then(() => self.skipWaiting())
  );
});

/* Ativa e limpa caches antigos */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Cache-first com fallback de rede e cache dinâmico (fontes Google, etc.) */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        /* guarda cópias de mesma origem e das fontes do Google para uso offline */
        const url = new URL(req.url);
        const cacheable = url.origin === location.origin ||
                          url.hostname.includes('fonts.googleapis.com') ||
                          url.hostname.includes('fonts.gstatic.com');
        if (cacheable && res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => {
        /* offline e sem cache: para navegação, devolve o index (SPA) */
        if (req.mode === 'navigate') return caches.match('index.html');
      });
    })
  );
});
