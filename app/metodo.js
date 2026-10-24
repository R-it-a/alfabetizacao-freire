/**
 * Regras do método que o app aplica em código (nunca no LLM):
 * estágio fonético, famílias novas, escolha da palavra geradora,
 * conferência da fala e da escrita.
 *
 * Funções puras: rodam no navegador e no Node (testes em testes/).
 * Referências: 01-especificacao-do-metodo.html (seções 04 e 06) e
 * 03-fluxo-da-sessao.html (seções 03 a 05).
 */

import { silabar, analisar, fichaDescoberta, ehRara } from '../codigo/silabador.js';

// ------------------------------------------------------------ texto

/** Minúsculas, sem acento e sem pontuação. "Cuscuz, com OVO!" -> "cuscuz com ovo" */
export function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Como normalizar(), mas sem espaços: serve para comparar falas. */
export const compactar = (texto) => normalizar(texto).replace(/ /g, '');

// ------------------------------------------------------------ estágios

/**
 * Consoantes de som único, aceitas no estágio 1 (especificação, seção 06).
 * Dígrafos entram no 2, ortografia ambígua no 3, nasais e travadas no 4,
 * encontros consonantais no 5.
 */
const CONSOANTES_ESTAGIO_1 = new Set(['b', 'l', 't', 's', 'p', 'v', 'n', 'f', 'm', 'g', 'r']);
const DIGRAFOS = new Set(['ch', 'lh', 'nh']);
const ORTOGRAFIA_AMBIGUA = new Set(['c', 'ç', 'x', 'z', 'j', 'h', 'd', 'qu', 'gu', 'k', 'w', 'y']);

export const ESTAGIO_MAXIMO = 5;

export function estagioDaSilaba(silaba) {
  const { onset, nucleo, coda } = analisar(silaba);
  const vogal = compactar(nucleo);
  let estagio = 1;

  if (onset && !CONSOANTES_ESTAGIO_1.has(onset)) {
    if (DIGRAFOS.has(onset)) estagio = 2;
    else if (onset.length === 2 && !ORTOGRAFIA_AMBIGUA.has(onset)) estagio = 5; // br, pl, tr...
    else estagio = 3;
  }
  if (onset === 'g' && 'ei'.includes(vogal[0])) estagio = Math.max(estagio, 3); // ge, gi
  if (vogal.length > 1) estagio = Math.max(estagio, 2); // ditongo (FEIRA, aula 5)
  if (/[ãõ]/.test(nucleo) || coda) estagio = Math.max(estagio, 4); // nasal ou travada
  return estagio;
}

/**
 * Estágio de uma palavra: o da sílaba mais difícil.
 * rr e ss são dígrafos (estágio 2), mesmo que a separação os divida:
 * car-ro, pas-so.
 */
export function estagioDaPalavra(palavra) {
  const silabas = silabar(palavra.toLowerCase());
  let maior = 1;
  silabas.forEach((s, i) => {
    let e = estagioDaSilaba(s);
    const { coda } = analisar(s);
    const proxima = silabas[i + 1];
    const digrafoSeparado =
      (coda === 'r' || coda === 's') && proxima && analisar(proxima).onset === coda;
    if (digrafoSeparado) {
      const semCoda = estagioDaSilaba(s.slice(0, -1));
      e = Math.max(semCoda, 2);
    }
    maior = Math.max(maior, e);
  });
  return maior;
}

// ------------------------------------------------------------ famílias

/** Identifica uma família pelo ataque e pela coda: 'b|', 'lh|', 'b|n'. */
export function chaveFamilia(silaba) {
  const { onset, coda } = analisar(silaba);
  return `${onset}|${coda}`;
}

/** As famílias da palavra que a pessoa ainda não aprendeu. */
export function familiasNovas(palavra, aprendidas) {
  return fichaDescoberta(palavra).familias
    .map((f) => chaveFamilia(f.silaba))
    .filter((chave) => !aprendidas.has(chave));
}

/** Sílabas do teclado: todas as famílias aprendidas, sem as combinações raras. */
export function silabasDoTeclado(fichasAprendidas) {
  const linhas = [];
  const vistas = new Set();
  for (const palavra of fichasAprendidas) {
    for (const f of fichaDescoberta(palavra).familias) {
      const chave = chaveFamilia(f.silaba);
      if (vistas.has(chave)) continue;
      vistas.add(chave);
      linhas.push(f.linha.filter((s) => !ehRara(s)));
    }
  }
  return linhas;
}

// ------------------------------------------------------------ palavra geradora

/**
 * Pontua uma palavra candidata, seguindo a fórmula da especificação (seção 06)
 * sem o teor pragmático, que é trabalho do LLM.
 *
 * Retorna score 0 quando a palavra está acima do estágio da pessoa: o
 * porteiro da fórmula.
 */
export function avaliarPalavra(palavra, estado, lexico) {
  const estagio = estagioDaPalavra(palavra);
  const silabas = silabar(palavra);
  if (estagio > estado.estagio || silabas.length < 2) {
    return { palavra, score: 0, estagio, motivo: estagio > estado.estagio ? 'estágio' : 'curta' };
  }

  const aprendidas = new Set(Object.keys(estado.familias));
  const novas = familiasNovas(palavra, aprendidas).length;
  const primeira = aprendidas.size === 0;

  // ideal: 1 ou 2 famílias novas. 0 não ensina nada; 3+ é muito de uma vez.
  let novidade = novas === 1 || novas === 2 ? 1 : novas === 3 ? 0.5 : 0;
  if (primeira && novas >= 1 && novas <= 3) novidade = 1;

  const potencia = lexico.potencia(palavra);
  const comum = lexico.comum(palavra) ? 0.5 : 0;
  const score = 3 + 2 * Math.log10(1 + potencia) + 2 * novidade + comum;

  return { palavra, score, estagio, novas, potencia };
}

/** Palavras frequentes demais para virar palavra geradora (eu, hoje, com...). */
const RANK_MINIMO = 250;

/**
 * Extrai da fala as palavras que podem virar palavra geradora e as ordena
 * da melhor para a pior. As alternativas do reconhecimento entram todas:
 * a palavra certa às vezes está no segundo palpite.
 */
export function candidatasDaFala(alternativas, estado, lexico) {
  const vistas = new Set();
  const resultado = [];

  for (const alt of alternativas) {
    for (const bruta of String(alt.texto).toLowerCase().split(/[^a-záàâãéêíóôõúüç]+/)) {
      if (!bruta || vistas.has(bruta)) continue;
      vistas.add(bruta);
      const rank = lexico.rank(bruta);
      if (rank === undefined || rank < RANK_MINIMO) continue;
      if (estado.palavras.includes(bruta)) continue;
      const avaliacao = avaliarPalavra(bruta, estado, lexico);
      if (avaliacao.score > 0) resultado.push(avaliacao);
    }
  }

  return resultado.sort((a, b) => b.score - a.score);
}

/** Palavras reserva por estágio, para quando a conversa não render nenhuma. */
export const RESERVA = {
  1: ['sapato', 'panela', 'bolo', 'tomate', 'mala', 'bota'],
  2: ['milho', 'feira', 'galinha', 'telha', 'chave'],
  3: ['cozinha', 'casa', 'janela', 'dinheiro', 'xícara'],
  4: ['feijão', 'pão', 'mandioca', 'carne', 'arroz'],
  5: ['trabalho', 'prato', 'fruta', 'livro', 'bicicleta']
};

// ------------------------------------------------------------ conferência

/**
 * Confere se a pessoa falou a palavra. Folgada de propósito: qualquer uma das
 * alternativas, sem acento, contendo a palavra conta como certo (sotaque não é
 * erro de leitura). Quando não bate, aponta as sílabas que não apareceram.
 */
export function conferirFala(alternativas, silabasAlvo) {
  const alvo = silabasAlvo.map(compactar);
  const palavra = alvo.join('');
  const textos = alternativas.map((a) => compactar(a.texto));

  if (textos.some((t) => t.includes(palavra))) return { ok: true, erradas: [] };

  const melhor = textos[0] || '';
  const erradas = alvo.map((_, i) => i).filter((i) => !melhor.includes(alvo[i]));
  return { ok: false, erradas: erradas.length ? erradas : alvo.map((_, i) => i) };
}

/**
 * Confere a leitura de uma família (BA BE BI BO BU). O reconhecimento é ruim com
 * sílabas soltas, então basta reconhecer 3 das 5.
 */
export function conferirFamilia(alternativas, linha) {
  const textos = alternativas.map((a) => compactar(a.texto)).join(' ');
  const achadas = linha.filter((s) => textos.includes(compactar(s))).length;
  return achadas >= Math.min(3, linha.length);
}

/** Confere uma palavra escrita no teclado de sílabas, sílaba por sílaba. */
export function conferirEscrita(digitadas, silabasAlvo) {
  const erradas = [];
  const total = Math.max(digitadas.length, silabasAlvo.length);
  for (let i = 0; i < total; i += 1) {
    if (compactar(digitadas[i] || '') !== compactar(silabasAlvo[i] || '')) erradas.push(i);
  }
  return { ok: erradas.length === 0, erradas };
}

// ------------------------------------------------------------ progressão

export const PALAVRAS_POR_ESTAGIO = 3;

/** Registra uma palavra geradora concluída e avança o estágio quando for a hora. */
export function registrarPalavraGeradora(estado, palavra) {
  for (const f of fichaDescoberta(palavra).familias) estado.familias[chaveFamilia(f.silaba)] = true;
  if (!estado.palavras.includes(palavra)) estado.palavras.push(palavra);

  const chave = String(estado.estagio);
  estado.palavrasPorEstagio[chave] = (estado.palavrasPorEstagio[chave] || 0) + 1;
  if (estado.palavrasPorEstagio[chave] >= PALAVRAS_POR_ESTAGIO && estado.estagio < ESTAGIO_MAXIMO) {
    estado.estagio += 1;
  }
  return estado;
}
