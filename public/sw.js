// Service Worker para PWA Offline
const CACHE_NAME = 'mecanica-adrian-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sql-wasm.wasm', // Essencial para sql.js
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando arquivos essenciais');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Alguns arquivos não puderam ser cacheados:', err);
        // Não falhar se algumas assets não estiverem disponíveis ainda
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições (Network First, com fallback para cache)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Se a resposta for OK, cachear
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se network falhar, tentar cache
        return caches.match(request).then((response) => {
          if (response) {
            console.log('[SW] Servindo do cache:', request.url);
            return response;
          }
          
          // Se não tiver em cache e for .wasm, retornar erro específico
          if (request.url.includes('.wasm')) {
            return new Response('WASM não disponível', { status: 404 });
          }
          
          // Para requests de HTML, retornar index.html se disponível
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          
          return new Response('Offline - recurso não disponível', { status: 404 });
        });
      })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker carregado!');
