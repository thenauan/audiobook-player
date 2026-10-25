import React from 'react';
import { 
  Heart, BookOpen, Sparkles, Compass, Eye, User, Ghost, Sun, 
  Globe
} from 'lucide-react';
import type { Chapter, TranscriptLine, TranscriptWord } from './data';
import { resolveGenreAndSubgenre, GENRE_HIERARCHY } from './genreData';
import { autoCropImageToEbookCover } from './imageProcessing';
import { normalizeAudiobookLanguage } from './translations';

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

export function getBookHighlightTheme(rawHex: string, isDark: boolean): { hex: string; rgb: string } {
  const clean = (rawHex || '#F97316').replace('#', '');
  const { h, s, l } = hexToHsl(clean.length === 6 ? `#${clean}` : '#F97316');
  let finalHex = clean.length === 6 ? `#${clean}` : '#F97316';

  if (isDark) {
    if (l < 46) {
      finalHex = hslToHex(h, Math.max(s, 45), Math.min(68, Math.max(56, l + 26)));
    }
  } else {
    if (l > 48) {
      finalHex = hslToHex(h, Math.max(s, 55), Math.max(32, Math.min(42, l - 25)));
    }
  }

  const c = finalHex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return { hex: finalHex, rgb: `${r}, ${g}, ${b}` };
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

// ==========================================
// 3. GENRE THEMES & ICONS
// ==========================================
export interface GenreTheme {
  name: string;
  gradient: string;
  accent: string;
  icon: React.ReactNode;
  description: string;
}

export const GENRE_THEMES: Record<string, GenreTheme> = {
  'ficção': {
    name: 'Ficção',
    gradient: 'from-blue-600 via-indigo-600 to-violet-700',
    accent: '#3b82f6',
    icon: <Compass size={38} className="text-white drop-shadow-md" />,
    description: 'Mundos imaginários, romances, aventuras e universos fascinantes'
  },
  'não ficção': {
    name: 'Não ficção',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    accent: '#10b981',
    icon: <Globe size={38} className="text-white drop-shadow-md" />,
    description: 'História, biografias, filosofia, ciência e tecnologia'
  },
  'literatura': {
    name: 'Literatura',
    gradient: 'from-amber-600 via-orange-600 to-rose-700',
    accent: '#d97706',
    icon: <BookOpen size={38} className="text-white drop-shadow-md" />,
    description: 'Grandes clássicos, poesias, teatro e ensaios consagrados'
  },
  'infantil e juvenil': {
    name: 'Infantil e Juvenil',
    gradient: 'from-pink-500 via-rose-500 to-purple-600',
    accent: '#ec4899',
    icon: <Sparkles size={38} className="text-white drop-shadow-md" />,
    description: 'Narrativas infantis, contos mágicos e literatura jovem'
  },
  'outros': {
    name: 'Outros',
    gradient: 'from-purple-600 via-violet-600 to-indigo-800',
    accent: '#8b5cf6',
    icon: <Sun size={38} className="text-white drop-shadow-md" />,
    description: 'Humor, religião, autoajuda e desenvolvimento pessoal'
  },
  'desconhecido': {
    name: 'Desconhecido',
    gradient: 'from-slate-700 via-gray-700 to-zinc-800',
    accent: '#64748b',
    icon: <Ghost size={38} className="text-white drop-shadow-md" />,
    description: 'Audiobooks com gênero não categorizado'
  },
  'romance': {
    name: 'Romance',
    gradient: 'from-rose-600 via-pink-600 to-red-500',
    accent: '#f43f5e',
    icon: <Heart size={38} className="text-white drop-shadow-md" />,
    description: 'Histórias de amor, paixão e relacionamentos'
  },
  'clássicos': {
    name: 'Clássicos',
    gradient: 'from-amber-700 via-yellow-700 to-amber-900',
    accent: '#d97706',
    icon: <BookOpen size={38} className="text-white drop-shadow-md" />,
    description: 'Obras-primas atemporais da literatura'
  },
  'fábula': {
    name: 'Fábula',
    gradient: 'from-purple-700 via-indigo-600 to-violet-900',
    accent: '#8b5cf6',
    icon: <Sparkles size={38} className="text-white drop-shadow-md" />,
    description: 'Contos mágicos, alegorias e ensinamentos'
  },
  'aventura': {
    name: 'Aventura',
    gradient: 'from-emerald-700 via-teal-700 to-green-900',
    accent: '#10b981',
    icon: <Globe size={38} className="text-white drop-shadow-md" />,
    description: 'Expedições, jornadas e desafios épicos'
  },
  'mistério': {
    name: 'Mistério',
    gradient: 'from-slate-800 via-violet-950 to-zinc-900',
    accent: '#6366f1',
    icon: <Eye size={38} className="text-white drop-shadow-md" />,
    description: 'Enigmas, suspense policial e reviravoltas'
  },
  'biografia': {
    name: 'Biografia',
    gradient: 'from-orange-600 via-amber-700 to-rose-800',
    accent: '#f97316',
    icon: <User size={38} className="text-white drop-shadow-md" />,
    description: 'Memórias e histórias de grandes personalidades'
  },
  'terror': {
    name: 'Terror',
    gradient: 'from-red-950 via-zinc-900 to-neutral-950',
    accent: '#ef4444',
    icon: <Ghost size={38} className="text-white drop-shadow-md" />,
    description: 'Histórias assustadoras, horror e o desconhecido'
  },
  'autoajuda': {
    name: 'Autoajuda',
    gradient: 'from-teal-600 via-emerald-600 to-cyan-700',
    accent: '#14b8a6',
    icon: <Sun size={38} className="text-white drop-shadow-md" />,
    description: 'Desenvolvimento pessoal, foco e bem-estar'
  }
};

export function getGenreTheme(genreName: string): GenreTheme {
  const key = genreName.toLowerCase().trim();
  if (GENRE_THEMES[key]) {
    return GENRE_THEMES[key];
  }
  // Try finding in GENRE_HIERARCHY
  if (GENRE_HIERARCHY[key]) {
    const item = GENRE_HIERARCHY[key];
    return {
      name: item.name,
      gradient: item.gradient,
      accent: '#0086F0',
      icon: <BookOpen size={38} className="text-white drop-shadow-md" />,
      description: `Audiobooks do gênero ${item.name}`
    };
  }
  for (const k in GENRE_THEMES) {
    if (key.includes(k) || k.includes(key)) {
      return GENRE_THEMES[k];
    }
  }
  return {
    name: genreName,
    gradient: 'from-blue-600 via-indigo-600 to-violet-700',
    accent: '#0086F0',
    icon: <BookOpen size={38} className="text-white drop-shadow-md" />,
    description: `Audiobooks do gênero ${genreName}`
  };
}

// ==========================================
// 4. TRANSCRIPT SEARCH & SYNCHRONIZATION (O(1) / O(log N))
// ==========================================
export function formatTime(secs: number): string {
  if (isNaN(secs) || secs < 0) secs = 0;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function formatCountdown(secs: number): string {
  const total = Math.max(0, Math.floor(isNaN(secs) ? 0 : secs));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function calculateChapterTiming(
  currentTime: number,
  chapter?: { startTime: number; duration: number }
): { chapterElapsed: number; chapterRemaining: number; progressPercent: number } {
  if (!chapter) {
    return { chapterElapsed: 0, chapterRemaining: 0, progressPercent: 0 };
  }
  const start = Math.max(0, chapter.startTime || 0);
  const duration = Math.max(0, chapter.duration || 0);
  const chapterElapsed = Math.max(0, currentTime - start);
  const chapterRemaining = Math.max(0, duration - chapterElapsed);
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (chapterElapsed / duration) * 100)) : 0;
  return { chapterElapsed, chapterRemaining, progressPercent };
}

export function findChapterAtTime(chapters: Chapter[], currentTime: number): Chapter | undefined {
  if (!chapters || chapters.length === 0) return undefined;
  for (let i = chapters.length - 1; i >= 0; i--) {
    const ch = chapters[i];
    if (currentTime >= ch.startTime) {
      return ch;
    }
  }
  return chapters[0];
}

export function findActiveWordIndex(words: TranscriptWord[] | undefined, time: number): number {
  if (!words || words.length === 0) return -1;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (time >= w.start && time <= w.end) {
      return i;
    }
  }
  return -1;
}

export function findActiveTranscriptIndex(
  transcript: TranscriptLine[] | undefined,
  time: number,
  lastIndex: number = -1
): number {
  if (!transcript || transcript.length === 0) return -1;
  const len = transcript.length;

  // 1. Verificação incremental rápida em O(1)
  if (lastIndex >= 0 && lastIndex < len) {
    const cur = transcript[lastIndex];
    if (time >= cur.start && time <= cur.end) {
      return lastIndex;
    }
    if (lastIndex + 1 < len) {
      const next = transcript[lastIndex + 1];
      if (time >= next.start && time <= next.end) {
        return lastIndex + 1;
      }
    }
  }

  // 2. Busca binária precisa em O(log N)
  let low = 0;
  let high = len - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const line = transcript[mid];

    if (time >= line.start && time <= line.end) {
      return mid;
    } else if (time < line.start) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  // Se estiver em gap curto entre frases, mantém a linha recém-concluída
  if (high >= 0 && high < len && time > transcript[high].end && (high === len - 1 || time < transcript[high + 1].start)) {
    return high;
  }

  return -1;
}

// ==========================================
// 5. MP4 / M4B ISO-BMFF METADATA & CHAPTER PARSER
// ==========================================
export interface Mp4ParsedMetadata {
  title?: string;
  author?: string;
  album?: string;
  narrator?: string;
  category?: string;
  year?: string;
  description?: string;
  coverBlob?: Blob;
  chapters?: { title: string; startTime: number; duration?: number }[];
  transcript?: TranscriptLine[];
  durationSec?: number;
}

/**
 * Utilitário para localizar a primeira caixa de um tipo específico em um intervalo de bytes ISO-BMFF
 */
function findBox(
  bytes: Uint8Array,
  start: number,
  end: number,
  targetType: string
): { start: number; length: number; dataStart: number } | null {
  let offset = start;
  while (offset <= end - 8) {
    let size = (bytes[offset] * 0x1000000 + ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])) >>> 0;
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    if (size === 0) size = end - offset;
    let dataStart = offset + 8;
    if (size === 1) {
      if (offset + 16 > end) break;
      dataStart = offset + 16;
      const high = (bytes[offset + 8] * 0x1000000 + ((bytes[offset + 9] << 16) | (bytes[offset + 10] << 8) | bytes[offset + 11])) >>> 0;
      const low = (bytes[offset + 12] * 0x1000000 + ((bytes[offset + 13] << 16) | (bytes[offset + 14] << 8) | bytes[offset + 15])) >>> 0;
      size = high * 0x100000000 + low;
    }
    if (size < 8 || offset + size > end) break;
    if (type === targetType) {
      return { start: offset, length: size, dataStart };
    }
    offset += size;
  }
  return null;
}

/**
 * Utilitário para localizar todas as caixas de um tipo específico (ex: todos os átomos 'trak' em 'moov')
 */
function findAllBoxes(
  bytes: Uint8Array,
  start: number,
  end: number,
  targetType: string
): { start: number; length: number; dataStart: number }[] {
  const list: { start: number; length: number; dataStart: number }[] = [];
  let offset = start;
  while (offset <= end - 8) {
    let size = (bytes[offset] * 0x1000000 + ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])) >>> 0;
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    if (size === 0) size = end - offset;
    let dataStart = offset + 8;
    if (size === 1) {
      if (offset + 16 > end) break;
      dataStart = offset + 16;
      const high = (bytes[offset + 8] * 0x1000000 + ((bytes[offset + 9] << 16) | (bytes[offset + 10] << 8) | bytes[offset + 11])) >>> 0;
      const low = (bytes[offset + 12] * 0x1000000 + ((bytes[offset + 13] << 16) | (bytes[offset + 14] << 8) | bytes[offset + 15])) >>> 0;
      size = high * 0x100000000 + low;
    }
    if (size < 8 || offset + size > end) break;
    if (type === targetType) {
      list.push({ start: offset, length: size, dataStart });
    }
    offset += size;
  }
  return list;
}

export async function parseMp4M4bMetadata(file: File): Promise<Mp4ParsedMetadata | null> {
  try {
    const headCheckBuf = await file.slice(0, Math.min(file.size, 4096)).arrayBuffer();
    const headCheckBytes = new Uint8Array(headCheckBuf);
    if (headCheckBytes.length < 8) return null;

    let isIsoBmff = false;
    for (let i = 0; i <= headCheckBytes.length - 8; i++) {
      const type = String.fromCharCode(headCheckBytes[i + 4], headCheckBytes[i + 5], headCheckBytes[i + 6], headCheckBytes[i + 7]);
      if (type === 'ftyp' || type === 'moov') {
        isIsoBmff = true;
        break;
      }
    }

    const lowerExt = file.name.toLowerCase();
    const isAudiobookExt = lowerExt.endsWith('.m4b') || lowerExt.endsWith('.mp4') || lowerExt.endsWith('.m4a') || lowerExt.endsWith('.aac');
    if (!isIsoBmff && !isAudiobookExt) {
      return null;
    }

    let moovBuffer: ArrayBuffer | null = null;

    // 1. Tenta leitura sequencial das caixas de nível superior (ISO Base Media)
    let searchPos = 0;
    let attempts = 0;
    while (searchPos < file.size && attempts < 100) {
      attempts++;
      const boxHeadBuf = await file.slice(searchPos, Math.min(file.size, searchPos + 16)).arrayBuffer();
      if (boxHeadBuf.byteLength < 8) break;
      const bView = new DataView(boxHeadBuf);
      let bSize = bView.getUint32(0);
      const bBytes = new Uint8Array(boxHeadBuf);
      const bType = String.fromCharCode(bBytes[4], bBytes[5], bBytes[6], bBytes[7]);

      if (bSize === 1 && boxHeadBuf.byteLength >= 16) {
        const high = bView.getUint32(8);
        const low = bView.getUint32(12);
        bSize = Number((BigInt(high) << 32n) | BigInt(low));
      }

      if (bType === 'moov') {
        const actualMoovSize = bSize > 8 && bSize <= 50 * 1024 * 1024 ? bSize : Math.min(file.size - searchPos, 25 * 1024 * 1024);
        moovBuffer = await file.slice(searchPos, searchPos + actualMoovSize).arrayBuffer();
        break;
      }

      if (bSize < 8 || searchPos + bSize > file.size) {
        break;
      }
      searchPos += bSize;
    }

    // 2. Fallback: Varredura nos primeiros 2MB do arquivo
    if (!moovBuffer) {
      const startChunkSize = Math.min(file.size, 2 * 1024 * 1024);
      const startBuf = await file.slice(0, startChunkSize).arrayBuffer();
      const startBytes = new Uint8Array(startBuf);
      let pos = 0;
      while (pos <= startBytes.length - 8) {
        let boxSize = (startBytes[pos] * 0x1000000 + ((startBytes[pos + 1] << 16) | (startBytes[pos + 2] << 8) | startBytes[pos + 3])) >>> 0;
        const boxType = String.fromCharCode(startBytes[pos + 4], startBytes[pos + 5], startBytes[pos + 6], startBytes[pos + 7]);
        if (boxSize === 0) break;
        if (boxSize === 1 && pos + 16 <= startBytes.length) {
          const high = (startBytes[pos + 8] * 0x1000000 + ((startBytes[pos + 9] << 16) | (startBytes[pos + 10] << 8) | startBytes[pos + 11])) >>> 0;
          const low = (startBytes[pos + 12] * 0x1000000 + ((startBytes[pos + 13] << 16) | (startBytes[pos + 14] << 8) | startBytes[pos + 15])) >>> 0;
          boxSize = high * 0x100000000 + low;
        }
        if (boxType === 'moov') {
          const fullMoovBuf = await file.slice(pos, pos + (boxSize > 0 && boxSize <= 50 * 1024 * 1024 ? boxSize : startChunkSize)).arrayBuffer();
          moovBuffer = fullMoovBuf;
          break;
        }
        if (boxSize < 8) break;
        pos += boxSize;
      }
    }

    // 3. Fallback: Varredura nos últimos 15MB do arquivo (comum quando moov fica no final do contêiner)
    if (!moovBuffer && file.size > 2 * 1024 * 1024) {
      const endChunkSize = Math.min(file.size, 15 * 1024 * 1024);
      const endOffset = file.size - endChunkSize;
      const endBuf = await file.slice(endOffset, file.size).arrayBuffer();
      const endBytes = new Uint8Array(endBuf);

      for (let i = 0; i <= endBytes.length - 8; i++) {
        if (endBytes[i + 4] === 0x6d && endBytes[i + 5] === 0x6f && endBytes[i + 6] === 0x6f && endBytes[i + 7] === 0x76) { // 'moov'
          let boxSize = (endBytes[i] * 0x1000000 + ((endBytes[i + 1] << 16) | (endBytes[i + 2] << 8) | endBytes[i + 3])) >>> 0;
          if (boxSize > 0 && boxSize <= endChunkSize - i) {
            moovBuffer = endBuf.slice(i, i + boxSize);
          } else {
            const actualStart = endOffset + i;
            const fullBuf = await file.slice(actualStart, Math.min(file.size, actualStart + (boxSize > 0 && boxSize <= 50 * 1024 * 1024 ? boxSize : endChunkSize))).arrayBuffer();
            moovBuffer = fullBuf;
          }
          break;
        }
      }
    }

    if (!moovBuffer) return null;

    const result: Mp4ParsedMetadata = {};
    const moovBytes = new Uint8Array(moovBuffer);
    const view = new DataView(moovBuffer);

    // 1. Extração da Duração Geral via mvhd (Movie Header)
    const mvhdBox = findBox(moovBytes, 8, moovBytes.length, 'mvhd');
    if (mvhdBox && mvhdBox.length >= 24) {
      const version = moovBytes[mvhdBox.dataStart];
      let timescale = 1000;
      let duration = 0;
      if (version === 0 && mvhdBox.dataStart + 20 <= mvhdBox.start + mvhdBox.length) {
        timescale = view.getUint32(mvhdBox.dataStart + 12);
        duration = view.getUint32(mvhdBox.dataStart + 16);
      } else if (version === 1 && mvhdBox.dataStart + 28 <= mvhdBox.start + mvhdBox.length) {
        timescale = view.getUint32(mvhdBox.dataStart + 20);
        const durHigh = view.getUint32(mvhdBox.dataStart + 24);
        const durLow = view.getUint32(mvhdBox.dataStart + 28);
        duration = Number((BigInt(durHigh) << 32n) | BigInt(durLow));
      }
      if (timescale > 0 && duration > 0) {
        result.durationSec = Math.round(duration / timescale);
      }
    }

    // 2. Extração de Capítulos Apple / Timed Text (moov -> trak -> ... -> text / tx3g)
    const trakBoxes = findAllBoxes(moovBytes, 8, moovBytes.length, 'trak');
    const referencedChapterTrackIds = new Set<number>();

    for (const trak of trakBoxes) {
      const trakEnd = trak.start + trak.length;
      const tref = findBox(moovBytes, trak.dataStart, trakEnd, 'tref');
      if (tref) {
        const trefEnd = tref.start + tref.length;
        const chap = findBox(moovBytes, tref.dataStart, trefEnd, 'chap');
        if (chap) {
          const chapEnd = chap.start + chap.length;
          let p = chap.dataStart;
          while (p + 4 <= chapEnd) {
            referencedChapterTrackIds.add(view.getUint32(p));
            p += 4;
          }
        }
      }
    }

    interface ChapterTrackCandidate {
      trak: { start: number; length: number; dataStart: number };
      trackId: number;
      timescale: number;
      sttsBox: { start: number; length: number; dataStart: number };
      stszBox?: { start: number; length: number; dataStart: number };
      stscBox?: { start: number; length: number; dataStart: number };
      stcoBox?: { start: number; length: number; dataStart: number };
      co64Box?: { start: number; length: number; dataStart: number };
      isExplicit: boolean;
    }

    const candidateTracks: ChapterTrackCandidate[] = [];

    for (const trak of trakBoxes) {
      const trakEnd = trak.start + trak.length;
      const tkhd = findBox(moovBytes, trak.dataStart, trakEnd, 'tkhd');
      let trackId = 0;
      if (tkhd) {
        const tkhdVersion = moovBytes[tkhd.dataStart];
        if (tkhdVersion === 0 && tkhd.dataStart + 16 <= tkhd.start + tkhd.length) {
          trackId = view.getUint32(tkhd.dataStart + 12);
        } else if (tkhdVersion === 1 && tkhd.dataStart + 24 <= tkhd.start + tkhd.length) {
          trackId = view.getUint32(tkhd.dataStart + 20);
        }
      }

      const mdia = findBox(moovBytes, trak.dataStart, trakEnd, 'mdia');
      if (!mdia) continue;
      const mdiaEnd = mdia.start + mdia.length;

      const mdhd = findBox(moovBytes, mdia.dataStart, mdiaEnd, 'mdhd');
      let timescale = 1000;
      if (mdhd) {
        const mdhdVersion = moovBytes[mdhd.dataStart];
        if (mdhdVersion === 0 && mdhd.dataStart + 16 <= mdhd.start + mdhd.length) {
          timescale = view.getUint32(mdhd.dataStart + 12);
        } else if (mdhdVersion === 1 && mdhd.dataStart + 24 <= mdhd.start + mdhd.length) {
          timescale = view.getUint32(mdhd.dataStart + 20);
        }
      }
      if (timescale <= 0) timescale = 1000;

      const hdlr = findBox(moovBytes, mdia.dataStart, mdiaEnd, 'hdlr');
      let handlerType = '';
      if (hdlr && hdlr.dataStart + 12 <= hdlr.start + hdlr.length) {
        handlerType = String.fromCharCode(
          moovBytes[hdlr.dataStart + 8],
          moovBytes[hdlr.dataStart + 9],
          moovBytes[hdlr.dataStart + 10],
          moovBytes[hdlr.dataStart + 11]
        );
      }

      const minf = findBox(moovBytes, mdia.dataStart, mdiaEnd, 'minf');
      if (!minf) continue;
      const minfEnd = minf.start + minf.length;

      const stbl = findBox(moovBytes, minf.dataStart, minfEnd, 'stbl');
      if (!stbl) continue;
      const stblEnd = stbl.start + stbl.length;

      const stsd = findBox(moovBytes, stbl.dataStart, stblEnd, 'stsd');
      let sampleFormat = '';
      if (stsd && stsd.dataStart + 16 <= stsd.start + stsd.length) {
        sampleFormat = String.fromCharCode(
          moovBytes[stsd.dataStart + 12],
          moovBytes[stsd.dataStart + 13],
          moovBytes[stsd.dataStart + 14],
          moovBytes[stsd.dataStart + 15]
        );
      }

      const isExplicit = referencedChapterTrackIds.has(trackId);
      const isTextTrack =
        handlerType === 'text' ||
        handlerType === 'sbtl' ||
        handlerType === 'subt' ||
        sampleFormat === 'text' ||
        sampleFormat === 'tx3g';

      if (isExplicit || isTextTrack) {
        const sttsBox = findBox(moovBytes, stbl.dataStart, stblEnd, 'stts');
        if (sttsBox) {
          const stszBox = findBox(moovBytes, stbl.dataStart, stblEnd, 'stsz');
          const stscBox = findBox(moovBytes, stbl.dataStart, stblEnd, 'stsc');
          const stcoBox = findBox(moovBytes, stbl.dataStart, stblEnd, 'stco');
          const co64Box = findBox(moovBytes, stbl.dataStart, stblEnd, 'co64');

          candidateTracks.push({
            trak,
            trackId,
            timescale,
            sttsBox,
            stszBox: stszBox || undefined,
            stscBox: stscBox || undefined,
            stcoBox: stcoBox || undefined,
            co64Box: co64Box || undefined,
            isExplicit
          });
        }
      }
    }

    // Ordena para que faixas explicitamente marcadas em tref->chap tenham prioridade
    candidateTracks.sort((a, b) => (b.isExplicit ? 1 : 0) - (a.isExplicit ? 1 : 0));

    for (const track of candidateTracks) {
      const { timescale, sttsBox, stszBox, stscBox, stcoBox, co64Box } = track;
      const sttsEnd = sttsBox.start + sttsBox.length;
      if (sttsBox.dataStart + 8 > sttsEnd) continue;

      const entryCount = view.getUint32(sttsBox.dataStart + 4);
      if (entryCount === 0 || entryCount > 5000) continue;

      const sampleStartTimes: number[] = [];
      const sampleDurations: number[] = [];
      let currentTicks = 0;
      let p = sttsBox.dataStart + 8;

      for (let e = 0; e < entryCount && p + 8 <= sttsEnd; e++) {
        const count = view.getUint32(p);
        const delta = view.getUint32(p + 4);
        p += 8;

        for (let s = 0; s < count && sampleStartTimes.length < 5000; s++) {
          sampleStartTimes.push(currentTicks / timescale);
          sampleDurations.push(delta / timescale);
          currentTicks += delta;
        }
      }

      const sampleCount = sampleStartTimes.length;
      if (sampleCount === 0) continue;

      // Tamanhos das amostras (stsz)
      const sampleSizes: number[] = [];
      if (stszBox) {
        const stszEnd = stszBox.start + stszBox.length;
        if (stszBox.dataStart + 12 <= stszEnd) {
          const uniformSize = view.getUint32(stszBox.dataStart + 4);
          const stszSampleCount = view.getUint32(stszBox.dataStart + 8);
          if (uniformSize > 0) {
            for (let s = 0; s < sampleCount; s++) sampleSizes.push(uniformSize);
          } else {
            let sp = stszBox.dataStart + 12;
            for (let s = 0; s < stszSampleCount && sp + 4 <= stszEnd; s++) {
              sampleSizes.push(view.getUint32(sp));
              sp += 4;
            }
          }
        }
      }

      // Mapeamento amostra -> chunk (stsc)
      const stscEntries: { firstChunk: number; samplesPerChunk: number }[] = [];
      if (stscBox) {
        const stscEnd = stscBox.start + stscBox.length;
        if (stscBox.dataStart + 8 <= stscEnd) {
          const stscCount = view.getUint32(stscBox.dataStart + 4);
          let sp = stscBox.dataStart + 8;
          for (let e = 0; e < stscCount && sp + 12 <= stscEnd; e++) {
            stscEntries.push({
              firstChunk: view.getUint32(sp),
              samplesPerChunk: view.getUint32(sp + 4)
            });
            sp += 12;
          }
        }
      }

      // Offsets de cada chunk no arquivo (stco ou co64)
      const chunkOffsets: number[] = [];
      if (stcoBox) {
        const stcoEnd = stcoBox.start + stcoBox.length;
        if (stcoBox.dataStart + 8 <= stcoEnd) {
          const chunkCount = view.getUint32(stcoBox.dataStart + 4);
          let cp = stcoBox.dataStart + 8;
          for (let c = 0; c < chunkCount && cp + 4 <= stcoEnd; c++) {
            chunkOffsets.push(view.getUint32(cp));
            cp += 4;
          }
        }
      } else if (co64Box) {
        const co64End = co64Box.start + co64Box.length;
        if (co64Box.dataStart + 8 <= co64End) {
          const chunkCount = view.getUint32(co64Box.dataStart + 4);
          let cp = co64Box.dataStart + 8;
          for (let c = 0; c < chunkCount && cp + 8 <= co64End; c++) {
            const high = view.getUint32(cp);
            const low = view.getUint32(cp + 4);
            chunkOffsets.push(Number((BigInt(high) << 32n) | BigInt(low)));
            cp += 8;
          }
        }
      }

      // Calcula os byte offsets no arquivo para cada amostra
      const sampleOffsets: number[] = [];
      if (chunkOffsets.length > 0 && stscEntries.length > 0) {
        let currentSample = 0;
        let stscIdx = 0;

        for (let c = 0; c < chunkOffsets.length && currentSample < sampleCount; c++) {
          const chunkNum = c + 1;
          while (stscIdx + 1 < stscEntries.length && stscEntries[stscIdx + 1].firstChunk <= chunkNum) {
            stscIdx++;
          }
          const samplesInChunk = stscEntries[stscIdx].samplesPerChunk;
          let offset = chunkOffsets[c];

          for (let s = 0; s < samplesInChunk && currentSample < sampleCount; s++) {
            sampleOffsets[currentSample] = offset;
            offset += sampleSizes[currentSample] || 0;
            currentSample++;
          }
        }
      }

      // Decodificação dos títulos de cada capítulo
      const textDecoderUtf8 = new TextDecoder('utf-8');
      const textDecoderUtf16 = new TextDecoder('utf-16');

      const chapterPromises = sampleStartTimes.map(async (startTime, idx) => {
        let title = '';
        const offset = sampleOffsets[idx];
        const size = sampleSizes[idx] || 0;

        if (offset > 0 && size > 0 && offset + size <= file.size) {
          try {
            const sampleBuf = await file.slice(offset, offset + size).arrayBuffer();
            const sBytes = new Uint8Array(sampleBuf);

            if (sBytes.length >= 2) {
              const textLen = (sBytes[0] << 8) | sBytes[1];
              if (textLen > 0 && textLen <= sBytes.length - 2) {
                const strBytes = sBytes.subarray(2, 2 + textLen);
                if (
                  strBytes.length >= 2 &&
                  ((strBytes[0] === 0xfe && strBytes[1] === 0xff) || (strBytes[0] === 0xff && strBytes[1] === 0xfe))
                ) {
                  title = textDecoderUtf16.decode(strBytes);
                } else {
                  title = textDecoderUtf8.decode(strBytes);
                }
              } else {
                title = textDecoderUtf8.decode(sBytes);
              }
            } else if (sBytes.length === 1) {
              title = textDecoderUtf8.decode(sBytes);
            }
          } catch {}
        }

        title = title.replace(/\0+$/, '').trim();
        if (!title || /^[\x00-\x1F]+$/.test(title)) {
          title = `Capítulo ${idx + 1}`;
        }

        return {
          title,
          startTime: Math.max(0, Math.round(startTime)),
          duration: Math.max(1, Math.round(sampleDurations[idx] || 0))
        };
      });

      const extractedTrackChapters = await Promise.all(chapterPromises);
      if (extractedTrackChapters.length > 0) {
        result.chapters = extractedTrackChapters;
        break; // Faixa de capítulos processada com sucesso
      }
    }

    // 3. Fallback: Extração de Capítulos Nero (moov -> udta -> chpl ou moov -> chpl)
    const udtaBox = findBox(moovBytes, 8, moovBytes.length, 'udta');
    if (!result.chapters || result.chapters.length === 0) {
      const chplBox = udtaBox
        ? findBox(moovBytes, udtaBox.dataStart, udtaBox.start + udtaBox.length, 'chpl')
        : findBox(moovBytes, 8, moovBytes.length, 'chpl');

      if (chplBox) {
        const chplEnd = chplBox.start + chplBox.length;
        const countWithReserved = chplBox.dataStart + 9 <= chplEnd ? view.getUint32(chplBox.dataStart + 5) : 0;
        const countWithoutReserved = chplBox.dataStart + 8 <= chplEnd ? view.getUint32(chplBox.dataStart + 4) : 0;

        let chapterCount = 0;
        let chplPos = chplBox.dataStart + 8;
        if (countWithReserved > 0 && countWithReserved < 3000) {
          chapterCount = countWithReserved;
          chplPos = chplBox.dataStart + 9;
        } else if (countWithoutReserved > 0 && countWithoutReserved < 3000) {
          chapterCount = countWithoutReserved;
          chplPos = chplBox.dataStart + 8;
        }

        if (chapterCount > 0) {
          const chaptersList: { title: string; startTime: number; duration?: number }[] = [];
          for (let c = 0; c < chapterCount; c++) {
            if (chplPos + 9 > chplEnd) break;
            const highTime = view.getUint32(chplPos);
            const lowTime = view.getUint32(chplPos + 4);
            chplPos += 8;
            const fullTime100ns = (BigInt(highTime) << 32n) | BigInt(lowTime);
            const startTimeSec = Number(fullTime100ns) / 10000000;

            const titleLen = moovBytes[chplPos];
            chplPos += 1;
            if (chplPos + titleLen > chplEnd) break;
            const titleBytes = moovBytes.subarray(chplPos, chplPos + titleLen);
            const chapTitle = new TextDecoder('utf-8').decode(titleBytes);
            chplPos += titleLen;

            chaptersList.push({
              title: chapTitle.trim() || `Capítulo ${c + 1}`,
              startTime: Math.max(0, Math.round(startTimeSec))
            });
          }
          if (chaptersList.length > 0) {
            result.chapters = chaptersList;
          }
        }
      }
    }

    // 4. Extração de Metadados e Capa iTunes/QuickTime (moov -> udta -> meta -> ilst ou moov -> meta -> ilst)
    let metaBox = udtaBox ? findBox(moovBytes, udtaBox.dataStart, udtaBox.start + udtaBox.length, 'meta') : null;
    if (!metaBox) {
      metaBox = findBox(moovBytes, 8, moovBytes.length, 'meta');
    }

    if (metaBox) {
      const ilstBox = findBox(moovBytes, metaBox.dataStart + 4, metaBox.start + metaBox.length, 'ilst');
      if (ilstBox) {
        let tagPos = ilstBox.dataStart;
        const ilstEnd = ilstBox.start + ilstBox.length;

        while (tagPos <= ilstEnd - 8) {
          const tagSize = (moovBytes[tagPos] * 0x1000000 + ((moovBytes[tagPos + 1] << 16) | (moovBytes[tagPos + 2] << 8) | moovBytes[tagPos + 3])) >>> 0;
          if (tagSize < 8 || tagPos + tagSize > ilstEnd) break;
          const tagType = String.fromCharCode(moovBytes[tagPos + 4], moovBytes[tagPos + 5], moovBytes[tagPos + 6], moovBytes[tagPos + 7]);

          const dataBox = findBox(moovBytes, tagPos + 8, tagPos + tagSize, 'data');
          if (dataBox) {
            const typeIndicator = (moovBytes[dataBox.dataStart] * 0x1000000 + ((moovBytes[dataBox.dataStart + 1] << 16) | (moovBytes[dataBox.dataStart + 2] << 8) | moovBytes[dataBox.dataStart + 3])) >>> 0;
            const payload = moovBytes.subarray(dataBox.dataStart + 8, dataBox.start + dataBox.length);

            if (tagType === '\xa9nam' || tagType === '©nam') {
              result.title = new TextDecoder('utf-8').decode(payload).trim();
            } else if (tagType === '\xa9ART' || tagType === '©ART' || tagType === 'aART') {
              if (!result.author || tagType !== 'aART') {
                result.author = new TextDecoder('utf-8').decode(payload).trim();
              }
            } else if (tagType === '\xa9alb' || tagType === '©alb') {
              result.album = new TextDecoder('utf-8').decode(payload).trim();
            } else if (tagType === '\xa9gen' || tagType === '©gen' || tagType === 'gnre') {
              result.category = new TextDecoder('utf-8').decode(payload).trim();
            } else if (tagType === '\xa9day' || tagType === '©day') {
              const dayStr = new TextDecoder('utf-8').decode(payload).trim();
              result.year = dayStr.slice(0, 4);
            } else if (tagType === 'desc' || tagType === '\xa9des' || tagType === '©des' || tagType === 'ldes' || tagType === '\xa9cmt' || tagType === '©cmt') {
              if (!result.description) {
                result.description = new TextDecoder('utf-8').decode(payload).trim();
              }
            } else if (tagType === '\xa9nrt' || tagType === '©nrt' || tagType === '\xa9wrt' || tagType === '©wrt') {
              result.narrator = new TextDecoder('utf-8').decode(payload).trim();
            } else if (tagType === 'covr') {
              let mime = 'image/jpeg';
              if (typeIndicator === 14) {
                mime = 'image/png';
              } else if (payload.length >= 8 && payload[0] === 0x89 && payload[1] === 0x50 && payload[2] === 0x4e && payload[3] === 0x47) {
                mime = 'image/png';
              } else if (payload.length >= 4 && payload[0] === 0x52 && payload[1] === 0x49 && payload[2] === 0x46 && payload[3] === 0x46) {
                mime = 'image/webp';
              }
              result.coverBlob = new Blob([payload], { type: mime });
            } else if (tagType === '\xa9lyr' || tagType === '©lyr') {
              const lyrText = new TextDecoder('utf-8').decode(payload).trim();
              if (lyrText) {
                const autoParsed = parseTextContentAuto(lyrText);
                if (autoParsed.length > 0) {
                  result.transcript = autoParsed;
                }
              }
            }
          }

          tagPos += tagSize;
        }
      }
    }

    return result;
  } catch (err) {
    console.warn('Erro ao processar metadados MP4/M4B:', err);
    return null;
  }
}

// ==========================================
// 5. AUDIO METADATA & COVER PARSER
// ==========================================
export async function parseAudioMetadata(file: File): Promise<{
  title: string;
  author: string;
  authorNationality: string;
  category: string;
  subgenre?: string;
  year: string;
  cover: string;
  durationSec: number;
  durationEst: string;
  sizeStr: string;
  chapters: Chapter[];
  transcript: TranscriptLine[];
  description?: string;
  narrator?: string;
  language?: string;
}> {
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  const sizeStr = `${sizeMb} MB`;

  const baseName = file.name.replace(/\.[^/.]+$/, "");
  let title = baseName.replace(/^(\d+[\s._-]+)+/, '').trim();
  if (!title) title = baseName;
  let author = 'Autor Desconhecido';
  let rawAuthorNationality = '';
  let rawCategory = '';
  let rawSubgenre = '';
  let year = new Date().getFullYear().toString();
  let description = '';
  let narrator = '';
  let rawLanguage = '';
  let extractedCover: string | null = null;
  let extractedTranscript: TranscriptLine[] = [];
  let extractedChapters: { title: string; startTime: number; duration?: number }[] = [];
  let durationSec = 1800;

  try {
    const buffer = await file.slice(0, 1024 * 512).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const isId3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
    const lowerName = file.name.toLowerCase();
    const isM4bOrMp4 = lowerName.endsWith('.m4b') || lowerName.endsWith('.mp4') || lowerName.endsWith('.m4a') || lowerName.endsWith('.aac');

    if (isId3) {
      const majorVersion = bytes[3];
      const tagSize = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
      
      const fullTagBuffer = await file.slice(0, Math.min(tagSize + 10, 15 * 1024 * 1024)).arrayBuffer();
      const tagBytes = new Uint8Array(fullTagBuffer);
      let offset = 10;

      while (offset < tagBytes.length - 10) {
        const frameId = String.fromCharCode(tagBytes[offset], tagBytes[offset + 1], tagBytes[offset + 2], tagBytes[offset + 3]);
        if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

        let frameSize = 0;
        if (majorVersion === 4) {
          frameSize = ((tagBytes[offset + 4] & 0x7f) << 21) | ((tagBytes[offset + 5] & 0x7f) << 14) | ((tagBytes[offset + 6] & 0x7f) << 7) | (tagBytes[offset + 7] & 0x7f);
        } else {
          frameSize = (tagBytes[offset + 4] << 24) | (tagBytes[offset + 5] << 16) | (tagBytes[offset + 6] << 8) | tagBytes[offset + 7];
        }

        if (frameSize <= 0 || offset + 10 + frameSize > tagBytes.length) break;

        const frameData = tagBytes.subarray(offset + 10, offset + 10 + frameSize);

        if (frameId === 'TIT2') {
          const text = decodeId3Text(frameData);
          if (text) title = text.trim();
        } else if (frameId === 'TIT1') {
          const text = decodeId3Text(frameData);
          if (text) rawSubgenre = text.trim();
        } else if (frameId === 'TPE1') {
          const text = decodeId3Text(frameData);
          if (text) author = text.trim();
        } else if (frameId === 'TCON') {
          const text = decodeId3Text(frameData);
          if (text) rawCategory = text.trim();
        } else if (frameId === 'TYER' || frameId === 'TDRC') {
          const text = decodeId3Text(frameData);
          if (text) year = text.trim().slice(0, 4);
        } else if (frameId === 'TPE3' || frameId === 'TEXT' || frameId === 'TCOM') {
          const text = decodeId3Text(frameData);
          if (text && !narrator) narrator = text.trim();
        } else if (frameId === 'TLAN') {
          const text = decodeId3Text(frameData);
          if (text && !rawLanguage) rawLanguage = text.trim();
        } else if (frameId === 'SYLT' && extractedTranscript.length === 0) {
          const syltLines = decodeId3SyltFrame(frameData);
          if (syltLines.length > 0) {
            extractedTranscript = syltLines;
          }
        } else if (frameId === 'USLT' && extractedTranscript.length === 0) {
          try {
            if (frameData.length > 4) {
              const usltText = decodeId3Text(frameData.subarray(4));
              if (usltText) {
                const parsedFromUslt = parseTextContentByFormat(usltText, 'lrc');
                if (parsedFromUslt.length > 0) {
                  extractedTranscript = parsedFromUslt;
                }
              }
            }
          } catch {}
        } else if (frameId === 'TXXX') {
          const text = decodeId3Text(frameData);
          if (text) {
            const parts = text.split('\0').map(s => s.trim()).filter(Boolean);
            if (parts.length >= 2) {
              const key = parts[0].toLowerCase();
              const val = parts.slice(1).join(' ').trim();
              if (val && (key.includes('national') || key.includes('nacional') || key.includes('country') || key.includes('pais') || key.includes('país'))) {
                if (!rawAuthorNationality) rawAuthorNationality = val;
              } else if (val && (key === 'language' || key === 'idioma' || key === 'lang')) {
                if (!rawLanguage) rawLanguage = val;
              } else if (val && extractedTranscript.length === 0 && (key.includes('transcript') || key.includes('sync') || key.includes('lyrics') || key.includes('texto') || key.includes('subtitles'))) {
                const autoParsed = parseTextContentAuto(val);
                if (autoParsed.length > 0) {
                  extractedTranscript = autoParsed;
                }
              }
            }
          }
        } else if (frameId === 'COMM') {
          try {
            if (frameData.length > 4) {
              const commBytes = frameData.subarray(4);
              const text = decodeId3Text(commBytes);
              if (text) description = text.trim();
            }
          } catch(e) {}
        } else if (frameId === 'APIC' && !extractedCover) {
          try {
            let p = 1;
            let mime = '';
            while (p < frameData.length && frameData[p] !== 0) {
              mime += String.fromCharCode(frameData[p]);
              p++;
            }
            p++;
            p++;
            while (p < frameData.length && frameData[p] !== 0) {
              p++;
            }
            p++;
            if (p < frameData.length) {
              const imgBytes = frameData.subarray(p);
              const mimeType = mime || 'image/jpeg';
              const blob = new Blob([imgBytes], { type: mimeType });
              try {
                extractedCover = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    if (typeof reader.result === 'string') resolve(reader.result);
                    else resolve(URL.createObjectURL(blob));
                  };
                  reader.onerror = () => resolve(URL.createObjectURL(blob));
                  reader.readAsDataURL(blob);
                });
              } catch {
                extractedCover = URL.createObjectURL(blob);
              }
            }
          } catch (e) {
            console.warn('Could not extract APIC cover', e);
          }
        }

        offset += 10 + frameSize;
      }
    }

    // Se for contêiner MP4 / M4B ou se não encontrou capítulos / capa suficientes via ID3
    if (isM4bOrMp4 || !isId3 || extractedChapters.length === 0 || !extractedCover) {
      const mp4Meta = await parseMp4M4bMetadata(file);
      if (mp4Meta) {
        if (mp4Meta.title && (!title || title === baseName)) title = mp4Meta.title;
        if (mp4Meta.author && (!author || author === 'Autor Desconhecido')) author = mp4Meta.author;
        if (mp4Meta.category && !rawCategory) rawCategory = mp4Meta.category;
        if (mp4Meta.year && (!year || year === new Date().getFullYear().toString())) year = mp4Meta.year;
        if (mp4Meta.description && !description) description = mp4Meta.description;
        if (mp4Meta.narrator && !narrator) narrator = mp4Meta.narrator;
        if (mp4Meta.coverBlob && !extractedCover) {
          extractedCover = URL.createObjectURL(mp4Meta.coverBlob);
        }
        if (mp4Meta.chapters && mp4Meta.chapters.length > 0) {
          extractedChapters = mp4Meta.chapters;
        }
        if (mp4Meta.transcript && mp4Meta.transcript.length > 0 && extractedTranscript.length === 0) {
          extractedTranscript = mp4Meta.transcript;
        }
        if (mp4Meta.durationSec && mp4Meta.durationSec > 0) {
          durationSec = mp4Meta.durationSec;
        }
      }
    }
  } catch (err) {
    console.warn('Error reading audio tags:', err);
  }

  if (typeof Audio !== 'undefined') {
    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = objectUrl;
      audio.load();

      await new Promise<void>((resolve) => {
        let resolved = false;
        const done = () => {
          if (resolved) return;
          resolved = true;
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
            durationSec = Math.round(audio.duration);
          }
          resolve();
        };
        audio.addEventListener('loadedmetadata', done);
        audio.addEventListener('durationchange', done);
        audio.addEventListener('canplay', done);
        audio.addEventListener('error', done);
        setTimeout(done, durationSec > 0 && durationSec !== 1800 ? 800 : 3000);
      });
    } catch (e) {
      console.warn('Audio duration check error:', e);
    } finally {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch {}
      }
    }
  }

  const h = Math.floor(durationSec / 3600);
  const m = Math.floor((durationSec % 3600) / 60);
  const durationEst = h > 0 ? `${h < 10 ? '0' : ''}${h}h ${m < 10 ? '0' : ''}${m}m` : `${m}m`;

  const cover = extractedCover ? await autoCropImageToEbookCover(extractedCover) : getGenericBookCover(title, author);
  if (extractedCover && extractedCover.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(extractedCover);
    } catch {}
  }

  const chapterCount = Math.max(1, Math.min(10, Math.ceil(durationSec / 600)));
  const chapDuration = Math.floor(durationSec / chapterCount);
  
  // Utiliza os capítulos reais extraídos do contêiner M4B / MP4 se presentes
  const chapters: Chapter[] = extractedChapters.length > 0
    ? extractedChapters.map((c, idx) => {
        const nextStart = idx < extractedChapters.length - 1 ? extractedChapters[idx + 1].startTime : durationSec;
        return {
          id: idx + 1,
          title: c.title || `Capítulo ${idx + 1}`,
          startTime: c.startTime,
          duration: Math.max(1, nextStart - c.startTime)
        };
      })
    : Array.from({ length: chapterCount }, (_, i) => ({
        id: i + 1,
        title: `Capítulo ${i + 1}`,
        startTime: i * chapDuration,
        duration: i === chapterCount - 1 ? durationSec - i * chapDuration : chapDuration
      }));

  const resolved = resolveGenreAndSubgenre(rawCategory, rawSubgenre);
  const resolvedLanguage = normalizeAudiobookLanguage(rawLanguage);
  const authorNationality = rawAuthorNationality.trim() || 'Desconhecido';
  const validatedTranscript = validateAndNormalizeTranscript(extractedTranscript, durationSec);

  return {
    title,
    author,
    authorNationality,
    category: resolved.category,
    subgenre: resolved.subgenre,
    year,
    cover,
    durationSec,
    durationEst,
    sizeStr,
    chapters,
    transcript: validatedTranscript,
    description: description || undefined,
    narrator: narrator || undefined,
    language: resolvedLanguage
  };
}

function decodeId3Text(bytes: Uint8Array): string {
  if (bytes.length <= 1) return '';
  const encoding = bytes[0];
  const data = bytes.subarray(1);
  try {
    if (encoding === 0) {
      return new TextDecoder('latin1').decode(data).replace(/\0+$/, '');
    } else if (encoding === 1 || encoding === 2) {
      return new TextDecoder('utf-16').decode(data).replace(/\0+$/, '');
    } else {
      return new TextDecoder('utf-8').decode(data).replace(/\0+$/, '');
    }
  } catch {
    return '';
  }
}

// ==========================================
// 5. SYNCHRONIZED TEXT PARSER & VALIDATOR
// ==========================================

/**
 * Decodes ID3v2 SYLT (Synchronised lyric/text) frame into TranscriptLine[]
 */
function decodeId3SyltFrame(frameData: Uint8Array): TranscriptLine[] {
  try {
    if (frameData.length < 7) return [];
    const encoding = frameData[0];
    // [1..3] language, [4] time stamp format (1 = frames, 2 = milliseconds), [5] content type
    const timeFormat = frameData[4];
    if (timeFormat !== 2) return []; // Only millisecond timestamps are directly usable without MPEG frame tables

    const isUtf16 = encoding === 1 || encoding === 2;
    const decoder = new TextDecoder(
      encoding === 0 ? 'latin1' : isUtf16 ? 'utf-16' : 'utf-8'
    );

    let pos = 6;
    // Skip content descriptor (null-terminated)
    if (isUtf16) {
      while (pos + 1 < frameData.length && !(frameData[pos] === 0 && frameData[pos + 1] === 0)) {
        pos += 2;
      }
      pos += 2;
    } else {
      while (pos < frameData.length && frameData[pos] !== 0) {
        pos++;
      }
      pos++;
    }

    const rawEntries: { start: number; text: string }[] = [];
    while (pos < frameData.length) {
      const textStart = pos;
      if (isUtf16) {
        while (pos + 1 < frameData.length && !(frameData[pos] === 0 && frameData[pos + 1] === 0)) {
          pos += 2;
        }
      } else {
        while (pos < frameData.length && frameData[pos] !== 0) {
          pos++;
        }
      }
      const textBytes = frameData.subarray(textStart, pos);
      const rawText = decoder.decode(textBytes).replace(/[\r\n]+/g, ' ').trim();
      pos += isUtf16 ? 2 : 1;

      if (pos + 4 > frameData.length) break;
      const timeMs =
        ((frameData[pos] << 24) >>> 0) +
        (frameData[pos + 1] << 16) +
        (frameData[pos + 2] << 8) +
        frameData[pos + 3];
      pos += 4;

      if (rawText) {
        rawEntries.push({ start: timeMs / 1000, text: rawText });
      }
    }

    if (rawEntries.length === 0) return [];
    rawEntries.sort((a, b) => a.start - b.start);

    return rawEntries.map((entry, idx) => {
      const next = rawEntries[idx + 1];
      const end = next ? Math.max(entry.start + 0.2, next.start) : entry.start + 4.0;
      return {
        start: Number(entry.start.toFixed(2)),
        end: Number(end.toFixed(2)),
        text: entry.text,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Parses SMIL clock values (e.g. "0.0s", "3.2s", "500ms", "01:23.45", "00:01:23.450") into seconds
 */
export function parseTimeValueToSeconds(val: unknown): number | null {
  if (typeof val === 'number') {
    return !isNaN(val) && isFinite(val) && val >= 0 ? val : null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim();
  if (!s) return null;

  // Milliseconds: "500ms"
  const msMatch = s.match(/^(\d+(?:\.\d+)?)\s*ms$/i);
  if (msMatch) {
    return parseFloat(msMatch[1]) / 1000;
  }

  // Seconds: "3.2s" or plain number "3.2"
  const secMatch = s.match(/^(\d+(?:\.\d+)?)\s*s?$/i);
  if (secMatch) {
    return parseFloat(secMatch[1]);
  }

  // Minutes: "1.5min" or "1.5m"
  const minMatch = s.match(/^(\d+(?:\.\d+)?)\s*m(?:in)?$/i);
  if (minMatch) {
    return parseFloat(minMatch[1]) * 60;
  }

  // Hours: "1.5h"
  const hrMatch = s.match(/^(\d+(?:\.\d+)?)\s*h$/i);
  if (hrMatch) {
    return parseFloat(hrMatch[1]) * 3600;
  }

  // HH:MM:SS.mmm or MM:SS.mmm (with . or , for decimals)
  const normalized = s.replace(',', '.');
  const parts = normalized.split(':');
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    if (!isNaN(mins) && !isNaN(secs)) {
      return mins * 60 + secs;
    }
  } else if (parts.length === 3) {
    const hrs = parseFloat(parts[0]);
    const mins = parseFloat(parts[1]);
    const secs = parseFloat(parts[2]);
    if (!isNaN(hrs) && !isNaN(mins) && !isNaN(secs)) {
      return hrs * 3600 + mins * 60 + secs;
    }
  }

  return null;
}

/**
 * Groups word-level synchronized items into natural sentences/segments while preserving individual word timings
 */
export function groupTimedWordsIntoSegments(rawWords: TranscriptWord[]): TranscriptLine[] {
  const validWords = rawWords
    .filter(w => w && typeof w.text === 'string' && w.text.trim().length > 0 && typeof w.start === 'number' && !isNaN(w.start) && w.start >= 0)
    .map(w => ({
      start: w.start,
      end: typeof w.end === 'number' && !isNaN(w.end) && w.end >= w.start ? w.end : w.start + 0.35,
      text: w.text.trim(),
    }))
    .sort((a, b) => a.start - b.start);

  if (validWords.length === 0) return [];

  const segments: TranscriptLine[] = [];
  let currentWords: TranscriptWord[] = [];

  const flushSegment = () => {
    if (currentWords.length === 0) return;
    const start = currentWords[0].start;
    const end = currentWords[currentWords.length - 1].end;
    const text = currentWords.map(w => w.text).join(' ');
    segments.push({
      start: Number(start.toFixed(2)),
      end: Number(Math.max(start + 0.1, end).toFixed(2)),
      text,
      words: [...currentWords],
    });
    currentWords = [];
  };

  for (let i = 0; i < validWords.length; i++) {
    const w = validWords[i];
    const nextW = validWords[i + 1];
    currentWords.push(w);

    const endsWithSentencePunct = /[.!?…:;]["'”’)]*$/.test(w.text);
    const pauseBeforeNext = nextW ? nextW.start - w.end : 0;
    const reachedMaxWords = currentWords.length >= 14;
    const reachedNaturalBreak = (endsWithSentencePunct && currentWords.length >= 3) || pauseBeforeNext >= 1.0;

    if (reachedNaturalBreak || reachedMaxWords) {
      flushSegment();
    }
  }
  flushSegment();

  return segments;
}

/**
 * Validates and normalizes parsed TranscriptLine[] against audio duration
 */
export function validateAndNormalizeTranscript(
  lines: TranscriptLine[],
  audioDurationSec?: number
): TranscriptLine[] {
  if (!Array.isArray(lines) || lines.length === 0) return [];

  const cleaned: TranscriptLine[] = [];
  for (const item of lines) {
    if (!item || typeof item.text !== 'string') continue;
    const text = item.text.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const start = parseTimeValueToSeconds(item.start);
    if (start === null || start < 0) continue;
    let end = parseTimeValueToSeconds(item.end);
    if (end === null || end <= start) {
      end = start + 3.5;
    }
    cleaned.push({
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      text,
      words: item.words,
    });
  }

  if (cleaned.length === 0) return [];
  cleaned.sort((a, b) => a.start - b.start);

  // Fill/fix overlapping or missing end times using next segment's start time
  for (let i = 0; i < cleaned.length - 1; i++) {
    const cur = cleaned[i];
    const next = cleaned[i + 1];
    if (cur.end > next.start && next.start > cur.start) {
      cur.end = Number(next.start.toFixed(2));
    }
  }

  // If audioDurationSec is provided and valid, filter out segments that start entirely beyond a reasonable margin of the audio duration
  if (audioDurationSec && audioDurationSec > 0) {
    const maxAllowedStart = audioDurationSec * 1.15 + 30;
    const withinDuration = cleaned.filter(l => l.start <= maxAllowedStart);
    if (withinDuration.length > 0) {
      return withinDuration;
    }
  }

  return cleaned;
}

function parseJsonTranscript(jsonText: string): TranscriptLine[] {
  const cleanedText = jsonText
    .replace(/^\uFEFF/, '')
    .trim();
  const data = JSON.parse(cleanedText);

  // Case 1: { "segments": [...] } or { "transcript": [...] } or { "lines": [...] } or { "cues": [...] }
  const segmentsArr = Array.isArray(data)
    ? data
    : Array.isArray(data?.segments)
      ? data.segments
      : Array.isArray(data?.transcript)
        ? data.transcript
        : Array.isArray(data?.lines)
          ? data.lines
          : Array.isArray(data?.cues)
            ? data.cues
            : null;

  if (segmentsArr && segmentsArr.length > 0) {
    // Check if the array is actually a flat array of single words
    const avgLen = segmentsArr.reduce((acc: number, it: any) => acc + String(it?.text || it?.word || '').trim().split(/\s+/).length, 0) / segmentsArr.length;
    if (avgLen <= 1.35 && segmentsArr.length > 5 && !Array.isArray(data?.segments)) {
      const words: TranscriptWord[] = segmentsArr
        .map((w: any) => ({
          start: parseTimeValueToSeconds(w.start ?? w.startTime ?? w.begin) ?? -1,
          end: parseTimeValueToSeconds(w.end ?? w.endTime ?? w.finish) ?? -1,
          text: String(w.text ?? w.word ?? w.value ?? '').trim(),
        }))
        .filter((w: TranscriptWord) => w.start >= 0 && w.text.length > 0);
      return groupTimedWordsIntoSegments(words);
    }

    const result: TranscriptLine[] = [];
    for (const seg of segmentsArr) {
      if (!seg || typeof seg !== 'object') continue;
      const start = parseTimeValueToSeconds(seg.start ?? seg.startTime ?? seg.begin ?? seg.clipBegin);
      if (start === null) continue;
      const end = parseTimeValueToSeconds(seg.end ?? seg.endTime ?? seg.finish ?? seg.clipEnd) ?? (start + 3.5);
      const text = String(seg.text ?? seg.content ?? seg.sentence ?? seg.line ?? '').trim();

      let segWords: TranscriptWord[] | undefined;
      if (Array.isArray(seg.words)) {
        const parsedWords: TranscriptWord[] = seg.words
          .map((w: any) => {
            const ws = parseTimeValueToSeconds(w.start ?? w.startTime ?? w.begin);
            if (ws === null) return null;
            const we = parseTimeValueToSeconds(w.end ?? w.endTime) ?? (ws + 0.3);
            const wt = String(w.text ?? w.word ?? '').trim();
            return wt ? { start: ws, end: we, text: wt } : null;
          })
          .filter(Boolean) as TranscriptWord[];
        if (parsedWords.length > 0) segWords = parsedWords;
      }

      const finalText = text || (segWords ? segWords.map(w => w.text).join(' ') : '');
      if (finalText) {
        result.push({
          start,
          end: Math.max(start + 0.1, end),
          text: finalText,
          words: segWords,
        });
      }
    }
    if (result.length > 0) return result;
  }

  // Case 2: { "words": [ { "start": 0.0, "end": 0.35, "text": "Era" }, ... ] }
  if (Array.isArray(data?.words) && data.words.length > 0) {
    const words: TranscriptWord[] = data.words
      .map((w: any) => {
        const ws = parseTimeValueToSeconds(w.start ?? w.startTime ?? w.begin);
        if (ws === null) return null;
        const we = parseTimeValueToSeconds(w.end ?? w.endTime) ?? (ws + 0.35);
        const wt = String(w.text ?? w.word ?? '').trim();
        return wt ? { start: ws, end: we, text: wt } : null;
      })
      .filter(Boolean) as TranscriptWord[];
    return groupTimedWordsIntoSegments(words);
  }

  return [];
}

function parseSmilOrXmlTranscript(
  xmlText: string,
  xhtmlMap?: Map<string, Document>
): TranscriptLine[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const results: TranscriptLine[] = [];

    // 1. Standard EPUB 3 Media Overlays / SMIL (<par> with <text> and <audio>)
    const pars = Array.from(doc.getElementsByTagName('par'));
    for (const par of pars) {
      const audioEl = par.getElementsByTagName('audio')[0];
      const textEl = par.getElementsByTagName('text')[0];
      if (!audioEl) continue;

      const clipBegin = parseTimeValueToSeconds(
        audioEl.getAttribute('clipBegin') ||
        audioEl.getAttribute('clip-begin') ||
        audioEl.getAttribute('begin') ||
        audioEl.getAttribute('start')
      );
      if (clipBegin === null) continue;

      const clipEnd = parseTimeValueToSeconds(
        audioEl.getAttribute('clipEnd') ||
        audioEl.getAttribute('clip-end') ||
        audioEl.getAttribute('end')
      ) ?? (clipBegin + 3.5);

      let resolvedText = '';
      if (textEl) {
        const srcAttr = textEl.getAttribute('src') || '';
        const inlineText = (textEl.textContent || '').trim();
        if (srcAttr && xhtmlMap && xhtmlMap.size > 0) {
          const [filePart, fragmentId] = srcAttr.split('#');
          const cleanFile = filePart.split('/').pop()?.toLowerCase() || '';
          let targetDoc: Document | undefined;
          for (const [k, d] of xhtmlMap.entries()) {
            if (k.toLowerCase().endsWith(cleanFile) || k.toLowerCase() === filePart.toLowerCase()) {
              targetDoc = d;
              break;
            }
          }
          if (targetDoc && fragmentId) {
            const fragEl = targetDoc.getElementById(fragmentId) || targetDoc.querySelector(`[id="${CSS.escape(fragmentId)}"]`);
            if (fragEl && fragEl.textContent) {
              resolvedText = fragEl.textContent.replace(/\s+/g, ' ').trim();
            }
          }
        }
        if (!resolvedText && inlineText) {
          resolvedText = inlineText.replace(/\s+/g, ' ').trim();
        }
      }

      if (resolvedText) {
        results.push({
          start: clipBegin,
          end: Math.max(clipBegin + 0.1, clipEnd),
          text: resolvedText,
        });
      }
    }

    if (results.length > 0) return results;

    // 2. Generic XML / TTML (<p begin="..." end="..."> or <segment start="..." end="..."> or <cue>)
    const candidateTags = ['p', 'segment', 'cue', 'line', 'item', 'text'];
    for (const tag of candidateTags) {
      const els = Array.from(doc.getElementsByTagName(tag));
      for (const el of els) {
        const start = parseTimeValueToSeconds(
          el.getAttribute('start') ||
          el.getAttribute('begin') ||
          el.getAttribute('clipBegin') ||
          el.getAttribute('t')
        );
        if (start === null) continue;
        const dur = parseTimeValueToSeconds(el.getAttribute('dur') || el.getAttribute('d'));
        const endAttr = parseTimeValueToSeconds(
          el.getAttribute('end') ||
          el.getAttribute('clipEnd')
        );
        const end = endAttr !== null ? endAttr : dur !== null ? start + dur : start + 3.5;
        const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (txt) {
          results.push({ start, end: Math.max(start + 0.1, end), text: txt });
        }
      }
      if (results.length > 0) break;
    }

    return results;
  } catch {
    return [];
  }
}

function parseLrcOrVttOrSrtTranscript(raw: string): TranscriptLine[] {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const results: TranscriptLine[] = [];

  // 1. Try WebVTT / SRT block format: "00:00:00.000 --> 00:00:03.200"
  const cueRegex = /(?:^|\n)(?:[^\n]*\n)?(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3}|\d{1,2}:\d{2})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3}|\d{1,2}:\d{2})[^\n]*\n([\s\S]*?)(?=\n\s*\n|\n(?:[^\n]*\n)?\d{1,2}:\d{2}(?::\d{2})?[.,]?\d*\s*-->|$)/g;
  let match: RegExpExecArray | null;
  while ((match = cueRegex.exec(text)) !== null) {
    const start = parseTimeValueToSeconds(match[1]);
    const end = parseTimeValueToSeconds(match[2]);
    const cueText = match[3]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (start !== null && cueText) {
      results.push({
        start,
        end: end !== null && end > start ? end : start + 3.5,
        text: cueText,
      });
    }
  }
  if (results.length > 0) return results;

  // 2. Try LRC format: "[mm:ss.xx] Texto"
  const lines = text.split('\n');
  const lrcEntries: { start: number; text: string }[] = [];
  const lrcRegex = /\[(\d{1,3}:\d{2}(?:[.:]\d{1,3})?)\]/g;
  for (const line of lines) {
    const timestamps: number[] = [];
    let m: RegExpExecArray | null;
    lrcRegex.lastIndex = 0;
    while ((m = lrcRegex.exec(line)) !== null) {
      const sec = parseTimeValueToSeconds(m[1]);
      if (sec !== null) timestamps.push(sec);
    }
    if (timestamps.length > 0) {
      const lyricText = line.replace(/\[[^\]]*\]/g, '').trim();
      if (lyricText) {
        for (const ts of timestamps) {
          lrcEntries.push({ start: ts, text: lyricText });
        }
      }
    }
  }

  if (lrcEntries.length > 0) {
    lrcEntries.sort((a, b) => a.start - b.start);
    return lrcEntries.map((item, idx) => {
      const next = lrcEntries[idx + 1];
      return {
        start: item.start,
        end: next && next.start > item.start ? next.start : item.start + 4.0,
        text: item.text,
      };
    });
  }

  return [];
}

function parseTsTranscript(raw: string): TranscriptLine[] {
  // Extracts array/object literal from TypeScript/JS files (e.g. `export default { ... }` or `export const transcript = [ ... ]`)
  const trimmed = raw.replace(/^\uFEFF/, '').trim();
  try {
    return parseJsonTranscript(trimmed);
  } catch {}

  const firstBrace = trimmed.search(/[\[{]/);
  if (firstBrace !== -1) {
    const lastBracket = Math.max(trimmed.lastIndexOf(']'), trimmed.lastIndexOf('}'));
    if (lastBracket > firstBrace) {
      const candidate = trimmed
        .slice(firstBrace, lastBracket + 1)
        .replace(/,\s*([\]}])/g, '$1');
      try {
        return parseJsonTranscript(candidate);
      } catch {}
    }
  }
  return [];
}

function parseTextContentByFormat(content: string, ext: string): TranscriptLine[] {
  const cleanExt = ext.toLowerCase().replace(/^\./, '');
  if (cleanExt === 'json') {
    return parseJsonTranscript(content);
  }
  if (cleanExt === 'xml' || cleanExt === 'smil') {
    return parseSmilOrXmlTranscript(content);
  }
  if (cleanExt === 'ts' || cleanExt === 'js') {
    return parseTsTranscript(content);
  }
  if (cleanExt === 'lrc' || cleanExt === 'vtt' || cleanExt === 'srt') {
    return parseLrcOrVttOrSrtTranscript(content);
  }
  return parseTextContentAuto(content);
}

function parseTextContentAuto(content: string): TranscriptLine[] {
  const trimmed = content.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const res = parseJsonTranscript(trimmed);
      if (res.length > 0) return res;
    } catch {}
  }
  if (trimmed.startsWith('<')) {
    const res = parseSmilOrXmlTranscript(trimmed);
    if (res.length > 0) return res;
  }
  const subRes = parseLrcOrVttOrSrtTranscript(trimmed);
  if (subRes.length > 0) return subRes;
  return parseTsTranscript(trimmed);
}

/**
 * Unpacks an EPUB (ZIP archive) in the browser and extracts EPUB 3 Media Overlays (.smil + .xhtml)
 */
async function parseEpubMediaOverlays(file: File): Promise<{
  lines: TranscriptLine[];
  hasContentButNoSync: boolean;
}> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Locate End of Central Directory (EOCD) signature 0x06054b50
  let eocdOffset = -1;
  const minEocdOffset = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= minEocdOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('invalid_epub_zip');
  }

  const cdEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  interface ZipEntry {
    fileName: string;
    compressionMethod: number;
    compressedSize: number;
    uncompressedSize: number;
    localHeaderOffset: number;
  }

  const entries: ZipEntry[] = [];
  let ptr = cdOffset;
  const utf8Decoder = new TextDecoder('utf-8');

  for (let i = 0; i < cdEntries && ptr + 46 <= bytes.length; i++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const uncompressedSize = view.getUint32(ptr + 24, true);
    const fileNameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const fileNameBytes = bytes.subarray(ptr + 46, ptr + 46 + fileNameLen);
    const fileName = utf8Decoder.decode(fileNameBytes);

    entries.push({
      fileName,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    ptr += 46 + fileNameLen + extraLen + commentLen;
  }

  const extractEntryText = async (entry: ZipEntry): Promise<string> => {
    const lh = entry.localHeaderOffset;
    if (lh + 30 > bytes.length || view.getUint32(lh, true) !== 0x04034b50) return '';
    const fnLen = view.getUint16(lh + 26, true);
    const exLen = view.getUint16(lh + 28, true);
    const dataStart = lh + 30 + fnLen + exLen;
    const compData = bytes.subarray(dataStart, dataStart + entry.compressedSize);

    if (entry.compressionMethod === 0) {
      return utf8Decoder.decode(compData);
    } else if (entry.compressionMethod === 8 && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(compData).catch(() => {});
      writer.close().catch(() => {});
      const resp = new Response(ds.readable);
      const ab = await resp.arrayBuffer();
      return utf8Decoder.decode(new Uint8Array(ab));
    }
    return '';
  };

  const smilEntries = entries.filter(e => /\.smil$/i.test(e.fileName));
  const xhtmlEntries = entries.filter(e => /\.(xhtml|html|htm|xml)$/i.test(e.fileName) && !/container\.xml$/i.test(e.fileName));
  const jsonEntries = entries.filter(e => /\.json$/i.test(e.fileName));

  const domParser = new DOMParser();
  const xhtmlMap = new Map<string, Document>();
  for (const xe of xhtmlEntries) {
    try {
      const txt = await extractEntryText(xe);
      if (txt) {
        const doc = domParser.parseFromString(txt, 'application/xhtml+xml');
        xhtmlMap.set(xe.fileName, doc);
      }
    } catch {}
  }

  const allLines: TranscriptLine[] = [];
  for (const se of smilEntries) {
    try {
      const smilTxt = await extractEntryText(se);
      if (smilTxt) {
        const parsed = parseSmilOrXmlTranscript(smilTxt, xhtmlMap);
        if (parsed.length > 0) {
          allLines.push(...parsed);
        }
      }
    } catch {}
  }

  if (allLines.length === 0 && jsonEntries.length > 0) {
    for (const je of jsonEntries) {
      try {
        const jTxt = await extractEntryText(je);
        if (jTxt) {
          const parsed = parseJsonTranscript(jTxt);
          if (parsed.length > 0) {
            allLines.push(...parsed);
          }
        }
      } catch {}
    }
  }

  return {
    lines: allLines,
    hasContentButNoSync: allLines.length === 0 && xhtmlEntries.length > 0,
  };
}

export type ParseSynchronizedTextResult =
  | { ok: true; lines: TranscriptLine[]; fileName: string }
  | { ok: false; reason: 'epub_no_media_overlays' | 'invalid_or_no_timestamps' | 'unsupported_format'; fileName: string };

/**
 * Parses and validates an external synchronized text file (.epub, .json, .xml, .smil, .ts, .vtt, .srt, .lrc)
 */
export async function parseSynchronizedTextFile(
  file: File,
  audioDurationSec?: number
): Promise<ParseSynchronizedTextResult> {
  const fileName = file.name;
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  try {
    if (ext === 'epub') {
      const { lines, hasContentButNoSync } = await parseEpubMediaOverlays(file);
      const validated = validateAndNormalizeTranscript(lines, audioDurationSec);
      if (validated.length > 0) {
        return { ok: true, lines: validated, fileName };
      }
      return {
        ok: false,
        reason: hasContentButNoSync ? 'epub_no_media_overlays' : 'invalid_or_no_timestamps',
        fileName,
      };
    }

    const rawText = await file.text();
    const rawLines = parseTextContentByFormat(rawText, ext);
    const validated = validateAndNormalizeTranscript(rawLines, audioDurationSec);

    if (validated.length > 0) {
      return { ok: true, lines: validated, fileName };
    }

    return { ok: false, reason: 'invalid_or_no_timestamps', fileName };
  } catch {
    return { ok: false, reason: 'invalid_or_no_timestamps', fileName };
  }
}

