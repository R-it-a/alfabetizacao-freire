/**
 * Ouvir e falar com as APIs do próprio navegador (manual, seções 01 e 02).
 * Falar roda no aparelho e funciona offline; ouvir precisa de internet.
 */

import { CONFIG } from './config.js';

// ================================================================ falar

const CHAVE_VOZ = 'palavra.voz';
let vozEscolhida = null;

/**
 * Nota de cada voz: português do Brasil primeiro, depois as vozes "naturais"
 * ou da nuvem (Google, Microsoft Natural, Siri aprimorada), que soam bem menos
 * robóticas que as vozes compactas instaladas no aparelho.
 */
function nota(voz) {
  const nome = voz.name.toLowerCase();
  const lang = (voz.lang || '').replace('_', '-').toLowerCase();
  let n = 0;
  if (lang === 'pt-br') n += 10;
  else if (lang.startsWith('pt')) n += 4;
  else return -100;
  if (/natural|neural|online|premium|enhanced|aprimorad|wavenet/.test(nome)) n += 6;
  if (/google/.test(nome)) n += 4;
  if (voz.localService === false) n += 2;
  if (/compact|espeak|robot/.test(nome)) n -= 5;
  return n;
}

/** Vozes em português disponíveis neste aparelho, da melhor para a pior. */
export function vozesDisponiveis() {
  const todas = globalThis.speechSynthesis?.getVoices() || [];
  return todas.filter((v) => nota(v) > 0).sort((a, b) => nota(b) - nota(a));
}

function lerPreferencia() {
  try { return localStorage.getItem(CHAVE_VOZ); } catch { return null; }
}

function atualizarVoz() {
  const vozes = vozesDisponiveis();
  const preferida = lerPreferencia();
  vozEscolhida = vozes.find((v) => v.name === preferida) || vozes[0] || null;
}

export function escolherVoz(nome) {
  try { localStorage.setItem(CHAVE_VOZ, nome); } catch { /* sem armazenamento */ }
  atualizarVoz();
}

export const vozAtual = () => vozEscolhida?.name || null;

if (globalThis.speechSynthesis) {
  atualizarVoz();
  // as vozes carregam depois da página (manual, seção 02)
  speechSynthesis.addEventListener?.('voiceschanged', atualizarVoz);
}

/** Fala o texto e resolve quando termina. */
export function falar(texto, { velocidade = CONFIG.velocidadeFala, voz = vozEscolhida } = {}) {
  return new Promise((resolve) => {
    if (!globalThis.speechSynthesis || !texto) return resolve();
    speechSynthesis.cancel(); // sem isso as falas se empilham

    const u = new SpeechSynthesisUtterance(texto);
    u.lang = voz?.lang || 'pt-BR';
    u.rate = velocidade;
    if (voz) u.voice = voz;

    let terminou = false;
    const fim = () => {
      if (terminou) return;
      terminou = true;
      clearTimeout(seguranca);
      resolve();
    };
    u.onend = fim;
    u.onerror = fim;
    // alguns Androids não disparam onend: segue depois de um tempo proporcional ao texto
    const seguranca = setTimeout(fim, 2500 + (texto.length * 120) / velocidade);
    speechSynthesis.speak(u);
  });
}

export function pararDeFalar() {
  globalThis.speechSynthesis?.cancel();
}

// ================================================================ ouvir

export const reconhecimentoDisponivel = () =>
  Boolean(globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition);

/**
 * Junta os trechos reconhecidos numa lista de até 3 frases alternativas.
 * Cada trecho traz seus palpites; a alternativa k usa o k-ésimo palpite de cada
 * trecho (ou o primeiro, quando o trecho tem menos palpites).
 */
export function combinarTrechos(trechos) {
  if (!trechos.length) return [];
  const frases = new Set();
  for (let k = 0; k < 3; k += 1) {
    frases.add(trechos.map((t) => (t[k] ?? t[0]).trim()).join(' ').trim());
  }
  return [...frases].filter(Boolean).map((texto) => ({ texto, conf: null }));
}

/**
 * Começa a ouvir e só para quando mandarem: é o "segurar para falar".
 * O reconhecimento do Chrome desliga sozinho depois de um silêncio, então ele é
 * religado enquanto a pessoa ainda segura o botão. Assim ela pode demorar,
 * pensar e continuar, sem perder o que já disse.
 *
 * @returns {{ parar: () => Promise<{alternativas: object[], erro: string|null}>, cancelar: () => void }}
 */
export function gravar() {
  const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  const trechos = [];
  let ativo = true;
  let erro = null;
  let rec = null;
  let avisarFim;
  const terminou = new Promise((r) => { avisarFim = r; });

  const ligar = () => {
    rec = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 3;

    rec.onresult = (e) => {
      for (let i = e.resultIndex ?? 0; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (r.isFinal !== false) trechos.push(Array.from(r).map((a) => a.transcript));
      }
    };
    rec.onerror = (e) => {
      // silêncio no começo não é erro: a pessoa ainda está pensando
      if (e.error !== 'no-speech' && e.error !== 'aborted') erro = e.error;
    };
    rec.onend = () => {
      if (ativo && !erro) {
        try { ligar(); return; } catch { /* não religou: encerra */ }
      }
      avisarFim();
    };
    rec.start();
  };

  try {
    ligar();
  } catch (e) {
    erro = String(e);
    avisarFim();
  }

  return {
    async parar() {
      ativo = false;
      try { rec?.stop(); } catch { /* já parou */ }
      await Promise.race([terminou, new Promise((r) => setTimeout(r, 4000))]);
      return { alternativas: combinarTrechos(trechos), erro };
    },
    cancelar() {
      ativo = false;
      try { rec?.abort(); } catch { /* já parou */ }
    }
  };
}
