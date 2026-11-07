// ==========================================
// 1. GENERIC BOOK COVERS & COLOR UTILS
// ==========================================
export interface GenericCoverColor {
  id: string;
  name: string;
  hex: string;
}

export const GENERIC_COVER_COLORS: GenericCoverColor[] = [
  { id: 'orange', name: 'Laranja', hex: '#F97316' }, // Padrão igual à imagem do usuário
  { id: 'amber', name: 'Âmbar', hex: '#F59E0B' },
  { id: 'yellow', name: 'Amarelo', hex: '#FACC15' },
  { id: 'lime', name: 'Lima', hex: '#84CC16' },
  { id: 'emerald', name: 'Esmeralda', hex: '#10B981' },
  { id: 'teal', name: 'Verde Petróleo', hex: '#0D9488' },
  { id: 'cyan', name: 'Ciano', hex: '#06B6D4' },
  { id: 'sky', name: 'Azul Céu', hex: '#38BDF8' },
  { id: 'blue', name: 'Azul', hex: '#2563EB' },
  { id: 'indigo', name: 'Índigo', hex: '#4F46E5' },
  { id: 'violet', name: 'Violeta', hex: '#7C3AED' },
  { id: 'purple', name: 'Roxo', hex: '#9333EA' },
  { id: 'pink', name: 'Rosa', hex: '#EC4899' },
  { id: 'rose', name: 'Coral Rose', hex: '#F43F5E' },
  { id: 'red', name: 'Vermelho', hex: '#DC2626' },
  { id: 'crimson', name: 'Bordô', hex: '#991B1B' },
  { id: 'darkblue', name: 'Azul Noite', hex: '#1E3A8A' },
  { id: 'darkgreen', name: 'Verde Escuro', hex: '#14532D' },
  { id: 'charcoal', name: 'Carvão', hex: '#1E293B' },
  { id: 'slate', name: 'Ardósia', hex: '#475569' },
  { id: 'cream', name: 'Creme', hex: '#FDE68A' },
  { id: 'mint', name: 'Menta', hex: '#A7F3D0' },
  { id: 'lavender', name: 'Lavanda', hex: '#DDD6FE' },
  { id: 'peach', name: 'Pêssego', hex: '#FED7AA' }
];

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const c = hex.replace('#', '');
  const r = (parseInt(c.substring(0, 2), 16) || 0) / 255;
  const g = (parseInt(c.substring(2, 4), 16) || 0) / 255;
  const b = (parseInt(c.substring(4, 6), 16) || 0) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = Math.round(h * 60);
  }
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
}

// Verifica se a cor é clara (perceived brightness) para definir texto escuro ou claro
export function isColorLight(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return brightness > 0.52;
}

// Gera tonalidades harmônicas mantendo a mesma cor (mesmo matiz/hue) do fundo
export function getCoverTones(hex: string): {
  isLight: boolean;
  textColor: string;
  gradStart: string;
  gradMid: string;
  gradEnd: string;
  iconHex: string;
} {
  const { h, s, l } = hexToHsl(hex);
  const isLight = isColorLight(hex);

  let textColor: string;
  let gradStart: string;
  const gradMid = hex;
  let gradEnd: string;
  let iconHex: string;

  if (l >= 72) {
    // Fundos muito claros (ex: creme, menta, lavanda, pêssego)
    gradStart = hslToHex((h - 8 + 360) % 360, Math.min(100, s + 6), Math.min(97, l + 10));
    gradEnd = hslToHex((h + 10) % 360, Math.min(100, s + 16), Math.max(48, l - 22));
    textColor = hslToHex(h, Math.min(100, Math.max(45, s + 15)), 18);
    iconHex = hslToHex(h, Math.min(100, Math.max(40, s + 10)), 44);
  } else if (isLight) {
    // Fundos vibrantes claros (ex: amarelo, lima, âmbar, azul céu, ciano)
    gradStart = hslToHex((h - 8 + 360) % 360, Math.min(100, s + 6), Math.min(92, l + 18));
    gradEnd = hslToHex((h + 10) % 360, Math.min(100, s + 8), Math.max(44, l - 18));
    textColor = hslToHex(h, Math.min(100, Math.max(50, s + 10)), 14);
    iconHex = hslToHex(h, Math.min(100, Math.max(45, s)), 33);
  } else if (l <= 32) {
    // Fundos muito escuros (ex: verde escuro, carvão)
    gradStart = hslToHex((h - 8 + 360) % 360, Math.min(100, s + 10), Math.min(62, l + 22));
    gradEnd = hslToHex((h + 8) % 360, Math.min(100, s + 6), Math.max(6, l - 12));
    textColor = hslToHex(h, Math.min(100, Math.max(38, s + 15)), 86);
    iconHex = hslToHex(h, Math.min(100, Math.max(35, s + 10)), 56);
  } else {
    // Fundos médios/vibrantes escuros (ex: laranja, azul, roxo, esmeralda, vermelho, azul noite, ardósia)
    gradStart = hslToHex((h - 8 + 360) % 360, Math.min(100, s + 6), Math.min(68, l + 16));
    gradEnd = hslToHex((h + 10) % 360, Math.min(100, s + 8), Math.max(14, l - 22));
    textColor = hslToHex(h, Math.min(100, Math.max(38, s + 12)), 88);
    iconHex = hslToHex(h, Math.min(100, Math.max(35, s)), 66);
  }

  return { isLight, textColor, gradStart, gradMid, gradEnd, iconHex };
}

// ==========================================
// 2. CLASSIC SOCIAL NETWORK AUTHOR AVATARS
// ==========================================
export function getAuthorInitials(name: string): string {
  if (!name || typeof name !== 'string') return '';
  const cleanName = name.replace(/[()[\]{}<>"'`]/g, ' ').trim();
  const words = cleanName.split(/\s+/).filter(w => /\p{L}|\p{N}/u.test(w));
  if (words.length === 0) return '';

  const getFirstLetter = (word: string) => {
    const match = word.match(/\p{L}|\p{N}/u);
    return match ? match[0].toUpperCase() : '';
  };

  if (words.length === 1) {
    return getFirstLetter(words[0]);
  }

  const first = getFirstLetter(words[0]);
  const last = getFirstLetter(words[words.length - 1]);
  return `${first}${last}`;
}

export function getDefaultAuthorColor(nameOrId: string): string {
  let hash = 0;
  for (let i = 0; i < nameOrId.length; i++) {
    hash = nameOrId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GENERIC_COVER_COLORS.length;
  return GENERIC_COVER_COLORS[index].hex;
}

export function getGenericAuthorColor(pictureUrl?: string, name?: string): string {
  if (pictureUrl && pictureUrl.startsWith('data:image/svg')) {
    try {
      const decoded = decodeURIComponent(pictureUrl);
      const dataColorMatch = decoded.match(/data-color=["'](#[0-9a-fA-F]{6})["']/i);
      if (dataColorMatch) return dataColorMatch[1];
    } catch {}
  }
  return getDefaultAuthorColor(name || '');
}

export function getAuthorAvatar(nameOrId: string, colorOrIndex?: string | number): string {
  let bgHex = getDefaultAuthorColor(nameOrId);
  if (typeof colorOrIndex === 'string' && colorOrIndex.startsWith('#')) {
    bgHex = colorOrIndex;
  } else if (typeof colorOrIndex === 'number') {
    bgHex = GENERIC_COVER_COLORS[Math.abs(colorOrIndex) % GENERIC_COVER_COLORS.length].hex;
  }

  const { textColor, gradStart, gradMid, gradEnd } = getCoverTones(bgHex);
  const initials = getAuthorInitials(nameOrId);
  const fontSize = initials.length > 1 ? 44 : 52;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" data-avatar-v="4" data-color="${bgHex}">
  <defs>
    <linearGradient id="g_auth" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStart}"/>
      <stop offset="50%" stop-color="${gradMid}"/>
      <stop offset="100%" stop-color="${gradEnd}"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" fill="url(#g_auth)"/>
  ${initials ? `
  <text 
    x="60" 
    y="61" 
    text-anchor="middle" 
    dominant-baseline="central" 
    font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
    font-size="${fontSize}" 
    font-weight="700" 
    fill="${textColor}" 
    fill-opacity="0.96" 
    letter-spacing="0.5"
  >${initials}</text>
  ` : `
  <g>
    <!-- Centered, elegant smaller default avatar silhouette fallback -->
    <circle cx="60" cy="46" r="10.5" fill="${textColor}" fill-opacity="0.95"/>
    <path d="M 43 83 C 43 72, 49 67, 60 67 C 71 67, 77 72, 77 83 C 77 87, 74 89, 69 89 L 51 89 C 46 89, 43 87, 43 83 Z" fill="${textColor}" fill-opacity="0.95"/>
  </g>
  `}
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getEffectiveAuthorAvatar(name?: string, picture?: string): string {
  if (picture && !picture.startsWith('data:image/svg+xml')) {
    return picture;
  }
  const savedColor = picture ? getGenericAuthorColor(picture, name) : undefined;
  return getAuthorAvatar(name || '', savedColor);
}

export function getGenericCoverColor(coverUrl?: string, title?: string, author?: string): string {
  if (coverUrl && coverUrl.startsWith('data:image/svg')) {
    try {
      const decoded = decodeURIComponent(coverUrl);
      const dataColorMatch = decoded.match(/data-color=["'](#[0-9a-fA-F]{6})["']/i);
      if (dataColorMatch) return dataColorMatch[1];
      const rectMatch = decoded.match(/<rect[^>]*fill=["'](#[0-9a-fA-F]{6})/i);
      if (rectMatch) return rectMatch[1];
    } catch {}
  }
  if (title || author) {
    let hash = 0;
    const str = (title || '') + (author || '');
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % GENERIC_COVER_COLORS.length;
    return GENERIC_COVER_COLORS[index].hex;
  }
  return GENERIC_COVER_COLORS[0].hex;
}

// Conversões para oklch: ajustar a luminosidade mantendo o tom, sem desvios de cor
function hexToOklch(hex: string): [number, number, number] {
  const lin = [1, 3, 5].map(i => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = lin;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, Math.hypot(A, B), Math.atan2(B, A)];
}

function oklchToLinear(L: number, C: number, H: number): [number, number, number] {
  const A = C * Math.cos(H);
  const B = C * Math.sin(H);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}

function linearToHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(v => {
    const c = Math.min(1, Math.max(0, v));
    const e = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(e * 255).toString(16).padStart(2, '0');
  }).join('');
}

const luminance = (rgb: [number, number, number]) => {
  const [r, g, b] = rgb.map(v => Math.min(1, Math.max(0, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const MAX_ACCENT_CHROMA = 0.17;
const MIN_ACCENT_CHROMA = 0.04;
const MIN_ACCENT_CONTRAST = 3;

// Destaque tirado da capa: sem croma suficiente (capa preta e branca) vale o laranja do player. A croma tem um teto,
// para nenhuma capa gerar um destaque berrante, e a luminosidade muda até dar contraste com o fundo da tela
export function getBookHighlightTheme(rawHex: string, isDark: boolean): { hex: string; rgb: string } {
  const fallback = isDark ? '#FF9F0A' : '#FF9500';
  const valid = /^#?[0-9a-f]{6}$/i.test(rawHex || '');
  const source = valid ? `#${rawHex.replace('#', '')}` : fallback;
  let [L, C, H] = hexToOklch(source);
  let finalHex = fallback;
  if (C >= MIN_ACCENT_CHROMA) {
    C = Math.min(C, MAX_ACCENT_CHROMA);
    const contrast = (lum: number) => (isDark ? (lum + 0.05) / 0.05 : 1.05 / (lum + 0.05));
    for (let i = 0; i < 60 && contrast(luminance(oklchToLinear(L, C, H))) < MIN_ACCENT_CONTRAST; i++) L += isDark ? 0.01 : -0.01;
    finalHex = linearToHex(oklchToLinear(L, C, H));
  }
  const rgb = [1, 3, 5].map(i => parseInt(finalHex.slice(i, i + 2), 16)).join(', ');
  return { hex: finalHex, rgb };
}

function wrapTitleForCover(title: string, maxCharsPerLine = 18, maxLines = 3): string[] {
  const clean = (title || 'Audiobook').trim();
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let cur = '';

  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if ((cur + ' ' + w).length <= maxCharsPerLine) {
      cur += ' ' + w;
    } else {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) {
        break;
      }
    }
  }
  if (cur) {
    lines.push(cur);
  }
  if (lines.length === maxLines && words.length > lines.flatMap(l => l.split(' ')).length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\.*$/, '') + '...';
  }
  return lines;
}

export function getGenericBookCover(title?: string, author?: string, colorOrIndex?: string | number): string {
  let bgHex = '#F97316';

  if (typeof colorOrIndex === 'string' && /^#[0-9a-fA-F]{6}$/.test(colorOrIndex)) {
    bgHex = colorOrIndex;
  } else if (typeof colorOrIndex === 'number' && !isNaN(colorOrIndex)) {
    bgHex = GENERIC_COVER_COLORS[Math.abs(colorOrIndex) % GENERIC_COVER_COLORS.length].hex;
  } else {
    let hash = 0;
    const str = (title || '') + (author || '');
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % GENERIC_COVER_COLORS.length;
    bgHex = GENERIC_COVER_COLORS[index].hex;
  }

  const { isLight, textColor, gradStart, gradMid, gradEnd, iconHex } = getCoverTones(bgHex);
  const lines = wrapTitleForCover(title || 'Audiobook', 18, 3);

  const fontSize = lines.length >= 3 ? 32 : 36;
  const lineHeight = fontSize + 10;

  // Mesma distância da borda superior para o topo do título e da borda inferior para a base do nome do autor
  const edgeMargin = 100;
  const titleCapHeight = Math.round(fontSize * 0.72);
  const startY = edgeMargin + titleCapHeight;
  const authorY = 800 - edgeMargin;

  const escapeXml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const titleSvg = lines.map((line, idx) => {
    const escaped = escapeXml(line);
    return `<text x="250" y="${Math.round(startY + idx * lineHeight)}" text-anchor="middle" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="800" fill="${textColor}">${escaped}</text>`;
  }).join('\n  ');

  const cleanAuthor = (author && author.trim().length > 0 ? author.trim() : 'Autor Desconhecido');
  const dispAuthor = cleanAuthor.length > 28 ? cleanAuthor.slice(0, 26) + '...' : cleanAuthor;
  const escapedAuthor = escapeXml(dispAuthor);

  const iconOpacity = isLight ? '0.18' : '0.22';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 800" width="500" height="800" data-cover-v="4" data-color="${bgHex}">
  <defs>
    <linearGradient id="bg_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStart}"/>
      <stop offset="50%" stop-color="${gradMid}"/>
      <stop offset="100%" stop-color="${gradEnd}"/>
    </linearGradient>
  </defs>

  <!-- Fundo com gradiente -->
  <rect width="500" height="800" fill="url(#bg_grad)"/>

  <!-- Ícone genérico de livro com zoom enorme no fundo, parcialmente cortado pela borda, transparente e atrás do texto -->
  <g transform="translate(-20, 16) scale(32)" opacity="${iconOpacity}" stroke="${iconHex}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="${iconHex}" fill-opacity="0.32"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="${iconHex}" fill-opacity="0.32"/>
    <line x1="5" y1="7" x2="9" y2="7" stroke="${iconHex}" stroke-width="1.2"/>
    <line x1="5" y1="11" x2="9" y2="11" stroke="${iconHex}" stroke-width="1.2"/>
    <line x1="15" y1="7" x2="19" y2="7" stroke="${iconHex}" stroke-width="1.2"/>
    <line x1="15" y1="11" x2="19" y2="11" stroke="${iconHex}" stroke-width="1.2"/>
  </g>

  <!-- Título centralizado no topo -->
  ${titleSvg}

  <!-- Nome do autor centralizado na base (mesma distância da borda inferior que o título da borda superior) -->
  <text x="250" y="${authorY}" text-anchor="middle" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="800" fill="${textColor}">
    ${escapedAuthor}
  </text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Paleta da capa: agrupa os pixels por matiz (24 faixas) e escolhe a cor dominante mais marcante (quantidade
// x saturação), em vez da média de todos os pixels (que transformava capas de duas cores em um tom
// acinzentado). Também devolve uma segunda cor marcante, bem diferente da primeira, quando houver.
// Capas quase sem cor (preto e branco, cinzas) ficam com o tom neutro médio.
export function extractCoverPalette(data: Uint8ClampedArray): { primary: string; secondary?: string } | null {
  const BINS = 24;
  const bins = Array.from({ length: BINS }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  let nr = 0, ng = 0, nb = 0, nw = 0, vividWeight = 0, totalWeight = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 510;
    const d = (max - min) / 255;
    const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    totalWeight += 1;
    nr += r; ng += g; nb += b; nw += 1;
    if (sat < 0.18 || l < 0.1 || l > 0.93) continue;
    let h = 0;
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    h = (h * 60 + 360) % 360;
    const w = 0.4 + sat * 1.6;
    const bin = bins[Math.floor(h / (360 / BINS)) % BINS];
    bin.w += w; bin.r += r * w; bin.g += g * w; bin.b += b * w;
    vividWeight += 1;
  }
  if (totalWeight === 0) return null;
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  // Pouca cor na capa: o tom neutro médio
  if (vividWeight / totalWeight < 0.06) return { primary: `#${toHex(nr / nw)}${toHex(ng / nw)}${toHex(nb / nw)}` };
  // Junta cada faixa com as vizinhas (cores parecidas ficam no mesmo grupo)
  const score = bins.map((_, i) => bins[i].w + 0.5 * (bins[(i + BINS - 1) % BINS].w + bins[(i + 1) % BINS].w));
  const colorOf = (i: number) => {
    const group = [bins[(i + BINS - 1) % BINS], bins[i], bins[(i + 1) % BINS]];
    const w = group.reduce((acc, x) => acc + x.w, 0) || 1;
    return `#${toHex(group.reduce((a, x) => a + x.r, 0) / w)}${toHex(group.reduce((a, x) => a + x.g, 0) / w)}${toHex(group.reduce((a, x) => a + x.b, 0) / w)}`;
  };
  const order = score.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]);
  const first = order[0][1];
  const primary = colorOf(first);
  // Segunda cor: pelo menos 60° de distância e com presença relevante (>= 18% da principal)
  const dist = (a: number, b: number) => { const d = Math.abs(a - b) % BINS; return Math.min(d, BINS - d) * (360 / BINS); };
  const second = order.find(([v, i]) => i !== first && dist(i, first) >= 60 && v >= order[0][0] * 0.18);
  return { primary, secondary: second ? colorOf(second[1]) : undefined };
}
