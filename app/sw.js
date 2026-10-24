/**
 * Guarda o app no celular para abrir sem internet (manual, seção 04).
 * Só ouvir a fala precisa de rede. Troque a versão do cache a cada publicação.
 */

const CACHE = 'palavra-v2';
const ARQUIVOS = [
  './',
  'index.html',
  'estilo.css',
  'app.js',
  'config.js',
  'voz.js',
  'metodo.js',
  'lexico.js',
  'estado.js',
  'cerebro.js',
  'lexico.txt',
  'manifest.json',
  'icones/icone-192.png',
  'icones/icone-512.png',
  '../codigo/silabador.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then((salvo) => salvo || fetch(e.request)));
});
