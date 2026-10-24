/**
 * Ouvir e falar com as APIs do próprio navegador (manual, seções 01 e 02).
 * Falar roda no aparelho e funciona offline; ouvir precisa de internet.
 */

import { CONFIG } from './config.js';

let vozPt = null;

function escolherVoz() {
  const vozes = globalThis.speechSynthesis?.getVoices() || [];
  vozPt = vozes.find((v) => v.lang === 'pt-BR') || vozes.find((v) => v.lang?.startsWith('pt')) || null;
}

if (globalThis.speechSynthesis) {
  escolherVoz();
  speechSynthesis.addEventListener?.('voiceschanged', escolherVoz);
}

/** Fala o texto e resolve quando termina. */
export function falar(texto, { velocidade = CONFIG.velocidadeFala } = {}) {
  return new Promise((resolve) => {
    if (!globalThis.speechSynthesis || !texto) return resolve();
    speechSynthesis.cancel(); // sem isso as falas se empilham

    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'pt-BR';
    u.rate = velocidade;
    if (vozPt) u.voice = vozPt;

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
    const seguranca = setTimeout(fim, 2500 + texto.length * 120 / velocidade);
    speechSynthesis.speak(u);
  });
}

export function pararDeFalar() {
  globalThis.speechSynthesis?.cancel();
}

export const reconhecimentoDisponivel = () =>
  Boolean(globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition);

/**
 * Ouve uma frase e devolve até 3 alternativas com a confiança de cada uma.
 * @returns {Promise<{alternativas: {texto: string, conf: number}[], erro: string|null}>}
 */
export function ouvir({ limiteMs = 15000 } = {}) {
  return new Promise((resolve) => {
    const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    if (!SR) return resolve({ alternativas: [], erro: 'sem-suporte' });

    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = false;      // instável no Android quando true
    rec.interimResults = false;
    rec.maxAlternatives = 3;     // o truque: a palavra certa às vezes é o 2º palpite

    let alternativas = [];
    let erro = null;
    rec.onresult = (e) => {
      const r = e.results[e.results.length - 1];
      alternativas = Array.from(r).map((a) => ({ texto: a.transcript, conf: a.confidence }));
    };
    rec.onerror = (e) => { erro = e.error; };
    rec.onend = () => {
      clearTimeout(limite);
      resolve({ alternativas, erro });
    };
    const limite = setTimeout(() => { try { rec.stop(); } catch { /* já parou */ } }, limiteMs);

    try {
      rec.start();
    } catch (e) {
      clearTimeout(limite);
      resolve({ alternativas: [], erro: String(e) });
    }
  });
}
