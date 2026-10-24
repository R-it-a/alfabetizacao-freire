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
import { icone } from './icones.js';
import { carregar, salvar, apagar, hoje } from './estado.js';
import { interpretar, perguntaDoDia, perguntaDeDebate } from './cerebro.js';
import {
  compactar, conferirFala, conferirFamilia, conferirEscrita,
  silabasDoTeclado, registrarPalavraGeradora, RESERVA
} from './metodo.js';

const $tela = document.getElementById('tela');
const $legenda = document.getElementById('legenda');
const $repetir = document.getElementById('repetir');

let lexico = null;
let estado = carregar();
let ultimaFala = '';

// ================================================================ utilidades

const ELOGIOS = ['Isso!', 'Muito bem!', 'Isso mesmo!', 'Boa!'];
let elogioAtual = 0;
const elogio = () => ELOGIOS[elogioAtual++ % ELOGIOS.length];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fala e mostra o texto como legenda. */
async function dizer(texto, opcoes) {
  ultimaFala = texto;
  $legenda.textContent = texto;
  await falar(texto, opcoes);
}

$repetir.innerHTML = `${icone('falar')}<span>Ouvir de novo</span>`;
$repetir.addEventListener('click', () => falar(ultimaFala));

/** A trilha no topo mostra em que parte da sessão a pessoa está. */
const ETAPAS = ['conversa', 'palavra', 'familias', 'ficha', 'criar', 'teclado', 'caderno'];
const $trilha = document.getElementById('trilha');
function etapa(nome) {
  const atual = ETAPAS.indexOf(nome);
  $trilha.innerHTML = atual < 0 ? '' : ETAPAS.map((_, i) =>
    `<li class="${i < atual ? 'feita' : i === atual ? 'atual' : ''}"></li>`).join('');
}

/**
 * Troca a tela. Cada tela é um elemento novo, então os ouvintes de toque da
 * tela anterior somem junto com ela.
 */
function mostrar(html, classe = '') {
  $tela.className = `tela ${classe}`;
  const conteudo = document.createElement('div');
  conteudo.className = 'conteudo';
  conteudo.innerHTML = html;
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
      await dizer(elogio());
      spans.forEach((s) => s.classList.remove('certa'));
      return true;
    }

    r.erradas.forEach((i) => spans[i]?.classList.add('atencao'));
    await dizer('Vamos devagar.');
    await lerAcendendo(raiz, silabas, palavra, CONFIG.velocidadeModelo);
    spans.forEach((s) => s.classList.remove('atencao'));
  }

  await dizer('Tudo bem, a gente volta nela na próxima vez.');
  if (!estado.revisar.includes(palavra)) estado.revisar.push(palavra);
  salvar(estado);
  return false;
}

// ================================================================ etapas

async function motivacao() {
  const raiz = mostrar(`
    <div class="icone-grande">${icone('maos')}</div>
    <div class="mic-area"></div>`);
  await dizer('Antes de começar a ler, quero conversar um pouco com você.');
  await dizer('Pensa em alguém fazendo um bolo, costurando uma roupa ou plantando uma roça. ' +
    'Tudo isso que a gente faz com as mãos e com a cabeça tem um nome: cultura.');
  await dizer('Me conta: o que você sabe fazer bem?');
  await ouvirPessoa(raiz);
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

  mostrar(`<div class="icone-grande">${icone('aceno')}</div>`);
  await dizer('Que bom te ver de novo! Vamos ler as palavras da última vez.');

  for (const palavra of paraLer) {
    const silabas = silabar(palavra);
    const raiz = mostrar(`${silabasHtml(silabas)}<div class="mic-area"></div>`, 'foco');
    await dizer('Lê pra mim essa palavra.');
    const alternativas = await ouvirPessoa(raiz);
    if (conferirFala(alternativas, silabas).ok) {
      await dizer(`${elogio()} ${palavra}.`);
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
    const raiz = mostrar(`<div class="icone-grande">${icone('conversa')}</div><div class="mic-area"></div>`);
    await dizer(tentativa === 0 ? perguntaDoDia(estado, 0) : `E ${perguntaDoDia(estado, tentativa).toLowerCase()}`);
    const alternativas = await ouvirPessoa(raiz);
    const { candidatas, debate } = await interpretar(alternativas, estado, lexico);

    for (const candidata of candidatas.slice(0, 2)) {
      const palavra = candidata.palavra;
      const conf = mostrar(`
        <div class="icone-grande">${icone('ouvido')}</div>
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
  const raiz = mostrar(`<div class="icone-grande">${icone('conversa')}</div><div class="mic-area"></div>`);
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
      await dizer(elogio());
    } else {
      await dizer('Vamos devagar.');
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
          await dizer(`${elogio()} ${item.palavra}.`);
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
          falar(b.dataset.s);
          return;
        }
        if (b.dataset.acao === 'apagar') { digitadas.pop(); atualizar(); return; }
        if (b.dataset.acao === 'ouvir') { await dizer(alvo); return; }
        if (b.dataset.acao !== 'pronto' || !digitadas.length) return;

        const r = conferirEscrita(digitadas, silabasAlvo);
        if (r.ok) {
          $escrita.classList.add('certa');
          await dizer(`${elogio()} Você escreveu ${alvo}.`);
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
        await dizer(`Quase. ${alvo} é assim:`);
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
    <div class="icone-grande">${icone('caderno')}</div>
    <ul class="lista-caderno">${doDia.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    <button class="btn largo principal" data-acao="terminei">Terminei</button>`);
  await dizer('Agora pega o seu caderno e um lápis. Escreve essas palavras, uma embaixo da outra.');
  await dizer('Quando terminar, toca no botão.');
  await esperarToque(raiz.querySelector('[data-acao="terminei"]'));
  await dizer('Muito bem. Da próxima vez você lê pra mim o que escreveu.');
}

async function fechamento() {
  etapa('');
  const total = estado.pastinha.filter((p) => p.real).length;
  const raiz = mostrar(`
    <div class="icone-grande">${icone('broto')}</div>
    <p class="grande">${total} ${total === 1 ? 'palavra' : 'palavras'} na sua pastinha</p>
    <button class="btn largo" data-acao="inicio">Voltar ao início</button>`);
  await dizer(`Você já tem ${total} ${total === 1 ? 'palavra' : 'palavras'} na sua pastinha. ` +
    'Em casa, tenta formar mais palavras com as sílabas de hoje. Até a próxima!');
  await esperarToque(raiz.querySelector('[data-acao="inicio"]'));
}

// ================================================================ sessão

async function sessao() {
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
  estado.ultimaSessao = hoje();
  salvar(estado);

  await fechamento();
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

async function inicio() {
  for (;;) {
    const raiz = mostrar(`
      <h1 class="marca" aria-label="Palavra">
        <span class="sil">pa</span><span class="sil">la</span><span class="sil">vra</span>
      </h1>
      <button class="btn largo principal comecar" data-acao="comecar">${icone('comecar')} Começar</button>
      <div class="secundarios">
        <button class="btn" data-acao="pastinha">${icone('pasta')} Minha pastinha</button>
        <button class="btn" data-acao="voz">${icone('falar')} Escolher voz</button>
      </div>
      <button class="link" data-acao="zerar">Apagar meu progresso</button>`, 'inicio');
    $legenda.textContent = '';
    etapa('');
    const acao = await esperarToque(...raiz.querySelectorAll('[data-acao]'));

    if (acao === 'pastinha') { await pastinha(); continue; }
    if (acao === 'voz') { await telaVoz(); continue; }
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
inicio().catch((erro) => {
  console.error(erro);
  mostrar(`<p class="grande">Algo deu errado.</p><pre>${esc(erro.stack || erro)}</pre>`);
});
