/**
 * Dicionário do app: palavras da lista VERO (LibreOffice) que aparecem num
 * corpus de frequência, ordenadas da mais comum para a menos comum.
 * A posição na lista é a frequência: quanto menor, mais comum.
 *
 * Serve para três coisas (fluxo da sessão, seção 04): saber se uma palavra
 * formada na ficha é real, contar a potência gerativa e escolher palavras
 * para pedir no teclado. Nunca serve para dizer à pessoa que ela errou.
 */

import { silabar, fichaDescoberta } from '../codigo/silabador.js';
import { compactar } from './metodo.js';

const LIMITE_COMUM = 8000;

export class Lexico {
  /** @param {string[]} palavras da mais comum para a menos comum */
  constructor(palavras) {
    this.lista = palavras.map((p) => p.trim()).filter(Boolean);
    this._rank = new Map();
    this._porForma = new Map();
    this._silabas = null;
    this._cache = new Map();

    this.lista.forEach((p, i) => {
      if (!this._rank.has(p)) this._rank.set(p, i);
      const forma = compactar(p);
      if (!this._porForma.has(forma)) this._porForma.set(forma, p);
    });
  }

  static async carregar(url = 'lexico.txt') {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`Não consegui carregar o dicionário (${resposta.status})`);
    return new Lexico((await resposta.text()).split('\n'));
  }

  rank(palavra) {
    return this._rank.get(palavra.toLowerCase());
  }

  comum(palavra) {
    const r = this.rank(palavra);
    return r !== undefined && r < LIMITE_COMUM;
  }

  /**
   * A palavra real com essa grafia sem acento, ou null.
   * "baba" -> "babá" (se for a mais comum), "benu" -> null.
   */
  real(semAcento) {
    return this._porForma.get(compactar(semAcento)) || null;
  }

  /** Sílabas (sem acento) de cada palavra do dicionário, calculadas uma vez. */
  _silabasDoLexico() {
    if (!this._silabas) {
      this._silabas = this.lista.map((p) => [p, silabar(compactar(p))]);
    }
    return this._silabas;
  }

  /** Palavras reais que se formam só com as sílabas da ficha desta palavra. */
  possiveis(palavra) {
    if (this._cache.has(palavra)) return this._cache.get(palavra);
    const disponiveis = new Set(fichaDescoberta(compactar(palavra)).grade.flat());
    const achadas = [];
    const formas = new Set();
    for (const [p, silabas] of this._silabasDoLexico()) {
      if (silabas.length && silabas.every((s) => disponiveis.has(s))) {
        const forma = compactar(p);
        if (!formas.has(forma)) {
          formas.add(forma);
          achadas.push(p);
        }
      }
    }
    this._cache.set(palavra, achadas);
    return achadas;
  }

  /** A potência gerativa: quantas palavras reais a ficha permite formar. */
  potencia(palavra) {
    return this.possiveis(palavra).length;
  }
}
