/**
 * Retorno de acerto, de "quase" e de fim de lição pela vibração do celular.
 *
 * Os sons sintetizados (Web Audio) foram tirados: no Android, um som tocado
 * ocupa o áudio e o reconhecimento de voz para de entender a pessoa depois
 * da primeira fala.
 */

const VIBRAR = {
  certo: [40, 60, 40],
  quase: [80],
  toque: [15],
  fim: [60, 80, 60, 80, 120]
};

export function tocar(nome) {
  try {
    navigator.vibrate?.(VIBRAR[nome] || 0);
  } catch {
    /* aparelho sem vibração: segue */
  }
}
