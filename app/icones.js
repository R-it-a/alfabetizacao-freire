/**
 * Ícones desenhados em traço grosso, no espírito da xilogravura de cordel:
 * poucas linhas, tinta cheia. Substituem os emojis, que mudam de cara em
 * cada celular. Todos usam currentColor.
 */

const svg = (corpo, rotulo = '') =>
  `<svg viewBox="0 0 48 48" class="ico" ${rotulo ? `role="img" aria-label="${rotulo}"` : 'aria-hidden="true"'}
     fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${corpo}</svg>`;

export const ICONES = {
  microfone: svg(`
    <rect x="17" y="5" width="14" height="24" rx="7" fill="currentColor" stroke="none"/>
    <path d="M10 22c0 8 6 13 14 13s14-5 14-13"/><path d="M24 35v8M17 43h14"/>`),

  falar: svg(`
    <path d="M6 18h8l11-9v30l-11-9H6z" fill="currentColor"/>
    <path d="M32 17c3 2 3 12 0 14"/><path d="M37 12c6 5 6 19 0 24"/>`),

  lixeira: svg(`
    <path d="M9 13h30"/><path d="M19 13V8h10v5"/>
    <path d="M12 13l2 28h20l2-28" fill="currentColor" fill-opacity=".15"/><path d="M21 20v14M27 20v14"/>`),

  certo: svg('<path d="M9 25l10 10 20-22" stroke-width="5"/>'),
  errado: svg('<path d="M12 12l24 24M36 12L12 36" stroke-width="5"/>'),

  apagar: svg(`
    <path d="M17 10h23v28H17L5 24z" fill="currentColor" fill-opacity=".15"/><path d="M23 18l11 12M34 18L23 30"/>`),

  ideia: svg(`
    <path d="M24 5c-8 0-13 6-13 13 0 5 3 8 5 10 2 2 2 4 2 6h12c0-2 0-4 2-6 2-2 5-5 5-10 0-7-5-13-13-13z" fill="currentColor" fill-opacity=".15"/>
    <path d="M18 39h12M20 44h8"/>`),

  pasta: svg(`
    <path d="M5 12h14l4 5h20v24H5z" fill="currentColor" fill-opacity=".15"/><path d="M5 22h38"/>`),

  maos: svg(`
    <path d="M7 30c0-8 2-14 5-16 2 0 3 2 3 5v7"/><path d="M15 26V11c0-2 1-3 2-3s3 1 3 3v13"/>
    <path d="M20 24V8c0-2 1-3 2-3s3 1 3 3v17"/><path d="M25 25V12c0-2 1-3 3-3 1 0 2 1 2 3v17"/>
    <path d="M30 29l4-5c2-2 4-2 5 0 1 1 0 3-1 4l-7 10c-2 3-5 5-9 5h-4c-6 0-11-4-11-11"/>`),

  conversa: svg(`
    <path d="M6 9h26v17H17l-7 6v-6H6z" fill="currentColor" fill-opacity=".15"/>
    <path d="M36 17h6v16h-4v5l-6-5H20v-3"/>`),

  ouvido: svg(`
    <path d="M14 20c0-7 5-12 11-12s11 5 11 12c0 6-4 8-6 11s-2 9-8 9c-4 0-6-2-7-5"/>
    <path d="M20 21c0-3 2-6 5-6s5 3 5 6c0 3-3 4-3 7"/>`),

  aceno: svg(`
    <path d="M16 22l-5-6c-1-2 0-4 2-4 1 0 2 0 3 2l6 8"/><path d="M22 22l-8-12c-1-2 0-4 2-4s3 1 4 3l7 10"/>
    <path d="M27 18l-5-8c-1-2 0-4 2-4s3 1 4 3l6 10"/><path d="M34 19l-2-4c-1-2 0-4 2-4s3 1 4 3c3 7 4 14 0 20-4 6-13 7-18 2l-9-9c-1-2 0-4 2-4 1 0 2 0 3 1l4 4"/>
    <path d="M38 5c2 1 4 3 5 6M5 30c1 3 3 5 6 6"/>`),

  caderno: svg(`
    <path d="M10 6h24v36H10z" fill="currentColor" fill-opacity=".15"/><path d="M10 12H6M10 20H6M10 28H6M10 36H6"/>
    <path d="M17 15h11M17 22h11"/><path d="M40 14l3 3-15 20-5 2 1-5z" fill="currentColor"/>`),

  broto: svg(`
    <path d="M24 43V22"/><path d="M24 26c-10 0-15-6-15-14 9 0 15 5 15 14z" fill="currentColor" fill-opacity=".2"/>
    <path d="M24 22c0-8 5-13 14-13 0 8-5 13-14 13z" fill="currentColor"/><path d="M14 43h20"/>`),

  comecar: svg('<path d="M15 9l24 15-24 15z" fill="currentColor"/>'),
  voltar: svg('<path d="M30 10L16 24l14 14"/>'),
  seguir: svg('<path d="M18 10l14 14-14 14"/>')
};

export const icone = (nome) => ICONES[nome] || '';

/**
 * O Tijolinho, mascote do app: um tijolo, porque a gente constrói palavras
 * sílaba por sílaba, como uma parede. O estado (falando, feliz, comemora,
 * pensando) é uma classe no elemento que o contém, animada no CSS.
 */
export const MASCOTE = `
<svg class="tijolinho" viewBox="0 0 120 130" aria-hidden="true">
  <defs>
    <linearGradient id="tj-corpo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F58A52"/><stop offset="1" stop-color="#E05E2E"/>
    </linearGradient>
  </defs>
  <ellipse class="sombra" cx="60" cy="122" rx="34" ry="5" fill="#000" opacity=".12"/>
  <g class="bracos-baixo" stroke="#3A2A22" stroke-width="3" stroke-linejoin="round">
    <path d="M22 66 Q8 76 13 92 Q16 96 20 92 Q18 80 27 74z" fill="#E05E2E"/>
    <path d="M98 66 Q112 76 107 92 Q104 96 100 92 Q102 80 93 74z" fill="#E05E2E"/>
  </g>
  <g class="bracos-cima" stroke="#3A2A22" stroke-width="3" stroke-linejoin="round">
    <path d="M24 62 Q6 52 10 32 Q14 28 18 32 Q18 48 30 54z" fill="#E05E2E"/>
    <path d="M96 62 Q114 52 110 32 Q106 28 102 32 Q102 48 90 54z" fill="#E05E2E"/>
  </g>
  <g class="pernas" fill="#B9472A" stroke="#3A2A22" stroke-width="3">
    <rect x="38" y="98" width="15" height="20" rx="7"/><rect x="67" y="98" width="15" height="20" rx="7"/>
  </g>
  <g class="corpo" stroke="#3A2A22" stroke-width="3.5" stroke-linejoin="round">
    <rect x="18" y="24" width="84" height="80" rx="18" fill="url(#tj-corpo)"/>
    <path d="M20 50h80M20 78h80M50 26v24M80 50v28M44 78v24M84 78v24" stroke="#C94E22" stroke-width="2.5" opacity=".55"/>
    <path d="M30 32 Q34 28 46 29" fill="none" stroke="#FFD3B8" stroke-width="4" opacity=".9"/>
  </g>
  <g class="rosto">
    <path class="sobrancelha" d="M34 40 Q43 35 52 39 M68 39 Q77 35 86 40" fill="none" stroke="#3A2A22" stroke-width="3.5" stroke-linecap="round"/>
    <g class="olhos">
      <ellipse cx="44" cy="55" rx="11" ry="12" fill="#fff" stroke="#3A2A22" stroke-width="3"/>
      <ellipse cx="76" cy="55" rx="11" ry="12" fill="#fff" stroke="#3A2A22" stroke-width="3"/>
      <circle class="pupila" cx="46" cy="57" r="6" fill="#2A2A2A"/><circle class="pupila" cx="78" cy="57" r="6" fill="#2A2A2A"/>
      <circle cx="48.5" cy="54" r="2.2" fill="#fff"/><circle cx="80.5" cy="54" r="2.2" fill="#fff"/>
    </g>
    <circle cx="31" cy="72" r="5.5" fill="#FF9A9A" opacity=".75"/><circle cx="89" cy="72" r="5.5" fill="#FF9A9A" opacity=".75"/>
    <path class="boca" d="M48 72 Q60 86 72 72 Q60 78 48 72z" fill="#5A1E12" stroke="#3A2A22" stroke-width="3" stroke-linejoin="round"/>
    <path class="lingua" d="M54 77 Q60 82 66 77" fill="#FF7A7A" stroke="none"/>
  </g>
</svg>`;

ICONES.cadeado = svg(`
  <rect x="11" y="21" width="26" height="20" rx="4" fill="currentColor"/><path d="M17 21v-6a7 7 0 0 1 14 0v6"/>`);
ICONES.fogo = svg(`
  <path d="M24 44c-8 0-14-6-14-14 0-9 8-13 9-22 4 3 7 8 7 13 2-2 3-4 3-7 5 4 9 10 9 16 0 8-6 14-14 14z" fill="currentColor"/>`);
ICONES.fechar = svg('<path d="M13 13l22 22M35 13L13 35" stroke-width="4.5"/>');
ICONES.estrela = svg('<path d="M24 5l5.6 12 13 1.4-9.8 8.8 2.8 12.8L24 33.5 12.4 40l2.8-12.8L5.4 18.4l13-1.4z" fill="currentColor"/>');
