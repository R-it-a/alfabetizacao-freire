/**
 * Simula duas sessões completas no navegador, com voz falsa.
 *
 *   python -m http.server 8000          (na raiz do repositório)
 *   node app/testes/sessao-simulada.mjs [http://localhost:8000/app/]
 *
 * Precisa do Playwright (npm i -g playwright). Uma "aluna" automática
 * responde às perguntas, repete as palavras, forma palavras na ficha e
 * escreve no teclado. No fim confere o progresso salvo.
 */

import { chromium } from 'playwright';

const URL_APP = process.argv[2] || 'http://localhost:8000/app/';
const PASTA_PRINTS = process.env.PRINTS || '';

const vozFalsa = () => {
  // fala: termina na hora
  window.speechSynthesis.speak = (u) => setTimeout(() => u.onend && u.onend(), 5);
  window.speechSynthesis.cancel = () => {};
  window.speechSynthesis.getVoices = () => [];

  // ouvir: responde conforme a última instrução falada
  const responder = () => {
    const pedido = document.getElementById('legenda').textContent;
    const palavra = [...document.querySelectorAll('.palavra .sil')].map((s) => s.textContent).join('');
    const familia = [...document.querySelectorAll('.familia .sil')].map((s) => s.textContent).join(' ');
    if (/sabe fazer/.test(pedido)) return 'eu sei cozinhar';
    if (/comeu hoje/.test(pedido)) return 'hoje eu comi bolo com café';
    if (/cozinha/.test(pedido)) return 'tem panela e tomate';
    if (/tem a ver/.test(pedido)) return 'eu faço bolo pra vender na feira';
    if (/Fala comigo/.test(pedido)) return familia;
    if (window.__errarUmaVez && /fala você/.test(pedido)) { window.__errarUmaVez = false; return 'bola'; }
    if (palavra) return palavra;
    return 'não sei';
  };
  // reconhecimento contínuo: entrega o texto logo e só termina quando mandam parar
  // imita o Android: com um som (AudioContext) ligado, o microfone não ouve
  const contextos = [];
  const AC = window.AudioContext;
  window.AudioContext = class extends AC {
    constructor(...a) { super(...a); contextos.push(this); }
  };
  window.SpeechRecognition = class {
    start() {
      if (contextos.some((c) => c.state === 'running')) {
        setTimeout(() => { this.onerror?.({ error: 'audio-capture' }); this.onend?.(); }, 5);
        return;
      }
      setTimeout(() => {
        const texto = responder();
        const r = [{ transcript: texto, confidence: 0.9 }];
        r.isFinal = true;
        this.onresult?.({ resultIndex: 0, results: [r] });
      }, 5);
    }
    stop() { setTimeout(() => this.onend?.(), 5); }
    abort() { setTimeout(() => this.onend?.(), 5); }
  };
};

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
const erros = [];
pagina.on('pageerror', (e) => erros.push(String(e)));
// fontes do Google podem faltar sem internet; o app usa as fontes do sistema no lugar
pagina.on('console', (m) => m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|fonts\.g/.test(m.text()) && erros.push(m.text()));
await pagina.addInitScript(vozFalsa);
await pagina.addInitScript(() => { window.__errarUmaVez = true; });
await pagina.goto(URL_APP);

const silabar = (p) => pagina.evaluate(async (w) => (await import('../codigo/silabador.js')).silabar(w), p);
const visivel = async (seletor) => (await pagina.locator(seletor).count()) > 0 && pagina.locator(seletor).first().isVisible();
let prints = 0;
let lixoTestado = false;
const print = async (nome) => {
  if (PASTA_PRINTS) await pagina.waitForTimeout(900);
  if (PASTA_PRINTS) await pagina.screenshot({ path: `${PASTA_PRINTS}/${String(++prints).padStart(2, '0')}-${nome}.png`, fullPage: true });
};

async function umaSessao(numero) {
  await pagina.click('.comecar');
  const vistos = new Set();
  let fichaFeita = false;

  for (let passo = 0; passo < 400; passo += 1) {
    await pagina.waitForTimeout(30);
    const legenda = await pagina.locator('#legenda').textContent();

    if (await visivel('[data-acao="inicio"]')) {
      await print(`s${numero}-fechamento`);
      await pagina.click('[data-acao="inicio"]');
      return;
    }
    if (await visivel('button.mic')) {
      const tela = (legenda || '').slice(0, 25);
      if (!vistos.has(tela)) { vistos.add(tela); await print(`s${numero}-fala`); }
      const caixa = await pagina.locator('button.mic').boundingBox();
      const x = caixa.x + caixa.width / 2;
      const y = caixa.y + caixa.height / 2;
      await pagina.mouse.move(x, y);
      await pagina.mouse.down();
      await pagina.waitForTimeout(650);
      if (!lixoTestado) {
        // arrasta para a esquerda: a gravação vai para a lixeira
        await pagina.mouse.move(x - 140, y, { steps: 6 });
        await pagina.waitForTimeout(250);
        await print(`s${numero}-lixeira`);
        await pagina.mouse.up();
        await pagina.waitForFunction(() => /Apaguei/.test(document.getElementById('legenda').textContent));
        lixoTestado = true;
        continue;
      }
      await pagina.mouse.up();
      continue;
    }
    if (await visivel('.botoes [data-acao="sim"][aria-label="Sim"]')) {
      await print(`s${numero}-confirmar`);
      await pagina.click('.botoes [data-acao="sim"]');
      continue;
    }
    if (!fichaFeita && await visivel('button.cel') && /forma palavras/.test(legenda)) {
      const combinacoes = numero === 1
        ? [['bo', 'la'], ['ba', 'la'], ['bi', 'lu', 'bo']]   // bola, bala e uma inventada
        : [['pa', 'la'], ['pe', 'na'], ['nu', 'pi', 'la']];  // pala, pena e uma inventada
      for (const silabas of combinacoes) {
        for (const s of silabas) {
          const cel = pagina.locator(`button.cel[data-s="${s}"]`);
          if (await cel.count()) await cel.first().click();
        }
        await pagina.click('[data-acao="guardar"]');
        await pagina.waitForTimeout(40);
      }
      await print(`s${numero}-ficha`);
      fichaFeita = true;
      await pagina.click('[data-acao="terminei"]');
      continue;
    }
    if (await visivel('.tecla') && /Escreve no teclado: (.+)\./.test(legenda)) {
      const alvo = legenda.match(/Escreve no teclado: (.+)\./)[1];
      const silabas = await silabar(alvo.normalize('NFD').replace(/[̀-ͯ]/g, ''));
      for (const s of silabas) await pagina.click(`.tecla[data-s="${s}"]`);
      await print(`s${numero}-teclado`);
      await pagina.click('[data-acao="pronto"]');
      await pagina.waitForFunction(() => !/Escreve no teclado/.test(document.getElementById('legenda').textContent));
      continue;
    }
    if (await visivel('.lista-caderno')) {
      await print(`s${numero}-caderno`);
      await pagina.click('[data-acao="terminei"]');
      continue;
    }
  }
  throw new Error(`Sessão ${numero} não terminou. Última fala: ${await pagina.locator('#legenda').textContent()}`);
}

await pagina.waitForSelector(".comecar");
await print('inicio');
await umaSessao(1);
await umaSessao(2);

const estado = await pagina.evaluate(() => JSON.parse(localStorage.getItem('palavra.aluno')));
await navegador.close();

const falhas = [];
if (estado.sessoes !== 2) falhas.push(`sessoes = ${estado.sessoes}`);
if (estado.palavras[0] !== 'bolo') falhas.push(`primeira palavra = ${estado.palavras[0]}`);
if (estado.palavras.length !== 2) falhas.push(`palavras = ${estado.palavras}`);
if (!estado.motivacao_feita) falhas.push('motivação não marcada');
for (const p of ['bola', 'bala', 'pena']) {
  if (!estado.pastinha.some((x) => x.palavra === p && x.real)) falhas.push(`${p} fora da pastinha`);
}
if (!estado.pastinha.some((x) => x.palavra === 'bilubo' && !x.real)) falhas.push('palavra inventada não guardada');
if (!lixoTestado) falhas.push('lixeira não testada');
if (erros.length) falhas.push(`erros no console: ${erros.join(' | ')}`);

console.log(JSON.stringify({ palavras: estado.palavras, estagio: estado.estagio, pastinha: estado.pastinha.map((p) => p.palavra), revisar: estado.revisar }, null, 1));
if (falhas.length) {
  console.error('FALHOU:\n- ' + falhas.join('\n- '));
  process.exit(1);
}
console.log('OK: duas sessões completas.');
