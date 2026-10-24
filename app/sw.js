/**
 * Guarda o app no celular para abrir sem internet (manual, seção 04).
 * Só ouvir a fala precisa de rede. Troque a versão do cache a cada publicação.
 */

const CACHE = 'palavra-v3';
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
  'icones.js',
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

const FONTES = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const origem = new URL(e.request.url).origin;

  // fontes do Google: guarda na primeira vez para funcionar sem internet
  if (FONTES.includes(origem)) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const salvo = await c.match(e.request);
      if (salvo) return salvo;
      const resposta = await fetch(e.request);
      if (resposta.ok || resposta.type === 'opaque') c.put(e.request, resposta.clone());
      return resposta;
    }));
    return;
  }

  if (origem !== location.origin) return;
  e.respondWith(caches.match(e.request).then((salvo) => salvo || fetch(e.request)));
});
