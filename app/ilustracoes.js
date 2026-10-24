/**
 * Ilustrações das telas: cenas chapadas e coloridas, com contorno, no lugar
 * dos ícones soltos. Cada uma fica sobre uma mancha de cor.
 * Paleta: tijolo, ouro, azul, verde, laranja e pele.
 */

const C = {
  contorno: '#3A2A22',
  tijolo: '#E8693B',
  tijoloEscuro: '#B9472A',
  ouro: '#FFC233',
  ouroEscuro: '#D99A00',
  azul: '#2F6FEB',
  azulClaro: '#BFD3FB',
  verde: '#43B05C',
  verdeClaro: '#BFE8C8',
  laranja: '#F28C28',
  pele: '#C98A5E',
  peleEscura: '#A86B43',
  branco: '#FFFFFF',
  creme: '#FFF5D6'
};

const cena = (fundo, corpo, rotulo) => `
<svg class="ilustra" viewBox="0 0 200 150" role="img" aria-label="${rotulo}">
  <path d="M30 120 C 10 80, 40 25, 95 22 C 155 18, 195 55, 182 100 C 172 135, 120 142, 80 138 C 50 135, 38 128, 30 120z" fill="${fundo}"/>
  <g stroke="${C.contorno}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${corpo}</g>
</svg>`;

export const ILUSTRACOES = {
  // a louça de barro das cenas de cultura de Angicos
  cultura: cena(C.creme, `
    <ellipse cx="100" cy="128" rx="58" ry="7" fill="#000" opacity=".08" stroke="none"/>
    <path d="M70 70 Q62 98 78 122 L122 122 Q138 98 130 70 Z" fill="${C.tijolo}"/>
    <path d="M66 62 H134 Q138 62 136 70 H64 Q62 62 66 62z" fill="${C.tijoloEscuro}"/>
    <path d="M74 92 Q100 100 126 92" fill="none" stroke="${C.ouro}" stroke-width="4"/>
    <path d="M77 104 Q100 111 123 104" fill="none" stroke="${C.ouro}" stroke-width="4"/>
    <path d="M148 122 V88" fill="none"/>
    <path d="M148 98 C 136 98 132 88 132 80 C 142 80 148 86 148 98z" fill="${C.verde}"/>
    <path d="M148 92 C 160 92 166 82 166 72 C 154 72 148 80 148 92z" fill="${C.verde}"/>
    <circle cx="48" cy="44" r="12" fill="${C.ouro}"/>
    <path d="M48 24v-6M48 70v-6M28 44h-6M74 44h-6M34 30l-4-4M66 58l4 4M34 58l-4 4M66 30l4-4" stroke="${C.ouroEscuro}"/>`, 'Pote de barro, planta e sol'),

  comida: cena(C.verdeClaro, `
    <ellipse cx="100" cy="126" rx="62" ry="7" fill="#000" opacity=".08" stroke="none"/>
    <ellipse cx="100" cy="104" rx="62" ry="18" fill="${C.branco}"/>
    <ellipse cx="100" cy="100" rx="44" ry="11" fill="#F1F1F1"/>
    <path d="M70 98 Q78 78 96 82 Q100 70 114 76 Q132 76 130 98 Z" fill="${C.ouro}"/>
    <circle cx="88" cy="90" r="5" fill="${C.tijolo}"/><circle cx="112" cy="86" r="5" fill="${C.verde}"/>
    <path d="M104 94 q6 -6 12 0" fill="none" stroke="${C.tijoloEscuro}"/>
    <path d="M30 70 V122 M24 70 V86 Q30 92 36 86 V70" fill="none"/>
    <path d="M170 70 Q180 86 170 98 V122" fill="none"/><ellipse cx="170" cy="82" rx="6" ry="12" fill="${C.azulClaro}"/>
    <path d="M86 62 q-6 -8 0 -16 M100 58 q-6 -8 0 -16 M114 62 q-6 -8 0 -16" fill="none" stroke="${C.laranja}"/>`, 'Prato de comida'),

  conversa: cena(C.azulClaro, `
    <path d="M30 40 H112 Q120 40 120 48 V82 Q120 90 112 90 H62 L46 104 L48 90 H30 Q22 90 22 82 V48 Q22 40 30 40z" fill="${C.branco}"/>
    <circle cx="50" cy="65" r="5" fill="${C.azul}"/><circle cx="71" cy="65" r="5" fill="${C.azul}"/><circle cx="92" cy="65" r="5" fill="${C.azul}"/>
    <path d="M96 76 H170 Q178 76 178 84 V112 Q178 120 170 120 H158 L160 134 L144 120 H96 Q88 120 88 112 V84 Q88 76 96 76z" fill="${C.ouro}"/>
    <path d="M133 108 c-14 -8 -16 -20 -7 -22 c4 -1 7 2 7 5 c0 -3 3 -6 7 -5 c9 2 7 14 -7 22z" fill="${C.tijolo}"/>`, 'Conversa'),

  ouvido: cena(C.creme, `
    <path d="M86 32 C 116 26 140 48 136 78 C 133 98 116 102 112 116 C 108 132 92 138 80 128 C 72 121 76 110 84 108" fill="${C.pele}"/>
    <path d="M96 58 C 108 54 118 64 114 76 C 111 84 102 84 102 94" fill="none" stroke="${C.peleEscura}" stroke-width="4"/>
    <path d="M150 52 q12 20 0 40 M164 42 q20 30 0 60" fill="none" stroke="${C.azul}" stroke-width="5"/>
    <path d="M50 60 h16 M44 78 h22 M50 96 h16" stroke="${C.laranja}" stroke-width="5"/>`, 'Ouvido escutando'),

  caderno: cena(C.azulClaro, `
    <ellipse cx="100" cy="130" rx="60" ry="6" fill="#000" opacity=".08" stroke="none"/>
    <path d="M40 34 H100 V124 H40 Q34 124 34 118 V40 Q34 34 40 34z" fill="${C.branco}"/>
    <path d="M100 34 H160 Q166 34 166 40 V118 Q166 124 160 124 H100z" fill="${C.branco}"/>
    <path d="M48 54 H90 M48 70 H90 M48 86 H90 M48 102 H80 M110 54 H152 M110 70 H152 M110 86 H140" stroke="${C.azulClaro}" stroke-width="3"/>
    <path d="M50 52 l6 -10 l6 10 M53 47 h6 M70 42 v10 h8" fill="none" stroke="${C.azul}"/>
    <path d="M100 34 V124" stroke-width="3"/>
    <g transform="rotate(35 150 70)"><rect x="140" y="20" width="16" height="80" rx="3" fill="${C.ouro}"/>
      <path d="M140 100 L148 118 L156 100z" fill="${C.creme}"/><path d="M145 110 L148 118 L151 110z" fill="${C.contorno}"/>
      <rect x="140" y="14" width="16" height="10" rx="3" fill="${C.tijolo}"/></g>`, 'Caderno e lápis'),

  aceno: cena(C.creme, `
    <circle cx="100" cy="92" r="40" fill="${C.ouro}"/>
    <path d="M100 30 v-12 M100 166 v-12 M38 92 h-12 M174 92 h-12 M56 48 l-8 -8 M144 48 l8 -8" stroke="${C.ouroEscuro}" stroke-width="4"/>
    <circle cx="86" cy="86" r="5" fill="${C.contorno}" stroke="none"/><circle cx="114" cy="86" r="5" fill="${C.contorno}" stroke="none"/>
    <path d="M84 102 Q100 116 116 102" fill="none" stroke-width="4"/>
    <circle cx="74" cy="100" r="6" fill="#F7A0A0" stroke="none" opacity=".8"/><circle cx="126" cy="100" r="6" fill="#F7A0A0" stroke="none" opacity=".8"/>`, 'Sol sorrindo'),

  trofeu: cena(C.creme, `
    <ellipse cx="100" cy="132" rx="46" ry="6" fill="#000" opacity=".08" stroke="none"/>
    <path d="M66 34 H134 V58 Q134 92 100 96 Q66 92 66 58z" fill="${C.ouro}"/>
    <path d="M66 42 H48 Q44 70 70 74 M134 42 H152 Q156 70 130 74" fill="none" stroke-width="5"/>
    <path d="M92 96 H108 V112 H92z" fill="${C.ouroEscuro}"/>
    <path d="M74 112 H126 V128 H74z" fill="${C.tijolo}"/>
    <path d="M100 46 l5 10 11 1.5 -8 7.5 2 11 -10 -5.5 -10 5.5 2 -11 -8 -7.5 11 -1.5z" fill="${C.branco}"/>
    <path d="M40 30 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1z M164 26 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1z" fill="${C.azul}" stroke="none"/>`, 'Troféu'),

  // as cenas da fase de motivação (natureza e cultura), descritas no documento 01
  natureza: cena(C.verdeClaro, `
    <circle cx="150" cy="44" r="13" fill="${C.ouro}"/>
    <path d="M150 22v-6M150 72v-6M128 44h-6M178 44h-6" stroke="${C.ouroEscuro}"/>
    <path d="M20 110 L62 56 L88 88 L104 70 L140 110z" fill="#9BB8A0"/>
    <path d="M70 124 V92" stroke-width="5" fill="none" stroke="${C.peleEscura}"/>
    <circle cx="70" cy="78" r="22" fill="${C.verde}"/><circle cx="56" cy="88" r="12" fill="${C.verde}"/><circle cx="86" cy="88" r="12" fill="${C.verde}"/>
    <path d="M100 126 Q130 112 182 118 L182 128 Q140 124 100 132z" fill="${C.azul}"/>
    <ellipse cx="126" cy="122" rx="14" ry="8" fill="#B8A898"/>`, 'Árvore, montanha, rio e sol'),

  arco: cena(C.creme, `
    <ellipse cx="100" cy="132" rx="56" ry="6" fill="#000" opacity=".08" stroke="none"/>
    <path d="M66 26 Q30 78 66 130" fill="none" stroke="${C.peleEscura}" stroke-width="7"/>
    <path d="M66 26 L66 130" fill="none" stroke-width="2"/>
    <path d="M60 78 H168" stroke-width="4" fill="none"/>
    <path d="M168 78 l-14 -9 v18z" fill="${C.contorno}"/>
    <path d="M60 78 l-10 -10 h10 l8 10 l-8 10 h-10z" fill="${C.tijolo}"/>
    <path d="M128 40 q14 -14 26 -4 q-10 4 -14 18 q-6 -10 -12 -14z" fill="${C.ouro}"/>
    <path d="M140 54 V30" fill="none" stroke-width="2"/>`, 'Arco e flecha'),

  espingarda: cena(C.azulClaro, `
    <ellipse cx="100" cy="132" rx="60" ry="6" fill="#000" opacity=".08" stroke="none"/>
    <path d="M30 94 L62 80 L170 66 L172 74 L76 92 L64 108 L40 112z" fill="${C.peleEscura}"/>
    <path d="M90 80 L172 68 L172 74 L92 86z" fill="#5B6670"/>
    <path d="M86 90 q4 10 -4 12" fill="none"/>
    <path d="M60 34 Q100 18 140 34 Q100 42 60 34z" fill="${C.pele}"/>
    <path d="M80 34 Q80 14 100 14 Q120 14 120 34" fill="${C.pele}"/>
    <path d="M82 28 H118" stroke="${C.tijolo}" stroke-width="4"/>`, 'Espingarda e chapéu de caçador'),

  gato: cena(C.creme, `
    <ellipse cx="100" cy="132" rx="62" ry="6" fill="#000" opacity=".08" stroke="none"/>
    <path d="M40 120 Q34 84 62 78 L58 60 L72 72 L88 70 L96 56 L100 76 Q108 96 96 120z" fill="${C.laranja}"/>
    <path d="M96 116 Q122 112 116 92" fill="none" stroke="${C.laranja}" stroke-width="8"/>
    <circle cx="78" cy="86" r="3.5" fill="${C.contorno}" stroke="none"/><circle cx="92" cy="86" r="3.5" fill="${C.contorno}" stroke="none"/>
    <path d="M60 100 h-10 M60 104 l-9 4" stroke-width="2" fill="none"/>
    <path d="M136 120 Q134 102 150 100 Q166 100 168 116 Q168 122 160 122z" fill="#B8A898"/>
    <circle cx="146" cy="98" r="6" fill="#B8A898"/><circle cx="158" cy="108" r="2" fill="${C.contorno}" stroke="none"/>
    <path d="M136 118 Q122 124 118 132" fill="none" stroke-width="2"/>`, 'Gato e rato'),

  cantadores: cena(C.verdeClaro, `
    <ellipse cx="100" cy="132" rx="62" ry="6" fill="#000" opacity=".08" stroke="none"/>
    <path d="M52 120 Q30 120 32 100 Q34 86 48 88 Q52 76 64 80 Q80 84 76 102 Q74 120 52 120z" fill="${C.ouro}"/>
    <circle cx="54" cy="102" r="7" fill="${C.contorno}" stroke="none"/>
    <path d="M70 90 L118 40" stroke-width="6" fill="none" stroke="${C.peleEscura}"/>
    <path d="M114 36 l10 -8 l6 6 l-8 10z" fill="${C.peleEscura}"/>
    <rect x="126" y="86" width="48" height="34" rx="6" fill="${C.tijolo}"/>
    <circle cx="142" cy="103" r="9" fill="${C.creme}"/><path d="M158 96 h10 M158 104 h10 M158 112 h10" stroke-width="2.5"/>
    <path d="M134 86 L162 64" stroke-width="2.5" fill="none"/>
    <path d="M140 48 v-14 l12 -3 v14" fill="none" stroke="${C.azul}" stroke-width="3"/>
    <circle cx="137" cy="48" r="4" fill="${C.azul}" stroke="none"/><circle cx="149" cy="45" r="4" fill="${C.azul}" stroke="none"/>`, 'Viola e rádio'),

  // tela inicial: uma parede de tijolos sendo construída
  parede: `
<svg class="ilustra-parede" viewBox="0 0 120 90" aria-hidden="true">
  <g stroke="#2F8A45" stroke-width="2.5" stroke-linejoin="round">
    <rect x="10" y="62" width="32" height="18" rx="3" fill="#E8693B"/><rect x="44" y="62" width="32" height="18" rx="3" fill="#E8693B"/>
    <rect x="78" y="62" width="32" height="18" rx="3" fill="#E8693B"/>
    <rect x="27" y="42" width="32" height="18" rx="3" fill="#F4935F"/><rect x="61" y="42" width="32" height="18" rx="3" fill="#E8693B"/>
    <rect x="44" y="12" width="32" height="18" rx="3" fill="#FFC233" transform="rotate(-12 60 21)"/>
  </g>
  <path d="M84 20 l4 -8 M92 26 l8 -4 M90 34 l8 2" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
</svg>`
};

export const ilustracao = (nome) => `<div class="cena-ilustrada">${ILUSTRACOES[nome] || ''}</div>`;
