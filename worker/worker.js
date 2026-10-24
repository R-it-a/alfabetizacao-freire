/**
 * Proxy entre o app e o Claude (manual, seção 06). Guarda a chave da API,
 * que nunca pode ficar no celular. Publicar: veja worker/LEIA-ME.md.
 *
 * O app manda as alternativas do reconhecimento de voz, o estágio da pessoa e
 * as palavras já trabalhadas. O Claude devolve a transcrição corrigida, palavras
 * candidatas e uma pergunta de debate. Quem decide a palavra é o código do app.
 */

const API = 'https://api.anthropic.com/v1/messages';

const PROMPT_FREIRIANO = `Você é o coordenador de um círculo de cultura que alfabetiza adultos pelo método Paulo Freire.
A pessoa respondeu por voz a uma pergunta sobre a vida dela. Você recebe até três transcrições
alternativas do reconhecimento de voz, o estágio fonético dela (1 a 5) e as palavras geradoras já trabalhadas.

Sua tarefa:
1. transcricao_corrigida: escolha a transcrição que faz sentido e corrija erros de sotaque
   pelo contexto ("cus cus com ovo" vira "cuscuz com ovo").
2. candidatas: até 5 substantivos concretos DITOS pela pessoa que possam virar palavra geradora,
   em ordem de carga existencial (o quanto a palavra puxa conversa sobre a vida e a realidade dela).
   Use só palavras que ela falou, em minúsculas, no singular. Nunca invente palavras.
   Não se preocupe com o estágio fonético: o app filtra.
3. pergunta_debate: uma pergunta curta e calorosa, em português simples, sobre a primeira candidata
   e a vida da pessoa, para abrir conversa antes de a palavra aparecer escrita.

Fale como gente, sem infantilizar. A pessoa é adulta e já sabe muita coisa.`;

const SCHEMA = {
  type: 'object',
  properties: {
    transcricao_corrigida: { type: 'string' },
    candidatas: { type: 'array', items: { type: 'string' } },
    pergunta_debate: { type: 'string' }
  },
  required: ['transcricao_corrigida', 'candidatas', 'pergunta_debate'],
  additionalProperties: false
};

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.APP_ORIGIN || 'https://r-it-a.github.io',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return new Response('só POST', { status: 405, headers: cors });

    const { alternativas = [], estagio = 1, palavras_trabalhadas = [] } = await req.json();

    const resposta = await fetch(API, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: env.MODELO || 'claude-sonnet-5-5',
        max_tokens: 1000,
        system: [{ type: 'text', text: PROMPT_FREIRIANO, cache_control: { type: 'ephemeral' } }],
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
        messages: [{
          role: 'user',
          content: JSON.stringify({ alternativas, estagio, palavras_trabalhadas })
        }]
      })
    });

    return new Response(resposta.body, {
      status: resposta.status,
      headers: { ...cors, 'content-type': 'application/json' }
    });
  }
};
