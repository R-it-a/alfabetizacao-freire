/**
 * Guarda o app no celular para abrir sem internet (manual, seção 04).
 * Busca sempre a versão nova quando há internet; a cópia guardada é só para
 * quando não há. Só ouvir a fala precisa de rede.
 */

const CACHE = 'palavra-v4';
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
  'som.js',
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

  // rede primeiro: com internet a pessoa sempre recebe a versão mais nova;
  // sem internet, usa a cópia guardada
  e.respondWith(
    fetch(e.request)
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
        }
        return resposta;
      })
      .catch(() => caches.match(e.request))
  );
});
