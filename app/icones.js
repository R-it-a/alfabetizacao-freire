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
 * O Calango, mascote do app: o lagartinho da caatinga que vive no sol.
 * O estado (falando, feliz, comemora, pensando) é uma classe no elemento que
 * o contém, animada no CSS: braços, boca, olhos e sobrancelhas mudam.
 */
export const MASCOTE = `
<svg class="mascote-svg" viewBox="0 0 140 150" aria-hidden="true">
  <defs>
    <linearGradient id="cl-pele" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9BD86A"/><stop offset="1" stop-color="#5FAE3A"/>
    </linearGradient>
    <linearGradient id="cl-barriga" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF1A8"/><stop offset="1" stop-color="#F2D45C"/>
    </linearGradient>
  </defs>
  <ellipse class="sombra" cx="70" cy="140" rx="40" ry="5.5" fill="#000" opacity=".12"/>
  <g stroke="#3A2A22" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
    <g class="rabo">
      <path d="M90 118 C 122 124 140 104 132 80 C 127 66 112 66 113 78 C 115 90 108 104 88 104 Z" fill="url(#cl-pele)"/>
      <path d="M118 86 l6 -3 M124 98 l6 0 M116 110 l5 4" stroke="#4E9A2E" stroke-width="2.5"/>
    </g>
    <g class="pernas">
      <path d="M48 124 Q40 134 50 136 L62 136 Q66 132 60 124 Z" fill="#5FAE3A"/>
      <path d="M80 124 Q74 132 78 136 L90 136 Q100 134 92 124 Z" fill="#5FAE3A"/>
      <path d="M50 136 v-4 M56 136 v-4 M84 136 v-4 M90 136 v-4" stroke-width="2.5"/>
    </g>
    <g class="corpo">
      <ellipse cx="70" cy="100" rx="31" ry="29" fill="url(#cl-pele)"/>
      <ellipse cx="70" cy="106" rx="19" ry="20" fill="url(#cl-barriga)"/>
      <path d="M56 98 Q70 102 84 98 M54 108 Q70 112 86 108 M57 118 Q70 121 83 118" fill="none" stroke="#D9B536" stroke-width="2.5"/>
    </g>
    <g class="bracos-baixo">
      <path d="M42 92 Q28 98 30 110 Q34 114 37 110 L36 104 Q40 100 46 100 Z" fill="#6DBB45"/>
      <path d="M98 92 Q112 98 110 110 Q106 114 103 110 L104 104 Q100 100 94 100 Z" fill="#6DBB45"/>
    </g>
    <g class="bracos-cima">
      <path d="M42 92 Q24 84 24 66 Q28 61 32 66 Q33 80 46 84 Z" fill="#6DBB45"/>
      <path d="M98 92 Q116 84 116 66 Q112 61 108 66 Q107 80 94 84 Z" fill="#6DBB45"/>
    </g>
    <path class="crista" d="M58 26 L63 14 L68 25 L74 12 L79 25 L85 16 L88 28 Z" fill="#F28C28"/>
    <g class="cabeca">
      <path d="M28 54 C 28 30 48 22 70 22 C 96 22 114 32 114 54 C 114 74 96 82 70 82 C 46 82 28 74 28 54 Z" fill="url(#cl-pele)"/>
      <circle cx="96" cy="30" r="3.5" fill="#4E9A2E" stroke="none"/><circle cx="104" cy="40" r="2.5" fill="#4E9A2E" stroke="none"/>
      <circle cx="40" cy="34" r="3" fill="#4E9A2E" stroke="none"/>
      <g class="olhos">
        <ellipse cx="50" cy="44" rx="14" ry="15" fill="#fff"/>
        <ellipse cx="90" cy="44" rx="14" ry="15" fill="#fff"/>
        <circle class="pupila" cx="53" cy="47" r="7.5" fill="#2A2A2A" stroke="none"/><circle class="pupila" cx="93" cy="47" r="7.5" fill="#2A2A2A" stroke="none"/>
        <circle cx="56" cy="43.5" r="2.8" fill="#fff" stroke="none"/><circle cx="96" cy="43.5" r="2.8" fill="#fff" stroke="none"/>
      </g>
      <path class="sobrancelha" d="M38 28 Q48 24 58 28 M82 28 Q92 24 102 28" fill="none" stroke-width="3.5"/>
      <circle cx="36" cy="64" r="6" fill="#FF9A9A" stroke="none" opacity=".7"/><circle cx="104" cy="64" r="6" fill="#FF9A9A" stroke="none" opacity=".7"/>
      <circle cx="64" cy="60" r="1.6" fill="#3A2A22" stroke="none"/><circle cx="76" cy="60" r="1.6" fill="#3A2A22" stroke="none"/>
      <g class="boca">
        <path d="M48 66 Q70 84 92 66 Q70 74 48 66 Z" fill="#5A1E12"/>
        <path d="M62 75 Q70 79 78 75 Q74 72 70 72 Q66 72 62 75 Z" fill="#FF7A8A" stroke="none"/>
      </g>
    </g>
    <circle cx="52" cy="88" r="3" fill="#4E9A2E" stroke="none"/><circle cx="92" cy="84" r="3.5" fill="#4E9A2E" stroke="none"/>
  </g>
</svg>`;

ICONES.cadeado = svg(`
  <rect x="11" y="21" width="26" height="20" rx="4" fill="currentColor"/><path d="M17 21v-6a7 7 0 0 1 14 0v6"/>`);
ICONES.fogo = svg(`
  <path d="M24 44c-8 0-14-6-14-14 0-9 8-13 9-22 4 3 7 8 7 13 2-2 3-4 3-7 5 4 9 10 9 16 0 8-6 14-14 14z" fill="currentColor"/>`);
ICONES.fechar = svg('<path d="M13 13l22 22M35 13L13 35" stroke-width="4.5"/>');
ICONES.estrela = svg('<path d="M24 5l5.6 12 13 1.4-9.8 8.8 2.8 12.8L24 33.5 12.4 40l2.8-12.8L5.4 18.4l13-1.4z" fill="currentColor"/>');
