/**
 * Sons curtos de acerto, de "quase" e de fim de lição, sintetizados na hora
 * (Web Audio). Não precisam de arquivo nem de internet.
 */

let contexto = null;
let desligar = setTimeout(silenciar, 1200);

function ctx() {
  if (!contexto) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    contexto = new AC();
  }
  if (contexto.state === 'suspended') contexto.resume();
  return contexto;
}

function nota(c, freq, inicio, duracao, volume = 0.18, tipo = 'sine') {
  const osc = c.createOscillator();
  const ganho = c.createGain();
  osc.type = tipo;
  osc.frequency.value = freq;
  ganho.gain.setValueAtTime(0, c.currentTime + inicio);
  ganho.gain.linearRampToValueAtTime(volume, c.currentTime + inicio + 0.02);
  ganho.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + inicio + duracao);
  osc.connect(ganho).connect(c.destination);
  osc.start(c.currentTime + inicio);
  osc.stop(c.currentTime + inicio + duracao + 0.05);
}

const SONS = {
  certo: (c) => { nota(c, 659, 0, 0.18, 0.16, 'triangle'); nota(c, 988, 0.1, 0.32, 0.16, 'triangle'); },
  quase: (c) => { nota(c, 330, 0, 0.22, 0.12, 'triangle'); nota(c, 294, 0.14, 0.3, 0.1, 'triangle'); },
  toque: (c) => nota(c, 880, 0, 0.06, 0.05, 'sine'),
  fim: (c) => [523, 659, 784, 1047].forEach((f, i) => nota(c, f, i * 0.12, 0.4, 0.14, 'triangle'))
};

/**
 * No Android, um AudioContext ligado ocupa o áudio e o reconhecimento de voz
 * deixa de ouvir. Por isso o contexto é fechado logo depois de cada som, e
 * antes de cada gravação.
 */
export function silenciar() {
  clearTimeout(desligar);
  const c = contexto;
  contexto = null; // fechar libera o áudio de vez; o próximo som cria outro
  try {
    if (c && c.state !== 'closed') return c.close();
  } catch {
    /* nada a fazer */
  }
  return Promise.resolve();
}

export function tocar(nome) {
  try {
    const c = ctx();
    if (c && SONS[nome]) SONS[nome](c);
    clearTimeout(desligar);
    desligar = setTimeout(silenciar, 1200);
  } catch {
    /* sem áudio: segue sem som */
  }
}
