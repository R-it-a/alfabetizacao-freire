/**
 * Silabador de português brasileiro + gerador de fichas de descoberta.
 *
 * Determinístico: mesma entrada, mesma saída, sempre. É o núcleo do app —
 * o LLM nunca faz este trabalho, porque erraria em silêncio.
 *
 *   silabar('tijolo')  ->  ['ti', 'jo', 'lo']
 *   familia('ti')      ->  ['ta', 'te', 'ti', 'to', 'tu']
 *
 * Port fiel de silabador.py, que tem a suíte de testes.
 * Referência do método: documento de planejamento de Angicos (1963) e
 * L. O. Lima, "Tecnologia, educação e democracia" (1965), apêndice.
 */

// --------------------------------------------------------------- alfabeto

const VOGAIS_BASE = 'aeiou';
const ACENTOS_AGUDOS = 'áéíóúâêô';   // em i/u força hiato: sa-ú-de
const NASAIS = 'ãõ';
const VOGAIS = VOGAIS_BASE + ACENTOS_AGUDOS + NASAIS + 'àü';

/** Dígrafos que representam UM som e nunca se separam. */
const DIGRAFOS_INSEPARAVEIS = ['ch', 'lh', 'nh'];

/** Dígrafos que se separam entre as duas letras: car-ro, pas-sa, nas-cer. */
const DIGRAFOS_SEPARAVEIS = ['rr', 'ss', 'sc', 'sç', 'xc', 'xs'];

/** Encontros consonantais que iniciam sílaba juntos: o-bra, a-tle-ta. */
const GRUPOS_ONSET = [
  'bl', 'br', 'cl', 'cr', 'dl', 'dr', 'fl', 'fr', 'gl', 'gr',
  'pl', 'pr', 'tl', 'tr', 'vl', 'vr'
];

/** Consoantes que formam grupo com l/r — regra de generalização (aula 12). */
const CONSOANTES_DE_GRUPO = 'bcdfgptv';

/**
 * Letras cujo som muda conforme a vogal seguinte: ca/co/cu são /k/ mas
 * ce/ci são /s/. Angicos previa uma aula extra só para isso.
 */
const SOM_VARIAVEL = ['c', 'g'];

/** Combinações que a ortografia do português não usa. */
const RARAS = new Set(['lhi', 'lhu', 'nhi', 'nhu', 'qua', 'quo']);

const base = (ch) => ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
const ehVogal = (ch) => VOGAIS.includes(ch);
const temAcentoAgudo = (ch) => ACENTOS_AGUDOS.includes(ch);
const ehNasal = (ch) => NASAIS.includes(ch);

// --------------------------------------------------------------- tokenizar

/**
 * Quebra a palavra em unidades fonográficas.
 * @returns {Array<{tipo: 'C'|'V', txt: string}>}
 */
export function tokenizar(palavra) {
  const p = palavra.toLowerCase();
  const out = [];
  let i = 0;

  while (i < p.length) {
    const par = p.slice(i, i + 2);

    // ch, lh, nh — uma consoante só
    if (DIGRAFOS_INSEPARAVEIS.includes(par)) {
      out.push({ tipo: 'C', txt: par });
      i += 2;
      continue;
    }

    const proxima = p[i + 2];

    // qu/gu + e|i  ->  u mudo, o conjunto é uma consoante (qui-lo, guer-ra)
    if ((par === 'qu' || par === 'gu') && proxima && 'ei'.includes(base(proxima))) {
      out.push({ tipo: 'C', txt: par });
      i += 2;
      continue;
    }

    // qu/gu + a|o  ->  o u é semivogal (á-gua, quan-do)
    if ((par === 'qu' || par === 'gu') && proxima && 'ao'.includes(base(proxima))) {
      out.push({ tipo: 'C', txt: p[i] });
      out.push({ tipo: 'V', txt: p[i + 1] });
      i += 2;
      continue;
    }

    out.push({ tipo: ehVogal(p[i]) ? 'V' : 'C', txt: p[i] });
    i += 1;
  }

  return out;
}

// --------------------------------------------------------------- núcleos

/** Duas vogais adjacentes ficam na mesma sílaba? */
function ehDitongo(v1, v2, crescentePermitido) {
  const b1 = base(v1);
  const b2 = base(v2);

  // ão, ãe, õe, ãi — sempre ditongo
  if (ehNasal(v1) && 'aeiou'.includes(b2)) return true;

  // i/u com acento gráfico é núcleo próprio: sa-ú-de, pa-ís, ru-í-na
  if (temAcentoAgudo(v2) && 'iu'.includes(b2)) return false;
  if (temAcentoAgudo(v1) && 'iu'.includes(b1)) return false;

  // decrescente: vogal + i/u átono -> ai, ei, oi, ui, au, eu, ou, iu
  if ('iu'.includes(b2)) return true;

  // crescente: i/u átono + vogal -> depende da posição
  if ('iu'.includes(b1)) return crescentePermitido;

  // a/e/o + a/e/o -> hiato: po-e-ta, ca-os, vo-o
  return false;
}

/**
 * Agrupa vogais adjacentes em núcleos silábicos.
 * @returns {Array<{ini: number, fim: number, txt: string}>}
 */
export function agruparNucleos(tokens) {
  const totalVogais = tokens.filter((t) => t.tipo === 'V').length;
  const nucleos = [];
  let i = 0;

  while (i < tokens.length) {
    if (tokens[i].tipo !== 'V') { i += 1; continue; }

    const ini = i;
    let j = i + 1;

    while (j < tokens.length && tokens[j].tipo === 'V') {
      // ditongo crescente só no fim da palavra e com 3+ vogais:
      // fa-mí-lia e his-tó-ria, mas di-a e ru-a.
      const restoEhFinal = tokens.slice(j + 1).every((t) => t.tipo !== 'V');
      let crescenteOk = restoEhFinal && totalVogais >= 3;

      // depois de qu/gu o u já foi emitido como vogal: quan-do, á-gua
      const depoisDeQuGu =
        ini > 0 &&
        tokens[ini - 1].tipo === 'C' &&
        (tokens[ini - 1].txt === 'q' || tokens[ini - 1].txt === 'g') &&
        base(tokens[ini].txt) === 'u';

      if (depoisDeQuGu) crescenteOk = true;

      if (ehDitongo(tokens[j - 1].txt, tokens[j].txt, crescenteOk)) j += 1;
      else break;
    }

    nucleos.push({
      ini,
      fim: j,
      txt: tokens.slice(ini, j).map((t) => t.txt).join('')
    });
    i = j;
  }

  return nucleos;
}

// --------------------------------------------------------------- silabar

/**
 * Quantas das consoantes entre dois núcleos ficam na CODA da sílaba
 * anterior. O resto vira ataque da próxima.
 */
function quebraEntre(consoantes) {
  const k = consoantes.length;

  if (k === 0) return 0;                       // hiato: po-e-ta
  if (k === 1) return 0;                       // ca-sa, ti-jo-lo

  const ultimas = consoantes[k - 2] + consoantes[k - 1];

  if (DIGRAFOS_SEPARAVEIS.includes(ultimas)) return k - 1;  // car-ro, pas-sa
  if (GRUPOS_ONSET.includes(ultimas)) return k - 2;         // o-bra, ex-pres-so

  return k - 1;                                             // al-mo, bil-ro
}

/**
 * Separa uma palavra em sílabas.
 *
 *   silabar('tijolo')    ->  ['ti', 'jo', 'lo']
 *   silabar('chibanca')  ->  ['chi', 'ban', 'ca']
 *   silabar('expresso')  ->  ['ex', 'pres', 'so']
 */
export function silabar(palavra) {
  if (!palavra || !palavra.trim()) return [];

  const tokens = tokenizar(palavra.trim());
  const nucleos = agruparNucleos(tokens);

  if (nucleos.length === 0) {
    return [tokens.map((t) => t.txt).join('')];
  }

  const cortes = [0];
  for (let n = 0; n < nucleos.length - 1; n += 1) {
    const a = nucleos[n];
    const b = nucleos[n + 1];
    const entre = tokens.slice(a.fim, b.ini).map((t) => t.txt);
    cortes.push(a.fim + quebraEntre(entre));
  }
  cortes.push(tokens.length);

  const silabas = [];
  for (let c = 0; c < cortes.length - 1; c += 1) {
    const s = tokens.slice(cortes[c], cortes[c + 1]).map((t) => t.txt).join('');
    if (s) silabas.push(s);
  }

  return silabas;
}

// --------------------------------------------------------------- análise

/**
 * Quebra uma sílaba em ataque, núcleo e coda.
 *
 *   analisar('ti')   ->  { onset: 't',  nucleo: 'i', coda: ''  }
 *   analisar('ban')  ->  { onset: 'b',  nucleo: 'a', coda: 'n' }
 *   analisar('pres') ->  { onset: 'pr', nucleo: 'e', coda: 's' }
 */
export function analisar(silaba) {
  const tokens = tokenizar(silaba);
  const idxV = [];
  tokens.forEach((t, i) => { if (t.tipo === 'V') idxV.push(i); });

  if (idxV.length === 0) {
    return { onset: silaba, nucleo: '', coda: '' };
  }

  const ini = idxV[0];
  const fim = idxV[idxV.length - 1] + 1;

  return {
    onset: tokens.slice(0, ini).map((t) => t.txt).join(''),
    nucleo: tokens.slice(ini, fim).map((t) => t.txt).join(''),
    coda: tokens.slice(fim).map((t) => t.txt).join('')
  };
}

// --------------------------------------------------------------- famílias

/**
 * A família fonêmica de uma sílaba: mesmo ataque, as cinco vogais.
 *
 *   familia('ti')  ->  ['ta', 'te', 'ti', 'to', 'tu']
 *   familia('ban') ->  ['ban', 'ben', 'bin', 'bon', 'bun']
 *
 * Sílaba travada mantém a coda — foi assim que Angicos ensinou 'an'
 * (CHIBANCA) e 'il' (BILRO / ALMOFADA).
 *
 * qu/gu é o único caso em que a família segue o SOM e não a letra, porque
 * 'qu' não existe antes de a/o/u: a família de 'que' é ca-que-qui-co-cu.
 * Para c e g mantemos a família ortográfica, como o método original —
 * veja temSomVariavel().
 */
export function familia(silaba) {
  const { onset, coda } = analisar(silaba);
  const vogais = VOGAIS_BASE.split('');

  // som /k/: escreve-se C antes de a/o/u e QU antes de e/i
  if (onset === 'qu') {
    return vogais.map((v) => ('ei'.includes(v) ? 'qu' : 'c') + v + coda);
  }

  // som /g/: escreve-se G antes de a/o/u e GU antes de e/i
  if (onset === 'gu') {
    return vogais.map((v) => ('ei'.includes(v) ? 'gu' : 'g') + v + coda);
  }

  return vogais.map((v) => onset + v + coda);
}

export function ehRara(silaba) {
  return RARAS.has(silaba);
}

/**
 * A família desta sílaba mistura dois sons na mesma linha?
 * Serve para disparar a aula extra que Angicos previa: CASA / CEBOLA /
 * CIGARRO / COPO / CEGO / CUIA, e depois AÇAFRÃO / AÇUDE / AÇO.
 */
export function temSomVariavel(silaba) {
  return SOM_VARIAVEL.includes(analisar(silaba).onset);
}

/**
 * A regra de generalização de Angicos, aula 12:
 *
 *   "Ao dar sílabas complexas o professor introduzirá outras do mesmo tipo,
 *    variando apenas a consoante inicial. Ex: expresso — dará oportunidade
 *    não só para pra, pre, pri, pro, pru, mas para bra, dra, fra, tra, vra."
 *
 * Devolve as famílias irmãs de uma sílaba com encontro consonantal.
 * Sílaba sem grupo devolve lista vazia.
 */
export function expandirGrupo(silaba) {
  const { onset, nucleo, coda } = analisar(silaba);

  if (onset.length !== 2 || !GRUPOS_ONSET.includes(onset)) return [];

  const liquida = onset[1];   // 'l' ou 'r'
  const irmas = [];

  for (const c of CONSOANTES_DE_GRUPO) {
    const grupo = c + liquida;
    if (GRUPOS_ONSET.includes(grupo) && grupo !== onset) {
      irmas.push(familia(grupo + nucleo + coda));
    }
  }

  return irmas;
}

// --------------------------------------------------- ficha de descoberta

/**
 * Monta a ficha de descoberta de uma palavra geradora — o 7º quadro do
 * protocolo de 1965, de onde parte toda a alfabetização.
 */
export function fichaDescoberta(palavra, incluirGeneralizacao = false) {
  const silabas = silabar(palavra);
  const familias = [];
  const vistas = new Set();

  for (const s of silabas) {
    const a = analisar(s);
    const chave = `${a.onset}|${a.coda}`;
    if (vistas.has(chave)) continue;   // xi-que-xi-que: não repete família
    vistas.add(chave);

    const linha = familia(s);
    familias.push({
      silaba: s,
      linha,
      raras: linha.filter(ehRara),
      somVariavel: temSomVariavel(s)
    });
  }

  const ficha = {
    palavra: palavra.toLowerCase(),
    silabas,
    familias,
    grade: familias.map((f) => f.linha)
  };

  if (incluirGeneralizacao) {
    ficha.familiasIrmas = silabas.flatMap(expandirGrupo);
  }

  return ficha;
}

/**
 * Todas as palavras de `lexico` que se formam com as sílabas da ficha.
 * É a "potência gerativa" — a riqueza fonêmica de Freire, contável.
 *
 * @param {object} ficha  saída de fichaDescoberta()
 * @param {Iterable<string>} lexico  a wordlist pt-BR
 */
export function palavrasPossiveis(ficha, lexico) {
  const disponiveis = new Set(ficha.grade.flat());
  const achadas = new Set();

  for (const bruta of lexico) {
    const p = String(bruta).toLowerCase().trim();
    if (!p) continue;
    const sil = silabar(p);
    if (sil.length && sil.every((s) => disponiveis.has(s))) achadas.add(p);
  }

  return [...achadas].sort();
}
