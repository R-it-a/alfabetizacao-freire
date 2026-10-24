/**
 * O app: uma sessão por palavra geradora, seguindo 03-fluxo-da-sessao.html.
 *
 *   motivação (1ª vez) → abertura → pergunta → conversa → palavra geradora
 *   → palavra lida e repetida → famílias → ficha: ler → ficha: criar
 *   → teclado de sílabas → caderno → fechamento
 */

import { silabar, fichaDescoberta } from '../codigo/silabador.js';
import { CONFIG } from './config.js';
import {
  falar, gravar, pararDeFalar, reconhecimentoDisponivel,
  vozesDisponiveis, escolherVoz, vozAtual
} from './voz.js';
import { Lexico } from './lexico.js';
import { icone, MASCOTE } from './icones.js';
import { ilustracao, ILUSTRACOES } from './ilustracoes.js';
import { tocar, silenciar } from './som.js';
import { carregar, salvar, apagar, hoje, contarDia } from './estado.js';
import { interpretar, perguntaDoDia, perguntaDeDebate } from './cerebro.js';
import {
  compactar, conferirFala, conferirFamilia, conferirEscrita,
  silabasDoTeclado, registrarPalavraGeradora, RESERVA
} from './metodo.js';

const $tela = document.getElementById('tela');
const $legenda = document.getElementById('legenda');
const $repetir = document.getElementById('repetir');
const $fechar = document.getElementById('fechar');
const $barra = document.getElementById('barra');
const $mascote = document.getElementById('mascote');
const $aviso = document.getElementById('aviso');
const $confete = document.getElementById('confete');

let lexico = null;
let estado = carregar();
let ultimaFala = '';

// ================================================================ utilidades

const ELOGIOS = ['Isso!', 'Muito bem!', 'Isso mesmo!', 'Boa!'];
let elogioAtual = 0;
const elogio = () => ELOGIOS[elogioAtual++ % ELOGIOS.length];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

$mascote.innerHTML = MASCOTE;

/** O humor do Tijolinho: normal, falando, feliz, comemora ou pensando. */
function humor(nome = '') {
  $mascote.className = `mascote ${nome}`;
}

/** Fala e mostra o texto no balão do mascote. */
async function dizer(texto, opcoes) {
  ultimaFala = texto;
  if ($legenda.textContent !== texto) {
    $legenda.textContent = texto;
    const balao = $legenda.parentElement;
    balao.classList.remove('pulo');
    void balao.offsetWidth; // reinicia a animação
    balao.classList.add('pulo');
  }
  const antes = $mascote.className;
  if (!/feliz|comemora/.test(antes)) humor('falando');
  await falar(texto, opcoes);
  if (!/feliz|comemora/.test(antes)) humor('');
}

$repetir.innerHTML = icone('falar');
$repetir.addEventListener('click', () => falar(ultimaFala));
$fechar.innerHTML = icone('fechar');
$fechar.addEventListener('click', () => {
  pararDeFalar();
  location.reload(); // o progresso já está salvo; volta para a trilha
});

/** A barra de progresso no topo mostra quanto da lição já foi. */
const ETAPAS = ['conversa', 'palavra', 'familias', 'ficha', 'criar', 'teclado', 'caderno'];
function etapa(nome) {
  const i = ETAPAS.indexOf(nome);
  const pct = nome === 'fim' ? 100 : i < 0 ? 0 : Math.round((i / ETAPAS.length) * 100);
  $barra.style.width = `${Math.max(pct, 4)}%`;
  $barra.parentElement.setAttribute('aria-valuenow', String(pct));
}

const modoCasa = (sim) => document.body.classList.toggle('em-casa', sim);

/**
 * O aviso que sobe da parte de baixo da tela: verde quando acerta, laranja
 * quando falta pouco. Nunca vermelho, e nunca "errado" (fluxo da sessão, seção 03).
 */
async function avisar(tipo, texto) {
  tocar(tipo === 'certo' ? 'certo' : 'quase');
  navigator.vibrate?.(tipo === 'certo' ? 40 : [30, 60, 30]);
  $aviso.className = `aviso-baixo ${tipo}`;
  $aviso.innerHTML = `<span class="aviso-icone">${icone(tipo === 'certo' ? 'certo' : 'ideia')}</span><strong>${esc(texto)}</strong>`;
  $aviso.hidden = false;
  requestAnimationFrame(() => $aviso.classList.add('visivel'));
  humor(tipo === 'certo' ? 'feliz' : 'pensando');
  await dizer(texto);
  await espera(250);
  $aviso.classList.remove('visivel');
  await espera(200);
  $aviso.hidden = true;
  humor('');
}

/** Chuva de confete para fechar a lição. */
function confete() {
  const cores = ['#FFC233', '#2F6FEB', '#43B05C', '#E8693B', '#F28C28'];
  $confete.innerHTML = Array.from({ length: 40 }, (_, i) =>
    `<i style="left:${Math.random() * 100}%;background:${cores[i % cores.length]};animation-delay:${Math.random() * 0.6}s;--giro:${Math.random() * 720 - 360}deg"></i>`
  ).join('');
  setTimeout(() => { $confete.innerHTML = ''; }, 3500);
}

/**
 * Troca a tela. Cada tela é um elemento novo, então os ouvintes de toque da
 * tela anterior somem junto com ela.
 */
function mostrar(html, classe = '') {
  $tela.className = `tela ${classe}`;
  const conteudo = document.createElement('div');
  conteudo.className = 'conteudo entrando';
  conteudo.innerHTML = html;
  // cada sílaba, botão e nó da trilha entra um pouco depois do anterior
  conteudo.querySelectorAll('.sil, .btn, .no, .cena-ilustrada, .placa, .lista-caderno li')
    .forEach((el, i) => el.style.setProperty('--i', String(Math.min(i, 18))));
  $tela.replaceChildren(conteudo);
  window.scrollTo(0, 0);
  return conteudo;
}

/** Resolve com o data-acao do primeiro botão tocado. */
function esperarToque(...elementos) {
  return new Promise((resolve) => {
    const tocar = (e) => {
      elementos.forEach((el) => el.removeEventListener('click', tocar));
      resolve(e.currentTarget.dataset.acao);
    };
    elementos.forEach((el) => el.addEventListener('click', tocar));
  });
}

const silabasHtml = (silabas) =>
  `<div class="palavra">${silabas.map((s, i) => `<span class="sil" data-i="${i}">${esc(s)}</span>`).join('')}</div>`;

/** Acende cada sílaba enquanto a voz lê, e depois lê a palavra inteira. */
async function lerAcendendo(raiz, silabas, palavra, velocidade) {
  const spans = raiz.querySelectorAll('.palavra .sil');
  for (let i = 0; i < silabas.length; i += 1) {
    spans.forEach((s) => s.classList.remove('acesa'));
    spans[i]?.classList.add('acesa');
    await dizer(silabas[i], { velocidade });
  }
  spans.forEach((s) => s.classList.add('acesa'));
  if (palavra) await dizer(palavra, { velocidade });
  await espera(200);
  spans.forEach((s) => s.classList.remove('acesa'));
}

// ================================================================ ouvir a pessoa

/**
 * Segurar para falar, como o áudio do WhatsApp: a pessoa segura o botão o tempo
 * que precisar e solta para enviar. Arrastar para a esquerda joga na lixeira.
 *
 * @returns {Promise<{alternativas?: object[], erro?: string|null, cancelado?: true, curto?: true}>}
 */
function segurarParaFalar(area) {
  const LIMITE_MS = 60000;   // um minuto por fala
  const ARRASTE_LIXO = 80;   // pixels para a esquerda

  area.innerHTML = `
    <div class="gravador">
      <span class="lixeira" aria-hidden="true">${icone('lixeira')}</span>
      <button class="mic" aria-label="Segure para falar">${icone('microfone')}</button>
    </div>
    <p class="mic-dica">Segure o botão enquanto fala</p>`;
  const $gravador = area.querySelector('.gravador');
  const $mic = area.querySelector('.mic');
  const $dica = area.querySelector('.mic-dica');

  return new Promise((resolve) => {
    let gravacao = null;
    let x0 = 0;
    let inicio = 0;
    let cancelando = false;
    let relogio = null;

    $mic.addEventListener('contextmenu', (e) => e.preventDefault());

    $mic.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (gravacao) return;
      try { $mic.setPointerCapture(e.pointerId); } catch { /* navegador antigo */ }
      pararDeFalar();
      silenciar(); // som ligado atrapalha o microfone no Android
      navigator.vibrate?.(30);
      x0 = e.clientX;
      inicio = Date.now();
      cancelando = false;
      gravacao = gravar();
      $gravador.classList.add('gravando');
      $dica.innerHTML = '<span class="tempo">0:00</span> · <span class="aviso-lixo">← arraste para apagar</span>';
      relogio = setInterval(() => {
        const s = Math.floor((Date.now() - inicio) / 1000);
        const $tempo = $dica.querySelector('.tempo');
        if ($tempo) $tempo.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        if (Date.now() - inicio > LIMITE_MS) soltar();
      }, 250);
    });

    $mic.addEventListener('pointermove', (e) => {
      if (!gravacao) return;
      const dx = Math.min(0, e.clientX - x0);
      $mic.style.transform = `translateX(${Math.max(dx, -ARRASTE_LIXO - 15)}px)`;
      const antes = cancelando;
      cancelando = dx < -ARRASTE_LIXO;
      $gravador.classList.toggle('cancelando', cancelando);
      if (cancelando !== antes) {
        const $aviso = $dica.querySelector('.aviso-lixo');
        if ($aviso) $aviso.textContent = cancelando ? 'solte para apagar' : '← arraste para apagar';
      }
    });

    async function soltar() {
      if (!gravacao) return;
      clearInterval(relogio);
      const g = gravacao;
      gravacao = null;
      $mic.style.transform = '';
      $gravador.classList.remove('gravando', 'cancelando');

      if (cancelando) {
        g.cancelar();
        navigator.vibrate?.([20, 40, 20]);
        resolve({ cancelado: true });
        return;
      }
      if (Date.now() - inicio < 500) {
        g.cancelar();
        resolve({ curto: true });
        return;
      }
      $dica.textContent = 'Entendendo…';
      resolve(await g.parar());
    }

    $mic.addEventListener('pointerup', soltar);
    $mic.addEventListener('pointercancel', () => { cancelando = true; soltar(); });
  });
}

/**
 * Mostra o microfone, ouve e devolve as alternativas do reconhecimento.
 * Sem reconhecimento (Firefox, iPhone antigo) mostra um campo de texto, para testar.
 */
async function ouvirPessoa(raiz) {
  const area = raiz.querySelector('.mic-area');
  let falhas = 0;

  while (falhas < 3) {
    if (!reconhecimentoDisponivel()) {
      area.innerHTML = `
        <form class="digitar">
          <input name="fala" autocomplete="off" aria-label="O que você falaria">
          <button class="btn">Enviar</button>
        </form>
        <p class="aviso">Este navegador não consegue ouvir. Escreva o que falaria.</p>`;
      const form = area.querySelector('form');
      form.querySelector('input').focus();
      const texto = await new Promise((resolve) =>
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          resolve(form.fala.value);
        }, { once: true }));
      area.innerHTML = '';
      if (texto.trim()) return [{ texto, conf: 1 }];
      falhas += 1;
      continue;
    }

    const r = await segurarParaFalar(area);

    if (r.cancelado) {
      await dizer('Apaguei. Pode falar de novo.');
      continue; // jogar fora não conta como tentativa
    }
    if (r.curto) {
      await dizer('Segura o botão apertado enquanto fala, e solta quando terminar.');
      continue;
    }

    area.innerHTML = '';
    if (r.alternativas.length) return r.alternativas;

    falhas += 1;
    if (r.erro) console.warn('Reconhecimento de voz:', r.erro);
    if (r.erro === 'not-allowed' || r.erro === 'service-not-allowed') {
      await dizer('Preciso que você deixe o aplicativo usar o microfone.');
    } else if (r.erro === 'network') {
      await dizer('Estou sem internet para ouvir. Vamos tentar de novo.');
    } else {
      await dizer('Não ouvi. Segura o botão e fala de novo.');
    }
  }
  return [];
}

// ================================================================ repetir e corrigir

/**
 * A pessoa repete a palavra e o app confere (fluxo da sessão, seção 03):
 * aceita sotaque, corrige modelando devagar, duas tentativas e segue.
 */
async function praticarLeitura(raiz, silabas, palavra) {
  const spans = raiz.querySelectorAll('.palavra .sil');

  for (let tentativa = 1; tentativa <= CONFIG.tentativas; tentativa += 1) {
    await dizer(tentativa === 1 ? `Agora fala você: ${palavra}` : `De novo: ${palavra}`);
    const alternativas = await ouvirPessoa(raiz);
    const r = conferirFala(alternativas, silabas);

    if (r.ok) {
      spans.forEach((s) => s.classList.add('certa'));
      await avisar('certo', elogio());
      spans.forEach((s) => s.classList.remove('certa'));
      return true;
    }

    r.erradas.forEach((i) => spans[i]?.classList.add('atencao'));
    await avisar('quase', 'Quase! Vamos devagar.');
    await lerAcendendo(raiz, silabas, palavra, CONFIG.velocidadeModelo);
    spans.forEach((s) => s.classList.remove('atencao'));
  }

  await avisar('quase', 'Tudo bem, a gente volta nela na próxima vez.');
  if (!estado.revisar.includes(palavra)) estado.revisar.push(palavra);
  salvar(estado);
  return false;
}

// ================================================================ etapas

async function motivacao() {
  modoCasa(false);
  etapa('');
  const raiz = mostrar(`
    ${ilustracao('cultura')}
    <div class="mic-area"></div>`);
  await dizer('Antes de começar a ler, quero conversar um pouco com você.');
  await dizer('Pensa em alguém fazendo um bolo, costurando uma roupa ou plantando uma roça. ' +
    'Tudo isso que a gente faz com as mãos e com a cabeça tem um nome: cultura.');
  await dizer('Me conta: o que você sabe fazer bem?');
  await ouvirPessoa(raiz);
  humor('feliz');
  await dizer('Isso é cultura. Você já sabe muita coisa. ' +
    'Agora a gente vai aprender a escrever o que você já sabe falar.');
  estado.motivacao_feita = true;
  salvar(estado);
}

async function abertura() {
  const daUltima = estado.pastinha
    .filter((p) => p.real && p.data === estado.ultimaSessao)
    .map((p) => p.palavra);
  const paraLer = [...new Set([...estado.revisar, ...daUltima])].slice(0, 3);
  if (!paraLer.length) return;

  mostrar(ilustracao('aceno'));
  await dizer('Que bom te ver de novo! Vamos ler as palavras da última vez.');

  for (const palavra of paraLer) {
    const silabas = silabar(palavra);
    const raiz = mostrar(`${silabasHtml(silabas)}<div class="mic-area"></div>`, 'foco');
    await dizer('Lê pra mim essa palavra.');
    const alternativas = await ouvirPessoa(raiz);
    if (conferirFala(alternativas, silabas).ok) {
      await avisar('certo', `${elogio()} ${palavra}.`);
      estado.revisar = estado.revisar.filter((p) => p !== palavra);
    } else {
      await praticarLeitura(raiz, silabas, palavra);
    }
  }
  await dizer('Você escreveu essas palavras no caderno também? Depois lê pra alguém de casa.');
  salvar(estado);
}

/** Pergunta, ouve e escolhe a palavra geradora com a pessoa. */
async function encontrarPalavra() {
  etapa('conversa');
  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const pergunta = perguntaDoDia(estado, tentativa);
    const cenaPergunta = /comeu|cozinha|feira|prato|cozinhar/.test(pergunta) ? 'comida' : 'conversa';
    const raiz = mostrar(`${ilustracao(cenaPergunta)}<div class="mic-area"></div>`);
    await dizer(tentativa === 0 ? perguntaDoDia(estado, 0) : `E ${perguntaDoDia(estado, tentativa).toLowerCase()}`);
    const alternativas = await ouvirPessoa(raiz);
    const { candidatas, debate } = await interpretar(alternativas, estado, lexico);

    for (const candidata of candidatas.slice(0, 2)) {
      const palavra = candidata.palavra;
      const conf = mostrar(`
        ${ilustracao('ouvido')}
        <div class="botoes">
          <button class="btn sim" data-acao="sim" aria-label="Sim">${icone('certo')}</button>
          <button class="btn nao" data-acao="nao" aria-label="Não">${icone('errado')}</button>
        </div>`);
      await dizer(`Ouvi ${palavra}. Vamos aprender essa palavra?`);
      const resposta = await esperarToque(...conf.querySelectorAll('.botoes .btn'));
      if (resposta === 'sim') return { palavra, debate };
    }
    if (tentativa < 2) await dizer('Vamos conversar mais um pouco.');
  }

  const reserva = (RESERVA[estado.estagio] || RESERVA[1]).find((p) => !estado.palavras.includes(p)) || 'sapato';
  await dizer(`Hoje vamos trabalhar com uma palavra que eu trouxe: ${reserva}.`);
  return { palavra: reserva, debate: null };
}

async function conversa(palavra, debate) {
  const raiz = mostrar(`${ilustracao('conversa')}<div class="mic-area"></div>`);
  await dizer(debate || perguntaDeDebate(palavra));
  await ouvirPessoa(raiz);
  await dizer('Obrigada por me contar.');
}

async function palavraGeradora(palavra) {
  etapa('palavra');
  const silabas = silabar(palavra);
  const raiz = mostrar(`${silabasHtml(silabas)}<div class="mic-area"></div>`, 'foco');
  await dizer(`Essa é a palavra ${palavra}.`);
  await espera(400);
  await dizer('Ela tem pedaços. Cada pedaço é um movimento da boca.');
  await lerAcendendo(raiz, silabas, palavra);
  await praticarLeitura(raiz, silabas, palavra);
}

async function familias(palavra) {
  etapa('familias');
  const ficha = fichaDescoberta(palavra);

  for (const [n, f] of ficha.familias.entries()) {
    const raiz = mostrar(`
      ${silabasHtml(ficha.silabas)}
      <div class="familia">${f.linha.map((s) => `<span class="sil">${esc(s)}</span>`).join('')}</div>
      <div class="mic-area"></div>`, 'foco');
    raiz.querySelectorAll('.palavra .sil').forEach((s) => {
      if (s.textContent === f.silaba) s.classList.add('acesa');
    });

    await dizer(n === 0 ? `Do pedaço ${f.silaba} nasce uma família.` : `Agora a família do ${f.silaba}.`);
    const cels = raiz.querySelectorAll('.familia .sil');
    for (let i = 0; i < f.linha.length; i += 1) {
      cels.forEach((c) => c.classList.remove('acesa'));
      cels[i].classList.add('acesa');
      await dizer(f.linha[i]);
    }
    cels.forEach((c) => c.classList.remove('acesa'));
    if (n === 0) await dizer('Olha: o começo é igual. Só muda o final.');

    await dizer(`Fala comigo: ${f.linha.join(', ')}.`);
    const alternativas = await ouvirPessoa(raiz);
    if (conferirFamilia(alternativas, f.linha)) {
      await avisar('certo', elogio());
    } else {
      await avisar('quase', 'Quase! Vamos devagar.');
      for (const s of f.linha) await dizer(s, { velocidade: CONFIG.velocidadeModelo });
    }
  }
}

function gradeHtml(ficha, tocavel) {
  const tag = tocavel ? 'button' : 'span';
  return `<div class="ficha" style="--colunas:5">${ficha.grade
    .map((linha, l) => linha
      .map((s, c) => `<${tag} class="sil cel" data-l="${l}" data-c="${c}" data-s="${esc(s)}">${esc(s)}</${tag}>`)
      .join(''))
    .join('')}</div>`;
}

async function fichaLer(palavra) {
  etapa('ficha');
  const ficha = fichaDescoberta(palavra);
  const raiz = mostrar(`${gradeHtml(ficha, false)}<div class="vogais"></div>`, 'foco');
  const cel = (l, c) => raiz.querySelector(`.cel[data-l="${l}"][data-c="${c}"]`);
  const apagarTudo = () => raiz.querySelectorAll('.cel').forEach((e) => e.classList.remove('acesa'));

  await dizer('Essa é a ficha da descoberta. Vamos ler juntos, de lado.');
  for (let l = 0; l < ficha.grade.length; l += 1) {
    for (let c = 0; c < 5; c += 1) {
      apagarTudo();
      cel(l, c).classList.add('acesa');
      await dizer(ficha.grade[l][c]);
    }
  }
  apagarTudo();
  await dizer('Agora de cima pra baixo.');
  for (let c = 0; c < 5; c += 1) {
    for (let l = 0; l < ficha.grade.length; l += 1) {
      apagarTudo();
      cel(l, c).classList.add('acesa');
      await dizer(ficha.grade[l][c]);
    }
  }
  apagarTudo();

  raiz.querySelector('.vogais').innerHTML = 'aeiou'.split('').map((v) => `<span class="sil">${v}</span>`).join('');
  await dizer('E essas são as vogais: a, e, i, o, u. É o que muda em cada família.');
}

/** O momento em que a pessoa para de repetir e começa a criar. */
async function fichaCriar(palavra) {
  etapa('criar');
  const ficha = fichaDescoberta(palavra);
  const criadas = [];
  const raiz = mostrar(`
    ${gradeHtml(ficha, true)}
    <div class="montagem" aria-live="polite"></div>
    <div class="botoes">
      <button class="btn" data-acao="ler" aria-label="Ler o que formei">${icone('falar')}</button>
      <button class="btn" data-acao="apagar" aria-label="Apagar">${icone('apagar')}</button>
      <button class="btn sim" data-acao="guardar" aria-label="Guardar palavra">${icone('certo')}</button>
      <button class="btn" data-acao="ajuda" aria-label="Ajuda">${icone('ideia')}</button>
    </div>
    <div class="criadas"></div>
    <button class="btn largo principal" data-acao="terminei" hidden>Terminei</button>`, 'foco');

  const $montagem = raiz.querySelector('.montagem');
  const $criadas = raiz.querySelector('.criadas');
  const $terminei = raiz.querySelector('[data-acao="terminei"]');
  let montagem = [];
  const atualizar = () => {
    $montagem.innerHTML = montagem.map((s) => `<span class="sil">${esc(s)}</span>`).join('');
  };

  const sugestoes = lexico.possiveis(palavra)
    .filter((p) => silabar(compactar(p)).length >= 2 && compactar(p) !== compactar(palavra) && lexico.comum(p));

  await dizer('Agora é com você. Toca nas sílabas e forma palavras novas. Pode juntar do jeito que quiser.');

  await new Promise((resolve) => {
    raiz.addEventListener('click', async (e) => {
      const alvo = e.target.closest('button');
      if (!alvo) return;

      if (alvo.classList.contains('cel')) {
        montagem.push(alvo.dataset.s);
        atualizar();
        tocar('toque');
        falar(alvo.dataset.s);
        return;
      }

      switch (alvo.dataset.acao) {
        case 'ler':
          if (montagem.length) await dizer(montagem.join(''));
          break;
        case 'apagar':
          montagem.pop();
          atualizar();
          break;
        case 'ajuda': {
          const ideia = sugestoes.find((p) => !criadas.some((c) => compactar(c.palavra) === compactar(p)));
          if (ideia) {
            const sil = silabar(compactar(ideia));
            await dizer(`Tenta juntar ${sil.join(' com ')}.`);
          }
          break;
        }
        case 'guardar': {
          if (!montagem.length) break;
          const forma = montagem.join('');
          const real = lexico.real(forma);
          const item = { palavra: real || forma, real: Boolean(real), data: hoje(), geradora: palavra };
          criadas.push(item);
          estado.pastinha.push(item);
          salvar(estado);
          montagem = [];
          atualizar();
          $criadas.insertAdjacentHTML('beforeend', `<span class="chip">${esc(item.palavra)}</span>`);
          $terminei.hidden = false;
          await avisar('certo', `${elogio()} ${item.palavra}.`);
          if (!item.real && estado.sessoes >= 3) {
            await dizer('Essa palavra a gente inventou agora. As outras, a gente usa todo dia.');
            estado.explicou_palavras_mortas = true;
          }
          break;
        }
        case 'terminei':
          resolve();
          break;
        default:
      }
    });
  });

  return criadas;
}

/** Ditado curto com o teclado de sílabas (fluxo da sessão, seção 05). */
async function teclado(palavra, criadas) {
  etapa('teclado');
  const reais = criadas.filter((c) => c.real && silabar(compactar(c.palavra)).length >= 2).map((c) => c.palavra);
  const extra = lexico.possiveis(palavra).filter((p) => lexico.comum(p) && silabar(compactar(p)).length >= 2);
  const alvos = [...new Set([palavra, ...reais, ...extra])]
    .filter((p, i, todos) => todos.findIndex((q) => compactar(q) === compactar(p)) === i)
    .slice(0, 2);

  const linhas = silabasDoTeclado([...estado.palavras, palavra]);

  for (const alvo of alvos) {
    const silabasAlvo = silabar(compactar(alvo));
    const raiz = mostrar(`
      <div class="escrita" aria-live="polite"></div>
      <div class="teclado">${linhas.map((linha) =>
        `<div class="linha">${linha.map((s) => `<button class="sil tecla" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>`
      ).join('')}</div>
      <div class="botoes">
        <button class="btn" data-acao="ouvir" aria-label="Ouvir a palavra">${icone('falar')}</button>
        <button class="btn" data-acao="apagar" aria-label="Apagar">${icone('apagar')}</button>
        <button class="btn sim" data-acao="pronto" aria-label="Pronto">${icone('certo')}</button>
      </div>`, 'foco');

    const $escrita = raiz.querySelector('.escrita');
    let digitadas = [];
    const atualizar = (erradas = []) => {
      $escrita.innerHTML = digitadas.map((s, i) =>
        `<span class="sil ${erradas.includes(i) ? 'atencao' : ''}">${esc(s)}</span>`).join('') || '<span class="vazio">…</span>';
    };
    atualizar();

    await dizer(`Escreve no teclado: ${alvo}.`);
    let tentativa = 1;

    const acertou = await new Promise((resolve) => {
      raiz.addEventListener('click', async (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.classList.contains('tecla')) {
          digitadas.push(b.dataset.s);
          atualizar();
          tocar('toque');
          falar(b.dataset.s);
          return;
        }
        if (b.dataset.acao === 'apagar') { digitadas.pop(); atualizar(); return; }
        if (b.dataset.acao === 'ouvir') { await dizer(alvo); return; }
        if (b.dataset.acao !== 'pronto' || !digitadas.length) return;

        const r = conferirEscrita(digitadas, silabasAlvo);
        if (r.ok) {
          $escrita.classList.add('certa');
          await avisar('certo', `${elogio()} Você escreveu ${alvo}.`);
          resolve(true);
          return;
        }
        atualizar(r.erradas);
        if (tentativa >= CONFIG.tentativas) {
          digitadas = [...silabasAlvo];
          atualizar();
          await dizer(`Olha como se escreve ${alvo}: ${silabasAlvo.join(', ')}. A gente treina mais na próxima vez.`);
          resolve(false);
          return;
        }
        tentativa += 1;
        await avisar('quase', `Quase! ${alvo} é assim:`);
        for (const s of silabasAlvo) await dizer(s, { velocidade: CONFIG.velocidadeModelo });
        await dizer('Tenta de novo.');
        digitadas = [];
        atualizar();
      });
    });

    if (!acertou && !estado.revisar.includes(alvo)) estado.revisar.push(alvo);
    salvar(estado);
  }
}

async function caderno(palavra, criadas) {
  etapa('caderno');
  const doDia = [...new Set([palavra, ...criadas.filter((c) => c.real).map((c) => c.palavra)])].slice(0, 4);
  const raiz = mostrar(`
    ${ilustracao('caderno')}
    <ul class="lista-caderno">${doDia.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    <button class="btn largo principal" data-acao="terminei">Terminei</button>`);
  await dizer('Agora pega o seu caderno e um lápis. Escreve essas palavras, uma embaixo da outra.');
  await dizer('Quando terminar, toca no botão.');
  await esperarToque(raiz.querySelector('[data-acao="terminei"]'));
  await dizer('Muito bem. Da próxima vez você lê pra mim o que escreveu.');
}

async function fechamento(novas) {
  etapa('fim');
  const total = estado.pastinha.filter((p) => p.real).length;
  const raiz = mostrar(`
    ${ilustracao('trofeu')}
    <h2 class="titulo-fim">Lição concluída!</h2>
    <div class="placar">
      <div class="placa ouro"><span>Palavras novas</span><strong>${icone('estrela')}${novas}</strong></div>
      <div class="placa laranja"><span>Dias seguidos</span><strong>${icone('fogo')}${estado.diasSeguidos}</strong></div>
      <div class="placa azul"><span>Na pastinha</span><strong>${icone('pasta')}${total}</strong></div>
    </div>
    <button class="btn largo principal" data-acao="inicio">Continuar</button>`, 'fim');
  humor('comemora');
  tocar('fim');
  confete();
  await dizer(`Você já tem ${total} ${total === 1 ? 'palavra' : 'palavras'} na sua pastinha. ` +
    'Em casa, tenta formar mais palavras com as sílabas de hoje. Até a próxima!');
  await esperarToque(raiz.querySelector('[data-acao="inicio"]'));
  humor('');
}

// ================================================================ sessão

async function sessao() {
  modoCasa(false);
  etapa('');
  if (!estado.motivacao_feita) await motivacao();
  if (estado.sessoes > 0) await abertura();

  const { palavra, debate } = await encontrarPalavra();
  await conversa(palavra, debate);
  await palavraGeradora(palavra);
  await familias(palavra);
  await fichaLer(palavra);
  const criadas = await fichaCriar(palavra);
  await teclado(palavra, criadas);
  await caderno(palavra, criadas);

  registrarPalavraGeradora(estado, palavra);
  estado.sessoes += 1;
  contarDia(estado);
  estado.ultimaSessao = hoje();
  salvar(estado);

  await fechamento(criadas.filter((c) => c.real).length);
}

function pastinha() {
  const reais = estado.pastinha.filter((p) => p.real);
  const raiz = mostrar(`
    <h2>Minha pastinha</h2>
    <div class="criadas">${reais.map((p) => `<button class="chip" data-p="${esc(p.palavra)}">${esc(p.palavra)}</button>`).join('') || '<p>Ainda vazia.</p>'}</div>
    <button class="btn largo" data-acao="voltar">Voltar</button>`);
  raiz.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => dizer(c.dataset.p)));
  dizer(reais.length ? 'Essas são as suas palavras. Toca numa para ouvir.' : 'A sua pastinha ainda está vazia.');
  return esperarToque(raiz.querySelector('[data-acao="voltar"]'));
}

async function telaVoz() {
  const vozes = vozesDisponiveis().slice(0, 8);
  const raiz = mostrar(`
    <h2>Escolha a voz</h2>
    <p class="aviso">Toque para ouvir. A voz tocada por último fica escolhida.</p>
    <div class="vozes">${vozes.map((v, i) => `
      <button class="btn largo voz ${v.name === vozAtual() ? 'sim' : ''}" data-i="${i}">
        ${esc(v.name)}
      </button>`).join('') || '<p>Nenhuma voz em português neste aparelho.</p>'}</div>
    <button class="btn largo" data-acao="voltar">Voltar</button>`);

  raiz.querySelectorAll('.voz').forEach((b) => b.addEventListener('click', async () => {
    const voz = vozes[Number(b.dataset.i)];
    escolherVoz(voz.name);
    raiz.querySelectorAll('.voz').forEach((x) => {
      const escolhida = x === b;
      x.classList.toggle('sim', escolhida);

    });
    await dizer('Olá! Vamos aprender a ler e escrever juntos?');
  }));
  return esperarToque(raiz.querySelector('[data-acao="voltar"]'));
}

/** A trilha de lições: cultura, as palavras já trabalhadas, a próxima e as que vêm. */
function trilhaHtml() {
  const nos = [];
  if (estado.motivacao_feita) {
    nos.push(`<li class="no feito">
      <button class="bolha" data-acao="cultura" aria-label="Rever a conversa sobre cultura">${icone('maos')}</button>
      <span class="rotulo">cultura</span></li>`);
  } else {
    // na primeira vez, a lição começa pela conversa sobre cultura
    nos.push(`<li class="no atual">
      <span class="comece">Começar</span>
      <button class="bolha comecar" data-acao="comecar" aria-label="Começar">${icone('maos')}</button>
      <span class="rotulo">cultura</span></li>`);
  }
  estado.palavras.forEach((p) => nos.push(`<li class="no feito">
      <button class="bolha" data-p="${esc(p)}" aria-label="Ouvir ${esc(p)}">${icone('certo')}</button>
      <span class="rotulo">${esc(p)}</span></li>`));
  if (estado.motivacao_feita) {
    nos.push(`<li class="no atual">
      <span class="comece">Começar</span>
      <button class="bolha comecar" data-acao="comecar" aria-label="Começar a próxima lição">${icone('estrela')}</button></li>`);
  }
  for (let i = 0; i < 3; i += 1) {
    nos.push(`<li class="no trancado"><span class="bolha">${icone('cadeado')}</span></li>`);
  }
  return `<ol class="trilha-licoes">${nos.join('')}</ol>`;
}

async function inicio() {
  for (;;) {
    modoCasa(true);
    humor('');
    const total = estado.pastinha.filter((p) => p.real).length;
    const raiz = mostrar(`
      <div class="painel">
        <span class="marca">Palavra</span>
        <span class="contador laranja" title="Dias seguidos">${icone('fogo')}${estado.diasSeguidos || 0}</span>
        <button class="contador azul" data-acao="pastinha" aria-label="Minha pastinha">${icone('pasta')}${total}</button>
        <button class="contador" data-acao="voz" aria-label="Escolher voz">${icone('falar')}</button>
      </div>
      <div class="unidade">
        <div><strong>Estágio ${estado.estagio}</strong><span>Palavras do dia a dia</span></div>
        ${ILUSTRACOES.parede}
      </div>
      ${trilhaHtml()}
      <button class="link" data-acao="zerar">Apagar meu progresso</button>`, 'inicio');
    $legenda.textContent = '';
    raiz.querySelector('.comecar')?.scrollIntoView({ block: 'center' });
    raiz.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => dizer(b.dataset.p)));

    const acao = await esperarToque(...raiz.querySelectorAll('[data-acao]'));

    if (acao === 'pastinha') { modoCasa(false); await pastinha(); continue; }
    if (acao === 'voz') { modoCasa(false); await telaVoz(); continue; }
    if (acao === 'cultura') { await motivacao(); continue; }
    if (acao === 'zerar') {
      const b = mostrar(`<p class="grande">Apagar todo o progresso?</p>
        <div class="botoes"><button class="btn nao" data-acao="sim">Apagar</button>
        <button class="btn" data-acao="nao">Cancelar</button></div>`);
      if (await esperarToque(...b.querySelectorAll('.btn')) === 'sim') { apagar(); estado = carregar(); }
      continue;
    }

    if (!lexico) {
      mostrar('<p class="grande">Carregando…</p>');
      lexico = await Lexico.carregar();
    }
    await sessao();
  }
}

// ================================================================ partida

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker:', e));
}

Lexico.carregar().then((l) => { lexico = l; }).catch((e) => console.warn(e));

/** Abertura: os tijolos PA LA VRA caem um a um e o Tijolinho aparece. */
const $abertura = document.getElementById('abertura');
if ($abertura) {
  $abertura.querySelector('.abertura-mascote').innerHTML = MASCOTE;
  const sair = () => { $abertura.classList.add('saindo'); setTimeout(() => $abertura.remove(), 400); };
  setTimeout(sair, matchMedia('(prefers-reduced-motion: reduce)').matches ? 300 : 1700);
  $abertura.addEventListener('click', sair, { once: true });
}

inicio().catch((erro) => {
  console.error(erro);
  mostrar(`<p class="grande">Algo deu errado.</p><pre>${esc(erro.stack || erro)}</pre>`);
});
