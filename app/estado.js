/**
 * O progresso da pessoa, guardado no próprio celular (manual, seção 05;
 * fluxo da sessão, seção 07).
 */

const CHAVE = 'palavra.aluno';

export const VAZIO = Object.freeze({
  versao: 1,
  estagio: 1,                 // 1 a 5, a grade fonética de Angicos
  familias: {},               // { 'b|': true, 'l|': true }
  palavras: [],               // palavras geradoras já trabalhadas, em ordem
  palavrasPorEstagio: {},     // { '1': 2 }
  pastinha: [],               // { palavra, real, data, geradora }
  revisar: [],                // palavras que passaram de duas tentativas
  sessoes: 0,
  ultimaSessao: null,         // 'AAAA-MM-DD'
  motivacao_feita: false,
  explicou_palavras_mortas: false
});

function copiaVazia() {
  return JSON.parse(JSON.stringify(VAZIO));
}

export function carregar(armazenamento = globalThis.localStorage) {
  try {
    const cru = armazenamento?.getItem(CHAVE);
    return { ...copiaVazia(), ...JSON.parse(cru || '{}') };
  } catch {
    return copiaVazia();
  }
}

export function salvar(estado, armazenamento = globalThis.localStorage) {
  try {
    armazenamento?.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // sem espaço ou modo privado: o app segue funcionando, só não guarda
  }
}

export function apagar(armazenamento = globalThis.localStorage) {
  try {
    armazenamento?.removeItem(CHAVE);
  } catch {
    /* nada a fazer */
  }
}

export const hoje = () => new Date().toISOString().slice(0, 10);
