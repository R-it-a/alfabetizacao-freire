/**
 * A parte que exige sentido: entender a fala, escolher palavras candidatas e
 * conduzir a conversa (especificação, seção 05).
 *
 * Com CONFIG.proxyUrl, chama o Claude pelo Worker (pasta worker/). Sem ele, ou
 * se a chamada falhar, usa as regras locais e perguntas fixas. Nos dois casos
 * quem decide a palavra é o código: o LLM só propõe candidatas.
 */

import { CONFIG } from './config.js';
import { candidatasDaFala, avaliarPalavra } from './metodo.js';

/** Perguntas por estágio: assuntos que costumam render palavras do nível certo. */
export const PERGUNTAS = {
  1: [
    'O que você comeu hoje?',
    'O que tem na sua cozinha?',
    'O que você usa pra trabalhar?',
    'O que você calça pra sair de casa?'
  ],
  2: ['O que você comprou na feira?', 'Me conta como é a sua casa.', 'Que bicho tinha onde você cresceu?'],
  3: ['O que você fez ontem?', 'Como é a rua onde você mora?', 'O que você gosta de cozinhar?'],
  4: ['O que não pode faltar no seu prato?', 'Como você chega no trabalho?', 'O que você planta ou gostaria de plantar?'],
  5: ['Me conta do seu trabalho.', 'O que você gostaria de aprender?', 'Qual festa você mais gosta?']
};

export function perguntaDoDia(estado, tentativa = 0) {
  const lista = PERGUNTAS[estado.estagio] || PERGUNTAS[1];
  return lista[(estado.sessoes + tentativa) % lista.length];
}

export function perguntaDeDebate(palavra) {
  return `Me conta: o que ${palavra} tem a ver com a sua vida?`;
}

/**
 * Interpreta uma resposta falada.
 * @returns {Promise<{transcricao: string, candidatas: object[], debate: string|null}>}
 */
export async function interpretar(alternativas, estado, lexico) {
  const local = {
    transcricao: alternativas[0]?.texto || '',
    candidatas: candidatasDaFala(alternativas, estado, lexico),
    debate: null
  };
  if (!CONFIG.proxyUrl || !alternativas.length) return local;

  try {
    const resposta = await fetch(CONFIG.proxyUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        alternativas: alternativas.map((a) => a.texto),
        estagio: estado.estagio,
        palavras_trabalhadas: estado.palavras
      })
    });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const json = await resposta.json();
    const dados = JSON.parse(json.content?.[0]?.text || '{}');

    // o LLM propõe; o código decide (porteiro do estágio e pontuação)
    const doLlm = (dados.candidatas || [])
      .map((p) => avaliarPalavra(String(p).toLowerCase(), estado, lexico))
      .filter((a) => a.score > 0 && lexico.rank(a.palavra) !== undefined);

    return {
      transcricao: dados.transcricao_corrigida || local.transcricao,
      candidatas: doLlm.length ? doLlm : local.candidatas,
      debate: dados.pergunta_debate || null
    };
  } catch (erro) {
    console.warn('Claude indisponível, seguindo com as regras locais:', erro);
    return local;
  }
}
