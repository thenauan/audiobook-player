import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X, Search, Settings as SettingsIcon, Volume2, VolumeX, Moon, ChevronLeft, Trash2, ListMusic, CheckCircle2, Power } from 'lucide-react';
import { HelpCircle } from 'lucide-react';
import { RiApps2Line } from 'react-icons/ri';
import { 
  RiBookOpenLine 
} from 'react-icons/ri';
import { BsCheck2 } from 'react-icons/bs';
import { LuBookHeadphones } from 'react-icons/lu';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { Audiobook, Author, Chapter, TranscriptLine, AUTHORS_DATABASE, BOOKS_DATABASE, INITIAL_COLLECTIONS, GENRE_HIERARCHY, getGenreEmoji, getSubgenreEmoji, getSubgenreGradient, resolveNarratorAndLanguage, isBookInGenre, isBookInSubgenre, Collection, COLLECTION_AVAILABLE_EMOJIS, COLLECTION_AVAILABLE_PALETTES } from './data';
import { parseAudioMetadata, parseSynchronizedTextFile, getGenericBookCover, getAuthorAvatar, getEffectiveAuthorAvatar, GENERIC_COVER_COLORS, getGenericCoverColor, getGenericAuthorColor, getBookHighlightTheme, hexToHsl, hslToHex, findActiveTranscriptIndex } from './audioUtils';
import { storeAudioBlob, getAudioBlob, deleteAudioBlob, getAllAudioBlobKeys } from './audioStorage';
import { readAppData, writeAppData, writeLocalMirror } from './appDataStore';
import { autoCropImageToSquare, autoCropImageToEbookCover } from './imageProcessing';
import Sidebar, { MobileBottomBar, tabBarStore } from './components/Sidebar';
import { QueueItemRow, MenuOptionItem, PagedMenu, PopupMorphContainer, SmoothSubMorph, getBookDurationInSeconds, clearButtonCoverAnchorCache, getButtonCoverPopupStyle, MorphPopup, morphTriggerAnimate, EMPTY_BOOK } from './components/Popovers';
import MiniPlayer, { MobileMiniPlayer } from './components/MiniPlayer';
import FullscreenPlayer from './components/FullscreenPlayer';
import BookDetailView from './views/BookDetailView';
import { useIsMobile, useIsTouchDevice, useIsCompactPlayer, useIsLandscapePhone } from './components/MobileContextMenu';
import { MobileSheet } from './components/MobileSheet';
import { desktop, IS_INSTALLED_APP } from './desktopBridge';
import { PlayerPopup } from './components/PlayerPopup';
import { ScreenErrorBoundary } from './components/ScreenErrorBoundary';
import { APP_VERSION } from './version';
import { shareOrDownload as shareStoryBlob, downloadBlob as downloadShareBlob } from './shareStory';
import { MobileConfirmCard } from './components/MobileConfirm';
import { splitAuthorNames, bookHasAuthor, getBookAuthorNames, renameAuthorInField } from './authorUtils';
import { MobileHeaderActions, type MobileHeaderAction } from './components/MobileHeaderActions';
import { installTouchMenus } from './components/touchMenu';
import { installScrollFades } from './components/scrollFade';
import ZoomTransitionLayer, { requestZoomClose, canZoomCloseTo } from './components/ZoomTransitionLayer';
const loadImageCropperSquare = () => import('./ImageCropperSquare');
const loadHelpCenterView = () => import('./views/HelpCenterView');
const loadSettingsView = () => import('./views/SettingsView');
// Tela sob demanda que, depois de pré-carregada, aparece na hora (sem passar pela tela de carregamento,
// que no celular fazia a tela nova surgir só no meio da animação de abrir)
function lazyPreloaded<T extends React.ComponentType<any>>(loader: () => Promise<{ default: T }>) {
  let Loaded: React.ComponentType<any> | null = null;
  const load = () => loader().then(m => { Loaded = m.default; return m; });
  const Lazy = React.lazy(load) as React.ComponentType<any>;
  const Component = ((props: any) => (Loaded ? <Loaded {...props} /> : <Lazy {...props} />)) as unknown as T;
  return { Component, load };
}
const imageCropperLazy = lazyPreloaded(loadImageCropperSquare);
const helpCenterLazy = lazyPreloaded(loadHelpCenterView);
const settingsLazy = lazyPreloaded(loadSettingsView);
const ImageCropperSquare = imageCropperLazy.Component;
const HelpCenterView = helpCenterLazy.Component;
const DevToolsModal = React.lazy(() => import('./views/DevToolsModal'));
const SettingsView = settingsLazy.Component;

// Pré-carrega as telas sob demanda quando o app fica ocioso, para abrirem sem tela de carregamento
if (typeof window !== 'undefined') {
  const preload = () => { settingsLazy.load(); helpCenterLazy.load(); imageCropperLazy.load(); };
  const ric = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined;
  if (ric) ric(preload, { timeout: 2500 });
  else setTimeout(preload, 1500);
}
import { getHelpThemes } from './helpTranslations';
import { getGenreName, getSubgenreName } from './genreTranslations';
import { getNationalityDisplayName, NATIONALITIES_LIST, findNationalityEntry } from './nationalityTranslations';
import {
  type AppLanguage,
  type SupportedLanguage,
  LANGUAGE_NATIVE_NAMES,
  getLanguageDisplayName,
  getLanguageCardName,
  normalizeAudiobookLanguage,
  findRecognizedLanguageEntry,
  getSystemLanguage,
  getTranslation,
  I18nContext,
} from './translations';
import { Text, Headphones, ExternalLink, Share, Download, Quote, Play, Pause, ListPlus, FileText, FilePlus2, Info, MoreHorizontal, Edit3, Maximize2, Upload, ArrowDownAZ, ArrowUpZA, Calendar, CalendarClock, Clock, Timer, BookOpen, User, Gauge, FolderOpen, ChevronRight, ChevronDown, Check, Database, FileAudio, HardDrive, Star, StarOff, Palette, Type, RotateCcw, Bell, RefreshCw, Bookmark, ArrowUpDown, Code2, Globe, Turtle, Rabbit, Clock3, Clock6, Clock9, Clock12, Dog, Bird, FolderPlus, Plus, Sun, Laptop, Monitor, Hand, ALargeSmall } from 'lucide-react';
import { normalizeSearchStr, toPhoneticSearchStr, evaluateSearchTermMatch, matchesNationality } from './components/searchScoring';
import { getBackdropProps, useCloseOnOutsideScrollOrDrag } from './components/popupUtils';
import { _FavoriteChapterCard, CollectionCard, CollectionsContext, CollectionItemsPickerContent, CollectionPickerPopupContent, AuthorCard, OtherAppCard, _FavoriteAuthorCard, BookCard, ScreenSelectableRow, SCREEN_GROUP_CLASS } from './components/LibraryCards';
import { MOCK_DEV_AUTHORS, MOCK_DEV_AUDIOBOOKS, normalizeBookCompareStr, extractNormalizedFileName, isSameAudiobook, deduplicateAudiobooks, loadBooksFromJson, loadAuthorsFromJson, loadCollectionsFromJson, safeLocalGet, isTestBookId, isTestAuthorId, TEST_COLLECTION_IDS } from './components/libraryData';

const getSpeedIcon = (s: number) => {
  if (s < 1) return <Turtle size={14} className="shrink-0" />;
  if (s === 1) return <Dog size={14} className="shrink-0" />;
  if (s < 2) return <Rabbit size={14} className="shrink-0" />;
  return <Bird size={14} className="shrink-0" />;
};

const getSleepTimerIcon = (mins: number) => {
  if (mins <= 15) return <Clock3 size={14} className="shrink-0" />;
  if (mins <= 30) return <Clock6 size={14} className="shrink-0" />;
  if (mins <= 45) return <Clock9 size={14} className="shrink-0" />;
  if (mins <= 60) return <Clock12 size={14} className="shrink-0" />;
  if (mins <= 90) return <Clock6 size={14} className="shrink-0" />;
  return <Clock12 size={14} className="shrink-0" />;
};

type ScreenState = {
  id: string; // 'home', 'search', 'library', 'history', 'settings', 'help', 'book-detail', 'author-detail', 'genre-detail', etc.
  data?: any; // The book or author object
  scrollTop?: number; // Rolagem da tela ao sair dela (restaurada ao voltar)
};


// Ordena titulos com numeros antes das letras e em ordem numerica natural ("2" antes de "10")
const LEADING_DIGIT_RE = /^[0-9\u0660-\u0669\u06F0-\u06F9]/;
function compareTitles(a: string, b: string, lang: string): number {
  const clean = (x: string) => (x || '').trim().replace(/^[\s"'()[\]{}._-]+/, '');
  const ca = clean(a);
  const cb = clean(b);
  const da = LEADING_DIGIT_RE.test(ca);
  const db = LEADING_DIGIT_RE.test(cb);
  if (da !== db) return da ? -1 : 1;
  return ca.localeCompare(cb, lang, { sensitivity: 'base', numeric: true });
}

// Biografias geradas automaticamente por versões antigas (sempre em português): tratadas como vazias
function isAutoGeneratedBio(bio: string): boolean {
  return /^(Obras de|Autor de) .+\.$/.test(bio.trim());
}

// ===== Transições entre telas =====
// Computador: surge suavemente. Celular: como a navegação do iOS — as duas telas se movem juntas:
// ao avançar, a nova entra por cima deslizando da direita e a anterior recua um terço para a esquerda,
// escurecendo um pouco; ao voltar, o contrário. Trocar de aba (ou abrir pela capa) só funde as telas.
// "popSwipe": o gesto da borda já levou a tela embora; a anterior só termina de voltar ao lugar.
// "instant": o próprio navegador (Safari) já animou o voltar com o gesto dele; aqui a troca é imediata.
type NavDirection = 'push' | 'pop' | 'tab' | 'popSwipe' | 'instant';
let navDirection: NavDirection = 'tab';
let popSwipeAt = 0;
let instantAt = 0;
// Gesto da borda: quanto a tela já tinha andado (px) e a largura da área, para a animação continuar dali
let swipeOffsetPx = 0;
let swipeAreaWidth = 0;
function setSwipeRelease(offset: number, width: number) { swipeOffsetPx = offset; swipeAreaWidth = width; }
function setNavDirection(dir: NavDirection) {
  // O voltar logo depois do gesto da borda mantém o modo do gesto
  if (dir === 'pop' && Date.now() - popSwipeAt < 600) dir = 'popSwipe';
  if (dir === 'pop' && Date.now() - instantAt < 600) dir = 'instant';
  if (dir === 'popSwipe') popSwipeAt = Date.now();
  if (dir === 'instant') instantAt = Date.now();
  navDirection = dir;
}
const isMobileNav = () => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 1023px)').matches;
// Curva da navegação do iOS: rápida no começo e assentando suavemente (sem ultrapassar)
const IOS_NAV = { type: 'spring', stiffness: 300, damping: 34, mass: 0.9, restDelta: 0.5 };
// A tela que sai fica sobreposta à que entra (mesma posição), para as duas se moverem juntas.
// Como a rolagem volta ao topo na troca, a tela que sai é deslocada pelo quanto estava rolada
// (senão ela "pula" para o próprio topo e os itens piscam/se sobrepõem durante a animação).
let exitScrollTop = 0;
let exitTopPx: number | null = null;
// Ao voltar, a tela anterior reabre na rolagem em que estava: a que sai é compensada por essa rolagem
let exitRestoreOffset = 0;
// Durante a troca de telas, a barra de abas e o miniplayer ficam parados: as rolagens feitas pelo app
// (voltar ao topo, restaurar a posição da tela anterior) não recolhem nem expandem a barra
let navBarFreezeUntil = 0;
function captureExitScroll(el: HTMLElement | null) {
  navBarFreezeUntil = Date.now() + 900;
  exitScrollTop = el?.scrollTop || 0;
  exitTopPx = null;
  exitRestoreOffset = 0;
  if (!el) return;
  // Posição real da tela atual dentro da área rolável (a tela que sai fica exatamente onde estava)
  const screen = Array.from(el.children).find(c => getComputedStyle(c).position !== 'absolute' && c.getBoundingClientRect().height > 0);
  // (descontando a margem própria da tela, que continua valendo quando ela fica absoluta)
  if (screen) exitTopPx = screen.getBoundingClientRect().top - el.getBoundingClientRect().top - (parseFloat(getComputedStyle(screen).marginTop) || 0);
}
// A posição da tela que sai é aplicada na hora (sem animar o top/left/right)
const OVERLAY_T = { top: { duration: 0 }, left: { duration: 0 }, right: { duration: 0 }, position: { duration: 0 } };
const exitOverlay = () => ({
  position: 'absolute',
  top: exitTopPx !== null ? exitTopPx + exitRestoreOffset : `calc(var(--app-header-top) + 60px - ${exitScrollTop - exitRestoreOffset}px)`,
  left: 'max(var(--page-margin), var(--safe-left))',
  right: 'max(var(--page-margin), var(--safe-right))',
});
const transicaoConteudo: any = {
  get escondido() {
    if (!isMobileNav()) return { opacity: 0, scale: 0.985, y: 8, x: 0, transformOrigin: 'center top' };
    // "relative": sem isso o zIndex da tela que entra não vale e a que sai (absoluta) fica por cima dela
    if (navDirection === 'push') return { x: '100%', opacity: 1, scale: 1, y: 0, zIndex: 2, position: 'relative' };
    if (navDirection === 'instant') return { opacity: 1, x: 0, scale: 1, y: 0, zIndex: 1 };
    if (navDirection === 'popSwipe') {
      // A tela anterior já estaria parcialmente revelada pelo dedo: começa proporcionalmente mais perto
      const w = swipeAreaWidth || window.innerWidth;
      return { x: -0.3 * w + swipeOffsetPx * 0.3, opacity: 0.4, scale: 1, y: 0, zIndex: 1, position: 'relative' };
    }
    if (navDirection === 'pop') return { x: '-30%', opacity: 0, scale: 1, y: 0, zIndex: 1, position: 'relative' };
    return { opacity: 0, x: 0, scale: 1, y: 0, zIndex: 1 };
  },
  get visivel() {
    if (!isMobileNav()) {
      return {
        opacity: 1, scale: 1, y: 0, x: 0,
        transition: { type: 'spring', stiffness: 520, damping: 38, mass: 0.55, opacity: { duration: 0.13, ease: 'easeOut' } },
      };
    }
    if (navDirection === 'tab') return { opacity: 1, x: 0, scale: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } };
    if (navDirection === 'instant') return { opacity: 1, x: 0, scale: 1, y: 0, transition: { duration: 0 } };
    return { opacity: 1, x: 0, scale: 1, y: 0, transition: { x: IOS_NAV, opacity: { duration: 0.3, ease: 'easeOut' } } };
  },
  get saindo() {
    if (!isMobileNav()) return { opacity: 0, scale: 0.99, y: -4, transition: { duration: 0.08, ease: [0.32, 0, 0.67, 0] } };
    if (navDirection === 'push') return { ...exitOverlay(), x: '-30%', opacity: 0, zIndex: 1, transition: { ...OVERLAY_T, x: IOS_NAV, opacity: { duration: 0.22, ease: 'easeOut' } } };
    if (navDirection === 'pop') return { ...exitOverlay(), x: '100%', opacity: 0, zIndex: 2, transition: { ...OVERLAY_T, x: IOS_NAV, opacity: { duration: 0.3, ease: 'easeIn' } } };
    if (navDirection === 'popSwipe') {
      // Continua de onde o dedo soltou até sair pela direita
      const w = swipeAreaWidth || window.innerWidth;
      return { ...exitOverlay(), x: [swipeOffsetPx, w], opacity: 0, zIndex: 2, transition: { ...OVERLAY_T, x: { type: 'spring', stiffness: 380, damping: 40, mass: 0.7 }, opacity: { duration: 0.25, ease: 'easeIn' } } };
    }
    if (navDirection === 'instant') return { ...exitOverlay(), opacity: 0, transition: { ...OVERLAY_T, opacity: { duration: 0 } } };
    // Troca de aba / volta para a capa: a tela que sai sai do fluxo na hora (a nova não é empurrada para baixo)
    return { ...exitOverlay(), opacity: 0, transition: { ...OVERLAY_T, opacity: { duration: 0.12, ease: 'easeIn' } } };
  },
};

// Paleta da capa: agrupa os pixels por matiz (24 faixas) e escolhe a cor dominante mais marcante (quantidade
// x saturação), em vez da média de todos os pixels (que transformava capas de duas cores em um tom
// acinzentado). Também devolve uma segunda cor marcante, bem diferente da primeira, quando houver.
// Capas quase sem cor (preto e branco, cinzas) ficam com o tom neutro médio.
function extractCoverPalette(data: Uint8ClampedArray): { primary: string; secondary?: string } | null {
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

// Fila para gravar no aparelho: sem a cópia do livro inteiro e sem a capa em cada item (eram gravados de
// novo a cada mudança da fila); ao abrir, a fila é reconectada aos livros da biblioteca
function slimQueueForStorage(queue: any[]): any[] {
  return queue.map(item => {
    const { book: _book, cover, ...rest } = item || {};
    return { ...rest, cover: typeof cover === 'string' && cover.length < 512 ? cover : '' };
  });
}

// iPhone/iPad (inclusive iPad que se apresenta como Mac): sem botão "voltar" do sistema
const IS_APPLE_TOUCH = typeof navigator !== 'undefined' && (
  /iPhone|iPad|iPod/.test(navigator.userAgent || '') ||
  (/Macintosh/.test(navigator.userAgent || '') && (navigator.maxTouchPoints || 0) > 1)
);

export type QueueItem = {
  id: string;
  bookId: string;
  bookTitle: string;
  author: string;
  cover: string;
  chapterId: number | string;
  chapterTitle: string;
  startTime: number;
  duration: number;
  chapterIndex: number;
  book: Audiobook;
};

export type PlaybackReturnPoint = {
  bookId: string;
  chapterId: string | number;
  chapterIndex: number;
  chapterElapsed: number;
  globalTime: number;
  transportedToTime: number;
  transportedToChapterId: string | number;
  createdAt: number;
};

function getLanguageData(lang: string, currentLang: AppLanguage = 'pt') {
  const canonical = normalizeAudiobookLanguage(lang) || lang;
  const entry = findRecognizedLanguageEntry(canonical);
  const resolved = currentLang === 'system' ? getSystemLanguage() : currentLang;
  return {
    name: getLanguageCardName(canonical, resolved),
    flag: entry ? entry.flag : '🌐',
    gradient: entry ? entry.gradient : 'from-purple-600 via-violet-600 to-indigo-800',
  };
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenState>({ id: 'home' });
  // Interface mobile abaixo do breakpoint md
  const isMobile = useIsMobile();
  // Celulares e tablets (qualquer orientação): marcações e "adicionar à coleção" abrem como submenus em tela cheia
  const isTouchDevice = useIsTouchDevice();
  // Celular deitado: nome da tela sempre no cabeçalho (o título grande da página fica oculto)
  const isLandscapePhone = useIsLandscapePhone();
  const useFullScreenSheets = isMobile || isTouchDevice;
  // Mobile: os resultados da pesquisa aparecem na própria tela (no lugar do histórico)
  const [mobileSearchSlot, setMobileSearchSlot] = useState<HTMLDivElement | null>(null);
  // Mobile: barra de navegação/filtro de "Todos os audiobooks" recolhida até ser tocada
  const [isMobileAlphaNavOpen, setIsMobileAlphaNavOpen] = useState(false);
  const alphaNavPressRef = useRef<{ y: number; moved: boolean; lastId: string | null } | null>(null);
  // Miniplayer simplificado também em telas de toque baixas com menu lateral (ex.: iPad mini deitado)
  const isCompactPlayer = useIsCompactPlayer();
  // Mobile: a barra de abas se recolhe ao rolar para baixo e volta ao rolar para cima (estado fora do App)
  const lastScrollTopRef = useRef(0);
  const [historyStack, setHistoryStack] = useState<ScreenState[]>([]);


  

  
  type SortOption = 'name-asc' | 'name-desc' | 'year-desc' | 'year-asc' | 'duration-desc' | 'duration-asc';
  type StatusFilter = 'all' | 'in-progress' | 'completed' | 'unstarted' | 'favorites';
  const [books, setBooks] = useState<Audiobook[]>(() => loadBooksFromJson(safeLocalGet('app_books')));
  const booksRef = useRef<Audiobook[]>(books);
  booksRef.current = books;
  const [authors, setAuthors] = useState<Author[]>(() => loadAuthorsFromJson(safeLocalGet('app_authors')));

  // Dados da biblioteca: o IndexedDB é a fonte de verdade; nada é gravado nele antes de ser lido
  // (senão uma cópia antiga do localStorage poderia sobrescrever os dados completos)
  const [isLibraryDataHydrated, setIsLibraryDataHydrated] = useState(false);
  const storageErrorShownRef = useRef(false);
  // Gravações agrupadas e adiadas: transformar a biblioteca/fila em texto e gravar no aparelho é pesado;
  // feito na hora (a cada mudança) travava a página por instantes e, no iPhone, chegava a cortar o áudio.
  // Cada chave guarda só o último valor e é gravada ~0,5 s depois, quando o aparelho estiver livre
  // (e na hora, se o app for fechado ou ficar em segundo plano).
  const pendingWritesRef = useRef(new Map<string, () => void>());
  const pendingTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const flushPendingWrites = useCallback(() => {
    pendingTimersRef.current.forEach(timer => clearTimeout(timer));
    pendingTimersRef.current.clear();
    const writes = Array.from(pendingWritesRef.current.values());
    pendingWritesRef.current.clear();
    writes.forEach(write => { try { write(); } catch {} });
  }, []);
  const scheduleWrite = useCallback((key: string, write: () => void) => {
    pendingWritesRef.current.set(key, write);
    const prev = pendingTimersRef.current.get(key);
    if (prev) clearTimeout(prev);
    pendingTimersRef.current.set(key, setTimeout(() => {
      pendingTimersRef.current.delete(key);
      const run = () => {
        const fn = pendingWritesRef.current.get(key);
        pendingWritesRef.current.delete(key);
        try { fn?.(); } catch {}
      };
      const ric = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => number) | undefined;
      if (ric) ric(run, { timeout: 1500 }); else run();
    }, 500));
  }, []);
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushPendingWrites(); };
    window.addEventListener('pagehide', flushPendingWrites);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flushPendingWrites);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flushPendingWrites]);

  const persistLibraryData = useCallback((key: string, value: unknown) => {
    scheduleWrite(key, () => {
      const json = JSON.stringify(value);
      writeLocalMirror(key, json);
      writeAppData(key, json).catch(() => {
        if (storageErrorShownRef.current) return;
        storageErrorShownRef.current = true;
        window.dispatchEvent(new CustomEvent('app-storage-error'));
      });
    });
  }, [scheduleWrite]);

  useEffect(() => {
    if (!isLibraryDataHydrated) return;
    persistLibraryData('app_books', books);
  }, [books, isLibraryDataHydrated, persistLibraryData]);

  useEffect(() => {
    if (!isLibraryDataHydrated) return;
    persistLibraryData('app_authors', authors);
  }, [authors, isLibraryDataHydrated, persistLibraryData]);

  // Estados de edição de Audiobook
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [editBookTitle, setEditBookTitle] = useState('');
  const [editBookAuthor, setEditBookAuthor] = useState('');
  const [editBookCategory, setEditBookCategory] = useState('');
  const [editBookSubgenre, setEditBookSubgenre] = useState('');
  const [editBookCover, setEditBookCover] = useState('');
  const [editBookDescription, setEditBookDescription] = useState('');
  const [editBookNarrator, setEditBookNarrator] = useState('');
  const [editBookLanguage, setEditBookLanguage] = useState('');
  const [editBookChapters, setEditBookChapters] = useState<Chapter[]>([]);
  const [editBookTranscript, setEditBookTranscript] = useState<TranscriptLine[]>([]);
  const [editBookTranscriptSource, setEditBookTranscriptSource] = useState<'metadata' | 'upload' | undefined>(undefined);
  const [editBookTranscriptFileName, setEditBookTranscriptFileName] = useState<string | undefined>(undefined);
  const [bookCropImage, setBookCropImage] = useState<string | null>(null);
  const [editCoverColor, setEditCoverColor] = useState<string>(GENERIC_COVER_COLORS[0].hex);

  // Estados de edição de Autor
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const [editAuthorName, setEditAuthorName] = useState('');
  const [editAuthorNationality, setEditAuthorNationality] = useState('');
  const [editAuthorPicture, setEditAuthorPicture] = useState('');
  const [editAuthorBio, setEditAuthorBio] = useState('');
  const [authorCropImage, setAuthorCropImage] = useState<string | null>(null);
  const [editAuthorColor, setEditAuthorColor] = useState<string>(GENERIC_COVER_COLORS[0].hex);

  // Estados de Coleções Personalizadas
  const [collections, setCollections] = useState<Collection[]>(() => loadCollectionsFromJson(safeLocalGet('app_custom_collections')));

  useEffect(() => {
    if (!isLibraryDataHydrated) return;
    persistLibraryData('app_custom_collections', collections);
  }, [collections, isLibraryDataHydrated, persistLibraryData]);

  // Abertura: o app aparece com a cópia rápida do localStorage e, em seguida, carrega os dados completos
  // do IndexedDB (só atualiza o estado se forem diferentes, para não piscar)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [savedBooks, savedAuthors, savedCollections] = await Promise.all([
          readAppData('app_books'),
          readAppData('app_authors'),
          readAppData('app_custom_collections'),
        ]);
        if (cancelled) return;
        if (savedBooks !== null && savedBooks !== safeLocalGet('app_books')) setBooks(loadBooksFromJson(savedBooks));
        if (savedAuthors !== null && savedAuthors !== safeLocalGet('app_authors')) setAuthors(loadAuthorsFromJson(savedAuthors));
        if (savedCollections !== null && savedCollections !== safeLocalGet('app_custom_collections')) setCollections(loadCollectionsFromJson(savedCollections));
      } catch {}
      if (!cancelled) setIsLibraryDataHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  // Formulário de Criação / Edição de Coleção (Tela Cheia)
  const [colFormName, setColFormName] = useState('');
  const [colFormDesc, setColFormDesc] = useState('');
  const [colFormPalette, setColFormPalette] = useState<(typeof COLLECTION_AVAILABLE_PALETTES)[number]>(COLLECTION_AVAILABLE_PALETTES[0]);
  const [colFormEmoji, setColFormEmoji] = useState<string>(COLLECTION_AVAILABLE_EMOJIS[0]);
  const [colSelectedBookIds, setColSelectedBookIds] = useState<string[]>([]);
  const [colSelectedAuthorIds, setColSelectedAuthorIds] = useState<string[]>([]);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);

  // Popups pequenos de pesquisa dentro da tela de criação/edição
  const [showAddAuthorPopup, setShowAddAuthorPopup] = useState(false);
  const [showAddBookPopup, setShowAddBookPopup] = useState(false);
  // Botão que originou o pop-up de adicionar itens (para o pop-up nascer dele)
  const [colPickerAnchor, setColPickerAnchor] = useState<HTMLElement | null>(null);
  // Pop-up de adicionar itens no cabeçalho da coleção
  const [showCollectionHeaderAddPopup, setShowCollectionHeaderAddPopup] = useState(false);

  const [showDeleteCurrentCollectionConfirm, setShowDeleteCurrentCollectionConfirm] = useState(false);

  // Adicionar a Coleção a partir de popups de livro ou autor

  // Web Audio API (Equalização com realce de voz humana e compressor dinâmico)
  const [voiceBoostEnabled, setVoiceBoostEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('app_voice_boost') === 'true';
    } catch {
      return false;
    }
  });

  const [dynamicCompressionEnabled, setDynamicCompressionEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('app_dynamic_compression') === 'true';
    } catch {
      return false;
    }
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  // Tentativas de recuperar o áudio de cada livro após um erro de carregamento
  const audioRecoveryTriesRef = useRef(new Map<string, number>());
  const gainNodeRef = useRef<GainNode | null>(null);
  const volumeRef = useRef(1);
  const isMutedRef = useRef(false);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const voiceFilterNodeRef = useRef<BiquadFilterNode | null>(null);
  const voiceHighpassNodeRef = useRef<BiquadFilterNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);



  // Estados de confirmação de exclusão
  const [showDeleteSelectionConfirm, setShowDeleteSelectionConfirm] = useState(false);
  const [showDeleteBookDetailConfirm, setShowDeleteBookDetailConfirm] = useState(false);
  const [confirmDeleteSearchId, setConfirmDeleteSearchId] = useState<string | null>(null);
  const [searchCollectionTarget, setSearchCollectionTarget] = useState<{ type: 'book' | 'author'; id: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Histórico de pesquisa
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('app_search_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const addToSearchHistory = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearchHistory(prev => {
      const next = [trimmed, ...prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 15);
      try {
        localStorage.setItem('app_search_history', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    if (activeScreen.id === 'search') {
      const t = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [activeScreen.id]);


  const synopsisTextRef = useRef<HTMLParagraphElement | null>(null);
  const synopsisFullTextRef = useRef<HTMLParagraphElement | null>(null);
  const [synopsisElement, setSynopsisElement] = useState<HTMLParagraphElement | null>(null);
  const [isSynopsisTruncated, setIsSynopsisTruncated] = useState(false);

  const handleSynopsisRef = useCallback((node: HTMLParagraphElement | null) => {
    synopsisTextRef.current = node;
    setSynopsisElement(node);
  }, []);

  const handleStartEditBook = () => {
    const target: Audiobook | undefined = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
    if (!target) return;
    setEditBookTitle(target.title);
    setEditBookAuthor(target.author);
    setEditBookCategory(target.category);
    setEditBookSubgenre(target.subgenre || 'Desconhecido');
    const { narrator, language } = resolveNarratorAndLanguage(target);
    setEditBookNarrator(narrator || '');
    setEditBookLanguage(language ? getLanguageDisplayName(language, resolvedLanguage) : '');
    const initialCoverColor = getGenericCoverColor(target.cover, target.title, target.author);
    setEditCoverColor(initialCoverColor);
    setEditBookCover(
      !target.cover || target.cover.startsWith('data:image/svg')
        ? getGenericBookCover(target.title, target.author, initialCoverColor)
        : target.cover
    );
    setEditBookDescription((target.description || '').slice(0, 1500));
    setEditBookChapters(target.chapters ? target.chapters.map((c: Chapter) => ({ ...c })) : []);
    const existingTranscript = target.transcript || [];
    setEditBookTranscript(existingTranscript);
    setEditBookTranscriptSource(
      existingTranscript.length > 0
        ? (target.transcriptSource || (target.transcriptFileName ? 'upload' : 'metadata'))
        : undefined
    );
    setEditBookTranscriptFileName(target.transcriptFileName);
    setBookCropImage(null);
    setIsEditingBook(true);
  };

  const handleCancelBookEdits = () => {
    setIsEditingBook(false);
    setBookCropImage(null);
  };

  const handleSaveBookEdits = () => {
    const target: Audiobook | undefined = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
    if (!target) return;
    const updatedChapters = editBookChapters.length > 0 ? editBookChapters : target.chapters;
    const finalTitle = editBookTitle.trim() || target.title;
    const finalAuthor = editBookAuthor.trim() || target.author;
    const isGenericCover = !editBookCover || editBookCover.startsWith('data:image/svg');
    const finalCover = isGenericCover
      ? getGenericBookCover(finalTitle, finalAuthor, editCoverColor)
      : editBookCover;
    const updated: Audiobook = {
      ...target,
      title: finalTitle,
      author: finalAuthor,
      category: editBookCategory.trim() || target.category,
      subgenre: editBookSubgenre.trim() || target.subgenre || 'Desconhecido',
      narrator: editBookNarrator.trim(),
      language: normalizeAudiobookLanguage(editBookLanguage) ?? '',
      cover: finalCover,
      description: editBookDescription.trim().slice(0, 1500),
      chapters: updatedChapters,
      transcript: editBookTranscript,
      transcriptSource: editBookTranscript.length > 0 ? editBookTranscriptSource : undefined,
      transcriptFileName: editBookTranscript.length > 0 ? editBookTranscriptFileName : undefined,
    };

    setBooks(prev => prev.map(b => b.id === target.id ? updated : b));
    if (selectedBook && selectedBook.id === target.id) {
      setSelectedBook(updated);
    }
    if (currentBook && currentBook.id === target.id) {
      setCurrentBook(prev => ({
        ...prev,
        title: updated.title,
        author: updated.author,
        category: updated.category,
        subgenre: updated.subgenre,
        cover: updated.cover,
        description: updated.description,
        chapters: updated.chapters,
        transcript: updated.transcript,
        transcriptSource: updated.transcriptSource,
        transcriptFileName: updated.transcriptFileName,
      }));
    }
    // Atualiza itens na fila caso pertençam a este livro
    setPlaybackQueue(prev => prev.map(item => {
      if ((item.bookId || item.book?.id) === target.id) {
        const matchingChap = updatedChapters.find((c: Chapter) => c.id === item.chapterId);
        return {
          ...item,
          book: updated,
          chapterTitle: matchingChap ? matchingChap.title : item.chapterTitle,
          bookTitle: updated.title,
          author: updated.author,
          cover: updated.cover
        };
      }
      return item;
    }));

    setActiveScreen(prev => ({ ...prev, data: updated }));
    setBookCropImage(null);
    setIsEditingBook(false);
    showToast(t('toast_metadata_book_updated'));
  };

  const handleStartEditAuthor = () => {
    const target = activeScreen.data;
    if (!target) return;
    const initialAuthorColor = getGenericAuthorColor(target.picture, target.name);
    setEditAuthorColor(initialAuthorColor);
    setEditAuthorName(target.name);
    setEditAuthorNationality(getNationalityDisplayName(target.nationality || 'Desconhecido', resolvedLanguage));
    setEditAuthorPicture(getEffectiveAuthorAvatar(target.name, target.picture));
    setEditAuthorBio((target.bio || '').slice(0, 350));
    setAuthorCropImage(null);
    setIsEditingAuthor(true);
  };

  const handleCancelAuthorEdits = () => {
    setIsEditingAuthor(false);
    setAuthorCropImage(null);
  };

  const handleSaveAuthorEdits = () => {
    const target = activeScreen.data;
    if (!target) return;
    const newName = editAuthorName.trim() || target.name;
    const newNationality = editAuthorNationality.trim() || 'Desconhecido';
    let newPicture = editAuthorPicture || target.picture;
    if (!newPicture || newPicture.startsWith('data:image/svg')) {
      newPicture = getAuthorAvatar(newName, editAuthorColor);
    }
    const newBio = editAuthorBio.trim().slice(0, 350);

    const updated: Author = {
      ...target,
      name: newName,
      nationality: newNationality,
      picture: newPicture,
      bio: newBio,
    };

    setAuthors(prev => prev.map(a => a.id === target.id ? updated : a));
    if (newName !== target.name) {
      setBooks(prev => prev.map(b => bookHasAuthor(b, target) ? { ...b, author: renameAuthorInField(b.author, target.name, newName) } : b));
    }
    setActiveScreen(prev => ({ ...prev, data: updated }));
    setAuthorCropImage(null);
    setIsEditingAuthor(false);
    showToast(t('toast_metadata_author_updated'));
  };

  // Funções de Gerenciamento de Coleções
  const handleStartCreateCollection = (initialItem?: { type: 'book' | 'author'; id: string }) => {
    closeAllPopups();
    setEditingCollectionId(null);
    setColFormName('');
    setColFormDesc('');
    setColFormPalette(COLLECTION_AVAILABLE_PALETTES[0]);
    setColFormEmoji(COLLECTION_AVAILABLE_EMOJIS[0]);
    setColSelectedBookIds(initialItem?.type === 'book' ? [initialItem.id] : []);
    const initialBookAuthorId = initialItem?.type === 'book' ? findAuthorIdForBook(initialItem.id) : null;
    setColSelectedAuthorIds(initialItem?.type === 'author' ? [initialItem.id] : (initialBookAuthorId ? [initialBookAuthorId] : []));
    setShowAddAuthorPopup(false);
    setShowAddBookPopup(false);
    navigateTo('create-collection');
  };

  const handleStartEditCurrentCollection = (col?: Collection) => {
    closeAllPopups();
    const targetId = activeScreen.id.startsWith('library-colecao-') ? activeScreen.id.replace('library-colecao-', '') : '';
    const target = col || collections.find(c => c.id === targetId) || (activeScreen.data as Collection);
    if (!target) return;
    setEditingCollectionId(target.id);
    setColFormName(target.name);
    setColFormDesc(target.description || '');
    const palette = COLLECTION_AVAILABLE_PALETTES.find(p => p.hex === target.color || p.gradient === target.gradient) || COLLECTION_AVAILABLE_PALETTES[0];
    setColFormPalette(palette);
    setColFormEmoji(target.emoji || COLLECTION_AVAILABLE_EMOJIS[0]);
    setColSelectedBookIds([...target.bookIds]);
    setColSelectedAuthorIds([...(target.authorIds || [])]);
    setShowAddAuthorPopup(false);
    setShowAddBookPopup(false);
    navigateTo('edit-collection', target);
  };

  const handleSaveCollectionForm = () => {
    if (!colFormName.trim()) {
      showToast(t('collection_name_required'));
      return;
    }

    if (editingCollectionId) {
      const existing = collections.find(c => c.id === editingCollectionId);
      const updated: Collection = {
        id: editingCollectionId,
        name: colFormName.trim(),
        description: colFormDesc.trim().slice(0, 60),
        color: colFormPalette.hex,
        gradient: colFormPalette.gradient,
        emoji: colFormEmoji,
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
        bookIds: colSelectedBookIds,
        authorIds: colSelectedAuthorIds
      };
      setCollections(prev => prev.map(c => c.id === editingCollectionId ? updated : c));
      showToast(t('collection_updated_toast'));
      // Se a edição foi aberta a partir da própria coleção, volta para ela em vez de empilhar
      // outra entrada (senão o botão de voltar exibiria o nome da própria coleção)
      const collectionScreenId = 'library-colecao-' + editingCollectionId;
      const prevEntry = historyStack[historyStack.length - 1];
      if (prevEntry?.id === collectionScreenId) {
        setHistoryStack(curr => curr.slice(0, -1));
      }
      setActiveScreen({ id: collectionScreenId, data: updated });
    } else {
      const newId = `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newCol: Collection = {
        id: newId,
        name: colFormName.trim(),
        description: colFormDesc.trim().slice(0, 60),
        color: colFormPalette.hex,
        gradient: colFormPalette.gradient,
        emoji: colFormEmoji,
        createdAt: Date.now(),
        bookIds: colSelectedBookIds,
        authorIds: colSelectedAuthorIds
      };
      setCollections(prev => [newCol, ...prev]);
      showToast(t('collection_added_toast'));
      setActiveScreen({ id: 'library-colecao-' + newId, data: newCol });
    }
  };

  // Autor cadastrado de um audiobook (por id ou, na falta dele, pelo nome)
  const findAuthorIdForBook = (bookId: string): string | null => {
    const book = books.find(b => b.id === bookId);
    if (!book) return null;
    const byId = book.authorId ? authors.find(a => a.id === book.authorId) : undefined;
    if (byId) return byId.id;
    const name = (getBookAuthorNames(book)[0] || '').trim().toLowerCase();
    const byName = name ? authors.find(a => a.name.trim().toLowerCase() === name) : undefined;
    return byName ? byName.id : null;
  };

  const handleToggleItemInCollection = (collectionId: string, itemType: 'book' | 'author', itemId: string) => {
    setCollections(prev => prev.map(c => {
      if (c.id !== collectionId) return c;
      if (itemType === 'book') {
        const hasBook = c.bookIds.includes(itemId);
        const bookIds = hasBook ? c.bookIds.filter(id => id !== itemId) : [...c.bookIds, itemId];
        showToast(hasBook ? t('item_removed_from_collection') : t('item_added_to_collection'));
        // Ao adicionar um audiobook, o autor dele entra automaticamente na coleção
        const authorId = !hasBook ? findAuthorIdForBook(itemId) : null;
        const currentAuthorIds = c.authorIds || [];
        const authorIds = authorId && !currentAuthorIds.includes(authorId) ? [...currentAuthorIds, authorId] : currentAuthorIds;
        return { ...c, bookIds, authorIds, updatedAt: Date.now() };
      } else {
        const hasAuthor = (c.authorIds || []).includes(itemId);
        const authorIds = hasAuthor ? (c.authorIds || []).filter(id => id !== itemId) : [...(c.authorIds || []), itemId];
        showToast(hasAuthor ? t('item_removed_from_collection') : t('item_added_to_collection'));
        return { ...c, authorIds, updatedAt: Date.now() };
      }
    }));
  };

  const handleDeleteCollection = (collectionId: string) => {
    setCollections(prev => prev.filter(c => c.id !== collectionId));
    showToast(t('collection_deleted_toast'));
    if (activeScreen.id === `library-colecao-${collectionId}`) {
      navigateTo('library-colecoes');
    }
  };

  // iPhone/iPad (Safari 17+): sessão de áudio do tipo "reprodução", que continua tocando em segundo plano
  useEffect(() => {
    try {
      const session = (navigator as any).audioSession;
      if (session && session.type !== 'playback') session.type = 'playback';
    } catch {}
  }, []);

  // Web Audio API Setup
  const setupWebAudioGraph = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      // Highpass filter para eliminar ruídos subgraves (< 85Hz)
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = voiceBoostEnabled ? 85 : 10;
      highpass.Q.value = 0.7;
      voiceHighpassNodeRef.current = highpass;

      // Peaking filter para presença da voz humana (3000 Hz, +6dB quando ativo)
      const voiceFilter = ctx.createBiquadFilter();
      voiceFilter.type = 'peaking';
      voiceFilter.frequency.value = 3000;
      voiceFilter.Q.value = 1.2;
      voiceFilter.gain.value = voiceBoostEnabled ? 6 : 0;
      voiceFilterNodeRef.current = voiceFilter;

      // Compressor dinâmico para normalização de volume
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = dynamicCompressionEnabled ? -24 : 0;
      compressor.knee.value = 30;
      compressor.ratio.value = dynamicCompressionEnabled ? 6 : 1;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorNodeRef.current = compressor;

      // Volume do app (no iPhone/iPad o volume do elemento <audio> não pode ser alterado por código)
      const gain = ctx.createGain();
      gain.gain.value = isMutedRef.current ? 0 : Math.max(0, Math.min(1, volumeRef.current));
      gainNodeRef.current = gain;
      // O volume passa a ser controlado só pelo processamento (evita aplicar duas vezes)
      audioRef.current.volume = 1;

      // Encadeamento: source -> highpass -> voiceFilter -> compressor -> volume -> destination
      source.connect(highpass);
      highpass.connect(voiceFilter);
      voiceFilter.connect(compressor);
      compressor.connect(gain);
      gain.connect(ctx.destination);
    } catch (err) {
      console.warn('Web Audio API setup note:', err);
    }
  }, [voiceBoostEnabled, dynamicCompressionEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('app_voice_boost', String(voiceBoostEnabled));
    } catch {}
    if (voiceFilterNodeRef.current && voiceHighpassNodeRef.current && audioContextRef.current) {
      const t = audioContextRef.current.currentTime;
      voiceFilterNodeRef.current.gain.setTargetAtTime(voiceBoostEnabled ? 6 : 0, t, 0.05);
      voiceHighpassNodeRef.current.frequency.setTargetAtTime(voiceBoostEnabled ? 85 : 10, t, 0.05);
    }
  }, [voiceBoostEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('app_dynamic_compression', String(dynamicCompressionEnabled));
    } catch {}
    if (compressorNodeRef.current && audioContextRef.current) {
      const t = audioContextRef.current.currentTime;
      compressorNodeRef.current.threshold.setTargetAtTime(dynamicCompressionEnabled ? -24 : 0, t, 0.05);
      compressorNodeRef.current.ratio.setTargetAtTime(dynamicCompressionEnabled ? 6 : 1, t, 0.05);
    }
  }, [dynamicCompressionEnabled]);

  // Exportar e Importar Backup
  const handleExportLibraryBackup = () => {
    try {
      const backupData = {
        app: 'Audiobook Player',
        version: 1,
        exportedAt: new Date().toISOString(),
        books,
        authors,
        collections,
        favoriteBookIds,
        favoriteAuthorIds,
        recentlyListenedBookIds,
        userListeningStats,
        positions: (() => {
          try {
            return JSON.parse(localStorage.getItem('audiobook_playback_positions') || '{}');
          } catch {
            return {};
          }
        })()
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('download', `audiobook-player-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast(t('backup_exported_success'));
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
      showToast('Erro ao exportar backup.');
    }
  };

  const handleImportLibraryBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object') {
          showToast(t('backup_invalid_file'));
          return;
        }
        // Sanitiza e revoga URLs de objetos antigos antes de importar novo estado
        audioUrlsRef.current.forEach(url => {
          if (url && url.startsWith('blob:')) {
            try { URL.revokeObjectURL(url); } catch {}
          }
        });
        audioUrlsRef.current.clear();
        if (Array.isArray(data.books)) {
          setBooks(data.books);
          try { localStorage.setItem('app_books', JSON.stringify(data.books)); } catch {}
        }
        if (Array.isArray(data.authors)) {
          setAuthors(data.authors);
          try { localStorage.setItem('app_authors', JSON.stringify(data.authors)); } catch {}
        }
        if (Array.isArray(data.collections)) {
          setCollections(data.collections);
          try { localStorage.setItem('app_custom_collections', JSON.stringify(data.collections)); } catch {}
        }
        if (Array.isArray(data.favoriteBookIds)) {
          setFavoriteBookIds(data.favoriteBookIds);
          try { localStorage.setItem('app_favorite_books', JSON.stringify(data.favoriteBookIds)); } catch {}
        }
        if (Array.isArray(data.favoriteAuthorIds)) {
          setFavoriteAuthorIds(data.favoriteAuthorIds);
          try { localStorage.setItem('app_favorite_authors', JSON.stringify(data.favoriteAuthorIds)); } catch {}
        }
        if (Array.isArray(data.recentlyListenedBookIds)) {
          setRecentlyListenedBookIds(data.recentlyListenedBookIds);
          try { localStorage.setItem('recently_listened_books', JSON.stringify(data.recentlyListenedBookIds)); } catch {}
        }
        if (data.userListeningStats && typeof data.userListeningStats === 'object') {
          setUserListeningStats(data.userListeningStats);
          try { localStorage.setItem('app_user_listening_stats', JSON.stringify(data.userListeningStats)); } catch {}
        }
        if (data.positions && typeof data.positions === 'object') {
          try { localStorage.setItem('audiobook_playback_positions', JSON.stringify(data.positions)); } catch {}
        }
        showToast(t('backup_imported_success'));
      } catch (err) {
        console.error('Erro ao processar backup:', err);
        showToast(t('backup_invalid_file'));
      }
    };
    reader.readAsText(file);
  };

  const handleBookCoverError = useCallback((book?: Partial<Audiobook> | null, e?: React.SyntheticEvent<HTMLImageElement>) => {
    const fallback = getGenericBookCover(book?.title, book?.author);
    if (e?.currentTarget && e.currentTarget.src !== fallback) {
      e.currentTarget.src = fallback;
    }
    if (book?.id && book.id !== EMPTY_BOOK.id) {
      const targetId = book.id;
      setBooks(prev => prev.map(b => (b.id === targetId && b.cover !== fallback ? { ...b, cover: fallback } : b)));
      setSelectedBook(prev => (prev && prev.id === targetId && prev.cover !== fallback ? { ...prev, cover: fallback } : prev));
      setCurrentBook(prev => (prev && prev.id === targetId && prev.cover !== fallback ? { ...prev, cover: fallback } : prev));
      setActiveScreen(prev => (prev.data && prev.data.id === targetId && prev.data.cover !== fallback ? { ...prev, data: { ...prev.data, cover: fallback } } : prev));
      setPlaybackQueue(prev =>
        prev.map(item =>
          item.bookId === targetId || item.book?.id === targetId
            ? { ...item, cover: fallback, book: { ...item.book, cover: fallback } }
            : item
        )
      );
    }
  }, []);

  // Garante que fotos existentes de autores e capas não-quadradas sejam cortadas e salvas em 1:1 quadrado
  useEffect(() => {
    const shouldMigrateTestCovers = localStorage.getItem('app_test_covers_generic_v1') !== 'true';

    authors.forEach(author => {
      if (
        !author.picture ||
        !author.picture.trim() ||
        author.picture.includes('images.unsplash.com') ||
        (author.picture.startsWith('data:image/svg') && !author.picture.includes('data-avatar-v%3D%224%22') && !author.picture.includes('data-avatar-v="4"'))
      ) {
        const savedColor = author.picture && author.picture.startsWith('data:image/svg')
          ? getGenericAuthorColor(author.picture, author.name)
          : undefined;
        const fallbackAvatar = getAuthorAvatar(author.name, savedColor);
        setAuthors(prev => prev.map(a => a.id === author.id ? { ...a, picture: fallbackAvatar } : a));
      } else if (!author.picture.startsWith('data:image/svg')) {
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth > 0 && img.naturalHeight > 0 && img.naturalWidth !== img.naturalHeight) {
            autoCropImageToSquare(author.picture).then(sq => {
              setAuthors(prev => prev.map(a => a.id === author.id ? { ...a, picture: sq } : a));
            });
          }
        };
        img.onerror = () => {
          const fallbackAvatar = getAuthorAvatar(author.name);
          setAuthors(prev => prev.map(a => a.id === author.id ? { ...a, picture: fallbackAvatar } : a));
        };
        img.src = author.picture;
      }
    });

    books.forEach(book => {
      const isTestBook = BOOKS_DATABASE.some(db => db.id === book.id) || String(book.id).startsWith('mock-dev-');
      if (
        !book.cover ||
        !book.cover.trim() ||
        book.cover.includes('images.unsplash.com') ||
        (isTestBook && shouldMigrateTestCovers) ||
        (book.cover.startsWith('data:image/svg') && !book.cover.includes('data-cover-v%3D%224%22') && !book.cover.includes('data-cover-v="4"'))
      ) {
        const savedColor = book.cover && book.cover.startsWith('data:image/svg')
          ? getGenericCoverColor(book.cover, book.title, book.author)
          : undefined;
        const newSvg = getGenericBookCover(book.title, book.author, savedColor);
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, cover: newSvg } : b));
        setSelectedBook(prev => prev && prev.id === book.id ? { ...prev, cover: newSvg } : prev);
        setCurrentBook(prev => prev && prev.id === book.id ? { ...prev, cover: newSvg } : prev);
        setActiveScreen(prev => prev.data && prev.data.id === book.id ? { ...prev, data: { ...prev.data, cover: newSvg } } : prev);
        setPlaybackQueue(prev => prev.map(item => item.bookId === book.id || item.book?.id === book.id ? { ...item, cover: newSvg, book: { ...item.book, cover: newSvg } } : item));
      } else if (book.cover && !book.cover.startsWith('data:image/svg')) {
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            const ratio = img.naturalHeight / img.naturalWidth;
            if (Math.abs(ratio - 1.6) > 0.02) {
              autoCropImageToEbookCover(book.cover).then(cr => {
                setBooks(prev => prev.map(b => b.id === book.id ? { ...b, cover: cr } : b));
              });
            }
          }
        };
        img.onerror = () => {
          handleBookCoverError(book);
        };
        img.src = book.cover;
      }
    });

    setBooks(prev => {
      const deduped = deduplicateAudiobooks(prev);
      return deduped.length !== prev.length ? deduped : prev;
    });

    if (shouldMigrateTestCovers) {
      try {
        localStorage.setItem('app_test_covers_generic_v1', 'true');
      } catch {}
    }
  }, []);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Seleção de uma pasta inteira (navegadores de computador); no celular, abre o seletor de arquivos
  const folderInputRef = React.useRef<HTMLInputElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  // Cor do menu lateral "congelada" enquanto a página se recolhe para dentro do card ao voltar;
  // volta ao padrão no instante em que a animação termina
  const [sidebarHighlightHold, setSidebarHighlightHold] = useState<{ value: { hex: string; rgb: string } | null } | null>(null);
  // Identifica uma tela (id + item) para saber se o card de origem está na tela de destino ao voltar
  const getScreenKey = (screen: { id: string; data?: any }) => `${screen.id}|${screen.data?.id ?? ''}`;
  const activeScreenKeyRef = useRef('');
  activeScreenKeyRef.current = getScreenKey(activeScreen);
  // Salvaguarda: libera a cor caso a animação de fechamento não chegue a rodar
  useEffect(() => {
    if (!sidebarHighlightHold) return;
    const timer = setTimeout(() => setSidebarHighlightHold(null), 2500);
    return () => clearTimeout(timer);
  }, [sidebarHighlightHold]);
  const [shouldScrollToCurrentChapter, setShouldScrollToCurrentChapter] = useState<number>(0);
  const pendingChapterScrollRef = useRef<boolean>(false);

  // Áudio Player Refs & Estados
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlsRef = useRef<Map<string, string>>(new Map());
  const storedAudioBlobKeysRef = useRef<Set<string>>(new Set());
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const loadingAudioBookIdsRef = useRef<Set<string>>(new Set());
  const pendingSeekRef = useRef<number | null>((() => {
    try {
      const isResumeEnabled = localStorage.getItem('app_resume_playback') !== 'false';
      if (isResumeEnabled) {
        const savedTime = localStorage.getItem('app_last_played_time');
        if (savedTime !== null) {
          const parsed = Number(savedTime);
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      }
    } catch {}
    return null;
  })());
  const [audioRevision, setAudioRevision] = useState<number>(0);
  const [isDraggingFiles, setIsDraggingFiles] = useState<boolean>(false);

  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const [lastPlayedBookId, setLastPlayedBookId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('app_last_played_book_id') || null;
    } catch {
      return null;
    }
  });

  const [currentBook, setCurrentBook] = useState<Audiobook>(() => {
    try {
      const savedLastId = localStorage.getItem('app_last_played_book_id');
      const isResumeEnabled = localStorage.getItem('app_resume_playback') !== 'false';
      if (savedLastId && isResumeEnabled) {
        const found = books.find(b => b.id === savedLastId);
        if (found) return found;
      }
    } catch {}
    return EMPTY_BOOK;
  });

  const [selectedBook, setSelectedBook] = useState<Audiobook>(() => {
    if (currentBook?.id && currentBook.id !== EMPTY_BOOK.id) return currentBook;
    return books[0] || EMPTY_BOOK;
  });
  const [currentTime, setCurrentTime] = useState<number>(() => {
    try {
      const isResumeEnabled = localStorage.getItem('app_resume_playback') !== 'false';
      if (isResumeEnabled) {
        const savedTime = localStorage.getItem('app_last_played_time');
        if (savedTime !== null) {
          const parsed = Number(savedTime);
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      }
    } catch {}
    return 0;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  // Último tempo conhecido (estado), para quando o elemento de áudio ainda não carregou o arquivo
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;
  
  // Estados de Conclusão de Capítulos e Audiobooks
  const [completedChapters, setCompletedChapters] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('app_completed_chapters');
      if (s) return JSON.parse(s);
    } catch(e) {}
    return [];
  });
  const [startedChapters, setStartedChapters] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('app_started_chapters');
      if (s) return JSON.parse(s);
    } catch(e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_completed_chapters', JSON.stringify(completedChapters));
    } catch(e) {}
  }, [completedChapters]);

  useEffect(() => {
    try {
      localStorage.setItem('app_started_chapters', JSON.stringify(startedChapters));
    } catch(e) {}
  }, [startedChapters]);

  const isChapterCompleted = (bookId: string, chapId: number) => {
    return completedChapters.includes(`${bookId}-${chapId}`);
  };
  const isChapterStarted = (bookId: string, chapId: number) => {
    if (isChapterCompleted(bookId, chapId)) return false;
    const isCurrentlyActive = isPlaying && currentBook?.id === bookId && currentChapter?.id === chapId;
    return isCurrentlyActive || startedChapters.includes(`${bookId}-${chapId}`);
  };
  const isBookCompleted = (book: Audiobook) => {
    if (!book || !book.chapters || book.chapters.length === 0) return false;
    return book.chapters.every(c => completedChapters.includes(`${book.id}-${c.id}`));
  };
  const isBookStarted = (book: Audiobook) => {
    if (!book || !book.chapters || book.chapters.length === 0) return false;
    if (isBookCompleted(book)) return false;
    const isCurrentlyPlaying = isPlaying && currentBook?.id === book.id;
    return isCurrentlyPlaying || (userListeningStats.bookSeconds[book.id] || 0) > 0 || book.chapters.some(c => startedChapters.includes(`${book.id}-${c.id}`) || completedChapters.includes(`${book.id}-${c.id}`));
  };

  // Estados dos Comentários
  const [showCommentsPopover, setShowCommentsPopover] = useState(false);
  const [activeChapterMenuMode, setActiveChapterMenuMode] = useState<'options' | 'comments'>('options');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [addingCommentText, setAddingCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [playbackReturnPoint, setPlaybackReturnPointRaw] = useState<PlaybackReturnPoint | null>(null);
  // Enquanto true, nenhum novo botão de retorno é criado (o clique atual apenas descartou o existente)
  const suppressReturnPointRef = useRef(false);
  const setPlaybackReturnPoint = useCallback((value: PlaybackReturnPoint | null) => {
    if (value && suppressReturnPointRef.current) return;
    setPlaybackReturnPointRaw(value);
  }, []);
  const playbackReturnPointRef = useRef<PlaybackReturnPoint | null>(null);
  playbackReturnPointRef.current = playbackReturnPoint;

  // Clique em qualquer controle do miniplayer/player (exceto a barra e o próprio botão) com o botão
  // visível: o botão some e nenhum outro aparece por essa ação
  const handlePlayerPointerDownCapture = useCallback((e: React.PointerEvent) => {
    const target = e.target as Element | null;
    if (!target || typeof target.closest !== 'function') return;
    if (target.closest('[data-playback-return]') || target.closest('input[type="range"]') || target.closest('[data-seek-overlay]')) return;
    const point = playbackReturnPointRef.current;
    const isVisible = Boolean(point && Date.now() - (point.createdAt || 0) < 30000);
    if (!isVisible) return;
    setPlaybackReturnPointRaw(null);
    suppressReturnPointRef.current = true;
    const release = () => {
      setTimeout(() => { suppressReturnPointRef.current = false; }, 0);
      window.removeEventListener('click', release, true);
    };
    window.addEventListener('click', release, true);
    // Garantia caso o clique não chegue a acontecer (ex.: arrasto cancelado)
    setTimeout(() => { suppressReturnPointRef.current = false; window.removeEventListener('click', release, true); }, 800);
  }, []);

  // Auto-dismiss do botão de retorno na barra de progresso após 30 segundos
  const returnPointTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (returnPointTimeoutRef.current) {
      clearTimeout(returnPointTimeoutRef.current);
      returnPointTimeoutRef.current = null;
    }

    if (!playbackReturnPoint) return;

    // Calcula tempo restante garantindo expiração estrita de 30 segundos
    const elapsed = Date.now() - (playbackReturnPoint.createdAt || Date.now());
    const remaining = Math.max(0, 30000 - elapsed);

    if (remaining === 0) {
      setPlaybackReturnPoint(null);
      return;
    }

    returnPointTimeoutRef.current = setTimeout(() => {
      setPlaybackReturnPoint(null);
      returnPointTimeoutRef.current = null;
    }, remaining);

    return () => {
      if (returnPointTimeoutRef.current) {
        clearTimeout(returnPointTimeoutRef.current);
        returnPointTimeoutRef.current = null;
      }
    };
  }, [playbackReturnPoint]);

  const [isFullScreen, setIsFullScreen] = useState(false);
  // Cabeçalho do app escondido enquanto o player em tela cheia está aberto ou ainda se recolhendo
  const [isAppHeaderHidden, setIsAppHeaderHidden] = useState(false);
  useEffect(() => {
    if (isFullScreen) {
      setIsAppHeaderHidden(true);
      return;
    }
    // Volta quando o player termina de encolher (tempo fixo: nunca fica preso escondido)
    const timer = setTimeout(() => setIsAppHeaderHidden(false), 420);
    return () => clearTimeout(timer);
  }, [isFullScreen]);
  // Indica se o miniplayer está montando logo após fechar a tela cheia (entra sem deslocamento para a capa encaixar)
  const wasFullScreenRef = useRef(false);
  const isFullScreenRef = useRef(false);
  isFullScreenRef.current = isFullScreen;
  useEffect(() => {
    wasFullScreenRef.current = isFullScreen;
  }, [isFullScreen]);
  const [showTranscript, setShowTranscript] = useState(true);
  const hasTranscript = Boolean(currentBook?.transcript && currentBook.transcript.length > 0);
  const [playbackQueue, setPlaybackQueue] = useState<QueueItem[]>(() => {
    try {
      const isResumeEnabled = localStorage.getItem('app_resume_playback') !== 'false';
      if (isResumeEnabled) {
        const savedQueue = localStorage.getItem('app_playback_queue');
        if (savedQueue) {
          const parsed = JSON.parse(savedQueue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ignora itens incompletos (ex.: dados antigos ou corrompidos)
            return parsed.filter((it: any) => it && typeof it === 'object' && (it.bookId || it.book?.id) && it.chapterId !== undefined);
          }
        }
      }
    } catch {}
    return [];
  });

  // =========================================================================
  // SANITIZAÇÃO DE MEMÓRIA & CARREGAMENTO LAZY DE ÁUDIOS DO INDEXEDDB
  // =========================================================================
  const loadAudioForBook = useCallback(async (bookId: string, isCurrent = true) => {
    if (!bookId || bookId === EMPTY_BOOK.id) return;
    if (audioUrlsRef.current.has(bookId)) return;
    if (loadingAudioBookIdsRef.current.has(bookId)) return;

    loadingAudioBookIdsRef.current.add(bookId);
    if (isCurrent) setIsAudioLoading(true);

    try {
      const blob = await getAudioBlob(bookId);
      if (blob) {
        // Revoga URL anterior caso exista para o mesmo ID
        const oldUrl = audioUrlsRef.current.get(bookId);
        if (oldUrl && oldUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(oldUrl); } catch {}
        }

        const newUrl = URL.createObjectURL(blob);
        audioUrlsRef.current.set(bookId, newUrl);
        setAudioRevision(r => r + 1);

        // Sanitização e política LRU: manter apenas o livro atual e o próximo da fila em memória
        const keepIds = new Set<string>();
        if (currentBook?.id && currentBook.id !== EMPTY_BOOK.id) keepIds.add(currentBook.id);
        keepIds.add(bookId);
        if (playbackQueue.length > 0) {
          const nextId = playbackQueue[0].bookId || playbackQueue[0].book?.id;
          if (nextId) keepIds.add(nextId);
        }

        for (const [id, url] of audioUrlsRef.current.entries()) {
          if (!keepIds.has(id)) {
            if (url && url.startsWith('blob:')) {
              try { URL.revokeObjectURL(url); } catch {}
            }
            audioUrlsRef.current.delete(id);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar áudio lazy do IndexedDB:', err);
    } finally {
      loadingAudioBookIdsRef.current.delete(bookId);
      if (isCurrent) setIsAudioLoading(false);
    }
  }, [currentBook?.id, playbackQueue]);

  // Inicialização rápida: apenas indexa chaves de áudio do IndexedDB (zero blobs carregados no startup)
  useEffect(() => {
    let isMounted = true;
    async function initAudioBlobKeys() {
      try {
        const storedKeys = await getAllAudioBlobKeys();
        if (!isMounted) return;
        storedAudioBlobKeysRef.current = new Set(storedKeys);

        // Se houver livro atual restaurado da sessão anterior, carrega seu áudio sob demanda (lazy)
        const savedLastId = localStorage.getItem('app_last_played_book_id');
        if (savedLastId && storedAudioBlobKeysRef.current.has(savedLastId)) {
          loadAudioForBook(savedLastId, true);
        }
      } catch (err) {
        console.warn('Erro ao inicializar chaves de áudio do IndexedDB:', err);
      }
    }

    initAudioBlobKeys();

    return () => {
      isMounted = false;
      // Sanitização de memória: revoga todos os Object URLs remanescentes na desmontagem
      audioUrlsRef.current.forEach(url => {
        if (url && url.startsWith('blob:')) {
          try { URL.revokeObjectURL(url); } catch {}
        }
      });
      audioUrlsRef.current.clear();
    };
  }, [loadAudioForBook]);

  // Efeito reativo para carregar áudio lazy sempre que o livro atual ou a fila mudar
  useEffect(() => {
    if (!currentBook?.id || currentBook.id === EMPTY_BOOK.id) return;
    if (!audioUrlsRef.current.has(currentBook.id)) {
      loadAudioForBook(currentBook.id, true);
    }

    // Pré-carrega o próximo item da fila em segundo plano
    if (playbackQueue.length > 0) {
      const nextId = playbackQueue[0].bookId || playbackQueue[0].book?.id;
      if (nextId && nextId !== currentBook.id && !audioUrlsRef.current.has(nextId)) {
        loadAudioForBook(nextId, false);
      }
    }
  }, [currentBook?.id, playbackQueue, loadAudioForBook]);

  const [themeMode, setThemeMode] = useState<'dark'|'light'|'system'>(() => {
    return (localStorage.getItem('app_theme_mode') as 'dark'|'light'|'system') || 'dark';
  });

  // Paleta de Cores de Destaque
  const ACCENT_COLORS: Record<string, { name: string; hex: string; rgb: string; bgClass: string }> = {
    blue: { name: 'Azul', hex: '#0086F0', rgb: '0, 134, 240', bgClass: 'bg-[#0086F0]' },
    purple: { name: 'Roxo', hex: '#8B5CF6', rgb: '139, 92, 246', bgClass: 'bg-[#8B5CF6]' },
    green: { name: 'Verde', hex: '#10B981', rgb: '16, 185, 129', bgClass: 'bg-[#10B981]' },
    red: { name: 'Vermelho', hex: '#EF4444', rgb: '239, 68, 68', bgClass: 'bg-[#EF4444]' },
    orange: { name: 'Laranja', hex: '#F97316', rgb: '249, 115, 22', bgClass: 'bg-[#F97316]' },
    pink: { name: 'Rosa', hex: '#EC4899', rgb: '236, 72, 153', bgClass: 'bg-[#EC4899]' },
  };

  // Ajustes: Interface
  const [accentColor, setAccentColor] = useState<string>(() => localStorage.getItem('app_accent_color') || 'blue');
  const _currentAccentHex = ACCENT_COLORS[accentColor]?.hex || '#0086F0';
  void _currentAccentHex;
  const [uiDensity, setUiDensity] = useState<'compact'>('compact');
  const [fontSize, setFontSize] = useState<'standard' | 'large'>(() => {
    const saved = localStorage.getItem('app_font_size');
    return saved === 'large' ? 'large' : 'standard';
  });
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(() => (localStorage.getItem('app_language') as AppLanguage) || ((window as any).electron?.installerLanguage as AppLanguage) || 'system');
  const resolvedLanguage: SupportedLanguage = appLanguage === 'system' ? getSystemLanguage() : (appLanguage as SupportedLanguage);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    return getTranslation(resolvedLanguage, key, params);
  }, [resolvedLanguage]);

  const helpThemes = useMemo(() => getHelpThemes(resolvedLanguage), [resolvedLanguage]);

  // Fluxo de Boas-vindas e Ajustes Iniciais na 1ª abertura do app
  // Regras de negócio:
  // 1. Exibida apenas se o usuário nunca abriu o app e está abrindo pela 1ª vez.
  // 2. Se o usuário já abriu, fechou e abriu novamente, esta tela NÃO deve ser exibida.
  // 3. Deve ser exibida se primeira abertura for selecionada no modo de desenvolvedor.
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      const hasBeenOpened = 
        localStorage.getItem('app_has_been_opened_before') === 'true' ||
        localStorage.getItem('app_onboarding_completed_v1') === 'true' ||
        localStorage.getItem('app_books') !== null ||
        localStorage.getItem('app_last_played_book_id') !== null;

      if (hasBeenOpened) {
        localStorage.setItem('app_has_been_opened_before', 'true');
        localStorage.setItem('app_onboarding_completed_v1', 'true');
        return false;
      }

      // É a primeiríssima abertura da história:
      // Marca imediatamente no localStorage para que, se o usuário fechar e reabrir, não seja mais exibido.
      localStorage.setItem('app_has_been_opened_before', 'true');
      localStorage.setItem('app_onboarding_completed_v1', 'true');
      return true;
    } catch {
      return false;
    }
  });
  const [onboardingStep, setOnboardingStep] = useState<'welcome' | 'settings'>('welcome');

  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem('app_has_been_opened_before', 'true');
      localStorage.setItem('app_onboarding_completed_v1', 'true');
    } catch {}
    setActiveSettingSelector(null);
    setShowOnboarding(false);
    setOnboardingStep('welcome');
    setActiveScreen({ id: 'home' });
  }, []);

  // Processamento e importação de arquivos de áudio locais (apenas áudios permitidos)
  const processAudioFiles = async (fileList: FileList | File[], silentDuplicateToast = false) => {
    const rawFiles = Array.from(fileList);
    const isAudio = (f: File) => {
      const name = f.name.toLowerCase();
      const ext = name.substring(name.lastIndexOf('.'));
      return (
        f.type.startsWith('audio/') ||
        ['.mp3', '.m4a', '.m4b', '.mp4', '.aac', '.wav', '.ogg', '.flac', '.opus', '.wma', '.webm', '.alac'].includes(ext)
      );
    };

    const audioFiles = rawFiles.filter(isAudio);
    const nonAudioFiles = rawFiles.filter(f => !isAudio(f));

    if (rawFiles.length > 0 && audioFiles.length === 0) {
      showToast(t('toast_unsupported_audio_format'));
      return;
    }

    if (nonAudioFiles.length > 0) {
      showToast(t('toast_non_audio_ignored', { count: nonAudioFiles.length }));
    }

    if (audioFiles.length === 0) return;

    // 1. Filtragem prévia por nome de arquivo / tamanho (antes de processar metadados) e dentro do próprio lote
    const seenBatchKeys = new Set<string>();
    const files: File[] = [];
    let skippedDuplicates = 0;

    for (const f of audioFiles) {
      const fName = extractNormalizedFileName(f.name);
      const fSizeStr = (f.size / (1024 * 1024)).toFixed(1) + ' MB';
      const fStem = normalizeBookCompareStr(f.name.replace(/\.[^/.]+$/, ''));
      const batchKey = `${fName}::${f.size}`;

      const alreadyInLibraryByFile = booksRef.current.some(b => {
        const existingFile = extractNormalizedFileName(b.fileName || b.filePath);
        if (existingFile && fName && existingFile === fName) return true;
        if (fStem && normalizeBookCompareStr(b.title) === fStem && b.sizeStr === fSizeStr) return true;
        return false;
      });

      if (alreadyInLibraryByFile || seenBatchKeys.has(batchKey)) {
        skippedDuplicates++;
      } else {
        seenBatchKeys.add(batchKey);
        files.push(f);
      }
    }

    if (files.length === 0) {
      if (!silentDuplicateToast && skippedDuplicates > 0) {
        showToast(
          skippedDuplicates === 1
            ? 'Este audiobook já foi adicionado à biblioteca.'
            : `${skippedDuplicates} audiobooks já estavam na biblioteca e não foram adicionados novamente.`
        );
      }
      return;
    }

    showToast(t('toast_processing_audio_files', { count: files.length }));

    const importedBooks: Audiobook[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const meta = await parseAudioMetadata(file);

        // 2. Verificação pós-leitura de metadados (garante que mesmo arquivos renomeados do mesmo audiobook não dupliquem)
        const candidateBook: Partial<Audiobook> = {
          title: meta.title,
          author: meta.author,
          fileName: file.name,
          sizeStr: meta.sizeStr,
          durationEst: meta.durationEst,
        };
        const isDuplicateAfterParse =
          booksRef.current.some(b => isSameAudiobook(b, candidateBook)) ||
          importedBooks.some(b => isSameAudiobook(b, candidateBook));

        if (isDuplicateAfterParse) {
          skippedDuplicates++;
          continue;
        }

        // Vários autores ("A, B & C"): cada nome é um autor próprio
        const metaAuthorNames = meta.author && meta.author !== 'Autor Desconhecido' ? splitAuthorNames(meta.author) : [];
        const bookAuthorIds: string[] = [];
        metaAuthorNames.forEach((name, n) => {
          const existing = authors.find(a => a.name.toLowerCase() === name.toLowerCase());
          if (existing) { bookAuthorIds.push(existing.id); return; }
          const newAuthor: Author = {
            id: 'a_' + Date.now() + '_' + i + '_' + n,
            name,
            nationality: (metaAuthorNames.length === 1 && meta.authorNationality) || 'Desconhecido',
            picture: getAuthorAvatar(name),
            bio: ''
          };
          bookAuthorIds.push(newAuthor.id);
          setAuthors(prev => prev.some(a => a.name.toLowerCase() === newAuthor.name.toLowerCase()) ? prev : [...prev, newAuthor]);
        });
        const authorId = bookAuthorIds[0];

        const now = Date.now();
        const bookId = 'book_' + now + '_' + i;
        const prevUrl = audioUrlsRef.current.get(bookId);
        if (prevUrl && prevUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(prevUrl); } catch {}
        }
        const objectUrl = URL.createObjectURL(file);
        audioUrlsRef.current.set(bookId, objectUrl);
        storedAudioBlobKeysRef.current.add(bookId);
        await storeAudioBlob(bookId, file);

        // App instalado: salva uma cópia do audiobook na pasta da biblioteca no disco.
        // No site, o áudio fica só guardado no navegador (acima), sem servidor.
        let realDiskPath = `${libraryFolder}\\${file.name}`;
        if (desktop?.saveAudiobook) {
          try {
            const saved = await desktop.saveAudiobook(file.name, libraryFolder, await file.arrayBuffer());
            if (saved) realDiskPath = saved;
          } catch (e) {
            console.warn('Não foi possível salvar cópia física no disco:', e);
          }
        }

        const metaTranscript = Array.isArray(meta.transcript) ? meta.transcript : [];
        const newBook: Audiobook = {
          id: bookId,
          title: meta.title,
          author: meta.author,
          authorId: authorId || 'a1',
          authorIds: bookAuthorIds.length > 1 ? bookAuthorIds : undefined,
          narrator: meta.narrator || '',
          cover: meta.cover,
          category: meta.category,
          subgenre: meta.subgenre,
          year: meta.year,
          durationEst: meta.durationEst,
          sizeStr: meta.sizeStr,
          chapters: meta.chapters.map(c => ({ ...c, audioUrl: objectUrl })),
          transcript: metaTranscript,
          transcriptSource: metaTranscript.length > 0 ? 'metadata' : undefined,
          description: meta.description || '',
          language: meta.language,
          audioUrl: objectUrl,
          filePath: realDiskPath,
          fileName: file.name,
          addedDate: now + (rawFiles.length - i)
        };
        importedBooks.push(newBook);
      } catch (err) {
        console.error('Erro ao ler metadados do audiobook:', err);
      }
    }

    if (importedBooks.length > 0) {
      setBooks(prev => {
        const uniqueToAdd = importedBooks.filter(nb => !prev.some(eb => isSameAudiobook(eb, nb)));
        const next = deduplicateAudiobooks([...uniqueToAdd, ...prev]);
        booksRef.current = next;
        return next;
      });
      setAudioRevision(r => r + 1);

      // Ao adicionar um audiobook, ele NÃO deve ir para o player/miniplayer automaticamente.
      // O miniplayer só deve exibir o audiobook se o usuário der play nele diretamente.
      if (!selectedBook || !selectedBook.id || selectedBook.id === EMPTY_BOOK.id) {
        const firstBook = importedBooks[0];
        if (firstBook) {
          setSelectedBook(firstBook);
        }
      }
      if (skippedDuplicates > 0 && !silentDuplicateToast) {
        showToast(t('toast_books_imported_with_dups', { count: importedBooks.length, dups: skippedDuplicates }));
      } else {
        showToast(t('toast_books_added_success', { count: importedBooks.length }));
      }
    } else if (skippedDuplicates > 0 && !silentDuplicateToast) {
      showToast(
        skippedDuplicates === 1
          ? 'Este audiobook já foi adicionado à biblioteca.'
          : `${skippedDuplicates} audiobooks já estavam na biblioteca e não foram adicionados novamente.`
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processAudioFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  // Suporte global para arrastar e soltar (Drag and Drop) de arquivos de áudio
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsDraggingFiles(true);
      }
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.relatedTarget === null) {
        setIsDraggingFiles(false);
      }
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingFiles(false);
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processAudioFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [authors, t]);

  // Ajustes: Biblioteca
  const [libraryFolder, setLibraryFolder] = useState<string>(() => {
    const saved = localStorage.getItem('app_library_folder');
    if (!saved || saved.startsWith('D:\\') || saved.startsWith('D:/')) {
      return 'C:\\Audiobooks';
    }
    return saved;
  });
  type DetectNewFilesMode = 'manual' | 'startup' | 'folder-select';
  const [detectNewFiles, setDetectNewFiles] = useState<DetectNewFilesMode>(() => {
    const saved = localStorage.getItem('app_detect_files');
    if (saved === 'manual' || saved === 'startup' || saved === 'folder-select') {
      return saved;
    }
    if (saved === 'false') return 'manual';
    return 'folder-select';
  });
  const [checkOnStartup, setCheckOnStartup] = useState<boolean>(() => localStorage.getItem('app_check_startup') !== 'false');

  // Ajustes: Reprodução
  const [defaultPlaybackSpeed, setDefaultPlaybackSpeed] = useState<number>(() => Number(localStorage.getItem('app_default_speed')) || 1.0);
  const [seekForwardTime, setSeekForwardTime] = useState<number>(() => Number(localStorage.getItem('app_seek_forward')) || 30);
  const [seekBackwardTime, setSeekBackwardTime] = useState<number>(() => Number(localStorage.getItem('app_seek_backward')) || 30);
  const [resumePlayback, setResumePlayback] = useState<boolean>(() => localStorage.getItem('app_resume_playback') !== 'false');
  const [autoShowText, setAutoShowText] = useState<boolean>(() => localStorage.getItem('app_auto_show_text') !== 'false');

  // Se a opção de continuar reprodução for ativada e o player estiver vazio,
  // restaura o último audiobook que foi tocado (se ainda existir na biblioteca)
  useEffect(() => {
    if (resumePlayback && (!currentBook || !currentBook.id || currentBook.id === EMPTY_BOOK.id)) {
      if (lastPlayedBookId) {
        const found = books.find(b => b.id === lastPlayedBookId);
        if (found) {
          beginBookSwitch(found);
          setCurrentBook(found);
          const savedTime = localStorage.getItem('app_last_played_time');
          if (savedTime !== null) {
            const parsed = Number(savedTime);
            if (!isNaN(parsed) && parsed > 0) {
              setCurrentTime(parsed);
              pendingSeekRef.current = parsed;
            }
          }
        }
      }
    }
  }, [resumePlayback, currentBook, lastPlayedBookId, books]);

  // Sempre que a reprodução iniciar, garante que o ID do último livro tocado seja registrado
  useEffect(() => {
    if (isPlaying && currentBook?.id && currentBook.id !== EMPTY_BOOK.id) {
      setLastPlayedBookId(currentBook.id);
      try {
        localStorage.setItem('app_last_played_book_id', currentBook.id);
      } catch {}
    }
  }, [isPlaying, currentBook]);

  // Persiste a fila de reprodução se a opção de continuar reprodução estiver ativa
  useEffect(() => {
    if (resumePlayback) {
      const queue = playbackQueue;
      scheduleWrite('app_playback_queue', () => {
        localStorage.setItem('app_playback_queue', JSON.stringify(slimQueueForStorage(queue)));
      });
    }
  }, [playbackQueue, resumePlayback, scheduleWrite]);

  // Sincroniza os livros da fila restaurada com a biblioteca atual
  useEffect(() => {
    if (resumePlayback && playbackQueue.length > 0 && books.length > 0) {
      setPlaybackQueue(prev => {
        let hasChanges = false;
        const validItems: QueueItem[] = [];
        for (const item of prev) {
          const matchingBook = books.find(b => b.id === (item.bookId || item.book?.id));
          if (matchingBook) {
            if (matchingBook !== item.book || matchingBook.cover !== item.cover) {
              hasChanges = true;
              validItems.push({
                ...item,
                book: matchingBook,
                cover: matchingBook.cover || item.cover,
                bookTitle: matchingBook.title || item.bookTitle,
                author: matchingBook.author || item.author,
              });
            } else {
              validItems.push(item);
            }
          } else {
            hasChanges = true;
          }
        }
        return hasChanges ? validItems : prev;
      });
    }
  }, [books, resumePlayback]);

  // Salva o capítulo/tempo e fila ao fechar a janela / descarregar página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (resumePlayback) {
        try {
          if (currentBook?.id && currentBook.id !== EMPTY_BOOK.id) {
            localStorage.setItem('app_last_played_book_id', currentBook.id);
            localStorage.setItem('app_last_played_time', String(currentTime));
          }
          localStorage.setItem('app_playback_queue', JSON.stringify(slimQueueForStorage(playbackQueue)));
        } catch {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [resumePlayback, currentBook, currentTime, playbackQueue]);

  // Ajustes: Notificações
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => localStorage.getItem('app_notifications_enabled') !== 'false');
  const [notifyChapterCompleted, setNotifyChapterCompleted] = useState<boolean>(() => localStorage.getItem('app_notify_chapter') !== 'false');
  const [notifyBookCompleted, setNotifyBookCompleted] = useState<boolean>(() => localStorage.getItem('app_notify_book') !== 'false');
  const [notifyBookAdded, setNotifyBookAdded] = useState<boolean>(() => localStorage.getItem('app_notify_added') !== 'false');

  // Ajustes: Sistema
  const [dataFolder, setDataFolder] = useState<string>(() => localStorage.getItem('app_data_folder') || '%APPDATA%\\AudiobookPlayer');
  const [isSyncingLibrary, setIsSyncingLibrary] = useState<boolean>(false);

  const handleSelectFolder = async (onSelect: (folderPath: string) => void, _initialFolder: string) => {
    // Celular/tablet ou site publicado: abre na hora (no mesmo toque) o seletor do aparelho.
    // Pastas inteiras só podem ser escolhidas no computador; no celular, escolhem-se os arquivos.
    const isTouch = !!window.matchMedia?.('(pointer: coarse)').matches;
    if (desktop?.selectFolder) {
      const folder = await desktop.selectFolder();
      if (folder) onSelect(folder);
      return;
    }
    (isTouch ? fileInputRef.current : (folderInputRef.current || fileInputRef.current))?.click();
  };

  const handleSyncLibraryNow = async (targetFolder?: string, silentIfEmpty = false) => {
    if (isSyncingLibrary) return;
    setIsSyncingLibrary(true);
    const folder = targetFolder || libraryFolder;
    try {
      if (!desktop?.scanLibraryFolder) throw new Error('not-installed');
      const data = await desktop.scanLibraryFolder(folder);
      if (data) {
        if (data.files && data.files.length > 0) {
          const newEntries = data.files.filter((item: any) => {
            const nameLower = extractNormalizedFileName(item.name);
            const stemLower = normalizeBookCompareStr(item.name.replace(/\.[^/.]+$/, ''));
            return !booksRef.current.some(b => {
              const existingFile = extractNormalizedFileName(b.fileName || b.filePath);
              return (
                (existingFile && existingFile === nameLower) ||
                (stemLower && normalizeBookCompareStr(b.title) === stemLower)
              );
            });
          });

          if (newEntries.length > 0) {
            showToast(`Sincronizando: ${newEntries.length} novo(s) audiobook(s) encontrado(s)...`);
            const loadedFiles: File[] = [];
            for (const item of newEntries) {
              try {
                const bytes = await desktop.readAudioFile(item.path);
                if (bytes) {
                  const blob = new Blob([bytes as BlobPart]);
                  const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
                  const mimeType = ext === '.mp3' ? 'audio/mpeg' : ext === '.m4b' || ext === '.m4a' || ext === '.mp4' ? 'audio/mp4' : ext === '.ogg' ? 'audio/ogg' : ext === '.wav' ? 'audio/wav' : ext === '.flac' ? 'audio/flac' : 'audio/*';
                  const file = new File([blob], item.name, { type: mimeType });
                  loadedFiles.push(file);
                }
              } catch (err) {
                console.warn('Erro ao carregar arquivo de áudio:', item.name, err);
              }
            }
            if (loadedFiles.length > 0) {
              await processAudioFiles(loadedFiles, silentIfEmpty);
              return;
            }
          } else if (!silentIfEmpty) {
            showToast(`Biblioteca sincronizada com "${folder}". Nenhum novo audiobook encontrado.`);
          }
        } else if (!silentIfEmpty) {
          showToast(`Biblioteca sincronizada com "${folder}". Nenhum audiobook na pasta.`);
        }
      } else if (!silentIfEmpty) {
        showToast(`Biblioteca sincronizada com "${folder}".`);
      }
    } catch (e) {
      console.warn('Erro ao sincronizar pasta da biblioteca:', e);
      if (!silentIfEmpty) {
        showToast(`Biblioteca sincronizada com "${folder}".`);
      }
    } finally {
      setTimeout(() => {
        setIsSyncingLibrary(false);
      }, 700);
    }
  };

  const hasRunStartupSyncRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasRunStartupSyncRef.current) return;
    hasRunStartupSyncRef.current = true;
    if (detectNewFiles === 'startup' || (detectNewFiles === 'folder-select' && checkOnStartup)) {
      handleSyncLibraryNow(libraryFolder, true);
    }
  }, []);

  const handleSelectLibraryFolder = () => {
    handleSelectFolder(async (newPath) => {
      setLibraryFolder(newPath);
      try {
        localStorage.setItem('app_library_folder', newPath);
      } catch {}

      showToast(`Pasta selecionada: ${newPath}`);

      if (detectNewFiles === 'folder-select') {
        await handleSyncLibraryNow(newPath);
      }
    }, libraryFolder);
  };

  // Ajustes: Modais
  const [activeSettingSelector, setActiveSettingSelector] = useState<{
    id: string;
    triggerEl?: HTMLElement | null;
    title: string;
    subtitle?: string;
    currentValue: any;
    options: { value: any; label: string; description?: string; colorPreview?: string; icon?: React.ReactNode }[];
    onSelect: (val: any) => void;
  } | null>(null);
  const [showResetSettingsConfirm, setShowResetSettingsConfirm] = useState<boolean>(false);
  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);
  const [showLicensesModal, setShowLicensesModal] = useState<boolean>(false);
  const [activeAllBooksNavId, setActiveAllBooksNavId] = useState<string>('');
  const isManualScrollingRef = useRef<boolean>(false);
  const [showDeleteSearchHistoryConfirm, setShowDeleteSearchHistoryConfirm] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Estados e Handlers do Modo Desenvolvedor (//dev_mode)
  const [isDevModeActive, setIsDevModeActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('app_dev_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [originalBooksBackup, setOriginalBooksBackup] = useState<Audiobook[] | null>(null);
  const [, setDevMockInjected] = useState<boolean>(false);
  const [devCrashScreen, setDevCrashScreen] = useState<boolean>(false);

  const handleExitDevMode = () => {
    setIsDevModeActive(false);
    if (originalBooksBackup && originalBooksBackup.length > 0) {
      setBooks(originalBooksBackup);
      setOriginalBooksBackup(null);
    }
    // Remove os dados de teste (audiobooks, autores e coleções de exemplo); os do usuário ficam
    setBooks(prev => prev.filter(b => !isTestBookId(b.id)));
    setAuthors(prev => prev.filter(a => !isTestAuthorId(a.id) || books.some(b => !isTestBookId(b.id) && bookHasAuthor(b, a))));
    setCollections(prev => prev.filter(c => !TEST_COLLECTION_IDS.has(c.id)));
    setDevMockInjected(false);
    try {
      localStorage.removeItem('app_dev_mode');
    } catch {}
    showToast('Modo de desenvolvedor encerrado');
  };

  const handleInjectDevBooks = () => {
    setIsDevModeActive(true);
    if (!originalBooksBackup) {
      setOriginalBooksBackup([...books]);
    }
    // Autores de teste (catálogo de exemplo + fictícios), sem duplicar
    setAuthors(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const toAdd = [...AUTHORS_DATABASE, ...MOCK_DEV_AUTHORS].filter(a => !existingIds.has(a.id));
      return [...prev, ...toAdd];
    });
    // Audiobooks de teste: catálogo de exemplo + fictícios, sem duplicar
    const now = Date.now();
    setBooks(prev => {
      const existingIds = new Set(prev.map(b => b.id));
      const mocks = MOCK_DEV_AUDIOBOOKS.filter(b => !existingIds.has(b.id)).map((b, i) => ({
        ...b,
        addedDate: now + (10 - i)
      }));
      const catalog = BOOKS_DATABASE.filter(b => !existingIds.has(b.id)).map(b => ({
        ...b,
        cover: getGenericBookCover(b.title, b.author),
      }));
      return [...mocks, ...prev, ...catalog];
    });
    // Coleções de exemplo
    setCollections(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      return [...prev, ...INITIAL_COLLECTIONS.filter(c => !existingIds.has(c.id))];
    });
    setDevMockInjected(true);
    try {
      localStorage.setItem('app_dev_mode', 'true');
    } catch {}
    setSearchQuery('');
    showToast('Modo Dev: audiobooks, autores e coleções de teste adicionados!');
  };

  const handleSimulateDevProgress = () => {
    setIsDevModeActive(true);
    if (books.length > 0) {
      const b0 = books[0];
      const b1 = books[1] || books[0];
      const b2 = books[2] || books[0];
      
      const chap0 = b0.chapters?.[0] ? [`${b0.id}-${b0.chapters[0].id}`] : [];
      const chap1 = b1.chapters?.[0] ? [`${b1.id}-${b1.chapters[0].id}`] : [];
      const chap2 = (b2.chapters || []).map(c => `${b2.id}-${c.id}`);

      setStartedChapters(prev => Array.from(new Set([...prev, ...chap0, ...chap1, ...chap2])));
      setCompletedChapters(prev => Array.from(new Set([...prev, ...chap2])));
      setRecentlyListenedBookIds(prev => Array.from(new Set([b0.id, b1.id, b2.id, ...prev])));
      setFavoriteBookIds(prev => Array.from(new Set([b0.id, ...prev])));

      const cat0 = (b0.category || 'ficção').toLowerCase();
      const cat1 = (b1.category || 'não ficção').toLowerCase();
      const cat2 = (b2.category || 'literatura').toLowerCase();
      const auth0 = (b0.author || '').toLowerCase();
      const auth1 = (b1.author || '').toLowerCase();
      const auth2 = (b2.author || '').toLowerCase();

      const simStats: UserListeningStats = {
        bookSeconds: {
          [b0.id]: 7200,
          [b1.id]: 3600,
          [b2.id]: 14400
        },
        genreSeconds: {
          [cat0]: 7200,
          [cat1]: 3600,
          [cat2]: 14400
        },
        authorSeconds: {
          [auth0]: 7200,
          [auth1]: 3600,
          [auth2]: 14400
        },
        bookPlayCount: {
          [b0.id]: 5,
          [b1.id]: 2,
          [b2.id]: 8
        },
        bookLastPlayed: {
          [b0.id]: Date.now() - 3600000,
          [b1.id]: Date.now() - 7200000,
          [b2.id]: Date.now()
        },
        totalSeconds: 25200
      };
      setUserListeningStats(simStats);
      try {
        localStorage.setItem('app_user_listening_stats', JSON.stringify(simStats));
      } catch {}
    }
    try {
      localStorage.setItem('app_dev_mode', 'true');
    } catch {}
    setSearchQuery('');
    showToast('Modo Dev: Histórico de reprodução, progresso e favoritos simulados!');
  };

  const handleToggleDevZeroState = () => {
    setIsDevModeActive(true);
    try {
      localStorage.setItem('app_dev_mode', 'true');
    } catch {}
    if (books.length > 0) {
      setOriginalBooksBackup([...books]);
      setBooks([]);
      setSearchQuery('');
      showToast('Modo Dev: Biblioteca vazia ativada para teste de Zero-State.');
    } else if (originalBooksBackup && originalBooksBackup.length > 0) {
      setBooks(originalBooksBackup);
      setOriginalBooksBackup(null);
      setSearchQuery('');
      showToast('Modo Dev: Livros originais restaurados da biblioteca.');
    } else {
      setBooks(BOOKS_DATABASE);
      setSearchQuery('');
      showToast('Modo Dev: Biblioteca restaurada com banco de dados padrão.');
    }
  };

  const handleSimulateFirstLaunch = () => {
    setIsDevModeActive(true);
    try {
      localStorage.setItem('app_dev_mode', 'true');
    } catch {}

    // Fazer backup dos livros se ainda não houver
    if (!originalBooksBackup && books.length > 0) {
      setOriginalBooksBackup([...books]);
    }

    // Parar qualquer reprodução de áudio
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    setCurrentTime(0);
    setCurrentBook(EMPTY_BOOK);
    setSelectedBook(EMPTY_BOOK);
    setLastPlayedBookId(null);
    setPlaybackQueue([]);

    // Resetar biblioteca e histórico para estado limpo de primeiro uso
    setBooks([]);
    setFavoriteBookIds([]);
    setFavoriteAuthorIds([]);
    setStartedChapters([]);
    setCompletedChapters([]);
    setRecentlyListenedBookIds([]);
    setSearchHistory([]);

    const emptyStats: UserListeningStats = {
      bookSeconds: {},
      genreSeconds: {},
      authorSeconds: {},
      bookPlayCount: {},
      bookLastPlayed: {},
      totalSeconds: 0
    };
    setUserListeningStats(emptyStats);

    // Limpar dados do usuário no localStorage
    try {
      localStorage.removeItem('app_books');
      localStorage.removeItem('app_last_played_book_id');
      localStorage.removeItem('app_search_history');
      localStorage.removeItem('app_completed_chapters');
      localStorage.removeItem('app_started_chapters');
      localStorage.removeItem('recently_listened_books');
      localStorage.removeItem('fav_books');
      localStorage.removeItem('fav_chapters');
      localStorage.removeItem('fav_authors');
      localStorage.removeItem('app_user_listening_stats');
      localStorage.removeItem('app_playback_queue');
      localStorage.removeItem('app_last_played_time');
      // Garante que, se o usuário fechar e reabrir o app após simular, a tela não apareça no cold start
      localStorage.setItem('app_has_been_opened_before', 'true');
      localStorage.setItem('app_onboarding_completed_v1', 'true');
    } catch {}

    // Navegar para Início e reabrir tela de Boas-vindas
    setActiveScreen({ id: 'home' });
    setHistoryStack([]);
    setSearchQuery('');
    closeAllPopups();
    setOnboardingStep('welcome');
    setShowOnboarding(true);

    showToast('Modo Dev: Primeira abertura simulada! O app está como recém-instalado.');
  };

  const handleTestDevNotifications = () => {
    setIsDevModeActive(true);
    try {
      localStorage.setItem('app_dev_mode', 'true');
    } catch {}
    setSearchQuery('');
    showToast('🔔 [Dev] Notificação 1: Temporizador de sono ativo (30 min)');
    setTimeout(() => {
      showToast('🔔 [Dev] Notificação 2: Audiobook "Duna" adicionado à fila');
    }, 1500);
  };

  const handleSimulateDevError = () => {
    setIsDevModeActive(true);
    try {
      localStorage.setItem('app_dev_mode', 'true');
    } catch {}
    setSearchQuery('');
    showToast('⚠️ [Dev] Erro simulado: Falha ao decodificar arquivo de áudio.');
  };

  const handleSimulateFullScreenError = () => {
    setIsDevModeActive(true);
    try {
      localStorage.setItem('app_dev_mode', 'true');
    } catch {}
    setSearchQuery('');
    setDevCrashScreen(true);
  };







  const handleSelectAuthor = (authorId?: string, authorName?: string) => {
    // Campo com vários autores: abre o primeiro (cada nome tem o próprio link na página do audiobook)
    const names = splitAuthorNames(authorName);
    if (names.length > 1) authorName = names[0];
    const found = authors.find(a => (authorId && a.id === authorId) || (authorName && a.name.toLowerCase() === authorName.toLowerCase()));
    if (found) {
      navigateTo('author-detail', found);
    } else if (authorName) {
      const tempAuthor: Author = {
        id: authorId || 'a_' + Date.now(),
        name: authorName,
        nationality: 'Desconhecido',
        picture: getAuthorAvatar(authorName),
        bio: ''
      };
      navigateTo('author-detail', tempAuthor);
    }
  };

  // Helper de navegação
  // Momento da última expansão a partir de uma capa/foto (a tela aberta assim não desliza)
  const lastZoomOriginAtRef = useRef(0);
  useEffect(() => {
    const onZoom = () => { lastZoomOriginAtRef.current = Date.now(); };
    window.addEventListener('zoom-origin', onZoom);
    return () => window.removeEventListener('zoom-origin', onZoom);
  }, []);

  const navigateTo = (screenId: string, data?: any) => {
    captureExitScroll(mainScrollRef.current);
    setIsEditingBook(false);
    setIsEditingAuthor(false);
    setShowDeleteSelectionConfirm(false);
    setShowDeleteBookDetailConfirm(false);
    setShowDeleteSearchHistoryConfirm(false);
    setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
    setIsSelectionMode(false);
    setSelectedBooks([]);
    setSelectedAuthors([]);
    setSelectedGenres([]);
    setSelectedLanguages([]);
    if (screenId === 'book-detail' && data) {
      setSelectedBook(data);
    }
    const rootScreens = ['home', 'search', 'library', 'history', 'other-apps', 'settings', 'help', 'more'];
    // Mobile: a partir de "Outros", Outros apps / Ajuda / Configurações abrem como submenus (com voltar)
    const openedFromMore = activeScreen.id === 'more' && ['other-apps', 'settings', 'help'].includes(screenId);
    // Abrir pela capa/foto já tem a expansão própria: a tela só aparece (sem deslizar por cima)
    const openedByZoom = Date.now() - lastZoomOriginAtRef.current < 400;
    setNavDirection(rootScreens.includes(screenId) && !openedFromMore ? 'tab' : openedByZoom ? 'tab' : 'push');
    if (rootScreens.includes(screenId) && !openedFromMore) {
      setHistoryStack([]);
      setActiveScreen({ id: screenId, data });
    } else {
      const currentEntry = activeScreen.id === 'book-detail' && !activeScreen.data
        ? { ...activeScreen, data: selectedBook }
        : activeScreen;
      const leavingScrollTop = mainScrollRef.current?.scrollTop || 0;
      setHistoryStack((prev) => [...prev, { ...currentEntry, scrollTop: leavingScrollTop }]);
      setActiveScreen({ id: screenId, data });
    }
    const isChapterJump = screenId === 'book-detail' && pendingChapterScrollRef.current;
    if (!isChapterJump) {
      targetScrollChapterIdRef.current = null;
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTop = 0;
      }
    }
  };

  const handleOpenExternalUrl = useCallback(async (url: string) => {
    if (!url) return;
    if ((window as any).electron?.openExternal) {
      try {
        (window as any).electron.openExternal(url);
        return;
      } catch {}
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const currentRoot = historyStack.length > 0 ? historyStack[0].id : activeScreen.id;

  // Detalhes de outro app no celular: abrem como submenu em tela cheia
  const navigateToRef = useRef(navigateTo);
  navigateToRef.current = navigateTo;
  useEffect(() => {
    const onOpenAppInfo = (e: Event) => navigateToRef.current('app-info', (e as CustomEvent).detail);
    window.addEventListener('open-app-info', onOpenAppInfo);
    return () => window.removeEventListener('open-app-info', onOpenAppInfo);
  }, []);

  const goBack = () => {
    captureExitScroll(mainScrollRef.current);
    setIsEditingBook(false);
    setIsEditingAuthor(false);
    setShowDeleteSelectionConfirm(false);
    setShowDeleteBookDetailConfirm(false);
    setShowDeleteSearchHistoryConfirm(false);
    setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
    setIsSelectionMode(false);
    setSelectedBooks([]);
    setSelectedAuthors([]);
    setSelectedGenres([]);
    setSelectedLanguages([]);
    pendingChapterScrollRef.current = false;
    targetScrollChapterIdRef.current = null;
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setNavDirection('pop');
      // Volta para dentro do ícone só se o card estava na tela de destino; senão, transição padrão
      const leavingId = activeScreen.id === 'book-detail'
        ? (activeScreen.data || selectedBook)?.id
        : activeScreen.id === 'author-detail' ? activeScreen.data?.id : undefined;
      if (leavingId) {
        const zoomKey = `${activeScreen.id === 'book-detail' ? 'book' : 'author'}-${leavingId}`;
        if (canZoomCloseTo(zoomKey, getScreenKey(prev))) {
          setSidebarHighlightHold({ value: sidebarHighlight });
          setNavDirection('tab');
          requestZoomClose(zoomKey);
        }
      }
      setHistoryStack((curr) => curr.slice(0, -1));
      // A tela anterior volta na mesma rolagem em que estava (não no topo)
      const restoreTop = Math.max(0, prev.scrollTop || 0);
      exitRestoreOffset = isMobileNav() ? restoreTop : 0;
      pendingScrollRestoreRef.current = restoreTop;
      setActiveScreen(prev);
      if (prev.id === 'book-detail' && prev.data) {
        setSelectedBook(prev.data);
      }
    }
  };

  // Restaura a rolagem da tela anterior antes de ela aparecer (celular: as duas telas estão juntas na
  // troca; computador: espera a tela que sai terminar). Se o conteúdo ainda está carregando, tenta de novo.
  const pendingScrollRestoreRef = useRef<number | null>(null);
  const restoredScreenRef = useRef<ScreenState | null>(null);
  useLayoutEffect(() => {
    const target = pendingScrollRestoreRef.current;
    if (target === null) return;
    pendingScrollRestoreRef.current = null;
    restoredScreenRef.current = activeScreen;
    const el = mainScrollRef.current;
    if (!el) return;
    let frames = 0;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const apply = () => {
      el.scrollTop = target;
      if (Math.abs(el.scrollTop - target) > 1 && frames++ < 40) raf = requestAnimationFrame(apply);
    };
    if (isMobileNav()) apply();
    else { el.scrollTop = 0; timer = setTimeout(apply, 90); }
    return () => { cancelAnimationFrame(raf); if (timer) clearTimeout(timer); };
  }, [activeScreen]);

  // Detecta se a sinopse na página do audiobook ultrapassa 6 linhas
  useEffect(() => {
    if (activeScreen.id !== 'book-detail' || isEditingBook) {
      setIsSynopsisTruncated(false);
      return;
    }
    const checkTruncation = () => {
      const el = synopsisTextRef.current;
      const fullEl = synopsisFullTextRef.current;
      if (!el) {
        setIsSynopsisTruncated(false);
        return;
      }
      const clampedHeight = el.clientHeight;
      if (clampedHeight <= 0) return;
      const unclampedHeight = Math.max(
        el.scrollHeight,
        fullEl ? fullEl.scrollHeight : 0,
        fullEl ? fullEl.offsetHeight : 0
      );
      setIsSynopsisTruncated(unclampedHeight > clampedHeight + 1);
    };
    checkTruncation();
    const rafId = requestAnimationFrame(checkTruncation);
    const t1 = setTimeout(checkTruncation, 50);
    const t2 = setTimeout(checkTruncation, 180);
    const t3 = setTimeout(checkTruncation, 400);
    const t4 = setTimeout(checkTruncation, 700);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(checkTruncation);
      if (synopsisTextRef.current) ro.observe(synopsisTextRef.current);
      if (synopsisFullTextRef.current) ro.observe(synopsisFullTextRef.current);
    }
    window.addEventListener('resize', checkTruncation);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', checkTruncation);
    };
  }, [synopsisElement, activeScreen, selectedBook, books, isEditingBook, fontSize, uiDensity]);

  const targetScrollChapterIdRef = useRef<string | null>(null);

  // Efeito para centralizar o capítulo ativo no meio da tela (quando clicado no player/fila) ou abrir telas sempre no topo
  useEffect(() => {
    if (activeScreen.id === 'book-detail' && pendingChapterScrollRef.current) {
      pendingChapterScrollRef.current = false;
      const targetChapKey = targetScrollChapterIdRef.current;
      targetScrollChapterIdRef.current = null;
      const scrollChapterIntoView = () => {
        const el = (targetChapKey ? document.querySelector(`[data-chapter-row="${targetChapKey}"]`) : null)
          || document.getElementById('active-playing-chapter');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };
      const t1 = setTimeout(scrollChapterIntoView, 140);
      const t2 = setTimeout(scrollChapterIntoView, 280);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      // Voltando para uma tela: ela fica na rolagem em que estava
      if (restoredScreenRef.current === activeScreen) {
        restoredScreenRef.current = null;
        return;
      }
      const scrollToTop = () => {
        if (mainScrollRef.current) {
          mainScrollRef.current.scrollTop = 0;
        }
      };
      scrollToTop();
      const rafId = requestAnimationFrame(scrollToTop);
      const t1 = setTimeout(scrollToTop, 30);
      const t2 = setTimeout(scrollToTop, 100);
      const t3 = setTimeout(scrollToTop, 180);
      const t4 = setTimeout(scrollToTop, 250);
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [activeScreen, shouldScrollToCurrentChapter]);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchMenuId, setActiveSearchMenuId] = useState<string | null>(null);
  const [searchMenuAnchor, setSearchMenuAnchor] = useState<HTMLElement | null>(null);
  const [searchSelectedIndex, setSearchSelectedIndex] = useState<number>(-1);
  const [activeChapterMenuId, setActiveChapterMenuId] = useState<string | null>(null);
  const [chapterMenuOpenUp, setChapterMenuOpenUp] = useState(false);
  const [activeChapterCommentsPopupId, setActiveChapterCommentsPopupId] = useState<string | null>(null);
  const [chapterCommentsPopupOpenUp, setChapterCommentsPopupOpenUp] = useState(false);

  const [showSleepTimerMenu, setShowSleepTimerMenu] = useState<boolean>(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [sleepTimerMode, setSleepTimerMode] = useState<'duration' | 'end-of-chapter' | null>(null);
  const [isSleepTimerPaused, setIsSleepTimerPaused] = useState<boolean>(false);


  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [_editingBook, setEditingBook] = useState<Audiobook | null>(null);

  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [showQueuePopup, setShowQueuePopup] = useState(false);
  const [showAddTextPopup, setShowAddTextPopup] = useState(false);
  const addTextInputRef = useRef<HTMLInputElement>(null);
  const editBookTextInputRef = useRef<HTMLInputElement>(null);
  const miniQueueScrollRef = useRef<HTMLDivElement>(null);
  const miniNowPlayingRef = useRef<HTMLDivElement>(null);
  const fsQueueScrollRef = useRef<HTMLDivElement>(null);
  const fsNowPlayingRef = useRef<HTMLDivElement>(null);
  const queueUserScrolledRef = useRef(false);
  const isInitialQueueScrollActiveRef = useRef(false);
  const fsTranscriptScrollRef = useRef<HTMLDivElement>(null);
  const lastScrolledTranscriptIdxRef = useRef<number>(-1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showBookDetailsPopup, setShowBookDetailsPopup] = useState(false);
  const [isQueuePulse, setIsQueuePulse] = useState(false);
  const [queueAddedAnim, setQueueAddedAnim] = useState<{
    cover: string;
    title: string;
    author: string;
    isBook: boolean;
    key: number;
  } | null>(null);
  const queueAddedTimeoutRef = useRef<any>(null);

  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const [sortBtnAnchor, setSortBtnAnchor] = useState<HTMLElement | null>(null);

  const [showAuthorCollectionPopup, setShowAuthorCollectionPopup] = useState(false);
  const authorCollectionBtnRef = useRef<HTMLButtonElement>(null);
  const [authorCollectionAnchor, setAuthorCollectionAnchor] = useState<HTMLElement | null>(null);

  const [showBookCollectionPopup, setShowBookCollectionPopup] = useState(false);
  const bookCollectionBtnRef = useRef<HTMLButtonElement>(null);
  const [bookCollectionAnchor, setBookCollectionAnchor] = useState<HTMLElement | null>(null);

  const miniCommentsBtnRef = useRef<HTMLButtonElement>(null);
  const [miniCommentsBtnAnchor, setMiniCommentsBtnAnchor] = useState<HTMLElement | null>(null);

  const miniSpeedBtnRef = useRef<HTMLButtonElement>(null);
  const [miniSpeedBtnAnchor, setMiniSpeedBtnAnchor] = useState<HTMLElement | null>(null);

  const miniSleepBtnRef = useRef<HTMLButtonElement>(null);
  const [miniSleepBtnAnchor, setMiniSleepBtnAnchor] = useState<HTMLElement | null>(null);

  const miniQueueBtnRef = useRef<HTMLButtonElement>(null);
  const [miniQueueBtnAnchor, setMiniQueueBtnAnchor] = useState<HTMLElement | null>(null);

  const miniVolumeBtnRef = useRef<HTMLButtonElement>(null);
  const [miniVolumeBtnAnchor, setMiniVolumeBtnAnchor] = useState<HTMLElement | null>(null);

  const sortMenuTimeoutRef = useRef<any>(null);
  const handleSelectSort = (id: SortOption) => {
    setSortBy(id);
    const labels: Record<SortOption, string> = {
      'name-asc': t('sort_name_asc'),
      'name-desc': t('sort_name_desc'),
      'year-desc': t('sort_year_desc'),
      'year-asc': t('sort_year_asc'),
      'duration-desc': t('sort_duration_desc'),
      'duration-asc': t('sort_duration_asc'),
    };
    showToast(`${t('sort_by')}: ${labels[id]}`);
    if (sortMenuTimeoutRef.current) clearTimeout(sortMenuTimeoutRef.current);
    sortMenuTimeoutRef.current = setTimeout(() => {
      setShowSortMenu(false);
      setSortBtnAnchor(null);
    }, 250);
  };


  const speedMenuTimeoutRef = useRef<any>(null);
  const handleSelectSpeed = (s: number) => {
    setPlaybackSpeed(s);
    if (speedMenuTimeoutRef.current) clearTimeout(speedMenuTimeoutRef.current);
    speedMenuTimeoutRef.current = setTimeout(() => {
      setShowSpeedMenu(false);
    }, 250);
  };

  const closeAllAppPopups = useCallback(() => {
    if (sortMenuTimeoutRef.current) clearTimeout(sortMenuTimeoutRef.current);
    if (speedMenuTimeoutRef.current) clearTimeout(speedMenuTimeoutRef.current);
    setShowSortMenu(false);
    clearButtonCoverAnchorCache(sortBtnAnchor);
    setSortBtnAnchor(null);
    clearButtonCoverAnchorCache(miniCommentsBtnAnchor);
    setMiniCommentsBtnAnchor(null);
    clearButtonCoverAnchorCache(miniSpeedBtnAnchor);
    setMiniSpeedBtnAnchor(null);
    clearButtonCoverAnchorCache(miniSleepBtnAnchor);
    setMiniSleepBtnAnchor(null);
    clearButtonCoverAnchorCache(miniQueueBtnAnchor);
    setMiniQueueBtnAnchor(null);
    clearButtonCoverAnchorCache(miniVolumeBtnAnchor);
    setMiniVolumeBtnAnchor(null);
    setShowSleepTimerMenu(false);
    setShowVolumePopup(false);
    setShowQueuePopup(false);
    setShowAddTextPopup(false);
    queueUserScrolledRef.current = false;
    isInitialQueueScrollActiveRef.current = false;
    setShowSpeedMenu(false);
    setShowCommentsPopover(false);
    setIsAddingComment(false);
    setEditingCommentId(null);
    setDeletingCommentId(null);
    setShowBookDetailsPopup(false);
    setActiveSearchMenuId(null);
    setActiveChapterMenuId(null);
    setActiveChapterCommentsPopupId(null);
    clearButtonCoverAnchorCache(searchMenuAnchor);
    setSearchMenuAnchor(null);
    setShowDeleteSelectionConfirm(false);
    setShowDeleteBookDetailConfirm(false);
    setShowDeleteSearchHistoryConfirm(false);
    setShowResetSettingsConfirm(false);
    setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
    setSearchSelectedIndex(-1);
    setActiveSettingSelector(null);
    setShowLicensesModal(false);
    setShowCreditsModal(false);
    setShowCollectionHeaderAddPopup(false);
    setShowDeleteCurrentCollectionConfirm(false);
    setShowAddAuthorPopup(false);
    setShowAddBookPopup(false);
    setShowAuthorCollectionPopup(false);
    clearButtonCoverAnchorCache(authorCollectionAnchor);
    setAuthorCollectionAnchor(null);
    setShowBookCollectionPopup(false);
    clearButtonCoverAnchorCache(bookCollectionAnchor);
    setBookCollectionAnchor(null);
  }, [sortBtnAnchor, searchMenuAnchor, miniCommentsBtnAnchor, miniSpeedBtnAnchor, miniSleepBtnAnchor, miniQueueBtnAnchor, miniVolumeBtnAnchor, authorCollectionAnchor, bookCollectionAnchor]);

  const closeAllPopups = useCallback(() => {
    closeAllAppPopups();
    window.dispatchEvent(new Event('close-all-popups'));
  }, [closeAllAppPopups]);

  useEffect(() => {
    const onCloseAll = () => {
      closeAllAppPopups();
    };
    window.addEventListener('close-all-popups', onCloseAll);
    return () => window.removeEventListener('close-all-popups', onCloseAll);
  }, [closeAllAppPopups]);

  const isAnyPopupOpen = Boolean(
    showSortMenu ||
    showAuthorCollectionPopup ||
    showBookCollectionPopup ||
    showSleepTimerMenu ||
    showVolumePopup ||
    showQueuePopup ||
    showAddTextPopup ||
    showSpeedMenu ||
    showCommentsPopover ||
    showBookDetailsPopup ||
    showDeleteSelectionConfirm ||
    showDeleteBookDetailConfirm ||
    showDeleteSearchHistoryConfirm ||
    showResetSettingsConfirm ||
    activeSearchMenuId ||
    activeChapterMenuId ||
    activeChapterCommentsPopupId ||
    activeSettingSelector ||
    showLicensesModal ||
    showCreditsModal ||
    showCollectionHeaderAddPopup ||
    showDeleteCurrentCollectionConfirm ||
    showAddAuthorPopup ||
    showAddBookPopup ||
    (!isMobile && searchQuery.length > 0)
  );

  useCloseOnOutsideScrollOrDrag(isAnyPopupOpen, () => {
    closeAllPopups();
    if (searchQuery) setSearchQuery('');
  });

  const cleanupDeletedBooks = useCallback((deletedBookIds: string[]) => {
    if (!deletedBookIds || deletedBookIds.length === 0) return;

    deletedBookIds.forEach(id => {
      deleteAudioBlob(id);
      storedAudioBlobKeysRef.current.delete(id);
      const url = audioUrlsRef.current.get(id);
      if (url) {
        if (url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        }
        audioUrlsRef.current.delete(id);
      }
    });

    // Se o audiobook apagado for o que está no miniplayer/player:
    if (currentBook && deletedBookIds.includes(currentBook.id)) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setCurrentTime(0);
      setCurrentBook(EMPTY_BOOK);
      setIsFullScreen(false);
      closeAllPopups();
    }

    // Se o último audiobook reproduzido for apagado:
    if (lastPlayedBookId && deletedBookIds.includes(lastPlayedBookId)) {
      setLastPlayedBookId(null);
      try {
        localStorage.removeItem('app_last_played_book_id');
      } catch {}
    }

    // Remove também da lista de reproduzidos recentemente
    setRecentlyListenedBookIds(prev => {
      const next = prev.filter(id => !deletedBookIds.includes(id));
      try { localStorage.setItem('recently_listened_books', JSON.stringify(next)); } catch {}
      return next;
    });

    // Limpar itens da fila de reprodução
    setPlaybackQueue(prev => prev.filter(item => !deletedBookIds.includes(item.bookId || item.book?.id)));

    // Se o livro selecionado para detalhes foi apagado:
    if (selectedBook && deletedBookIds.includes(selectedBook.id)) {
      setSelectedBook(EMPTY_BOOK);
    }
  }, [currentBook, lastPlayedBookId, selectedBook]);

  const handleDeleteBook = useCallback((bookId: string) => {
    cleanupDeletedBooks([bookId]);
    setBooks(prev => prev.filter(b => b.id !== bookId));
  }, [cleanupDeletedBooks]);

  useEffect(() => {
    if (searchSelectedIndex >= 0) {
      const el = document.getElementById(`search-result-item-${searchSelectedIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [searchSelectedIndex]);



  const totalDuration = useMemo(() => {
    return (currentBook?.chapters || []).reduce((acc, c) => acc + c.duration, 0);
  }, [currentBook]);

  const currentChapterIndex = useMemo(() => {
    if (!currentBook?.chapters || currentBook.chapters.length === 0) return 0;
    const idx = currentBook.chapters.findIndex((chap, i) => {
      const next = currentBook.chapters[i + 1];
      return currentTime >= chap.startTime && (!next || currentTime < next.startTime);
    });
    return idx === -1 ? 0 : idx;
  }, [currentBook, currentTime]);

  const currentChapter: Chapter = currentBook?.chapters?.[currentChapterIndex] || currentBook?.chapters?.[0] || {
    id: 1,
    title: '',
    startTime: 0,
    duration: 0,
    audioUrl: ''
  };
  const chapterElapsed = Math.max(0, currentTime - (currentChapter?.startTime || 0));
  const chapterRemaining = Math.max(0, (currentChapter?.duration || 0) - chapterElapsed);

  // Alinhamento da fila de reprodução: o capítulo tocando agora fica no topo e anteriores acima dele
  useEffect(() => {
    if (showQueuePopup) {
      queueUserScrolledRef.current = false;
      isInitialQueueScrollActiveRef.current = true;

      const alignQueueScroll = () => {
        if (queueUserScrolledRef.current) return;
        if (miniQueueScrollRef.current && miniNowPlayingRef.current) {
          miniQueueScrollRef.current.scrollTop = miniNowPlayingRef.current.offsetTop;
        }
        if (fsQueueScrollRef.current && fsNowPlayingRef.current) {
          fsQueueScrollRef.current.scrollTop = fsNowPlayingRef.current.offsetTop;
        }
      };

      alignQueueScroll();
      const r1 = requestAnimationFrame(alignQueueScroll);
      const r2 = requestAnimationFrame(() => requestAnimationFrame(alignQueueScroll));
      const t1 = setTimeout(alignQueueScroll, 40);
      const t2 = setTimeout(alignQueueScroll, 100);
      const t3 = setTimeout(alignQueueScroll, 200);
      const tDone = setTimeout(() => {
        isInitialQueueScrollActiveRef.current = false;
      }, 250);

      return () => {
        cancelAnimationFrame(r1);
        cancelAnimationFrame(r2);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(tDone);
      };
    } else {
      queueUserScrolledRef.current = false;
      isInitialQueueScrollActiveRef.current = false;
    }
  }, [showQueuePopup, currentChapter?.id, currentChapterIndex]);

  useEffect(() => {
    if (isPlaying && currentBook && currentChapter) {
      const id = `${currentBook.id}-${currentChapter.id}`;
      setStartedChapters(prev => prev.includes(id) ? prev : [...prev, id]);
      // Ouvindo de novo um capítulo concluído (longe do fim dele): ele volta para "ouvindo"
      const chapEnd = (currentChapter.startTime || 0) + (currentChapter.duration || 0);
      if (chapEnd - getLivePlaybackTime() > 5) {
        setCompletedChapters(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev);
      }
    }
  }, [isPlaying, currentBook, currentChapter]);

  // Marca um capítulo como concluído (ouvido até o fim)
  const markChapterCompleted = useCallback((bookId: string, chapterId: string | number) => {
    if (!bookId || bookId === EMPTY_BOOK.id) return;
    const id = `${bookId}-${chapterId}`;
    setCompletedChapters(prev => prev.includes(id) ? prev : [...prev, id]);
    setStartedChapters(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);
  // Último ponto ouvido (para saber se o fim do capítulo foi alcançado ouvindo, e não pulando)
  const lastHeardRef = useRef<{ bookId: string; time: number } | null>(null);
  const checkChapterFinished = (bookId: string, time: number) => {
    const prev = lastHeardRef.current;
    lastHeardRef.current = { bookId, time };
    if (!prev || prev.bookId !== bookId || time <= prev.time || time - prev.time > 4) return;
    const book = currentBook;
    if (!book || book.id !== bookId) return;
    for (const chap of book.chapters || []) {
      const end = (chap.startTime || 0) + (chap.duration || 0);
      if (!chap.duration) continue;
      // Cruzou o fim do capítulo (ou chegou a menos de 1 s dele) ouvindo
      if (prev.time < end - 1 && time >= end - 1) markChapterCompleted(bookId, chap.id);
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatCountdown = (secs: number) => {
    const total = Math.max(0, Math.floor(secs));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = Math.floor(total % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Avisa (uma vez) se não for possível salvar os dados da biblioteca
  useEffect(() => {
    const onStorageError = () => showToast(t('storage_save_failed'));
    window.addEventListener('app-storage-error', onStorageError);
    return () => window.removeEventListener('app-storage-error', onStorageError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 2800);
  };

  const [favoriteBookIds, setFavoriteBookIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fav_books');
      if (saved) {
        const p = JSON.parse(saved);
        if (Array.isArray(p)) return p;
      }
    } catch {}
    return [];
  });

  const toggleFavoriteBook = (bookId: string) => {
    setFavoriteBookIds(prev => {
      const next = prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId];
      try { localStorage.setItem('fav_books', JSON.stringify(next)); } catch {}
      return next;
    });
    const isNowFav = !favoriteBookIds.includes(bookId);
    const targetBook = books.find(b => b.id === bookId);
    const title = targetBook ? ` "${targetBook.title}"` : "";
    showToast(isNowFav ? t('toast_book_added_fav', { title }) : t('toast_book_removed_fav', { title }));
  };

  const [favoriteChapters, setFavoriteChapters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fav_chapters');
      if (saved) {
        const p = JSON.parse(saved);
        if (Array.isArray(p)) return p;
      }
    } catch {}
    return [];
  });

  const toggleFavoriteChapter = (bookId: string, chapterId: string | number) => {
    const key = `${bookId}-${chapterId}`;
    setFavoriteChapters(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      try { localStorage.setItem('fav_chapters', JSON.stringify(next)); } catch {}
      return next;
    });
    const isNowFav = !favoriteChapters.includes(key);
    const targetBook = books.find(b => b.id === bookId);
    const targetChap = targetBook?.chapters?.find(c => String(c.id) === String(chapterId));
    const title = targetChap ? ` "${targetChap.title}"` : "";
    showToast(isNowFav ? t('toast_chapter_added_fav', { title }) : t('toast_chapter_removed_fav', { title }));
  };

  // =========================================================================
  // SISTEMA INTELIGENTE DE ESTATÍSTICAS E PADRÃO DE USO DO USUÁRIO
  // =========================================================================
  interface UserListeningStats {
    bookSeconds: Record<string, number>;
    genreSeconds: Record<string, number>;
    authorSeconds: Record<string, number>;
    bookPlayCount: Record<string, number>;
    bookLastPlayed: Record<string, number>;
    totalSeconds: number;
  }

  const [userListeningStats, setUserListeningStats] = useState<UserListeningStats>(() => {
    try {
      const saved = localStorage.getItem('app_user_listening_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            bookSeconds: parsed.bookSeconds || {},
            genreSeconds: parsed.genreSeconds || {},
            authorSeconds: parsed.authorSeconds || {},
            bookPlayCount: parsed.bookPlayCount || {},
            bookLastPlayed: parsed.bookLastPlayed || {},
            totalSeconds: typeof parsed.totalSeconds === 'number' ? parsed.totalSeconds : 0,
          };
        }
      }
    } catch {}
    return {
      bookSeconds: {},
      genreSeconds: {},
      authorSeconds: {},
      bookPlayCount: {},
      bookLastPlayed: {},
      totalSeconds: 0,
    };
  });

  const [recentlyListenedBookIds, setRecentlyListenedBookIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recently_listened_books');
      if (saved) {
        const p = JSON.parse(saved);
        if (Array.isArray(p)) return p;
      }
    } catch {}
    return [];
  });

  const [favoriteAuthorIds, setFavoriteAuthorIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fav_authors');
      if (saved) {
        const p = JSON.parse(saved);
        if (Array.isArray(p)) return p;
      }
    } catch {}
    return [];
  });

  const toggleFavoriteAuthor = (authorId: string) => {
    setFavoriteAuthorIds(prev => {
      const next = prev.includes(authorId) ? prev.filter(id => id !== authorId) : [...prev, authorId];
      try { localStorage.setItem('fav_authors', JSON.stringify(next)); } catch {}
      return next;
    });
    const isNowFav = !favoriteAuthorIds.includes(authorId);
    const targetAuthor = authors.find(a => a.id === authorId) || AUTHORS_DATABASE.find(a => a.id === authorId);
    const name = targetAuthor ? ` "${targetAuthor.name}"` : "";
    showToast(isNowFav ? t('toast_author_added_fav', { name }) : t('toast_author_removed_fav', { name }));
  };

  // Buffer de escuta para acumulação sem perdas de desempenho
  const lastTrackedAudioTimeRef = useRef<number>(0);
  const listeningBufferRef = useRef<{
    bookSeconds: Record<string, number>;
    genreSeconds: Record<string, number>;
    authorSeconds: Record<string, number>;
    totalSeconds: number;
    lastFlush: number;
  }>({
    bookSeconds: {},
    genreSeconds: {},
    authorSeconds: {},
    totalSeconds: 0,
    lastFlush: Date.now()
  });

  const flushListeningBuffer = useCallback(() => {
    const buf = listeningBufferRef.current;
    if (buf.totalSeconds <= 0 && Object.keys(buf.bookSeconds).length === 0) return;

    setUserListeningStats(prev => {
      const newBookSec = { ...prev.bookSeconds };
      for (const [k, v] of Object.entries(buf.bookSeconds)) {
        newBookSec[k] = Math.round((newBookSec[k] || 0) + v);
      }
      const newGenreSec = { ...prev.genreSeconds };
      for (const [k, v] of Object.entries(buf.genreSeconds)) {
        newGenreSec[k] = Math.round((newGenreSec[k] || 0) + v);
      }
      const newAuthorSec = { ...prev.authorSeconds };
      for (const [k, v] of Object.entries(buf.authorSeconds)) {
        newAuthorSec[k] = Math.round((newAuthorSec[k] || 0) + v);
      }
      const newTotal = Math.round(prev.totalSeconds + buf.totalSeconds);
      const updated: UserListeningStats = {
        ...prev,
        bookSeconds: newBookSec,
        genreSeconds: newGenreSec,
        authorSeconds: newAuthorSec,
        totalSeconds: newTotal
      };
      try {
        localStorage.setItem('app_user_listening_stats', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    buf.bookSeconds = {};
    buf.genreSeconds = {};
    buf.authorSeconds = {};
    buf.totalSeconds = 0;
    buf.lastFlush = Date.now();
  }, []);

  const accrueListeningSeconds = useCallback((book: Audiobook, deltaSec: number) => {
    if (!book || deltaSec <= 0) return;
    const buf = listeningBufferRef.current;
    buf.bookSeconds[book.id] = (buf.bookSeconds[book.id] || 0) + deltaSec;

    const cat = (book.category || '').toLowerCase().trim();
    if (cat && cat !== 'desconhecido') {
      buf.genreSeconds[cat] = (buf.genreSeconds[cat] || 0) + deltaSec;
    }
    const subg = (book.subgenre || '').toLowerCase().trim();
    if (subg && subg !== 'desconhecido' && subg !== cat) {
      buf.genreSeconds[subg] = (buf.genreSeconds[subg] || 0) + deltaSec;
    }

    for (const name of getBookAuthorNames(book)) {
      const auth = name.toLowerCase().trim();
      if (auth && auth !== 'desconhecido') buf.authorSeconds[auth] = (buf.authorSeconds[auth] || 0) + deltaSec;
    }

    buf.totalSeconds += deltaSec;

    if (Date.now() - buf.lastFlush >= 4000) {
      flushListeningBuffer();
    }
  }, [flushListeningBuffer]);

  const recordPlaySession = useCallback((book: Audiobook) => {
    if (!book || !book.id) return;
    setUserListeningStats(prev => {
      const updated: UserListeningStats = {
        ...prev,
        bookPlayCount: {
          ...prev.bookPlayCount,
          [book.id]: (prev.bookPlayCount[book.id] || 0) + 1
        },
        bookLastPlayed: {
          ...prev.bookLastPlayed,
          [book.id]: Date.now()
        }
      };
      try {
        localStorage.setItem('app_user_listening_stats', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setRecentlyListenedBookIds(prev => {
      const next = [book.id, ...prev.filter(id => id !== book.id)];
      try { localStorage.setItem('recently_listened_books', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Flush buffer ao pausar e ao fechar a janela
  useEffect(() => {
    const handleUnload = () => flushListeningBuffer();
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      flushListeningBuffer();
    };
  }, [flushListeningBuffer]);

  useEffect(() => {
    if (!isPlaying) {
      flushListeningBuffer();
    }
  }, [isPlaying, flushListeningBuffer]);

  // Registro automático de sessão ao iniciar reprodução
  const lastRecordedBookIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (isPlaying && currentBook && currentBook.id && lastRecordedBookIdRef.current !== currentBook.id) {
      recordPlaySession(currentBook);
      lastRecordedBookIdRef.current = currentBook.id;
    } else if (!isPlaying) {
      lastRecordedBookIdRef.current = null;
    }
  }, [isPlaying, currentBook, recordPlaySession]);

  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setResolvedTheme(themeMode);
      
    }
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    // Barra de status/navegação do sistema na mesma cor do fundo do app (claro ou escuro)
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolvedTheme === 'dark' ? '#161616' : '#F0F2F5');
  }, [resolvedTheme]);

  useEffect(() => {
    try { localStorage.setItem('app_theme_mode', themeMode); } catch {}
  }, [themeMode]);

  useEffect(() => {
    const c = ACCENT_COLORS[accentColor] || ACCENT_COLORS.blue;
    document.documentElement.style.setProperty('--app-winblue', c.hex);
    document.documentElement.style.setProperty('--app-winblue-rgb', c.rgb);
    document.documentElement.style.setProperty('--winblue', c.hex);
    document.documentElement.style.setProperty('--winblue-rgb', c.rgb);
    try { localStorage.setItem('app_accent_color', accentColor); } catch {}
  }, [accentColor]);

  const getCoverColorCacheKey = useCallback((url?: string): string => {
    if (!url) return '';
    if (url.length <= 180) return url;
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    const step = Math.max(1, Math.floor(url.length / 256));
    for (let i = 0; i < url.length; i += step) {
      const c = url.charCodeAt(i);
      h1 ^= c;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= c + i;
      h2 = Math.imul(h2, 0x85ebca6b);
    }
    return `cov_${url.length}_${(h1 >>> 0).toString(36)}_${(h2 >>> 0).toString(36)}`;
  }, []);

  const [customCoverColors, setCustomCoverColors] = useState<Record<string, string>>(() => {
    try {
      // v2: cor dominante pela paleta da capa (a v1 era a média dos pixels, que misturava as cores)
      try { localStorage.removeItem('app_custom_cover_colors_v1'); } catch {}
      const saved = localStorage.getItem('app_custom_cover_colors_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {};
  });

  const getCustomCoverColor = useCallback((url?: string): string | undefined => {
    if (!url || url.startsWith('data:image/svg')) return undefined;
    return customCoverColors[url] || customCoverColors[getCoverColorCacheKey(url)];
  }, [customCoverColors, getCoverColorCacheKey]);

  // Segunda cor marcante da capa (capas com duas cores fortes, ex.: azul e laranja)
  const [secondaryCoverColors, setSecondaryCoverColors] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('app_cover_secondary_colors_v1');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
    return {};
  });
  const getSecondaryCoverColor = useCallback((url?: string): string | undefined => {
    if (!url || url.startsWith('data:image/svg')) return undefined;
    return secondaryCoverColors[getCoverColorCacheKey(url)] || secondaryCoverColors[url];
  }, [secondaryCoverColors, getCoverColorCacheKey]);

  useEffect(() => {
    const detailBook: Audiobook | undefined = (activeScreen.id === 'book-detail' || activeScreen.id === 'book-synopsis')
      ? (books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook)
      : undefined;
    const detailAuthor: Author | undefined = activeScreen.id === 'author-detail'
      ? (authors.find(a => a.id === activeScreen.data?.id || (a.name && activeScreen.data?.name && a.name.toLowerCase() === activeScreen.data.name.toLowerCase())) || activeScreen.data)
      : undefined;
    const candidateUrls = [
      detailBook?.cover,
      isEditingBook ? editBookCover : undefined,
      currentBook?.cover,
      detailAuthor?.picture,
      isEditingAuthor ? editAuthorPicture : undefined,
      ...books.map(b => b.cover),
      ...authors.map(a => a.picture),
    ];
    const urlsToExtract = Array.from(new Set(
      candidateUrls.filter(
        (u): u is string => Boolean(u && !u.startsWith('data:image/svg') && !getCustomCoverColor(u))
      )
    ));
    if (urlsToExtract.length === 0) return;

    let cancelled = false;
    urlsToExtract.forEach(coverUrl => {
      const cacheKey = getCoverColorCacheKey(coverUrl);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cancelled) return;
        try {
          const canvas = document.createElement('canvas');
          const size = 32;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;
          const palette = extractCoverPalette(data);
          if (palette) {
            const { primary: hex, secondary } = palette;
            setCustomCoverColors(prev => {
              if (prev[cacheKey] === hex) return prev;
              const next = { ...prev, [cacheKey]: hex };
              try {
                localStorage.setItem('app_custom_cover_colors_v2', JSON.stringify(next));
              } catch {}
              return next;
            });
            setSecondaryCoverColors(prev => {
              const value = secondary || '';
              if ((prev[cacheKey] || '') === value) return prev;
              const next = { ...prev, [cacheKey]: value };
              try {
                localStorage.setItem('app_cover_secondary_colors_v1', JSON.stringify(next));
              } catch {}
              return next;
            });
          }
        } catch {}
      };
      img.src = coverUrl;
    });
    return () => { cancelled = true; };
  }, [activeScreen.id, activeScreen.data, selectedBook, books, authors, isEditingBook, editBookCover, isEditingAuthor, editAuthorPicture, currentBook?.cover, getCustomCoverColor, getCoverColorCacheKey]);

  const currentCoverHex = useMemo(() => {
    if (!currentBook?.cover || currentBook.cover.startsWith('data:image/svg')) {
      return getGenericCoverColor(currentBook?.cover, currentBook?.title || '', currentBook?.author || '');
    }
    return getCustomCoverColor(currentBook.cover) || getGenericCoverColor(currentBook.cover, currentBook.title, currentBook.author);
  }, [currentBook?.cover, currentBook?.title, currentBook?.author, getCustomCoverColor]);

  const currentCoverSecondaryHex = useMemo(() => getSecondaryCoverColor(currentBook?.cover) || '', [currentBook?.cover, getSecondaryCoverColor]);

  const currentBookHighlight = useMemo(() => {
    return getBookHighlightTheme(currentCoverHex, resolvedTheme === 'dark');
  }, [currentCoverHex, resolvedTheme]);

  const fullscreenAmbientColors = useMemo(() => {
    const hex = currentCoverHex || '#0086F0';
    const { h, s, l } = hexToHsl(hex);
    const isDark = resolvedTheme === 'dark';

    // Variações e tons da capa do audiobook:
    // Mantemos estritamente a mesma matiz (h) da capa, sem desvios para cores vizinhas ou complementares.
    // Variamos unicamente a luminosidade (tons claros, médios e escuros) e saturação correspondente.
    const isLowSat = s < 12;
    const baseS = isLowSat ? s : Math.min(100, Math.max(35, s));

    // No modo claro: tons ricos, visíveis e harmônicos da capa, mantendo o fundo claro e confortável.
    // No modo escuro: tons profundos e contrastantes.
    const tonePrimary = isDark
      ? hslToHex(h, baseS, Math.min(58, Math.max(38, l)))
      : hslToHex(h, isLowSat ? s : Math.min(88, Math.max(40, baseS * 0.95)), 64);

    const toneMedium = isDark
      ? hslToHex(h, isLowSat ? s : Math.min(85, Math.max(32, baseS * 0.9)), Math.min(48, Math.max(28, l - 10)))
      : hslToHex(h, isLowSat ? s : Math.min(85, Math.max(38, baseS * 0.9)), 55);

    const toneLight = isDark
      ? hslToHex(h, isLowSat ? s : Math.min(85, Math.max(30, baseS * 0.85)), Math.min(78, Math.max(56, l + 18)))
      : hslToHex(h, isLowSat ? s : Math.min(80, Math.max(30, baseS * 0.8)), 75);

    const toneVeryLight = isDark
      ? hslToHex(h, isLowSat ? s : Math.min(60, Math.max(20, baseS * 0.6)), Math.min(94, Math.max(78, l + 30)))
      : hslToHex(h, isLowSat ? s : Math.min(65, Math.max(22, baseS * 0.65)), 88);

    const toneDeep = hslToHex(h, isLowSat ? s : Math.min(90, Math.max(35, baseS * 0.95)), Math.max(16, Math.min(26, l - 18)));
    const toneVeryDark = hslToHex(h, isLowSat ? s : Math.min(75, Math.max(25, baseS * 0.8)), Math.max(8, Math.min(15, l - 32)));

    // Tons luminosos adicionais para suavidade e equilíbrio com o fundo claro
    const tonePastel = hslToHex(h, isLowSat ? s : Math.min(72, Math.max(25, baseS * 0.7)), 82);
    const toneWhiteTint = hslToHex(h, isLowSat ? s : Math.min(50, Math.max(16, baseS * 0.5)), 94);

    // Segunda cor da capa (se houver): entra em parte do fundo, para o player refletir as duas cores
    let toneSecondary = toneLight;
    let toneSecondarySoft = isDark ? toneDeep : tonePastel;
    if (currentCoverSecondaryHex) {
      const s2 = hexToHsl(currentCoverSecondaryHex);
      const sat2 = s2.s < 12 ? s2.s : Math.min(85, Math.max(35, s2.s));
      toneSecondary = isDark ? hslToHex(s2.h, sat2, Math.min(56, Math.max(38, s2.l))) : hslToHex(s2.h, Math.min(80, sat2 * 0.9), 66);
      toneSecondarySoft = isDark ? hslToHex(s2.h, Math.min(70, sat2 * 0.8), 22) : hslToHex(s2.h, Math.min(65, sat2 * 0.7), 84);
    }

    return {
      tonePrimary,
      toneMedium,
      toneLight,
      toneVeryLight,
      toneDeep,
      toneVeryDark,
      tonePastel,
      toneWhiteTint,
      toneSecondary,
      toneSecondarySoft,
      isDark,
    };
  }, [currentCoverHex, currentCoverSecondaryHex, resolvedTheme]);

  const miniplayerAmbientStyle = useMemo<React.CSSProperties>(() => {
    const hex = currentCoverHex || '#0086F0';
    const { h, s } = hexToHsl(hex);
    const isDark = resolvedTheme === 'dark';

    const isLowSat = s < 12;
    const baseS = isLowSat ? s : Math.min(100, Math.max(30, s));

    if (isDark) {
      // No modo escuro: tom escuro da cor da capa, mantendo o aspecto sofisticado e translúcido
      const darkBg1 = hslToHex(h, Math.min(65, Math.max(20, baseS * 0.7)), 12);
      const darkBg2 = hslToHex(h, Math.min(60, Math.max(18, baseS * 0.65)), 8);
      const darkBorder = hslToHex(h, Math.min(70, Math.max(22, baseS * 0.75)), 22);

      // Vidro: translúcido com desfoque (como os pop-ups e a barra de abas), levemente na cor da capa
      return {
        background: `linear-gradient(135deg, ${darkBg1}B8, ${darkBg2}C7)`,
        borderColor: `${darkBorder}38`,
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        boxShadow: `0 20px 40px -12px rgba(0, 0, 0, 0.7), 0 0 28px -4px ${darkBorder}33`,
        transition: 'background 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease',
      } as React.CSSProperties;
    } else {
      // No modo claro: tom visível e elegante da cor da capa, mantendo harmonia e ótima legibilidade
      const lightSat = isLowSat ? s : Math.min(75, Math.max(28, baseS * 0.72));
      const lightBg1 = hslToHex(h, lightSat, 86);
      const lightBg2 = hslToHex(h, Math.min(80, lightSat + 4), 78);
      const lightBorder = hslToHex(h, Math.min(85, lightSat + 10), 68);

      return {
        background: `linear-gradient(135deg, ${lightBg1}B3, ${lightBg2}AD)`,
        borderColor: 'rgba(255, 255, 255, 0.42)',
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        boxShadow: `0 20px 35px -10px rgba(0, 0, 0, 0.12), 0 0 28px -4px ${lightBorder}55`,
        transition: 'background 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease',
      } as React.CSSProperties;
    }
  }, [currentCoverHex, resolvedTheme]);

  const lastTranscriptIdxRef = useRef<number>(-1);

  // Busca ultra-rápida no transcript: O(1) amortizado para reprodução contínua e O(log N) em saltos
  const activeTranscriptIndex = useMemo(() => {
    const idx = findActiveTranscriptIndex(currentBook?.transcript, currentTime, lastTranscriptIdxRef.current);
    if (idx !== -1) {
      lastTranscriptIdxRef.current = idx;
    }
    return idx;
  }, [currentBook?.transcript, currentTime]);

  // Rolagem suave para linha ativa sem reflows desnecessários
  useEffect(() => {
    if (!showTranscript || !isFullScreen || activeTranscriptIndex === -1) return;
    if (lastScrolledTranscriptIdxRef.current === activeTranscriptIndex) return;
    lastScrolledTranscriptIdxRef.current = activeTranscriptIndex;

    const container = fsTranscriptScrollRef.current;
    if (!container) return;

    const activeEl = container.querySelector(`[data-transcript-idx="${activeTranscriptIndex}"]`) as HTMLElement;
    if (activeEl) {
      const targetTop = activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }
  }, [activeTranscriptIndex, showTranscript, isFullScreen]);

  // Alinhamento ao abrir a letra após conclusão da transição
  useEffect(() => {
    if (showTranscript && isFullScreen && activeTranscriptIndex !== -1) {
      const timer = setTimeout(() => {
        const container = fsTranscriptScrollRef.current;
        if (!container) return;
        const activeEl = container.querySelector(`[data-transcript-idx="${activeTranscriptIndex}"]`) as HTMLElement;
        if (activeEl) {
          const targetTop = activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
          container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        }
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [showTranscript, isFullScreen]);

  const sidebarHighlight = useMemo(() => {
    if (activeScreen.id === 'book-detail' || activeScreen.id === 'book-synopsis') {
      const targetBook: Audiobook | undefined = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
      if (!targetBook) return null;
      const effectiveCover = (isEditingBook && editBookCover) ? editBookCover : targetBook.cover;
      const rawHex = (!effectiveCover || effectiveCover.startsWith('data:image/svg'))
        ? (isEditingBook && editCoverColor ? editCoverColor : getGenericCoverColor(effectiveCover, targetBook.title, targetBook.author))
        : (getCustomCoverColor(effectiveCover) || getGenericCoverColor(effectiveCover, targetBook.title, targetBook.author));
      return getBookHighlightTheme(rawHex, resolvedTheme === 'dark');
    }
    if (activeScreen.id === 'author-detail') {
      const targetAuthor: Author | undefined = authors.find(a => a.id === activeScreen.data?.id || (a.name && activeScreen.data?.name && a.name.toLowerCase() === activeScreen.data.name.toLowerCase())) || activeScreen.data;
      if (!targetAuthor) return null;
      const effectivePic = (isEditingAuthor && editAuthorPicture) ? editAuthorPicture : getEffectiveAuthorAvatar(targetAuthor.name, targetAuthor.picture);
      const rawHex = (!effectivePic || effectivePic.startsWith('data:image/svg'))
        ? (isEditingAuthor && editAuthorColor ? editAuthorColor : getGenericAuthorColor(effectivePic, targetAuthor.name))
        : (getCustomCoverColor(effectivePic) || getGenericAuthorColor(effectivePic, targetAuthor.name));
      return getBookHighlightTheme(rawHex, resolvedTheme === 'dark');
    }
    return null;
  }, [activeScreen.id, activeScreen.data, selectedBook, books, authors, isEditingBook, editBookCover, editCoverColor, isEditingAuthor, editAuthorPicture, editAuthorColor, getCustomCoverColor, resolvedTheme]);

  const headerTintColor = useMemo(() => {
    if (!sidebarHighlight) return '';
    const { h, s: sat } = hexToHsl(sidebarHighlight.hex);
    return resolvedTheme === 'dark'
      ? hslToHex(h, Math.min(55, sat * 0.7), 13)
      : hslToHex(h, Math.min(60, sat * 0.6), 90);
  }, [sidebarHighlight, resolvedTheme]);

  // Título da tela/menu/submenu atual para exibição no cabeçalho ao rolar
  // ===== Mobile: ações do cabeçalho (ação rápida + três pontinhos) por tela =====
  const renderBookDetailsContent = () => (
    <>
                                        <div className="px-1 py-1 mb-2">
                                          <span className="text-sm font-bold text-[var(--text-main)]">{t('more_details')}</span>
                                        </div>

                                        {(() => {
                                          const activeBk = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
                                          if (!activeBk) return null;
                                          const { narrator, language } = resolveNarratorAndLanguage(activeBk);
                                          const genreParts: string[] = [];
                                          if (activeBk.category && activeBk.category !== 'Desconhecido') genreParts.push(activeBk.category);
                                          if (activeBk.subgenre && activeBk.subgenre !== 'Desconhecido' && (!activeBk.category || activeBk.subgenre.toLowerCase() !== activeBk.category.toLowerCase())) {
                                            genreParts.push(activeBk.subgenre);
                                          }
                                          const genreDisplay = genreParts.join(', ');

                                          return (
                                            <div className="space-y-3 px-1 py-1">
                                              {/* Gênero e Subgênero */}
                                              {genreDisplay && (
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <BookOpen size={13} className="text-[var(--text-muted)] shrink-0" />
                                                    <span className="text-xs text-[var(--text-muted)] font-medium">{t('genres')}</span>
                                                  </div>
                                                  <span className="text-xs font-semibold text-[var(--text-main)] text-right truncate max-w-[190px]">{genreDisplay}</span>
                                                </div>
                                              )}

                                              {/* Narrador */}
                                              {narrator && (
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <User size={13} className="text-[var(--text-muted)] shrink-0" />
                                                    <span className="text-xs text-[var(--text-muted)] font-medium">{t('narrated_by')}</span>
                                                  </div>
                                                  <span className="text-xs font-semibold text-[var(--text-main)] text-right truncate max-w-[190px]">{narrator}</span>
                                                </div>
                                              )}

                                              {/* Idioma */}
                                              {language && (
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <FileText size={13} className="text-[var(--text-muted)] shrink-0" />
                                                    <span className="text-xs text-[var(--text-muted)] font-medium">{t('language_label')}</span>
                                                  </div>
                                                  <span className="text-xs font-semibold text-[var(--text-main)]">{language}</span>
                                                </div>
                                              )}

                                              {/* Ano */}
                                              {activeBk.year && (
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Calendar size={13} className="text-[var(--text-muted)] shrink-0" />
                                                    <span className="text-xs text-[var(--text-muted)] font-medium">{t('year')}</span>
                                                  </div>
                                                  <span className="text-xs font-bold text-[var(--text-main)]">{activeBk.year}</span>
                                                </div>
                                              )}

                                              {/* Duração */}
                                              {activeBk.durationEst && (
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Clock size={13} className="text-[var(--text-muted)] shrink-0" />
                                                    <span className="text-xs text-[var(--text-muted)] font-medium">{t('duration')}</span>
                                                  </div>
                                                  <span className="text-xs font-bold text-[var(--text-main)]">{activeBk.durationEst}</span>
                                                </div>
                                              )}

                                              {/* Tamanho */}
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <Database size={13} className="text-[var(--text-muted)] shrink-0" />
                                                  <span className="text-xs text-[var(--text-muted)] font-medium">{t('size')}</span>
                                                </div>
                                                <span className="text-xs font-bold text-[var(--text-main)]">{activeBk.sizeStr || "428 MB"}</span>
                                              </div>

                                              {/* Formato */}
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <FileAudio size={13} className="text-[var(--text-muted)] shrink-0" />
                                                  <span className="text-xs text-[var(--text-muted)] font-medium">{t('format')}</span>
                                                </div>
                                                {(() => {
                                                  const ext = (activeBk.fileName || activeBk.filePath || '').split('.').pop()?.toUpperCase();
                                                  const formatLabel = (ext && ext.length <= 4) ? `${ext} Áudio` : 'M4B (AAC Áudio)';
                                                  return <span className="text-xs font-bold text-[var(--text-main)]">{formatLabel}</span>;
                                                })()}
                                              </div>

                                              {/* Local onde está armazenado e botão Ver na pasta */}
                                              {(() => {
                                                let bookStoragePath = activeBk.filePath || (activeBk.fileName ? `${libraryFolder}\\${activeBk.fileName}` : `${libraryFolder}\\${activeBk.title}.m4b`);
                                                if (bookStoragePath.startsWith('D:\\') || bookStoragePath.startsWith('D:/')) {
                                                  const parts = bookStoragePath.split(/[\\/]/);
                                                  bookStoragePath = `${libraryFolder}\\${parts[parts.length - 1]}`;
                                                }

                                                return (
                                                  <div className="flex flex-col gap-2 pt-1">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                          <HardDrive size={13} className="text-[var(--text-muted)] shrink-0" />
                                                          <span className="text-xs text-[var(--text-muted)] font-medium block">{t('storage_location')}</span>
                                                        </div>
                                                        <p className="text-[11px] text-[var(--text-main)] truncate" title={bookStoragePath}>
                                                          {bookStoragePath}
                                                        </p>
                                                      </div>
                                                      {IS_INSTALLED_APP && (<motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleOpenBookInFolder(activeBk);
                                                        }}
                                                        className="shrink-0 h-8 px-3.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
                                                        title={t('view_in_folder')}
                                                      >
                                                        <FolderOpen size={13} />
                                                        <span>{t('view_in_folder')}</span>
                                                      </motion.button>)}
                                                    </div>
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          );
                                        })()}
                                        </>
  );

  // ===== Ajustes iniciais no celular: um tema por vez (como as opções dos ajustes), com voltar e prosseguir =====
  const [onboardingPage, setOnboardingPage] = useState(0);
  // Celular: ao rolar os ajustes iniciais, o título da página aparece pequeno no cabeçalho (com desfoque),
  // como nas telas do app
  const onboardingScrollRef = useRef<HTMLDivElement>(null);
  const [onboardingHeaderProgress, setOnboardingHeaderProgress] = useState(0);
  const handleOnboardingScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const p = Math.max(0, Math.min(1, (e.currentTarget.scrollTop - 24) / 36));
    setOnboardingHeaderProgress(prev => (Math.abs(prev - p) < 0.02 && p !== 0 && p !== 1 ? prev : p));
  };
  useEffect(() => {
    // Nova página ou etapa: volta ao topo (título grande)
    if (onboardingScrollRef.current) onboardingScrollRef.current.scrollTop = 0;
    setOnboardingHeaderProgress(0);
  }, [onboardingPage, onboardingStep]);
  const renderOnboardingSettings = () => {
    type OnbOption = { value: any; label: string; description?: string; icon?: React.ReactNode; colorPreview?: string };
    type OnbSetting = { id: string; title: string; subtitle: string; value: any; options: OnbOption[]; onSelect: (v: any) => void };
    const yesNo = (value: boolean, onSelect: (v: boolean) => void, id: string, title: string, subtitle: string): OnbSetting => ({
      id, title, subtitle, value, onSelect,
      options: [
        { value: true, label: t('yes'), icon: <Check size={16} /> },
        { value: false, label: t('no'), icon: <X size={16} /> },
      ],
    });
    const pages: { id: string; title: string; icon: React.ReactNode; settings: OnbSetting[] }[] = [
      {
        id: 'appearance', title: t('settings_interface'), icon: <Palette size={18} />,
        settings: [
          {
            id: 'theme', title: t('settings_theme'), subtitle: t('settings_theme_sub'), value: themeMode,
            onSelect: (v) => setThemeMode(v),
            options: [
              { value: 'system', label: t('theme_system'), description: t('theme_system_desc'), icon: <Laptop size={16} /> },
              { value: 'light', label: t('theme_light'), description: t('theme_light_desc'), icon: <Sun size={16} /> },
              { value: 'dark', label: t('theme_dark'), description: t('theme_dark_desc'), icon: <Moon size={16} /> },
            ],
          },
          {
            id: 'accent-color', title: t('settings_accent'), subtitle: t('settings_accent_sub'), value: accentColor,
            onSelect: (v) => setAccentColor(v),
            options: Object.entries(ACCENT_COLORS).map(([key, item]) => ({ value: key, label: t('color_' + key) || item.name, colorPreview: item.hex })),
          },
          {
            id: 'font-size', title: t('settings_font_size'), subtitle: t('settings_font_size_sub'), value: fontSize,
            onSelect: (v) => setFontSize(v),
            options: [
              { value: 'standard', label: t('font_standard'), icon: <Type size={16} /> },
              { value: 'large', label: t('font_large'), description: '+20%', icon: <ALargeSmall size={16} /> },
            ],
          },
        ],
      },
      {
        id: 'playback', title: t('settings_playback'), icon: <Play size={18} />,
        settings: [
          {
            id: 'default-speed', title: t('settings_default_speed'), subtitle: t('settings_default_speed_sub'), value: defaultPlaybackSpeed,
            onSelect: (v) => { setDefaultPlaybackSpeed(v); setPlaybackSpeed(v); },
            options: [0.75, 1, 1.25, 1.5, 1.75, 2].map(v => ({
              value: v,
              label: `${v.toFixed(2).replace(/0$/, '').replace(/\.0$/, '.0').replace('.', ',')}×`,
              icon: v < 1 ? <Turtle size={16} /> : v === 1 ? <Dog size={16} /> : v < 1.75 ? <Rabbit size={16} /> : <Bird size={16} />,
            })),
          },
          yesNo(resumePlayback, setResumePlayback, 'resume', t('settings_resume_playback'), t('settings_resume_playback_sub')),
        ],
      },
      {
        id: 'notifications', title: t('settings_notifications'), icon: <Bell size={18} />,
        settings: [yesNo(notificationsEnabled, setNotificationsEnabled, 'notifications', t('settings_notif_enabled'), t('settings_notif_enabled_sub'))],
      },
    ];
    const pageIdx = Math.min(onboardingPage, pages.length - 1);
    const page = pages[pageIdx];
    const isLast = pageIdx === pages.length - 1;
    const goPrev = () => {
      if (pageIdx === 0) { setOnboardingStep('welcome'); return; }
      setOnboardingPage(pageIdx - 1);
    };
    const goNext = () => {
      if (isLast) { setOnboardingPage(0); completeOnboarding(); return; }
      setOnboardingPage(pageIdx + 1);
    };
    const prevLabel = pageIdx === 0 ? t('onb_welcome') : pages[pageIdx - 1].title;
    const nextLabel = isLast ? t('onb_finish') : pages[pageIdx + 1].title;
    const navBtn = "h-12 rounded-full flex items-center gap-1.5 backdrop-blur-3xl border shadow-lg text-[14px] md:text-[15px] font-semibold min-w-0 max-md:flex-1 max-md:max-w-[42%] max-md:justify-center";
    return (
      <motion.div
        key="onboarding-settings"
        variants={transicaoConteudo}
        initial="escondido"
        animate="visivel"
        exit="saindo"
        className="flex-1 w-full flex flex-col min-h-full"
      >
        {/* Celular: cabeçalho com o título da página quando a tela rola (desfoque atrás, esmaecendo para baixo) */}
        <div
          aria-hidden={onboardingHeaderProgress < 0.5}
          className="md:hidden fixed inset-x-0 top-0 z-30 pointer-events-none"
          style={{ height: 'calc(var(--app-header-top) + 44px + 40px)', opacity: onboardingHeaderProgress }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(4,7,15,0.62), rgba(4,7,15,0.38) 60%, rgba(4,7,15,0))',
              WebkitBackdropFilter: 'blur(18px) saturate(150%)',
              backdropFilter: 'blur(18px) saturate(150%)',
              WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)',
            }}
          />
          <div className="absolute inset-x-0 flex items-center justify-center px-16" style={{ top: 'var(--app-header-top)', height: 44 }}>
            <span className="text-[17px] font-semibold text-white truncate">{page.title}</span>
          </div>
        </div>
        <div className="flex-1 w-full max-w-xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 md:pt-14 pb-36 md:pb-44 flex flex-col">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={page.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: 'spring', stiffness: 460, damping: 40, mass: 0.6 }}
              className="flex flex-col"
            >
              <h1 className="text-[34px] md:text-5xl font-semibold text-white tracking-tight mb-7 md:mb-10 flex items-center gap-3 md:gap-4">
                <span className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-winblue/20 text-winblue flex items-center justify-center shrink-0">{page.icon}</span>
                {page.title}
              </h1>
              {/* Celular: um tema abaixo do outro. Computador: duas colunas independentes (temas alternados),
                  cada um logo abaixo do anterior, sem buracos entre as linhas */}
              {(() => {
                const renderSetting = (setting: OnbSetting) => (
                  <section key={setting.id}>
                    <h2 className="text-[15px] md:text-base font-bold text-white">{setting.title}</h2>
                    <p className="text-[13px] md:text-sm text-white/65 mt-0.5 mb-3">{setting.subtitle}</p>
                    <div className="p-1.5 rounded-[32px] bg-white/[0.07] backdrop-blur-xl border border-white/15 space-y-0.5">
                      {setting.options.map((option, idx) => {
                        const selected = setting.value === option.value;
                        return (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 520, damping: 32, mass: 0.5 }}
                            onClick={() => setting.onSelect(option.value)}
                            className={`w-full min-h-[52px] flex items-center gap-3.5 px-3 py-2 text-left rtl:text-right rounded-[26px] border transition-[background-color,border-color,box-shadow] duration-150 ${selected ? 'bg-winblue/20 border-winblue/40 hover:shadow-[0_0_16px_rgba(var(--winblue-rgb),0.35)]' : 'border-transparent hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_14px_rgba(255,255,255,0.15)]'}`}
                          >
                            <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selected ? 'bg-winblue/25 text-winblue' : 'bg-white/10 text-white/85'}`}>
                              {option.colorPreview
                                ? <span className="w-5 h-5 rounded-full border border-white/25" style={{ backgroundColor: option.colorPreview }} />
                                : option.icon}
                            </span>
                            <span className="flex-1 min-w-0 flex flex-col">
                              <span className={`text-[15px] font-semibold truncate ${selected ? 'text-winblue' : 'text-white'}`}>{option.label}</span>
                              {option.description && <span className="text-xs text-white/60 truncate mt-0.5">{option.description}</span>}
                            </span>
                            {selected && <BsCheck2 size={18} className="text-winblue shrink-0" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </section>
                );
                const left = page.settings.filter((_, i) => i % 2 === 0);
                const right = page.settings.filter((_, i) => i % 2 === 1);
                return (
                  <>
                    <div className="flex flex-col gap-7 md:hidden">{page.settings.map(renderSetting)}</div>
                    <div className={`hidden md:flex gap-8 items-start ${right.length === 0 ? 'max-w-xl' : ''}`}>
                      <div className="flex-1 min-w-0 flex flex-col gap-8">{left.map(renderSetting)}</div>
                      {right.length > 0 && <div className="flex-1 min-w-0 flex flex-col gap-8">{right.map(renderSetting)}</div>}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Voltar (com o nome da página anterior), bolinhas das páginas e prosseguir/concluir (com o nome da próxima) */}
        <div className="fixed inset-x-0 bottom-0 z-20 px-4 md:px-10 pb-[max(20px,env(safe-area-inset-bottom))] pt-8 md:bg-gradient-to-t md:from-black/55 md:to-transparent">
          {/* Celular: desfoque no rodapé, atrás dos botões, esmaecendo para cima */}
          <div
            aria-hidden="true"
            className="md:hidden absolute inset-x-0 bottom-0 -top-6 -z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(4,7,15,0.6), rgba(4,7,15,0.35) 55%, rgba(4,7,15,0))',
              WebkitBackdropFilter: 'blur(18px) saturate(150%)',
              backdropFilter: 'blur(18px) saturate(150%)',
              WebkitMaskImage: 'linear-gradient(to top, #000 0%, #000 50%, transparent 100%)',
              maskImage: 'linear-gradient(to top, #000 0%, #000 50%, transparent 100%)',
            }}
          />
          <div className="max-w-xl md:max-w-5xl mx-auto md:px-10 flex items-center justify-between gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goPrev}
              className={`${navBtn} pl-2.5 pr-4 md:pl-3 md:pr-5 bg-white/10 border-white/20 text-white transition-[background-color,border-color,box-shadow] hover:bg-white/20 hover:border-white/35 hover:shadow-[0_0_20px_rgba(255,255,255,0.22)]`}
            >
              <ChevronLeft size={22} className="shrink-0 rtl:rotate-180" />
              <span className="truncate">{prevLabel}</span>
            </motion.button>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0" aria-hidden="true">
              {pages.map((p, i) => (
                <span key={p.id} className={`h-2 rounded-full transition-all duration-300 ${i === pageIdx ? 'w-5 md:w-6 bg-winblue' : 'w-2 bg-white/30'}`} />
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goNext}
              className={`${navBtn} pl-4 pr-2.5 md:pl-5 md:pr-3 bg-winblue/30 border-winblue text-winblue transition-[background-color,box-shadow] hover:bg-winblue/40 hover:shadow-[0_0_24px_rgba(var(--winblue-rgb),0.45)]`}
            >
              <span className="truncate">{nextLabel}</span>
              {isLast ? <Check size={20} className="shrink-0" /> : <ChevronRight size={22} className="shrink-0 rtl:rotate-180" />}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  // ===== Folhas (sheets) do celular/tablet: adicionar à coleção e marcações =====
  type MobileSheetState =
    | { kind: 'collection-picker'; itemType: 'book' | 'author'; itemId: string }
    | { kind: 'collection-add-items'; collectionId: string }
    | { kind: 'bookmarks'; bookId: string; chapterId: any }
    | { kind: 'share-lyrics'; bookId: string }
    | { kind: 'collection-form-items'; mode: 'authors' | 'books' };
  const [mobileSheet, setMobileSheet] = useState<MobileSheetState | null>(null);
  // Confirmação no celular (cartão na base da tela)
  const [mobileConfirm, setMobileConfirm] = useState<{
    title: string;
    description?: string;
    preview?: React.ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  // Ordem da lista fixada na abertura (itens já adicionados primeiro), para não pular ao tocar
  const sheetOrderRef = useRef<Map<string, number>>(new Map());
  // ===== Compartilhar (imagem no formato de story) =====
  const shareBlobRef = useRef<Blob | null>(null);
  const [lyricsSelection, setLyricsSelection] = useState<number[]>([]);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [sharePreview, setSharePreview] = useState<{ url: string; fileName: string; title: string } | null>(null);
  const closeSharePreview = () => setSharePreview(prev => { if (prev) URL.revokeObjectURL(prev.url); return null; });
  const [showShareBookMenu, setShowShareBookMenu] = useState(false);
  useEffect(() => {
    if (!showShareBookMenu) return;
    const close = () => setShowShareBookMenu(false);
    window.addEventListener('close-all-popups', close);
    return () => window.removeEventListener('close-all-popups', close);
  }, [showShareBookMenu]);
  const MAX_SHARE_LINES = 5;
  const transcriptLineText = (line: TranscriptLine) => (line.words && line.words.length > 0 ? line.words.map(w => w.text).join(' ') : line.text);
  const openShareImage = async (kind: 'book' | 'quote', book: Audiobook, lines: string[] = []) => {
    if (isGeneratingShare) return;
    closeAllPopups();
    setIsGeneratingShare(true);
    try {
      const { renderAudiobookStory, renderQuoteStory } = await import('./shareStory');
      const storyBook = {
        title: book.title,
        author: book.author,
        cover: book.cover || getGenericBookCover(book.title, book.author),
        fallbackCover: getGenericBookCover(book.title, book.author),
      };
      const isDark = resolvedTheme === 'dark';
      const blob = kind === 'book'
        ? await renderAudiobookStory(storyBook, isDark)
        : await renderQuoteStory(storyBook, lines, isDark);
      shareBlobRef.current = blob;
      const safeName = book.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'audiobook';
      // A imagem abre em tela cheia, com "Salvar" e "Compartilhar" embaixo
      setMobileSheet(null);
      setSharePreview(prev => {
        if (prev) URL.revokeObjectURL(prev.url);
        return {
          url: URL.createObjectURL(blob),
          fileName: `${safeName}${kind === 'quote' ? '-trecho' : ''}.png`,
          title: kind === 'book' ? `${book.title} — ${book.author}` : book.title,
        };
      });
    } catch (err) {
      console.warn('Não foi possível gerar a imagem para compartilhar:', err);
      showToast(t('share_failed'));
    } finally {
      setIsGeneratingShare(false);
    }
  };
  const openShareLyrics = (book: Audiobook, preselect: number[] = []) => {
    setLyricsSelection(preselect.slice(0, MAX_SHARE_LINES));
    openMobileSheet({ kind: 'share-lyrics', bookId: book.id });
  };

  const openMobileSheet = (sheet: MobileSheetState) => {
    closeAllPopups();
    const order = new Map<string, number>();
    if (sheet.kind === 'collection-picker') {
      collections.forEach(col => {
        const isIn = sheet.itemType === 'book' ? col.bookIds.includes(sheet.itemId) : (col.authorIds || []).includes(sheet.itemId);
        order.set(col.id, isIn ? 0 : 1);
      });
    }
    sheetOrderRef.current = order;
    setMobileSheet(sheet);
  };
  const renderMobileSheetContent = (): { title: string; subtitle?: string; body: React.ReactNode; footer?: React.ReactNode } | null => {
    if (!mobileSheet) return null;
    if (mobileSheet.kind === 'collection-picker') {
      const { itemType, itemId } = mobileSheet;
      const itemName = itemType === 'book' ? books.find(b => b.id === itemId)?.title : authors.find(a => a.id === itemId)?.name;
      return {
        title: t('add_to_collection'),
        subtitle: itemName,
        body: (
          <div className="flex flex-col gap-4 pt-1">
            <div className={SCREEN_GROUP_CLASS}>
              <ScreenSelectableRow
                selected={false}
                onClick={() => { setMobileSheet(null); handleStartCreateCollection({ type: itemType, id: itemId }); }}
                leading={<span className="w-10 h-10 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] flex items-center justify-center shrink-0"><FolderPlus size={17} /></span>}
                title={t('create_collection')}
                unselectedTrailing={<ChevronRight size={16} className="rtl:rotate-180" />}
              />
            </div>
            {collections.length > 0 ? (
              <div className={SCREEN_GROUP_CLASS}>
                {(() => {
                  const isInCol = (col: Collection) => itemType === 'book' ? col.bookIds.includes(itemId) : (col.authorIds || []).includes(itemId);
                  // Coleções em que o item já está aparecem primeiro (ordem fixa enquanto a folha está aberta)
                  const order = sheetOrderRef.current;
                  return [...collections].sort((a, b) => {
                    const ka = order.has(a.id) ? order.get(a.id)! : (isInCol(a) ? 0 : 1);
                    const kb = order.has(b.id) ? order.get(b.id)! : (isInCol(b) ? 0 : 1);
                    return ka - kb;
                  });
                })().map(col => {
                  const isIn = itemType === 'book' ? col.bookIds.includes(itemId) : (col.authorIds || []).includes(itemId);
                  return (
                    <ScreenSelectableRow
                      key={col.id}
                      selected={isIn}
                      onClick={() => handleToggleItemInCollection(col.id, itemType, itemId)}
                      leading={
                        <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${col.gradient} flex items-center justify-center text-base shrink-0 shadow-sm select-none`}>
                          {col.emoji}
                        </span>
                      }
                      title={col.name}
                      subtitle={col.description || undefined}
                      unselectedTrailing={<Plus size={16} />}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] text-center mt-4">{t('no_collections_yet')}</p>
            )}
          </div>
        ),
      };
    }
    if (mobileSheet.kind === 'collection-add-items') {
      const col = collections.find(c => c.id === mobileSheet.collectionId);
      if (!col) return null;
      return {
        title: t('add_to_collection'),
        subtitle: col.name,
        body: (
          <div className="pt-1">
            <CollectionItemsPickerContent
              asScreen
              mode="all"
              authors={authors}
              books={books}
              selectedAuthorIds={col.authorIds || []}
              selectedBookIds={col.bookIds}
              onToggleAuthor={(itemId) => handleToggleItemInCollection(col.id, 'author', itemId)}
              onToggleBook={(itemId) => handleToggleItemInCollection(col.id, 'book', itemId)}
            />
          </div>
        ),
      };
    }
    if (mobileSheet.kind === 'collection-form-items') {
      const mode = mobileSheet.mode;
      return {
        title: mode === 'authors' ? t('authors') : t('audiobooks_label'),
        body: (
          <div className="pt-1">
            <CollectionItemsPickerContent
              asScreen
              mode={mode}
              authors={authors}
              books={books}
              selectedAuthorIds={colSelectedAuthorIds}
              selectedBookIds={colSelectedBookIds}
              onToggleAuthor={(id) => setColSelectedAuthorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
              onToggleBook={(id) => {
                const adding = !colSelectedBookIds.includes(id);
                setColSelectedBookIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                if (adding) {
                  const authorId = findAuthorIdForBook(id);
                  if (authorId) setColSelectedAuthorIds(prev => prev.includes(authorId) ? prev : [...prev, authorId]);
                }
              }}
            />
          </div>
        ),
      };
    }
    if (mobileSheet.kind === 'share-lyrics') {
      const bk = books.find(b => b.id === mobileSheet.bookId);
      if (!bk) return null;
      const transcript = bk.transcript || [];
      const toggle = (idx: number) => {
        setLyricsSelection(prev => {
          if (prev.includes(idx)) return prev.filter(i => i !== idx);
          if (prev.length >= MAX_SHARE_LINES) {
            showToast(t('share_lines_limit', { count: MAX_SHARE_LINES }));
            return prev;
          }
          return [...prev, idx].sort((a, b) => a - b);
        });
      };
      return {
        title: t('share_excerpt'),
        body: (
          <div className="flex flex-col gap-3 pt-1">
            <p className="text-[13px] text-[var(--text-muted)] text-center px-2">{t('share_lines_hint', { count: MAX_SHARE_LINES })}</p>
            <div className={SCREEN_GROUP_CLASS}>
              {transcript.map((line, idx) => {
                const selected = lyricsSelection.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggle(idx)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 text-left rtl:text-right rounded-[24px] border transition-colors select-none ${selected ? 'bg-winblue/15 border-winblue/30' : 'border-transparent'}`}
                  >
                    <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${selected ? 'bg-winblue border-winblue text-white' : 'border-[var(--text-main)]/25 text-transparent'}`}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <span className={`flex-1 text-[15px] leading-snug ${selected ? 'text-[var(--text-main)] font-semibold' : 'text-[var(--text-main)]/85'}`}>{transcriptLineText(line)}</span>
                    <span className="text-[11px] text-[var(--text-muted)] shrink-0 mt-1">{formatTime(line.start)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ),
        footer: (
          <div className="flex items-center justify-center">
            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={lyricsSelection.length === 0 || isGeneratingShare}
              onClick={() => openShareImage('quote', bk, lyricsSelection.map(i => transcriptLineText(transcript[i])))}
              className="h-12 px-7 rounded-full bg-winblue/20 border border-winblue/45 text-winblue shadow-sm text-[15px] font-bold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isGeneratingShare ? <div className="w-4 h-4 rounded-full border-2 border-winblue border-t-transparent animate-spin" /> : <Share size={17} />}
              <span>{t('share_excerpt')}{lyricsSelection.length > 0 ? ` (${lyricsSelection.length})` : ''}</span>
            </motion.button>
          </div>
        ),
      };
    }
    const bk = books.find(b => b.id === mobileSheet.bookId);
    const ch = bk?.chapters?.find(c => c.id === mobileSheet.chapterId);
    if (!bk || !ch) return null;
    return {
      title: t('bookmarks') || t('comments'),
      subtitle: `${ch.title} • ${bk.title}`,
      body: <div className="pt-1">{renderCommentsContent(bk, ch, false, false, true)}</div>,
    };
  };

  // Opções de ordenação (pop-up global e painel do cabeçalho no celular)
  const renderSortOptions = (onPicked?: () => void) => (
            <div className="space-y-0.5">
              {[
                { id: 'name-asc', label: t('sort_name_asc'), icon: <ArrowDownAZ size={15} /> },
                { id: 'name-desc', label: t('sort_name_desc'), icon: <ArrowUpZA size={15} /> },
                { id: 'year-desc', label: t('sort_year_desc'), icon: <Calendar size={15} /> },
                { id: 'year-asc', label: t('sort_year_asc'), icon: <CalendarClock size={15} /> },
                { id: 'duration-desc', label: t('sort_duration_desc'), icon: <Clock size={15} /> },
                { id: 'duration-asc', label: t('sort_duration_asc'), icon: <Timer size={15} /> },
              ].map(opt => {
                const isSelected = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { handleSelectSort(opt.id as SortOption); onPicked?.(); }}
                    className={`relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 border border-transparent group ${
                      isSelected
                        ? 'hover:bg-winblue/25 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)]'
                        : 'hover:bg-white/15 hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="sort-active-pill"
                        className="absolute inset-0 bg-winblue/15 border border-winblue rounded-2xl shadow-[0_0_10px_rgba(var(--winblue-rgb),0.2)] pointer-events-none z-0"
                        transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
                      />
                    )}
                    <div className={`relative z-10 flex items-center gap-3 transition-colors ${isSelected ? 'text-winblue font-bold' : 'text-[var(--text-main)] group-hover:text-white'}`}>
                      <div className={isSelected ? 'text-winblue' : 'text-[var(--text-muted)] group-hover:text-white transition-colors'}>
                        {opt.icon}
                      </div>
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && (
                      <motion.div
                        layoutId="sort-active-check"
                        className="relative z-10 text-winblue shrink-0"
                        transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
                      >
                        <BsCheck2 size={16} />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
  );

  // Opções de uma coleção (toque longo no celular; três pontinhos ou clique direito no computador)
  const collectionMenu = (col: Collection) => [
    { id: 'add', icon: <Plus size={14} />, label: t('add_items_to_collection'), onSelect: () => openMobileSheet({ kind: 'collection-add-items', collectionId: col.id }) },
    { id: 'edit', icon: <Edit3 size={14} />, label: t('edit_collection'), onSelect: () => handleStartEditCurrentCollection(col) },
    {
      id: 'delete', icon: <Trash2 size={14} />, label: t('delete_collection'), danger: true,
      onSelect: () => setMobileConfirm({
        title: t('delete_collection'),
        description: col.name,
        confirmLabel: t('delete'),
        onConfirm: () => handleDeleteCollection(col.id),
      }),
    },
  ];

  const renderMobileHeaderActions = () => {
    const id = activeScreen.id;
    // Ordenação como painel do próprio pop-up do cabeçalho (nasce da pílula; vinda das opções, termina em "Mais opções")
    const sortAction: MobileHeaderAction = {
      id: 'sort', icon: <ArrowUpDown size={14} />, label: t('sort_by'),
      panelWidth: 228,
      panel: (
        <div className="flex flex-col p-1.5 pb-0 text-left rtl:text-right">
          <div className="px-3 pt-2 pb-1.5">
            <h3 className="text-sm font-bold text-[var(--text-main)]">{t('sort_by')}</h3>
          </div>
          {renderSortOptions(() => setTimeout(() => window.dispatchEvent(new Event('close-all-popups')), 250))}
          <div className="h-1.5" />
        </div>
      ),
    };

    if (id === 'book-detail') {
      const target = activeScreen.data || selectedBook;
      if (!target) return null;
      const isFav = favoriteBookIds.includes(target.id);
      return (
        <MobileHeaderActions
          quick={{ id: 'fav', icon: <Star size={15} className={isFav ? 'fill-yellow-400 text-yellow-400' : ''} />, label: isFav ? t('remove_from_favorites') : t('favorite'), onClick: () => toggleFavoriteBook(target.id) }}
          menu={[
            { id: 'queue-last', icon: <ListPlus size={14} />, label: t('end_of_queue'), onClick: () => handleAddToQueue(target, 'last') },
            { id: 'share', icon: <Share size={14} />, label: t('share_audiobook'), onClick: () => { openShareImage('book', books.find(b => b.id === target.id) || target); } },
            ...((books.find(b => b.id === target.id) || target).transcript?.length ? [{ id: 'share-lyrics', icon: <Quote size={14} />, label: t('share_excerpt'), onClick: () => openShareLyrics(books.find(b => b.id === target.id) || target) }] : []),
            { id: 'collection', icon: <FolderPlus size={14} />, label: t('add_to_collection'), onClick: () => openMobileSheet({ kind: 'collection-picker', itemType: 'book', itemId: target.id }) },
            { id: 'details', icon: <Info size={14} />, label: t('more_details'), onClick: () => { closeAllPopups(); navigateTo('book-info', target); } },
            { id: 'edit', icon: <Edit3 size={14} />, label: t('edit_audiobook'), onClick: () => handleStartEditBook() },
            {
              id: 'delete', icon: <Trash2 size={14} />, label: t('delete'), danger: true,
              confirm: {
                title: t('confirm_delete_single_book'),
                description: target.title,
                confirmLabel: t('delete'),
                onConfirm: () => {
                  cleanupDeletedBooks([target.id]);
                  setBooks(books.filter(b => b.id !== target.id));
                  closeAllPopups();
                  goBack();
                  showToast(t('toast_book_deleted', { title: target.title }));
                },
              },
            },
          ]}
        />
      );
    }

    if (id === 'author-detail' && activeScreen.data?.id) {
      const authorId = activeScreen.data.id;
      const isFav = favoriteAuthorIds.includes(authorId);
      return (
        <MobileHeaderActions
          quick={{ id: 'fav', icon: <Star size={15} className={isFav ? 'fill-yellow-400 text-yellow-400' : ''} />, label: isFav ? t('remove_favorite_author') : t('favorite_author'), onClick: () => toggleFavoriteAuthor(authorId) }}
          menu={[
            { id: 'collection', icon: <FolderPlus size={14} />, label: t('add_to_collection'), onClick: () => openMobileSheet({ kind: 'collection-picker', itemType: 'author', itemId: authorId }) },
            { id: 'edit', icon: <Edit3 size={14} />, label: t('edit_author'), onClick: () => handleStartEditAuthor() },
            { id: 'delete-multiple', icon: <Trash2 size={14} />, label: t('delete_multiple'), danger: true, onClick: () => setIsSelectionMode(true) },
          ]}
        />
      );
    }

    if (id.startsWith('library-colecao-')) {
      const colId = id.replace('library-colecao-', '');
      const col = collections.find(c => c.id === colId) || (activeScreen.data as Collection | undefined);
      if (!col) return null;
      return (
        <MobileHeaderActions
          quick={{
            id: 'add-items', icon: <Plus size={15} />, label: t('add_to_collection'),
            onClick: () => openMobileSheet({ kind: 'collection-add-items', collectionId: col.id }),
          }}
          menu={[
            { id: 'edit', icon: <Edit3 size={14} />, label: t('edit_collection'), onClick: () => handleStartEditCurrentCollection(col) },
            sortAction,
            {
              id: 'delete', icon: <Trash2 size={14} />, label: t('delete_collection'), danger: true,
              confirm: {
                title: t('delete_collection'),
                description: t('delete_collections_confirm_desc'),
                confirmLabel: t('delete'),
                onConfirm: () => { closeAllPopups(); handleDeleteCollection(col.id); },
              },
            },
          ]}
        />
      );
    }

    if (id === 'library-colecoes') {
      return (
        <MobileHeaderActions
          quick={{ id: 'new', icon: <Plus size={15} />, label: t('add_collection'), onClick: () => handleStartCreateCollection() }}
          menu={[
            sortAction,
            ...(collections.length > 0 ? [{ id: 'delete', icon: <Trash2 size={14} />, label: t('delete_collections'), danger: true, onClick: () => { setIsSelectionMode(true); setSelectedCollectionIds([]); } }] : []),
          ]}
        />
      );
    }

    // Modo de desenvolvedor no celular: o botão de sair fica só no cabeçalho de "Mais"
    if (id === 'more' && isDevModeActive) {
      return (
        <MobileHeaderActions
          quick={{ id: 'exit-dev', icon: <Code2 size={18} className="text-amber-400" />, label: t('exit_dev_mode'), onClick: () => handleExitDevMode() }}
        />
      );
    }

    if (id.startsWith('settings') && id !== 'settings-option' && id !== 'settings-action') {
      return (
        <MobileHeaderActions
          quick={{
            id: 'reset', icon: <RotateCcw size={18} />, label: t('settings_reset'),
            confirm: {
              title: t('settings_reset_confirm_title'),
              description: t('settings_reset_confirm_desc'),
              confirmLabel: t('settings_reset_btn'),
              icon: <RotateCcw size={13} />,
              onConfirm: () => { handleResetSettings(); closeAllPopups(); },
            },
          }}
        />
      );
    }

    if ((id.startsWith('library') || id.startsWith('home-') || id === 'history') && books.length > 0) {
      return (
        <MobileHeaderActions
          // Botão da esquerda da pílula: enviar audiobooks (também é a primeira opção do pop-up)
          quick={{ id: 'upload', icon: <Upload size={15} />, label: t('upload_audiobooks'), onClick: () => fileInputRef.current?.click() }}
          menu={[
            sortAction,
            { id: 'delete-multiple', icon: <Trash2 size={14} />, label: t('delete_multiple'), danger: true, onClick: () => setIsSelectionMode(true) },
          ]}
        />
      );
    }
    return null;
  };

  // Sub-páginas "Ver tudo" de uma coleção (definidas antes do título da tela, que é calculado na renderização)
  const COLLECTION_SUBSCREEN_RE = /^library-col-(audiobooks|autores)-/;
  const getCollectionSubScreen = (screenId: string, data?: any) => {
    const m = screenId.match(COLLECTION_SUBSCREEN_RE);
    if (!m) return null;
    const colId = screenId.replace(COLLECTION_SUBSCREEN_RE, '');
    const collection = collections.find(c => c.id === colId) || (data as Collection | undefined);
    return { kind: m[1] as 'audiobooks' | 'autores', colId, collection };
  };
  const getCollectionSubScreenTitle = (screenId: string, data?: any) => {
    const info = getCollectionSubScreen(screenId, data);
    if (!info) return null;
    const name = info.collection?.name || t('collection');
    return info.kind === 'audiobooks'
      ? t('collection_audiobooks_title', { name })
      : t('collection_authors_title', { name });
  };
  const currentScreenTitle = useMemo(() => {
    const id = activeScreen.id;
    if (id === 'home') return t('nav_home');
    if (id === 'home-continuar-ouvindo') return t('section_continue_listening');
    if (id === 'home-ouvidos-recentemente') return t('section_recently_listened');
    if (id === 'home-adicionados-recentemente') return t('section_recently_added');
    if (id === 'search') return t('nav_search');
    if (id === 'more') return t('nav_more');
    if (id === 'library') return t('nav_library');
    if (id === 'other-apps') return t('nav_other_apps');
    if (id === 'history') return t('history');

    if (id === 'library-genre') return activeScreen.data?.genre ? getGenreName(activeScreen.data.genre, resolvedLanguage) : t('genres');
    if (id === 'library-subgenre') return activeScreen.data?.subgenre ? getSubgenreName(activeScreen.data.subgenre, resolvedLanguage) : t('subgenre');
    if (id.startsWith('library-genre-')) {
      const genreId = id.replace('library-genre-', '');
      const genreData = Object.values(GENRE_HIERARCHY).find(g => g.id === genreId);
      return genreData ? getGenreName(genreData.id, resolvedLanguage) : t('genres');
    }
    if (id.startsWith('library-subgenre-')) {
      if (activeScreen.data?.subgenre) return getSubgenreName(activeScreen.data.subgenre, resolvedLanguage);
      if (typeof activeScreen.data === 'string') return getSubgenreName(activeScreen.data, resolvedLanguage);
      const after = id.replace('library-subgenre-', '');
      const matchedGenre = Object.values(GENRE_HIERARCHY)
        .sort((a, b) => b.id.length - a.id.length)
        .find(g => after.startsWith(g.id + '-'));
      const subName = matchedGenre ? after.substring(matchedGenre.id.length + 1) : after;
      return getSubgenreName(subName, resolvedLanguage) || t('subgenre');
    }
    if (id === 'create-collection') return t('create_collection');
    if (id === 'edit-collection') return t('edit_collection');
    if (id === 'library-idiomas') return t('languages');
    if (id === 'library-colecoes') return t('collections');
    const colSubTitle = getCollectionSubScreenTitle(id, activeScreen.data);
    if (colSubTitle) return colSubTitle;
    if (id.startsWith('library-colecao-')) {
      const colId = id.replace('library-colecao-', '');
      const c = collections.find(item => item.id === colId) || (activeScreen.data as Collection);
      return c?.name || t('collection');
    }
    if (id.startsWith('library-idioma-')) {
      const l = typeof activeScreen.data === 'string' ? activeScreen.data : (activeScreen.data?.name || id.replace('library-idioma-', ''));
      if (normalizeAudiobookLanguage(l) === 'Outro') {
        return getLanguageCardName(l, resolvedLanguage);
      }
      return t('books_in_language', { lang: getLanguageDisplayName(l, resolvedLanguage) });
    }
    if (id.startsWith('library-')) {
      const sub = id.replace('library-', '');
      const subNames: Record<string, string> = {
        'favoritos': t('favorite_audiobooks'),
        'audiobooks-favoritos': t('favorite_audiobooks'),
        'autores-favoritos': t('favorite_authors'),
        'títulos': t('all_audiobooks'),
        'autores': t('authors'),
        'gêneros': t('genres'),
        'idiomas': t('languages'),
        'colecoes': t('collections'),
        'ouvidos-recentemente': t('recently_listened'),
      };
      if (subNames[sub]) return subNames[sub];
      const cat = books.find(b => b.category.toLowerCase() === sub.toLowerCase())?.category;
      if (cat) return cat;
      return sub.charAt(0).toUpperCase() + sub.slice(1);
    }
    if (id === 'book-detail') {
      const targetBook = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
      return targetBook?.title || t('audiobook_label');
    }
    if (id === 'book-synopsis') {
      const targetBook = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
      return targetBook?.title || t('synopsis');
    }
    if (id === 'author-detail') {
      const authorData: Author | undefined = authors.find(a => a.id === activeScreen.data?.id || (a.name && activeScreen.data?.name && a.name.toLowerCase() === activeScreen.data.name.toLowerCase())) || activeScreen.data;
      return authorData?.name || t('authors');
    }
    if (id === 'settings') return t('nav_settings');
    if (id === 'settings-interface') return t('settings_interface');
    if (id === 'settings-biblioteca') return t('settings_library');
    if (id === 'settings-reproducao') return t('settings_playback');
    if (id === 'settings-notificacoes') return t('settings_notifications');
    if (id === 'settings-atalhos' || id === 'help-atalhos') return t('settings_shortcuts');
    if (id === 'settings-sistema') return t('settings_sistema');
    if (id === 'settings-option') return activeScreen.data?.title || t('settings_title');
    if (id === 'settings-action') return activeScreen.data?.title || t('settings_title');
    if (id.startsWith('settings')) return t('settings_title');
    if (id === 'book-info') return t('more_details');
    if (id === 'app-info') return activeScreen.data?.title || t('details');
    if (id === 'help') return t('nav_help');
    if (id === 'help-theme') {
      const currentThemeId = (typeof activeScreen.data === 'object' && activeScreen.data?.id) 
        ? activeScreen.data.id 
        : (typeof activeScreen.data === 'string' ? activeScreen.data : helpThemes[0]?.id);
      const currentTheme = helpThemes.find(t => t.id === currentThemeId) || helpThemes[0];
      return currentTheme?.title || activeScreen.data?.title || t('nav_help');
    }
    if (id === 'help-article') {
      const dataObj = (typeof activeScreen.data === 'object' ? activeScreen.data : {}) as any;
      const themeId = dataObj?.theme?.id || dataObj?.themeId;
      const subthemeId = dataObj?.subtheme?.id || dataObj?.subthemeId || (typeof activeScreen.data === 'string' ? activeScreen.data : undefined);
      const currentTheme = helpThemes.find(t => t.id === themeId) || helpThemes.find(t => t.subthemes.some(s => s.id === subthemeId)) || helpThemes[0];
      const currentSub = currentTheme?.subthemes.find(s => s.id === subthemeId) || currentTheme?.subthemes[0] || helpThemes[0]?.subthemes[0];
      return currentSub?.article?.title || currentSub?.title || currentTheme?.title || t('nav_help');
    }
    if (id.startsWith('help')) return t('nav_help');
    return '';
  }, [activeScreen, selectedBook, books, authors, helpThemes, resolvedLanguage, t]);

  // Apple-style Header Blur & Inline Title: detecta quando o conteúdo rola e quando o título principal sai da tela
  // O blur do cabeçalho é controlado direto no elemento (sem re-renderizar o app), crescendo com a rolagem
  const headerBlurRef = useRef<HTMLDivElement>(null);
  const setHeaderBlurProgress = (scrollTop: number) => {
    const el = headerBlurRef.current;
    // A opacidade vai em cada camada (e não no contêiner): um "pai" com opacidade abaixo de 1 vira a
    // "raiz" do desfoque e as camadas deixam de desfocar o conteúdo atrás (Chrome/Safari)
    if (el) el.style.setProperty('--header-blur', String(Math.max(0, Math.min(1, scrollTop / 28))));
  };
  const [isTitleScrolledPast, setIsTitleScrolledPast] = useState(false);
  // Botão de voltar recolhido (só a seta) quando o título da tela sai de vista no celular
  const backCollapsed = isMobile && isTitleScrolledPast && !isLandscapePhone;

  useEffect(() => {
    setHeaderBlurProgress(0);
    setIsTitleScrolledPast(false);
    // A barra de abas mantém o estado ao trocar de tela (não se rearranja junto com a transição)
    lastScrollTopRef.current = mainScrollRef.current?.scrollTop || 0;
    const container = mainScrollRef.current;
    if (!container) return;

    let rafId: number;

    const handleScroll = () => {
      const st = container.scrollTop;
      // Mobile: rolar para baixo recolhe a barra de abas; rolar para cima (ou voltar ao topo) expande
      const lastSt = lastScrollTopRef.current;
      lastScrollTopRef.current = st;
      // Só a rolagem do usuário mexe na barra (não as do app durante a troca de telas, nem saltos)
      const frozen = Date.now() < navBarFreezeUntil || Math.abs(st - lastSt) > 240;
      if (!frozen) {
        if (st < 24) tabBarStore.set(false);
        else if (st > lastSt + 6) tabBarStore.set(true);
        else if (st < lastSt - 10) tabBarStore.set(false);
      }
      // O desfoque surge desde o primeiro pixel e atinge a intensidade total aos 28px, como no iOS
      setHeaderBlurProgress(st);
      if (st <= 6) {
        setIsTitleScrolledPast(false);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const headerBottomY = containerRect.top + 68;

      // Considera só títulos visíveis (no mobile, a versão de computador da página fica oculta)
      // (ignora a tela que está saindo: na troca ela fica por cima, posicionada como "absolute")
      const isLeaving = (el: HTMLElement) => {
        const screen = Array.from(container.children).find(c => c.contains(el)) as HTMLElement | undefined;
        return Boolean(screen && getComputedStyle(screen).position === 'absolute');
      };
      const titleEl = Array.from(container.querySelectorAll<HTMLElement>('h1, h2.text-4xl, h2.text-5xl, [data-screen-title="true"]'))
        .find(el => el.getClientRects().length > 0 && !isLeaving(el)) || null;
      if (titleEl) {
        const titleRect = titleEl.getBoundingClientRect();
        // O título no cabeçalho ressurge quando o título grande da página desaparece
        const hasTitleDisappeared = titleRect.bottom <= headerBottomY;
        setIsTitleScrolledPast(hasTitleDisappeared);
      } else {
        setIsTitleScrolledPast(st > 65);
      }
    };

    // Garante o desfoque mesmo quando a rolagem acontece em outro contêiner vertical dentro da tela
    const handleAnyScroll = (e: Event) => {
      const target = e.target;
      if (target === container) return;
      if (!(target instanceof HTMLElement) || !container.contains(target)) return;
      if (target.scrollHeight <= target.clientHeight + 1) return;
      setHeaderBlurProgress(Math.max(container.scrollTop, target.scrollTop));
    };
    // Depois de trocas de tela (restauração da posição de rolagem), confere de novo
    const recheckTimer = window.setTimeout(handleScroll, 450);
    const recheckTimer2 = window.setTimeout(handleScroll, 900);

    rafId = requestAnimationFrame(handleScroll);
    container.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleAnyScroll, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(recheckTimer);
      window.clearTimeout(recheckTimer2);
      container.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleAnyScroll, { capture: true } as any);
    };
  }, [activeScreen.id, activeScreen.data]);

  useEffect(() => {
    document.documentElement.style.fontSize = '16px';
    document.documentElement.setAttribute('data-font-size', fontSize);
    try { localStorage.setItem('app_font_size', fontSize); } catch {}
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', 'compact');
    try { localStorage.setItem('app_ui_density', 'compact'); } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('app_language', appLanguage); } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = resolvedLanguage;
      document.documentElement.setAttribute('dir', resolvedLanguage === 'ar' ? 'rtl' : 'ltr');
    }
  }, [appLanguage, resolvedLanguage]);

  useEffect(() => {
    try { localStorage.setItem('app_library_folder', libraryFolder); } catch {}
  }, [libraryFolder]);

  useEffect(() => {
    try { localStorage.setItem('app_detect_files', String(detectNewFiles)); } catch {}
  }, [detectNewFiles]);

  useEffect(() => {
    try { localStorage.setItem('app_check_startup', String(checkOnStartup)); } catch {}
  }, [checkOnStartup]);

  useEffect(() => {
    try { localStorage.setItem('app_default_speed', String(defaultPlaybackSpeed)); } catch {}
  }, [defaultPlaybackSpeed]);

  useEffect(() => {
    try { localStorage.setItem('app_seek_forward', String(seekForwardTime)); } catch {}
  }, [seekForwardTime]);

  useEffect(() => {
    try { localStorage.setItem('app_seek_backward', String(seekBackwardTime)); } catch {}
  }, [seekBackwardTime]);

  useEffect(() => {
    try { 
      localStorage.setItem('app_resume_playback', String(resumePlayback)); 
      if (!resumePlayback) {
        localStorage.removeItem('app_playback_queue');
        localStorage.removeItem('app_last_played_time');
      }
    } catch {}
  }, [resumePlayback]);

  useEffect(() => {
    try { localStorage.setItem('app_auto_show_text', String(autoShowText)); } catch {}
  }, [autoShowText]);

  useEffect(() => {
    try { localStorage.setItem('app_notifications_enabled', String(notificationsEnabled)); } catch {}
  }, [notificationsEnabled]);

  useEffect(() => {
    try { localStorage.setItem('app_notify_chapter', String(notifyChapterCompleted)); } catch {}
  }, [notifyChapterCompleted]);

  useEffect(() => {
    try { localStorage.setItem('app_notify_book', String(notifyBookCompleted)); } catch {}
  }, [notifyBookCompleted]);

  useEffect(() => {
    try { localStorage.setItem('app_notify_added', String(notifyBookAdded)); } catch {}
  }, [notifyBookAdded]);

  useEffect(() => {
    try { localStorage.setItem('app_data_folder', dataFolder); } catch {}
  }, [dataFolder]);

  const handleResetSettings = () => {
    setThemeMode('dark');
    setAccentColor('blue');
    setUiDensity('compact');
    setFontSize('standard');
    setAppLanguage('system');
    setLibraryFolder('C:\\Audiobooks');
    setDataFolder('%APPDATA%\\AudiobookPlayer');
    setDetectNewFiles('folder-select');
    setCheckOnStartup(true);
    setDefaultPlaybackSpeed(1.0);
    setPlaybackSpeed(1.0);
    setSeekForwardTime(30);
    setSeekBackwardTime(30);
    setResumePlayback(true);
    setAutoShowText(true);
    setNotificationsEnabled(true);
    setNotifyChapterCompleted(true);
    setNotifyBookCompleted(true);
    setNotifyBookAdded(true);

    const keysToRemove = [
      'app_theme_mode', 'app_accent_color', 'app_ui_density', 'app_font_size', 'app_language',
      'app_library_folder', 'app_data_folder', 'app_detect_files', 'app_check_startup',
      'app_default_speed', 'app_seek_forward', 'app_seek_backward',
      'app_resume_playback', 'app_auto_show_text', 'app_notifications_enabled',
      'app_notify_chapter', 'app_notify_book', 'app_notify_added',
      'app_playback_queue', 'app_last_played_time'
    ];
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });

    setShowResetSettingsConfirm(false);
    showToast(t('settings_reset_success'));
  };

  // Fonte do áudio atual (prioriza o object URL ativo do IndexedDB e descarta blobs obsoletos de sessões anteriores)
  const currentAudioSrc = useMemo(() => {
    if (!currentBook || currentBook.id === EMPTY_BOOK.id) return null;
    const activeBlobUrl = audioUrlsRef.current.get(currentBook.id);
    if (activeBlobUrl) return activeBlobUrl;

    if (currentChapter?.audioUrl && !currentChapter.audioUrl.startsWith('blob:')) {
      return currentChapter.audioUrl;
    }
    if (currentBook.audioUrl && !currentBook.audioUrl.startsWith('blob:')) {
      return currentBook.audioUrl;
    }
    return null;
  }, [currentBook, currentChapter, audioRevision]);

  // Otimização de I/O de posição de reprodução (elimina gravação síncrona a cada 250ms)
  const lastSavedPlaybackTimeRef = useRef<number>(0);
  const lastSavedBookIdRef = useRef<string | null>(null);

  const savePlaybackPosition = useCallback((time: number, bookId: string, force = false) => {
    if (!resumePlayback || !bookId || bookId === EMPTY_BOOK.id) return;
    const nowSec = Math.floor(time);
    if (force || Math.abs(nowSec - lastSavedPlaybackTimeRef.current) >= 3 || lastSavedBookIdRef.current !== bookId) {
      lastSavedPlaybackTimeRef.current = nowSec;
      lastSavedBookIdRef.current = bookId;
      try {
        localStorage.setItem('app_last_played_time', String(time));
        localStorage.setItem('app_last_played_book_id', bookId);
        const savedPositions = JSON.parse(localStorage.getItem('audiobook_playback_positions') || '{}');
        savedPositions[bookId] = time;
        localStorage.setItem('audiobook_playback_positions', JSON.stringify(savedPositions));
        // Onde parou em cada capítulo (para voltar ao capítulo de onde parou, mesmo depois de ouvir outros
        // livros). Capítulo ouvido até o fim (ou quase) volta a começar do início.
        const book = booksRef.current.find(b => b.id === bookId);
        const chapters = book?.chapters || [];
        const idx = chapters.findIndex((chap, i) => {
          const next = chapters[i + 1];
          return time >= chap.startTime && (!next || time < next.startTime);
        });
        if (idx >= 0) {
          const chap = chapters[idx];
          const elapsed = Math.max(0, time - (chap.startTime || 0));
          const all = JSON.parse(localStorage.getItem('audiobook_chapter_positions') || '{}');
          const forBook = (all[bookId] && typeof all[bookId] === 'object') ? all[bookId] : {};
          if (elapsed < 2 || (chap.duration > 0 && elapsed >= chap.duration - 3)) delete forBook[String(chap.id)];
          else forBook[String(chap.id)] = Math.round(elapsed * 10) / 10;
          all[bookId] = forBook;
          localStorage.setItem('audiobook_chapter_positions', JSON.stringify(all));
        }
      } catch {}
    }
  }, [resumePlayback]);

  // Onde o usuário parou num capítulo (segundos dentro do capítulo), se houver
  const getChapterResumeElapsed = (bookId: string, chapter: Chapter | undefined): number | null => {
    if (!resumePlayback || !chapter) return null;
    try {
      const all = JSON.parse(localStorage.getItem('audiobook_chapter_positions') || '{}');
      const v = Number(all?.[bookId]?.[String(chapter.id)]);
      if (!isFinite(v) || v < 2) return null;
      if (chapter.duration > 0 && v >= chapter.duration - 3) return null;
      return v;
    } catch {
      return null;
    }
  };

  // Atualização otimizada de posição na Media Session API
  const lastMediaSessionPositionUpdateRef = useRef<number>(0);
  const updateMediaSessionPosition = useCallback((time: number, duration: number, rate: number, force = false) => {
    if (!('mediaSession' in navigator) || typeof (navigator.mediaSession as any).setPositionState !== 'function') return;
    const now = Date.now();
    if (force || now - lastMediaSessionPositionUpdateRef.current >= 2000) {
      lastMediaSessionPositionUpdateRef.current = now;
      if (duration > 0 && !isNaN(time) && time >= 0 && isFinite(duration)) {
        try {
          (navigator.mediaSession as any).setPositionState({
            duration: Math.max(0.1, duration),
            playbackRate: rate > 0 ? rate : 1,
            position: Math.min(Math.max(0, time), duration)
          });
        } catch {}
      }
    }
  }, []);

  // Livro que está tocando ou acabou de ser escolhido (atualizado na hora da troca, antes do novo estado)
  const latestBookIdRef = useRef<string | undefined>(currentBook?.id);
  latestBookIdRef.current = currentBook?.id;
  // Antes de trocar de livro: guarda onde o anterior parou e passa a gravar no novo
  const beginBookSwitch = (next: Audiobook | undefined | null) => {
    if (!next) return;
    if (currentBook?.id && currentBook.id !== EMPTY_BOOK.id && currentBook.id !== next.id) {
      savePlaybackPosition(audioRef.current?.currentTime ?? currentTime, currentBook.id, true);
    }
    latestBookIdRef.current = next.id;
  };

  // Função centralizada para busca e sincronização do tempo de áudio
  const handleSeek = useCallback((newTime: number) => {
    const clamped = Math.max(0, Math.min(totalDuration || 999999, newTime));
    setCurrentTime(clamped);
    lastTrackedAudioTimeRef.current = clamped;

    // Grava no livro que está entrando agora (logo depois de uma troca, o estado ainda é o do anterior)
    const seekBookId = latestBookIdRef.current;
    if (seekBookId && seekBookId !== EMPTY_BOOK.id) {
      savePlaybackPosition(clamped, seekBookId, true);
    }

    const audio = audioRef.current;
    if (audio && currentAudioSrc) {
      try {
        if (audio.readyState >= 1) {
          audio.currentTime = clamped;
        } else {
          pendingSeekRef.current = clamped;
        }
      } catch (e) {
        console.warn('Erro ao definir tempo no áudio:', e);
      }
    }

    updateMediaSessionPosition(clamped, totalDuration, playbackSpeed, true);
  }, [totalDuration, currentAudioSrc, currentBook?.id, savePlaybackPosition, updateMediaSessionPosition, playbackSpeed]);

  // Retorna para o ponto onde o usuário estava antes do salto
  const handleReturnToPreviousPoint = useCallback(() => {
    if (!playbackReturnPoint) return;
    const pt = playbackReturnPoint;
    setPlaybackReturnPoint(null);

    const isDifferentBook = currentBook?.id !== pt.bookId;
    let targetBook = currentBook;

    if (isDifferentBook) {
      const found = books.find(b => b.id === pt.bookId);
      if (found) {
        targetBook = found;
        recordPlaySession(found);
        beginBookSwitch(found);
        setCurrentBook(found);
        setSelectedBook(found);
      }
    }

    handleSeek(pt.globalTime);
    setIsPlaying(true);

    if (isDifferentBook && targetBook) {
      showToast(t('toast_returned_to_book', { title: targetBook.title }) || `Retornado para "${targetBook.title}"!`);
    } else if (currentChapter?.id !== pt.chapterId) {
      showToast(t('toast_returned_to_chapter', { num: pt.chapterIndex + 1 }) || `Retornado para o Capítulo ${pt.chapterIndex + 1}!`);
    } else {
      showToast(t('return_to_previous_position') || 'Retornado para onde parou!');
    }
  }, [playbackReturnPoint, currentBook, currentChapter, books, handleSeek, t]);

  // Salta para a minutagem de um comentário e armazena a posição anterior para retorno
  const handleJumpToComment = useCallback((targetBook: Audiobook, targetChapter: Chapter, timestamp: number) => {
    const prevElapsed = currentChapter 
      ? Math.max(0, currentTime - currentChapter.startTime) 
      : 0;

    const targetGlobalTime = targetChapter.startTime + timestamp;

    setPlaybackReturnPoint({
      bookId: currentBook?.id || targetBook.id,
      chapterId: currentChapter?.id || targetChapter.id,
      chapterIndex: currentChapterIndex,
      chapterElapsed: prevElapsed,
      globalTime: currentTime,
      transportedToTime: targetGlobalTime,
      transportedToChapterId: targetChapter.id,
      createdAt: Date.now(),
    });

    if (!currentBook || currentBook.id !== targetBook.id) {
      beginBookSwitch(targetBook);
      setCurrentBook(targetBook);
      setSelectedBook(targetBook);
    }

    handleSeek(targetGlobalTime);
    setIsPlaying(true);
    closeAllPopups();
    showToast(`${t('now_playing') || 'Reproduzindo em'} ${formatTime(timestamp)}`);
  }, [currentBook, currentChapter, currentChapterIndex, currentTime, handleSeek, closeAllPopups, t]);

  // Ponto de início de arraste do slider para detectar saltos bruscos acidentais
  const sliderDragStartPointRef = useRef<{
    currentTime: number;
    chapterElapsed: number;
    chapterId: number;
    bookId: string;
  } | null>(null);

  // Mexer na barra de progressão: descarta o botão atual e, se o salto for de 5s ou mais, cria um novo
  const handleSliderPointerDown = useCallback(() => {
    if (!currentBook || !currentChapter) return;
    sliderDragStartPointRef.current = {
      currentTime,
      chapterElapsed: Math.max(0, currentTime - currentChapter.startTime),
      chapterId: currentChapter.id,
      bookId: currentBook.id,
    };
  }, [currentTime, currentBook, currentChapter]);

  const handleSliderPointerUp = useCallback((finalElapsed: number) => {
    const startPt = sliderDragStartPointRef.current;
    sliderDragStartPointRef.current = null;
    if (!startPt || !currentBook || !currentChapter) return;
    if (startPt.bookId !== currentBook.id) return;

    const newGlobalTime = currentChapter.startTime + finalElapsed;
    const timeDifference = Math.abs(newGlobalTime - startPt.currentTime);

    if (timeDifference >= 5) {
      setPlaybackReturnPointRaw({
        bookId: startPt.bookId,
        chapterId: startPt.chapterId,
        chapterIndex: currentChapterIndex,
        chapterElapsed: startPt.chapterElapsed,
        globalTime: startPt.currentTime,
        transportedToTime: newGlobalTime,
        transportedToChapterId: currentChapter.id,
        createdAt: Date.now(),
      });
    }
  }, [currentBook, currentChapter, currentChapterIndex]);

  // Renderiza o botão branco direto na barra de progressão para retorno à posição anterior
  const renderPlaybackReturnButton = (_isFullScreenMode: boolean) => {
    const isExpired = playbackReturnPoint ? (Date.now() - (playbackReturnPoint.createdAt || 0) >= 30000) : true;
    const isVisible = Boolean(
      playbackReturnPoint &&
      !isExpired &&
      currentBook &&
      currentChapter
    );

    if (!isVisible || !playbackReturnPoint || !currentBook || !currentChapter) {
      return null;
    }

    const isSameBook = playbackReturnPoint.bookId === currentBook.id;
    const isSameChapter = isSameBook && playbackReturnPoint.chapterId === currentChapter.id;

    let returnLabel = '';
    let returnTooltip = '';
    let isReturnAnterior = true;
    let buttonStyle: Record<string, string | number> = {};

    if (!isSameBook) {
      // Caso 1: Voltar para um capítulo de OUTRO audiobook -> indicar o NOME DO AUDIOBOOK
      const targetBook = books.find(b => b.id === playbackReturnPoint.bookId);
      const bookTitle = targetBook?.title || t('audiobook_label');
      returnLabel = bookTitle;
      returnTooltip = t('return_to_book', { title: bookTitle }) || `Voltar para "${bookTitle}"`;
      isReturnAnterior = true;
      buttonStyle = {
        left: '0%',
        x: '0%',
      };
    } else if (!isSameChapter) {
      // Caso 2: Voltar para outro capítulo do MESMO audiobook -> indicar o NÚMERO DO CAPÍTULO e NÃO o tempo
      const targetChapIdx = (currentBook.chapters || []).findIndex(c => c.id === playbackReturnPoint.chapterId);
      const chapNum = targetChapIdx >= 0 ? targetChapIdx + 1 : (playbackReturnPoint.chapterIndex + 1);
      returnLabel = t('chapter_short', { num: chapNum }) || `Cap. ${chapNum}`;
      returnTooltip = t('return_to_chapter', { num: chapNum }) || `Voltar para o Capítulo ${chapNum}`;

      const currentIdx = currentChapterIndex >= 0 ? currentChapterIndex : 0;
      const targetIdx = targetChapIdx >= 0 ? targetChapIdx : playbackReturnPoint.chapterIndex;
      if (targetIdx < currentIdx || playbackReturnPoint.globalTime < currentChapter.startTime) {
        isReturnAnterior = true;
        buttonStyle = {
          left: '0%',
          x: '0%',
        };
      } else {
        isReturnAnterior = false;
        buttonStyle = {
          right: '0%',
          left: 'auto',
          x: '0%',
        };
      }
    } else {
      // Caso 3: Mesmo capítulo -> indicar o tempo
      const duration = currentChapter.duration || 1;
      const returnPercent = Math.max(0, Math.min(100, (playbackReturnPoint.chapterElapsed / duration) * 100));
      const clampedPercent = Math.max(5, Math.min(95, returnPercent));
      isReturnAnterior = playbackReturnPoint.globalTime < playbackReturnPoint.transportedToTime;
      returnLabel = formatTime(playbackReturnPoint.chapterElapsed);
      returnTooltip = t('return_to_previous_time', { time: returnLabel }) || `Voltar para ${returnLabel}`;
      buttonStyle = {
        left: `${clampedPercent}%`,
        x: '-50%',
      };
    }

    return (
      <AnimatePresence>
        <motion.button
          type="button"
          key="playback-return-btn"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.12 } }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.5 }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleReturnToPreviousPoint();
          }}
          style={{ ...buttonStyle, y: '-50%' }}
          data-playback-return="true"
          className="absolute top-1/2 z-20 flex items-center cursor-pointer pointer-events-auto select-none"
          title={returnTooltip}
        >
          <div className="bg-white text-slate-900 h-4 px-1.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.35),0_0_6px_rgba(255,255,255,0.7)] border border-black/10 dark:border-white/30 flex items-center gap-0.5 font-bold font-mono text-[8px] leading-none whitespace-nowrap hover:bg-slate-50 transition-colors max-w-[112px] sm:max-w-[160px]">
            {isReturnAnterior ? (
              <>
                <ChevronLeft size={10} className="stroke-[2.5] text-slate-900 shrink-0 rtl:rotate-180 -ml-0.5" />
                <span className="truncate">{returnLabel}</span>
              </>
            ) : (
              <>
                <span className="truncate">{returnLabel}</span>
                <ChevronRight size={10} className="stroke-[2.5] text-slate-900 shrink-0 rtl:rotate-180 -mr-0.5" />
              </>
            )}
          </div>
        </motion.button>
      </AnimatePresence>
    );
  };

  const handlePrevChapter = useCallback(() => {
    if (!currentBook || !currentChapter) return;
    if (currentChapterIndex > 0) {
      const prevChap = currentBook.chapters[currentChapterIndex - 1];
      const prevElapsed = Math.max(0, currentTime - currentChapter.startTime);
      setPlaybackReturnPoint({
        bookId: currentBook.id,
        chapterId: currentChapter.id,
        chapterIndex: currentChapterIndex,
        chapterElapsed: prevElapsed,
        globalTime: currentTime,
        transportedToTime: prevChap.startTime,
        transportedToChapterId: prevChap.id,
        createdAt: Date.now(),
      });
      handleSeek(prevChap.startTime);
    } else {
      handleSeek(currentChapter.startTime);
    }
  }, [currentBook, currentChapter, currentChapterIndex, currentTime, handleSeek]);

  const handleNextChapter = useCallback(() => {
    if (!currentBook || !currentChapter) return;
    if (playbackQueue.length > 0) {
      const nextItem = playbackQueue[0];
      const prevElapsed = Math.max(0, currentTime - currentChapter.startTime);
      setPlaybackReturnPoint({
        bookId: currentBook.id,
        chapterId: currentChapter.id,
        chapterIndex: currentChapterIndex,
        chapterElapsed: prevElapsed,
        globalTime: currentTime,
        transportedToTime: nextItem.startTime,
        transportedToChapterId: nextItem.chapterId,
        createdAt: Date.now(),
      });
      setPlaybackQueue(prev => prev.slice(1));
      beginBookSwitch(nextItem.book);
      setCurrentBook(nextItem.book);
      setSelectedBook(nextItem.book);
      handleSeek(nextItem.startTime);
      setIsPlaying(true);
    } else if (currentChapterIndex < currentBook.chapters.length - 1) {
      const nextChap = currentBook.chapters[currentChapterIndex + 1];
      const prevElapsed = Math.max(0, currentTime - currentChapter.startTime);
      setPlaybackReturnPoint({
        bookId: currentBook.id,
        chapterId: currentChapter.id,
        chapterIndex: currentChapterIndex,
        chapterElapsed: prevElapsed,
        globalTime: currentTime,
        transportedToTime: nextChap.startTime,
        transportedToChapterId: nextChap.id,
        createdAt: Date.now(),
      });
      handleSeek(nextChap.startTime);
    }
  }, [currentBook, currentChapter, currentChapterIndex, currentTime, playbackQueue, handleSeek]);

  // Abre a pasta no Explorador de Arquivos do Windows destacando o arquivo de áudio (sem reproduzir o conteúdo)
  const handleOpenBookInFolder = async (book: Audiobook) => {
    let bookStoragePath: string = book.filePath || (book.fileName ? `${libraryFolder}\\${book.fileName}` : `${libraryFolder}\\${book.title}.m4b`);
    // Garante que referências com D: sejam ajustadas para a pasta da biblioteca atual
    if (bookStoragePath.startsWith('D:\\') || bookStoragePath.startsWith('D:/')) {
      const parts = bookStoragePath.split(/[\\/]/);
      bookStoragePath = `${libraryFolder}\\${parts[parts.length - 1]}`;
    }

    // Se o áudio estiver salvo no IndexedDB, garante que o arquivo físico está salvo no disco antes de abrir
    try {
      const blob = await getAudioBlob(book.id);
      if (blob) {
        const fileName = book.fileName || `${book.title}.mp3`;
        if (!desktop?.saveAudiobook) throw new Error('not-installed');
        const saved = await desktop.saveAudiobook(fileName, libraryFolder, await blob.arrayBuffer());
        if (saved) {
          bookStoragePath = saved;
          if (book.filePath !== bookStoragePath) {
            setBooks(prev => prev.map(b => b.id === book.id ? { ...b, filePath: bookStoragePath } : b));
          }
        }
      }
    } catch {}

    // Abre a pasta no gerenciador de arquivos do sistema (só no app instalado)
    if ((window as any).electron?.openPath) {
      try { (window as any).electron.openPath(bookStoragePath); } catch {}
    }

    showToast(t('toast_opening_folder', { path: bookStoragePath }));
  };

  const handleOpenDataFolder = () => {
    if ((window as any).electron?.openPath) {
      try {
        (window as any).electron.openPath(dataFolder);
      } catch {}
    }
    showToast(t('toast_opening_folder', { path: dataFolder }) || `Abrindo pasta: ${dataFolder}`);
  };

  // Atalhos de teclado globais desacoplados (não re-anexa no window a cada frame/timeupdate)
  const keyboardContextRef = useRef({
    seekBackwardTime,
    seekForwardTime,
    totalDuration,
    currentTime,
    currentChapter,
    currentBook,
    currentChapterIndex,
    playbackQueue,
    handleSeek,
    handlePrevChapter,
    handleNextChapter,
    setIsPlaying,
    setVolume,
    setIsFullScreen,
    setPlaybackQueue,
    setCurrentBook,
    setSelectedBook
  });

  useEffect(() => {
    keyboardContextRef.current = {
      seekBackwardTime,
      seekForwardTime,
      totalDuration,
      currentTime,
      currentChapter,
      currentBook,
      currentChapterIndex,
      playbackQueue,
      handleSeek,
      handlePrevChapter,
      handleNextChapter,
      setIsPlaying,
      setVolume,
      setIsFullScreen,
      setPlaybackQueue,
      setCurrentBook,
      setSelectedBook
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      const ctx = keyboardContextRef.current;
      if (e.code === 'Space') {
        e.preventDefault();
        ctx.setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault();
        ctx.handlePrevChapter();
      } else if (e.code === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault();
        ctx.handleNextChapter();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        ctx.handleSeek(Math.max(0, ctx.currentTime - ctx.seekBackwardTime));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        ctx.handleSeek(Math.min(ctx.totalDuration, ctx.currentTime + ctx.seekForwardTime));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        ctx.setVolume(prev => Math.min(1, prev + 0.05));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        ctx.setVolume(prev => Math.max(0, prev - 0.05));
      } else if (e.code === 'F11') {
        e.preventDefault();
        ctx.setIsFullScreen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Esc: fecha qualquer pop-up aberto; sem pop-ups, minimiza o player em tela cheia.
  // Campos que tratam o próprio Esc (ex.: buscas) chamam preventDefault e têm prioridade.
  const escapeContextRef = useRef({ closeAllPopups: () => {}, isFullScreen: false, setIsFullScreen: (_v: boolean) => {} });
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const ctx = escapeContextRef.current;
      const hasOpenPopup = Boolean(document.querySelector('[data-popup-content="true"]'));
      if (hasOpenPopup) {
        e.preventDefault();
        ctx.closeAllPopups();
        return;
      }
      if (ctx.isFullScreen) {
        e.preventDefault();
        ctx.setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);
  escapeContextRef.current = { closeAllPopups, isFullScreen, setIsFullScreen };

  // =========================================================================
  // INTEGRAÇÃO COM A MEDIA SESSION API (Teclas Multimídia, Lockscreen, Fones Bluetooth)
  // =========================================================================
  const mediaSessionContextRef = useRef({
    currentBook,
    currentChapter,
    currentChapterIndex,
    currentTime,
    totalDuration,
    playbackSpeed,
    isPlaying,
    seekBackwardTime,
    seekForwardTime,
    playbackQueue,
    handleSeek,
    handlePrevChapter,
    handleNextChapter,
    setIsPlaying,
    setPlaybackQueue,
    setCurrentBook,
    setSelectedBook
  });

  useEffect(() => {
    mediaSessionContextRef.current = {
      currentBook,
      currentChapter,
      currentChapterIndex,
      currentTime,
      totalDuration,
      playbackSpeed,
      isPlaying,
      seekBackwardTime,
      seekForwardTime,
      playbackQueue,
      handleSeek,
      handlePrevChapter,
      handleNextChapter,
      setIsPlaying,
      setPlaybackQueue,
      setCurrentBook,
      setSelectedBook
    };
  });

  // Metadados da Media Session (capa, título e autor para lockscreen do SO e fones)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (!currentBook || currentBook.id === EMPTY_BOOK.id) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    const coverUrl = currentBook.cover || getGenericBookCover(currentBook.title, currentBook.author);
    const setMetadata = (art: { src: string; type: string }[]) => {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentBook.title || 'Audiobook',
          artist: currentBook.author || 'Autor Desconhecido',
          album: currentChapter?.title || currentBook.category || 'Audiobook Player',
          artwork: art.flatMap(a => ['256x256', '512x512'].map(sizes => ({ src: a.src, sizes, type: a.type }))),
        });
      } catch (e) {
        console.warn('Erro ao configurar MediaMetadata:', e);
      }
    };
    // Primeiro com a capa original; em seguida, com uma versão quadrada em PNG (o iOS e o Android não
    // exibem capas em SVG nem fora do formato quadrado)
    setMetadata([{ src: coverUrl, type: coverUrl.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png' }]);
    let cancelled = false;
    (async () => {
      try {
        const img = new Image();
        if (!coverUrl.startsWith('data:') && !coverUrl.startsWith('blob:')) img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(); img.src = coverUrl; });
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // Fundo: a própria capa ampliada e escurecida; por cima, a capa inteira centralizada
        ctx.drawImage(img, -size * 0.25, -size * 0.25, size * 1.5, size * 1.5 * (img.height / img.width || 1.6));
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, size, size);
        const h = size * 0.92;
        const w = h * ((img.width / img.height) || 0.625);
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const png = canvas.toDataURL('image/png');
        if (!cancelled) setMetadata([{ src: png, type: 'image/png' }]);
      } catch {
        // Sem a capa (imagem de outro site sem permissão): usa o ícone do app
        if (!cancelled) setMetadata([{ src: `${import.meta.env.BASE_URL}icons/icon-512.png`, type: 'image/png' }]);
      }
    })();
    return () => { cancelled = true; };
  }, [currentBook?.id, currentBook?.title, currentBook?.author, currentBook?.cover, currentChapter?.title]);

  // Sincronização do estado de reprodução na Media Session
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Registro desacoplado dos Action Handlers da Media Session (Fones Bluetooth, botões de hardware e lockscreen)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionMap: [MediaSessionAction, MediaSessionActionHandler][] = [
      [
        'play',
        () => {
          const ctx = mediaSessionContextRef.current;
          ctx.setIsPlaying(true);
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
          }
        }
      ],
      [
        'pause',
        () => {
          const ctx = mediaSessionContextRef.current;
          ctx.setIsPlaying(false);
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
          }
        }
      ],
      [
        'stop',
        () => {
          const ctx = mediaSessionContextRef.current;
          ctx.setIsPlaying(false);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          ctx.handleSeek(0);
        }
      ],
      [
        'seekbackward',
        (details) => {
          const ctx = mediaSessionContextRef.current;
          const skip = details.seekOffset || ctx.seekBackwardTime || 15;
          ctx.handleSeek(Math.max(0, ctx.currentTime - skip));
        }
      ],
      [
        'seekforward',
        (details) => {
          const ctx = mediaSessionContextRef.current;
          const skip = details.seekOffset || ctx.seekForwardTime || 15;
          ctx.handleSeek(Math.min(ctx.totalDuration, ctx.currentTime + skip));
        }
      ],
      [
        'previoustrack',
        () => {
          const ctx = mediaSessionContextRef.current;
          ctx.handlePrevChapter();
        }
      ],
      [
        'nexttrack',
        () => {
          const ctx = mediaSessionContextRef.current;
          ctx.handleNextChapter();
        }
      ],
      [
        'seekto',
        (details) => {
          const ctx = mediaSessionContextRef.current;
          if (details.seekTime !== undefined && details.seekTime !== null && !isNaN(details.seekTime)) {
            ctx.handleSeek(details.seekTime);
          }
        }
      ]
    ];

    actionMap.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        // Ignora ações não suportadas por este navegador/dispositivo
      }
    });

    return () => {
      actionMap.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      });
    };
  }, []);

  const createQueueItem = (book: Audiobook, chapter: any, chapterIndex: number): QueueItem => ({
    id: `q-${book.id}-${chapter.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    bookId: book.id,
    bookTitle: book.title,
    author: book.author,
    cover: book.cover || getGenericBookCover(book.title, book.author),
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    startTime: chapter.startTime,
    duration: chapter.duration,
    chapterIndex,
    book,
  });

  const triggerQueuePulse = (book?: Audiobook, isBook = false) => {
    setIsQueuePulse(true);
    setTimeout(() => setIsQueuePulse(false), 800);
    if (book) {
      if (queueAddedTimeoutRef.current) clearTimeout(queueAddedTimeoutRef.current);
      setQueueAddedAnim({
        cover: book.cover || getGenericBookCover(book.title, book.author),
        title: book.title,
        author: book.author,
        isBook,
        key: Date.now() + Math.random(),
      });
      queueAddedTimeoutRef.current = setTimeout(() => {
        setQueueAddedAnim(null);
      }, 1500);
    }
  };

  const handleAddBookToQueue = (book: Audiobook, position: 'next' | 'last') => {
    const items = book.chapters.map((chap, idx) => createQueueItem(book, chap, idx));
    if (position === 'next') {
      setPlaybackQueue(prev => [...items, ...prev]);
      showToast(t('toast_book_queue_next', { title: book.title }));
    } else {
      setPlaybackQueue(prev => [...prev, ...items]);
      showToast(t('toast_book_queue_last', { title: book.title }));
    }
    triggerQueuePulse(book, true);
  };

  const handleAddChapterToQueue = (book: Audiobook, chapter: any, chapterIndex: number, position: 'next' | 'last') => {
    const item = createQueueItem(book, chapter, chapterIndex);
    if (position === 'next') {
      setPlaybackQueue(prev => [item, ...prev]);
      showToast(t('toast_chapter_queue_next', { title: chapter.title }));
    } else {
      setPlaybackQueue(prev => [...prev, item]);
      showToast(t('toast_chapter_queue_last', { title: chapter.title }));
    }
    triggerQueuePulse(book, false);
  };

  const handleAddToQueue = (item: Audiobook, position: 'next'|'last') => {
    handleAddBookToQueue(item, position);
  };

  const getTranscriptParseErrorMessage = (reason: 'epub_no_media_overlays' | 'invalid_or_no_timestamps' | 'unsupported_format') => {
    if (reason === 'epub_no_media_overlays') {
      return 'Este arquivo EPUB não possui sincronização de áudio (Media Overlays / SMIL).';
    }
    if (reason === 'unsupported_format') {
      return 'Formato de arquivo não suportado para sincronização de texto.';
    }
    return 'Nenhum tempo de sincronização válido encontrado para a duração deste audiobook.';
  };

  const handleUploadTranscriptForPlayerBook = async (file?: File | null) => {
    if (!file || !currentBook || !currentBook.id || currentBook.id === EMPTY_BOOK.id) return;
    const bookDur = (currentBook.chapters || []).reduce((acc, c) => acc + (c.duration || 0), 0);
    const res = await parseSynchronizedTextFile(file, bookDur);
    if (!res.ok) {
      showToast(getTranscriptParseErrorMessage(res.reason));
      return;
    }
    if (res.lines.length === 0) {
      showToast(getTranscriptParseErrorMessage('invalid_or_no_timestamps'));
      return;
    }
    const targetId = currentBook.id;
    setBooks(prev => prev.map(b => b.id === targetId ? {
      ...b,
      transcript: res.lines,
      transcriptSource: 'upload',
      transcriptFileName: file.name,
    } : b));
    setCurrentBook(prev => prev.id === targetId ? {
      ...prev,
      transcript: res.lines,
      transcriptSource: 'upload',
      transcriptFileName: file.name,
    } : prev);
    setSelectedBook(prev => prev && prev.id === targetId ? {
      ...prev,
      transcript: res.lines,
      transcriptSource: 'upload',
      transcriptFileName: file.name,
    } : prev);
    setActiveScreen(prev => prev.data && prev.data.id === targetId ? {
      ...prev,
      data: {
        ...prev.data,
        transcript: res.lines,
        transcriptSource: 'upload',
        transcriptFileName: file.name,
      }
    } : prev);
    if (isEditingBook && (activeScreen.data?.id === targetId || selectedBook?.id === targetId)) {
      setEditBookTranscript(res.lines);
      setEditBookTranscriptSource('upload');
      setEditBookTranscriptFileName(file.name);
    }
    setShowAddTextPopup(false);
    setShowTranscript(true);
    showToast(t('toast_text_uploaded', { count: res.lines.length }));
  };

  const handleUploadTranscriptForEditBook = async (file?: File | null) => {
    if (!file) return;
    const targetBook: Audiobook | undefined = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
    const chaps = editBookChapters.length > 0 ? editBookChapters : (targetBook?.chapters || []);
    const bookDur = chaps.reduce((acc, c) => acc + (c.duration || 0), 0);
    const res = await parseSynchronizedTextFile(file, bookDur);
    if (!res.ok) {
      showToast(getTranscriptParseErrorMessage(res.reason));
      return;
    }
    if (res.lines.length === 0) {
      showToast(getTranscriptParseErrorMessage('invalid_or_no_timestamps'));
      return;
    }
    setEditBookTranscript(res.lines);
    setEditBookTranscriptSource('upload');
    setEditBookTranscriptFileName(file.name);
    showToast(t('toast_text_uploaded', { count: res.lines.length }));
  };

  // Sincronização da fonte de áudio nativa
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentAudioSrc) {
      if (audio.src !== currentAudioSrc) {
        audio.src = currentAudioSrc;
        audio.currentTime = currentTime;
        if (isPlaying) {
          audio.play().catch(e => console.warn('Erro ao iniciar áudio:', e));
        }
      }
    } else {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  }, [currentAudioSrc]);

  // Proteção da reprodução: no iPhone, mudar a biblioteca, a fila ou a velocidade às vezes fazia o sistema
  // pausar o áudio (ou suspender o processamento de áudio) sem o usuário pedir. Se isso acontecer logo
  // depois de uma dessas mudanças, a reprodução continua sozinha. Pausas do sistema em outros momentos
  // (ligação, Siri, outro app tocando) continuam sendo respeitadas.
  const playingNowRef = useRef(isPlaying);
  playingNowRef.current = isPlaying;
  const lastLibraryChangeAtRef = useRef(0);
  useEffect(() => { lastLibraryChangeAtRef.current = Date.now(); }, [books, playbackQueue, playbackSpeed]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const recentChange = () => Date.now() - lastLibraryChangeAtRef.current < 2000;
    const onUnexpectedPause = () => {
      if (!playingNowRef.current || audio.ended || !recentChange()) return;
      setTimeout(() => {
        if (playingNowRef.current && audio.paused && !audio.ended) audio.play().catch(() => {});
      }, 60);
    };
    audio.addEventListener('pause', onUnexpectedPause);
    const ctx = audioContextRef.current;
    const onCtxState = () => {
      if (ctx && ctx.state !== 'running' && playingNowRef.current && recentChange()) ctx.resume().catch(() => {});
    };
    ctx?.addEventListener('statechange', onCtxState);
    return () => {
      audio.removeEventListener('pause', onUnexpectedPause);
      ctx?.removeEventListener('statechange', onCtxState);
    };
  }, [currentAudioSrc, isPlaying]);

  // Sincronização de Play/Pause com o elemento HTML5 Audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudioSrc) return;

    if (isPlaying) {
      setupWebAudioGraph();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.warn('Autoplay impedido ou falhou:', e));
        }
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying, currentAudioSrc]);

  // Sincronização de Volume e Mudo
  useEffect(() => {
    volumeRef.current = volume;
    isMutedRef.current = isMuted;
    const level = isMuted ? 0 : Math.max(0, Math.min(1, volume));
    // Com o processamento de áudio ativo, o volume é aplicado nele (funciona também no iPhone)
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(level, audioContextRef.current.currentTime, 0.02);
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = gainNodeRef.current ? 1 : level;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  // Sincronização da velocidade de reprodução
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.playbackRate = playbackSpeed;
    } catch (e) {
      console.warn('Erro ao definir taxa de reprodução:', e);
    }
  }, [playbackSpeed]);

  // Handler de atualização contínua do tempo de reprodução real do áudio
  const lastRenderedTimeRef = useRef(0);
  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentSec = audio.currentTime;
    // Desempenho: a tela (todo o app) só re-renderiza quando o segundo exibido muda (~1x/s em vez de ~4x/s).
    // Com o texto sincronizado aberto na tela cheia, mantém a precisão total para destacar as linhas no tempo certo.
    const needsFineTime = showTranscript && isFullScreen;
    const lastRendered = lastRenderedTimeRef.current;
    if (needsFineTime || Math.floor(currentSec) !== Math.floor(lastRendered) || Math.abs(currentSec - lastRendered) >= 0.9) {
      lastRenderedTimeRef.current = currentSec;
      setCurrentTime(currentSec);
    }

    // Persistência com debounce/throttle inteligente (elimina gravação síncrona a cada 250ms)
    if (currentBook?.id && currentBook.id !== EMPTY_BOOK.id) {
      savePlaybackPosition(currentSec, currentBook.id, false);
    }

    // Se o áudio em reprodução naturalmente alcançar o ponto de onde o usuário havia saltado, dispensa o botão
    if (playbackReturnPoint && currentBook?.id === playbackReturnPoint.bookId) {
      if (Math.abs(currentSec - playbackReturnPoint.globalTime) < 1.2 && Math.abs(currentSec - playbackReturnPoint.transportedToTime) > 3) {
        setPlaybackReturnPoint(null);
      }
    }

    if (isPlaying && currentBook) {
      const prevTime = lastTrackedAudioTimeRef.current;
      const delta = currentSec - prevTime;
      if (delta > 0 && delta < 2.5) {
        accrueListeningSeconds(currentBook, delta);
      }
      lastTrackedAudioTimeRef.current = currentSec;
      checkChapterFinished(currentBook.id, currentSec);
    }

    updateMediaSessionPosition(currentSec, totalDuration, playbackSpeed, false);

    // Sleep Timer: Fim do capítulo
    const chapEnd = (currentChapter?.startTime || 0) + (currentChapter?.duration || 0);
    if (sleepTimerMode === 'end-of-chapter' && !isSleepTimerPaused && chapEnd > 0 && currentSec >= chapEnd) {
      setIsPlaying(false);
      audio.pause();
      savePlaybackPosition(currentSec, currentBook?.id || '', true);
      setSleepTimerMode(null);
      setSleepTimerRemaining(null);
      setIsSleepTimerPaused(false);
      showToast(t('toast_sleep_timer_chapter_finished'));
      return;
    }

    // Se capítulos tiverem URLs distintas
    if (currentChapter?.audioUrl && currentChapter.audioUrl !== currentBook?.audioUrl && chapEnd > 0 && currentSec >= chapEnd) {
      if (currentChapterIndex < (currentBook?.chapters?.length || 0) - 1) {
        const nextChap = currentBook.chapters[currentChapterIndex + 1];
        handleSeek(nextChap.startTime);
      }
    }
  };

  // Posição atual de verdade. Enquanto o áudio ainda carrega (ao abrir o app, ao trocar de livro) o elemento
  // de áudio está em 0: usa a posição restaurada/pendente, para não gravar 0 por cima de onde parou (era o
  // que fazia o play voltar ao primeiro capítulo depois de abrir o app)
  const getLivePlaybackTime = useCallback(() => {
    if (pendingSeekRef.current !== null) return pendingSeekRef.current;
    const a = audioRef.current;
    if (a && a.currentSrc && a.readyState >= 1) return a.currentTime;
    return currentTimeRef.current;
  }, []);

  // Salva posição imediatamente ao pausar ou ao fechar a janela
  useEffect(() => {
    if (!isPlaying && currentBook?.id && currentBook.id !== EMPTY_BOOK.id) {
      savePlaybackPosition(getLivePlaybackTime(), currentBook.id, true);
    }
  }, [isPlaying, currentBook?.id, savePlaybackPosition, getLivePlaybackTime]);

  useEffect(() => {
    // Só salva a posição: sair do app (ou trocar de app no celular) não interrompe o áudio
    const handleUnload = () => {
      if (currentBook?.id && currentBook.id !== EMPTY_BOOK.id) {
        savePlaybackPosition(getLivePlaybackTime(), currentBook.id, true);
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleUnload();
      // Ao voltar, retoma o processamento de áudio se o sistema o suspendeu
      else if (audioContextRef.current?.state === 'suspended' && audioRef.current && !audioRef.current.paused) {
        audioContextRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentBook?.id, savePlaybackPosition, getLivePlaybackTime]);

  // Handler para quando a faixa de áudio termina
  const handleAudioEnded = () => {
    if (currentBook && currentChapter) markChapterCompleted(currentBook.id, currentChapter.id);
    if (playbackQueue.length > 0) {
      const nextItem = playbackQueue[0];
      setPlaybackQueue(prev => prev.slice(1));
      beginBookSwitch(nextItem.book);
      setCurrentBook(nextItem.book);
      setSelectedBook(nextItem.book);
      handleSeek(nextItem.startTime);
      setIsPlaying(true);
    } else if (currentChapterIndex < (currentBook?.chapters?.length || 0) - 1) {
      const nextChap = currentBook.chapters[currentChapterIndex + 1];
      handleSeek(nextChap.startTime);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      handleSeek(0);
    }
  };

  // Fallback demo timer: roda apenas quando o audiobook NÃO possui áudio real carregado nem no IndexedDB
  useEffect(() => {
    if (!isPlaying || currentAudioSrc || isAudioLoading || (currentBook && storedAudioBlobKeysRef.current.has(currentBook.id))) return;

    const timer = setInterval(() => {
      if (currentBook) {
        accrueListeningSeconds(currentBook, 1);
      }
      setCurrentTime(prevTime => {
        const chapEnd = (currentChapter?.startTime || 0) + (currentChapter?.duration || 0);
        const nextTime = prevTime + 1;

        if (sleepTimerMode === 'end-of-chapter' && !isSleepTimerPaused && chapEnd > 0 && nextTime >= chapEnd) {
          setIsPlaying(false);
          setSleepTimerMode(null);
          setSleepTimerRemaining(null);
          setIsSleepTimerPaused(false);
          showToast(t('toast_sleep_timer_chapter_finished'));
          return chapEnd;
        }

        if (chapEnd > 0 && nextTime >= chapEnd) {
          if (currentBook && currentChapter) markChapterCompleted(currentBook.id, currentChapter.id);
          if (playbackQueue.length > 0) {
            const nextItem = playbackQueue[0];
            setPlaybackQueue(prev => prev.slice(1));
            beginBookSwitch(nextItem.book);
            setCurrentBook(nextItem.book);
            setSelectedBook(nextItem.book);
            return nextItem.startTime;
          } else if (currentChapterIndex < (currentBook?.chapters?.length || 0) - 1) {
            return currentBook.chapters[currentChapterIndex + 1].startTime;
          } else {
            setIsPlaying(false);
            return 0;
          }
        }

        return nextTime >= totalDuration ? 0 : nextTime;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, currentAudioSrc, playbackSpeed, sleepTimerMode, isSleepTimerPaused, currentChapter, totalDuration, playbackQueue, currentChapterIndex, currentBook, t]);

  // Contagem do Sleep Timer por duração configurada
  useEffect(() => {
    if (!isPlaying || sleepTimerMode !== 'duration' || sleepTimerRemaining === null || isSleepTimerPaused) {
      return;
    }

    const timer = setInterval(() => {
      setSleepTimerRemaining(r => {
        if (r === null) return null;
        if (r <= 1) {
          setIsPlaying(false);
          setSleepTimerMode(null);
          setIsSleepTimerPaused(false);
          showToast(t('toast_sleep_timer_ended'));
          return null;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, sleepTimerMode, sleepTimerRemaining, isSleepTimerPaused, t]);

  const handleSelectBookDetail = (book: Audiobook) => {
    pendingChapterScrollRef.current = false;
    targetScrollChapterIdRef.current = null;
    setSelectedBook(book);
    navigateTo('book-detail', book);
  };

  // Posição salva de um audiobook (onde parou), se houver e se ainda não tiver chegado ao fim
  const getResumeTime = (book: Audiobook): number | null => {
    if (!resumePlayback) return null;
    try {
      const saved = Number(JSON.parse(localStorage.getItem('audiobook_playback_positions') || '{}')[book.id]);
      const total = (book.chapters || []).reduce((acc, c) => acc + (c.duration || 0), 0);
      if (!isFinite(saved) || saved <= 1) return null;
      if (total > 0 && saved >= total - 5) return null;
      return saved;
    } catch {
      return null;
    }
  };

  // Tocar um audiobook. Com um capítulo escolhido, começa nele; sem capítulo (botão "Ouvir", play do card),
  // continua de onde parou: o livro atual só retoma (ou pausa) e outro livro volta à posição salva dele
  const handlePlayBookFromStart = (book: Audiobook, chapterIndex = -1) => {
    if (chapterIndex < 0 && currentBook?.id === book.id && book.id !== EMPTY_BOOK.id) {
      if (isPlaying) {
        setIsPlaying(false);
      } else {
        recordPlaySession(book);
        setSelectedBook(book);
        setIsPlaying(true);
      }
      return;
    }
    recordPlaySession(book);
    // Capítulo escolhido: continua de onde parou nele (se já tiver sido ouvido em parte)
    const chosenChapter = chapterIndex >= 0 ? book.chapters?.[chapterIndex] : undefined;
    const chapterElapsed = chosenChapter ? getChapterResumeElapsed(book.id, chosenChapter) : null;
    const resumeTime = chapterIndex < 0
      ? getResumeTime(book)
      : (chapterElapsed !== null ? (chosenChapter!.startTime || 0) + chapterElapsed : null);
    // Antes de pular para outro capítulo do mesmo livro, guarda onde parou no atual
    if (currentBook?.id === book.id && book.id !== EMPTY_BOOK.id) {
      savePlaybackPosition(getLivePlaybackTime(), book.id, true);
    }
    const resumeIdx = resumeTime !== null
      ? Math.max(0, (book.chapters || []).findIndex((chap, i) => {
          const next = book.chapters[i + 1];
          return resumeTime >= chap.startTime && (!next || resumeTime < next.startTime);
        }))
      : 0;
    const targetIdx = chapterIndex >= 0 ? chapterIndex : resumeIdx;
    const isSameBook = currentBook.id === book.id;
    const isSameChapter = isSameBook && currentChapter.id === (book.chapters?.[targetIdx]?.id || 1);
    
    if (isSameBook && isPlaying && isSameChapter) {
      setIsPlaying(false);
    } else {
      if (currentBook && currentBook.id !== EMPTY_BOOK.id && (!isSameBook || !isSameChapter)) {
        const prevElapsed = currentChapter
          ? Math.max(0, currentTime - currentChapter.startTime)
          : 0;
        const targetChapter = book.chapters?.[targetIdx] || { id: 1, startTime: 0 };
        const targetGlobalTime = resumeTime ?? (targetChapter.startTime || 0);

        if (!isSameBook || Math.abs(currentTime - targetGlobalTime) > 3) {
          setPlaybackReturnPoint({
            bookId: currentBook.id,
            chapterId: currentChapter?.id || 1,
            chapterIndex: currentChapterIndex >= 0 ? currentChapterIndex : 0,
            chapterElapsed: prevElapsed,
            globalTime: currentTime,
            transportedToTime: targetGlobalTime,
            transportedToChapterId: targetChapter.id,
            createdAt: Date.now(),
          });
        }
      }

      const targetTime = resumeTime ?? (book.chapters?.[targetIdx]?.startTime || 0);
      const switchingBook = !currentBook || currentBook.id !== book.id;
      if (switchingBook) {
        // Guarda onde o livro anterior parou ANTES de trocar; o salto para o livro novo não pode ser gravado
        // no anterior (era isso que fazia o livro voltar sempre ao início)
        beginBookSwitch(book);
        setCurrentBook(book);
        setSelectedBook(book);
        setCurrentTime(targetTime);
        lastTrackedAudioTimeRef.current = targetTime;
        pendingSeekRef.current = targetTime;
        savePlaybackPosition(targetTime, book.id, true);
      } else {
        setSelectedBook(book);
        handleSeek(targetTime);
      }
      setIsPlaying(true);
      if (book.chapters?.[targetIdx]) {
        const startedId = `${book.id}-${book.chapters[targetIdx].id}`;
        setStartedChapters(prev => prev.includes(startedId) ? prev : [...prev, startedId]);
      }

      // Auto-queue all subsequent chapters of this book in order
      const subsequent: QueueItem[] = [];
      for (let idx = targetIdx + 1; idx < (book.chapters?.length || 0); idx++) {
        subsequent.push(createQueueItem(book, book.chapters[idx], idx));
      }
      setPlaybackQueue(subsequent);
    }
  };

  const recentlyListenedBooks = useMemo(() => {
    const list: Audiobook[] = [];
    for (const id of recentlyListenedBookIds) {
      const b = books.find(book => book.id === id);
      if (b && !list.some(x => x.id === b.id)) list.push(b);
    }
    const otherListened = books.filter(b => 
      !list.some(x => x.id === b.id) &&
      ((userListeningStats.bookSeconds[b.id] || 0) > 0 || (userListeningStats.bookPlayCount[b.id] || 0) > 0 || isBookStarted(b) || isBookCompleted(b))
    ).sort((a, b) => {
      const timeA = userListeningStats.bookLastPlayed[a.id] || 0;
      const timeB = userListeningStats.bookLastPlayed[b.id] || 0;
      return timeB - timeA;
    });

    for (const b of otherListened) {
      list.push(b);
    }

    return list;
  }, [books, recentlyListenedBookIds, userListeningStats, startedChapters, completedChapters]);

  const recentlyAddedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      const getTimestamp = (book: Audiobook): number => {
        if (typeof book.addedDate === 'number' && !isNaN(book.addedDate)) return book.addedDate;
        if (book.id && book.id.startsWith('book_')) {
          const parts = book.id.split('_');
          const ts = parseInt(parts[1], 10);
          if (!isNaN(ts) && ts > 0) return ts;
        }
        return 0;
      };

      const tsA = getTimestamp(a);
      const tsB = getTimestamp(b);

      if (tsA > 0 || tsB > 0) {
        if (tsA !== tsB) return tsB - tsA;
      }

      return books.indexOf(a) - books.indexOf(b);
    });
  }, [books]);

  // Perfil analítico e inteligente de padrões de escuta do usuário
  const userListeningProfile = useMemo(() => {
    const engagedBooks = books.filter(b => 
      (userListeningStats.bookSeconds[b.id] || 0) >= 15 ||
      (userListeningStats.bookPlayCount[b.id] || 0) >= 1 ||
      isBookStarted(b) ||
      isBookCompleted(b) ||
      recentlyListenedBookIds.includes(b.id)
    );

    // 1. Duração média ponderada pelo tempo real de escuta
    let preferredDurationSeconds = 0;
    let totalDurationWeight = 0;

    engagedBooks.forEach(b => {
      const dur = getBookDurationInSeconds(b);
      if (dur <= 0) return;

      const listenedSec = userListeningStats.bookSeconds[b.id] || 0;
      const compBonus = isBookCompleted(b) ? dur : 0;
      const startedBonus = isBookStarted(b) ? dur * 0.3 : 0;
      const favBonus = favoriteBookIds.includes(b.id) ? dur * 0.5 : 0;

      const weight = Math.max(1, listenedSec + compBonus + startedBonus + favBonus);
      preferredDurationSeconds += dur * weight;
      totalDurationWeight += weight;
    });

    const avgPreferredDuration = totalDurationWeight > 0 
      ? Math.round(preferredDurationSeconds / totalDurationWeight) 
      : 0;

    let formattedDuration = '';
    if (avgPreferredDuration > 0) {
      const hours = Math.round(avgPreferredDuration / 3600);
      if (hours < 1) {
        formattedDuration = `~${Math.round(avgPreferredDuration / 60)} min`;
      } else {
        formattedDuration = `~${hours}h`;
      }
    }

    // 2. Ranking de gêneros por tempo real de escuta e engajamento
    const genreScores = new Map<string, number>();
    for (const [g, sec] of Object.entries(userListeningStats.genreSeconds)) {
      if (sec > 0) {
        genreScores.set(g, (genreScores.get(g) || 0) + sec);
      }
    }

    books.forEach(b => {
      const cat = (b.category || '').toLowerCase().trim();
      const subg = (b.subgenre || '').toLowerCase().trim();
      const isFav = favoriteBookIds.includes(b.id);
      const isComp = isBookCompleted(b);
      const isStart = isBookStarted(b);

      const bonus = (isComp ? 2400 : 0) + (isFav ? 1800 : 0) + (isStart ? 600 : 0);
      if (bonus > 0) {
        if (cat) genreScores.set(cat, (genreScores.get(cat) || 0) + bonus);
        if (subg && subg !== 'desconhecido') genreScores.set(subg, (genreScores.get(subg) || 0) + bonus * 0.7);
      }
    });

    const sortedGenres = Array.from(genreScores.entries())
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);

    // 3. Ranking de autores por tempo real de escuta e favoritos
    const authorScores = new Map<string, { authorId: string; name: string; score: number }>();

    authors.forEach(a => {
      const aName = a.name.toLowerCase().trim();
      let score = userListeningStats.authorSeconds[aName] || 0;
      if (favoriteAuthorIds.includes(a.id)) {
        score += 3600;
      }

      const aBooks = books.filter(b => bookHasAuthor(b, a));
      aBooks.forEach(b => {
        if (isBookCompleted(b)) score += 2400;
        if (favoriteBookIds.includes(b.id)) score += 1800;
        if (isBookStarted(b)) score += 600;
        score += (userListeningStats.bookSeconds[b.id] || 0);
      });

      if (score > 0) {
        authorScores.set(a.id, { authorId: a.id, name: a.name, score });
      }
    });

    const sortedAuthorsList = Array.from(authorScores.values())
      .sort((a, b) => b.score - a.score);

    return {
      hasListeningData: engagedBooks.length > 0 || userListeningStats.totalSeconds > 0,
      avgPreferredDuration,
      formattedDuration,
      topGenres: sortedGenres,
      topAuthors: sortedAuthorsList,
      totalSeconds: userListeningStats.totalSeconds
    };
  }, [
    books,
    authors,
    userListeningStats,
    favoriteBookIds,
    favoriteAuthorIds,
    startedChapters,
    completedChapters,
    recentlyListenedBookIds
  ]);

  // Controle de visibilidade inteligente do miniplayer:
  // - Se algo estiver tocando, sempre visível.
  // - Se em tela cheia, permanece visível.
  // - Se o usuário marcou em ajustes que não quer salvar de onde parou (resumePlayback === false), o miniplayer desaparece.
  // - Se nada nunca tiver sido reproduzido, ou o último livro tocado foi apagado, o miniplayer desaparece.
  const isPlayerVisible = useMemo(() => {
    // 1. Se algo está tocando no momento, o player SEMPRE deve aparecer
    if (isPlaying && currentBook?.id && currentBook.id !== EMPTY_BOOK.id) {
      return true;
    }

    // 2. Se a tela cheia do player estiver aberta pelo usuário, manter visível até minimizar
    if (isFullScreen && currentBook?.id && currentBook.id !== EMPTY_BOOK.id && books.some(b => b.id === currentBook.id)) {
      return true;
    }

    // 3. Se o usuário marcou em ajustes que NÃO quer salvar de onde parou (resumePlayback === false),
    // o miniplayer DEVE desaparecer da tela enquanto pausado/parado.
    if (!resumePlayback) {
      return false;
    }

    // 4. Se não há livro válido no player ou o livro é vazio
    if (!currentBook || !currentBook.id || currentBook.id === EMPTY_BOOK.id) {
      return false;
    }

    // 5. Se o livro não existe na biblioteca (por exemplo, foi apagado)
    const exists = books.some(b => b.id === currentBook.id);
    if (!exists) {
      return false;
    }

    // 6. Se nada nunca tiver sido reproduzido ou o último reproduzido foi apagado/diferente
    const wasEverPlayed = Boolean(
      lastPlayedBookId === currentBook.id ||
      recentlyListenedBookIds.includes(currentBook.id) ||
      (userListeningStats.bookSeconds[currentBook.id] || 0) > 0 ||
      (userListeningStats.bookPlayCount[currentBook.id] || 0) > 0 ||
      isBookStarted(currentBook) ||
      isBookCompleted(currentBook)
    );

    return wasEverPlayed;
  }, [
    isPlaying,
    isFullScreen,
    resumePlayback,
    currentBook,
    books,
    lastPlayedBookId,
    recentlyListenedBookIds,
    userListeningStats,
    startedChapters,
    completedChapters
  ]);

  useEffect(() => {
    if (!isPlayerVisible) {
      closeAllPopups();
    }
  }, [isPlayerVisible]);

  interface HomeSection {
    id: string;
    title: string;
    subtitle?: string;
    badge?: string;
    buttonLabel?: string;
    onButtonClick?: () => void;
    books: Audiobook[];
  }

  const homeSections = useMemo((): HomeSection[] => {
    if (books.length === 0) return [];

    const sections: HomeSection[] = [];
    const listenedBooks = books.filter(b => 
      recentlyListenedBookIds.includes(b.id) || 
      (userListeningStats.bookSeconds[b.id] || 0) >= 10 ||
      (userListeningStats.bookPlayCount[b.id] || 0) >= 1 ||
      isBookStarted(b) || 
      isBookCompleted(b) || 
      currentBook.id === b.id
    );
    const inProgressBooks = books.filter(b => isBookStarted(b) && !isBookCompleted(b));
    const completedBooks = books.filter(b => isBookCompleted(b));
    const unstartedBooks = books.filter(b => !isBookStarted(b) && !isBookCompleted(b));

    // 1. Continue ouvindo (em andamento, ordenado por último reproduzido)
    if (inProgressBooks.length > 0) {
      const sortedInProgress = [...inProgressBooks].sort((a, b) => {
        const timeA = userListeningStats.bookLastPlayed[a.id] || 0;
        const timeB = userListeningStats.bookLastPlayed[b.id] || 0;
        if (timeA !== timeB) return timeB - timeA;
        const idxA = recentlyListenedBookIds.indexOf(a.id);
        const idxB = recentlyListenedBookIds.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
      sections.push({
        id: 'in-progress',
        title: t('section_continue_listening'),
        subtitle: t('section_continue_listening_sub'),
        badge: `${inProgressBooks.length} ${t('filter_in_progress').toLowerCase()}`,
        ...(sortedInProgress.length > 6 ? {
          buttonLabel: t('see_all'),
          onButtonClick: () => navigateTo('home-continuar-ouvindo'),
        } : {}),
        books: sortedInProgress.slice(0, 6)
      });
    }

    // 2. Falta pouco para concluir (>50% concluído)
    const almostDone = inProgressBooks.filter(b => {
      const chaps = b.chapters || [];
      if (chaps.length <= 1) return false;
      const doneCount = chaps.filter((c: any) => completedChapters.includes(`${b.id}-${c.id}`)).length;
      return (doneCount / chaps.length) >= 0.5;
    });
    if (almostDone.length > 0) {
      sections.push({
        id: 'almost-done',
        title: t('section_almost_done'),
        subtitle: t('section_almost_done_sub'),
        badge: t('section_almost_done'),
        books: almostDone.slice(0, 6)
      });
    }

    // 3. Ouvidos recentemente
    if (recentlyListenedBooks.length > 0) {
      sections.push({
        id: 'recently-listened',
        title: t('section_recently_listened'),
        subtitle: t('section_recently_listened_sub'),
        ...(recentlyListenedBooks.length > 6 ? {
          buttonLabel: t('see_all'),
          onButtonClick: () => navigateTo('home-ouvidos-recentemente'),
        } : {}),
        books: recentlyListenedBooks.slice(0, 6)
      });
    }

    // 4. Gênero que você mais ouve (personalizado com base no tempo real de escuta)
    if (userListeningProfile.topGenres.length > 0) {
      const topGenre = userListeningProfile.topGenres[0];
      let genreRecs = books.filter(b => 
        (b.category?.toLowerCase() === topGenre || b.subgenre?.toLowerCase() === topGenre) && 
        !isBookStarted(b) && 
        !isBookCompleted(b)
      );
      if (genreRecs.length === 0) {
        genreRecs = books.filter(b => 
          (b.category?.toLowerCase() === topGenre || b.subgenre?.toLowerCase() === topGenre) && 
          currentBook.id !== b.id
        );
      }
      if (genreRecs.length > 0) {
        if (userListeningProfile.avgPreferredDuration > 0) {
          genreRecs.sort((a, b) => {
            const diffA = Math.abs(getBookDurationInSeconds(a) - userListeningProfile.avgPreferredDuration);
            const diffB = Math.abs(getBookDurationInSeconds(b) - userListeningProfile.avgPreferredDuration);
            return diffA - diffB;
          });
        }

        const cleanCat = topGenre.trim().toLowerCase();
        const matchedGenreObj = Object.values(GENRE_HIERARCHY).find(g => 
          g.name.toLowerCase() === cleanCat || 
          g.id.toLowerCase() === cleanCat
        );
        const matchedSubgenreObj = !matchedGenreObj ? Object.values(GENRE_HIERARCHY).find(g => 
          g.subgenres.some(s => s.toLowerCase() === cleanCat)
        ) : null;
        const subgenreName = matchedSubgenreObj ? matchedSubgenreObj.subgenres.find(s => s.toLowerCase() === cleanCat) : null;

        const handleGoToGenre = () => {
          if (matchedGenreObj) {
            navigateTo(`library-genre-${matchedGenreObj.id}`);
          } else if (matchedSubgenreObj && subgenreName) {
            navigateTo(`library-subgenre-${matchedSubgenreObj.id}-${subgenreName}`, { genre: matchedSubgenreObj, subgenre: subgenreName });
          } else {
            navigateTo('library-gêneros');
          }
        };

        const localizedGenre = matchedGenreObj 
          ? getGenreName(matchedGenreObj.id, resolvedLanguage) 
          : (subgenreName ? getSubgenreName(subgenreName, resolvedLanguage) : topGenre);

        sections.push({
          id: 'top-genre',
          title: t('section_top_genre', { genre: localizedGenre }),
          subtitle: t('section_top_genre_sub'),
          badge: t('badge_top_genre'),
          buttonLabel: t('btn_go_to_genre'),
          onButtonClick: handleGoToGenre,
          books: genreRecs.slice(0, 6)
        });
      }
    }

    // 5. Audiobooks no ritmo de duração que o usuário mais costuma ouvir
    if (userListeningProfile.avgPreferredDuration >= 120 && userListeningProfile.formattedDuration) {
      const avgSec = userListeningProfile.avgPreferredDuration;
      const similarDurationBooks = books.filter(b => {
        if (isBookStarted(b) || isBookCompleted(b)) return false;
        const dur = getBookDurationInSeconds(b);
        return dur >= avgSec * 0.45 && dur <= avgSec * 1.85;
      }).sort((a, b) => {
        const catA = (a.category || '').toLowerCase();
        const catB = (b.category || '').toLowerCase();
        const genreRankA = userListeningProfile.topGenres.indexOf(catA);
        const genreRankB = userListeningProfile.topGenres.indexOf(catB);
        const bonusA = genreRankA !== -1 ? (genreRankA === 0 ? 0.65 : 0.85) : 1;
        const bonusB = genreRankB !== -1 ? (genreRankB === 0 ? 0.65 : 0.85) : 1;
        const diffA = Math.abs(getBookDurationInSeconds(a) - avgSec) * bonusA;
        const diffB = Math.abs(getBookDurationInSeconds(b) - avgSec) * bonusB;
        return diffA - diffB;
      });

      if (similarDurationBooks.length > 0) {
        sections.push({
          id: 'similar-duration',
          title: t('section_similar_duration', { duration: userListeningProfile.formattedDuration }),
          subtitle: t('section_similar_duration_sub'),
          badge: t('badge_similar_duration'),
          books: similarDurationBooks.slice(0, 6)
        });
      }
    }

    // 6. Mais títulos dos autores que o usuário mais ouve
    if (userListeningProfile.topAuthors.length > 0) {
      let selectedAuthorObj: { authorId: string; name: string; score: number } | null = null;
      let authorOtherTitles: Audiobook[] = [];

      for (const aEntry of userListeningProfile.topAuthors) {
        const others = books.filter(b => 
          bookHasAuthor(b, { id: aEntry.authorId, name: aEntry.name }) && 
          !isBookCompleted(b) && 
          !inProgressBooks.some(ip => ip.id === b.id)
        );
        if (others.length > 0) {
          selectedAuthorObj = aEntry;
          if (userListeningProfile.avgPreferredDuration > 0) {
            others.sort((a, b) => {
              const diffA = Math.abs(getBookDurationInSeconds(a) - userListeningProfile.avgPreferredDuration);
              const diffB = Math.abs(getBookDurationInSeconds(b) - userListeningProfile.avgPreferredDuration);
              return diffA - diffB;
            });
          }
          authorOtherTitles = others;
          break;
        }
      }

      if (selectedAuthorObj && authorOtherTitles.length > 0) {
        const authorObj = authors.find(a => a.id === selectedAuthorObj!.authorId || a.name.toLowerCase() === selectedAuthorObj!.name.toLowerCase());
        const authorId = authorObj?.id || selectedAuthorObj.authorId || authorOtherTitles[0]?.authorId;
        const authorName = authorObj?.name || selectedAuthorObj.name || authorOtherTitles[0]?.author;
        sections.push({
          id: 'listened-author-more',
          title: t('section_more_from_author', { author: authorName }),
          subtitle: t('section_more_from_author_sub'),
          buttonLabel: t('btn_go_to_author'),
          onButtonClick: () => handleSelectAuthor(authorId, authorName),
          books: authorOtherTitles.slice(0, 6)
        });
      }
    }

    // 7. Mais do seu segundo gênero preferido (se houver dados suficientes)
    if (userListeningProfile.topGenres.length > 1) {
      const secondGenre = userListeningProfile.topGenres[1];
      const secondGenreRecs = books.filter(b => 
        (b.category?.toLowerCase() === secondGenre || b.subgenre?.toLowerCase() === secondGenre) && 
        !isBookStarted(b) && 
        !isBookCompleted(b)
      );
      if (secondGenreRecs.length > 0) {
        if (userListeningProfile.avgPreferredDuration > 0) {
          secondGenreRecs.sort((a, b) => {
            const diffA = Math.abs(getBookDurationInSeconds(a) - userListeningProfile.avgPreferredDuration);
            const diffB = Math.abs(getBookDurationInSeconds(b) - userListeningProfile.avgPreferredDuration);
            return diffA - diffB;
          });
        }
        const cleanCat = secondGenre.trim().toLowerCase();
        const matchedGenreObj = Object.values(GENRE_HIERARCHY).find(g => 
          g.name.toLowerCase() === cleanCat || 
          g.id.toLowerCase() === cleanCat
        );
        const matchedSubgenreObj = !matchedGenreObj ? Object.values(GENRE_HIERARCHY).find(g => 
          g.subgenres.some(s => s.toLowerCase() === cleanCat)
        ) : null;
        const subgenreName = matchedSubgenreObj ? matchedSubgenreObj.subgenres.find(s => s.toLowerCase() === cleanCat) : null;

        const handleGoToGenre = () => {
          if (matchedGenreObj) {
            navigateTo(`library-genre-${matchedGenreObj.id}`);
          } else if (matchedSubgenreObj && subgenreName) {
            navigateTo(`library-subgenre-${matchedSubgenreObj.id}-${subgenreName}`, { genre: matchedSubgenreObj, subgenre: subgenreName });
          } else {
            navigateTo('library-gêneros');
          }
        };

        const localizedGenre = matchedGenreObj 
          ? getGenreName(matchedGenreObj.id, resolvedLanguage) 
          : (subgenreName ? getSubgenreName(subgenreName, resolvedLanguage) : secondGenre);

        sections.push({
          id: 'top-genre-2',
          title: t('section_top_genre', { genre: localizedGenre }),
          subtitle: t('section_top_genre_sub'),
          badge: t('badge_top_genre'),
          buttonLabel: t('btn_go_to_genre'),
          onButtonClick: handleGoToGenre,
          books: secondGenreRecs.slice(0, 6)
        });
      }
    }

    // 8. Audiobooks ainda não ouvidos de autores favoritos
    if (favoriteAuthorIds.length > 0) {
      const favAuthors = authors.filter(a => favoriteAuthorIds.includes(a.id));
      const unstartedFromFavAuthors = books.filter(b =>
        favAuthors.some(a => bookHasAuthor(b, a)) &&  
        !isBookStarted(b) && 
        !isBookCompleted(b)
      );
      if (unstartedFromFavAuthors.length > 0) {
        const topFavAuthor = authors.find(a => 
          favoriteAuthorIds.includes(a.id) && 
          unstartedFromFavAuthors.some(b => bookHasAuthor(b, a))
        );
        const authorName = topFavAuthor?.name || unstartedFromFavAuthors[0]?.author;
        const authorId = topFavAuthor?.id || unstartedFromFavAuthors[0]?.authorId;
        sections.push({
          id: 'unstarted-fav-authors',
          title: authorName ? t('section_unstarted_fav_authors', { author: authorName }) : t('section_unstarted_fav_authors_default'),
          subtitle: t('section_unstarted_fav_authors_sub'),
          badge: t('badge_fav_author'),
          buttonLabel: t('btn_go_to_author'),
          onButtonClick: () => handleSelectAuthor(authorId, authorName),
          books: unstartedFromFavAuthors.slice(0, 6)
        });
      }
    }

    // 9. Audiobooks ainda não ouvidos da lista de favoritos
    if (favoriteBookIds.length > 0) {
      const unstartedFavorites = books.filter(b => 
        favoriteBookIds.includes(b.id) && 
        !isBookStarted(b) && 
        !isBookCompleted(b)
      );
      if (unstartedFavorites.length > 0) {
        sections.push({
          id: 'unstarted-favorites',
          title: t('section_unstarted_favorites'),
          subtitle: t('section_unstarted_favorites_sub'),
          badge: t('badge_favorites'),
          ...(unstartedFavorites.length > 6 ? {
            buttonLabel: t('btn_view_favorites'),
            onButtonClick: () => navigateTo('library-audiobooks-favoritos'),
          } : {}),
          books: unstartedFavorites.slice(0, 6)
        });
      }
    }

    // 10. Esquecidos na biblioteca (adicionados há mais tempo e ainda não ouvidos)
    if (unstartedBooks.length > 0 && books.length >= 3) {
      const forgottenList = unstartedBooks.slice(0, 6);
      sections.push({
        id: 'forgotten-library',
        title: t('section_forgotten'),
        subtitle: t('section_forgotten_sub'),
        badge: t('badge_how_about_starting'),
        books: forgottenList
      });
    }

    // 11. Audiobooks em idiomas diferentes
    const langCounts = new Map<string, number>();
    listenedBooks.forEach(b => {
      const { language } = resolveNarratorAndLanguage(b);
      if (!language) return;
      const l = language.toLowerCase();
      langCounts.set(l, (l.toLowerCase() === l ? (langCounts.get(l) || 0) + 1 : 1));
    });
    const primaryLang = Array.from(langCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'português';

    const otherLangBooks = books.filter(b => {
      const { language } = resolveNarratorAndLanguage(b);
      if (!language) return false;
      const l = language.toLowerCase();
      return l !== primaryLang && !isBookCompleted(b);
    });

    if (otherLangBooks.length > 0) {
      sections.push({
        id: 'other-languages',
        title: t('section_other_languages'),
        subtitle: t('section_other_languages_sub'),
        buttonLabel: t('btn_view_languages'),
        onButtonClick: () => navigateTo('library-idiomas'),
        books: otherLangBooks.slice(0, 6)
      });
    }

    // 12. Novas descobertas (gêneros que o usuário ainda não experimentou)
    if (userListeningProfile.topGenres.length > 0 || listenedBooks.length > 0) {
      const triedGenres = new Set([
        ...userListeningProfile.topGenres,
        ...listenedBooks.map(b => b.category?.toLowerCase()).filter(Boolean)
      ]);
      const freshBooks = books.filter(b => {
        const cat = b.category?.toLowerCase();
        return cat && !triedGenres.has(cat) && !isBookStarted(b) && !isBookCompleted(b);
      });
      if (freshBooks.length > 0) {
        if (userListeningProfile.avgPreferredDuration > 0) {
          freshBooks.sort((a, b) => {
            const diffA = Math.abs(getBookDurationInSeconds(a) - userListeningProfile.avgPreferredDuration);
            const diffB = Math.abs(getBookDurationInSeconds(b) - userListeningProfile.avgPreferredDuration);
            return diffA - diffB;
          });
        }
        sections.push({
          id: 'fresh-discovery',
          title: t('section_fresh_discoveries'),
          subtitle: t('section_fresh_discoveries_sub'),
          badge: t('badge_try_it'),
          books: freshBooks.slice(0, 6)
        });
      }
    }

    // 13. Adicionados recentemente
    if (recentlyAddedBooks.length > 0) {
      sections.push({
        id: 'recently-added',
        title: t('section_recently_added'),
        subtitle: t('section_recently_added_sub'),
        ...(recentlyAddedBooks.length > 6 ? {
          buttonLabel: t('see_all'),
          onButtonClick: () => navigateTo('home-adicionados-recentemente'),
        } : {}),
        books: recentlyAddedBooks.slice(0, 6)
      });
    }

    // 14. Ouvir novamente (concluídos, priorizando favoritos)
    if (completedBooks.length > 0) {
      const sortedCompleted = [...completedBooks].sort((a, b) => {
        const favA = favoriteBookIds.includes(a.id) ? 1 : 0;
        const favB = favoriteBookIds.includes(b.id) ? 1 : 0;
        return favB - favA;
      });
      sections.push({
        id: 'listen-again',
        title: t('section_listen_again'),
        subtitle: t('section_listen_again_sub'),
        badge: t('filter_completed'),
        books: sortedCompleted.slice(0, 6)
      });
    }

    return sections;
  }, [
    books,
    recentlyListenedBooks,
    recentlyAddedBooks,
    recentlyListenedBookIds,
    userListeningStats,
    userListeningProfile,
    startedChapters,
    completedChapters,
    favoriteBookIds,
    favoriteAuthorIds,
    currentBook,
    authors,
    t,
    resolvedLanguage,
    handleSelectAuthor,
    navigateTo,
    setStatusFilter
  ]);

  const _favoriteChaptersList = useMemo(() => {
    const list: { book: Audiobook; chapter: Chapter; chapterIndex: number }[] = [];
    favoriteChapters.forEach(key => {
      const parts = key.split('-');
      const bookId = parts[0];
      const chapId = parts.slice(1).join('-');
      const book = books.find(b => b.id === bookId);
      if (book) {
        const idx = (book.chapters || []).findIndex(c => String(c.id) === String(chapId));
        if (idx !== -1) {
          list.push({ book, chapter: book.chapters[idx], chapterIndex: idx });
        }
      }
    });
    return list;
  }, [favoriteChapters, books]);
  void _favoriteChaptersList;

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    books.forEach(b => {
      const { language } = resolveNarratorAndLanguage(b);
      if (language) langs.add(language);
    });
    return Array.from(langs).filter(lang =>
      books.some(b => {
        const { language } = resolveNarratorAndLanguage(b);
        return Boolean(language && language.toLowerCase() === lang.toLowerCase());
      })
    );
  }, [books]);

  const sortBooks = useCallback((bookList: Audiobook[]): Audiobook[] => {
    return [...bookList].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return compareTitles(a.title, b.title, resolvedLanguage);
        case 'name-desc': return compareTitles(b.title, a.title, resolvedLanguage);
        case 'year-desc': return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
        case 'year-asc': return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
        case 'duration-desc': {
          const aDur = (a.chapters || []).reduce((s, c) => s + (c.duration || 0), 0);
          const bDur = (b.chapters || []).reduce((s, c) => s + (c.duration || 0), 0);
          return bDur - aDur;
        }
        case 'duration-asc': {
          const aDur = (a.chapters || []).reduce((s, c) => s + (c.duration || 0), 0);
          const bDur = (b.chapters || []).reduce((s, c) => s + (c.duration || 0), 0);
          return aDur - bDur;
        }
        default: return 0;
      }
    });
  }, [sortBy, resolvedLanguage]);

  // ===== Coleções: cards reutilizados na página da coleção e nas sub-páginas "Ver tudo" =====
  // Coleções seguem o "Ordenar por": nome; ano = data de criação; duração = quantidade de itens
  const sortedCollections = useMemo(() => {
    const count = (c: Collection) => c.bookIds.length + (c.authorIds || []).length;
    return [...collections].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name, resolvedLanguage, { sensitivity: 'base' });
        case 'name-desc': return b.name.localeCompare(a.name, resolvedLanguage, { sensitivity: 'base' });
        case 'year-desc': return (b.createdAt || 0) - (a.createdAt || 0);
        case 'year-asc': return (a.createdAt || 0) - (b.createdAt || 0);
        case 'duration-desc': return count(b) - count(a);
        case 'duration-asc': return count(a) - count(b);
        default: return 0;
      }
    });
  }, [collections, sortBy, resolvedLanguage]);
  // Autores seguem a ordenação por nome do botão "Ordenar por" (demais critérios mantêm a ordem da coleção)
  const sortCollectionAuthors = (list: Author[]): Author[] => {
    if (sortBy === 'name-asc') return [...list].sort((a, b) => a.name.localeCompare(b.name, resolvedLanguage, { sensitivity: 'base' }));
    if (sortBy === 'name-desc') return [...list].sort((a, b) => b.name.localeCompare(a.name, resolvedLanguage, { sensitivity: 'base' }));
    return list;
  };
  const getCollectionItems = (collection: Collection) => ({
    books: sortBooks(books.filter(b => collection.bookIds.includes(b.id))),
    authors: sortCollectionAuthors(authors.filter(a => (collection.authorIds || []).includes(a.id))),
  });
  const renderCollectionAuthorCard = (author: Author, collectionId: string) => (
    <AuthorCard
      key={author.id}
      author={author}
      onSelect={() => navigateTo('author-detail', author)}
      isFavorite={favoriteAuthorIds.includes(author.id)}
      onToggleFavorite={() => toggleFavoriteAuthor(author.id)}
      currentCollectionId={collectionId}
    />
  );
  const renderCollectionBookCard = (book: Audiobook, collectionId: string) => (
    <BookCard
      key={book.id}
      book={book}
      onSelect={() => handleSelectBookDetail(book)}
      onSelectAuthor={handleSelectAuthor}
      onPlay={() => handlePlayBookFromStart(book)}
      onEdit={() => setEditingBook(book)}
      onAddToQueue={(pos) => handleAddToQueue(book, pos)}
      currentCollectionId={collectionId}
      onDelete={() => {
        handleDeleteBook(book.id);
        showToast(t('toast_book_deleted', { title: book.title }));
      }}
      isSelectionMode={isSelectionMode}
      isSelected={selectedBooks.includes(book.id)}
      onToggleSelect={() => {
        if(selectedBooks.includes(book.id)) setSelectedBooks(selectedBooks.filter(id => id !== book.id));
        else setSelectedBooks([...selectedBooks, book.id]);
      }}
      isFavorite={favoriteBookIds.includes(book.id)}
      onToggleFavorite={() => toggleFavoriteBook(book.id)}
      isBookPlaying={currentBook.id === book.id && isPlaying}
      isCompleted={isBookCompleted(book)}
      isStarted={isBookStarted(book)}
      onToggleCompleted={() => {
        const isComp = isBookCompleted(book);
        const chapIds = (book.chapters || []).map((c: any) => `${book.id}-${c.id}`);
        if (isComp) {
          setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
          setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
          showToast(t('toast_book_marked_unstarted', { title: book.title }));
        } else {
          setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
          setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
          showToast(t('toast_book_marked_completed', { title: book.title }));
        }
      }}
    />
  );

  // Audiobooks com vários autores no campo ("A & B", "A, B"): cada nome vira um autor cadastrado e o
  // audiobook fica ligado a todos. Vale para os que já estavam na biblioteca e para os editados depois.
  useEffect(() => {
    const known = new Map(authors.map(a => [a.name.trim().toLowerCase(), a] as const));
    const missing: Author[] = [];
    let changed = false;
    const next = books.map(b => {
      const names = splitAuthorNames(b.author);
      if (names.length < 2) {
        if (!b.authorIds) return b;
        changed = true;
        const { authorIds: _drop, ...rest } = b;
        return rest as Audiobook;
      }
      const ids = names.map((name, k) => {
        const key = name.trim().toLowerCase();
        let a = known.get(key);
        if (!a) {
          a = { id: `a_${Date.now()}_${k}_${Math.random().toString(36).slice(2, 7)}`, name, nationality: 'Desconhecido', picture: getAuthorAvatar(name), bio: '' };
          known.set(key, a);
          missing.push(a);
        }
        return a.id;
      });
      if (b.authorId === ids[0] && (b.authorIds || []).join('|') === ids.join('|')) return b;
      changed = true;
      return { ...b, authorId: ids[0], authorIds: ids };
    });
    if (missing.length > 0) {
      setAuthors(prev => [...prev, ...missing.filter(m => !prev.some(a => a.name.trim().toLowerCase() === m.name.trim().toLowerCase()))]);
    }
    if (changed) setBooks(next);
  }, [books, authors]);

  const sortedAuthors = useMemo(() => {
    // Apenas autores que possuem pelo menos 1 audiobook correspondente na biblioteca
    const matchingAuthors = authors.filter(a =>
      books.some(bk => bookHasAuthor(bk, a))
    );

    // Inclui autores presentes nos audiobooks que porventura ainda não estejam cadastrados em 'authors'
    const existingNames = new Set(matchingAuthors.map(a => a.name.trim().toLowerCase()));
    const extraAuthors: Author[] = [];
    books.forEach(bk => {
      getBookAuthorNames(bk).forEach((authName, n) => {
      if (authName && !existingNames.has(authName.toLowerCase())) {
        existingNames.add(authName.toLowerCase());
        extraAuthors.push({
          id: (n === 0 && bk.authorId && !splitAuthorNames(bk.author).slice(1).length ? bk.authorId : '') || `author_${authName.toLowerCase().replace(/\s+/g, '_')}`,
          name: authName,
          nationality: 'Desconhecido',
          picture: getAuthorAvatar(authName),
          bio: ''
        });
      }
      });
    });

    const allValidAuthors = [...matchingAuthors, ...extraAuthors];

    return allValidAuthors.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, resolvedLanguage, { sensitivity: 'base' });
        case 'name-desc':
          return b.name.localeCompare(a.name, resolvedLanguage, { sensitivity: 'base' });
        case 'year-desc': {
          const aBooks = books.filter(bk => bookHasAuthor(bk, a));
          const bBooks = books.filter(bk => bookHasAuthor(bk, b));
          const aYear = Math.max(0, ...aBooks.map(bk => parseInt(bk.year) || 0));
          const bYear = Math.max(0, ...bBooks.map(bk => parseInt(bk.year) || 0));
          return bYear - aYear;
        }
        case 'year-asc': {
          const aBooks = books.filter(bk => bookHasAuthor(bk, a));
          const bBooks = books.filter(bk => bookHasAuthor(bk, b));
          const aYear = Math.min(9999, ...aBooks.map(bk => parseInt(bk.year) || 9999));
          const bYear = Math.min(9999, ...bBooks.map(bk => parseInt(bk.year) || 9999));
          return aYear - bYear;
        }
        case 'duration-desc': {
          const aBooks = books.filter(bk => bookHasAuthor(bk, a));
          const bBooks = books.filter(bk => bookHasAuthor(bk, b));
          const aDur = aBooks.reduce((sum, bk) => sum + (bk.chapters || []).reduce((s, c) => s + (c.duration || 0), 0), 0);
          const bDur = bBooks.reduce((sum, bk) => sum + (bk.chapters || []).reduce((s, c) => s + (c.duration || 0), 0), 0);
          return bDur - aDur;
        }
        case 'duration-asc': {
          const aBooks = books.filter(bk => bookHasAuthor(bk, a));
          const bBooks = books.filter(bk => bookHasAuthor(bk, b));
          const aDur = aBooks.reduce((sum, bk) => sum + (bk.chapters || []).reduce((s, c) => s + (c.duration || 0), 0), 0);
          const bDur = bBooks.reduce((sum, bk) => sum + (bk.chapters || []).reduce((s, c) => s + (c.duration || 0), 0), 0);
          return aDur - bDur;
        }
        default:
          return a.name.localeCompare(b.name, resolvedLanguage, { sensitivity: 'base' });
      }
    });
  }, [authors, books, sortBy, resolvedLanguage]);

  const sortedLanguages = useMemo(() => {
    return [...availableLanguages].sort((a, b) => {
      const aIsOther = a.toLowerCase() === 'outro' || a.toLowerCase() === 'outros';
      const bIsOther = b.toLowerCase() === 'outro' || b.toLowerCase() === 'outros';
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      const aName = getLanguageCardName(a, resolvedLanguage);
      const bName = getLanguageCardName(b, resolvedLanguage);
      if (sortBy === 'name-desc') {
        return bName.localeCompare(aName, resolvedLanguage, { sensitivity: 'base' });
      }
      return aName.localeCompare(bName, resolvedLanguage, { sensitivity: 'base' });
    });
  }, [availableLanguages, sortBy, resolvedLanguage]);

  const sortedGenres = useMemo(() => {
    const list = Object.values(GENRE_HIERARCHY).filter(genreData =>
      books.some(b => isBookInGenre(b, genreData))
    );
    return list.sort((a, b) => {
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name, resolvedLanguage, { sensitivity: 'base' });
      }
      return a.name.localeCompare(b.name, resolvedLanguage, { sensitivity: 'base' });
    });
  }, [books, sortBy, resolvedLanguage]);

  const matchesBookSearch = useCallback((b: Audiobook, q: string): boolean => {
    if (!q) return true;
    const qNorm = normalizeSearchStr(q);
    if (!qNorm) return true;

    const titleNorm = normalizeSearchStr(b.title);
    if (titleNorm.includes(qNorm)) return true;

    const authorNorm = normalizeSearchStr(b.author);
    if (authorNorm.includes(qNorm)) return true;

    const narratorNorm = normalizeSearchStr(b.narrator);
    if (narratorNorm.includes(qNorm)) return true;

    // Category / Genre
    const catNorm = normalizeSearchStr(b.category);
    if (catNorm.includes(qNorm)) return true;

    const catTranslated = normalizeSearchStr(getGenreName(b.category, resolvedLanguage));
    if (catTranslated.includes(qNorm)) return true;

    // Subgenre
    if (b.subgenre) {
      const subNorm = normalizeSearchStr(b.subgenre);
      if (subNorm.includes(qNorm)) return true;
      const subTranslated = normalizeSearchStr(getSubgenreName(b.subgenre, resolvedLanguage));
      if (subTranslated.includes(qNorm)) return true;
    }

    // Language
    const { language } = resolveNarratorAndLanguage(b);
    if (language) {
      const langNorm = normalizeSearchStr(language);
      if (langNorm.includes(qNorm)) return true;
      const langDisplayName = normalizeSearchStr(getLanguageDisplayName(language, resolvedLanguage));
      if (langDisplayName.includes(qNorm)) return true;
      const langCardName = normalizeSearchStr(getLanguageCardName(language, resolvedLanguage));
      if (langCardName.includes(qNorm)) return true;
    }

    // Author Nationality
    const authorObj = authors.find(a => a.id === b.authorId || (a.name || '').toLowerCase() === (b.author || '').toLowerCase());
    if (authorObj?.nationality) {
      if (matchesNationality(authorObj.nationality, qNorm)) return true;
    }

    return false;
  }, [authors, resolvedLanguage]);

  const filteredBooks = useMemo(() => {
    let result = books.filter(b => {
      const matchesSearch = !searchQuery || matchesBookSearch(b, searchQuery);
      if (!matchesSearch) return false;

      if (statusFilter === 'in-progress') {
        return isBookStarted(b) && !isBookCompleted(b);
      }
      if (statusFilter === 'completed') {
        return isBookCompleted(b);
      }
      if (statusFilter === 'unstarted') {
        return !isBookStarted(b) && !isBookCompleted(b);
      }
      if (statusFilter === 'favorites') {
        return favoriteBookIds.includes(b.id);
      }
      return true;
    });

    return sortBooks(result);
  }, [books, searchQuery, matchesBookSearch, sortBooks, statusFilter, completedChapters, startedChapters, favoriteBookIds, currentBook?.id]);

  interface AllBooksNavGroup {
    id: string;
    title: string;
    navLabel: string;
    books: Audiobook[];
  }

  // Mapeamento fonético / transliteração de letras latinas para Cirílico e Árabe
  const LATIN_TO_CYRILLIC: Record<string, string> = {
    A: 'А', B: 'Б', C: 'К', D: 'Д', E: 'Е', F: 'Ф', G: 'Г', H: 'Х',
    I: 'И', J: 'Ж', K: 'К', L: 'Л', M: 'М', N: 'Н', O: 'О', P: 'П',
    Q: 'К', R: 'Р', S: 'С', T: 'Т', U: 'У', V: 'В', W: 'В', X: 'Х',
    Y: 'И', Z: 'З'
  };

  const LATIN_TO_ARABIC: Record<string, string> = {
    A: 'أ', B: 'ب', C: 'ك', D: 'د', E: 'أ', F: 'ف', G: 'غ', H: 'هـ',
    I: 'أ', J: 'ج', K: 'ك', L: 'ل', M: 'م', N: 'ن', O: 'و', P: 'ب',
    Q: 'ق', R: 'ر', S: 'س', T: 'ت', U: 'أ', V: 'ف', W: 'و', X: 'أ',
    Y: 'ي', Z: 'ز'
  };

  const getAlphabetGroupKey = (title: string, lang: string): { id: string; key: string } => {
    const clean = (title || '').trim().replace(/^["'«»“”‘’()[\]{}—\-_\s.]+/, '');
    if (!clean) return { id: 'symbol', key: '#' };

    // Remove diacríticos do árabe (tashkeel) se houver
    const strippedArabic = clean.replace(/[\u064B-\u065F\u0670\u0640]/g, '');
    if (!strippedArabic) return { id: 'symbol', key: '#' };

    const firstChar = strippedArabic[0];

    // 0. Dígito (0-9 e numerais arábicos/persas)
    if (/[0-9\u0660-\u0669\u06F0-\u06F9]/.test(firstChar)) {
      return { id: 'symbol', key: '#' };
    }

    // 1. Caractere nativo Cirílico (\u0400-\u04FF)
    if (/[\u0400-\u04FF]/.test(firstChar)) {
      const cyr = firstChar.toUpperCase();
      return { id: `cyr-${cyr}`, key: cyr };
    }

    // 2. Caractere nativo Árabe (\u0600-\u06FF)
    if (/[\u0600-\u06FF]/.test(firstChar)) {
      let arChar = firstChar;
      if (/[أإآٱا]/.test(arChar)) arChar = 'أ';
      else if (/[يىئ]/.test(arChar)) arChar = 'ي';
      else if (/[ة]/.test(arChar)) arChar = 'هـ';
      return { id: `ar-${arChar}`, key: arChar };
    }

    // 3. Caractere Latino
    const latinNorm = firstChar.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (/[A-Z]/.test(latinNorm)) {
      if (lang === 'ru') {
        const cyrMapped = LATIN_TO_CYRILLIC[latinNorm] || latinNorm;
        return { id: `cyr-${cyrMapped}`, key: cyrMapped };
      }
      if (lang === 'ar') {
        const arMapped = LATIN_TO_ARABIC[latinNorm] || latinNorm;
        return { id: `ar-${arMapped}`, key: arMapped };
      }
      return { id: `lat-${latinNorm}`, key: latinNorm };
    }

    // 4. Dígito ou símbolo
    return { id: 'symbol', key: '#' };
  };

  const allBooksNavGroups = useMemo<AllBooksNavGroup[]>(() => {
    const filtered = books.filter(b => {
      if (statusFilter === 'in-progress') return isBookStarted(b) && !isBookCompleted(b);
      if (statusFilter === 'completed') return isBookCompleted(b);
      if (statusFilter === 'unstarted') return !isBookStarted(b) && !isBookCompleted(b);
      if (statusFilter === 'favorites') return favoriteBookIds.includes(b.id);
      return true;
    });

    if (sortBy === 'name-asc' || sortBy === 'name-desc') {
      const groupMap = new Map<string, { id: string; key: string; books: Audiobook[] }>();
      filtered.forEach(book => {
        const { id, key } = getAlphabetGroupKey(book.title, resolvedLanguage);
        if (!groupMap.has(key)) {
          groupMap.set(key, { id, key, books: [] });
        }
        groupMap.get(key)!.books.push(book);
      });

      // Ordem: números e símbolos (#) antes da letra A; "Z-A" inverte tudo
      const keyRank = (k: string) => (k === '#' ? 0 : 1);
      const keys = Array.from(groupMap.keys()).sort((a, b) => {
        const rankDiff = keyRank(a) - keyRank(b);
        if (rankDiff !== 0) return sortBy === 'name-asc' ? rankDiff : -rankDiff;
        return sortBy === 'name-asc'
          ? a.localeCompare(b, resolvedLanguage)
          : b.localeCompare(a, resolvedLanguage);
      });

      return keys.map(key => {
        const item = groupMap.get(key)!;
        const groupBooks = item.books.slice().sort((a, b) => {
          return sortBy === 'name-asc'
            ? compareTitles(a.title, b.title, resolvedLanguage)
            : compareTitles(b.title, a.title, resolvedLanguage);
        });
        return {
          id: item.id,
          title: item.key,
          navLabel: item.key,
          books: groupBooks,
        };
      });
    }

    if (sortBy === 'year-desc' || sortBy === 'year-asc') {
      const map = new Map<string, { decadeNum: number; books: Audiobook[] }>();
      const unspecKey = t('year_unspecified');

      filtered.forEach(book => {
        const yearStr = (book.year || '').trim();
        const num = parseInt(yearStr, 10);
        let key: string;
        let decadeNum: number;

        if (!isNaN(num) && num > 0) {
          decadeNum = Math.floor(num / 10) * 10;
          key = `${decadeNum}'s`;
        } else {
          decadeNum = -1;
          key = unspecKey;
        }

        if (!map.has(key)) map.set(key, { decadeNum, books: [] });
        map.get(key)!.books.push(book);
      });

      const keys = Array.from(map.keys()).sort((a, b) => {
        if (a === unspecKey) return 1;
        if (b === unspecKey) return -1;
        const numA = map.get(a)!.decadeNum;
        const numB = map.get(b)!.decadeNum;
        return sortBy === 'year-desc' ? numB - numA : numA - numB;
      });

      return keys.map(key => {
        const item = map.get(key)!;
        const groupBooks = item.books.slice().sort((a, b) => {
          const yearA = parseInt(a.year || '', 10) || 0;
          const yearB = parseInt(b.year || '', 10) || 0;
          if (yearA !== yearB) {
            return sortBy === 'year-desc' ? yearB - yearA : yearA - yearB;
          }
          return compareTitles(a.title, b.title, resolvedLanguage);
        });
        return {
          id: `year-${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
          title: key,
          navLabel: key === unspecKey ? '—' : key,
          books: groupBooks,
        };
      });
    }

    if (sortBy === 'duration-desc' || sortBy === 'duration-asc') {
      const categories = [
        { id: 'dur-under-1h', navLabel: '< 1h', min: 0, max: 3600 },
        { id: 'dur-1-3h', navLabel: '1-3h', min: 3600, max: 10800 },
        { id: 'dur-3-6h', navLabel: '3-6h', min: 10800, max: 21600 },
        { id: 'dur-6-10h', navLabel: '6-10h', min: 21600, max: 36000 },
        { id: 'dur-10-20h', navLabel: '10-20h', min: 36000, max: 72000 },
        { id: 'dur-over-20h', navLabel: '> 20h', min: 72000, max: Infinity },
      ];

      const orderedCategories = sortBy === 'duration-desc' ? [...categories].reverse() : categories;

      const getBookDuration = (b: Audiobook) => (b.chapters || []).reduce((s, c) => s + (c.duration || 0), 0);

      const groups: AllBooksNavGroup[] = [];

      orderedCategories.forEach(cat => {
        const groupBooks = filtered.filter(b => {
          const d = getBookDuration(b);
          return d >= cat.min && d < cat.max;
        }).sort((a, b) => {
          const dA = getBookDuration(a);
          const dB = getBookDuration(b);
          return sortBy === 'duration-desc' ? dB - dA : dA - dB;
        });

        if (groupBooks.length > 0) {
          groups.push({
            id: cat.id,
            title: cat.navLabel,
            navLabel: cat.navLabel,
            books: groupBooks,
          });
        }
      });

      return groups;
    }

    return [];
  }, [books, statusFilter, favoriteBookIds, isBookStarted, isBookCompleted, sortBy, resolvedLanguage, t]);

  // Sincroniza o primeiro item ativo da barra de navegação quando a tela abre ou os grupos mudam
  useEffect(() => {
    if (activeScreen.id === 'library-títulos' && allBooksNavGroups.length > 0) {
      if (!allBooksNavGroups.some(g => g.id === activeAllBooksNavId)) {
        setActiveAllBooksNavId(allBooksNavGroups[0].id);
      }
    }
  }, [activeScreen.id, allBooksNavGroups, activeAllBooksNavId]);

  // Scroll Spy: atualiza a seleção da barra de navegação conforme a rolagem da lista de audiobooks
  useEffect(() => {
    if (activeScreen.id !== 'library-títulos') return;
    const container = mainScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isManualScrollingRef.current) return;
      if (allBooksNavGroups.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const triggerY = containerRect.top + 160;

      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 30) {
        setActiveAllBooksNavId(allBooksNavGroups[allBooksNavGroups.length - 1].id);
        return;
      }

      let currentGroup = allBooksNavGroups[0].id;

      for (let i = 0; i < allBooksNavGroups.length; i++) {
        const g = allBooksNavGroups[i];
        const el = document.getElementById(`group-section-${g.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerY) {
            currentGroup = g.id;
          } else {
            break;
          }
        }
      }

      setActiveAllBooksNavId(prev => (prev !== currentGroup ? currentGroup : prev));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeScreen.id, allBooksNavGroups]);

  // Scroll suave ao clicar em um item da barra de navegação
  const handleScrollToGroup = (groupId: string) => {
    setActiveAllBooksNavId(groupId);
    const container = mainScrollRef.current;
    const target = document.getElementById(`group-section-${groupId}`);
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const targetScrollTop = container.scrollTop + (targetRect.top - containerRect.top) - 80;

    isManualScrollingRef.current = true;
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });

    setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 600);
  };

  // Garante que o item ativo da barra de navegação permaneça visível verticalmente
  useEffect(() => {
    if (activeScreen.id !== 'library-títulos' || !activeAllBooksNavId) return;
    const navBtn = document.getElementById(`nav-item-${activeAllBooksNavId}`);
    if (navBtn) {
      navBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeAllBooksNavId, activeScreen.id]);
  
  const appStyle = {};


  const renderCommentsContent = (book: Audiobook, chapter: Chapter, isMiniplayer: boolean, showBackToOptions = !isMiniplayer, asScreen = false) => {
    const liveBook = books.find(b => b.id === book.id) || book;
    const liveChapter = liveBook.chapters?.find(c => c.id === chapter.id) || chapter;
    const chapComments = liveChapter.bookmarks || liveChapter.comments || [];
    const isChapCompleted = isChapterCompleted(liveBook.id, liveChapter.id);

    const handleSaveComment = () => {
      if (!addingCommentText.trim()) {
        setIsAddingComment(false);
        return;
      }
      const calculatedTimestamp = (isMiniplayer || (currentBook?.id === liveBook.id && currentChapter?.id === liveChapter.id))
        ? Math.max(0, Math.floor(currentTime - liveChapter.startTime))
        : 0;
      const newComment: any = {
        id: Math.random().toString(36).substring(2, 9),
        text: addingCommentText.trim(),
        timestamp: calculatedTimestamp,
        createdAt: Date.now()
      };
      
      setBooks(prevBooks => prevBooks.map(b => {
        if (b.id === liveBook.id) {
          return {
            ...b,
            chapters: b.chapters.map(c => {
              if (c.id === liveChapter.id) {
                const updatedList = [...(c.bookmarks || c.comments || []), newComment];
                return { ...c, comments: updatedList, bookmarks: updatedList };
              }
              return c;
            })
          };
        }
        return b;
      }));
      setCurrentBook(prev => {
        if (prev.id === liveBook.id) {
          return {
            ...prev,
            chapters: prev.chapters.map(c => {
              if (c.id === liveChapter.id) {
                const updatedList = [...(c.bookmarks || c.comments || []), newComment];
                return { ...c, comments: updatedList, bookmarks: updatedList };
              }
              return c;
            })
          };
        }
        return prev;
      });
      setSelectedBook(prev => {
        if (prev?.id === liveBook.id) {
          return {
            ...prev,
            chapters: prev.chapters.map(c => {
              if (c.id === liveChapter.id) {
                const updatedList = [...(c.bookmarks || c.comments || []), newComment];
                return { ...c, comments: updatedList, bookmarks: updatedList };
              }
              return c;
            })
          };
        }
        return prev;
      });
      setAddingCommentText('');
      setIsAddingComment(false);
      showToast(t('toast_bookmark_saved') || t('toast_comment_saved'));
    };

    const handleSaveEditComment = (id: string) => {
      if (!editingCommentText.trim()) {
        setEditingCommentId(null);
        return;
      }
      setBooks(prevBooks => prevBooks.map(b => {
        if (b.id === liveBook.id) {
          return {
            ...b,
            chapters: b.chapters.map(c => {
              if (c.id === liveChapter.id) {
                const updatedList = (c.bookmarks || c.comments || []).map(com => com.id === id ? { ...com, text: editingCommentText.trim() } : com);
                return { ...c, comments: updatedList, bookmarks: updatedList };
              }
              return c;
            })
          };
        }
        return b;
      }));
      setCurrentBook(prev => {
        if (prev.id === liveBook.id) {
          return {
            ...prev,
            chapters: prev.chapters.map(c => {
              if (c.id === liveChapter.id) {
                const updatedList = (c.bookmarks || c.comments || []).map(com => com.id === id ? { ...com, text: editingCommentText.trim() } : com);
                return { ...c, comments: updatedList, bookmarks: updatedList };
              }
              return c;
            })
          };
        }
        return prev;
      });
      setSelectedBook(prev => {
        if (prev?.id === liveBook.id) {
          return {
            ...prev,
            chapters: prev.chapters.map(c => {
              if (c.id === liveChapter.id) {
                const updatedList = (c.bookmarks || c.comments || []).map(com => com.id === id ? { ...com, text: editingCommentText.trim() } : com);
                return { ...c, comments: updatedList, bookmarks: updatedList };
              }
              return c;
            })
          };
        }
        return prev;
      });
      setEditingCommentId(null);
      setEditingCommentText('');
      showToast(t('toast_bookmark_updated') || t('toast_comment_updated'));
    };

    const handleDeleteComment = (id: string) => {
      setBooks(prevBooks => prevBooks.map(b => {
        if (b.id === liveBook.id) {
          return {
            ...b,
            chapters: b.chapters.map(c => {
              if (c.id === liveChapter.id) {
                const updatedList = (c.bookmarks || c.comments || []).filter(com => com.id !== id);
                return { ...c, comments: updatedList, bookmarks: updatedList };
              }
              return c;
            })
          };
        }
        return b;
      }));
      setCurrentBook(prev => {
        if (prev.id === liveBook.id) {
          return {
            ...prev,
            chapters: prev.chapters.map(c => {
              if (c.id === liveChapter.id) {
                const updatedList = (c.bookmarks || c.comments || []).filter(com => com.id !== id);
                return { ...c, comments: updatedList, bookmarks: updatedList };
              }
              return c;
            })
          };
        }
        return prev;
      });
      setSelectedBook(prev => {
        if (prev?.id === liveBook.id) {
          return {
            ...prev,
            chapters: prev.chapters.map(c => {
              if (c.id === liveChapter.id) {
                const updatedList = (c.bookmarks || c.comments || []).filter(com => com.id !== id);
                return { ...c, comments: updatedList, bookmarks: updatedList };
              }
              return c;
            })
          };
        }
        return prev;
      });
      setDeletingCommentId(null);
      showToast(t('toast_bookmark_deleted') || t('toast_comment_deleted'));
    };

    return (
      <div className={asScreen ? "bookmarks-screen flex flex-col w-full" : "flex flex-col overflow-hidden max-h-[380px] w-full"}>
        {!asScreen && <div className="px-3.5 pt-3 pb-1 flex items-center gap-2.5 shrink-0">
          {showBackToOptions && !isMobile && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveChapterMenuMode('options');
              }}
              className="h-7 px-2.5 rounded-full bg-card/75 border border-[var(--text-main)]/10 flex items-center gap-1.5 text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/15 hover:border-black/10 dark:hover:border-white/25 transition-all shrink-0 cursor-pointer text-xs font-semibold"
              title={t('more_options')}
            >
              <ChevronLeft size={14} className="rtl:rotate-180" />
              <span>{t('more_options')}</span>
            </motion.button>
          )}
          <h4 className="text-sm font-bold text-[var(--text-main)] truncate">{t('bookmarks') || t('comments')}</h4>
        </div>}

        <div className={asScreen ? "flex flex-col" : "flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-3.5 pt-1 pb-3.5 flex flex-col"}>
          {/* Adicionar Marcação Block */}
          <SmoothSubMorph
            activeKey={
              isAddingComment
                ? 'adding-comment-form'
                : chapComments.length === 0
                  ? 'add-comment-empty'
                  : 'add-comment-btn'
            }
            direction={isAddingComment ? 1 : -1}
          >
            {!isAddingComment ? (
              <div className="flex flex-col py-1.5 px-1">
                <motion.button 
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => { e.stopPropagation(); setIsAddingComment(true); setAddingCommentText(''); }}
                  className="w-full h-11 border border-dashed border-[var(--text-main)]/20 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-white hover:border-white/35 hover:bg-white/10 hover:shadow-[0_0_14px_rgba(255,255,255,0.22)] transition-[background-color,border-color,color,box-shadow]"
                >
                  <Bookmark size={15} />
                  <span>{t('add_bookmark') || t('add_comment')}</span>
                </motion.button>
                {chapComments.length === 0 && (
                  <div className="pt-3 py-6 text-center text-[var(--text-muted)] text-xs">
                    {t('no_bookmarks_yet') || t('no_comments_yet')}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card/90 p-3.5 rounded-2xl border border-[var(--text-main)]/15 flex flex-col gap-2 mx-0.5 my-1" onClick={e => e.stopPropagation()}>
                <textarea 
                  value={addingCommentText}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setAddingCommentText(e.target.value);
                  }}
                  className="w-full bg-transparent border-none outline-none text-xs text-[var(--text-main)] resize-none h-20 placeholder:text-[var(--text-muted)]/50"
                  placeholder={t('write_bookmark_placeholder') || t('write_comment_placeholder')}
                  autoFocus
                />
                <div className="flex items-center justify-between pt-2 pb-1 px-1">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {addingCommentText.length}/500
                  </span>
                  <div className="flex items-center gap-2.5">
                    <motion.button 
                      whileHover={{ scale: 1.06 }} 
                      whileTap={{ scale: 0.94 }} 
                      onClick={() => { setIsAddingComment(false); setAddingCommentText(''); }} 
                      className="h-7 px-3 rounded-full bg-card/75 border border-[var(--text-main)]/15 shadow-sm text-xs font-semibold text-[var(--text-main)] hover:bg-white/15 hover:border-white/30 hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.22)] flex items-center gap-1 transition-[background-color,border-color,color,box-shadow]"
                    >
                      <X size={12} />
                      <span>{t('cancel')}</span>
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.06 }} 
                      whileTap={{ scale: 0.94 }} 
                      onClick={handleSaveComment} 
                      className="h-7 px-3 rounded-full bg-card/75 border border-winblue/40 shadow-sm text-xs font-semibold text-winblue hover:bg-winblue/15 hover:border-winblue/60 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)] flex items-center gap-1 transition-[background-color,border-color,color,box-shadow]"
                    >
                      <Check size={12} />
                      <span>{t('done')}</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </SmoothSubMorph>

          {/* Lista de Marcações */}
          <AnimatePresence initial={false}>
            {chapComments.map((com: any) => {
              const isEditing = editingCommentId === com.id;
              const isDeleting = deletingCommentId === com.id;
              const commentModeKey = isEditing ? 'edit' : isDeleting ? 'delete' : 'view';
              const commentDir: 1 | -1 = isEditing || isDeleting ? 1 : -1;
              
              let timeStr = '';
              if (com.timestamp !== undefined && com.timestamp >= 0) {
                timeStr = formatTime(com.timestamp);
              } else {
                timeStr = isChapCompleted ? t('comment_after_listening') : t('comment_before_listening');
              }

              return (
                <motion.div
                  key={com.id}
                  initial={{ opacity: 0, height: 0, scale: 0.96 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.96 }}
                  transition={{
                    height: { type: "spring", stiffness: 380, damping: 34, mass: 0.65 },
                    opacity: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                    scale: { type: "spring", stiffness: 400, damping: 32, mass: 0.65 },
                  }}
                  className="overflow-visible shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="pt-3 px-0.5">
                    <div className="relative group bg-card/60 border border-[var(--text-main)]/10 p-3.5 rounded-2xl hover:border-[var(--text-main)]/20 shadow-sm transition-colors overflow-visible">
                      <SmoothSubMorph activeKey={commentModeKey} direction={commentDir}>
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <textarea 
                              value={editingCommentText}
                              onChange={(e) => {
                                if (e.target.value.length <= 500) setEditingCommentText(e.target.value);
                              }}
                              className="w-full bg-transparent border-none outline-none text-xs text-[var(--text-main)] resize-none h-20"
                              autoFocus
                            />
                            <div className="flex items-center justify-between pt-2 pb-1 px-1">
                              <span className="text-[10px] text-[var(--text-muted)]">
                                {editingCommentText.length}/500
                              </span>
                              <div className="flex items-center gap-2.5">
                                <motion.button 
                                  whileHover={{ scale: 1.06 }} 
                                  whileTap={{ scale: 0.94 }} 
                                  onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }} 
                                  className="h-7 px-3 rounded-full bg-card/75 border border-[var(--text-main)]/15 shadow-sm text-xs font-semibold text-[var(--text-main)] hover:bg-white/15 hover:border-white/30 hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.22)] flex items-center gap-1 transition-[background-color,border-color,color,box-shadow]"
                                >
                                  <X size={12} />
                                  <span>{t('cancel')}</span>
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.06 }} 
                                  whileTap={{ scale: 0.94 }} 
                                  onClick={() => handleSaveEditComment(com.id)} 
                                  className="h-7 px-3 rounded-full bg-card/75 border border-winblue/40 shadow-sm text-xs font-semibold text-winblue hover:bg-winblue/15 hover:border-winblue/60 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)] flex items-center gap-1 transition-[background-color,border-color,color,box-shadow]"
                                >
                                  <Check size={12} />
                                  <span>{t('save')}</span>
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        ) : isDeleting ? (
                          <div className="flex flex-col items-center justify-center py-2.5 px-1 gap-3">
                            <span className="text-sm font-bold text-[var(--text-main)]">{t('confirm_delete_bookmark') || t('confirm_delete_comment')}</span>
                            <div className="flex items-center gap-3 py-1 px-2">
                              <motion.button 
                                whileHover={{ scale: 1.06 }} 
                                whileTap={{ scale: 0.94 }} 
                                onClick={() => handleDeleteComment(com.id)} 
                                className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-sm hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 transition-[background-color,border-color,color,box-shadow] font-semibold text-xs flex items-center gap-1.5"
                              >
                                <Trash2 size={13} />
                                <span>{t('delete')}</span>
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.06 }} 
                                whileTap={{ scale: 0.94 }} 
                                onClick={() => setDeletingCommentId(null)} 
                                className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/15 shadow-sm hover:bg-white/15 hover:border-white/30 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.22)] text-[var(--text-main)] transition-[background-color,border-color,color,box-shadow] font-semibold text-xs flex items-center gap-1.5"
                              >
                                <X size={13} />
                                <span>{t('cancel')}</span>
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              {com.timestamp !== undefined && com.timestamp >= 0 ? (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.94 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleJumpToComment(liveBook, liveChapter, com.timestamp);
                                  }}
                                  className="h-6 px-2.5 rounded-full bg-winblue/15 hover:bg-winblue/25 text-winblue hover:text-winblue border border-winblue/30 hover:border-winblue/50 shadow-sm hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.35)] flex items-center gap-1.5 text-[10px] font-bold transition-all cursor-pointer group/timebtn"
                                  title={t('jump_to_timestamp')}
                                >
                                  <Play size={10} className="fill-current text-winblue group-hover/timebtn:scale-110 transition-transform" />
                                  <span>{timeStr}</span>
                                </motion.button>
                              ) : (
                                <span className="text-[10px] font-bold text-winblue bg-winblue/10 border border-winblue/20 px-2 py-0.5 rounded-full">{timeStr}</span>
                              )}
                              
                              {/* Botoes redondos de editar e excluir com destaque, contorno, sombra, crescer e brilhar */}
                              <div className="flex items-center gap-2 py-1 px-1.5 -my-0.5 -mr-0.5">
                                <motion.button 
                                  whileHover={{ scale: 1.12 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => { setDeletingCommentId(null); setEditingCommentId(com.id); setEditingCommentText(com.text); }} 
                                  className="w-7 h-7 rounded-full bg-card/75 border border-[var(--text-main)]/15 shadow-sm flex items-center justify-center text-[var(--text-main)] hover:bg-white/15 hover:border-white/30 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] transition-[background-color,border-color,color,box-shadow]"
                                  title={t('edit_bookmark') || t('edit_comment')}
                                >
                                  <Edit3 size={12} />
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.12 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    if (isMobile || isTouchDevice) {
                                      setMobileConfirm({
                                        title: t('confirm_delete_bookmark') || t('confirm_delete_comment'),
                                        description: com.text,
                                        confirmLabel: t('delete'),
                                        onConfirm: () => handleDeleteComment(com.id),
                                      });
                                      return;
                                    }
                                    setDeletingCommentId(com.id);
                                  }}  
                                  className="w-7 h-7 rounded-full bg-card/75 border border-red-500/20 shadow-sm flex items-center justify-center text-red-500 hover:bg-red-500/15 hover:border-red-500/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-[background-color,border-color,color,box-shadow]"
                                  title={t('delete_bookmark') || t('delete_comment')}
                                >
                                  <Trash2 size={12} />
                                </motion.button>
                              </div>
                            </div>
                            <p className="text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-wrap pr-1">{com.text}</p>
                          </div>
                        )}
                      </SmoothSubMorph>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  };


  // Mobile: os pop-ups dos controles abaixo do player nascem do próprio botão e ocupam a área da linha
  // de botões (crescendo para cima), por cima de tudo. Posição relativa ao botão (evita contêineres com transform).
  const fsRowPopupProps = (controlId: string): Record<string, any> => {
    if (!isMobile || typeof document === 'undefined') return {};
    const row = document.querySelector('[data-fs-ctrl-row]');
    const btn = document.querySelector(`[data-fs-ctrl="${controlId}"]`);
    if (!row || !btn) return {};
    const r = row.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const width = Math.min(vw - 32, Math.max(r.width, 320));
    const left = Math.max(16, Math.min(r.left + r.width / 2 - width / 2, vw - 16 - width));
    return {
      style: {
        position: 'absolute',
        left: left - b.left,
        right: 'auto',
        top: 'auto',
        bottom: b.bottom - r.bottom,
        width,
        maxHeight: Math.max(160, r.bottom - 24),
        zIndex: 9999,
        transformOrigin: `${b.left - left + b.width / 2}px bottom`,
      },
      originWidth: b.width,
      originHeight: b.height,
      originOffsetX: b.left - left,
      openUp: true,
      alignRight: false,
    };
  };

  const renderFullScreenHeaderControls = (group: 'all' | 'header' | 'row' = 'all') => (
    <div
      className={cn("flex items-center gap-2.5 pointer-events-auto", group === 'row' && "justify-center")}
      {...(group === 'row' ? { 'data-fs-ctrl-row': 'true' } : {})}
    >
      {group !== 'header' && (<>
      {/* 1. MARCAÇÕES */}
      <div data-fs-ctrl="comments" className={`relative w-9 h-9 shrink-0 ${showCommentsPopover ? 'z-50' : 'z-10'}`}>
        <motion.button 
          key="btn-fs-comments"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          animate={morphTriggerAnimate(showCommentsPopover)}
          onClick={(e) => { 
            e.stopPropagation(); 
            if (useFullScreenSheets) {
              // Marcações exigem digitação: abrem num submenu em tela cheia (adaptado ao teclado)
              openMobileSheet({ kind: 'bookmarks', bookId: currentBook.id, chapterId: currentChapter.id });
              return;
            }
            const p = showCommentsPopover; 
            closeAllPopups(); 
            setShowCommentsPopover(!p); 
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all relative"
          title={t('chapter_bookmarks') || t('chapter_comments') || t('comments')}
        >
          <Bookmark size={14} />
          {((currentChapter.bookmarks && currentChapter.bookmarks.length > 0) || (currentChapter.comments && currentChapter.comments.length > 0)) && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--text-main)] text-[9px] font-bold text-[var(--bg-card)] flex items-center justify-center shadow-md">
              {currentChapter.bookmarks?.length || currentChapter.comments?.length}
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {showCommentsPopover && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(() => setShowCommentsPopover(false))}
              />
              <PlayerPopup originWidth={36} originHeight={36} 
                key="menu-fs-comments"
                data-popup-content="true"
                style={{ transformOrigin: "top right" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl p-3 z-50 flex flex-col text-[var(--text-main)] max-h-[460px] overflow-hidden"
              
                {...fsRowPopupProps('comments')}
              >
                <div className="relative z-10 flex flex-col min-h-0 overflow-hidden">
                  {renderCommentsContent(currentBook, currentChapter, true)}
                </div>
              </PlayerPopup>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 2. VELOCIDADE DE REPRODUÇÃO */}
      <div data-fs-ctrl="speed" className={`relative w-9 h-9 shrink-0 ${showSpeedMenu ? 'z-50' : 'z-10'}`}>
        <motion.button 
          key="btn-fs-speed"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          animate={morphTriggerAnimate(showSpeedMenu)}
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showSpeedMenu; 
            closeAllPopups(); 
            setShowSpeedMenu(!p); 
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all"
          title={`${t('speed')} (${playbackSpeed}x)`}
        >
          <Gauge size={14} />
        </motion.button>

        <AnimatePresence>
          {showSpeedMenu && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(() => setShowSpeedMenu(false))}
              />
              <PlayerPopup originWidth={36} originHeight={36} 
                key="menu-fs-speed"
                data-popup-content="true"
                style={{ transformOrigin: "top right" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 w-56 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl p-2 z-50 flex flex-col text-[var(--text-main)] overflow-hidden"
              
                {...fsRowPopupProps('speed')}
              >
                <div className="relative z-10 flex flex-col">
                  <div className="px-3 py-2 mb-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text-main)]">{t('playback_speed')}</span>
                  </div>
                  <PagedMenu className="flex flex-col">{[0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => {
                    const isSelected = playbackSpeed === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleSelectSpeed(s)}
                        className={`relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 border border-transparent group ${
                          isSelected
                            ? 'hover:bg-winblue/25 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)]'
                            : 'hover:bg-black/5 dark:hover:bg-white/15 hover:border-black/10 dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="fs-speed-active-pill"
                            className="absolute inset-0 bg-winblue/15 border border-winblue rounded-2xl shadow-[0_0_10px_rgba(var(--winblue-rgb),0.2)] pointer-events-none z-0"
                            transition={{ type: "spring", stiffness: 540, damping: 36, mass: 0.55 }}
                          />
                        )}
                        <div className="relative z-10 flex items-center gap-2.5">
                          <span className={`${isSelected ? 'text-winblue' : 'text-[var(--text-main)] dark:group-hover:text-white'} transition-colors shrink-0`}>
                            {getSpeedIcon(s)}
                          </span>
                          <span className={`transition-colors ${isSelected ? 'text-winblue font-bold' : 'text-[var(--text-main)] dark:group-hover:text-white'}`}>
                            {s === 1 ? '1x (Normal)' : `${s}x`}
                          </span>
                        </div>
                        {isSelected && (
                          <motion.div
                            layoutId="fs-speed-active-check"
                            className="relative z-10 text-winblue shrink-0"
                            transition={{ type: "spring", stiffness: 540, damping: 36, mass: 0.55 }}
                          >
                            <BsCheck2 size={16} />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}</PagedMenu>
                </div>
              </PlayerPopup>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 2. TIMER DE SONO */}
      <div data-fs-ctrl="sleep" className={`relative w-9 h-9 shrink-0 ${showSleepTimerMenu ? 'z-50' : 'z-10'}`}>
        <motion.button 
          key="btn-fs-sleep"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          animate={morphTriggerAnimate(showSleepTimerMenu)}
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showSleepTimerMenu; 
            closeAllPopups(); 
            setShowSleepTimerMenu(!p); 
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all shadow-xl backdrop-blur-3xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] relative"
          title={sleepTimerMode ? t('sleep_timer_active', { time: formatCountdown(sleepTimerMode === 'end-of-chapter' ? Math.max(0, currentChapter.duration - chapterElapsed) : (sleepTimerRemaining || 0)) }) : t('sleep_timer')}
        >
          <Moon size={14} />
          {sleepTimerMode !== null && (
            <motion.span
              animate={{ scale: [1, 0.6, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-1 -right-1 w-[16px] h-[16px] rounded-full bg-[var(--text-main)] shadow-md"
            />
          )}
        </motion.button>

        <AnimatePresence>
          {showSleepTimerMenu && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(() => setShowSleepTimerMenu(false))}
              />
              <PlayerPopup originWidth={36} originHeight={36} 
                key="menu-fs-sleep"
                data-popup-content="true"
                style={{ transformOrigin: "top right" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 w-64 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl p-2 overflow-hidden z-50 flex flex-col text-[var(--text-main)]"
              
                {...fsRowPopupProps('sleep')}
              >
                <div className="relative z-10 flex flex-col">
                  <div className="px-3 py-2 mb-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text-main)]">{t('sleep_timer')}</span>
                  </div>

                  <SmoothSubMorph
                    activeKey={sleepTimerMode !== null ? 'fs-sleep-active' : 'fs-sleep-presets'}
                    direction={sleepTimerMode !== null ? 1 : -1}
                  >
                    {sleepTimerMode !== null ? (
                      <div className="p-1 flex flex-col items-center">
                        <div className="w-full py-3 px-2 flex flex-col items-center justify-center my-0.5">
                          <span className={`text-3xl font-bold tracking-widest transition-opacity ${isSleepTimerPaused ? 'opacity-60 text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>
                            {formatCountdown(
                              sleepTimerMode === 'end-of-chapter'
                                ? Math.max(0, currentChapter.duration - chapterElapsed)
                                : (sleepTimerRemaining || 0)
                            )}
                          </span>
                          <span className="text-[13px] font-medium text-[var(--text-muted)] mt-1.5 text-center px-2">
                            {isSleepTimerPaused
                              ? t('sleep_timer_paused')
                              : t('sleep_timer_auto_off')}
                          </span>
                        </div>

                        <div className="w-full flex items-center gap-2 mt-2">
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              setIsSleepTimerPaused(!isSleepTimerPaused);
                              showToast(!isSleepTimerPaused ? t('sleep_timer_paused') : t('sleep_timer_resume'));
                            }}
                            className="flex-1 py-2.5 px-3 rounded-full text-xs font-semibold bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/15 shadow-md hover:bg-white/15 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all flex items-center justify-center gap-1.5"
                          >
                            {isSleepTimerPaused ? <Play size={14} /> : <Pause size={14} />}
                            <span>{isSleepTimerPaused ? t('sleep_timer_resume') : t('sleep_timer_pause')}</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              setSleepTimerRemaining(null);
                              setSleepTimerMode(null);
                              setIsSleepTimerPaused(false);
                              setShowSleepTimerMenu(false);
                              showToast(t('sleep_timer_canceled'));
                            }}
                            className="flex-1 py-2.5 px-3 rounded-full text-xs font-semibold bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/15 shadow-md hover:bg-white/15 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all flex items-center justify-center gap-1.5"
                          >
                            <X size={14} />
                            <span>{t('cancel')}</span>
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <button
                          onClick={() => {
                            setSleepTimerMode('end-of-chapter');
                            setSleepTimerRemaining(Math.max(1, currentChapter.duration - chapterElapsed));
                            setIsSleepTimerPaused(false);
                            setShowSleepTimerMenu(false);
                            showToast(t('sleep_timer_until_end'));
                          }}
                          className="relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 border border-transparent group hover:bg-black/5 dark:hover:bg-white/15 hover:border-black/10 dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                        >
                          <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                            <span className="text-[var(--text-main)] dark:group-hover:text-white transition-colors shrink-0">
                              <Bookmark size={14} />
                            </span>
                            <span className="text-[var(--text-main)] dark:group-hover:text-white transition-colors truncate">
                              {t('sleep_timer_until_end')}
                            </span>
                          </div>
                          <span className="relative z-10 text-[10px] text-[var(--text-muted)] dark:group-hover:text-white/80 shrink-0 ml-1 transition-colors">
                            {formatTime(chapterRemaining)}
                          </span>
                        </button>

                        {[15, 30, 45, 60, 90, 120].map((mins) => (
                          <button
                            key={mins}
                            onClick={() => {
                              setSleepTimerMode('duration');
                              setSleepTimerRemaining(mins * 60);
                              setIsSleepTimerPaused(false);
                              setShowSleepTimerMenu(false);
                              showToast(t('sleep_timer_mins', { mins }));
                            }}
                            className="relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 border border-transparent group hover:bg-black/5 dark:hover:bg-white/15 hover:border-black/10 dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                          >
                            <div className="relative z-10 flex items-center gap-2.5">
                              <span className="text-[var(--text-main)] dark:group-hover:text-white transition-colors shrink-0">
                                {getSleepTimerIcon(mins)}
                              </span>
                              <span className="text-[var(--text-main)] dark:group-hover:text-white transition-colors">
                                {t('sleep_timer_mins', { mins })}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </SmoothSubMorph>
                </div>
              </PlayerPopup>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 3. FILA DE REPRODUÇÃO */}
      <div data-fs-ctrl="queue" className={`relative w-9 h-9 shrink-0 ${showQueuePopup ? 'z-50' : 'z-10'}`}>
        <motion.button 
          key="btn-fs-queue"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          animate={showQueuePopup 
            ? morphTriggerAnimate(true) 
            : (isQueuePulse 
              ? { scale: [1, 1.14, 1] } 
              : morphTriggerAnimate(false)
            )
          }
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showQueuePopup; 
            closeAllPopups(); 
            setShowQueuePopup(!p); 
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all overflow-hidden relative"
          title={t('queue')}
        >
          <AnimatePresence mode="wait" initial={false}>
            {queueAddedAnim ? (
              <motion.div
                key={`fs-q-cov-${queueAddedAnim.key}`}
                initial={{ scale: 0.25, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 460, damping: 28, mass: 0.6 }}
                className="pointer-events-none flex items-center justify-center w-[14px] h-[22px] relative shrink-0"
              >
                {queueAddedAnim.isBook ? (
                  <div className="relative w-[14px] h-[22px] pointer-events-none">
                    <img
                      src={queueAddedAnim.cover}
                      alt=""
                      className="absolute top-0 right-0 w-[14.5px] h-[22.5px] aspect-[1/1.6] rounded-[3px] object-cover opacity-80 brightness-75 border border-white/25 shadow-sm translate-x-[1px] -translate-y-[0.5px] rotate-[6deg]"
                    />
                    <img
                      src={queueAddedAnim.cover}
                      alt=""
                      className="absolute bottom-0 left-0 w-[14.5px] h-[22.5px] aspect-[1/1.6] rounded-[3px] object-cover border border-white/35 shadow-md"
                    />
                  </div>
                ) : (
                  <img
                    src={queueAddedAnim.cover}
                    alt=""
                    className="w-[14px] h-[22px] aspect-[1/1.6] rounded-[4px] object-cover border border-white/30 shadow-md pointer-events-none"
                  />
                )}
              </motion.div>
            ) : (
              <motion.span
                key="fs-q-icon"
                initial={{ scale: 0.25, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.25, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 480, damping: 28, mass: 0.6 }}
                className="pointer-events-none flex items-center justify-center"
              >
                <ListMusic size={14} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <AnimatePresence>
          {showQueuePopup && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(() => setShowQueuePopup(false))}
              />
              <PlayerPopup originWidth={36} originHeight={36} 
                key="menu-fs-queue"
                data-popup-content="true"
                style={{ transformOrigin: "top right" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl p-3.5 z-50 flex flex-col max-h-[420px] text-[var(--text-main)] overflow-hidden"
              
                {...fsRowPopupProps('queue')}
              >
                <div className="relative z-10 flex flex-col min-h-0 max-h-[392px] overflow-hidden">
                  <div className="px-3 py-2 mb-1 flex items-center justify-between pb-2 shrink-0">
                    <span className="text-sm font-bold text-[var(--text-main)]">{t('queue')}</span>
                  </div>

                  <div 
                    ref={fsQueueScrollRef}
                    className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col px-1.5 mt-1"
                  >
                    {/* TOCANDO AGORA */}
                    <div ref={fsNowPlayingRef} className="shrink-0">
                      <div 
                        onClick={() => {
                          setIsPlaying(true);
                        }}
                        className="group relative flex items-center gap-3 p-2 rounded-2xl bg-winblue/10 border border-winblue/25 cursor-pointer hover:bg-winblue/15 transition-all shadow-sm"
                        title={t('play') || 'Reproduzir'}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={currentBook.cover || getGenericBookCover(currentBook.title, currentBook.author)}
                            onError={(e) => handleBookCoverError(currentBook, e)}
                            alt=""
                            className="w-7 h-11 aspect-[1/1.6] rounded-lg object-cover shadow-sm"
                          />
                          <div className="absolute inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center rounded-lg">
                            <div className="relative flex items-center justify-center">
                              {/* Brilho luminoso: cinza no modo claro, branco no modo escuro */}
                              <div className="absolute w-4 h-4 rounded-full bg-slate-400/80 dark:bg-white/60 blur-[5px] pointer-events-none" />
                              <div className="relative z-10 flex items-end justify-center h-3 gap-[2px] w-4">
                                <span className={`w-[2px] bg-black dark:bg-white rounded-full drop-shadow-[0_0_4px_rgba(100,116,139,0.85)] dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] ${isPlaying ? 'audio-bar-1' : 'h-2'}`} />
                                <span className={`w-[2px] bg-black dark:bg-white rounded-full drop-shadow-[0_0_4px_rgba(100,116,139,0.85)] dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] ${isPlaying ? 'audio-bar-2' : 'h-3'}`} />
                                <span className={`w-[2px] bg-black dark:bg-white rounded-full drop-shadow-[0_0_4px_rgba(100,116,139,0.85)] dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] ${isPlaying ? 'audio-bar-3' : 'h-1.5'}`} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 overflow-hidden min-w-0">
                          <p 
                            onClick={(e) => {
                              e.stopPropagation();
                              pendingChapterScrollRef.current = true;
                              targetScrollChapterIdRef.current = `${currentBook.id}-${currentChapter.id}`;
                              setSelectedBook(currentBook);
                              setShouldScrollToCurrentChapter(Date.now());
                              navigateTo('book-detail', currentBook);
                              setShowQueuePopup(false);
                              setIsFullScreen(false);
                            }}
                            className="text-xs font-bold text-winblue truncate w-fit max-w-full hover:underline cursor-pointer transition-colors"
                            title={t('view_chapter_in_book')}
                          >
                            {currentChapter.title}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{currentBook.title} • {currentBook.author}</p>
                        </div>
                        <span className="text-[10px] text-winblue font-semibold mr-1 shrink-0 pointer-events-none">
                          {formatTime(chapterElapsed)}
                        </span>
                      </div>
                    </div>

                    {/* PRÓXIMOS CAPÍTULOS */}
                    <Reorder.Group axis="y" values={playbackQueue} onReorder={setPlaybackQueue} className="flex flex-col shrink-0">
                      <AnimatePresence initial={false}>
                        {playbackQueue.map((item) => (
                          <QueueItemRow 
                            key={item.id}
                            item={item}
                            formatTime={formatTime}
                            onPlay={() => {
                              beginBookSwitch(item.book);
                              setCurrentBook(item.book);
                              setSelectedBook(item.book);
                              handleSeek(item.startTime + (getChapterResumeElapsed(item.bookId || item.book?.id, (item.book?.chapters || booksRef.current.find(b => b.id === (item.bookId || item.book?.id))?.chapters || []).find((c: Chapter) => c.id === item.chapterId)) || 0));
                              setIsPlaying(true);
                              setPlaybackQueue(prev => {
                                const curIdx = prev.findIndex(it => it.id === item.id);
                                return curIdx !== -1 ? prev.slice(curIdx + 1) : prev;
                              });
                              // A fila continua aberta: só atualiza o que está tocando
                              if (!isMobile && !isTouchDevice) setShowQueuePopup(false);
                            }}
                            onRemove={() => {
                              setPlaybackQueue(prev => prev.filter(it => it.id !== item.id));
                            }}
                            onViewBook={() => {
                              pendingChapterScrollRef.current = true;
                              targetScrollChapterIdRef.current = `${item.bookId || item.book?.id}-${item.chapterId}`;
                              setSelectedBook(item.book);
                              setShouldScrollToCurrentChapter(Date.now());
                              navigateTo('book-detail', item.book);
                              setShowQueuePopup(false);
                              setIsFullScreen(false);
                            }}
                            t={t}
                          />
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>
                  </div>
                </div>
              </PlayerPopup>
            </>
          )}
        </AnimatePresence>
      </div>



      {/* 5. VOLUME */}
      <div data-fs-ctrl="volume" className={`relative w-9 h-9 shrink-0 ${showVolumePopup ? 'z-50' : 'z-10'}`}>
        <motion.button 
          key="btn-fs-vol"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          animate={morphTriggerAnimate(showVolumePopup)}
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showVolumePopup; 
            closeAllPopups(); 
            setShowVolumePopup(!p); 
          }} 
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all shadow-xl backdrop-blur-3xl ${
            isMuted || volume === 0
              ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.35)]'
              : 'bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]'
          }`}
          title={isMuted || volume === 0 ? t('mute_click_to_open') : t('volume')}
        >
          {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </motion.button>

        <AnimatePresence>
          {showVolumePopup && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(() => setShowVolumePopup(false))}
              />
              <PlayerPopup originWidth={36} originHeight={36} 
                key="menu-fs-vol"
                data-popup-content="true"
                style={{ transformOrigin: "top right" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 w-64 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl p-3.5 z-50 flex flex-col gap-3 text-[var(--text-main)] overflow-hidden"
              
                {...fsRowPopupProps('volume')}
              >
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="px-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text-main)]">{t('volume')}</span>
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap px-1">
                    <button 
                      onClick={() => setIsMuted(!isMuted)} 
                      className="text-[var(--text-main)] hover:text-winblue dark:hover:text-white transition-colors shrink-0"
                      title={isMuted ? t('unmute') : t('mute')}
                    >
                      {isMuted || volume === 0 ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
                    </button>
                    <div className="relative flex-1 min-w-0 flex items-center group">
                      <input 
                        type="range" 
                        min={0} 
                        max={1} 
                        step={0.01} 
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          setVolume(Number(e.target.value));
                          setIsMuted(false);
                        }}
                        style={{
                          background: `linear-gradient(to right, var(--slider-current-fill, var(--slider-fill)) ${(isMuted ? 0 : volume) * 100}%, var(--slider-track) ${(isMuted ? 0 : volume) * 100}%)`
                        }}
                        className="w-full apple-slider"
                      />
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-main)] w-8 text-left shrink-0">
                      {Math.round((isMuted ? 0 : volume) * 100)}%
                    </span>
                  </div>
                </div>
              </PlayerPopup>
            </>
          )}
        </AnimatePresence>
      </div>

      </>)}
      {group !== 'row' && (<>
      {/* 6. BOTÃO DE TEXTO / ADICIONAR TEXTO (MAIS À DIREITA) */}
      <div
        className={`relative w-9 h-9 shrink-0 ${showAddTextPopup ? 'z-50' : 'z-10'}`}
        style={{
          '--winblue': currentBookHighlight.hex,
          '--winblue-rgb': currentBookHighlight.rgb,
          '--color-winblue': currentBookHighlight.hex,
          '--book-accent': currentBookHighlight.hex,
          '--book-accent-rgb': currentBookHighlight.rgb,
        } as React.CSSProperties}
      >
        <input
          ref={addTextInputRef}
          type="file"
          accept=".epub,.json,.xml,.smil,.smi,.ts,.vtt,.srt,.lrc"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleUploadTranscriptForPlayerBook(file);
            }
            e.target.value = '';
          }}
        />
        <AnimatePresence mode="wait" initial={false}>
          {hasTranscript ? (
            <motion.button 
              key="btn-fs-text"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowTranscript(prev => !prev)}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all shadow-xl backdrop-blur-3xl ${
                showTranscript 
                  ? 'bg-winblue/20 border border-winblue/45 text-winblue shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] hover:bg-winblue/30 hover:border-winblue/70 hover:shadow-[0_0_20px_rgba(var(--winblue-rgb),0.5)]' 
                  : 'bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]'
              }`}
              title={showTranscript ? t('hide_text') : t('show_text')}
            >
              <Text size={14} />
            </motion.button>
          ) : (
            <motion.button 
              key="btn-fs-add-text"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.92 }}
              animate={morphTriggerAnimate(showAddTextPopup)}
              onClick={(e) => {
                e.stopPropagation();
                const p = showAddTextPopup;
                closeAllPopups();
                setShowAddTextPopup(!p);
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] transition-all shadow-xl cursor-pointer"
              title={t('add_text')}
            >
              <FilePlus2 size={14} />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAddTextPopup && !hasTranscript && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(() => setShowAddTextPopup(false))}
              />
              <PlayerPopup inPlace originWidth={36} originHeight={36} 
                key="menu-fs-add-text"
                data-popup-content="true"
                style={{ transformOrigin: "top right" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 w-80 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl p-3.5 z-50 flex flex-col gap-2 text-[var(--text-main)] overflow-hidden"
              >
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="px-2 pt-1 pb-0.5 flex flex-col">
                    <span className="text-sm font-bold text-[var(--text-main)]">{t('upload_synced_text_title')}</span>
                  </div>

                  {/* Uma única opção: aceita todos os formatos de texto suportados */}
                  <div className="flex flex-col gap-1 mt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (addTextInputRef.current) {
                          addTextInputRef.current.accept = '.epub,.json,.xml,.smil,.smi,.ts,.vtt,.srt,.lrc';
                          addTextInputRef.current.click();
                        }
                      }}
                      className="relative w-full flex items-center justify-between gap-3 px-3 py-2.5 text-xs font-semibold rounded-2xl select-none transition-all duration-150 border border-transparent group hover:bg-white/15 hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[var(--text-main)] group-hover:text-white shrink-0">
                          <Upload size={15} />
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[var(--text-main)] group-hover:text-white transition-colors">
                            {t('upload_text_file')}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] group-hover:text-white/75 font-normal leading-snug mt-0.5">
                            EPUB, JSON, XML/SMIL, TS, VTT, SRT, LRC
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </PlayerPopup>
            </>
          )}
        </AnimatePresence>
      </div>
      </>)}
    </div>
  );

  const renderSecondaryControls = (isFullScreenMode: boolean) => (
    <div className={isFullScreenMode ? "flex items-center justify-center gap-8 mt-10 w-full relative" : "shrink-0 flex items-center gap-1.5"}>
      {/* 0. BOTAO DE MARCACOES NO MINIPLAYER */}
      <div className={`relative ${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} shrink-0 ${showCommentsPopover ? 'z-50' : 'z-10'}`}>
        <motion.button 
          ref={miniCommentsBtnRef}
          key="btn-mini-comments"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          animate={morphTriggerAnimate(showCommentsPopover)}
          onClick={(e) => { 
            e.stopPropagation(); 
            if (useFullScreenSheets) {
              // Marcações exigem digitação: abrem num submenu em tela cheia (adaptado ao teclado)
              openMobileSheet({ kind: 'bookmarks', bookId: currentBook.id, chapterId: currentChapter.id });
              return;
            }
            const p = showCommentsPopover; 
            closeAllPopups(); 
            if (!p) {
              setMiniCommentsBtnAnchor(e.currentTarget);
              setShowCommentsPopover(true);
            }
          }} 
          className={`${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm relative shrink-0`}
          title={t('chapter_bookmarks') || t('chapter_comments')}
        >
          <Bookmark size={isFullScreenMode ? 16 : 13} />
          {((currentChapter.bookmarks && currentChapter.bookmarks.length > 0) || (currentChapter.comments && currentChapter.comments.length > 0)) && (
            <span className="absolute -top-1 -right-1 min-w-[12px] h-[12px] px-0.5 rounded-full bg-[var(--text-main)] text-[7.5px] font-bold text-[var(--bg-card)] flex items-center justify-center shadow-md">
              {currentChapter.bookmarks?.length || currentChapter.comments?.length}
            </span>
          )}
        </motion.button>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {showCommentsPopover && (
              <>
                <div 
                  className="fixed inset-0 z-[9998] cursor-default" 
                  {...getBackdropProps(() => {
                    setShowCommentsPopover(false);
                    clearButtonCoverAnchorCache(miniCommentsBtnAnchor);
                    setMiniCommentsBtnAnchor(null);
                  })}
                />
                <PlayerPopup anchor={miniCommentsBtnAnchor || miniCommentsBtnRef.current} 
                  key="menu-mini-comments"
                  data-popup-content="true"
                  style={getButtonCoverPopupStyle(
                    miniCommentsBtnAnchor || miniCommentsBtnRef.current,
                    Math.min(typeof window !== 'undefined' && window.innerWidth < 640 ? 256 : 307, typeof window !== 'undefined' ? window.innerWidth - 32 : 307),
                    368,
                    'right'
                  )}
                  onClick={(e) => e.stopPropagation()}
                  className="w-64 sm:w-80 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl z-[9999] p-2.5 flex flex-col text-[var(--text-main)] max-h-[368px] overflow-hidden text-left"
                >
                  <div className="relative z-10 flex flex-col min-h-0 overflow-hidden">
                    {renderCommentsContent(currentBook, currentChapter, true)}
                  </div>
                </PlayerPopup>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* 1. VELOCIDADE DE REPRODUÇÃO */}
      <div className={`relative ${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} shrink-0 ${showSpeedMenu ? 'z-50' : 'z-10'}`}>
        <motion.button 
          ref={miniSpeedBtnRef}
          key="btn-mini-speed"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          animate={morphTriggerAnimate(showSpeedMenu)}
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showSpeedMenu; 
            closeAllPopups(); 
            if (!p) {
              setMiniSpeedBtnAnchor(e.currentTarget);
              setShowSpeedMenu(true);
            }
          }} 
          className={`${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm shrink-0`}
          title={t('playback_speed_title', { speed: playbackSpeed })}
        >
          <Gauge size={isFullScreenMode ? 16 : 13} />
        </motion.button>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {showSpeedMenu && (
              <>
                <div 
                  className="fixed inset-0 z-[9998] cursor-default" 
                  {...getBackdropProps(() => {
                    setShowSpeedMenu(false);
                    clearButtonCoverAnchorCache(miniSpeedBtnAnchor);
                    setMiniSpeedBtnAnchor(null);
                  })}
                />
                <PlayerPopup anchor={miniSpeedBtnAnchor || miniSpeedBtnRef.current} 
                  key="menu-mini-speed"
                  data-popup-content="true"
                  style={getButtonCoverPopupStyle(miniSpeedBtnAnchor || miniSpeedBtnRef.current, 224, 224, 'right')}
                  onClick={(e) => e.stopPropagation()}
                  className="w-56 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl z-[9999] p-2 flex flex-col text-left overflow-hidden text-[var(--text-main)]"
                >
                  <div className="relative z-10 flex flex-col">
                    <div className="px-3 py-2 mb-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-[var(--text-main)]">{t('playback_speed')}</span>
                    </div>
                    <PagedMenu className="flex flex-col">{[0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => {
                      const isSelected = playbackSpeed === s;
                      return (
                        <button
                          key={s}
                          onClick={() => handleSelectSpeed(s)}
                          className={`relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 border border-transparent group ${
                            isSelected
                              ? 'hover:bg-winblue/25 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)]'
                              : 'hover:bg-black/5 dark:hover:bg-white/15 hover:border-black/10 dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="mini-speed-active-pill"
                              className="absolute inset-0 bg-winblue/15 border border-winblue rounded-2xl shadow-[0_0_10px_rgba(var(--winblue-rgb),0.2)] pointer-events-none z-0"
                              transition={{ type: "spring", stiffness: 540, damping: 36, mass: 0.55 }}
                            />
                          )}
                          <div className="relative z-10 flex items-center gap-2.5">
                            <span className={`${isSelected ? 'text-winblue' : 'text-[var(--text-main)] dark:group-hover:text-white'} transition-colors shrink-0`}>
                              {getSpeedIcon(s)}
                            </span>
                            <span className={`transition-colors ${isSelected ? 'text-winblue font-bold' : 'text-[var(--text-main)] dark:group-hover:text-white'}`}>
                              {s === 1 ? t('normal_speed_label') : `${s}x`}
                            </span>
                          </div>
                          {isSelected && (
                            <motion.div
                              layoutId="mini-speed-active-check"
                              className="relative z-10 text-winblue shrink-0"
                              transition={{ type: "spring", stiffness: 540, damping: 36, mass: 0.55 }}
                            >
                              <BsCheck2 size={16} />
                            </motion.div>
                          )}
                        </button>
                      );
                    })}</PagedMenu>
                  </div>
                </PlayerPopup>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* 2. TIMER DE SONO */}
      <div className={`relative ${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} shrink-0 ${showSleepTimerMenu ? 'z-50' : 'z-10'}`}>
        <motion.button 
          ref={miniSleepBtnRef}
          key="btn-mini-sleep"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          animate={morphTriggerAnimate(showSleepTimerMenu)}
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showSleepTimerMenu; 
            closeAllPopups(); 
            if (!p) {
              setMiniSleepBtnAnchor(e.currentTarget);
              setShowSleepTimerMenu(true);
            }
          }} 
          className={`${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} flex items-center justify-center rounded-full transition-all shadow-sm shrink-0 relative bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]`}
          title={sleepTimerMode ? t('sleep_timer_active', { time: formatCountdown(sleepTimerMode === 'end-of-chapter' ? Math.max(0, currentChapter.duration - chapterElapsed) : (sleepTimerRemaining || 0)) }) : t('sleep_timer')}
        >
          <Moon size={isFullScreenMode ? 16 : 13} />
          {sleepTimerMode !== null && (
            <motion.span
              animate={{ scale: [1, 0.6, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-1 -right-1 w-[11px] h-[11px] rounded-full bg-[var(--text-main)] shadow-md"
            />
          )}
        </motion.button>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {showSleepTimerMenu && (
              <>
                <div 
                  className="fixed inset-0 z-[9998] cursor-default" 
                  {...getBackdropProps(() => {
                    setShowSleepTimerMenu(false);
                    clearButtonCoverAnchorCache(miniSleepBtnAnchor);
                    setMiniSleepBtnAnchor(null);
                  })}
                />
                <PlayerPopup anchor={miniSleepBtnAnchor || miniSleepBtnRef.current} 
                  key="menu-mini-sleep"
                  data-popup-content="true"
                  style={getButtonCoverPopupStyle(miniSleepBtnAnchor || miniSleepBtnRef.current, 205, 256, 'right')}
                  onClick={(e) => e.stopPropagation()}
                  className="w-52 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl z-[9999] p-2 overflow-hidden flex flex-col text-left text-[var(--text-main)]"
                >
                  <div className="relative z-10 flex flex-col">
                    <div className="px-3 py-2 mb-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-[var(--text-main)]">{t('sleep_timer')}</span>
                    </div>

                    <SmoothSubMorph
                      activeKey={sleepTimerMode !== null ? 'mini-sleep-active' : 'mini-sleep-presets'}
                      direction={sleepTimerMode !== null ? 1 : -1}
                    >
                      {sleepTimerMode !== null ? (
                        /* MODO ATIVO: COUNTDOWN E DOIS BOTÕES (PAUSAR À ESQUERDA, CANCELAR À DIREITA) COM DESIGN PADRÃO */
                        <div className="p-1 flex flex-col items-center">
                          <div className="w-full py-3 px-2 flex flex-col items-center justify-center my-0.5">
                            <span className={`text-3xl font-bold tracking-widest transition-opacity ${isSleepTimerPaused ? 'opacity-60 text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>
                              {formatCountdown(
                                sleepTimerMode === 'end-of-chapter'
                                  ? Math.max(0, currentChapter.duration - chapterElapsed)
                                  : (sleepTimerRemaining || 0)
                              )}
                            </span>
                            <span className="text-[13px] font-medium text-[var(--text-muted)] mt-1.5 text-center px-2">
                              {isSleepTimerPaused
                                ? t('sleep_timer_paused')
                                : t('sleep_timer_auto_off')}
                            </span>
                          </div>

                          <div className="w-full flex items-center gap-2 mt-2">
                            {/* Pausar/Retomar à ESQUERDA com design dos botões da interface */}
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => {
                                setIsSleepTimerPaused(!isSleepTimerPaused);
                                showToast(!isSleepTimerPaused ? t('sleep_timer_paused') : t('sleep_timer_resume'));
                              }}
                              className="flex-1 py-2.5 px-3 rounded-full text-xs font-semibold bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/15 shadow-md hover:bg-white/15 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all flex items-center justify-center gap-1.5"
                              title={isSleepTimerPaused ? t('sleep_timer_resume') : t('sleep_timer_pause')}
                            >
                              {isSleepTimerPaused ? <Play size={14} /> : <Pause size={14} />}
                              <span>{isSleepTimerPaused ? t('sleep_timer_resume') : t('sleep_timer_pause')}</span>
                            </motion.button>

                            {/* Cancelar à DIREITA com design dos botões da interface */}
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => {
                                setSleepTimerRemaining(null);
                                setSleepTimerMode(null);
                                setIsSleepTimerPaused(false);
                                setShowSleepTimerMenu(false);
                                showToast(t('sleep_timer_canceled'));
                              }}
                              className="flex-1 py-2.5 px-3 rounded-full text-xs font-semibold bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/15 shadow-md hover:bg-white/15 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all flex items-center justify-center gap-1.5"
                              title={t('cancel_timer')}
                            >
                              <X size={14} />
                              <span>{t('cancel')}</span>
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <button
                            onClick={() => {
                              setSleepTimerMode('end-of-chapter');
                              setSleepTimerRemaining(Math.max(1, currentChapter.duration - chapterElapsed));
                              setIsSleepTimerPaused(false);
                              setShowSleepTimerMenu(false);
                              showToast(t('sleep_timer_until_end'));
                            }}
                            className="relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 border border-transparent group hover:bg-black/5 dark:hover:bg-white/15 hover:border-black/10 dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                          >
                            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                              <span className="text-[var(--text-main)] dark:group-hover:text-white transition-colors shrink-0">
                                <Bookmark size={14} />
                              </span>
                              <span className="text-[var(--text-main)] dark:group-hover:text-white transition-colors truncate">
                                {t('sleep_timer_until_end')}
                              </span>
                            </div>
                            <span className="relative z-10 text-[10px] text-[var(--text-muted)] dark:group-hover:text-white/80 shrink-0 ml-1 transition-colors">
                              {formatTime(chapterRemaining)}
                            </span>
                          </button>

                          {[15, 30, 45, 60, 90, 120].map((mins) => (
                            <button
                              key={mins}
                              onClick={() => {
                                setSleepTimerMode('duration');
                                setSleepTimerRemaining(mins * 60);
                                setIsSleepTimerPaused(false);
                                setShowSleepTimerMenu(false);
                                showToast(t('sleep_timer_mins', { mins }));
                              }}
                              className="relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 border border-transparent group hover:bg-black/5 dark:hover:bg-white/15 hover:border-black/10 dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                            >
                              <div className="relative z-10 flex items-center gap-2.5">
                                <span className="text-[var(--text-main)] dark:group-hover:text-white transition-colors shrink-0">
                                  {getSleepTimerIcon(mins)}
                                </span>
                                <span className="text-[var(--text-main)] dark:group-hover:text-white transition-colors">
                                  {t('sleep_timer_mins', { mins })}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </SmoothSubMorph>
                  </div>
                </PlayerPopup>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* 3. FILA DE REPRODUÇÃO */}
      <div className={`relative ${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} shrink-0 ${showQueuePopup ? 'z-50' : 'z-10'}`}>
        <motion.button 
          ref={miniQueueBtnRef}
          key="btn-mini-queue"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          animate={showQueuePopup 
            ? morphTriggerAnimate(true) 
            : (isQueuePulse 
              ? { scale: [1, 1.14, 1] } 
              : morphTriggerAnimate(false)
            )
          }
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showQueuePopup; 
            closeAllPopups(); 
            if (!p) {
              setMiniQueueBtnAnchor(e.currentTarget);
              setShowQueuePopup(true);
            }
          }} 
          className={`${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm relative shrink-0 overflow-hidden`}
          title={t('queue')}
        >
          <AnimatePresence mode="wait" initial={false}>
            {queueAddedAnim ? (
              <motion.div
                key={`mini-q-cov-${queueAddedAnim.key}`}
                initial={{ scale: 0.25, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 460, damping: 28, mass: 0.6 }}
                className="pointer-events-none flex items-center justify-center w-[15px] h-[23px] relative shrink-0"
              >
                {queueAddedAnim.isBook ? (
                  <div className="relative w-[15px] h-[23px] pointer-events-none">
                    <img
                      src={queueAddedAnim.cover}
                      alt=""
                      className="absolute top-0 right-0 w-[12px] h-[19px] aspect-[1/1.6] rounded-[2.5px] object-cover opacity-80 brightness-75 border border-white/25 shadow-sm translate-x-[1px] -translate-y-[0.5px] rotate-[6deg]"
                    />
                    <img
                      src={queueAddedAnim.cover}
                      alt=""
                      className="absolute bottom-0 left-0 w-[12px] h-[19px] aspect-[1/1.6] rounded-[2.5px] object-cover border border-white/35 shadow-md"
                    />
                  </div>
                ) : (
                  <img
                    src={queueAddedAnim.cover}
                    alt=""
                    className="w-[15px] h-[23px] aspect-[1/1.6] rounded-[3.5px] object-cover border border-white/30 shadow-md pointer-events-none"
                  />
                )}
              </motion.div>
            ) : (
              <motion.span
                key="mini-q-icon"
                initial={{ scale: 0.25, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.25, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 480, damping: 28, mass: 0.6 }}
                className="pointer-events-none flex items-center justify-center"
              >
                <ListMusic size={isFullScreenMode ? 16 : 13} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {showQueuePopup && (
              <>
                <div 
                  className="fixed inset-0 z-[9998] cursor-default" 
                  {...getBackdropProps(() => {
                    setShowQueuePopup(false);
                    clearButtonCoverAnchorCache(miniQueueBtnAnchor);
                    setMiniQueueBtnAnchor(null);
                  })}
                />
                <PlayerPopup anchor={miniQueueBtnAnchor || miniQueueBtnRef.current} 
                  key="menu-mini-queue"
                  data-popup-content="true"
                  style={getButtonCoverPopupStyle(
                    miniQueueBtnAnchor || miniQueueBtnRef.current,
                    Math.min(typeof window !== 'undefined' && window.innerWidth < 640 ? 256 : 307, typeof window !== 'undefined' ? window.innerWidth - 32 : 307),
                    336,
                    'right'
                  )}
                  onClick={(e) => e.stopPropagation()}
                  className="w-64 sm:w-80 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl z-[9999] p-3 flex flex-col max-h-[336px] text-[var(--text-main)] overflow-hidden text-left"
                >
                  <div className="relative z-10 flex flex-col min-h-0 max-h-[310px] overflow-hidden">
                    <div className="px-3 py-2 mb-1 flex items-center justify-between pb-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--text-main)]">{t('queue')}</span>
                      </div>
                    </div>

                    <div 
                      ref={miniQueueScrollRef}
                      className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col px-1.5 mt-1"
                    >
                      {/* TOCANDO AGORA */}
                      <div ref={miniNowPlayingRef} className="shrink-0">
                        <div 
                          onClick={() => {
                            setIsPlaying(true);
                          }}
                          className="group relative flex items-center gap-3 p-2 rounded-2xl bg-winblue/10 border border-winblue/25 cursor-pointer hover:bg-winblue/15 transition-all shadow-sm"
                          title={t('play') || 'Reproduzir'}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={currentBook.cover || getGenericBookCover(currentBook.title, currentBook.author)}
                              onError={(e) => handleBookCoverError(currentBook, e)}
                              alt=""
                              className="w-7 h-11 aspect-[1/1.6] rounded-lg object-cover shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center rounded-lg">
                              <div className="relative flex items-center justify-center">
                                {/* Brilho luminoso: cinza no modo claro, branco no modo escuro */}
                                <div className="absolute w-4 h-4 rounded-full bg-slate-400/80 dark:bg-white/60 blur-[5px] pointer-events-none" />
                                <div className="relative z-10 flex items-end justify-center h-3 gap-[2px] w-4">
                                  <span className={`w-[2px] bg-black dark:bg-white rounded-full drop-shadow-[0_0_4px_rgba(100,116,139,0.85)] dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] ${isPlaying ? 'audio-bar-1' : 'h-2'}`} />
                                  <span className={`w-[2px] bg-black dark:bg-white rounded-full drop-shadow-[0_0_4px_rgba(100,116,139,0.85)] dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] ${isPlaying ? 'audio-bar-2' : 'h-3'}`} />
                                  <span className={`w-[2px] bg-black dark:bg-white rounded-full drop-shadow-[0_0_4px_rgba(100,116,139,0.85)] dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] ${isPlaying ? 'audio-bar-3' : 'h-1.5'}`} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 overflow-hidden min-w-0">
                            <p 
                              onClick={(e) => {
                                e.stopPropagation();
                                pendingChapterScrollRef.current = true;
                                targetScrollChapterIdRef.current = `${currentBook.id}-${currentChapter.id}`;
                                setSelectedBook(currentBook);
                                setShouldScrollToCurrentChapter(Date.now());
                                navigateTo('book-detail', currentBook);
                                setShowQueuePopup(false);
                              }}
                              className="text-xs font-bold text-winblue truncate w-fit max-w-full hover:underline cursor-pointer transition-colors"
                              title={t('view_chapter_in_book')}
                            >
                              {currentChapter.title}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] truncate">{currentBook.title} • {currentBook.author}</p>
                          </div>
                          <span className="text-[10px] text-winblue font-semibold mr-1 shrink-0 pointer-events-none">
                            {formatTime(chapterElapsed)}
                          </span>
                        </div>
                      </div>

                      {/* PRÓXIMOS CAPÍTULOS */}
                      <Reorder.Group axis="y" values={playbackQueue} onReorder={setPlaybackQueue} className="flex flex-col shrink-0">
                        <AnimatePresence initial={false}>
                          {playbackQueue.map((item) => (
                            <QueueItemRow 
                              key={item.id}
                              item={item}
                              formatTime={formatTime}
                              onPlay={() => {
                                beginBookSwitch(item.book);
                                setCurrentBook(item.book);
                                setSelectedBook(item.book);
                                handleSeek(item.startTime + (getChapterResumeElapsed(item.bookId || item.book?.id, (item.book?.chapters || booksRef.current.find(b => b.id === (item.bookId || item.book?.id))?.chapters || []).find((c: Chapter) => c.id === item.chapterId)) || 0));
                                setIsPlaying(true);
                                setPlaybackQueue(prev => {
                                  const curIdx = prev.findIndex(it => it.id === item.id);
                                  return curIdx !== -1 ? prev.slice(curIdx + 1) : prev;
                                });
                                // A fila continua aberta: só atualiza o que está tocando
                                if (!isMobile && !isTouchDevice) setShowQueuePopup(false);
                              }}
                              onRemove={() => {
                                setPlaybackQueue(prev => prev.filter(it => it.id !== item.id));
                              }}
                              onViewBook={() => {
                                pendingChapterScrollRef.current = true;
                                targetScrollChapterIdRef.current = `${item.bookId || item.book?.id}-${item.chapterId}`;
                                setSelectedBook(item.book);
                                setShouldScrollToCurrentChapter(Date.now());
                                navigateTo('book-detail', item.book);
                                setShowQueuePopup(false);
                              }}
                              t={t}
                            />
                          ))}
                        </AnimatePresence>
                      </Reorder.Group>
                    </div>
                  </div>
                </PlayerPopup>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>


      {/* 4. VOLUME */}
      <div className={`relative ${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} shrink-0 hidden md:flex ${showVolumePopup ? 'z-50' : 'z-10'}`}>
        <motion.button 
          ref={miniVolumeBtnRef}
          key="btn-mini-volume"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          animate={morphTriggerAnimate(showVolumePopup)}
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showVolumePopup; 
            closeAllPopups(); 
            if (!p) {
              setMiniVolumeBtnAnchor(e.currentTarget);
              setShowVolumePopup(true);
            }
          }} 
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className={`${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} flex items-center justify-center rounded-full border transition-all shadow-sm shrink-0 ${
            isMuted || volume === 0
              ? 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]'
              : 'bg-card/75 backdrop-blur-3xl border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]'
          }`}
          title={isMuted || volume === 0 ? t('mute_click_to_open') : t('volume')}
        >
          {isMuted || volume === 0 ? <VolumeX size={isFullScreenMode ? 16 : 13} /> : <Volume2 size={isFullScreenMode ? 16 : 13} />}
        </motion.button>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {showVolumePopup && (
              <>
                <div 
                  className="fixed inset-0 z-[9998] cursor-default" 
                  {...getBackdropProps(() => {
                    setShowVolumePopup(false);
                    clearButtonCoverAnchorCache(miniVolumeBtnAnchor);
                    setMiniVolumeBtnAnchor(null);
                  })}
                />
                <PlayerPopup anchor={miniVolumeBtnAnchor || miniVolumeBtnRef.current} 
                  key="menu-mini-volume"
                  data-popup-content="true"
                  style={getButtonCoverPopupStyle(miniVolumeBtnAnchor || miniVolumeBtnRef.current, 205, 100, 'right')}
                  onClick={(e) => e.stopPropagation()}
                  className="w-52 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl z-[9999] p-2.5 flex flex-col gap-2.5 text-[var(--text-main)] overflow-hidden text-left"
                >
                  <div className="relative z-10 flex flex-col gap-2.5">
                    <div className="px-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-[var(--text-main)]">{t('volume')}</span>
                    </div>
                    <div className="flex items-center gap-2.5 whitespace-nowrap px-1">
                      <button 
                        onClick={() => setIsMuted(!isMuted)} 
                        className="text-[var(--text-main)] hover:text-winblue dark:hover:text-white transition-colors shrink-0"
                        title={isMuted ? t('unmute') : t('mute')}
                      >
                        {isMuted || volume === 0 ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />}
                      </button>
                      <div className="relative flex-1 min-w-0 flex items-center group">
                        <input 
                          type="range" 
                          min={0} 
                          max={1} 
                          step={0.01} 
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            setVolume(Number(e.target.value));
                            setIsMuted(false);
                          }}
                          style={{
                            background: `linear-gradient(to right, var(--slider-current-fill, var(--slider-fill)) ${(isMuted ? 0 : volume) * 100}%, var(--slider-track) ${(isMuted ? 0 : volume) * 100}%)`
                          }}
                          className="w-full apple-slider"
                        />
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-main)] w-8 text-left shrink-0">
                        {Math.round((isMuted ? 0 : volume) * 100)}%
                      </span>
                    </div>
                  </div>
                </PlayerPopup>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* 5. EXPANDIR PLAYER */}
      {!isFullScreenMode && (
        <motion.button 
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            closeAllPopups();
            setIsFullScreen(true);
          }}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm shrink-0"
          title={t('expand_player')}
        >
          <Maximize2 size={13} />
        </motion.button>
      )}
    </div>
  );

  type SearchItem = {
    id: string;
    type: 'book' | 'author';
    tier: number;
    fieldPriority: number;
    subScore: number;
    score: number;
    title: string;
    book?: Audiobook;
    author?: Author;
  };

  const computedSearchResults = useMemo((): SearchItem[] => {
    const q = normalizeSearchStr(searchQuery);
    if (!q) return [];

    const qWords = q.split(/[\s:,\-_/().]+/).filter(Boolean);
    const qPhonetic = toPhoneticSearchStr(q);

    const getGenreTerms = (book: Audiobook): string[] => {
      const terms: string[] = [];
      if (book.category && normalizeSearchStr(book.category) !== 'desconhecido') {
        terms.push(
          book.category,
          getGenreName(book.category, resolvedLanguage),
          getGenreName(book.category, 'pt'),
          getGenreName(book.category, 'en')
        );
      }
      Object.values(GENRE_HIERARCHY).forEach(genre => {
        if (isBookInGenre(book, genre)) {
          terms.push(
            genre.name,
            getGenreName(genre.id, resolvedLanguage),
            getGenreName(genre.id, 'pt'),
            getGenreName(genre.id, 'en')
          );
        }
      });
      return Array.from(new Set(terms.filter(Boolean)));
    };

    const getSubgenreTerms = (book: Audiobook): string[] => {
      const terms: string[] = [];
      if (book.subgenre && normalizeSearchStr(book.subgenre) !== 'desconhecido') {
        terms.push(
          book.subgenre,
          getSubgenreName(book.subgenre, resolvedLanguage),
          getSubgenreName(book.subgenre, 'pt'),
          getSubgenreName(book.subgenre, 'en')
        );
      }
      Object.values(GENRE_HIERARCHY).forEach(genre => {
        genre.subgenres.forEach(sub => {
          if (isBookInSubgenre(book, genre, sub)) {
            terms.push(
              sub,
              getSubgenreName(sub, resolvedLanguage),
              getSubgenreName(sub, 'pt'),
              getSubgenreName(sub, 'en')
            );
          }
        });
      });
      return Array.from(new Set(terms.filter(Boolean)));
    };

    const getNationalityTerms = (rawNat?: string): string[] => {
      if (!rawNat || !rawNat.trim()) return [];
      const normNat = normalizeSearchStr(rawNat);
      if (normNat === 'desconhecido' || normNat === 'unknown') return [];

      const terms: string[] = [];
      const parts = rawNat.split(/[/,]/).map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        terms.push(
          part,
          getNationalityDisplayName(part, resolvedLanguage),
          getNationalityDisplayName(part, 'pt'),
          getNationalityDisplayName(part, 'en')
        );
        const entry = findNationalityEntry(part);
        if (entry && normalizeSearchStr(entry.countryPt) !== 'desconhecido') {
          terms.push(
            entry.countryPt,
            entry.pt,
            entry.en,
            entry.es,
            entry[resolvedLanguage],
            ...(entry.aliases || []).filter(a => a.length >= 3)
          );
        }
      }
      const expandedTerms: string[] = [];
      for (const t of terms) {
        if (!t) continue;
        expandedTerms.push(t);
        if (t.includes('(')) {
          const clean = t.replace(/\([^)]*\)/g, '').trim();
          if (clean) expandedTerms.push(clean);
        }
      }
      return Array.from(new Set(expandedTerms));
    };

    const getLanguageTerms = (book: Audiobook): string[] => {
      const { language: resolvedBookLang } = resolveNarratorAndLanguage(book);
      if (!resolvedBookLang) return [];
      const terms: string[] = [
        resolvedBookLang,
        getLanguageDisplayName(resolvedBookLang, resolvedLanguage),
        getLanguageDisplayName(resolvedBookLang, 'pt'),
        getLanguageDisplayName(resolvedBookLang, 'en'),
      ];
      const langEntry = findRecognizedLanguageEntry(resolvedBookLang);
      if (langEntry) {
        terms.push(
          langEntry.canonicalPt,
          langEntry.names[resolvedLanguage],
          langEntry.names.pt,
          langEntry.names.en,
          langEntry.names.es,
          ...langEntry.aliases.filter(a => a.length >= 4)
        );
      } else {
        terms.push('outro', 'outros', 'other', 'others');
      }
      return Array.from(new Set(terms.filter(Boolean)));
    };

    const evaluateGroups = (
      groups: { priority: number; terms: (string | undefined)[]; allowFuzzy?: boolean }[]
    ): { tier: number; fieldPriority: number; subScore: number } | null => {
      let best: { tier: number; fieldPriority: number; subScore: number } | null = null;

      for (const group of groups) {
        const allowFuzzy = group.allowFuzzy !== false;
        for (const term of group.terms) {
          const m = evaluateSearchTermMatch(term, q, qWords, qPhonetic);
          if (!m) continue;
          if (m.tier === 4 && !allowFuzzy) continue;

          if (
            !best ||
            m.tier < best.tier ||
            (m.tier === best.tier && group.priority < best.fieldPriority) ||
            (m.tier === best.tier && group.priority === best.fieldPriority && m.subScore < best.subScore)
          ) {
            best = {
              tier: m.tier,
              fieldPriority: group.priority,
              subScore: m.subScore,
            };
          }
        }
      }

      return best;
    };

    const results: SearchItem[] = [];

    // 1. Audiobooks
    books.forEach(book => {
      const authorObj = authors.find(
        a => a.id === book.authorId || (a.name || '').toLowerCase() === (book.author || '').toLowerCase()
      );
      const authorNat = authorObj?.nationality || '';
      const chapterTitles = (book.chapters || []).map(c => c.title);

      const bestMatch = evaluateGroups([
        { priority: 1, terms: [book.title] },
        { priority: 2, terms: [book.author, authorObj?.name] },
        { priority: 3, terms: getGenreTerms(book) },
        { priority: 4, terms: getSubgenreTerms(book) },
        { priority: 5, terms: getNationalityTerms(authorNat) },
        { priority: 6, terms: getLanguageTerms(book) },
        {
          priority: 7,
          terms: [`${book.title || ''} ${book.author || ''}`, ...chapterTitles, book.narrator, book.year],
          allowFuzzy: false,
        },
      ]);

      if (bestMatch) {
        results.push({
          id: `book-${book.id}`,
          type: 'book',
          tier: bestMatch.tier,
          fieldPriority: bestMatch.fieldPriority,
          subScore: bestMatch.subScore,
          score: bestMatch.tier * 100 + bestMatch.fieldPriority * 10 + bestMatch.subScore,
          title: book.title,
          book,
        });
      }
    });

    // 2. Authors
    authors.forEach(author => {
      const authorBooks = books.filter(
        b => bookHasAuthor(b, author)
      );

      const bestMatch = evaluateGroups([
        { priority: 1, terms: [author.name] },
        { priority: 2, terms: authorBooks.map(b => b.title) },
        { priority: 3, terms: authorBooks.flatMap(b => getGenreTerms(b)) },
        { priority: 4, terms: authorBooks.flatMap(b => getSubgenreTerms(b)) },
        { priority: 5, terms: getNationalityTerms(author.nationality) },
        { priority: 6, terms: authorBooks.flatMap(b => getLanguageTerms(b)) },
        { priority: 7, terms: [author.bio], allowFuzzy: false },
      ]);

      if (bestMatch) {
        results.push({
          id: `author-${author.id}`,
          type: 'author',
          tier: bestMatch.tier,
          fieldPriority: bestMatch.fieldPriority,
          subScore: bestMatch.subScore,
          score: bestMatch.tier * 100 + bestMatch.fieldPriority * 10 + bestMatch.subScore,
          title: author.name,
          author,
        });
      }
    });

    // Ordem de prioridade:
    // 1. Posição da correspondência: começam pelas letras (1) -> meio das palavras (2) -> final das palavras (3) -> algo semelhante (4)
    // 2. Tipo: Audiobooks (1) sempre priorizados sobre Autores (2)
    // 3. Atributo correspondente (título/nome, gênero, subgênero, nacionalidade, idioma)
    // 4. Precisão interna dentro do tier (subScore) e ordem alfabética
    const typePriority: Record<string, number> = {
      book: 1,
      author: 2,
    };

    results.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      const pA = typePriority[a.type] || 99;
      const pB = typePriority[b.type] || 99;
      if (pA !== pB) return pA - pB;
      if (a.fieldPriority !== b.fieldPriority) return a.fieldPriority - b.fieldPriority;
      if (a.subScore !== b.subScore) return a.subScore - b.subScore;
      return a.title.localeCompare(b.title);
    });

    return results;
  }, [searchQuery, books, authors, resolvedLanguage, availableLanguages]);

  const handleSelectSearchItem = (item: SearchItem) => {
    addToSearchHistory(searchQuery);
    if (item.type === 'book' && item.book) {
      navigateTo('book-detail', item.book);
    } else if (item.type === 'author' && item.author) {
      navigateTo('author-detail', item.author);
    }
    setSearchQuery('');
    setActiveSearchMenuId(null);
    setSearchMenuAnchor(null);
    setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
    setSearchSelectedIndex(-1);
  };

  const renderSearchResultsList = () => {
    if (computedSearchResults.length === 0) {
      return (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-[var(--text-muted)]">{t('search_no_results', { query: searchQuery })}</p>
        </div>
      );
    }

    return computedSearchResults.map((item, index) => {
      const isMenuOpen = activeSearchMenuId === item.id;
      const isSelected = searchSelectedIndex === index;

      // A. AUDIOBOOK
      if (item.type === 'book' && item.book) {
        const book = item.book;
        const isFav = favoriteBookIds.includes(book.id);
        return (
          <motion.div 
            key={item.id} 
            id={`search-result-item-${index}`}
            onMouseEnter={() => setSearchSelectedIndex(index)}
            onClick={() => handleSelectSearchItem(item)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const btn = (e.currentTarget.querySelector('button') as HTMLElement) || e.currentTarget;
              closeAllPopups();
              clearButtonCoverAnchorCache(btn);
              setSearchMenuAnchor(btn);
              setActiveSearchMenuId(item.id);
            }}
            className={`group/searchitem relative flex items-center gap-3.5 py-2.5 pl-2.5 pr-[18px] rtl:pl-[18px] rtl:pr-2.5 rounded-3xl cursor-pointer transition-all border ${
              isSelected 
                ? 'bg-[var(--button-secondary-bg)]/50 border-transparent shadow-sm' 
                : 'border-transparent hover:bg-[var(--button-secondary-bg)]/50'
            } ${
              isMenuOpen ? 'z-30' : 'z-10'
            }`}
          >
            <div 
              className="relative h-12 aspect-[1/1.6] shrink-0 rounded-[14px] max-md:rounded-lg overflow-hidden shadow-sm"
              onClick={() => { 
                addToSearchHistory(searchQuery);
                navigateTo('book-detail', book); 
                setSearchQuery(''); 
                setActiveSearchMenuId(null); 
              }}
            >
              <img
                src={book.cover || getGenericBookCover(book.title, book.author)}
                onError={(e) => handleBookCoverError(book, e)}
                alt={book.title}
                className="w-full h-full aspect-[1/1.6] object-cover"
              />
            </div>

            <div 
              className="flex-1 overflow-hidden" 
              onClick={() => { 
                addToSearchHistory(searchQuery);
                navigateTo('book-detail', book); 
                setSearchQuery(''); 
                setActiveSearchMenuId(null); 
              }}
            >
              <p className="text-sm font-bold text-[var(--text-main)] truncate">{book.title}</p>
              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                Audiobook • {book.author} • {getGenreName(book.category, resolvedLanguage)}{book.subgenre && book.subgenre !== 'Desconhecido' && book.subgenre.toLowerCase() !== book.category.toLowerCase() ? `, ${getSubgenreName(book.subgenre, resolvedLanguage)}` : ''}
              </p>
            </div>

            {/* Estado do item (favorito, ouvindo, concluído): só ícones, à esquerda do botão de opções */}
            {(isFav || isBookStarted(book) || isBookCompleted(book)) && (
              <div className="flex items-center gap-1.5 shrink-0 text-[var(--text-muted)] pointer-events-none">
                {isFav && <Star size={13} className="fill-yellow-400 text-yellow-400" />}
                {isBookCompleted(book) ? <CheckCircle2 size={13} /> : isBookStarted(book) ? <Headphones size={13} /> : null}
              </div>
            )}
            <div className={`relative w-8 h-8 max-md:w-10 max-md:h-10 shrink-0 transition-opacity duration-200 ${
              isMenuOpen ? 'opacity-100 z-50' : isSelected ? 'opacity-100' : 'opacity-0 max-md:opacity-100 group-hover/searchitem:opacity-100'
            }`}>
              <motion.button 
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                animate={morphTriggerAnimate(isMenuOpen)}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const btnEl = e.currentTarget;
                  if (isMenuOpen) {
                    setActiveSearchMenuId(null);
                    clearButtonCoverAnchorCache(searchMenuAnchor);
                    setSearchMenuAnchor(null);
                    setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
                  } else {
                    closeAllPopups();
                    clearButtonCoverAnchorCache(btnEl);
                    setSearchMenuAnchor(btnEl);
                    setActiveSearchMenuId(item.id); 
                  }
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl transition-colors shrink-0 bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] ${
                  isMenuOpen
                    ? ''
                    : 'hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                }`}
                title={t('more_options')}
              >
                <MoreHorizontal size={16} />
              </motion.button>

              {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                  {isMenuOpen && (
                    <>
                      <div 
                        data-popup-content="true"
                        className="fixed inset-0 z-[9998] cursor-default" 
                        {...getBackdropProps((e) => { 
                          setActiveSearchMenuId(null); 
                          clearButtonCoverAnchorCache(searchMenuAnchor);
                          setSearchMenuAnchor(null); 
                          setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null); 
                          if (e && typeof e.clientX === 'number' && typeof document !== 'undefined') {
                            const els = document.elementsFromPoint(e.clientX, e.clientY);
                            const insideSearch = els.some(el => el.hasAttribute?.('data-search-dropdown') || el.hasAttribute?.('data-search-bar'));
                            if (!insideSearch) {
                              setSearchQuery('');
                              setSearchSelectedIndex(-1);
                            }
                          }
                        })} 
                      />
                      <PopupMorphContainer
                        key="search-book-menu"
                        activeKey={
                          confirmDeleteSearchId === item.id 
                            ? "search-confirm-delete" 
                            : searchCollectionTarget?.id === item.id 
                              ? "search-collections" 
                              : "search-options-list"
                        }
                        direction={confirmDeleteSearchId === item.id || searchCollectionTarget?.id === item.id ? 1 : -1}
                        targetWidth={confirmDeleteSearchId === item.id || searchCollectionTarget?.id === item.id ? 260 : 180}
                        targetRadius={confirmDeleteSearchId === item.id || searchCollectionTarget?.id === item.id ? 24 : 20}
                        style={getButtonCoverPopupStyle(searchMenuAnchor, confirmDeleteSearchId === item.id || searchCollectionTarget?.id === item.id ? 260 : 180, 260, 'right')}
                        className="z-[9999]"
                      >
                        {searchCollectionTarget?.id === item.id ? (
                          <CollectionPickerPopupContent
                            itemType="book"
                            itemId={book.id}
                            collections={collections}
                            onToggleItem={handleToggleItemInCollection}
                            onBack={() => setSearchCollectionTarget(null)}
                            onClose={() => {
                              setActiveSearchMenuId(null);
                              clearButtonCoverAnchorCache(searchMenuAnchor);
                              setSearchMenuAnchor(null);
                              setSearchCollectionTarget(null);
                            }}
                          />
                        ) : confirmDeleteSearchId !== item.id ? (
                          <PagedMenu className="flex flex-col p-2 text-left rtl:text-right">
                            <MenuOptionItem 
                              icon={<Play size={14} />} 
                              onClick={() => { 
                                addToSearchHistory(searchQuery);
                                handlePlayBookFromStart(book); 
                                setActiveSearchMenuId(null); 
                                clearButtonCoverAnchorCache(searchMenuAnchor);
                                setSearchMenuAnchor(null);
                                setSearchQuery(''); 
                              }}
                            >
                              <span>{t('listen')}</span>
                            </MenuOptionItem>
                            <MenuOptionItem 
                              icon={<ListPlus size={14} />} 
                              onClick={() => { 
                                addToSearchHistory(searchQuery);
                                handleAddBookToQueue(book, 'next'); 
                                setActiveSearchMenuId(null); 
                                clearButtonCoverAnchorCache(searchMenuAnchor);
                                setSearchMenuAnchor(null);
                              }}
                            >
                              <span>{t('play_next')}</span>
                            </MenuOptionItem>
                            <MenuOptionItem 
                              icon={<ListPlus size={14} />} 
                              onClick={() => { 
                                addToSearchHistory(searchQuery);
                                handleAddBookToQueue(book, 'last'); 
                                setActiveSearchMenuId(null); 
                                clearButtonCoverAnchorCache(searchMenuAnchor);
                                setSearchMenuAnchor(null);
                              }}
                            >
                              <span>{t('add_to_queue_end')}</span>
                            </MenuOptionItem>

                            {/* Adicionar à coleção acima de favoritar */}
                            <MenuOptionItem 
                              icon={<FolderPlus size={14} />} 
                              onClick={() => { 
                                setSearchCollectionTarget({ type: 'book', id: book.id });
                              }}
                            >
                              <span>{t('add_to_collection')}</span>
                            </MenuOptionItem>

                            <MenuOptionItem 
                              icon={isFav ? <StarOff size={14} /> : <Star size={14} />} 
                              onClick={() => { 
                                toggleFavoriteBook(book.id); 
                                setActiveSearchMenuId(null); 
                                clearButtonCoverAnchorCache(searchMenuAnchor);
                                setSearchMenuAnchor(null);
                              }}
                            >
                              <span>{isFav ? t('remove_from_favorites') : t('favorite')}</span>
                            </MenuOptionItem>

                            <MenuOptionItem 
                              icon={<BookOpen size={14} />} 
                              onClick={() => { 
                                addToSearchHistory(searchQuery);
                                navigateTo('book-detail', book); 
                                setActiveSearchMenuId(null); 
                                clearButtonCoverAnchorCache(searchMenuAnchor);
                                setSearchMenuAnchor(null);
                                setSearchQuery(''); 
                              }}
                            >
                              <span>{t('go_to_audiobook')}</span>
                            </MenuOptionItem>
                            <MenuOptionItem 
                              icon={<User size={14} />} 
                              onClick={() => { 
                                addToSearchHistory(searchQuery);
                                handleSelectAuthor(book.authorId, book.author); 
                                setActiveSearchMenuId(null); 
                                clearButtonCoverAnchorCache(searchMenuAnchor);
                                setSearchMenuAnchor(null);
                                setSearchQuery(''); 
                              }}
                            >
                              <span>{t('go_to_author')}</span>
                            </MenuOptionItem>

                            {/* Excluir */}
                            <MenuOptionItem 
                              danger
                              immediate
                              icon={<Trash2 size={14} />} 
                              onClick={() => {
                                if (isMobile) {
                                  setActiveSearchMenuId(null);
                                  clearButtonCoverAnchorCache(searchMenuAnchor);
                                  setSearchMenuAnchor(null);
                                  setMobileConfirm({
                                    title: t('confirm_delete_single_book'),
                                    preview: (
                                      <div className="flex items-center gap-3 p-2 text-left rtl:text-right">
                                        <img src={book.cover || getGenericBookCover(book.title, book.author)} alt="" className="w-8 h-[51px] rounded-lg object-cover shrink-0 shadow-sm" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-bold text-[var(--text-main)] truncate">{book.title}</p>
                                          <p className="text-xs text-[var(--text-muted)] truncate">{book.author}</p>
                                        </div>
                                      </div>
                                    ),
                                    confirmLabel: t('delete'),
                                    onConfirm: () => {
                                      handleDeleteBook(book.id);
                                      showToast(t('toast_book_deleted', { title: book.title }));
                                    },
                                  });
                                  return;
                                }
                                setConfirmDeleteSearchId(item.id);
                              }}
                            >
                              <span>{t('delete')}</span>
                            </MenuOptionItem>
                          </PagedMenu>
                        ) : (
                          <div className="flex flex-col p-4">
                            <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-3">
                              {t('confirm_delete_single_book')}
                            </h4>

                            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1 mb-4">
                              <div className="flex items-center gap-3 p-2">
                                <img 
                                  src={book.cover || getGenericBookCover(book.title, book.author)} 
                                  onError={(e) => handleBookCoverError(book, e)}
                                  alt={book.title} 
                                  className="w-7 h-11 aspect-[1/1.6] rounded-lg object-cover shrink-0 shadow-sm" 
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{book.title}</p>
                                  <p className="text-xs text-[var(--text-muted)] truncate">{book.author}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-1">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBook(book.id);
                                  showToast(t('toast_book_deleted', { title: book.title }));
                                  setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
                                  setActiveSearchMenuId(null);
                                  clearButtonCoverAnchorCache(searchMenuAnchor);
                                  setSearchMenuAnchor(null);
                                }}
                                className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                              >
                                <Trash2 size={13} />
                                <span>{t('delete')}</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
                                }}
                                className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                              >
                                <X size={13} />
                                <span>{t('cancel')}</span>
                              </motion.button>
                            </div>
                          </div>
                        )}
                      </PopupMorphContainer>
                  </>
                )}
              </AnimatePresence>,
              document.body
            )}
          </div>
          </motion.div>
        );
      }

      // B. AUTHOR
      if (item.type === 'author' && item.author) {
        const author = item.author;
        const isFav = favoriteAuthorIds.includes(author.id);
        return (
          <motion.div 
            key={item.id} 
            id={`search-result-item-${index}`}
            onMouseEnter={() => setSearchSelectedIndex(index)}
            onClick={() => handleSelectSearchItem(item)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const btn = (e.currentTarget.querySelector('button') as HTMLElement) || e.currentTarget;
              closeAllPopups();
              clearButtonCoverAnchorCache(btn);
              setSearchMenuAnchor(btn);
              setActiveSearchMenuId(item.id);
            }}
            className={`group/searchitem relative flex items-center gap-3.5 py-2.5 pl-2.5 pr-[18px] rtl:pl-[18px] rtl:pr-2.5 rounded-3xl cursor-pointer transition-all border ${
              isSelected 
                ? 'bg-[var(--button-secondary-bg)]/50 border-transparent shadow-sm' 
                : 'border-transparent hover:bg-[var(--button-secondary-bg)]/50'
            } ${
              isMenuOpen ? 'z-30' : 'z-10'
            }`}
          >
            <div 
              className="relative w-12 h-12 aspect-square shrink-0 rounded-[14px] overflow-hidden shadow-sm"
              onClick={() => handleSelectSearchItem(item)}
            >
              <img
                src={getEffectiveAuthorAvatar(author.name, author.picture)}
                onError={(e) => { e.currentTarget.src = getAuthorAvatar(author.name); }}
                alt={author.name}
                className="w-full h-full aspect-square object-cover rounded-[14px]"
              />
            </div>

            <div 
              className="flex-1 overflow-hidden" 
              onClick={() => handleSelectSearchItem(item)}
            >
              <p className="text-sm font-bold text-[var(--text-main)] truncate">{author.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                {t('author_label')} • {getNationalityDisplayName(author.nationality, resolvedLanguage)} • {books.filter(b => bookHasAuthor(b, author)).length} {books.filter(b => bookHasAuthor(b, author)).length === 1 ? t('audiobook_single') : t('audiobooks_plural')}
              </p>
            </div>

            {isFav && (
              <div className="flex items-center shrink-0 pointer-events-none">
                <Star size={13} className="fill-yellow-400 text-yellow-400" />
              </div>
            )}
            <div className={`relative w-8 h-8 max-md:w-10 max-md:h-10 shrink-0 transition-opacity duration-200 ${
              isMenuOpen ? 'opacity-100 z-50' : isSelected ? 'opacity-100' : 'opacity-0 max-md:opacity-100 group-hover/searchitem:opacity-100'
            }`}>
              <motion.button 
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                animate={morphTriggerAnimate(isMenuOpen)}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const btnEl = e.currentTarget;
                  if (isMenuOpen) {
                    setActiveSearchMenuId(null);
                    clearButtonCoverAnchorCache(searchMenuAnchor);
                    setSearchMenuAnchor(null);
                  } else {
                    closeAllPopups();
                    clearButtonCoverAnchorCache(btnEl);
                    setSearchMenuAnchor(btnEl);
                    setActiveSearchMenuId(item.id); 
                  }
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl transition-colors shrink-0 bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] ${
                  isMenuOpen
                    ? ''
                    : 'hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                }`}
                title={t('more_options_author')}
              >
                <MoreHorizontal size={16} />
              </motion.button>

              {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                  {isMenuOpen && (
                    <>
                      <div 
                        data-popup-content="true"
                        className="fixed inset-0 z-[9998] cursor-default" 
                        {...getBackdropProps((e) => { 
                          setActiveSearchMenuId(null); 
                          clearButtonCoverAnchorCache(searchMenuAnchor);
                          setSearchMenuAnchor(null); 
                          if (e && typeof e.clientX === 'number' && typeof document !== 'undefined') {
                            const els = document.elementsFromPoint(e.clientX, e.clientY);
                            const insideSearch = els.some(el => el.hasAttribute?.('data-search-dropdown') || el.hasAttribute?.('data-search-bar'));
                            if (!insideSearch) {
                              setSearchQuery('');
                              setSearchSelectedIndex(-1);
                            }
                          }
                        })} 
                      />
                      <PopupMorphContainer
                        key="search-author-menu"
                        activeKey={searchCollectionTarget?.id === author.id ? "search-collections" : "search-options-list"}
                        direction={searchCollectionTarget?.id === author.id ? 1 : -1}
                        targetWidth={searchCollectionTarget?.id === author.id ? 260 : 180}
                        targetRadius={searchCollectionTarget?.id === author.id ? 24 : 20}
                        style={getButtonCoverPopupStyle(searchMenuAnchor, searchCollectionTarget?.id === author.id ? 260 : 180, 260, 'right')}
                        className="z-[9999]"
                      >
                        {searchCollectionTarget?.id === author.id ? (
                          <CollectionPickerPopupContent
                            itemType="author"
                            itemId={author.id}
                            collections={collections}
                            onToggleItem={handleToggleItemInCollection}
                            onBack={() => setSearchCollectionTarget(null)}
                            onClose={() => {
                              setActiveSearchMenuId(null);
                              clearButtonCoverAnchorCache(searchMenuAnchor);
                              setSearchMenuAnchor(null);
                              setSearchCollectionTarget(null);
                            }}
                          />
                        ) : (
                          <PagedMenu className="flex flex-col p-2 text-left rtl:text-right">
                            <MenuOptionItem 
                              icon={<User size={14} />} 
                              onClick={() => { 
                                addToSearchHistory(searchQuery);
                                navigateTo('author-detail', author); 
                                setActiveSearchMenuId(null); 
                                clearButtonCoverAnchorCache(searchMenuAnchor);
                                setSearchMenuAnchor(null);
                                setSearchQuery(''); 
                              }}
                            >
                              <span>{t('go_to_author')}</span>
                            </MenuOptionItem>

                            {/* Adicionar à coleção acima de favoritar */}
                            <MenuOptionItem 
                              icon={<FolderPlus size={14} />} 
                              onClick={() => { 
                                setSearchCollectionTarget({ type: 'author', id: author.id });
                              }}
                            >
                              <span>{t('add_to_collection')}</span>
                            </MenuOptionItem>

                            <MenuOptionItem 
                              icon={isFav ? <StarOff size={14} /> : <Star size={14} />} 
                              onClick={() => { 
                                toggleFavoriteAuthor(author.id); 
                                setActiveSearchMenuId(null); 
                                clearButtonCoverAnchorCache(searchMenuAnchor);
                                setSearchMenuAnchor(null);
                              }}
                            >
                              <span>{isFav ? t('remove_favorite_author') : t('favorite_author')}</span>
                            </MenuOptionItem>
                          </PagedMenu>
                        )}
                      </PopupMorphContainer>
                    </>
                  )}
                </AnimatePresence>,
                document.body
              )}
            </div>
          </motion.div>
        );
      }

      return null;
    });
  };

  // ===== Voltar do sistema (Android/navegador) e gesto da borda esquerda =====
  // Cada nível de navegação (submenu, player em tela cheia) vira uma entrada no histórico do navegador:
  // o botão/gesto "voltar" do sistema fecha o pop-up aberto, minimiza o player ou volta para a tela anterior.
  const navDepth = historyStack.length + (isFullScreen ? 1 : 0) + (mobileSheet ? 1 : 0) + (mobileConfirm ? 1 : 0) + (sharePreview ? 1 : 0);
  const browserDepthRef = useRef(0);
  const ignorePopRef = useRef(0);
  const systemBackRef = useRef<() => void>(() => {});
  systemBackRef.current = () => {
    if (sharePreview) {
      closeSharePreview();
      return;
    }
    if (mobileConfirm) {
      setMobileConfirm(null);
      return;
    }
    if (mobileSheet) {
      setMobileSheet(null);
      return;
    }
    if (typeof document !== 'undefined' && document.querySelector('[data-popup-content="true"]')) {
      closeAllPopups();
      return;
    }
    if (isFullScreen) {
      setIsFullScreen(false);
      return;
    }
    if (historyStack.length > 0) goBack();
  };
  useEffect(() => {
    if (typeof window === 'undefined' || !window.history?.pushState) return;
    // iPhone/iPad: sem entradas no histórico. Lá não há botão "voltar" do sistema, e com histórico o gesto
    // nativo da borda arrastava a página inteira (inclusive a barra de abas e o miniplayer); assim, só o
    // gesto do próprio app (que move apenas a tela) faz o voltar
    if (IS_APPLE_TOUCH) return;
    if (navDepth > browserDepthRef.current) {
      while (browserDepthRef.current < navDepth) {
        browserDepthRef.current += 1;
        window.history.pushState({ appDepth: browserDepthRef.current }, '');
      }
    } else if (navDepth < browserDepthRef.current) {
      const n = browserDepthRef.current - navDepth;
      browserDepthRef.current = navDepth;
      ignorePopRef.current += 1;
      window.history.go(-n);
    }
  }, [navDepth]);
  // Gesto da borda: o nosso "voltar" pendente e o momento do último toque na borda.
  // No Safari, arrastar da borda também faz o navegador voltar sozinho: sem isso, a tela voltava duas
  // vezes (indo parar no menu principal) e as duas animações se sobrepunham.
  const edgeSwipeRef = useRef({ pendingBack: false, backAt: 0, edgeTouchAt: 0 });
  useEffect(() => {
    const onPop = () => {
      if (ignorePopRef.current > 0) {
        ignorePopRef.current -= 1;
        return;
      }
      const swipe = edgeSwipeRef.current;
      const now = Date.now();
      if (swipe.pendingBack) {
        swipe.pendingBack = false;
      } else if (now - swipe.backAt < 1200) {
        // Segundo "voltar" do mesmo gesto (o do navegador): desfaz no histórico e ignora
        window.history.pushState({ appDepth: browserDepthRef.current }, '');
        return;
      } else if (now - swipe.edgeTouchAt < 1500) {
        // Só o navegador voltou (ele já animou com a própria prévia): troca de tela sem animar de novo
        setNavDirection('instant');
        const el = mainScrollRef.current;
        if (el) { el.style.transition = ''; el.style.transform = ''; }
      }
      browserDepthRef.current = Math.max(0, browserDepthRef.current - 1);
      systemBackRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Pop-ups no toque: destaque na opção tocada e escolha por arrasto (solta para escolher)
  useEffect(() => installTouchMenus(), []);
  // Áreas com rolagem: bordas que se dissolvem (sem corte seco)
  useEffect(() => installScrollFades(), []);

  // Arrastar da borda esquerda para o centro volta para a tela anterior (a tela acompanha o dedo)
  // Depois do gesto da borda, a área das telas volta ao lugar no mesmo quadro em que a troca começa
  const pendingSwipeResetRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = pendingSwipeResetRef.current;
    if (!el) return;
    pendingSwipeResetRef.current = null;
    el.style.transition = '';
    el.style.transform = '';
  }, [activeScreen]);
  const navDepthRef = useRef(navDepth);
  navDepthRef.current = navDepth;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let start: { x: number; y: number; t: number } | null = null;
    let active = false;
    let target: HTMLElement | null = null;
    const EDGE = 24;
    const isRtl = () => document.documentElement.dir === 'rtl';
    const reset = (animateBack: boolean) => {
      if (target) {
        target.style.transition = animateBack ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.28s ease' : '';
        target.style.transform = '';
        target.style.borderRadius = '';
        const el = target;
        setTimeout(() => { el.style.transition = ''; }, 300);
      }
      start = null; active = false; target = null;
    };
    const onStart = (e: TouchEvent) => {
      if (navDepthRef.current === 0 || e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      const fromEdge = isRtl() ? window.innerWidth - x : x;
      if (fromEdge > EDGE) return;
      edgeSwipeRef.current.edgeTouchAt = Date.now();
      if ((e.target as HTMLElement)?.closest?.('input, textarea, [data-popup-content="true"]')) return;
      start = { x, y: e.touches[0].clientY, t: performance.now() };
    };
    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const dxRaw = e.touches[0].clientX - start.x;
      const dx = isRtl() ? -dxRaw : dxRaw;
      const dy = e.touches[0].clientY - start.y;
      if (!active) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { start = null; return; }
        if (dx < 10) return;
        active = true;
        target = (document.querySelector('[data-fullscreen-player="true"]') as HTMLElement) || mainScrollRef.current;
      }
      if (e.cancelable) e.preventDefault();
      if (!target) return;
      if (target !== mainScrollRef.current) {
        // Player em tela cheia: não desliza como uma página; encolhe um pouco em direção ao miniplayer
        const progress = Math.min(1, Math.max(0, dx) / window.innerWidth);
        target.style.transformOrigin = '50% 100%';
        target.style.transform = `scale(${1 - progress * 0.12})`;
        target.style.borderRadius = `${Math.round(progress * 40)}px`;
        return;
      }
      target.style.transform = `translateX(${(isRtl() ? -1 : 1) * Math.max(0, dx) * 0.85}px)`;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start || !active) { reset(false); return; }
      const dxRaw = (e.changedTouches[0]?.clientX ?? start.x) - start.x;
      const dx = isRtl() ? -dxRaw : dxRaw;
      const dt = Math.max(1, performance.now() - start.t);
      const shouldGoBack = dx > window.innerWidth * 0.32 || (dx > 50 && dx / dt > 0.5);
      if (shouldGoBack) {
        const el = target;
        start = null; active = false; target = null;
        const isScreen = el === mainScrollRef.current;
        if (isScreen && el) {
          // A tela atual continua saindo a partir da posição do dedo (pela animação da troca de telas)
          setSwipeRelease(Math.max(0, dx * 0.85), el.clientWidth);
          setNavDirection('popSwipe');
          pendingSwipeResetRef.current = el;
          if (IS_APPLE_TOUCH) {
            systemBackRef.current();
          } else {
            edgeSwipeRef.current.pendingBack = true;
            edgeSwipeRef.current.backAt = Date.now();
            window.history.back();
          }
        } else {
          // Player em tela cheia: minimiza na hora, com a mesma animação de minimizar (encolhe até o
          // miniplayer), em vez da animação de voltar das páginas
          if (el) { el.style.transition = ''; el.style.transform = ''; el.style.borderRadius = ''; el.style.transformOrigin = ''; }
          edgeSwipeRef.current.backAt = Date.now() + 200;
          if (IS_APPLE_TOUCH) {
            systemBackRef.current();
          } else {
            edgeSwipeRef.current.pendingBack = true;
            window.history.back();
          }
        }
      } else {
        reset(true);
      }
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', () => reset(true), { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, []);

  if (devCrashScreen) {
    throw new Error('Simulação de erro crítico do sistema iniciada pelo Modo de Desenvolvedor (//dev).');
  }

  return (
    <I18nContext.Provider value={{ language: resolvedLanguage, appLanguage, setAppLanguage, t }}>
      <CollectionsContext.Provider value={{
        collections,
        onToggleItemInCollection: handleToggleItemInCollection,
        onCreateCollection: handleStartCreateCollection,
      }}>
        <div className="app-shell flex h-[100dvh] w-screen bg-mica text-main font-fluent select-none overflow-hidden transition-colors duration-500 relative pl-0 md:pl-[272px] rtl:md:pl-0 rtl:md:pr-[272px]" style={appStyle}>

      
      {/* Toast de Notificação */}
      {/* Seletores de arquivos: sempre presentes e "visíveis" para o navegador (no iPhone, um campo dentro
          de uma área oculta não abre o seletor), mas fora da vista */}
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*,.mp3,.m4a,.m4b,.mp4,.aac,.ogg,.wav,.flac,.opus,.wma"
        multiple
        aria-hidden="true"
        tabIndex={-1}
        style={{ position: 'fixed', left: 0, top: 0, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        onChange={handleFileUpload}
      />
      <input
        type="file"
        ref={folderInputRef}
        multiple
        aria-hidden="true"
        tabIndex={-1}
        style={{ position: 'fixed', left: 0, top: 0, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        {...({ webkitdirectory: '', directory: '' } as any)}
        onChange={async (e) => {
          if (e.target.files && e.target.files.length > 0) await processAudioFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="max-md:hidden fixed top-6 left-1/2 md:left-[calc(50vw+136px)] rtl:md:left-auto rtl:md:right-[calc(50vw+136px)] -translate-x-1/2 rtl:translate-x-1/2 z-[300] bg-card/90 backdrop-blur-xl border border-winblue/20 text-winblue px-5 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SIDEBAR FLUTUANTE */}
      <Sidebar
        currentRoot={currentRoot}
        activeScreenId={activeScreen.id}
        navigateTo={navigateTo}
        onFocusSearch={() => searchInputRef.current?.focus()}
        sidebarHighlight={sidebarHighlightHold ? sidebarHighlightHold.value : sidebarHighlight}
        t={t}
      />
      {!isFullScreen && (
        <MobileBottomBar
          currentRoot={currentRoot}
          activeScreenId={activeScreen.id}
          navigateTo={navigateTo}
          onFocusSearch={() => searchInputRef.current?.focus()}
          highlight={sidebarHighlightHold ? sidebarHighlightHold.value : sidebarHighlight}
          t={t}
        />
      )}

      {/* 2. ÁREA DE TELAS PRINCIPAIS */}
      <main 
        className="flex-1 min-w-0 h-full bg-transparent flex flex-col relative z-20"
        style={sidebarHighlight ? ({
          '--winblue': sidebarHighlight.hex,
          '--winblue-rgb': sidebarHighlight.rgb,
          '--color-winblue': sidebarHighlight.hex,
          '--book-accent': sidebarHighlight.hex,
          '--book-accent-rgb': sidebarHighlight.rgb,
        } as React.CSSProperties) : undefined}
      >
        {/* Apple Gradient Backdrop Blur Header (Desfoque progressivo cobrindo toda a largura até a extremidade esquerda atrás do menu lateral) */}
        <div 
          ref={headerBlurRef}
          aria-hidden="true"
          className="apple-header-blur fixed inset-x-0 top-0"
          // Páginas de audiobook e de autor (capa/foto colorida no topo): o véu do desfoque usa um tom da cor
          // da capa, e não o cinza/branco do fundo do app (que fazia uma faixa "suja" sobre a capa)
          style={{ ['--header-blur' as any]: 0, ...(headerTintColor ? { ['--header-tint' as any]: headerTintColor } : {}) }}
        >
          <div className="apple-blur-layer" />
          <div className="apple-blur-layer" />
          <div className="apple-blur-layer" />
          <div className="apple-blur-layer" />
          <div className="apple-blur-layer" />
          <div className="apple-blur-layer" />
          <div className="apple-blur-tint" />
        </div>

        {/* Sticky Header (Botões e Título de Submenu travados e transparentes) */}
        <div
          className="sticky top-0 z-40 w-full h-0"
          style={{
            opacity: isFullScreen || isAppHeaderHidden ? 0 : 1,
            visibility: isFullScreen || isAppHeaderHidden ? 'hidden' : 'visible',
            transition: isFullScreen || isAppHeaderHidden ? 'none' : 'opacity 0.16s ease-out',
          }}
        >
          <div data-app-header="true" className="px-4 md:px-8 pt-[var(--app-header-top)] pb-5 flex items-center justify-between w-full bg-transparent pointer-events-none relative">
            <div className="flex items-center gap-4 pointer-events-auto shrink-0 z-10">
              <AnimatePresence mode="wait">
                {historyStack.length > 0 && (!['home', 'library', 'other-apps', 'settings', 'help', 'search', 'more'].includes(activeScreen.id) || historyStack[0]?.id === 'more') && (
                  <motion.button 
                    key="back-button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.08 } }}
                    transition={{ type: 'spring', stiffness: 520, damping: 36, mass: 0.55 }}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={goBack}
                    // Celular: ao rolar, a pílula encolhe suavemente até virar um círculo só com a seta
                    // (o texto se recolhe e some), e volta ao subir
                    style={{
                      paddingLeft: backCollapsed ? 'calc((var(--back-btn-h) - 22px) / 2)' : '1rem',
                      paddingRight: backCollapsed ? 'calc((var(--back-btn-h) - 22px) / 2)' : '1rem',
                      transition: 'padding 0.2s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s, border-color 0.2s, box-shadow 0.2s',
                    }}
                    className="h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] backdrop-blur-3xl"
                    aria-label={t('back') || undefined}
                  >
                    <ChevronLeft size={14} className="text-[var(--text-main)] rtl:rotate-180 shrink-0" />
                    <motion.span
                      initial={false}
                      animate={backCollapsed
                        ? { maxWidth: 0, opacity: 0, marginLeft: 0, marginRight: 0, filter: 'blur(4px)' }
                        : { maxWidth: 320, opacity: 1, marginLeft: 6, marginRight: 0, filter: 'blur(0px)' }}
                      transition={{ maxWidth: { type: 'spring', stiffness: 760, damping: 52, mass: 0.5 }, marginLeft: { type: 'spring', stiffness: 760, damping: 52, mass: 0.5 }, opacity: { duration: backCollapsed ? 0.08 : 0.14, delay: backCollapsed ? 0 : 0.05 }, filter: { duration: 0.12 } }}
                      className="block overflow-hidden whitespace-nowrap text-xs font-medium text-[var(--text-main)] truncate max-md:max-w-[40vw]"
                    >
                      {(() => {
                        const prev = historyStack[historyStack.length - 1];
                        const id = prev.id;
                        if (id === 'home') return t('nav_home');
                        if (id === 'more') return t('nav_more');
                        if (id === 'home-continuar-ouvindo') return t('section_continue_listening');
                        if (id === 'home-ouvidos-recentemente') return t('section_recently_listened');
                        if (id === 'home-adicionados-recentemente') return t('section_recently_added');
                        if (id === 'search') return t('nav_search');
                        if (id === 'library') return t('nav_library');
                        if (id === 'other-apps') return t('nav_other_apps');
                        if (id === 'library-genre') return prev.data?.genre ? getGenreName(prev.data.genre, resolvedLanguage) : t('genres');
                        if (id === 'library-subgenre') return prev.data?.subgenre ? getSubgenreName(prev.data.subgenre, resolvedLanguage) : t('subgenre');
                        if (id.startsWith('library-genre-')) {
                          const genreId = id.replace('library-genre-', '');
                          const genreData = Object.values(GENRE_HIERARCHY).find(g => g.id === genreId);
                          return genreData ? getGenreName(genreData.id, resolvedLanguage) : t('genres');
                        }
                        if (id.startsWith('library-subgenre-')) {
                          if (prev.data?.subgenre) return getSubgenreName(prev.data.subgenre, resolvedLanguage);
                          if (typeof prev.data === 'string') return getSubgenreName(prev.data, resolvedLanguage);
                          const after = id.replace('library-subgenre-', '');
                          const matchedGenre = Object.values(GENRE_HIERARCHY)
                            .sort((a, b) => b.id.length - a.id.length)
                            .find(g => after.startsWith(g.id + '-'));
                          const subName = matchedGenre ? after.substring(matchedGenre.id.length + 1) : after;
                          return getSubgenreName(subName, resolvedLanguage) || t('subgenre');
                        }
                        if (id === 'create-collection') return t('create_collection');
                        if (id === 'edit-collection') return t('edit_collection');
                        if (id === 'library-idiomas') return t('languages');
                        if (id === 'library-colecoes') return t('collections');
                        const prevColSubTitle = getCollectionSubScreenTitle(id, prev.data);
                        if (prevColSubTitle) return prevColSubTitle;
                        if (id.startsWith('library-colecao-')) {
                          const colId = id.replace('library-colecao-', '');
                          const c = collections.find(item => item.id === colId) || (prev.data as Collection);
                          return c?.name || t('collection');
                        }
                        if (id.startsWith('library-idioma-')) {
                          const l = typeof prev.data === 'string' ? prev.data : (prev.data?.name || id.replace('library-idioma-', ''));
                          if (normalizeAudiobookLanguage(l) === 'Outro') {
                            return getLanguageCardName(l, resolvedLanguage);
                          }
                          return t('books_in_language', { lang: getLanguageDisplayName(l, resolvedLanguage) });
                        }
                        if (id.startsWith('library-')) {
                          const sub = id.replace('library-', '');
                          const subNames: Record<string, string> = {
                            'favoritos': t('favorite_audiobooks'),
                            'audiobooks-favoritos': t('favorite_audiobooks'),
                            'autores-favoritos': t('favorite_authors'),
                            'títulos': t('all_audiobooks'),
                            'autores': t('authors'),
                            'gêneros': t('genres'),
                            'idiomas': t('languages'),
                            'colecoes': t('collections'),
                            'ouvidos-recentemente': t('recently_listened'),
                          };
                          return subNames[sub] || sub.charAt(0).toUpperCase() + sub.slice(1);
                        }
                        if (id === 'author-detail') return prev.data?.name || t('authors');
                        if (id === 'book-detail') return prev.data?.title || selectedBook?.title || t('audiobook_label');
                        if (id === 'settings-interface') return t('settings_interface');
                        if (id === 'settings-biblioteca') return t('settings_library');
                        if (id === 'settings-reproducao') return t('settings_playback');
                        if (id === 'settings-notificacoes') return t('settings_notifications');
                        if (id === 'settings-atalhos' || id === 'help-atalhos') return t('settings_shortcuts');
                        if (id === 'settings-sistema') return t('settings_sistema');
                        if (id === 'settings-option') return prev.data?.title || t('settings_title');
                        if (id === 'settings-action') return prev.data?.title || t('settings_title');
                        if (id.startsWith('settings')) return t('settings_title');
                        if (id === 'book-info') return t('more_details');
                        if (id === 'app-info') return prev.data?.title || t('details');
                        if (id === 'help-theme') {
                          const themeId = typeof prev.data === 'object' ? prev.data?.id : prev.data;
                          const th = helpThemes.find(t => t.id === themeId);
                          return th?.title || prev.data?.title || t('nav_help');
                        }
                        if (id === 'help-article') {
                          const themeId = prev.data?.theme?.id || prev.data?.themeId;
                          const th = helpThemes.find(t => t.id === themeId);
                          return th?.title || prev.data?.theme?.title || prev.data?.title || t('nav_help');
                        }
                        if (id.startsWith('help')) return t('nav_help');
                        return t('back');
                      })()}
                    </motion.span>

                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* TÍTULO CENTRALIZADO RESSURGINDO NO CABEÇALHO (APPLE-STYLE INLINE TITLE) */}
            <AnimatePresence>
              {(isTitleScrolledPast || isLandscapePhone) && activeScreen.id !== 'search' && currentScreenTitle && (
                <motion.div
                  key={`header-title-${activeScreen.id}`}
                  initial={{ opacity: 0, y: 7, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.96 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 520, 
                    damping: 38, 
                    mass: 0.55 
                  }}
                  className="absolute left-1/2 -translate-x-1/2 top-[var(--app-header-top)] h-9 flex items-center justify-center pointer-events-auto cursor-default z-30 max-w-[42%] sm:max-w-[50%] md:max-w-[58%]"
                  title={currentScreenTitle}
                >
                  <div className="relative flex items-center justify-center max-w-full">
                    {/* Efeito de sombra difusa / profundidade no fundo do título */}
                    <div 
                      className="absolute -inset-x-6 -inset-y-2 bg-black/15 dark:bg-black/50 rounded-full blur-xl -z-10 pointer-events-none" 
                      aria-hidden="true"
                    />
                    <h2 className="text-lg md:text-[19px] font-bold text-[var(--text-main)] truncate tracking-tight text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.22)] dark:drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)] select-none">
                      {currentScreenTitle}
                    </h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* BARRA DE PESQUISA NO CABEÇALHO: CENTRALIZADA NA TELA DO MENU */}
            {activeScreen.id === 'search' && (
              <div className="absolute left-1/2 -translate-x-1/2 top-[var(--app-header-top)] pointer-events-auto z-40">
                <motion.div
                  data-search-bar="true"
                  animate={{ x: searchQuery.length > 0 && !isMobile ? (resolvedLanguage === 'ar' ? 28 : -28) : 0 }}
                  transition={{ type: "spring", stiffness: 460, damping: 34, mass: 0.6 }}
                  className="relative flex items-center max-md:w-[calc(100vw-32px)]"
                >
                  <div className="relative group/searchbar max-md:w-full">
                    <div
                      style={isMobile ? { width: searchQuery.length > 0 ? 'calc(100% - 52px)' : '100%', transition: 'width 0.32s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.15s, border-color 0.15s' } : undefined}
                      className="h-9 max-md:h-11 w-64 sm:w-80 md:w-[380px] flex items-center gap-2 px-3.5 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] focus-within:bg-white/15 focus-within:border-winblue/40 focus-within:shadow-[0_0_20px_rgba(var(--winblue-rgb),0.3)] text-[var(--text-main)] transition-all backdrop-blur-3xl">
                      <Search size={14} className="text-[var(--text-muted)] group-focus-within/searchbar:text-winblue transition-colors shrink-0" />
                      <input
                        ref={searchInputRef}
                        autoFocus
                        type="text"
                        placeholder={t('search_placeholder')}
                        enterKeyHint="search"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setActiveSearchMenuId(null);
                          clearButtonCoverAnchorCache(searchMenuAnchor);
                          setSearchMenuAnchor(null);
                          setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
                          setSearchSelectedIndex(-1);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            if (computedSearchResults.length > 0) {
                              setSearchSelectedIndex(prev => Math.min(computedSearchResults.length - 1, prev + 1));
                            }
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSearchSelectedIndex(prev => Math.max(-1, prev - 1));
                          } else if (e.key === 'Enter') {
                            if (searchSelectedIndex >= 0 && searchSelectedIndex < computedSearchResults.length) {
                              e.preventDefault();
                              handleSelectSearchItem(computedSearchResults[searchSelectedIndex]);
                            } else if (searchQuery.trim()) {
                              addToSearchHistory(searchQuery);
                            }
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setSearchQuery('');
                            setActiveSearchMenuId(null);
                            clearButtonCoverAnchorCache(searchMenuAnchor);
                            setSearchMenuAnchor(null);
                            setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
                            setSearchSelectedIndex(-1);
                          }
                        }}
                        className="bg-transparent border-none outline-none text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] w-full font-medium"
                      />
                    </div>

                    {/* Pop-up de resultados surgindo abaixo da barra */}
                    <AnimatePresence>
                      {searchQuery.length > 0 && (
                        <>
                          {!isMobile && <div className="fixed inset-0 z-[95] cursor-default" 
                            {...getBackdropProps(() => {
                              setSearchQuery('');
                              setActiveSearchMenuId(null);
                              clearButtonCoverAnchorCache(searchMenuAnchor);
                              setSearchMenuAnchor(null);
                              setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
                              setSearchSelectedIndex(-1);
                            })} 
                          />}
                          {(() => {
                            const searchResultsEl = (
<motion.div
                            data-popup-content="true"
                            data-search-dropdown="true"
                            initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={isMobile ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
                            onClick={(e) => e.stopPropagation()}
                            className={isMobile
                              ? "relative w-full flex flex-col"
                              : "absolute top-full left-1/2 -translate-x-1/2 mt-3 w-full min-w-[272px] sm:min-w-[368px] md:min-w-[416px] max-h-[calc(100vh-220px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[28px] shadow-2xl z-[100] flex flex-col overflow-hidden"}
                          >
                            {searchQuery.trim().toLowerCase() === '//dev' ? (
                              <Suspense fallback={
                                <div className="p-6 flex items-center justify-center">
                                  <div className="w-8 h-8 rounded-full border-2 border-winblue border-t-transparent animate-spin" />
                                </div>
                              }>
                                <DevToolsModal
                                  onInjectDevBooks={handleInjectDevBooks}
                                  onSimulateDevProgress={handleSimulateDevProgress}
                                  onToggleDevZeroState={handleToggleDevZeroState}
                                  onShowWelcome={() => {
                                    closeAllPopups();
                                    setOnboardingStep('welcome');
                                    setShowOnboarding(true);
                                    showToast('Modo Dev: Tela de primeira abertura exibida!');
                                  }}
                                  onSimulateFirstLaunch={handleSimulateFirstLaunch}
                                  onTestDevNotifications={handleTestDevNotifications}
                                  onSimulateDevError={handleSimulateDevError}
                                  onSimulateFullScreenError={handleSimulateFullScreenError}
                                />
                              </Suspense>
                            ) : (
                              <>
                                {isMobile ? (
                                  <div className="flex items-center justify-between mb-4 min-h-11">
                                    <h2 className="text-xl font-bold text-[var(--text-main)] truncate">{t('search_results')}</h2>
                                  </div>
                                ) : (
                                  <div className="px-5 pt-4 pb-1 shrink-0 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-[var(--text-main)] truncate">{t('search_results_for', { query: searchQuery })}</h3>
                                  </div>
                                )}

                                <div 
                                  onMouseLeave={() => setSearchSelectedIndex(-1)}
                                  onScroll={() => {
                                    if (activeSearchMenuId) {
                                      setActiveSearchMenuId(null);
                                      clearButtonCoverAnchorCache(searchMenuAnchor);
                                      setSearchMenuAnchor(null);
                                      setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
                                    }
                                  }}
                                  data-scroll-fade={isMobile ? undefined : 'search'}
                                  className={isMobile ? "space-y-2" : "space-y-2 flex-1 overflow-y-auto custom-scrollbar p-3 pb-6"}
                                >
                                  {renderSearchResultsList()}
                                </div>
                              </>
                            )}
                          </motion.div>
                            );
                            if (!isMobile) return searchResultsEl;
                            return mobileSearchSlot ? createPortal(searchResultsEl, mobileSearchSlot) : null;
                          })()}
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Botão de X ao lado direito da barra (aparece apenas quando há texto digitado) */}
                  <AnimatePresence>
                    {searchQuery.length > 0 && (
                      <motion.button
                        key="btn-clear-search"
                        initial={{ opacity: 0, scale: 0.55, x: resolvedLanguage === 'ar' ? 18 : -18 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.55, x: resolvedLanguage === 'ar' ? 18 : -18 }}
                        transition={{ type: "spring", stiffness: 480, damping: 34, mass: 0.55 }}
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          setSearchQuery('');
                          setActiveSearchMenuId(null);
                          clearButtonCoverAnchorCache(searchMenuAnchor);
                          setSearchMenuAnchor(null);
                          setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
                          setSearchSelectedIndex(-1);
                          searchInputRef.current?.focus();
                        }}
                        className="absolute left-full rtl:left-auto rtl:right-full ml-3 rtl:ml-0 rtl:mr-3 max-md:left-auto max-md:right-0 max-md:ml-0 rtl:max-md:right-auto rtl:max-md:left-0 rtl:max-md:mr-0 top-0 z-[110] w-9 h-9 max-md:w-11 max-md:h-11 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all backdrop-blur-3xl shrink-0 cursor-pointer"
                        title={t('clear_search')}
                      >
                        <X size={13} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {/* Mobile: no máximo dois botões (ação rápida + três pontinhos) */}
            {isMobile && !isSelectionMode && !isEditingBook && !isEditingAuthor && activeScreen.id !== 'create-collection' && activeScreen.id !== 'edit-collection' && (
              <div className="md:hidden flex items-center pointer-events-auto shrink-0 z-40">
                {renderMobileHeaderActions()}
              </div>
            )}
            <div className={cn(
              "items-center gap-3 pointer-events-auto shrink-0 z-40",
              isMobile && !isSelectionMode && !isEditingBook && !isEditingAuthor && activeScreen.id !== 'create-collection' && activeScreen.id !== 'edit-collection' ? "hidden" : "flex"
            )}>
              {/* Botão de Encerrar Modo de Desenvolvedor no cabeçalho em todas as telas e menus */}
              <AnimatePresence>
                {isDevModeActive && (
                  <motion.button
                    key="btn-exit-dev-mode"
                    initial={{ opacity: 0, scale: 0.85, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.85, x: -10 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExitDevMode}
                    title={t('exit_dev_mode')}
                    className="max-md:hidden h-9 px-3.5 rounded-full bg-gradient-to-r from-amber-500/25 via-amber-500/20 to-orange-500/25 border border-amber-500/50 text-amber-400 hover:text-amber-300 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all backdrop-blur-3xl font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-lg cursor-pointer select-none"
                  >
                    <Code2 size={13} className="text-amber-400 animate-pulse shrink-0" />
                    <span>{t('exit_dev_mode')}</span>
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {isSelectionMode ? (
                    <motion.div
                      key="selection-mode"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.08 } }}
                      transition={{ type: 'spring', stiffness: 520, damping: 36, mass: 0.55 }}
                      className="flex items-center gap-2.5"
                    >
                      <div className={`relative ${showDeleteSelectionConfirm ? 'z-50' : 'z-10'}`}>
                        {(() => {
                          const isCollectionsScreen = activeScreen.id === 'library-colecoes';
                          const isAuthorsScreen = activeScreen.id === 'library-autores' || activeScreen.id === 'library-autores-favoritos';
                          const isGenresScreen = activeScreen.id === 'library-gêneros';
                          const isLanguagesScreen = activeScreen.id === 'library-idiomas';
                          const currentSelectionCount = isCollectionsScreen
                            ? selectedCollectionIds.length
                            : isAuthorsScreen
                            ? selectedAuthors.length
                            : isGenresScreen
                            ? selectedGenres.length
                            : isLanguagesScreen
                            ? selectedLanguages.length
                            : selectedBooks.length;

                          return (
                            <>
                              <motion.button 
                                key="btn"
                                whileHover={{ scale: 1.12 }}
                                whileTap={{ scale: 0.92 }}
                                animate={morphTriggerAnimate(showDeleteSelectionConfirm)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (currentSelectionCount === 0) {
                                    const msg = isCollectionsScreen
                                      ? t('no_selection_books')
                                      : isAuthorsScreen 
                                      ? t('no_selection_authors') 
                                      : isGenresScreen 
                                      ? t('no_selection_genres') 
                                      : isLanguagesScreen 
                                      ? t('no_selection_languages') 
                                      : t('no_selection_books');
                                    showToast(msg);
                                    return;
                                  }
                                  closeAllPopups();
                                  setShowDeleteSelectionConfirm(true);
                                }}
                                // Celular: só o ícone (botão redondo); computador: ícone e texto
                                aria-label={`${t('delete')}${currentSelectionCount > 0 ? ` (${currentSelectionCount})` : ''}`}
                                title={`${t('delete')}${currentSelectionCount > 0 ? ` (${currentSelectionCount})` : ''}`}
                                className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-card/75 border border-red-500/20 shadow-xl hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs"
                              >
                                <Trash2 size={13} className="max-md:w-5 max-md:h-5" />
                                <span className="max-md:hidden">{t('delete')} {currentSelectionCount > 0 ? `(${currentSelectionCount})` : ''}</span>
                              </motion.button>

                              <AnimatePresence>
                                {showDeleteSelectionConfirm && (
                                  isMobile ? (
<MobileConfirmCard key="selection-confirm" onClose={() => setShowDeleteSelectionConfirm(false)}>
                                      <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1">
                                        {isCollectionsScreen
                                          ? t('delete_collections_confirm_title')
                                          : isAuthorsScreen
                                          ? t('confirm_delete_authors')
                                          : isGenresScreen
                                          ? t('confirm_delete_genres')
                                          : isLanguagesScreen
                                          ? t('confirm_delete_languages')
                                          : t('confirm_delete_books')}
                                      </h4>
                                      {isCollectionsScreen && (
                                        <p className="text-xs text-[var(--text-muted)] px-1 mb-3 leading-relaxed">
                                          {t('delete_collections_confirm_desc')}
                                        </p>
                                      )}
                                      
                                      <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1 mb-4">
                                        {isCollectionsScreen ? (
                                          collections
                                            .filter(c => selectedCollectionIds.includes(c.id))
                                            .map(c => (
                                              <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-xl shrink-0 shadow-sm`}>
                                                  {c.emoji}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{c.name}</p>
                                                  {c.description?.trim() && <p className="text-xs text-[var(--text-muted)] truncate">{c.description.trim()}</p>}
                                                </div>
                                              </div>
                                            ))
                                        ) : isAuthorsScreen ? (
                                          selectedAuthors
                                            .map(id => sortedAuthors.find(a => a.id === id))
                                            .filter(Boolean)
                                            .map(author => (
                                              <div key={author!.id} className="flex items-center gap-3 p-2">
                                                <img 
                                                  src={getEffectiveAuthorAvatar(author!.name, author!.picture)} 
                                                  alt={author!.name} 
                                                  className="w-11 h-11 aspect-square rounded-xl object-cover shrink-0 shadow-sm" 
                                                />
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{author!.name}</p>
                                                  <p className="text-xs text-[var(--text-muted)] truncate">{getNationalityDisplayName(author!.nationality, resolvedLanguage) || t('author_label')}</p>
                                                </div>
                                              </div>
                                            ))
                                        ) : isGenresScreen ? (
                                          selectedGenres
                                            .map(id => sortedGenres.find(g => g.id === id))
                                            .filter(Boolean)
                                            .map(genre => (
                                              <div key={genre!.id} className="flex items-center gap-3 p-2">
                                                <div className="w-11 h-11 rounded-xl bg-card/80 border border-white/10 flex items-center justify-center text-xl shrink-0 shadow-sm">
                                                  {getGenreEmoji(genre!.id)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{getGenreName(genre!.id, resolvedLanguage)}</p>
                                                  <p className="text-xs text-[var(--text-muted)] truncate">{t('genres')}</p>
                                                </div>
                                              </div>
                                            ))
                                        ) : isLanguagesScreen ? (
                                          selectedLanguages
                                            .map(lang => getLanguageData(lang, resolvedLanguage))
                                            .filter(Boolean)
                                            .map(langData => (
                                              <div key={langData.name} className="flex items-center gap-3 p-2">
                                                <div className="w-11 h-11 rounded-xl bg-card/80 border border-white/10 flex items-center justify-center text-xl shrink-0 shadow-sm">
                                                  {langData.flag}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{langData.name}</p>
                                                  <p className="text-xs text-[var(--text-muted)] truncate">{t('language_label')}</p>
                                                </div>
                                              </div>
                                            ))
                                        ) : (
                                          selectedBooks
                                            .map(id => books.find(b => b.id === id))
                                            .filter(Boolean)
                                            .map(book => (
                                              <div key={book!.id} className="flex items-center gap-3 p-2">
                                                <img 
                                                  src={book!.cover || getGenericBookCover(book!.title, book!.author)} 
                                                  onError={(e) => handleBookCoverError(book!, e)}
                                                  alt={book!.title} 
                                                  className="w-7 h-11 aspect-[1/1.6] rounded-lg object-cover shrink-0 shadow-sm" 
                                                />
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{book!.title}</p>
                                                  <p className="text-xs text-[var(--text-muted)] truncate">{book!.author}</p>
                                                </div>
                                              </div>
                                            ))
                                        )}
                                      </div>

                                      <div className="flex items-center justify-end gap-2.5 pt-1">
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => {
                                            if (isCollectionsScreen) {
                                              setCollections(prev => prev.filter(c => !selectedCollectionIds.includes(c.id)));
                                              setIsSelectionMode(false);
                                              setSelectedCollectionIds([]);
                                              setShowDeleteSelectionConfirm(false);
                                              showToast(t('collections_deleted_toast'));
                                            } else if (isAuthorsScreen) {
                                              const count = selectedAuthors.length;
                                              const authorNames = sortedAuthors.filter(a => selectedAuthors.includes(a.id)).map(a => a.name.trim().toLowerCase());
                                              // O audiobook só sai se todos os autores dele forem excluídos (coautoria fica)
                                              const allAuthorsDeleted = (b: Audiobook) => {
                                                const names = getBookAuthorNames(b).map(n => n.trim().toLowerCase());
                                                return names.length > 0 ? names.every(n => authorNames.includes(n)) : selectedAuthors.includes(b.authorId);
                                              };
                                              const booksToDelete = books.filter(allAuthorsDeleted);
                                              cleanupDeletedBooks(booksToDelete.map(b => b.id));
                                              setBooks(books.filter(b => !allAuthorsDeleted(b)));
                                              setAuthors(prev => prev.filter(a => !selectedAuthors.includes(a.id)));
                                              setIsSelectionMode(false);
                                              setSelectedAuthors([]);
                                              setShowDeleteSelectionConfirm(false);
                                              showToast(t('toast_authors_deleted', { count }));
                                            } else if (isGenresScreen) {
                                              const count = selectedGenres.length;
                                              const targetGenreObjects = Object.values(GENRE_HIERARCHY).filter(g => selectedGenres.includes(g.id));
                                              const booksToDelete = books.filter(b => targetGenreObjects.some(g => isBookInGenre(b, g)));
                                              cleanupDeletedBooks(booksToDelete.map(b => b.id));
                                              setBooks(books.filter(b => !targetGenreObjects.some(g => isBookInGenre(b, g))));
                                              setIsSelectionMode(false);
                                              setSelectedGenres([]);
                                              setShowDeleteSelectionConfirm(false);
                                              showToast(t('toast_genres_deleted', { count }));
                                            } else if (isLanguagesScreen) {
                                              const count = selectedLanguages.length;
                                              const booksToDelete = books.filter(b => {
                                                const { language } = resolveNarratorAndLanguage(b);
                                                if (!language) return false;
                                                return selectedLanguages.includes(language.toLowerCase());
                                              });
                                              cleanupDeletedBooks(booksToDelete.map(b => b.id));
                                              setBooks(books.filter(b => {
                                                const { language } = resolveNarratorAndLanguage(b);
                                                if (!language) return true;
                                                return !selectedLanguages.includes(language.toLowerCase());
                                              }));
                                              setIsSelectionMode(false);
                                              setSelectedLanguages([]);
                                              setShowDeleteSelectionConfirm(false);
                                              showToast(t('toast_languages_deleted', { count }));
                                            } else {
                                              const count = selectedBooks.length;
                                              cleanupDeletedBooks(selectedBooks);
                                              setBooks(books.filter(b => !selectedBooks.includes(b.id)));
                                              setIsSelectionMode(false);
                                              setSelectedBooks([]);
                                              setShowDeleteSelectionConfirm(false);
                                              showToast(t('toast_items_deleted', { count }));
                                            }
                                          }}
                                          className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                        >
                                          <Trash2 size={13} />
                                          <span>{t('delete')}</span>
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => {
                                            setShowDeleteSelectionConfirm(false);
                                            setIsSelectionMode(false);
                                            setSelectedBooks([]);
                                            setSelectedAuthors([]);
                                            setSelectedGenres([]);
                                            setSelectedLanguages([]);
                                            setSelectedCollectionIds([]);
                                          }}
                                          className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                        >
                                          <X size={13} />
                                          <span>{t('cancel')}</span>
                                        </motion.button>
                                      </div>
                                    </MobileConfirmCard>
) : (<>
                                    <div 
                                      className="fixed inset-0 z-40 cursor-default" 
                                      {...getBackdropProps(() => setShowDeleteSelectionConfirm(false))} 
                                    />
                                    <motion.div
                                      key="popup"
                                      data-popup-content="true"
                                      initial={{ opacity: 0, scale: 0.18 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.18 }}
                                      transition={{
                                        opacity: { duration: 0.13, ease: "easeOut" },
                                        scale: { type: "spring", stiffness: 540, damping: 36, mass: 0.55 },
                                      }}
                                      style={{ transformOrigin: "top right" }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute top-0 right-0 w-64 sm:w-80 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[28px] shadow-2xl p-3.5 z-50 flex flex-col"
                                    >
                                      <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1">
                                        {isCollectionsScreen
                                          ? t('delete_collections_confirm_title')
                                          : isAuthorsScreen
                                          ? t('confirm_delete_authors')
                                          : isGenresScreen
                                          ? t('confirm_delete_genres')
                                          : isLanguagesScreen
                                          ? t('confirm_delete_languages')
                                          : t('confirm_delete_books')}
                                      </h4>
                                      {isCollectionsScreen && (
                                        <p className="text-xs text-[var(--text-muted)] px-1 mb-3 leading-relaxed">
                                          {t('delete_collections_confirm_desc')}
                                        </p>
                                      )}
                                      
                                      <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1 mb-4">
                                        {isCollectionsScreen ? (
                                          collections
                                            .filter(c => selectedCollectionIds.includes(c.id))
                                            .map(c => (
                                              <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-xl shrink-0 shadow-sm`}>
                                                  {c.emoji}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{c.name}</p>
                                                  {c.description?.trim() && <p className="text-xs text-[var(--text-muted)] truncate">{c.description.trim()}</p>}
                                                </div>
                                              </div>
                                            ))
                                        ) : isAuthorsScreen ? (
                                          selectedAuthors
                                            .map(id => sortedAuthors.find(a => a.id === id))
                                            .filter(Boolean)
                                            .map(author => (
                                              <div key={author!.id} className="flex items-center gap-3 p-2">
                                                <img 
                                                  src={getEffectiveAuthorAvatar(author!.name, author!.picture)} 
                                                  alt={author!.name} 
                                                  className="w-11 h-11 aspect-square rounded-xl object-cover shrink-0 shadow-sm" 
                                                />
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{author!.name}</p>
                                                  <p className="text-xs text-[var(--text-muted)] truncate">{getNationalityDisplayName(author!.nationality, resolvedLanguage) || t('author_label')}</p>
                                                </div>
                                              </div>
                                            ))
                                        ) : isGenresScreen ? (
                                          selectedGenres
                                            .map(id => sortedGenres.find(g => g.id === id))
                                            .filter(Boolean)
                                            .map(genre => (
                                              <div key={genre!.id} className="flex items-center gap-3 p-2">
                                                <div className="w-11 h-11 rounded-xl bg-card/80 border border-white/10 flex items-center justify-center text-xl shrink-0 shadow-sm">
                                                  {getGenreEmoji(genre!.id)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{getGenreName(genre!.id, resolvedLanguage)}</p>
                                                  <p className="text-xs text-[var(--text-muted)] truncate">{t('genres')}</p>
                                                </div>
                                              </div>
                                            ))
                                        ) : isLanguagesScreen ? (
                                          selectedLanguages
                                            .map(lang => getLanguageData(lang, resolvedLanguage))
                                            .filter(Boolean)
                                            .map(langData => (
                                              <div key={langData.name} className="flex items-center gap-3 p-2">
                                                <div className="w-11 h-11 rounded-xl bg-card/80 border border-white/10 flex items-center justify-center text-xl shrink-0 shadow-sm">
                                                  {langData.flag}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{langData.name}</p>
                                                  <p className="text-xs text-[var(--text-muted)] truncate">{t('language_label')}</p>
                                                </div>
                                              </div>
                                            ))
                                        ) : (
                                          selectedBooks
                                            .map(id => books.find(b => b.id === id))
                                            .filter(Boolean)
                                            .map(book => (
                                              <div key={book!.id} className="flex items-center gap-3 p-2">
                                                <img 
                                                  src={book!.cover || getGenericBookCover(book!.title, book!.author)} 
                                                  onError={(e) => handleBookCoverError(book!, e)}
                                                  alt={book!.title} 
                                                  className="w-7 h-11 aspect-[1/1.6] rounded-lg object-cover shrink-0 shadow-sm" 
                                                />
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{book!.title}</p>
                                                  <p className="text-xs text-[var(--text-muted)] truncate">{book!.author}</p>
                                                </div>
                                              </div>
                                            ))
                                        )}
                                      </div>

                                      <div className="flex items-center justify-end gap-2.5 pt-1">
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => {
                                            if (isCollectionsScreen) {
                                              setCollections(prev => prev.filter(c => !selectedCollectionIds.includes(c.id)));
                                              setIsSelectionMode(false);
                                              setSelectedCollectionIds([]);
                                              setShowDeleteSelectionConfirm(false);
                                              showToast(t('collections_deleted_toast'));
                                            } else if (isAuthorsScreen) {
                                              const count = selectedAuthors.length;
                                              const authorNames = sortedAuthors.filter(a => selectedAuthors.includes(a.id)).map(a => a.name.trim().toLowerCase());
                                              // O audiobook só sai se todos os autores dele forem excluídos (coautoria fica)
                                              const allAuthorsDeleted = (b: Audiobook) => {
                                                const names = getBookAuthorNames(b).map(n => n.trim().toLowerCase());
                                                return names.length > 0 ? names.every(n => authorNames.includes(n)) : selectedAuthors.includes(b.authorId);
                                              };
                                              const booksToDelete = books.filter(allAuthorsDeleted);
                                              cleanupDeletedBooks(booksToDelete.map(b => b.id));
                                              setBooks(books.filter(b => !allAuthorsDeleted(b)));
                                              setAuthors(prev => prev.filter(a => !selectedAuthors.includes(a.id)));
                                              setIsSelectionMode(false);
                                              setSelectedAuthors([]);
                                              setShowDeleteSelectionConfirm(false);
                                              showToast(t('toast_authors_deleted', { count }));
                                            } else if (isGenresScreen) {
                                              const count = selectedGenres.length;
                                              const targetGenreObjects = Object.values(GENRE_HIERARCHY).filter(g => selectedGenres.includes(g.id));
                                              const booksToDelete = books.filter(b => targetGenreObjects.some(g => isBookInGenre(b, g)));
                                              cleanupDeletedBooks(booksToDelete.map(b => b.id));
                                              setBooks(books.filter(b => !targetGenreObjects.some(g => isBookInGenre(b, g))));
                                              setIsSelectionMode(false);
                                              setSelectedGenres([]);
                                              setShowDeleteSelectionConfirm(false);
                                              showToast(t('toast_genres_deleted', { count }));
                                            } else if (isLanguagesScreen) {
                                              const count = selectedLanguages.length;
                                              const booksToDelete = books.filter(b => {
                                                const { language } = resolveNarratorAndLanguage(b);
                                                if (!language) return false;
                                                return selectedLanguages.includes(language.toLowerCase());
                                              });
                                              cleanupDeletedBooks(booksToDelete.map(b => b.id));
                                              setBooks(books.filter(b => {
                                                const { language } = resolveNarratorAndLanguage(b);
                                                if (!language) return true;
                                                return !selectedLanguages.includes(language.toLowerCase());
                                              }));
                                              setIsSelectionMode(false);
                                              setSelectedLanguages([]);
                                              setShowDeleteSelectionConfirm(false);
                                              showToast(t('toast_languages_deleted', { count }));
                                            } else {
                                              const count = selectedBooks.length;
                                              cleanupDeletedBooks(selectedBooks);
                                              setBooks(books.filter(b => !selectedBooks.includes(b.id)));
                                              setIsSelectionMode(false);
                                              setSelectedBooks([]);
                                              setShowDeleteSelectionConfirm(false);
                                              showToast(t('toast_items_deleted', { count }));
                                            }
                                          }}
                                          className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                        >
                                          <Trash2 size={13} />
                                          <span>{t('delete')}</span>
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => {
                                            setShowDeleteSelectionConfirm(false);
                                            setIsSelectionMode(false);
                                            setSelectedBooks([]);
                                            setSelectedAuthors([]);
                                            setSelectedGenres([]);
                                            setSelectedLanguages([]);
                                            setSelectedCollectionIds([]);
                                          }}
                                          className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                        >
                                          <X size={13} />
                                          <span>{t('cancel')}</span>
                                        </motion.button>
                                      </div>
                                    </motion.div>
                                  </>)
                                )}
                              </AnimatePresence>
                            </>
                          );
                        })()}
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.92 }}
                        animate={showDeleteSelectionConfirm
                          ? { scale: 0.85, opacity: 0, pointerEvents: 'none', transition: { duration: 0.14 } }
                          : { scale: 1, opacity: 1, pointerEvents: 'auto', transition: { type: "spring", stiffness: 500, damping: 30 } }
                        }
                        onClick={() => {
                          setIsSelectionMode(false);
                          setSelectedBooks([]);
                          setSelectedAuthors([]);
                          setSelectedGenres([]);
                          setSelectedLanguages([]);
                          setSelectedCollectionIds([]);
                        }}
                        aria-label={t('cancel')}
                        title={t('cancel')}
                        className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs"
                      >
                        <X size={13} className="max-md:w-5 max-md:h-5" />
                        <span className="max-md:hidden">{t('cancel')}</span>
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="normal-mode"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.08 } }}
                      transition={{ type: 'spring', stiffness: 520, damping: 36, mass: 0.55 }}
                      className="flex items-center gap-2.5"
                    >
                      {/* CRIAÇÃO OU EDIÇÃO DE COLEÇÃO (TELA CHEIA) */}
                      {(activeScreen.id === 'create-collection' || activeScreen.id === 'edit-collection') ? (
                        <div className="flex items-center gap-2.5">
                          <motion.button 
                            whileHover={{ scale: 1.08 }} 
                            whileTap={{ scale: 0.95 }} 
                            title={t('save')} 
                            onClick={handleSaveCollectionForm}
                            className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-winblue/20 border border-winblue/45 shadow-[0_0_15px_rgba(var(--winblue-rgb),0.15)] hover:bg-winblue/30 hover:border-winblue/75 hover:shadow-[0_0_22px_rgba(var(--winblue-rgb),0.45)] text-winblue transition-all backdrop-blur-3xl font-semibold text-xs cursor-pointer"
                          >
                            <Check size={13} className="max-md:w-5 max-md:h-5" />
                            <span className="max-md:hidden">{t('save')}</span>
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.12 }} 
                            whileTap={{ scale: 0.92 }} 
                            title={t('cancel')} 
                            onClick={goBack}
                            className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs cursor-pointer"
                          >
                            <X size={13} className="max-md:w-5 max-md:h-5" />
                            <span className="max-md:hidden">{t('cancel')}</span>
                          </motion.button>
                        </div>
                      ) : activeScreen.id.startsWith('library-colecao-') ? (
                        (() => {
                          const headerColId = activeScreen.id.replace('library-colecao-', '');
                          const headerCol = collections.find(c => c.id === headerColId) || (activeScreen.data as Collection | undefined);
                          if (!headerCol) return null;
                          return (
                            <>
                              {/* Adicionar itens à coleção (o pop-up nasce do próprio botão) */}
                              <div className={`relative w-9 h-9 shrink-0 ${showCollectionHeaderAddPopup ? 'z-50' : 'z-10'}`}>
                                <motion.button
                                  whileHover={{ scale: 1.12 }}
                                  whileTap={{ scale: 0.92 }}
                                  animate={morphTriggerAnimate(showCollectionHeaderAddPopup)}
                                  title={t('add_to_collection')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = !showCollectionHeaderAddPopup;
                                    closeAllPopups();
                                    setShowCollectionHeaderAddPopup(next);
                                  }}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl cursor-pointer"
                                >
                                  <Plus size={14} />
                                </motion.button>
                                <AnimatePresence>
                                  {showCollectionHeaderAddPopup && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-40 cursor-default"
                                        {...getBackdropProps(() => setShowCollectionHeaderAddPopup(false))}
                                      />
                                      <MorphPopup
                                        key="popup-collection-add-items"
                                        originWidth={36}
                                        originHeight={36}
                                        data-popup-content="true"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ transformOrigin: "top right" }}
                                        className="absolute top-0 right-0 w-80 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl z-50 flex flex-col overflow-hidden"
                                      >
                                        <CollectionItemsPickerContent
                                          mode="all"
                                          authors={authors}
                                          books={books}
                                          selectedAuthorIds={headerCol.authorIds || []}
                                          selectedBookIds={headerCol.bookIds}
                                          onToggleAuthor={(id) => handleToggleItemInCollection(headerCol.id, 'author', id)}
                                          onToggleBook={(id) => handleToggleItemInCollection(headerCol.id, 'book', id)}
                                        />
                                      </MorphPopup>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>

                              <motion.button
                                whileHover={{ scale: 1.12 }}
                                whileTap={{ scale: 0.92 }}
                                title={t('edit_collection')}
                                onClick={() => handleStartEditCurrentCollection()}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl cursor-pointer"
                              >
                                <Edit3 size={13} />
                              </motion.button>

                              {/* Ordenar por: mesma posição da Biblioteca (logo antes de excluir) */}
                              <div className={`relative w-9 h-9 shrink-0 ${showSortMenu ? 'z-50' : 'z-10'}`}>
                                <motion.button 
                                  ref={sortBtnRef}
                                  whileHover={{ scale: 1.12 }}
                                  whileTap={{ scale: 0.92 }}
                                  animate={morphTriggerAnimate(showSortMenu)}
                                  transition={{ type: "spring", stiffness: 600, damping: 30 }}
                                  title={t('sort_by')} 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    const p = showSortMenu; 
                                    closeAllPopups(); 
                                    if (!p) {
                                      setSortBtnAnchor(e.currentTarget);
                                      setShowSortMenu(true);
                                    } else {
                                      setShowSortMenu(false);
                                      setSortBtnAnchor(null);
                                    }
                                  }}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                                >
                                  <ArrowUpDown size={13} />
                                </motion.button>
                              </div>

                              {/* Excluir coleção (confirmação nasce do botão, mesmo padrão de excluir audiobook) */}
                              <div className={`relative w-9 h-9 shrink-0 ${showDeleteCurrentCollectionConfirm ? 'z-50' : 'z-10'}`}>
                                <motion.button
                                  whileHover={{ scale: 1.12 }}
                                  whileTap={{ scale: 0.92 }}
                                  animate={morphTriggerAnimate(showDeleteCurrentCollectionConfirm)}
                                  title={t('delete_collection')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    closeAllPopups();
                                    setShowDeleteCurrentCollectionConfirm(true);
                                  }}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-red-500/20 shadow-xl hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </motion.button>
                                <AnimatePresence>
                                  {showDeleteCurrentCollectionConfirm && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-40 cursor-default"
                                        {...getBackdropProps(() => setShowDeleteCurrentCollectionConfirm(false))}
                                      />
                                      <MorphPopup
                                        key="popup-delete-collection"
                                        originWidth={36}
                                        originHeight={36}
                                        data-popup-content="true"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ transformOrigin: "top right" }}
                                        className="absolute top-0 right-0 w-64 sm:w-80 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[28px] shadow-2xl p-4 z-50 flex flex-col text-[var(--text-main)]"
                                      >
                                        <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1.5">
                                          {t('delete_collection')}
                                        </h4>
                                        <p className="text-xs text-[var(--text-muted)] px-1 mb-3">
                                          {t('delete_collections_confirm_desc')}
                                        </p>

                                        <div className="flex items-center gap-3 p-2 mb-4">
                                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${headerCol.gradient} flex items-center justify-center text-lg shrink-0 shadow-sm select-none`}>
                                            {headerCol.emoji}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[var(--text-main)] truncate">{headerCol.name}</p>
                                            {headerCol.description?.trim() && <p className="text-xs text-[var(--text-muted)] truncate">{headerCol.description.trim()}</p>}
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2.5 pt-1">
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                              setShowDeleteCurrentCollectionConfirm(false);
                                              handleDeleteCollection(headerCol.id);
                                            }}
                                            className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <Trash2 size={13} />
                                            <span>{t('delete')}</span>
                                          </motion.button>
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowDeleteCurrentCollectionConfirm(false)}
                                            className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <X size={13} />
                                            <span>{t('cancel')}</span>
                                          </motion.button>
                                        </div>
                                      </MorphPopup>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            </>
                          );
                        })()
                      ) : activeScreen.id === 'library-colecoes' ? (
                        <>
                          <motion.button 
                            whileHover={{ scale: 1.12 }} 
                            whileTap={{ scale: 0.92 }} 
                            title={t('add_collection')} 
                            onClick={() => handleStartCreateCollection()}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl cursor-pointer"
                          >
                            <Plus size={14} />
                          </motion.button>
                          {/* Ordenar por: mesma posição da Biblioteca (logo antes de excluir) */}
                          <div className={`relative w-9 h-9 shrink-0 ${showSortMenu ? 'z-50' : 'z-10'}`}>
                            <motion.button 
                              ref={sortBtnRef}
                              whileHover={{ scale: 1.12 }}
                              whileTap={{ scale: 0.92 }}
                              animate={morphTriggerAnimate(showSortMenu)}
                              transition={{ type: "spring", stiffness: 600, damping: 30 }}
                              title={t('sort_by')} 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const p = showSortMenu; 
                                closeAllPopups(); 
                                if (!p) {
                                  setSortBtnAnchor(e.currentTarget);
                                  setShowSortMenu(true);
                                } else {
                                  setShowSortMenu(false);
                                  setSortBtnAnchor(null);
                                }
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                            >
                              <ArrowUpDown size={13} />
                            </motion.button>
                          </div>
                          {collections.length > 0 && (
                            <motion.button 
                              whileHover={{ scale: 1.12 }} 
                              whileTap={{ scale: 0.92 }} 
                              title={t('delete_collections')} 
                              onClick={() => {
                                setIsSelectionMode(true);
                                setSelectedCollectionIds([]);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-red-500/20 shadow-xl hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl"
                            >
                              <Trash2 size={13} />
                            </motion.button>
                          )}
                        </>
                      ) : (activeScreen.id.startsWith('library') || activeScreen.id.startsWith('home-') || activeScreen.id === 'history') && (
                        <>
                          
                          {books.length > 0 && (
                            <>
                              <motion.button 
                                whileHover={{ scale: 1.12 }}
                                whileTap={{ scale: 0.92 }}
                                title={t('upload_audiobooks')}
                                onClick={() => fileInputRef.current?.click()} 
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                              >
                                <Upload size={13} />
                              </motion.button>
                              {IS_INSTALLED_APP && activeScreen.id.startsWith('library') && (
                                <motion.button
                                  whileHover={{ scale: 1.12 }}
                                  whileTap={{ scale: 0.92 }}
                                  title={t('sync_now')}
                                  onClick={() => handleSyncLibraryNow()}
                                  className={`w-9 h-9 flex items-center justify-center rounded-full shadow-xl transition-all backdrop-blur-3xl cursor-pointer ${
                                    isSyncingLibrary
                                      ? 'bg-winblue/20 border border-winblue text-winblue shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)]'
                                      : 'bg-card/75 border border-[var(--text-main)]/10 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)]'
                                  }`}
                                >
                                  <RefreshCw size={13} className={isSyncingLibrary ? "animate-spin text-winblue" : ""} />
                                </motion.button>
                              )}
                              <div className={`relative w-9 h-9 shrink-0 ${showSortMenu ? 'z-50' : 'z-10'}`}>
                                <motion.button 
                                  ref={sortBtnRef}
                                  whileHover={{ scale: 1.12 }}
                                  whileTap={{ scale: 0.92 }}
                                  animate={morphTriggerAnimate(showSortMenu)}
                                  transition={{ type: "spring", stiffness: 600, damping: 30 }}
                                  title={t('sort_by')} 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    const p = showSortMenu; 
                                    closeAllPopups(); 
                                    if (!p) {
                                      setSortBtnAnchor(e.currentTarget);
                                      setShowSortMenu(true);
                                    } else {
                                      setShowSortMenu(false);
                                      setSortBtnAnchor(null);
                                    }
                                  }}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                                >
                                  <ArrowUpDown size={13} />
                                </motion.button>
                              </div>
                              <motion.button 
                                whileHover={{ scale: 1.12 }}
                                whileTap={{ scale: 0.92 }}
                                title={t('delete_multiple')}
                                onClick={() => setIsSelectionMode(true)} 
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-red-500/20 shadow-xl hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl"
                              >
                                <Trash2 size={13} />
                              </motion.button>
                            </>
                          )}
                        </>
                      )}
  
                      {/* AUTOR: Favoritar, Editar */}
                      {activeScreen.id === 'author-detail' && (
                        <>
                          {!isEditingAuthor ? (
                            <>
                              {/* Adicionar à coleção no cabeçalho à esquerda de favoritar */}
                              <div className="relative">
                                <motion.button 
                                  ref={authorCollectionBtnRef}
                                  whileHover={{ scale: 1.12 }} 
                                  whileTap={{ scale: 0.92 }} 
                                  animate={morphTriggerAnimate(showAuthorCollectionPopup)}
                                  title={t('add_to_collection')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (useFullScreenSheets && activeScreen.data?.id) {
                                      openMobileSheet({ kind: 'collection-picker', itemType: 'author', itemId: activeScreen.data.id });
                                      return;
                                    }
                                    const next = !showAuthorCollectionPopup;
                                    closeAllPopups();
                                    if (next) {
                                      setAuthorCollectionAnchor(e.currentTarget);
                                      setShowAuthorCollectionPopup(true);
                                    } else {
                                      setShowAuthorCollectionPopup(false);
                                      setAuthorCollectionAnchor(null);
                                    }
                                  }}
                                  className={`w-9 h-9 flex items-center justify-center rounded-full shadow-xl transition-all backdrop-blur-3xl ${
                                    showAuthorCollectionPopup
                                      ? 'bg-winblue/20 border border-winblue/45 text-winblue shadow-[0_0_15px_rgba(var(--winblue-rgb),0.25)]'
                                      : 'bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                                  }`}
                                >
                                  <FolderPlus size={14} />
                                </motion.button>
                              </div>

                              <motion.button 
                                whileHover={{ scale: 1.12 }} 
                                whileTap={{ scale: 0.92 }} 
                                title={favoriteAuthorIds.includes(activeScreen.data?.id) ? t('remove_favorite_author') : t('favorite_author')}
                                onClick={() => {
                                  if (activeScreen.data?.id) toggleFavoriteAuthor(activeScreen.data.id);
                                }}
                                className={`w-9 h-9 flex items-center justify-center rounded-full shadow-xl transition-all backdrop-blur-3xl ${
                                  favoriteAuthorIds.includes(activeScreen.data?.id)
                                    ? 'bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] hover:bg-yellow-400/30'
                                    : 'bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                                }`}
                              >
                                <Star size={14} className={favoriteAuthorIds.includes(activeScreen.data?.id) ? "fill-yellow-400 text-yellow-400" : ""} />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.12 }} 
                                whileTap={{ scale: 0.92 }} 
                                title={t('edit_author')} 
                                onClick={handleStartEditAuthor}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                              >
                                <Edit3 size={13} />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.12 }}
                                whileTap={{ scale: 0.92 }} 
                                title={t('delete_multiple')}
                                onClick={() => setIsSelectionMode(true)} 
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-red-500/20 shadow-xl hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl"
                              >
                                <Trash2 size={13} />
                              </motion.button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <motion.button 
                                whileHover={{ scale: 1.08 }} 
                                whileTap={{ scale: 0.95 }} 
                                title={t('save_changes')} 
                                onClick={handleSaveAuthorEdits}
                                className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-winblue/20 border border-winblue/45 shadow-[0_0_15px_rgba(var(--winblue-rgb),0.15)] hover:bg-winblue/30 hover:border-winblue/75 hover:shadow-[0_0_22px_rgba(var(--winblue-rgb),0.45)] text-winblue transition-all backdrop-blur-3xl font-semibold text-xs"
                              >
                                <Check size={13} className="max-md:w-5 max-md:h-5" />
                                <span className="max-md:hidden">{t('save')}</span>
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.12 }} 
                                whileTap={{ scale: 0.92 }} 
                                title={t('cancel_edit')} 
                                onClick={handleCancelAuthorEdits}
                                className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs"
                              >
                                <X size={13} className="max-md:w-5 max-md:h-5" />
                                <span className="max-md:hidden">{t('cancel')}</span>
                              </motion.button>
                            </div>
                          )}
                        </>
                      )}
  
                      {/* AUDIOBOOK: Favoritar, Editar, Excluir */}
                      {activeScreen.id === 'book-detail' && (
                        <>
                          {!isEditingBook ? (
                            <>
                              {/* Adicionar à coleção no cabeçalho à esquerda de favoritar */}
                              <div className="relative">
                                <motion.button 
                                  ref={bookCollectionBtnRef}
                                  whileHover={{ scale: 1.12 }} 
                                  whileTap={{ scale: 0.92 }} 
                                  animate={morphTriggerAnimate(showBookCollectionPopup)}
                                  title={t('add_to_collection')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const sheetBook = activeScreen.data || selectedBook;
                                    if (useFullScreenSheets && sheetBook?.id) {
                                      openMobileSheet({ kind: 'collection-picker', itemType: 'book', itemId: sheetBook.id });
                                      return;
                                    }
                                    const next = !showBookCollectionPopup;
                                    closeAllPopups();
                                    if (next) {
                                      setBookCollectionAnchor(e.currentTarget);
                                      setShowBookCollectionPopup(true);
                                    } else {
                                      setShowBookCollectionPopup(false);
                                      setBookCollectionAnchor(null);
                                    }
                                  }}
                                  className={`w-9 h-9 flex items-center justify-center rounded-full shadow-xl transition-all backdrop-blur-3xl ${
                                    showBookCollectionPopup
                                      ? 'bg-winblue/20 border border-winblue/45 text-winblue shadow-[0_0_15px_rgba(var(--winblue-rgb),0.25)]'
                                      : 'bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                                  }`}
                                >
                                  <FolderPlus size={14} />
                                </motion.button>
                              </div>

                              <motion.button 
                                whileHover={{ scale: 1.12 }} 
                                whileTap={{ scale: 0.92 }} 
                                title={favoriteBookIds.includes((activeScreen.data || selectedBook)?.id) ? t('remove_from_favorites') : t('favorite')} 
                                onClick={() => {
                                  const target = activeScreen.data || selectedBook;
                                  if (target) toggleFavoriteBook(target.id);
                                }}
                                className={`w-9 h-9 flex items-center justify-center rounded-full shadow-xl transition-all backdrop-blur-3xl ${
                                  favoriteBookIds.includes((activeScreen.data || selectedBook)?.id)
                                    ? 'bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] hover:bg-yellow-400/30'
                                    : 'bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                                }`}
                              >
                                <Star size={14} className={favoriteBookIds.includes((activeScreen.data || selectedBook)?.id) ? "fill-yellow-400 text-yellow-400" : "text-[var(--text-main)]"} />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.12 }} 
                                whileTap={{ scale: 0.92 }} 
                                title={t('edit_audiobook')} 
                                onClick={handleStartEditBook}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                              >
                                <Edit3 size={13} />
                              </motion.button>
                              {/* Compartilhar: imagem do audiobook ou de um trecho do texto (formato de story) */}
                              <div className={`relative w-9 h-9 ${showShareBookMenu ? 'z-50' : 'z-10'}`}>
                                <motion.button
                                  key="btn"
                                  whileHover={{ scale: 1.12 }}
                                  whileTap={{ scale: 0.92 }}
                                  animate={morphTriggerAnimate(showShareBookMenu)}
                                  title={t('share')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const target = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
                                    if (!target) return;
                                    closeAllPopups();
                                    if (!target.transcript?.length) { openShareImage('book', target); return; }
                                    setShowShareBookMenu(true);
                                  }}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                                >
                                  {isGeneratingShare ? <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--text-main)] border-t-transparent animate-spin" /> : <Share size={13} />}
                                </motion.button>
                                <AnimatePresence>
                                  {showShareBookMenu && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-40 cursor-default"
                                        {...getBackdropProps(() => setShowShareBookMenu(false))}
                                      />
                                      <MorphPopup originWidth={36} originHeight={36}
                                        key="popup"
                                        data-popup-content="true"
                                        style={{ transformOrigin: "top right" }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute top-0 right-0 w-60 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[20px] shadow-2xl p-1.5 z-50 flex flex-col"
                                      >
                                        {(() => {
                                          const target = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
                                          return (
                                            <>
                                              <MenuOptionItem icon={<Share size={14} />} onClick={() => { setShowShareBookMenu(false); if (target) openShareImage('book', target); }}>
                                                <span>{t('share_audiobook')}</span>
                                              </MenuOptionItem>
                                              <MenuOptionItem icon={<Quote size={14} />} onClick={() => { setShowShareBookMenu(false); if (target) openShareLyrics(target); }}>
                                                <span>{t('share_excerpt')}</span>
                                              </MenuOptionItem>
                                            </>
                                          );
                                        })()}
                                      </MorphPopup>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                              <div className={`relative w-9 h-9 ${showBookDetailsPopup ? 'z-50' : 'z-10'}`}>
                                <motion.button 
                                  key="btn"
                                  whileHover={{ scale: 1.12 }} 
                                  whileTap={{ scale: 0.92 }} 
                                  animate={morphTriggerAnimate(showBookDetailsPopup)}
                                  title={t('more_details')} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    closeAllPopups();
                                    setShowBookDetailsPopup(true);
                                  }}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                                >
                                  <Info size={13} />
                                </motion.button>
                                <AnimatePresence>
                                  {showBookDetailsPopup && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-40 cursor-default" 
                                        {...getBackdropProps(() => setShowBookDetailsPopup(false))} 
                                      />
                                      <MorphPopup originWidth={36} originHeight={36} 
                                        key="popup"
                                        data-popup-content="true"
                                        style={{ transformOrigin: "top right" }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute top-0 right-0 w-64 sm:w-80 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl p-4 z-50 flex flex-col"
                                      >
                                        {renderBookDetailsContent()}
                                      </MorphPopup>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                              <div className={`relative w-9 h-9 ${showDeleteBookDetailConfirm ? 'z-50' : 'z-10'}`}>
                                <motion.button 
                                  key="btn"
                                  whileHover={{ scale: 1.12 }} 
                                  whileTap={{ scale: 0.92 }} 
                                  animate={morphTriggerAnimate(showDeleteBookDetailConfirm)}
                                  title={t('delete')} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    closeAllPopups();
                                    setShowDeleteBookDetailConfirm(true);
                                  }} 
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-red-500/20 shadow-xl hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl"
                                >
                                  <Trash2 size={13} />
                                </motion.button>
                                <AnimatePresence>
                                  {showDeleteBookDetailConfirm && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-40 cursor-default" 
                                        {...getBackdropProps(() => setShowDeleteBookDetailConfirm(false))} 
                                      />
                                      <MorphPopup originWidth={36} originHeight={36} 
                                        key="popup"
                                        data-popup-content="true"
                                        style={{ transformOrigin: "top right" }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute top-0 right-0 w-64 sm:w-80 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[28px] shadow-2xl p-4 z-50 flex flex-col"
                                      >
                                        <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-3">
                                          {t('confirm_delete_single_book')}
                                        </h4>

                                        <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1 mb-4">
                                          {(() => {
                                            const target = activeScreen.data || selectedBook;
                                            if (!target) return null;
                                            return (
                                              <div className="flex items-center gap-3 p-2">
                                                <img 
                                                  src={target.cover || getGenericBookCover(target.title, target.author)} 
                                                  onError={(e) => handleBookCoverError(target, e)}
                                                  alt={target.title} 
                                                  className="w-7 h-11 aspect-[1/1.6] rounded-lg object-cover shrink-0 shadow-sm" 
                                                />
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{target.title}</p>
                                                  <p className="text-xs text-[var(--text-muted)] truncate">{target.author}</p>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </div>

                                        <div className="flex items-center justify-end gap-2.5 pt-1">
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                              const target = activeScreen.data || selectedBook;
                                              if (target) {
                                                cleanupDeletedBooks([target.id]);
                                                setBooks(books.filter(b => b.id !== target.id));
                                                setShowDeleteBookDetailConfirm(false);
                                                goBack();
                                                showToast(t('toast_book_deleted', { title: target.title }));
                                              }
                                            }}
                                            className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                          >
                                            <Trash2 size={13} />
                                            <span>{t('delete')}</span>
                                          </motion.button>
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowDeleteBookDetailConfirm(false)}
                                            className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                          >
                                            <X size={13} />
                                            <span>{t('cancel')}</span>
                                          </motion.button>
                                        </div>
                                      </MorphPopup>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <motion.button 
                                whileHover={{ scale: 1.08 }} 
                                whileTap={{ scale: 0.95 }} 
                                title={t('save_changes')} 
                                onClick={handleSaveBookEdits}
                                className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-winblue/20 border border-winblue/45 shadow-[0_0_15px_rgba(var(--winblue-rgb),0.15)] hover:bg-winblue/30 hover:border-winblue/75 hover:shadow-[0_0_22px_rgba(var(--winblue-rgb),0.45)] text-winblue transition-all backdrop-blur-3xl font-semibold text-xs"
                              >
                                <Check size={13} className="max-md:w-5 max-md:h-5" />
                                <span className="max-md:hidden">{t('save')}</span>
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.12 }} 
                                whileTap={{ scale: 0.92 }} 
                                title={t('cancel_edit')} 
                                onClick={handleCancelBookEdits}
                                className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs"
                              >
                                <X size={13} className="max-md:w-5 max-md:h-5" />
                                <span className="max-md:hidden">{t('cancel')}</span>
                              </motion.button>
                            </div>
                          )}
                        </>
                      )}
  
                      {/* AJUSTES: Restaurar ajustes & Fechar o App */}
                      {activeScreen.id.startsWith('settings') && (
                        <div className="flex items-center gap-2.5">
                          <div className={`relative w-9 h-9 shrink-0 ${showResetSettingsConfirm ? 'z-50' : 'z-10'}`}>
                            <motion.button 
                              key="btn-reset-settings"
                              whileHover={{ scale: 1.12 }}
                              whileTap={{ scale: 0.92 }}
                              animate={morphTriggerAnimate(showResetSettingsConfirm)}
                              title={t('settings_reset')} 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                closeAllPopups();
                                setShowResetSettingsConfirm(true); 
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                            >
                              <RotateCcw size={13} />
                            </motion.button>
                            <AnimatePresence>
                              {showResetSettingsConfirm && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40 cursor-default" 
                                    {...getBackdropProps(() => setShowResetSettingsConfirm(false))} 
                                  />
                                  <MorphPopup originWidth={36} originHeight={36}
                                    key="popup-reset-settings"
                                    data-popup-content="true"
                                    style={{ transformOrigin: "top right" }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute top-0 right-0 w-64 sm:w-80 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[28px] shadow-2xl p-4 z-50 flex flex-col text-[var(--text-main)]"
                                  >
                                    <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1.5">
                                      {t('settings_reset_confirm_title')}
                                    </h4>
                                    <p className="text-xs text-[var(--text-muted)] px-1 mb-4">
                                      {t('settings_reset_confirm_desc')}
                                    </p>

                                    <div className="flex items-center justify-end gap-2.5 pt-1">
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                          handleResetSettings();
                                          setShowResetSettingsConfirm(false);
                                        }}
                                        className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                      >
                                        <RotateCcw size={13} />
                                        <span>{t('settings_reset_btn')}</span>
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowResetSettingsConfirm(false)}
                                        className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                      >
                                        <X size={13} />
                                        <span>{t('cancel')}</span>
                                      </motion.button>
                                    </div>
                                  </MorphPopup>
                                </>
                              )}
                            </AnimatePresence>
                          </div>

                          <motion.button 
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                              if ((window as any).electron) {
                                (window as any).electron.closeApp();
                              } else {
                                showToast(t('close_desktop_only'));
                              }
                            }}
                            className="px-3.5 h-9 flex items-center justify-center gap-1.5 rounded-full bg-card/75 border border-red-500/20 shadow-xl hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs"
                          >
                            <Power size={13} />
                            <span>{t('close_app')}</span>
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Fundo Desfocado Ambiente para Detalhes do Audiobook e Detalhes do Autor (fora da animação de escala da página) */}
          <AnimatePresence>
            {(activeScreen.id === 'book-detail' || activeScreen.id === 'book-synopsis') && (() => {
              const currentTargetBook = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
              const bookCover = (isEditingBook ? editBookCover : null) || currentTargetBook?.cover || getGenericBookCover(currentTargetBook?.title, currentTargetBook?.author);
              return (
                <motion.div
                  key={`book-detail-bg-blur-${currentTargetBook?.id || 'default'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
                >
                  <img 
                    src={bookCover} 
                    onError={(e) => handleBookCoverError(currentTargetBook, e)}
                    alt="blur" 
                    className="w-full h-full object-cover blur-[140px] opacity-20 scale-125 dark:opacity-30 dark:mix-blend-screen"
                  />
                </motion.div>
              );
            })()}

            {activeScreen.id === 'author-detail' && (() => {
              const currentAuthor: Author = authors.find(a => a.id === activeScreen.data?.id) || activeScreen.data;
              const authorImage = (isEditingAuthor ? editAuthorPicture : null) || getEffectiveAuthorAvatar(currentAuthor?.name || '', currentAuthor?.picture);
              return (
                <motion.div
                  key={`author-detail-bg-blur-${currentAuthor?.id || 'default'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
                >
                  <img 
                    src={authorImage} 
                    onError={(e) => { e.currentTarget.src = getAuthorAvatar(currentAuthor?.name || ''); }}
                    alt="blur" 
                    className="w-full h-full object-cover blur-[140px] opacity-20 scale-125 dark:opacity-30 dark:mix-blend-screen"
                  />
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Viewport de Conteúdo com Scroll */}
        <div ref={mainScrollRef} className={cn("app-scroll flex-1 min-w-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 md:px-8 pt-[calc(var(--app-header-top)+60px)] relative z-10", isPlayerVisible ? "has-mini pb-52 md:pb-32" : "pb-32 md:pb-12")}>
          {/* Se uma tela der erro, só ela mostra um aviso; abas, cabeçalho e player continuam funcionando */}
          <ScreenErrorBoundary
            resetKey={getScreenKey(activeScreen)}
            onBack={historyStack.length > 0 ? goBack : undefined}
            labels={{ title: t('screen_error_title'), description: t('screen_error_desc'), back: t('back'), retry: t('screen_error_retry') }}
          >
          <AnimatePresence mode={isMobile ? 'sync' : 'wait'}>
          
          {/* SCREEN: SEARCH */}
          {activeScreen.id === 'search' && (
            <motion.div 
              key="screen-search" 
              variants={transicaoConteudo} 
              initial="escondido" 
              animate="visivel" 
              exit="saindo" 
              className="space-y-6"
            >
              {isMobile && searchQuery.length > 0 && (
                <div ref={setMobileSearchSlot} data-popup-content="true" className="w-full" />
              )}
              <div className={isMobile && searchQuery.length > 0 ? 'hidden' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--text-main)]">{t('search_last')}</h2>
                  {searchHistory.length > 0 && (
                    <div className={`relative w-11 h-11 shrink-0 ${showDeleteSearchHistoryConfirm ? 'z-50' : 'z-10'}`}>
                      <motion.button
                        key="btn-clear-history"
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.92 }}
                        animate={morphTriggerAnimate(showDeleteSearchHistoryConfirm)}
                        title={t('clear_search_history')}
                        onClick={(e) => {
                          e.stopPropagation();
                          closeAllPopups();
                          setShowDeleteSearchHistoryConfirm(true);
                        }}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-card/75 border border-red-500/20 shadow-xl hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl shrink-0"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                      <AnimatePresence>
                        {showDeleteSearchHistoryConfirm && (
                          isMobile ? (
<MobileConfirmCard key="history-confirm" onClose={() => setShowDeleteSearchHistoryConfirm(false)}>
                              <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1.5">
                                {t('clear_search_history_confirm_title')}
                              </h4>
                              <p className="text-xs text-[var(--text-muted)] px-1 mb-4">
                                {t('clear_search_history_confirm_desc')}
                              </p>

                              <div className="flex items-center justify-end gap-2.5 pt-1">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setSearchHistory([]);
                                    try {
                                      localStorage.removeItem('app_search_history');
                                    } catch {}
                                    setShowDeleteSearchHistoryConfirm(false);
                                    showToast(t('search_history_cleared'));
                                  }}
                                  className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                >
                                  <Trash2 size={13} />
                                  <span>{t('delete')}</span>
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setShowDeleteSearchHistoryConfirm(false)}
                                  className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                >
                                  <X size={13} />
                                  <span>{t('cancel')}</span>
                                </motion.button>
                              </div>
                            </MobileConfirmCard>
) : (<>
                            <div 
                              className="fixed inset-0 z-40 cursor-default" 
                              {...getBackdropProps(() => setShowDeleteSearchHistoryConfirm(false))} 
                            />
                            <MorphPopup originWidth={44} originHeight={44}
                              key="popup-clear-history"
                              data-popup-content="true"
                              style={{ transformOrigin: "top right" }}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-0 right-0 w-80 sm:w-96 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[28px] shadow-2xl p-4 z-50 flex flex-col text-[var(--text-main)]"
                            >
                              <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1.5">
                                {t('clear_search_history_confirm_title')}
                              </h4>
                              <p className="text-xs text-[var(--text-muted)] px-1 mb-4">
                                {t('clear_search_history_confirm_desc')}
                              </p>

                              <div className="flex items-center justify-end gap-2.5 pt-1">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setSearchHistory([]);
                                    try {
                                      localStorage.removeItem('app_search_history');
                                    } catch {}
                                    setShowDeleteSearchHistoryConfirm(false);
                                    showToast(t('search_history_cleared'));
                                  }}
                                  className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                >
                                  <Trash2 size={13} />
                                  <span>{t('delete')}</span>
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setShowDeleteSearchHistoryConfirm(false)}
                                  className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                >
                                  <X size={13} />
                                  <span>{t('cancel')}</span>
                                </motion.button>
                              </div>
                            </MorphPopup>
                          </>)
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {searchHistory.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <Clock size={36} className="text-[var(--text-muted)] opacity-35 mb-3" />
                    <p className="text-sm font-medium text-[var(--text-muted)]">{t('no_recent_searches')}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 w-full">
                    {searchHistory.map((term, index) => (
                      <div
                        key={`${term}-${index}`}
                        onClick={() => {
                          setSearchQuery(term);
                          searchInputRef.current?.focus();
                        }}
                        className="group flex items-center justify-between h-[52px] pl-[18px] pr-5 rounded-full hover:bg-[var(--button-secondary-bg)]/50 border border-transparent cursor-pointer transition-all w-full select-none"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                            <Clock size={16} className="text-[var(--text-muted)] group-hover:hidden transition-colors" />
                            <div className="hidden group-hover:flex items-center justify-center relative">
                              <div className="absolute w-4 h-4 bg-white/70 blur-[6px] rounded-full pointer-events-none" />
                              <Search size={16} className="relative z-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]" />
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-[var(--text-main)] transition-colors truncate">{term}</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity select-none shrink-0 pointer-events-none pr-1 font-medium">
                          <span>{t('tap_to_search') || 'Toque para pesquisar'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* SCREEN: HOME */}
          {activeScreen.id === 'home' && (
            books.length === 0 ? (
              <motion.div 
                key="home-empty" 
                variants={transicaoConteudo} 
                initial="escondido" 
                animate="visivel" 
                exit="saindo" 
              >
                <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight">
                  {t('nav_home')}
                </h1>
                <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-4">
                  <div className="w-20 h-20 rounded-full bg-card/75 border border-[var(--text-main)]/10 flex items-center justify-center text-winblue shadow-xl backdrop-blur-3xl mb-5">
                    <RiBookOpenLine size={36} />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-main)] tracking-tight mb-2.5">
                    {t('empty_home_title')}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mb-7">
                    {t('empty_home_desc')}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-11 px-6 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/20 shadow-xl hover:bg-white/20 hover:border-white/35 hover:shadow-[0_0_24px_rgba(255,255,255,0.3)] text-[var(--text-main)] font-semibold text-sm transition-all flex items-center gap-2.5 cursor-pointer"
                  >
                    <Upload size={16} />
                    <span>{t('add_audiobooks_button')}</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo">
                <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight">
                  {t('nav_home')}
                </h1>
                <div className="space-y-12">
                <AnimatePresence>
                  {homeSections.map((section) => (
                    <motion.section
                      key={section.id}
                      layout={isMobile ? false : "position"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-[var(--text-main)]">{section.title}</h2>
                        {section.buttonLabel && section.onButtonClick && (
                          <motion.button 
                            whileHover={{ scale: 1.06 }} 
                            whileTap={{ scale: 0.94 }}
                            onClick={section.onButtonClick}
                            className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all shrink-0 ml-3"
                          >
                            <span>{section.buttonLabel}</span>
                            <ChevronRight size={15} className="-mr-0.5" />
                          </motion.button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
                        <AnimatePresence>
                          {section.books.slice(0, 6).map((book) => (
                            <BookCard 
                              key={`home-${section.id}-${book.id}`} 
                              book={book} 
                              onSelect={() => handleSelectBookDetail(book)} 
                              onSelectAuthor={handleSelectAuthor}
                              onPlay={() => handlePlayBookFromStart(book)} 
                              onEdit={() => setEditingBook(book)} 
                              onAddToQueue={(pos) => handleAddToQueue(book, pos)}
                              onDelete={() => {
                                handleDeleteBook(book.id);
                                showToast(t('toast_book_deleted', { title: book.title }));
                              }} 
                              isSelectionMode={isSelectionMode} 
                              isSelected={selectedBooks.includes(book.id)} 
                              onToggleSelect={() => { 
                                if(selectedBooks.includes(book.id)) setSelectedBooks(selectedBooks.filter(id => id !== book.id)); 
                                else setSelectedBooks([...selectedBooks, book.id]); 
                              }}
                              isFavorite={favoriteBookIds.includes(book.id)}
                              onToggleFavorite={() => toggleFavoriteBook(book.id)}
                              isBookPlaying={currentBook.id === book.id && isPlaying}
                              isCompleted={isBookCompleted(book)}
                              isStarted={isBookStarted(book)}
                              onToggleCompleted={() => {
                                const isComp = isBookCompleted(book);
                                const chapIds = (book.chapters || []).map((c: any) => `${book.id}-${c.id}`);
                                if (isComp) {
                                  setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                                  setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                                  showToast(t('toast_book_marked_unstarted', { title: book.title }));
                                } else {
                                  setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                                  setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                                  showToast(t('toast_book_marked_completed', { title: book.title }));
                                }
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.section>
                  ))}
                </AnimatePresence>
                </div>
              </motion.div>
            )
          )}

          {/* SCREEN: LIBRARY */}
          {activeScreen.id === 'library' && (
            books.length === 0 ? (
              <motion.div 
                key="library-empty" 
                variants={transicaoConteudo} 
                initial="escondido" 
                animate="visivel" 
                exit="saindo" 
              >
                <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight">
                  {t('nav_library')}
                </h1>
                <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-4">
                  <div className="w-20 h-20 rounded-full bg-card/75 border border-[var(--text-main)]/10 flex items-center justify-center text-winblue shadow-xl backdrop-blur-3xl mb-5">
                    <RiBookOpenLine size={36} />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-main)] tracking-tight mb-2.5">
                    {t('empty_home_title')}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mb-7">
                    {t('empty_home_desc')}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {IS_INSTALLED_APP && (<motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleSyncLibraryNow()}
                      className={`h-11 px-6 rounded-full backdrop-blur-3xl font-semibold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
                        isSyncingLibrary
                          ? 'bg-winblue/20 border border-winblue text-winblue shadow-[0_0_24px_rgba(var(--winblue-rgb),0.35)]'
                          : 'bg-card/75 border border-[var(--text-main)]/20 shadow-xl hover:bg-white/20 hover:border-white/35 hover:shadow-[0_0_24px_rgba(255,255,255,0.3)] text-[var(--text-main)]'
                      }`}
                    >
                      <RefreshCw size={16} className={isSyncingLibrary ? "animate-spin text-winblue" : ""} />
                      <span>{t('sync_now')}</span>
                    </motion.button>)}
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-11 px-6 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/20 shadow-xl hover:bg-white/20 hover:border-white/35 hover:shadow-[0_0_24px_rgba(255,255,255,0.3)] text-[var(--text-main)] font-semibold text-sm transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <Upload size={16} />
                      <span>{t('add_audiobooks_button')}</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="space-y-12">
              <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight">
                {t('nav_library')}
              </h1>

              {/* Active Filter Indicator Chip */}
              {statusFilter !== 'all' && (
                <div className="flex items-center gap-2 -mb-6">
                  <span className="text-xs text-[var(--text-muted)] font-medium">{t('filter_active')}</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-winblue/15 border border-winblue/30 text-xs font-semibold text-winblue shadow-sm">
                    {statusFilter === 'in-progress' && t('filter_in_progress')}
                    {statusFilter === 'completed' && t('filter_completed')}
                    {statusFilter === 'unstarted' && t('filter_unstarted')}
                    {statusFilter === 'favorites' && t('filter_favorites')}
                    <button 
                      onClick={() => { setStatusFilter('all'); showToast(t('filter_removed')); }}
                      className="hover:text-white transition-colors cursor-pointer ml-1 p-0.5"
                      title={t('remove_filter')}
                    >
                      <X size={12} />
                    </button>
                  </span>
                </div>
              )}

              {/* 1A. AUDIOBOOKS FAVORITOS */}
              <AnimatePresence>
                {books.some(b => favoriteBookIds.includes(b.id)) && (
                  <motion.section
                    key="lib-sec-fav-books"
                    layout={isMobile ? false : "position"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-[var(--text-main)]">{t('favorite_audiobooks')}</h2>
                      {books.filter(b => favoriteBookIds.includes(b.id)).length > 6 && (
                        <motion.button 
                          whileHover={{ scale: 1.06 }} 
                          whileTap={{ scale: 0.94 }}
                          onClick={() => navigateTo('library-audiobooks-favoritos')} 
                          className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all"
                        >
                          <span>{t('see_all')}</span>
                          <ChevronRight size={15} className="-mr-0.5" />
                        </motion.button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
                      <AnimatePresence>
                        {sortBooks(books.filter(b => favoriteBookIds.includes(b.id))).slice(0, 6).map((book) => (
                          <BookCard 
                            key={book.id} 
                            book={book} 
                            onSelect={() => handleSelectBookDetail(book)} 
                            onSelectAuthor={handleSelectAuthor}
                            onPlay={() => handlePlayBookFromStart(book)} 
                            onEdit={() => setEditingBook(book)} 
                            onAddToQueue={(pos) => handleAddToQueue(book, pos)}
                            onDelete={() => {
                              handleDeleteBook(book.id);
                              showToast(t('toast_book_deleted', { title: book.title }));
                            }} 
                            isSelectionMode={isSelectionMode} 
                            isSelected={selectedBooks.includes(book.id)} 
                            onToggleSelect={() => { if(selectedBooks.includes(book.id)) setSelectedBooks(selectedBooks.filter(id => id !== book.id)); else setSelectedBooks([...selectedBooks, book.id]); }}
                            isFavorite={favoriteBookIds.includes(book.id)}
                            onToggleFavorite={() => toggleFavoriteBook(book.id)}
                            isBookPlaying={currentBook.id === book.id && isPlaying}
                            isCompleted={isBookCompleted(book)}
                            isStarted={isBookStarted(book)}
                            onToggleCompleted={() => {
                              const isComp = isBookCompleted(book);
                              const chapIds = (book.chapters || []).map((c: any) => `${book.id}-${c.id}`);
                              if (isComp) {
                                setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                                setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                                showToast(t('toast_book_marked_unstarted', { title: book.title }));
                              } else {
                                setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                                setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                                showToast(t('toast_book_marked_completed', { title: book.title }));
                              }
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* 1B. AUTORES FAVORITOS */}
              <AnimatePresence>
                {sortedAuthors.some(a => favoriteAuthorIds.includes(a.id)) && (
                  <motion.section
                    key="lib-sec-fav-authors"
                    layout={isMobile ? false : "position"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-[var(--text-main)]">{t('favorite_authors')}</h2>
                      {sortedAuthors.filter(a => favoriteAuthorIds.includes(a.id)).length > 6 && (
                        <motion.button 
                          whileHover={{ scale: 1.06 }} 
                          whileTap={{ scale: 0.94 }}
                          onClick={() => navigateTo('library-autores-favoritos')} 
                          className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all"
                        >
                          <span>{t('see_all')}</span>
                          <ChevronRight size={15} className="-mr-0.5" />
                        </motion.button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
                      <AnimatePresence>
                        {sortedAuthors.filter(a => favoriteAuthorIds.includes(a.id)).slice(0, 6).map((author) => (
                          <AuthorCard 
                            key={author.id}
                            author={author}
                            onSelect={() => navigateTo('author-detail', author)}
                            isFavorite={favoriteAuthorIds.includes(author.id)}
                            onToggleFavorite={() => toggleFavoriteAuthor(author.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* 1C. COLEÇÕES PERSONALIZADAS (logo depois dos favoritos): em cards como idiomas e gêneros */}
              <AnimatePresence>
                {collections.length > 0 && (
                  <motion.section
                    key="lib-sec-collections"
                    layout={isMobile ? false : "position"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-[var(--text-main)]">{t('collections')}</h2>
                      {collections.length > (isMobile ? 6 : 4) && (
                        <motion.button 
                          whileHover={{ scale: 1.06 }} 
                          whileTap={{ scale: 0.94 }}
                          onClick={() => navigateTo('library-colecoes')} 
                          className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <span>{t('see_all')}</span>
                          <ChevronRight size={15} className="-mr-0.5" />
                        </motion.button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-row">
                      <AnimatePresence>
                        {sortedCollections.slice(0, isMobile ? 6 : 4).map((col) => (
                          <CollectionCard
                            key={col.id}
                            col={col}
                            menu={collectionMenu(col)}
                            onClick={() => {
                              setHistoryStack([{ id: 'library' }, { id: 'library-colecoes' }]);
                              setActiveScreen({ id: 'library-colecao-' + col.id, data: col });
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* 2. GÊNEROS */}
              <AnimatePresence>
                {sortedGenres.length > 0 && (
                  <motion.section
                    key="lib-sec-genres"
                    layout={isMobile ? false : "position"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-[var(--text-main)]">{t('genres')}</h2>
                      {sortedGenres.length > (isMobile ? 6 : 4) && (
                        <motion.button 
                          whileHover={{ scale: 1.06 }} 
                          whileTap={{ scale: 0.94 }}
                          onClick={() => navigateTo('library-gêneros')} 
                          className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all"
                        >
                          <span>{t('see_all')}</span>
                          <ChevronRight size={15} className="-mr-0.5" />
                        </motion.button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-row">
                      <AnimatePresence>
                        {sortedGenres.slice(0, isMobile ? 6 : 4).map((genreData) => {
                          return (
                            <motion.div 
                              key={genreData.id} 
                              layout="position"
                              initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                              exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => navigateTo('library-genre-' + genreData.id)}
                              className="relative isolate aspect-[16/9] rounded-3xl cursor-pointer group shadow-lg border border-white/15 hover:border-white/30 transition-[border-color,box-shadow] p-5 flex flex-col justify-end"
                            >
                              {/* Camada interna recortada com fundo e ícone com zoom */}
                              <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
                                <div className={`absolute inset-0 bg-gradient-to-br ${genreData.gradient}`} />
                                <div className="absolute inset-0 bg-black/15" />

                                <span className="absolute -bottom-3 -right-2 text-6xl sm:text-7xl select-none pointer-events-none opacity-30 group-hover:scale-110 transition-transform duration-500 transform translate-x-2 translate-y-2">
                                  {getGenreEmoji(genreData.id)}
                                </span>
                              </div>

                              <div className="relative z-10">
                                <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md tracking-tight origin-bottom-left rtl:origin-bottom-right transition-transform duration-500 group-hover:scale-105">{getGenreName(genreData.id, resolvedLanguage)}</h3>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* 3. AUTORES */}
              <AnimatePresence>
                {sortedAuthors.length > 0 && (
                  <motion.section
                    key="lib-sec-authors"
                    layout={isMobile ? false : "position"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-[var(--text-main)]">{t('authors')}</h2>
                      {sortedAuthors.length > 6 && (
                        <motion.button 
                          whileHover={{ scale: 1.06 }} 
                          whileTap={{ scale: 0.94 }}
                          onClick={() => navigateTo('library-autores')} 
                          className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all"
                        >
                          <span>{t('see_all')}</span>
                          <ChevronRight size={15} className="-mr-0.5" />
                        </motion.button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
                      <AnimatePresence>
                        {sortedAuthors.slice(0, 6).map((author) => (
                          <AuthorCard 
                            key={author.id}
                            author={author}
                            onSelect={() => navigateTo('author-detail', author)}
                            isFavorite={favoriteAuthorIds.includes(author.id)}
                            onToggleFavorite={() => toggleFavoriteAuthor(author.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* 4. IDIOMAS: em cards como os de gêneros, mas com bandeiras */}
              <AnimatePresence>
                {sortedLanguages.length > 0 && (
                  <motion.section
                    key="lib-sec-languages"
                    layout={isMobile ? false : "position"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-[var(--text-main)]">{t('languages')}</h2>
                      {/* Só quando há mais idiomas do que a seção mostra */}
                      {sortedLanguages.length > (isMobile ? 6 : 4) && (
                      <motion.button 
                        whileHover={{ scale: 1.06 }} 
                        whileTap={{ scale: 0.94 }}
                        onClick={() => navigateTo('library-idiomas')} 
                        className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all"
                      >
                        <span>{t('see_all')}</span>
                        <ChevronRight size={15} className="-mr-0.5" />
                      </motion.button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-row">
                      <AnimatePresence>
                        {sortedLanguages.slice(0, isMobile ? 6 : 4).map((lang) => {
                          const langData = getLanguageData(lang, resolvedLanguage);
                          return (
                            <motion.div 
                              key={lang} 
                              layout="position"
                              initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                              exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                setHistoryStack([{ id: 'library' }, { id: 'library-idiomas' }]);
                                setActiveScreen({ id: 'library-idioma-' + lang.toLowerCase(), data: lang });
                              }}
                              className="relative isolate aspect-[16/9] rounded-3xl cursor-pointer group shadow-lg border border-white/15 hover:border-white/30 transition-[border-color,box-shadow] p-5 flex flex-col justify-end"
                            >
                              {/* Camada interna recortada com fundo e bandeira com zoom */}
                              <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
                                <div className={`absolute inset-0 bg-gradient-to-br ${langData.gradient}`} />
                                <div className="absolute inset-0 bg-black/15" />

                                <span className="absolute -bottom-3 -right-2 text-6xl sm:text-7xl select-none pointer-events-none opacity-40 group-hover:scale-110 transition-transform duration-500 transform translate-x-2 translate-y-2">
                                  {langData.flag}
                                </span>
                              </div>

                              <div className="relative z-10">
                                <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md tracking-tight origin-bottom-left rtl:origin-bottom-right transition-transform duration-500 group-hover:scale-105">{langData.name}</h3>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>



              {/* 5. TODOS OS AUDIOBOOKS: seguindo a lógica da filtragem */}
              <motion.section layout="position">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--text-main)]">{t('all_audiobooks')}</h2>
                  {filteredBooks.length > 6 && (
                    <motion.button 
                      whileHover={{ scale: 1.06 }} 
                      whileTap={{ scale: 0.94 }}
                      onClick={() => navigateTo('library-títulos')} 
                      className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all"
                    >
                      <span>{t('see_all')}</span>
                      <ChevronRight size={15} className="-mr-0.5" />
                    </motion.button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
                  <AnimatePresence>
                    {filteredBooks.slice(0, 6).map((book) => (
                      <BookCard 
                        key={book.id}
                        book={book} 
                        onSelect={() => handleSelectBookDetail(book)} 
                        onSelectAuthor={handleSelectAuthor}
                        onPlay={() => handlePlayBookFromStart(book)} 
                        onEdit={() => setEditingBook(book)} 
                        onAddToQueue={(pos) => handleAddToQueue(book, pos)}
                        onDelete={() => {
                          handleDeleteBook(book.id);
                          showToast(t('toast_book_deleted', { title: book.title }));
                        }} 
                        isSelectionMode={isSelectionMode} 
                        isSelected={selectedBooks.includes(book.id)} 
                        onToggleSelect={() => { if(selectedBooks.includes(book.id)) setSelectedBooks(selectedBooks.filter(id => id !== book.id)); else setSelectedBooks([...selectedBooks, book.id]); }}
                        isFavorite={favoriteBookIds.includes(book.id)}
                        onToggleFavorite={() => toggleFavoriteBook(book.id)}
                        isBookPlaying={currentBook.id === book.id && isPlaying}
                        isCompleted={isBookCompleted(book)}
                        isStarted={isBookStarted(book)}
                        onToggleCompleted={() => {
                          const isComp = isBookCompleted(book);
                          const chapIds = (book.chapters || []).map((c: any) => `${book.id}-${c.id}`);
                          if (isComp) {
                            setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                            setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                            showToast(t('toast_book_marked_unstarted', { title: book.title }));
                          } else {
                            setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                            setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                            showToast(t('toast_book_marked_completed', { title: book.title }));
                          }
                        }}
                      />
                    ))}
                  </AnimatePresence>
                  {filteredBooks.length === 0 && (
                    <p className="col-span-full text-xs text-[var(--text-muted)] py-4">{t('no_books_filtered')}</p>
                  )}
                </div>
              </motion.section>

              </motion.div>
            )
          )}

          {/* SCREEN: HISTORY, SUB-LIBRARIES & HOME SUBMENUS */}
          {(activeScreen.id === 'history' || activeScreen.id.startsWith('library-') || activeScreen.id.startsWith('home-')) && (
            <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="space-y-8">
              {/* Título e Barra de Navegação (Sticky em Todos os Audiobooks) */}
              {activeScreen.id === 'library-títulos' ? (
                <>
                  <div className={`flex flex-col gap-3 mb-8 ${sortBy === 'name-asc' || sortBy === 'name-desc' ? 'pr-[60px]' : 'pr-[74px]'}`}>
                    <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">
                      {t('all_audiobooks')}
                    </h1>

                    {/* Active Filter Indicator Chip */}
                    {statusFilter !== 'all' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)] font-medium">{t('filter_active')}</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-winblue/15 border border-winblue/30 text-xs font-semibold text-winblue shadow-sm">
                          {statusFilter === 'in-progress' && t('filter_in_progress')}
                          {statusFilter === 'completed' && t('filter_completed')}
                          {statusFilter === 'unstarted' && t('filter_unstarted')}
                          {statusFilter === 'favorites' && t('filter_favorites')}
                          <button 
                            onClick={() => { setStatusFilter('all'); showToast(t('filter_removed')); }}
                            className="hover:text-white transition-colors cursor-pointer ml-1 p-0.5"
                            title={t('remove_filter')}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pop up / Barra de Navegação e Filtro Vertical Fixa na Margem Direita */}
                  {allBooksNavGroups.length > 0 && (() => {
                    const isAlphabetMode = sortBy === 'name-asc' || sortBy === 'name-desc';
                    const hasMoreThan12 = allBooksNavGroups.length > 12;
                    // Exibir no máximo 12 elementos completos + pedaço do 13º para sinalizar rolagem:
                    // Modo alfabético: 12 itens * 36px (32+4) + 14px do 13º + 12px de padding vertical = 458px
                    // Modo década/duração: 12 itens * 34px (28+6) + 12px do 13º + 12px de padding vertical = 432px
                    const navMaxHeight = hasMoreThan12 
                      ? (isAlphabetMode ? '458px' : '432px') 
                      : undefined;

                    // Mobile: sempre visível no canto direito com todos os itens, bem pequena (só a letra atual
                    // na cor de destaque); ao tocar, cresce para o tamanho normal. Arrastar o dedo navega pelos itens.
                    const currentNavId = activeAllBooksNavId || allBooksNavGroups[0]?.id;
                    const isCompactNav = isMobile && !isMobileAlphaNavOpen;
                    const navCount = allBooksNavGroups.length;
                    const itemH = isCompactNav ? 17 : (isAlphabetMode ? 36 : 34);
                    const mobileNavHeight = `min(${navCount * itemH + 8}px, calc(100dvh - 260px))`;
                    const navItemAt = (clientY: number, navEl: HTMLElement) => {
                      const r = navEl.getBoundingClientRect();
                      const hit = document.elementFromPoint(r.left + r.width / 2, Math.max(r.top + 2, Math.min(r.bottom - 2, clientY)));
                      return (hit?.closest('[data-nav-id]') as HTMLElement | null)?.dataset.navId || null;
                    };
                    const mobileNavHandlers = isMobile ? {
                      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
                        alphaNavPressRef.current = { y: e.clientY, moved: false, lastId: null };
                        e.currentTarget.setPointerCapture?.(e.pointerId);
                      },
                      onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
                        const press = alphaNavPressRef.current;
                        if (!press) return;
                        if (Math.abs(e.clientY - press.y) > 6) press.moved = true;
                        if (!press.moved) return;
                        const id = navItemAt(e.clientY, e.currentTarget);
                        if (id && id !== press.lastId) {
                          press.lastId = id;
                          handleScrollToGroup(id);
                          try { navigator.vibrate?.(5); } catch {}
                        }
                      },
                      onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
                        const press = alphaNavPressRef.current;
                        alphaNavPressRef.current = null;
                        if (!press) return;
                        if (press.moved) { setIsMobileAlphaNavOpen(false); return; }
                        if (isCompactNav) { setIsMobileAlphaNavOpen(true); return; }
                        const id = navItemAt(e.clientY, e.currentTarget);
                        if (id) handleScrollToGroup(id);
                        setIsMobileAlphaNavOpen(false);
                      },
                      onPointerCancel: () => { alphaNavPressRef.current = null; },
                    } : {};
                    return (
                      <>
                        {isMobile && isMobileAlphaNavOpen && (
                          <div className="fixed inset-0 z-[29]" onClick={() => setIsMobileAlphaNavOpen(false)} />
                        )}
                        <aside
                          className={`fixed z-30 pointer-events-auto flex items-center justify-center transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] top-1/2 -translate-y-1/2 ${
                            isMobile ? 'right-1.5' : 'right-6'
                          } ${
                            isCompactNav
                              ? (isAlphabetMode ? 'w-6' : 'w-[42px]')
                              : (isAlphabetMode ? 'w-11' : 'w-[58px]')
                          }`}
                          style={{
                            maxHeight: isMobile ? 'calc(100dvh - 260px)' : (isPlayerVisible ? 'calc(100vh - 190px)' : 'calc(100vh - 120px)'),
                            // Celular deitado: fora do notch/Dynamic Island do lado direito
                            ...(isMobile ? { right: 'max(6px, calc(var(--safe-right) + 4px))' } : {}),
                          }}
                          aria-label={t('audiobooks_filter_aria')}
                        >
                          <nav
                            {...mobileNavHandlers}
                            className={`w-full flex flex-col items-center no-scrollbar select-none transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] border border-[var(--text-main)]/10 ${
                              isCompactNav
                                ? 'p-0.5 gap-0 rounded-full bg-card/55 backdrop-blur-xl shadow-md overflow-hidden'
                                : `p-1.5 bg-card/85 backdrop-blur-3xl shadow-2xl ${isMobile ? 'overflow-hidden' : 'overflow-y-auto'} ${isAlphabetMode ? 'rounded-full gap-1' : 'rounded-[18px] gap-1.5'}`
                            }`}
                            style={{
                              ...(isMobile ? { height: mobileNavHeight, touchAction: 'none' } : { maxHeight: navMaxHeight || '100%' }),
                            }}
                          >
                            {allBooksNavGroups.map(group => {
                              const isSelected = currentNavId === group.id;
                              return (
                                <button
                                  key={group.id}
                                  id={`nav-item-${group.id}`}
                                  data-nav-id={group.id}
                                  // No mobile o toque/arraste é tratado pela barra; aqui só teclado e desktop
                                  onClick={(e) => { if (!isMobile || e.detail === 0) handleScrollToGroup(group.id); }}
                                  className={`relative flex items-center justify-center font-bold transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                                    isMobile ? 'flex-1 min-h-0 w-full' : 'shrink-0'
                                  } ${
                                    isCompactNav
                                      ? `rounded-full text-[8px] leading-none ${isSelected ? 'text-winblue' : 'text-[var(--text-muted)]'}`
                                      : `${isAlphabetMode
                                          ? `${isMobile ? 'max-h-8' : 'aspect-square w-8 h-8'} rounded-full text-xs`
                                          : `${isMobile ? 'max-h-7' : 'w-full h-7'} px-1 rounded-[12px] text-[10px] tracking-tight`
                                        } ${
                                          isSelected
                                            ? 'bg-winblue/20 text-winblue border border-transparent shadow-[0_0_14px_rgba(var(--winblue-rgb),0.45)] hover:bg-winblue/25 hover:shadow-[0_0_18px_rgba(var(--winblue-rgb),0.6)]'
                                            : 'text-[var(--text-muted)] border border-transparent hover:text-white hover:bg-white/20 hover:border-white/35 hover:shadow-[0_0_12px_rgba(255,255,255,0.35)]'
                                        }`
                                  }`}
                                  title={group.title}
                                >
                                  <span className="relative z-10 whitespace-nowrap select-none">
                                    {group.navLabel}
                                  </span>
                                </button>
                              );
                            })}
                          </nav>
                        </aside>
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  {/* Título grande fora do cabeçalho, no mesmo padrão dos menus principais */}
                  <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] mb-8 tracking-tight">
                    {(() => {
                      if (activeScreen.id === 'home-continuar-ouvindo') return t('section_continue_listening');
                      if (activeScreen.id === 'home-ouvidos-recentemente') return t('section_recently_listened');
                      if (activeScreen.id === 'home-adicionados-recentemente') return t('section_recently_added');
                      if (activeScreen.id === 'history') return t('history');
                      if (activeScreen.id.startsWith('library-genre-')) {
                        const genreId = activeScreen.id.replace('library-genre-', '');
                        const genreData = Object.values(GENRE_HIERARCHY).find(g => g.id === genreId);
                        return genreData ? getGenreName(genreData.id, resolvedLanguage) : t('genres');
                      }
                      if (activeScreen.id.startsWith('library-subgenre-')) {
                        if (activeScreen.data?.subgenre) return getSubgenreName(activeScreen.data.subgenre, resolvedLanguage);
                        if (typeof activeScreen.data === 'string') return getSubgenreName(activeScreen.data, resolvedLanguage);
                        const after = activeScreen.id.replace('library-subgenre-', '');
                        const matchedGenre = Object.values(GENRE_HIERARCHY)
                          .sort((a, b) => b.id.length - a.id.length)
                          .find(g => after.startsWith(g.id + '-'));
                        const subName = matchedGenre ? after.substring(matchedGenre.id.length + 1) : after;
                        return getSubgenreName(subName, resolvedLanguage) || t('subgenre');
                      }
                      const sub = activeScreen.id.replace('library-', '');
                      if (activeScreen.id === 'library-ouvidos-recentemente' || activeScreen.id === 'history') return t('recently_listened');
                      if (activeScreen.id === 'library-idiomas') return t('languages');
                      if (activeScreen.id === 'library-colecoes') return t('collections');
                      const h1ColSubTitle = getCollectionSubScreenTitle(activeScreen.id, activeScreen.data);
                      if (h1ColSubTitle) return h1ColSubTitle;
                      if (activeScreen.id.startsWith('library-colecao-')) {
                        const colId = activeScreen.id.replace('library-colecao-', '');
                        const c = collections.find(item => item.id === colId) || (activeScreen.data as Collection);
                        return c?.name || t('collection');
                      }
                      if (activeScreen.id.startsWith('library-idioma-')) {
                        const l = activeScreen.data || activeScreen.id.replace('library-idioma-', '');
                        if (normalizeAudiobookLanguage(l) === 'Outro') {
                          return getLanguageCardName(l, resolvedLanguage);
                        }
                        return t('books_in_language', { lang: getLanguageDisplayName(l, resolvedLanguage) });
                      }
                      const subNames: Record<string, string> = {
                        'favoritos': t('favorite_audiobooks'),
                        'audiobooks-favoritos': t('favorite_audiobooks'),
                        'autores-favoritos': t('favorite_authors'),
                        'títulos': t('all_audiobooks'),
                        'autores': t('authors'),
                        'gêneros': t('genres'),
                        'idiomas': t('languages'),
                        'colecoes': t('collections'),
                        'ouvidos-recentemente': t('recently_listened'),
                      };
                      if (subNames[sub]) return subNames[sub];
                      const cat = books.find(b => b.category.toLowerCase() === sub.toLowerCase())?.category;
                      if (cat) return cat;
                      return sub.charAt(0).toUpperCase() + sub.slice(1);
                    })()}
                  </h1>

                  {/* Subtítulo da coleção: só a descrição */}
                  {activeScreen.id.startsWith('library-colecao-') && (() => {
                    const colId = activeScreen.id.replace('library-colecao-', '');
                    const c = collections.find(item => item.id === colId) || (activeScreen.data as Collection);
                    if (!c?.description?.trim()) return null;
                    return (
                      <p className="text-sm font-medium text-[var(--text-muted)] -mt-6 mb-8">{c.description.trim()}</p>
                    );
                  })()}

                  {/* Active Filter Indicator Chip */}
                  {statusFilter !== 'all' && activeScreen.id !== 'library-autores' && activeScreen.id !== 'library-autores-favoritos' && (
                    <div className="flex items-center gap-2 -mt-4 mb-4">
                      <span className="text-xs text-[var(--text-muted)] font-medium">{t('filter_active')}</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-winblue/15 border border-winblue/30 text-xs font-semibold text-winblue shadow-sm">
                        {statusFilter === 'in-progress' && t('filter_in_progress')}
                        {statusFilter === 'completed' && t('filter_completed')}
                        {statusFilter === 'unstarted' && t('filter_unstarted')}
                        {statusFilter === 'favorites' && t('filter_favorites')}
                        <button 
                          onClick={() => { setStatusFilter('all'); showToast(t('filter_removed')); }}
                          className="hover:text-white transition-colors cursor-pointer ml-1 p-0.5"
                          title={t('remove_filter')}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Conteúdo específico de cada submenu */}
              {(activeScreen.id === 'library-audiobooks-favoritos' || activeScreen.id === 'library-favoritos') ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                  <AnimatePresence>
                    {sortBooks(books.filter(b => {
                      if (!favoriteBookIds.includes(b.id)) return false;
                      if (statusFilter === 'in-progress') return isBookStarted(b) && !isBookCompleted(b);
                      if (statusFilter === 'completed') return isBookCompleted(b);
                      if (statusFilter === 'unstarted') return !isBookStarted(b) && !isBookCompleted(b);
                      return true;
                    })).map((book) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        onSelect={() => handleSelectBookDetail(book)} 
                        onSelectAuthor={handleSelectAuthor}
                        onPlay={() => handlePlayBookFromStart(book)} 
                        onEdit={() => setEditingBook(book)} 
                        onAddToQueue={(pos) => handleAddToQueue(book, pos)}
                        onDelete={() => {
                          handleDeleteBook(book.id);
                          showToast(t('toast_book_deleted', { title: book.title }));
                        }} 
                        isSelectionMode={isSelectionMode} 
                        isSelected={selectedBooks.includes(book.id)} 
                        onToggleSelect={() => { if(selectedBooks.includes(book.id)) setSelectedBooks(selectedBooks.filter(id => id !== book.id)); else setSelectedBooks([...selectedBooks, book.id]); }}
                        isFavorite={favoriteBookIds.includes(book.id)}
                        onToggleFavorite={() => toggleFavoriteBook(book.id)}
                        isBookPlaying={currentBook.id === book.id && isPlaying}
                        isCompleted={isBookCompleted(book)}
                        isStarted={isBookStarted(book)}
                        onToggleCompleted={() => {
                          const isComp = isBookCompleted(book);
                          const chapIds = (book.chapters || []).map((c: any) => `${book.id}-${c.id}`);
                          if (isComp) {
                            setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                            setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                            showToast(t('toast_book_marked_unstarted', { title: book.title }));
                          } else {
                            setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                            setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                            showToast(t('toast_book_marked_completed', { title: book.title }));
                          }
                        }}
                      />
                    ))}
                  </AnimatePresence>
                  {books.filter(b => {
                    if (!favoriteBookIds.includes(b.id)) return false;
                    if (statusFilter === 'in-progress') return isBookStarted(b) && !isBookCompleted(b);
                    if (statusFilter === 'completed') return isBookCompleted(b);
                    if (statusFilter === 'unstarted') return !isBookStarted(b) && !isBookCompleted(b);
                    return true;
                  }).length === 0 && (
                    <div className="col-span-full py-16 text-center w-full">
                      <p className="text-base text-[var(--text-muted)]">
                        {statusFilter !== 'all' && statusFilter !== 'favorites' 
                          ? t('no_books_filtered')
                          : t('empty_favorites')}
                      </p>
                    </div>
                  )}
                </div>
              ) : activeScreen.id === 'library-autores-favoritos' ? (
                sortedAuthors.filter(a => favoriteAuthorIds.includes(a.id)).length === 0 ? (
                  <div className="col-span-full py-16 text-center w-full">
                    <p className="text-base text-[var(--text-muted)]">{t('empty_favorites')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                    <AnimatePresence>
                      {sortedAuthors.filter(a => favoriteAuthorIds.includes(a.id)).map((author) => {
                        const isFav = favoriteAuthorIds.includes(author.id);
                        const isSelected = selectedAuthors.includes(author.id);
                        return (
                          <AuthorCard 
                            key={author.id}
                            author={author}
                            onSelect={() => navigateTo('author-detail', author)}
                            isFavorite={isFav}
                            onToggleFavorite={() => toggleFavoriteAuthor(author.id)}
                            isSelectionMode={isSelectionMode}
                            isSelected={isSelected}
                            onToggleSelect={() => {
                              if (isSelected) {
                                setSelectedAuthors(selectedAuthors.filter(id => id !== author.id));
                              } else {
                                setSelectedAuthors([...selectedAuthors, author.id]);
                              }
                            }}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )
              ) : activeScreen.id === 'library-idiomas' ? (
                sortedLanguages.length === 0 ? (
                  <div className="col-span-full py-16 text-center w-full">
                    <p className="text-base text-[var(--text-muted)]">{t('no_languages_found')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-grid-2">
                    <AnimatePresence>
                      {sortedLanguages.map((lang) => {
                        const langData = getLanguageData(lang, resolvedLanguage);
                        const isSelected = selectedLanguages.includes(lang.toLowerCase());
                        return (
                          <motion.div 
                            key={lang} 
                            layout="position"
                            initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                            whileTap={{ scale: 0.97 }} 
                            onClick={() => {
                              if (isSelectionMode) {
                                if (isSelected) {
                                  setSelectedLanguages(selectedLanguages.filter(l => l !== lang.toLowerCase()));
                                } else {
                                  setSelectedLanguages([...selectedLanguages, lang.toLowerCase()]);
                                }
                              } else {
                                navigateTo('library-idioma-' + lang.toLowerCase(), lang);
                              }
                            }}
                            className={`relative isolate aspect-[16/9] rounded-3xl cursor-pointer group shadow-lg border transition-[border-color,box-shadow] p-5 flex flex-col justify-end ${
                              isSelectionMode && isSelected
                                ? 'border-transparent shadow-[0_0_20px_rgba(var(--winblue-rgb),0.35)]'
                                : 'border-white/15 hover:border-white/30'
                            }`}
                          >
                            {/* Camada interna recortada com fundo e bandeira com zoom */}
                            <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
                              <div className={`absolute inset-0 bg-gradient-to-br ${langData.gradient} ${isSelectionMode && isSelected ? 'opacity-70' : ''}`} />
                              <div className="absolute inset-0 bg-black/15" />

                              <span className="absolute -bottom-3 -right-2 text-6xl sm:text-7xl select-none pointer-events-none opacity-40 group-hover:scale-110 transition-transform duration-500 transform translate-x-2 translate-y-2">
                                {langData.flag}
                              </span>
                            </div>

                            {isSelectionMode && (
                              <div className="absolute top-4 right-4 z-20">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected ? 'bg-winblue border-winblue text-white shadow-lg' : 'border-white/70 bg-black/30 text-transparent'
                                }`}>
                                  <CheckCircle2 size={16} />
                                </div>
                              </div>
                            )}

                            <div className="relative z-10">
                              <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md tracking-tight origin-bottom-left rtl:origin-bottom-right transition-transform duration-500 group-hover:scale-105">{langData.name}</h3>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )
              ) : activeScreen.id.startsWith('library-idioma-') ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                  {(() => {
                    const selectedLang = (activeScreen.data || activeScreen.id.replace('library-idioma-', '')).toLowerCase();
                    const langBooks = filteredBooks.filter(b => {
                      const { language } = resolveNarratorAndLanguage(b);
                      if (!language) return false;
                      return language.toLowerCase() === selectedLang;
                    });
                    if (langBooks.length === 0) {
                      return (
                        <div className="col-span-full py-16 text-center w-full">
                          <p className="text-base text-[var(--text-muted)]">{t('no_books_in_language')}</p>
                        </div>
                      );
                    }
                    return (
                      <AnimatePresence>
                        {langBooks.map((book) => (
                          <BookCard 
                            key={book.id} 
                            book={book} 
                            onSelect={() => handleSelectBookDetail(book)} 
                            onSelectAuthor={handleSelectAuthor}
                            onPlay={() => handlePlayBookFromStart(book)} 
                            onEdit={() => setEditingBook(book)} 
                            onAddToQueue={(pos) => handleAddToQueue(book, pos)}
                            onDelete={() => {
                              handleDeleteBook(book.id);
                              showToast(t('toast_book_deleted', { title: book.title }));
                            }} 
                            isSelectionMode={isSelectionMode} 
                            isSelected={selectedBooks.includes(book.id)} 
                            onToggleSelect={() => { if(selectedBooks.includes(book.id)) setSelectedBooks(selectedBooks.filter(id => id !== book.id)); else setSelectedBooks([...selectedBooks, book.id]); }}
                            isFavorite={favoriteBookIds.includes(book.id)}
                            onToggleFavorite={() => toggleFavoriteBook(book.id)}
                            isBookPlaying={currentBook.id === book.id && isPlaying}
                            isCompleted={isBookCompleted(book)}
                            isStarted={isBookStarted(book)}
                            onToggleCompleted={() => {
                              const isComp = isBookCompleted(book);
                              const chapIds = (book.chapters || []).map((c: any) => `${book.id}-${c.id}`);
                              if (isComp) {
                                setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                                setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                                showToast(t('toast_book_marked_unstarted', { title: book.title }));
                              } else {
                                setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                                setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                                showToast(t('toast_book_marked_completed', { title: book.title }));
                              }
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    );
                  })()}
                </div>
              ) : activeScreen.id === 'library-ouvidos-recentemente' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                  <AnimatePresence>
                    {(sortBy !== 'name-asc' ? sortBooks(recentlyListenedBooks) : recentlyListenedBooks).map((book) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        onSelect={() => handleSelectBookDetail(book)} 
                        onSelectAuthor={handleSelectAuthor}
                        onPlay={() => handlePlayBookFromStart(book)} 
                        onEdit={() => setEditingBook(book)} 
                        onAddToQueue={(pos) => handleAddToQueue(book, pos)}
                        onDelete={() => {
                          handleDeleteBook(book.id);
                          showToast(t('toast_book_deleted', { title: book.title }));
                        }} 
                        isSelectionMode={isSelectionMode} 
                        isSelected={selectedBooks.includes(book.id)} 
                        onToggleSelect={() => { if(selectedBooks.includes(book.id)) setSelectedBooks(selectedBooks.filter(id => id !== book.id)); else setSelectedBooks([...selectedBooks, book.id]); }}
                        isFavorite={favoriteBookIds.includes(book.id)}
                        onToggleFavorite={() => toggleFavoriteBook(book.id)}
                        isBookPlaying={currentBook.id === book.id && isPlaying}
                        isCompleted={isBookCompleted(book)}
                        isStarted={isBookStarted(book)}
                        onToggleCompleted={() => {
                          const isComp = isBookCompleted(book);
                          const chapIds = (book.chapters || []).map((c: any) => `${book.id}-${c.id}`);
                          if (isComp) {
                            setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                            setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                            showToast(t('toast_book_marked_unstarted', { title: book.title }));
                          } else {
                            setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                            setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                            showToast(t('toast_book_marked_completed', { title: book.title }));
                          }
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : activeScreen.id === 'library-colecoes' ? (
                collections.length === 0 ? (
                  <div className="col-span-full py-16 text-center w-full flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-winblue/10 text-winblue flex items-center justify-center mb-4">
                      <FolderPlus size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-main)] mb-1">{t('no_collections_yet')}</h3>
                    <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">{t('no_collections_sub')}</p>
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleStartCreateCollection()}
                      className="h-10 px-5 rounded-full bg-winblue text-white font-semibold text-xs shadow-lg hover:shadow-[0_0_20px_rgba(var(--winblue-rgb),0.4)] transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={16} />
                      <span>{t('create_collection')}</span>
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-grid-2">
                    <AnimatePresence>
                      {sortedCollections.map((col) => {
                        const isSelected = selectedCollectionIds.includes(col.id);
                        return (
                          <CollectionCard
                            key={col.id}
                            col={col}
                            selectionMode={isSelectionMode}
                            selected={isSelected}
                            menu={collectionMenu(col)}
                            onClick={() => {
                              if (isSelectionMode) {
                                setSelectedCollectionIds(isSelected
                                  ? selectedCollectionIds.filter(id => id !== col.id)
                                  : [...selectedCollectionIds, col.id]);
                              } else {
                                navigateTo('library-colecao-' + col.id, col);
                              }
                            }}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )
              ) : getCollectionSubScreen(activeScreen.id, activeScreen.data) ? (
                (() => {
                  // Sub-página "Ver tudo" de uma coleção (ex.: Audiobooks em Clássicos)
                  const info = getCollectionSubScreen(activeScreen.id, activeScreen.data)!;
                  if (!info.collection) {
                    return (
                      <div className="py-16 text-center text-[var(--text-muted)] w-full">
                        {t('no_collections_yet')}
                      </div>
                    );
                  }
                  const items = getCollectionItems(info.collection);
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                      <AnimatePresence>
                        {info.kind === 'audiobooks'
                          ? items.books.map(book => renderCollectionBookCard(book, info.collection!.id))
                          : items.authors.map(author => renderCollectionAuthorCard(author, info.collection!.id))}
                      </AnimatePresence>
                    </div>
                  );
                })()
              ) : activeScreen.id.startsWith('library-colecao-') ? (
                (() => {
                  const colId = activeScreen.id.replace('library-colecao-', '');
                  const currentCollection = collections.find(c => c.id === colId) || (activeScreen.data as Collection);
                  if (!currentCollection) {
                    return (
                      <div className="py-16 text-center text-[var(--text-muted)] w-full">
                        {t('no_collections_yet')}
                      </div>
                    );
                  }

                  const { books: colBooks, authors: colAuthors } = getCollectionItems(currentCollection);

                  return (
                    <div className="w-full flex flex-col">
                      {/* Seção Autores na Coleção (até 6; o restante em "Ver tudo") */}
                      {colAuthors.length > 0 && (
                        <div className="mb-10">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[var(--text-main)]">{t('authors')}</h2>
                            {colAuthors.length > 6 && (
                              <motion.button
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => navigateTo('library-col-autores-' + currentCollection.id, currentCollection)}
                                className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all"
                              >
                                <span>{t('see_all')}</span>
                                <ChevronRight size={15} className="-mr-0.5 rtl:rotate-180" />
                              </motion.button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
                            <AnimatePresence>
                              {colAuthors.slice(0, 6).map(author => renderCollectionAuthorCard(author, currentCollection.id))}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {/* Seção Audiobooks na Coleção (até 6; o restante em "Ver tudo") */}
                      {colBooks.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[var(--text-main)]">{t('audiobooks_label')}</h2>
                            {colBooks.length > 6 && (
                              <motion.button
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => navigateTo('library-col-audiobooks-' + currentCollection.id, currentCollection)}
                                className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all"
                              >
                                <span>{t('see_all')}</span>
                                <ChevronRight size={15} className="-mr-0.5 rtl:rotate-180" />
                              </motion.button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
                            <AnimatePresence>
                              {colBooks.slice(0, 6).map(book => renderCollectionBookCard(book, currentCollection.id))}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {/* Estado Vazio se nenhum item na coleção */}
                      {colBooks.length === 0 && colAuthors.length === 0 && (
                        <div className="col-span-full py-16 text-center w-full flex flex-col items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-winblue/10 text-winblue flex items-center justify-center mb-4">
                            <Plus size={32} />
                          </div>
                          <h3 className="text-xl font-bold text-[var(--text-main)] mb-1">{t('no_items_in_collection')}</h3>
                          <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">{t('no_items_in_collection_sub')}</p>
                          <motion.button
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => handleStartEditCurrentCollection(currentCollection)}
                            className="h-10 px-5 rounded-full bg-winblue text-white font-semibold text-xs shadow-lg hover:shadow-[0_0_20px_rgba(var(--winblue-rgb),0.4)] transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <Edit3 size={15} />
                            <span>{t('edit_collection')}</span>
                          </motion.button>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : activeScreen.id === 'library-autores' ? (
                sortedAuthors.length === 0 ? (
                  <div className="col-span-full py-16 text-center w-full">
                    <p className="text-base text-[var(--text-muted)]">{t('no_authors_found')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                    <AnimatePresence>
                      {sortedAuthors.map((author) => {
                        const isFav = favoriteAuthorIds.includes(author.id);
                        const isSelected = selectedAuthors.includes(author.id);
                        return (
                          <AuthorCard 
                            key={author.id}
                            author={author}
                            onSelect={() => navigateTo('author-detail', author)}
                            isFavorite={isFav}
                            onToggleFavorite={() => toggleFavoriteAuthor(author.id)}
                            isSelectionMode={isSelectionMode}
                            isSelected={isSelected}
                            onToggleSelect={() => {
                              if (isSelected) {
                                setSelectedAuthors(selectedAuthors.filter(id => id !== author.id));
                              } else {
                                setSelectedAuthors([...selectedAuthors, author.id]);
                              }
                            }}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )
              ) : activeScreen.id === 'library-gêneros' ? (
                sortedGenres.length === 0 ? (
                  <div className="col-span-full py-16 text-center w-full">
                    <p className="text-base text-[var(--text-muted)]">{t('no_genres_found')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-grid-2">
                    <AnimatePresence>
                      {sortedGenres.map((genreData) => {
                        const isSelected = selectedGenres.includes(genreData.id);
                        return (
                          <motion.div 
                            key={genreData.id} 
                            layout="position"
                            initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                            whileTap={{ scale: 0.97 }} 
                            onClick={() => {
                              if (isSelectionMode) {
                                if (isSelected) {
                                  setSelectedGenres(selectedGenres.filter(id => id !== genreData.id));
                                } else {
                                  setSelectedGenres([...selectedGenres, genreData.id]);
                                }
                              } else {
                                navigateTo('library-genre-' + genreData.id);
                              }
                            }}
                            className={`relative isolate aspect-[16/9] rounded-3xl cursor-pointer group shadow-lg border transition-[border-color,box-shadow] p-5 flex flex-col justify-end ${
                              isSelectionMode && isSelected 
                                ? 'border-transparent shadow-[0_0_20px_rgba(var(--winblue-rgb),0.35)]' 
                                : 'border-white/15 hover:border-white/30'
                            }`}
                          >
                            {/* Camada interna recortada com fundo e ícone com zoom */}
                            <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
                              <div className={`absolute inset-0 bg-gradient-to-br ${genreData.gradient} ${isSelectionMode && isSelected ? 'opacity-70' : ''}`} />
                              <div className="absolute inset-0 bg-black/15" />

                              <span className="absolute -bottom-4 -right-3 text-7xl sm:text-8xl select-none pointer-events-none opacity-30 group-hover:scale-110 transition-transform duration-500 transform translate-x-2 translate-y-2">
                                {getGenreEmoji(genreData.id)}
                              </span>
                            </div>

                            {isSelectionMode && (
                              <div className="absolute top-4 right-4 z-20">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected ? 'bg-winblue border-winblue text-white shadow-lg' : 'border-white/70 bg-black/30 text-transparent'
                                }`}>
                                  <CheckCircle2 size={16} />
                                </div>
                              </div>
                            )}

                            {/* Nome do Gênero com texto maior */}
                            <div className="relative z-10">
                              <h3 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md tracking-tight origin-bottom-left rtl:origin-bottom-right transition-transform duration-500 group-hover:scale-105">{getGenreName(genreData.id, resolvedLanguage)}</h3>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )
              ) : (
                <div className="w-full flex flex-col space-y-10">
                  {(() => {
                    const renderBookCard = (book: Audiobook) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        onSelect={() => handleSelectBookDetail(book)} 
                        onSelectAuthor={handleSelectAuthor}
                        onPlay={() => handlePlayBookFromStart(book)} 
                        onEdit={() => setEditingBook(book)} 
                        onAddToQueue={(pos) => handleAddToQueue(book, pos)}
                        onDelete={() => {
                          handleDeleteBook(book.id);
                          showToast(t('toast_book_deleted', { title: book.title }));
                        }} 
                        isSelectionMode={isSelectionMode} 
                        isSelected={selectedBooks.includes(book.id)} 
                        onToggleSelect={() => { 
                          if (selectedBooks.includes(book.id)) {
                            setSelectedBooks(selectedBooks.filter(id => id !== book.id));
                          } else {
                            setSelectedBooks([...selectedBooks, book.id]);
                          }
                        }}
                        isFavorite={favoriteBookIds.includes(book.id)}
                        onToggleFavorite={() => toggleFavoriteBook(book.id)}
                        isBookPlaying={currentBook.id === book.id && isPlaying}
                        isCompleted={isBookCompleted(book)}
                        isStarted={isBookStarted(book)}
                        onToggleCompleted={() => {
                          const isComp = isBookCompleted(book);
                          const chapIds = (book.chapters || []).map((c: any) => `${book.id}-${c.id}`);
                          if (isComp) {
                            setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                            setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                            showToast(t('toast_book_marked_unstarted', { title: book.title }));
                          } else {
                            setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                            setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                            showToast(t('toast_book_marked_completed', { title: book.title }));
                          }
                        }}
                      />
                    );

                    const renderBookGrid = (subBooks: Audiobook[]) => {
                      const isHomeSubmenu = activeScreen.id.startsWith('home-');
                      let displayedBooks = subBooks.filter(b => {
                        const matchesSearch = !searchQuery || matchesBookSearch(b, searchQuery);
                        if (!matchesSearch) return false;

                        if (!isHomeSubmenu) {
                          if (statusFilter === 'in-progress') return isBookStarted(b) && !isBookCompleted(b);
                          if (statusFilter === 'completed') return isBookCompleted(b);
                          if (statusFilter === 'unstarted') return !isBookStarted(b) && !isBookCompleted(b);
                        }
                        if (statusFilter === 'favorites') return favoriteBookIds.includes(b.id);
                        return true;
                      });

                      const isPreservedOrderRoute = 
                        activeScreen.id === 'home-continuar-ouvindo' || 
                        activeScreen.id === 'home-ouvidos-recentemente' || 
                        activeScreen.id === 'home-adicionados-recentemente';

                      if (!isPreservedOrderRoute || sortBy !== 'name-asc') {
                        displayedBooks = sortBooks(displayedBooks);
                      }
                      
                      if (displayedBooks.length === 0) {
                        return (
                          <div className="col-span-full py-16 text-center w-full">
                            <p className="text-base text-[var(--text-muted)]">{t('no_books_filtered')}</p>
                          </div>
                        );
                      }
                      
                      return (
                        <AnimatePresence>
                          {displayedBooks.map((book) => renderBookCard(book))}
                        </AnimatePresence>
                      );
                    };

                    const renderGroupedBookSections = (_subBooks: Audiobook[]) => {
                      if (allBooksNavGroups.length === 0) {
                        return (
                          <div className="col-span-full py-16 text-center w-full">
                            <p className="text-base text-[var(--text-muted)]">{t('no_books_filtered')}</p>
                          </div>
                        );
                      }

                      const isAlphabetMode = sortBy === 'name-asc' || sortBy === 'name-desc';
                      const gridRightPadding = isMobile ? 'pr-6' : (isAlphabetMode ? 'pr-[60px]' : 'pr-[74px]');

                      return (
                        <div className={`space-y-12 ${gridRightPadding}`}>
                          <AnimatePresence>
                            {allBooksNavGroups.map(group => (
                              <motion.section
                                key={group.id}
                                layout="position"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                id={`group-section-${group.id}`}
                                className="space-y-4 scroll-mt-24"
                              >
                                <h2 className="text-xl font-bold text-[var(--text-main)]">
                                  {group.title}
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                                  <AnimatePresence>
                                    {group.books.map((book) => renderBookCard(book))}
                                  </AnimatePresence>
                                </div>
                              </motion.section>
                            ))}
                          </AnimatePresence>
                        </div>
                      );
                    };

                    const isGenreRoute = activeScreen.id.startsWith('library-genre-');
                    const isSubgenreRoute = activeScreen.id.startsWith('library-subgenre-');

                    if (isGenreRoute) {
                      const genreId = activeScreen.id.replace('library-genre-', '');
                      const genreData = Object.values(GENRE_HIERARCHY).find(g => g.id === genreId);
                      if (genreData) {
                        return (
                          <>
                            {(() => {
                              const activeSubgenres = genreData.subgenres.filter(subgenre =>
                                books.some(b => isBookInSubgenre(b, genreData, subgenre))
                              );
                              if (activeSubgenres.length === 0) return null;
                              return (
                                <div className="mb-10">
                                  <h2 className="text-xl font-bold text-[var(--text-main)]">{t('subgenres')}</h2>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                                    <AnimatePresence>
                                      {activeSubgenres.slice().sort((a, b) => {
                                        if (a.toLowerCase() === 'outros' || a.toLowerCase() === 'outro') return 1;
                                        if (b.toLowerCase() === 'outros' || b.toLowerCase() === 'outro') return -1;
                                        return sortBy === 'name-desc' 
                                          ? b.localeCompare(a, resolvedLanguage, { sensitivity: 'base' }) 
                                          : a.localeCompare(b, resolvedLanguage, { sensitivity: 'base' });
                                      }).map((subgenre) => {
                                        const gradient = getSubgenreGradient(subgenre);
                                        const subgenreBooks = books.filter(b => isBookInSubgenre(b, genreData, subgenre));
                                        const isAllSelected = subgenreBooks.length > 0 && subgenreBooks.every(b => selectedBooks.includes(b.id));
                                        return (
                                          <motion.div 
                                            key={subgenre} 
                                            layout="position"
                                            initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                                            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                              if (isSelectionMode) {
                                                if (isAllSelected) {
                                                  setSelectedBooks(prev => prev.filter(id => !subgenreBooks.some(b => b.id === id)));
                                                } else {
                                                  setSelectedBooks(prev => Array.from(new Set([...prev, ...subgenreBooks.map(b => b.id)])));
                                                }
                                              } else {
                                                navigateTo(`library-subgenre-${genreData.id}-${subgenre}`, { genre: genreData, subgenre });
                                              }
                                            }}
                                            className={`relative isolate h-28 rounded-3xl cursor-pointer group shadow-lg border transition-[border-color,box-shadow] p-4 flex flex-col justify-end ${
                                              isSelectionMode && isAllSelected
                                                ? 'border-transparent shadow-[0_0_20px_rgba(var(--winblue-rgb),0.35)]'
                                                : 'border-white/15 hover:border-white/30'
                                            }`}
                                          >
                                            {/* Camada interna recortada com fundo e ícone com zoom */}
                                            <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
                                              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} ${isSelectionMode && isAllSelected ? 'opacity-70' : ''}`} />
                                              <div className="absolute inset-0 bg-black/15" />

                                              <span className="absolute -bottom-3 -right-2 text-5xl sm:text-6xl select-none pointer-events-none opacity-30 group-hover:scale-125 transition-transform duration-500 transform translate-x-1 translate-y-1">
                                                {getSubgenreEmoji(subgenre)}
                                              </span>
                                            </div>

                                            {isSelectionMode && (
                                              <div className="absolute top-3 right-3 z-20">
                                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                                                  isAllSelected ? 'bg-winblue border-winblue text-white shadow-lg' : 'border-white/70 bg-black/30 text-transparent'
                                                }`}>
                                                  <CheckCircle2 size={14} />
                                                </div>
                                              </div>
                                            )}

                                            {/* Nome do Subgênero com texto maior */}
                                            <div className="relative z-10">
                                              <h4 className="text-base sm:text-lg font-bold text-white drop-shadow-md tracking-tight origin-bottom-left rtl:origin-bottom-right transition-transform duration-500 group-hover:scale-105">{getSubgenreName(subgenre, resolvedLanguage)}</h4>
                                            </div>
                                          </motion.div>
                                        );
                                      })}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              );
                            })()}
                            
                            <div>
                              <h2 className="text-xl font-bold text-[var(--text-main)]">{t('all_books_of_genre', { genre: getGenreName(genreData.id, resolvedLanguage) })}</h2>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                                {renderBookGrid(books.filter(b => isBookInGenre(b, genreData)))}
                              </div>
                            </div>
                          </>
                        );
                      }
                    }

                    if (isSubgenreRoute) {
                      const routeData = activeScreen.id.replace('library-subgenre-', '');
                      const matchedGenre = activeScreen.data?.genre || Object.values(GENRE_HIERARCHY)
                        .sort((a, b) => b.id.length - a.id.length)
                        .find(g => routeData.startsWith(g.id + '-'));
                      const genreData = matchedGenre;
                      const subgenreName = activeScreen.data?.subgenre || (matchedGenre ? routeData.substring(matchedGenre.id.length + 1) : routeData);
                      
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                          {renderBookGrid(books.filter(b => genreData ? isBookInSubgenre(b, genreData, subgenreName) : true))}
                        </div>
                      );
                    }

                    let subBooks = [...books];
                    if (activeScreen.id.startsWith('library-')) {
                      const sub = activeScreen.id.replace('library-', '').toLowerCase();
                      if (sub === 'favoritos') {
                        subBooks = books.filter(b => favoriteBookIds.includes(b.id));
                      } else if (sub !== 'títulos') {
                        subBooks = books.filter(b => b.category.toLowerCase() === sub);
                      }
                    } else if (activeScreen.id === 'home-continuar-ouvindo') {
                      const inProgress = books.filter(b => isBookStarted(b) && !isBookCompleted(b));
                      subBooks = [...inProgress].sort((a, b) => {
                        const idxA = recentlyListenedBookIds.indexOf(a.id);
                        const idxB = recentlyListenedBookIds.indexOf(b.id);
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        if (idxA !== -1) return -1;
                        if (idxB !== -1) return 1;
                        return 0;
                      });
                    } else if (activeScreen.id === 'home-ouvidos-recentemente') {
                      subBooks = recentlyListenedBooks.slice(0, 20);
                    } else if (activeScreen.id === 'home-adicionados-recentemente') {
                      subBooks = recentlyAddedBooks;
                    }
                    
                    if (activeScreen.id === 'library-títulos') {
                      return renderGroupedBookSections(subBooks);
                    }
                    
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                        {renderBookGrid(subBooks)}
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}

          {/* SCREEN: CRIAR OU EDITAR COLEÇÃO (MESMO PADRÃO DE EDITAR AUDIOBOOK/AUTOR) */}
          {(activeScreen.id === 'create-collection' || activeScreen.id === 'edit-collection') && (() => {
            const editInputClass = "w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all";
            const addButtonClass = "h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer";
            const pickerPopupClass = "absolute right-0 top-0 w-80 max-w-[calc(100vw-32px)] rounded-[24px] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] shadow-2xl z-50 flex flex-col overflow-hidden";
            const listRowClass = "group flex items-center justify-between py-2 pl-4 sm:pl-5 pr-2.5 rtl:pl-2.5 rtl:pr-4 rtl:sm:pr-5 rounded-full bg-card/40 border border-[var(--text-main)]/5 hover:bg-[var(--button-secondary-bg)]/50 mb-1.5 transition-all";
            const removeButtonClass = "w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all cursor-pointer";

            return (
            <motion.div
              key={activeScreen.id}
              variants={transicaoConteudo}
              initial="escondido"
              animate="visivel"
              exit="saindo"
              className="flex flex-col gap-8 mt-4 relative w-full pb-16"
            >
              <div className="flex flex-col md:flex-row items-start gap-8 w-full">
                {/* Prévia do card (no lugar da capa/foto) + seletor de cor; no celular, centralizada */}
                <div className="flex flex-col items-center shrink-0 max-md:self-center">
                  <div className="relative isolate shrink-0 rounded-3xl overflow-hidden shadow-2xl w-56 aspect-[16/9] border border-white/15 p-4 flex flex-col justify-end">
                    <div className={`absolute inset-0 bg-gradient-to-br ${colFormPalette.gradient}`} />
                    <div className="absolute inset-0 bg-black/20" />
                    <span className="absolute -bottom-3 -right-2 text-6xl sm:text-7xl select-none pointer-events-none opacity-40 transform translate-x-2 translate-y-2">
                      {colFormEmoji}
                    </span>
                    <div className="relative z-10 min-w-0">
                      <h3 className="text-xl font-bold text-white drop-shadow-md tracking-tight truncate">
                        {colFormName.trim() || t('collection_name_placeholder')}
                      </h3>
                      {colFormDesc.trim() && (
                        <p className="text-xs font-medium text-white/80 mt-0.5 line-clamp-2">
                          {colFormDesc.trim()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-col items-center gap-2 w-56">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      {t('select_color')}
                    </span>
                    <div className="grid grid-cols-6 gap-x-3 gap-y-3.5 justify-items-center px-3 py-3 rounded-2xl bg-card/60 backdrop-blur-md border border-[var(--text-main)]/10 shadow-sm w-full">
                      {COLLECTION_AVAILABLE_PALETTES.map((pal) => {
                        const isSelected = colFormPalette.id === pal.id;
                        return (
                          <button
                            key={pal.id}
                            type="button"
                            title={pal.name}
                            onClick={() => setColFormPalette(pal)}
                            style={{ backgroundColor: pal.hex }}
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-winblue ring-offset-[1.5px] ring-offset-black/50 shadow-[0_0_10px_rgba(var(--winblue-rgb),0.5)] hover:shadow-[0_0_14px_rgba(var(--winblue-rgb),0.75)]'
                                : 'opacity-85 hover:opacity-100 hover:ring-2 hover:ring-white/90 hover:ring-offset-[1.5px] hover:ring-offset-black/40 hover:shadow-[0_0_12px_rgba(255,255,255,0.75)]'
                            }`}
                          >
                            {isSelected && (
                              <Check size={9} strokeWidth={3.5} className="text-winblue drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] shrink-0 pointer-events-none" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Campos */}
                <div className="flex flex-col space-y-4 flex-1 w-full min-w-0">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                      {t('collection_name_placeholder')}
                    </label>
                    <input
                      type="text"
                      value={colFormName}
                      onChange={(e) => setColFormName(e.target.value)}
                      placeholder={t('collection_name_placeholder')}
                      className={editInputClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                      {t('collection_desc_placeholder')}
                    </label>
                    <div className="relative w-full">
                      <input
                        type="text"
                        maxLength={60}
                        value={colFormDesc}
                        onChange={(e) => setColFormDesc(e.target.value.slice(0, 60))}
                        placeholder={t('collection_desc_placeholder')}
                        className={`${editInputClass} pr-14 rtl:pr-4 rtl:pl-14`}
                      />
                      <span className="absolute top-1/2 -translate-y-1/2 right-3.5 rtl:right-auto rtl:left-3.5 text-[10px] text-[var(--text-muted)] pointer-events-none select-none">
                        {colFormDesc.length}/60
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                      {t('select_icon_or_emoji')}
                    </label>
                    <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 p-2 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 shadow-sm backdrop-blur-3xl">
                      {COLLECTION_AVAILABLE_EMOJIS.map((emoji) => {
                        const isSelected = colFormEmoji === emoji;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setColFormEmoji(emoji)}
                            className={`h-9 rounded-xl flex items-center justify-center text-lg border transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? 'bg-winblue/15 border-winblue/40 shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)]'
                                : 'border-transparent hover:bg-white/15 hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                            }`}
                          >
                            <span>{emoji}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção Autores */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--text-main)]">
                    {t('authors')}
                  </h2>
                  <div className={`relative shrink-0 ${showAddAuthorPopup ? 'z-50' : 'z-10'}`}>
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      animate={morphTriggerAnimate(showAddAuthorPopup)}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Celular/tablet: a lista abre numa folha em tela cheia (não num pop-up pequeno)
                        if (useFullScreenSheets) { openMobileSheet({ kind: 'collection-form-items', mode: 'authors' }); return; }
                        setShowAddBookPopup(false);
                        setColPickerAnchor(e.currentTarget);
                        setShowAddAuthorPopup(!showAddAuthorPopup);
                      }}
                      className={addButtonClass}
                    >
                      <span>{t('add')}</span>
                      <Plus size={14} />
                    </motion.button>

                    <AnimatePresence>
                      {showAddAuthorPopup && (
                        <>
                          <div
                            className="fixed inset-0 z-40 cursor-default"
                            {...getBackdropProps(() => setShowAddAuthorPopup(false))}
                          />
                          <MorphPopup
                            anchor={colPickerAnchor}
                            data-popup-content="true"
                            onClick={(e) => e.stopPropagation()}
                            style={{ transformOrigin: 'top right' }}
                            className={pickerPopupClass}
                          >
                            <CollectionItemsPickerContent
                              mode="authors"
                              authors={authors}
                              books={books}
                              selectedAuthorIds={colSelectedAuthorIds}
                              selectedBookIds={colSelectedBookIds}
                              onToggleAuthor={(id) => setColSelectedAuthorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                              onToggleBook={(id) => {
                                const adding = !colSelectedBookIds.includes(id);
                                setColSelectedBookIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                                if (adding) {
                                  const authorId = findAuthorIdForBook(id);
                                  if (authorId) setColSelectedAuthorIds(prev => prev.includes(authorId) ? prev : [...prev, authorId]);
                                }
                              }}
                            />
                          </MorphPopup>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  {colSelectedAuthorIds.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] py-3">
                      {t('no_authors_in_collection')}
                    </p>
                  ) : (
                    colSelectedAuthorIds.map((authorId, i) => {
                      const author = authors.find(a => a.id === authorId);
                      if (!author) return null;
                      return (
                        <div key={author.id} className={listRowClass}>
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <span className="w-6 text-center text-xs text-[var(--text-muted)] shrink-0">
                              {i + 1}
                            </span>
                            <img
                              src={getEffectiveAuthorAvatar(author.name, author.picture)}
                              alt={author.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                            <span className="text-sm font-medium text-[var(--text-main)] truncate">
                              {author.name}
                            </span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setColSelectedAuthorIds(prev => prev.filter(id => id !== author.id))}
                            className={removeButtonClass}
                            title={t('remove')}
                          >
                            <X size={14} />
                          </motion.button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Seção Audiobooks */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--text-main)]">
                    {t('audiobooks_label')}
                  </h2>
                  <div className={`relative shrink-0 ${showAddBookPopup ? 'z-50' : 'z-10'}`}>
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      animate={morphTriggerAnimate(showAddBookPopup)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (useFullScreenSheets) { openMobileSheet({ kind: 'collection-form-items', mode: 'books' }); return; }
                        setShowAddAuthorPopup(false);
                        setColPickerAnchor(e.currentTarget);
                        setShowAddBookPopup(!showAddBookPopup);
                      }}
                      className={addButtonClass}
                    >
                      <span>{t('add')}</span>
                      <Plus size={14} />
                    </motion.button>

                    <AnimatePresence>
                      {showAddBookPopup && (
                        <>
                          <div
                            className="fixed inset-0 z-40 cursor-default"
                            {...getBackdropProps(() => setShowAddBookPopup(false))}
                          />
                          <MorphPopup
                            anchor={colPickerAnchor}
                            data-popup-content="true"
                            onClick={(e) => e.stopPropagation()}
                            style={{ transformOrigin: 'top right' }}
                            className={pickerPopupClass}
                          >
                            <CollectionItemsPickerContent
                              mode="books"
                              authors={authors}
                              books={books}
                              selectedAuthorIds={colSelectedAuthorIds}
                              selectedBookIds={colSelectedBookIds}
                              onToggleAuthor={(id) => setColSelectedAuthorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                              onToggleBook={(id) => {
                                const adding = !colSelectedBookIds.includes(id);
                                setColSelectedBookIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                                if (adding) {
                                  const authorId = findAuthorIdForBook(id);
                                  if (authorId) setColSelectedAuthorIds(prev => prev.includes(authorId) ? prev : [...prev, authorId]);
                                }
                              }}
                            />
                          </MorphPopup>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  {colSelectedBookIds.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] py-3">
                      {t('no_books_in_collection')}
                    </p>
                  ) : (
                    colSelectedBookIds.map((bookId, i) => {
                      const book = books.find(b => b.id === bookId);
                      if (!book) return null;
                      return (
                        <div key={book.id} className={listRowClass}>
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <span className="w-6 text-center text-xs text-[var(--text-muted)] shrink-0">
                              {i + 1}
                            </span>
                            <img
                              src={book.cover || getGenericBookCover(book.title, book.author)}
                              onError={(e) => handleBookCoverError(book, e)}
                              alt={book.title}
                              className="w-6 h-[38px] aspect-[1/1.6] rounded-md object-cover shadow-sm shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[var(--text-main)] truncate">
                                {book.title}
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)] truncate">
                                {book.author}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setColSelectedBookIds(prev => prev.filter(id => id !== book.id))}
                            className={removeButtonClass}
                            title={t('remove')}
                          >
                            <X size={14} />
                          </motion.button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
            );
          })()}

          {/* SCREEN: BOOK DETAIL */}
          {activeScreen.id === 'book-detail' && (
            <Suspense fallback={
              <div className="w-full min-h-[320px] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-winblue border-t-transparent animate-spin" />
              </div>
            }>
              <BookDetailView
                onOpenBookmarks={useFullScreenSheets ? (b, c) => openMobileSheet({ kind: 'bookmarks', bookId: b.id, chapterId: c.id }) : undefined}
                activeBook={books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook}
                books={books}
                currentBook={currentBook}
                currentChapter={currentChapter}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                favoriteBookIds={favoriteBookIds}
                favoriteChapters={favoriteChapters}
                setFavoriteChapters={setFavoriteChapters}
                completedChapters={completedChapters}
                setCompletedChapters={setCompletedChapters}
                startedChapters={startedChapters}
                setStartedChapters={setStartedChapters}
                isBookCompleted={isBookCompleted}
                isBookStarted={isBookStarted}
                isChapterCompleted={isChapterCompleted}
                isChapterStarted={isChapterStarted}
                handleSelectAuthor={handleSelectAuthor}
                handlePlayBookFromStart={handlePlayBookFromStart}
                handleBookCoverError={handleBookCoverError}
                handleAddToQueue={handleAddToQueue}
                formatTime={formatTime}
                showToast={showToast}
                navigateTo={navigateTo}
                transicaoConteudo={transicaoConteudo}
                resolvedTheme={resolvedTheme}
                resolvedLanguage={resolvedLanguage}
                getCustomCoverColor={getCustomCoverColor}
                isEditingBook={isEditingBook}
                editBookCover={editBookCover}
                setEditBookCover={setEditBookCover}
                bookCropImage={bookCropImage}
                setBookCropImage={setBookCropImage}
                editCoverColor={editCoverColor}
                setEditCoverColor={setEditCoverColor}
                editBookTitle={editBookTitle}
                setEditBookTitle={setEditBookTitle}
                editBookAuthor={editBookAuthor}
                setEditBookAuthor={setEditBookAuthor}
                editBookCategory={editBookCategory}
                setEditBookCategory={setEditBookCategory}
                editBookSubgenre={editBookSubgenre}
                setEditBookSubgenre={setEditBookSubgenre}
                editBookDescription={editBookDescription}
                setEditBookDescription={setEditBookDescription}
                editBookNarrator={editBookNarrator}
                setEditBookNarrator={setEditBookNarrator}
                editBookLanguage={editBookLanguage}
                setEditBookLanguage={setEditBookLanguage}
                editBookChapters={editBookChapters}
                setEditBookChapters={setEditBookChapters}
                editBookTranscript={editBookTranscript}
                setEditBookTranscript={setEditBookTranscript}
                editBookTranscriptSource={editBookTranscriptSource}
                setEditBookTranscriptSource={setEditBookTranscriptSource}
                editBookTranscriptFileName={editBookTranscriptFileName}
                setEditBookTranscriptFileName={setEditBookTranscriptFileName}
                editBookTextInputRef={editBookTextInputRef}
                handleUploadTranscriptForEditBook={handleUploadTranscriptForEditBook}
                activeChapterMenuId={activeChapterMenuId}
                setActiveChapterMenuId={setActiveChapterMenuId}
                activeChapterMenuMode={activeChapterMenuMode}
                setActiveChapterMenuMode={setActiveChapterMenuMode}
                chapterMenuOpenUp={chapterMenuOpenUp}
                setChapterMenuOpenUp={setChapterMenuOpenUp}
                activeChapterCommentsPopupId={activeChapterCommentsPopupId}
                setActiveChapterCommentsPopupId={setActiveChapterCommentsPopupId}
                chapterCommentsPopupOpenUp={chapterCommentsPopupOpenUp}
                setChapterCommentsPopupOpenUp={setChapterCommentsPopupOpenUp}
                closeAllPopups={closeAllPopups}
                renderCommentsContent={renderCommentsContent}
                getBackdropProps={getBackdropProps}
                toggleFavoriteChapter={toggleFavoriteChapter}
                handleAddChapterToQueue={handleAddChapterToQueue}
                isSynopsisTruncated={isSynopsisTruncated}
                handleSynopsisRef={handleSynopsisRef}
                synopsisFullTextRef={synopsisFullTextRef}
              />
            </Suspense>
          )}

          {/* SCREEN: BOOK SYNOPSIS (SUBMENU) */}
          {activeScreen.id === 'book-synopsis' && (() => {
            const rawTargetBook: Audiobook | null = activeScreen.data || selectedBook;
            const activeBook: Audiobook | null = rawTargetBook
              ? (books.find(b => b.id === rawTargetBook.id) || rawTargetBook)
              : null;

            if (!activeBook) return null;

            return (
              <motion.div
                key="screen-book-synopsis"
                variants={transicaoConteudo}
                initial="escondido"
                animate="visivel"
                exit="saindo"
                className="space-y-8 relative w-full"
              >
                <div>
                  <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] mb-8 tracking-tight">
                    {t('synopsis_of_book', { title: activeBook.title })}
                  </h1>
                  <p className="text-xl text-[var(--text-main)]/90 leading-relaxed whitespace-pre-line">
                    {activeBook.description}
                  </p>
                </div>
              </motion.div>
            );
          })()}

          {/* SCREEN: AUTHOR DETAIL */}
          {activeScreen.id === 'author-detail' && activeScreen.data && (() => {
            const authorData: Author = authors.find(a => a.id === activeScreen.data.id) || activeScreen.data;
            const authorBooks = books.filter(b => bookHasAuthor(b, authorData));
            const authorGenres: string[] = [];
            authorBooks.forEach(b => {
              const cat = b.category?.trim();
              const sub = b.subgenre?.trim();
              if (cat && cat !== 'Desconhecido') {
                const locCat = getGenreName(cat, resolvedLanguage);
                if (!authorGenres.includes(locCat)) authorGenres.push(locCat);
              } else if (sub && sub !== 'Desconhecido') {
                const locSub = getSubgenreName(sub, resolvedLanguage);
                if (!authorGenres.includes(locSub)) authorGenres.push(locSub);
              }
            });

            const authorNationality = getNationalityDisplayName(authorData.nationality || 'Desconhecido', resolvedLanguage);
            const authorGenresString = authorGenres.join(', ');

            const currentEffectiveAuthorPic = editAuthorPicture || authorData.picture;
            const hasCustomAuthorPic = Boolean(currentEffectiveAuthorPic && !currentEffectiveAuthorPic.startsWith('data:image/svg'));
            const handleRemoveAuthorPicture = () => {
              const targetName = editAuthorName.trim() || authorData.name;
              const defaultColor = getGenericAuthorColor(undefined, targetName);
              setEditAuthorColor(defaultColor);
              setEditAuthorPicture(getAuthorAvatar(targetName, defaultColor));
              setAuthorCropImage(null);
            };

            return (
            <motion.div key={`author-detail-${authorData.id}`} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="flex flex-col gap-8 mt-4 relative w-full">
              {/* Celular em pé: foto de ponta a ponta no topo (como a capa nas páginas dos audiobooks) */}
              {!isEditingAuthor && (() => {
                const heroPic = getEffectiveAuthorAvatar(authorData.name, authorData.picture);
                const heroMeta = [authorNationality, authorGenresString].filter(Boolean).join(' • ');
                const fadeMask = (m: string) => ({ WebkitMaskImage: m, maskImage: m });
                return (
                  <div className="md:hidden land:hidden relative mobile-bleed -mt-[calc(var(--app-header-top)+76px)]">
                    <div data-zoom-hero="true" className="relative w-full" style={{ height: 'min(100vw, 62dvh)' }}>
                      {/* Camadas da capa: o esmaecimento continua ~140px abaixo do bloco, por trás do conteúdo,
                          com curva suave (sem degrau nem linha reta entre a capa e a tela) */}
                      <div className="absolute inset-x-0 top-0 -z-10 overflow-hidden pointer-events-none" style={{ height: 'calc(100% + 140px)' }}>
                      <img
                        src={heroPic}
                        onError={(e) => { e.currentTarget.src = getAuthorAvatar(authorData.name); }}
                        alt={authorData.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={fadeMask('linear-gradient(to bottom, black 0%, rgba(0,0,0,1.000) 38.0%, rgba(0,0,0,0.998) 41.5%, rgba(0,0,0,0.984) 45.0%, rgba(0,0,0,0.951) 48.5%, rgba(0,0,0,0.896) 52.0%, rgba(0,0,0,0.820) 55.5%, rgba(0,0,0,0.725) 59.0%, rgba(0,0,0,0.616) 62.5%, rgba(0,0,0,0.500) 66.0%, rgba(0,0,0,0.384) 69.5%, rgba(0,0,0,0.275) 73.0%, rgba(0,0,0,0.180) 76.5%, rgba(0,0,0,0.104) 80.0%, rgba(0,0,0,0.049) 83.5%, rgba(0,0,0,0.016) 87.0%, rgba(0,0,0,0.002) 90.5%, rgba(0,0,0,0.000) 94.0%)')}
                      />
                      <img
                        src={heroPic}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 pointer-events-none"
                        style={fadeMask('linear-gradient(to bottom, black 0px, black 20px, transparent 96px)')}
                      />
                      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />
                      <img
                        src={heroPic}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 pointer-events-none"
                        style={fadeMask('linear-gradient(to bottom, transparent 38.0%, rgba(0,0,0,0.002) 39.1%, rgba(0,0,0,0.016) 40.2%, rgba(0,0,0,0.049) 41.4%, rgba(0,0,0,0.104) 42.5%, rgba(0,0,0,0.180) 43.6%, rgba(0,0,0,0.275) 44.8%, rgba(0,0,0,0.384) 45.9%, rgba(0,0,0,0.500) 47.0%, rgba(0,0,0,0.616) 48.1%, rgba(0,0,0,0.725) 49.2%, rgba(0,0,0,0.820) 50.4%, rgba(0,0,0,0.896) 51.5%, rgba(0,0,0,0.951) 52.6%, rgba(0,0,0,0.984) 53.8%, rgba(0,0,0,0.998) 54.9%, rgba(0,0,0,1.000) 56.0%, rgba(0,0,0,1.000) 64.0%, rgba(0,0,0,0.998) 65.5%, rgba(0,0,0,0.984) 67.0%, rgba(0,0,0,0.951) 68.5%, rgba(0,0,0,0.896) 70.0%, rgba(0,0,0,0.820) 71.5%, rgba(0,0,0,0.725) 73.0%, rgba(0,0,0,0.616) 74.5%, rgba(0,0,0,0.500) 76.0%, rgba(0,0,0,0.384) 77.5%, rgba(0,0,0,0.275) 79.0%, rgba(0,0,0,0.180) 80.5%, rgba(0,0,0,0.104) 82.0%, rgba(0,0,0,0.049) 83.5%, rgba(0,0,0,0.016) 85.0%, rgba(0,0,0,0.002) 86.5%, rgba(0,0,0,0.000) 88.0%)')}
                      />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 px-5 pb-4 flex flex-col items-center text-center text-[var(--text-main)]">
                        <h2 data-screen-title="true" className="text-[26px] font-bold leading-tight tracking-tight line-clamp-2">{authorData.name}</h2>
                        {heroMeta && <p className="text-[13px] font-semibold text-[var(--text-main)]/75 mt-1 [text-shadow:0_1px_8px_rgba(0,0,0,0.25)]">{heroMeta}</p>}
                      </div>
                    </div>
                    {Boolean(authorData.bio && authorData.bio.trim().length > 0 && !isAutoGeneratedBio(authorData.bio)) && (
                      <p className="px-4 text-sm text-[var(--text-main)]/90 leading-relaxed mt-2 whitespace-pre-line line-clamp-5">
                        {authorData.bio}
                      </p>
                    )}
                  </div>
                );
              })()}
              <div className={`flex flex-col md:flex-row items-start ${isEditingAuthor ? 'md:items-start' : 'md:items-center max-md:hidden land:flex land:flex-row land:items-center'} gap-8 w-full`}>
                {!isEditingAuthor ? (
                  <>
                    <div className="relative shrink-0 rounded-3xl overflow-hidden shadow-xl w-56 h-56 max-md:w-44 max-md:h-44">
                      <img 
                        src={getEffectiveAuthorAvatar(authorData.name, authorData.picture)} 
                        onError={(e) => { e.currentTarget.src = getAuthorAvatar(authorData.name); }}
                        alt={authorData.name} 
                        className="w-full h-full aspect-square rounded-3xl object-cover"
                      />
                      {favoriteAuthorIds.includes(authorData.id) && (
                        <div className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-yellow-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.4)] text-yellow-400 pointer-events-none">
                          <Star size={16} className="fill-yellow-400 text-yellow-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center space-y-3 flex-1 min-w-0 max-md:w-full max-md:items-center land:items-start">
                      <div className="max-md:w-full">
                        <h2 className="text-4xl md:text-5xl max-md:text-[26px] max-md:leading-tight font-semibold text-[var(--text-main)] tracking-tight">{authorData.name}</h2>
                        {(authorNationality || authorGenresString) && (
                          <p className="text-sm font-medium text-[var(--text-muted)] mt-1.5 flex items-center gap-2 flex-wrap max-md:justify-center land:justify-start">
                            {authorNationality && <span>{authorNationality}</span>}
                            {authorNationality && authorGenresString && <span className="text-[var(--text-muted)]/60">•</span>}
                            {authorGenresString && <span>{authorGenresString}</span>}
                          </p>
                        )}
                        {Boolean(authorData.bio && authorData.bio.trim().length > 0 && !isAutoGeneratedBio(authorData.bio)) && (
                          <p className="text-sm text-[var(--text-main)]/90 leading-relaxed mt-4 whitespace-pre-line line-clamp-4">
                            {authorData.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center shrink-0 max-md:self-center">
                      {authorCropImage ? (
                        <Suspense fallback={
                          <div className="w-56 h-56 flex items-center justify-center rounded-3xl bg-black/10 dark:bg-white/5 border border-white/10">
                            <div className="w-8 h-8 rounded-full border-2 border-winblue border-t-transparent animate-spin" />
                          </div>
                        }>
                          <ImageCropperSquare
                            imageSrc={authorCropImage}
                            isAuthor={true}
                            onSave={(cropped) => {
                              setEditAuthorPicture(cropped);
                              setAuthorCropImage(null);
                            }}
                            onCancel={() => {
                              setAuthorCropImage(null);
                            }}
                          />
                        </Suspense>
                      ) : (
                        <div className="relative shrink-0 rounded-3xl overflow-hidden shadow-2xl w-56 h-56 group">
                          <img 
                            src={editAuthorPicture || getEffectiveAuthorAvatar(editAuthorName.trim() || authorData.name, authorData.picture)} 
                            onError={(e) => {
                              const fallback = getAuthorAvatar(editAuthorName.trim() || authorData.name, editAuthorColor);
                              if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                            }}
                            alt={editAuthorName || authorData.name} 
                            className="w-full h-full object-cover rounded-3xl transition-all"
                          />
                          <div className="absolute inset-0 bg-black/55 opacity-100 transition-opacity flex flex-col max-md:flex-row items-center justify-center gap-2.5 p-3 text-center backdrop-blur-xs">
                            {hasCustomAuthorPic && (
                              <motion.button 
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRemoveAuthorPicture}
                                className="px-4 py-2 max-md:p-0 max-md:w-11 max-md:h-11 max-md:justify-center rounded-full bg-card/85 backdrop-blur-3xl border border-red-500/35 text-red-400 shadow-xl flex items-center gap-2 text-xs font-semibold hover:bg-red-500/20 hover:border-red-500/60 hover:text-red-300 transition-all cursor-pointer"
                              >
                                <Trash2 size={14} />
                                <span className="max-md:hidden">{t('remove_photo')}</span>
                              </motion.button>
                            )}
                            <motion.label 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 max-md:p-0 max-md:w-11 max-md:h-11 max-md:justify-center rounded-full bg-card/85 backdrop-blur-3xl border border-white/20 shadow-xl flex items-center gap-2 text-xs font-semibold text-white hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer"
                              title={t('choose_photo_computer')}
                            >
                              <Upload size={14} />
                              <span className="max-md:hidden">{t('select_photo')}</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (typeof event.target?.result === 'string') {
                                        setAuthorCropImage(event.target.result);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </motion.label>
                          </div>
                        </div>
                      )}

                      {/* Seletor de cores do perfil genérico */}
                      {!authorCropImage && !hasCustomAuthorPic && (
                        <div className="mt-3.5 flex flex-col items-center gap-2 w-56">
                          <span className="text-xs font-semibold text-[var(--text-muted)]">
                            {t('profile_color')}
                          </span>
                          <div className="grid grid-cols-6 gap-x-3 gap-y-3.5 justify-items-center px-3 py-3 rounded-2xl bg-card/60 backdrop-blur-md border border-[var(--text-main)]/10 shadow-sm w-full">
                            {GENERIC_COVER_COLORS.map(c => {
                              const isSelected = !hasCustomAuthorPic && editAuthorColor.toLowerCase() === c.hex.toLowerCase();
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  title={t('cover_color_' + c.id) || c.name}
                                  onClick={() => {
                                    setEditAuthorColor(c.hex);
                                    setEditAuthorPicture(getAuthorAvatar(editAuthorName.trim() || authorData.name, c.hex));
                                  }}
                                  style={{ backgroundColor: c.hex }}
                                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
                                    isSelected 
                                      ? 'ring-2 ring-winblue ring-offset-[1.5px] ring-offset-black/50 shadow-[0_0_10px_rgba(var(--winblue-rgb),0.5)] hover:shadow-[0_0_14px_rgba(var(--winblue-rgb),0.75)]' 
                                      : 'opacity-85 hover:opacity-100 hover:ring-2 hover:ring-white/90 hover:ring-offset-[1.5px] hover:ring-offset-black/40 hover:shadow-[0_0_12px_rgba(255,255,255,0.75)]'
                                  }`}
                                >
                                  {isSelected && (
                                    <Check size={9} strokeWidth={3.5} className="text-winblue drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] shrink-0 pointer-events-none" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-4 flex-1 w-full">
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                          {t('author_label')}
                        </label>
                        <input 
                          type="text"
                          value={editAuthorName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditAuthorName(val);
                            if (!hasCustomAuthorPic) {
                              setEditAuthorPicture(getAuthorAvatar(val.trim() || authorData.name, editAuthorColor));
                            }
                          }}
                          className="w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                          placeholder={t('author_label')}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                          {t('nationality_label')}
                        </label>
                        <input 
                          type="text"
                          list="author-nationalities-list"
                          value={editAuthorNationality}
                          onChange={(e) => setEditAuthorNationality(e.target.value)}
                          className="w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                          placeholder={t('nationality_label')}
                        />
                        <datalist id="author-nationalities-list">
                          {Array.from(new Set(NATIONALITIES_LIST.map(n => n[resolvedLanguage]))).map(nat => (
                            <option key={nat} value={nat} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                          {t('author_bio')}
                        </label>
                        <div className="relative w-full">
                          <textarea 
                            value={editAuthorBio}
                            onChange={(e) => setEditAuthorBio(e.target.value.slice(0, 350))}
                            maxLength={350}
                            rows={4}
                            className="w-full h-[116px] p-3.5 pb-7 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm leading-relaxed shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all resize-none custom-scrollbar"
                            placeholder={t('author_bio')}
                          />
                          <span className="absolute bottom-2.5 right-3.5 text-[10px] text-[var(--text-muted)] pointer-events-none select-none">
                            {editAuthorBio.length}/350
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="w-full">
                <h2 className="text-xl font-bold text-[var(--text-main)]">{t('author_titles')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
                  <AnimatePresence>
                    {authorBooks.map((book) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        onSelect={() => navigateTo('book-detail', book)} 
                        onSelectAuthor={handleSelectAuthor}
                        onPlay={() => handlePlayBookFromStart(book)} 
                        onEdit={() => setEditingBook(book)} 
                        onAddToQueue={(pos) => handleAddToQueue(book, pos)}
                        onDelete={() => {
                          handleDeleteBook(book.id);
                          showToast(t('toast_book_deleted', { title: book.title }));
                        }}
                        isSelectionMode={isSelectionMode} 
                        isSelected={selectedBooks.includes(book.id)} 
                        onToggleSelect={() => { if(selectedBooks.includes(book.id)) setSelectedBooks(selectedBooks.filter(id => id !== book.id)); else setSelectedBooks([...selectedBooks, book.id]); }}
                        isFavorite={favoriteBookIds.includes(book.id)}
                        onToggleFavorite={() => toggleFavoriteBook(book.id)}
                        isBookPlaying={currentBook.id === book.id && isPlaying}
                        isCompleted={isBookCompleted(book)}
                        isStarted={isBookStarted(book)}
                        onToggleCompleted={() => {
                          const isComp = isBookCompleted(book);
                          const chapIds = (book.chapters || []).map((c: any) => `${book.id}-${c.id}`);
                          if (isComp) {
                            setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                            setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                            showToast(t('toast_book_marked_unstarted', { title: book.title }));
                          } else {
                            setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                            setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                            showToast(t('toast_book_marked_completed', { title: book.title }));
                          }
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
            );
          })()}

          {/* SUBMENUS EM TELA CHEIA (CELULAR): o que no computador abre como pop-up com "voltar" */}
          {activeScreen.id === 'book-info' && activeScreen.data && (() => {
            const bk: Audiobook = books.find(b => b.id === activeScreen.data.id) || activeScreen.data;
            const { narrator, language } = resolveNarratorAndLanguage(bk);
            const genreParts: string[] = [];
            if (bk.category && bk.category !== 'Desconhecido') genreParts.push(getGenreName(bk.category, resolvedLanguage));
            if (bk.subgenre && bk.subgenre !== 'Desconhecido' && (!bk.category || bk.subgenre.toLowerCase() !== bk.category.toLowerCase())) {
              genreParts.push(getSubgenreName(bk.subgenre, resolvedLanguage));
            }
            const ext = (bk.fileName || bk.filePath || '').split('.').pop()?.toUpperCase();
            const rows: { icon: React.ReactNode; label: string; value: string }[] = [
              { icon: <BookOpen size={17} />, label: t('audiobook_label'), value: bk.title },
              { icon: <User size={17} />, label: t('author_label'), value: bk.author },
              ...(genreParts.length ? [{ icon: <Type size={17} />, label: t('genres'), value: genreParts.join(', ') }] : []),
              ...(narrator ? [{ icon: <Headphones size={17} />, label: t('narrated_by'), value: narrator }] : []),
              ...(language ? [{ icon: <Globe size={17} />, label: t('language_label'), value: language }] : []),
              ...(bk.year ? [{ icon: <Calendar size={17} />, label: t('year'), value: String(bk.year) }] : []),
              ...(bk.durationEst ? [{ icon: <Clock size={17} />, label: t('duration'), value: bk.durationEst }] : []),
              { icon: <ListMusic size={17} />, label: t('chapters'), value: String(bk.chapters?.length || 0) },
              { icon: <Database size={17} />, label: t('size'), value: bk.sizeStr || '428 MB' },
              { icon: <FileAudio size={17} />, label: t('format'), value: (ext && ext.length <= 4) ? ext : 'M4B' },
            ];
            return (
              <motion.div key="book-info" variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
                <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight mb-8">{t('more_details')}</h1>
                <div className={SCREEN_GROUP_CLASS}>
                  {rows.map(row => (
                    <div key={row.label} className="min-h-[52px] flex items-center gap-3.5 px-3 py-2">
                      <span className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">{row.icon}</span>
                      <span className="flex-1 min-w-0 flex flex-col">
                        <span className="text-xs text-[var(--text-muted)]">{row.label}</span>
                        <span className="text-[15px] font-semibold text-[var(--text-main)] break-words">{row.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })()}

          {activeScreen.id === 'app-info' && activeScreen.data && (
            <motion.div key="app-info" variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
              <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight mb-8">{activeScreen.data.title}</h1>
              <div className={SCREEN_GROUP_CLASS}>
                {[
                  { icon: <Info size={17} />, label: t('what_it_does'), value: activeScreen.data.whatItDoes },
                  { icon: <Hand size={17} />, label: t('how_it_works'), value: activeScreen.data.howItWorks },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3.5 px-3 py-3">
                    <span className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">{row.icon}</span>
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className="text-[15px] font-semibold text-[var(--text-main)]">{row.label}</span>
                      <span className="text-sm text-[var(--text-muted)] leading-relaxed mt-1">{row.value}</span>
                    </span>
                  </div>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleOpenExternalUrl(activeScreen.data.url)}
                className="mt-8 h-12 w-full rounded-full bg-winblue/20 border border-winblue/45 text-winblue text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <ExternalLink size={16} />
                <span>{t('go_to_app')}</span>
              </motion.button>
            </motion.div>
          )}

          {/* SCREEN: SETTINGS (LAZY-LOADED) */}
          {/* SCREEN: OPÇÕES DE UM AJUSTE (MOBILE) — tela cheia com as opções e suas explicações */}
          {activeScreen.id === 'settings-option' && activeScreen.data && (
            <motion.div key="settings-option" variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
              <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">{activeScreen.data.title}</h1>
              {/* Uma única legenda: a explicação detalhada (ou, sem ela, o subtítulo simples) */}
              {(() => {
                const helpKey = `settings_help_${String(activeScreen.data.id || '').replace(/-/g, '_')}`;
                const help = t(helpKey);
                const text = help && help !== helpKey ? help : activeScreen.data.subtitle;
                return text ? (
                  <p className="text-sm leading-relaxed text-[var(--text-muted)] md:mt-2">{text}</p>
                ) : null;
              })()}
              <div className="h-7 max-md:h-5" />
              <div className="p-1.5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 space-y-0.5">
                {(activeScreen.data.options || []).map((option: any, idx: number) => {
                  const isSelected = activeScreen.data.currentValue === option.value;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        activeScreen.data.onSelect?.(option.value);
                        setActiveScreen(prev => ({ ...prev, data: { ...prev.data, currentValue: option.value } }));
                      }}
                      className={`w-full flex items-center gap-3.5 px-3 py-2.5 text-left rtl:text-right rounded-[26px] border transition-colors ${
                        isSelected
                          ? 'bg-winblue/15 border-winblue/30'
                          : 'border-transparent hover:bg-white/10'
                      }`}
                    >
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-winblue/20 text-winblue' : 'bg-winblue/10 text-winblue'}`}>
                        {option.colorPreview
                          ? <span className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20" style={{ backgroundColor: option.colorPreview }} />
                          : (option.icon || <Check size={16} />)}
                      </span>
                      <span className="flex-1 min-w-0 flex flex-col">
                        <span className={`text-[15px] font-semibold truncate ${isSelected ? 'text-winblue' : 'text-[var(--text-main)]'}`}>{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-[var(--text-muted)] mt-0.5">{option.description}</span>
                        )}
                      </span>
                      {isSelected && <BsCheck2 size={18} className="text-winblue shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeScreen.id.startsWith('settings') && activeScreen.id !== 'settings-atalhos' && activeScreen.id !== 'settings-option' && (
            <Suspense fallback={
              <div className="w-full min-h-[320px] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-winblue border-t-transparent animate-spin" />
              </div>
            }>
              <SettingsView
                activeScreen={activeScreen}
                navigateTo={navigateTo}
                t={t}
                themeMode={themeMode}
                setThemeMode={setThemeMode}
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                uiDensity={uiDensity}
                setUiDensity={setUiDensity}
                fontSize={fontSize}
                setFontSize={setFontSize}
                appLanguage={appLanguage}
                setAppLanguage={setAppLanguage}
                resolvedLanguage={resolvedLanguage}
                libraryFolder={libraryFolder}
                isSyncingLibrary={isSyncingLibrary}
                handleSyncLibraryNow={handleSyncLibraryNow}
                handleSelectLibraryFolder={handleSelectLibraryFolder}
                detectNewFiles={detectNewFiles}
                setDetectNewFiles={setDetectNewFiles}
                checkOnStartup={checkOnStartup}
                setCheckOnStartup={setCheckOnStartup}
                handleExportLibraryBackup={handleExportLibraryBackup}
                handleImportLibraryBackup={handleImportLibraryBackup}
                defaultPlaybackSpeed={defaultPlaybackSpeed}
                setDefaultPlaybackSpeed={setDefaultPlaybackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
                seekForwardTime={seekForwardTime}
                setSeekForwardTime={setSeekForwardTime}
                seekBackwardTime={seekBackwardTime}
                setSeekBackwardTime={setSeekBackwardTime}
                resumePlayback={resumePlayback}
                setResumePlayback={setResumePlayback}
                autoShowText={autoShowText}
                setAutoShowText={setAutoShowText}
                voiceBoostEnabled={voiceBoostEnabled}
                setVoiceBoostEnabled={setVoiceBoostEnabled}
                dynamicCompressionEnabled={dynamicCompressionEnabled}
                setDynamicCompressionEnabled={setDynamicCompressionEnabled}
                notificationsEnabled={notificationsEnabled}
                setNotificationsEnabled={setNotificationsEnabled}
                notifyChapterCompleted={notifyChapterCompleted}
                setNotifyChapterCompleted={setNotifyChapterCompleted}
                notifyBookCompleted={notifyBookCompleted}
                setNotifyBookCompleted={setNotifyBookCompleted}
                notifyBookAdded={notifyBookAdded}
                setNotifyBookAdded={setNotifyBookAdded}
                dataFolder={dataFolder}
                handleOpenDataFolder={handleOpenDataFolder}
                showToast={showToast}
                closeAllPopups={closeAllPopups}
                activeSettingSelector={activeSettingSelector}
                setActiveSettingSelector={(sel: any) => {
                  if (sel && isMobile) {
                    closeAllPopups();
                    navigateTo('settings-option', { ...sel, triggerEl: undefined });
                    return;
                  }
                  setActiveSettingSelector(sel);
                }}
                showLicensesModal={showLicensesModal}
                setShowLicensesModal={setShowLicensesModal}
                transicaoConteudo={transicaoConteudo}
                getBackdropProps={getBackdropProps}
                setupWebAudioGraph={setupWebAudioGraph}
              />
            </Suspense>
          )}
            {/* SCREEN: OUTROS (MOBILE) — itens do menu lateral que não estão na barra de abas */}
            {activeScreen.id === 'more' && (
              <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
                <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] mb-8 tracking-tight">
                  {t('nav_more')}
                </h1>
                <div className="space-y-2.5">
                  {[
                    { id: 'other-apps', label: t('nav_other_apps'), icon: <RiApps2Line size={18} />, tint: 'from-indigo-500 to-violet-600' },
                    { id: 'help', label: t('nav_help'), icon: <HelpCircle size={18} />, tint: 'from-sky-500 to-blue-600' },
                    { id: 'settings', label: t('nav_settings'), icon: <SettingsIcon size={18} />, tint: 'from-slate-500 to-slate-700' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.id)}
                      className="settings-list-row w-full flex items-center gap-3.5 px-4 py-3 text-left rtl:text-right rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10"
                    >
                      <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.tint} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-[15px] font-medium text-[var(--text-main)] truncate">{item.label}</span>
                      <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0 rtl:rotate-180" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SCREEN: OTHER APPS */}
            {activeScreen.id === 'other-apps' && (
              <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
                <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight">
                  {t('nav_other_apps')}
                </h1>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                  {[
                    {
                      id: 'audiobook-generator',
                      title: t('other_app_ebook_converter'),
                      author: 'thenauan',
                      url: 'https://github.com/thenauan/audiobook-generator',
                      iconSrc: `${import.meta.env.BASE_URL}icons/audiobook-generator.svg`,
                      whatItDoes: t('other_app_ebook_converter_what'),
                      howItWorks: t('other_app_ebook_converter_how'),
                    },
                  ].map((app) => (
                    <OtherAppCard
                      key={app.id}
                      app={app}
                      onOpenUrl={handleOpenExternalUrl}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* SCREEN: HELP SCREENS (LAZY-LOADED) */}
            {(activeScreen.id === 'help' || activeScreen.id === 'help-theme' || activeScreen.id === 'help-article' || activeScreen.id === 'help-atalhos' || activeScreen.id === 'settings-atalhos') && (
              <Suspense fallback={
                <div className="w-full min-h-[320px] flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-winblue border-t-transparent animate-spin" />
                </div>
              }>
                <HelpCenterView
                  activeScreen={activeScreen}
                  navigateTo={navigateTo}
                  t={t}
                  resolvedLanguage={resolvedLanguage}
                  transicaoConteudo={transicaoConteudo}
                />
              </Suspense>
            )}

          </AnimatePresence>
          </ScreenErrorBoundary>
          </div>
        </main>

        {/* Abrir/fechar estilo iOS: o card se expande até a área de conteúdo (ou a página se recolhe para dentro do card) */}
        <ZoomTransitionLayer
          getScrollContainer={() => mainScrollRef.current}
          getCurrentScreenKey={() => activeScreenKeyRef.current}
          onCloseMidway={() => setSidebarHighlightHold(null)}
        />

        {/* 3 & 4. PLAYER FLUTUANTE (MINIPLAYER & FULLSCREEN COM TRANSIÇÃO RÁPIDA E FLUIDA A 60FPS) */}
      <AnimatePresence initial={false} custom={isFullScreen}>
        {Boolean(isPlayerVisible) && (
          !isFullScreen ? ((isMobile || isCompactPlayer) ? (
            <MobileMiniPlayer
              key="mini-player"
              docked={!isMobile}
              onPlayerPointerDownCapture={handlePlayerPointerDownCapture}
              enterFromFullscreen={wasFullScreenRef.current}
              currentBook={currentBook}
              currentChapter={currentChapter}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              setIsFullScreen={setIsFullScreen}
              closeAllPopups={closeAllPopups}
              handleBookCoverError={handleBookCoverError}
              miniplayerAmbientStyle={miniplayerAmbientStyle}
            />
          ) : (
            <MiniPlayer
              onPlayerPointerDownCapture={handlePlayerPointerDownCapture}
              enterFromFullscreen={wasFullScreenRef.current}
              currentBook={currentBook}
              currentChapter={currentChapter}
              currentChapterIndex={currentChapterIndex}
              currentTime={currentTime}
              totalDuration={totalDuration}
              chapterElapsed={chapterElapsed}
              chapterRemaining={chapterRemaining}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              handleSeek={handleSeek}
              handlePrevChapter={handlePrevChapter}
              handleNextChapter={handleNextChapter}
              seekBackwardTime={seekBackwardTime}
              seekForwardTime={seekForwardTime}
              playbackQueue={playbackQueue}
              setPlaybackQueue={setPlaybackQueue}
              setCurrentBook={setCurrentBook}
              setSelectedBook={setSelectedBook}
              handleBookCoverError={handleBookCoverError}
              closeAllPopups={closeAllPopups}
              setIsFullScreen={setIsFullScreen}
              miniplayerAmbientStyle={miniplayerAmbientStyle}
              currentBookHighlight={currentBookHighlight}
              formatTime={formatTime}
              handleSliderPointerDown={handleSliderPointerDown}
              handleSliderPointerUp={handleSliderPointerUp}
              sliderDragStartPointRef={sliderDragStartPointRef}
              renderPlaybackReturnButton={renderPlaybackReturnButton}
              renderSecondaryControls={renderSecondaryControls}
              pendingChapterScrollRef={pendingChapterScrollRef}
              targetScrollChapterIdRef={targetScrollChapterIdRef}
              setShouldScrollToCurrentChapter={setShouldScrollToCurrentChapter}
              navigateTo={navigateTo}
              authors={authors}
            />
          )) : (
              <FullscreenPlayer
                showToast={showToast}
                onShareLine={(line) => openShareImage('quote', currentBook, [transcriptLineText(line)])}
                onAddLineBookmark={(line) => {
                  // A frase vira uma marcação do capítulo em que ela está, no tempo em que começa
                  const chapters = currentBook.chapters || [];
                  const ch = chapters.find(c => line.start >= c.startTime && line.start < c.startTime + (c.duration || 0)) || currentChapter;
                  if (!ch) return;
                  const text = line.words && line.words.length > 0 ? line.words.map(w => w.text).join(' ') : line.text;
                  const newBookmark: any = {
                    id: Math.random().toString(36).substring(2, 9),
                    text: text.trim().slice(0, 500),
                    timestamp: Math.max(0, Math.floor(line.start - ch.startTime)),
                    createdAt: Date.now(),
                  };
                  const addTo = (b: Audiobook): Audiobook => b.id !== currentBook.id ? b : {
                    ...b,
                    chapters: b.chapters.map(c => {
                      if (c.id !== ch.id) return c;
                      const updated = [...(c.bookmarks || c.comments || []), newBookmark];
                      return { ...c, comments: updated, bookmarks: updated };
                    }),
                  };
                  setBooks(prev => prev.map(addTo));
                  setCurrentBook(prev => addTo(prev));
                  setSelectedBook(prev => (prev ? addTo(prev) : prev));
                  showToast(t('toast_bookmark_saved') || t('toast_comment_saved'));
                }}
                onPlayerPointerDownCapture={handlePlayerPointerDownCapture}
                miniplayerAmbientStyle={miniplayerAmbientStyle}
                currentBook={currentBook}
                currentChapter={currentChapter}
                currentChapterIndex={currentChapterIndex}
                currentTime={currentTime}
                totalDuration={totalDuration}
                chapterElapsed={chapterElapsed}
                chapterRemaining={chapterRemaining}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                handleSeek={handleSeek}
                handlePrevChapter={handlePrevChapter}
                handleNextChapter={handleNextChapter}
                seekBackwardTime={seekBackwardTime}
                seekForwardTime={seekForwardTime}
                playbackQueue={playbackQueue}
                setPlaybackQueue={setPlaybackQueue}
                setCurrentBook={setCurrentBook}
                setSelectedBook={setSelectedBook}
                handleBookCoverError={handleBookCoverError}
                closeAllPopups={closeAllPopups}
                setIsFullScreen={setIsFullScreen}
                currentBookHighlight={currentBookHighlight}
                formatTime={formatTime}
                handleSliderPointerDown={handleSliderPointerDown}
                handleSliderPointerUp={handleSliderPointerUp}
                sliderDragStartPointRef={sliderDragStartPointRef}
                renderPlaybackReturnButton={renderPlaybackReturnButton}
                renderFullScreenHeaderControls={renderFullScreenHeaderControls}
                onCloseTranscript={() => setShowTranscript(false)}
                pendingChapterScrollRef={pendingChapterScrollRef}
                targetScrollChapterIdRef={targetScrollChapterIdRef}
                setShouldScrollToCurrentChapter={setShouldScrollToCurrentChapter}
                navigateTo={navigateTo}
                authors={authors}
                fullscreenAmbientColors={fullscreenAmbientColors}
                showTranscript={showTranscript}
                hasTranscript={hasTranscript}
                fsTranscriptScrollRef={fsTranscriptScrollRef}
                activeTranscriptIndex={activeTranscriptIndex}
              />
          )
        )}
      </AnimatePresence>

      {/* TELA CHEIA DE BOAS-VINDAS E AJUSTES INICIAIS (1ª ABERTURA DO APP) */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            key="first-launch-onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[5000] overflow-hidden flex flex-col bg-[#04070f] text-white select-none"
          >
            {/* Fundo animado com gradiente se mexendo em azul escuro, vermelho escuro e verde escuro + blur intenso */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              {/* Azul escuro */}
              <motion.div
                animate={{
                  x: ['-12%', '22%', '-8%', '-12%'],
                  y: ['-10%', '18%', '-14%', '-10%'],
                  scale: [1, 1.28, 0.94, 1],
                }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] max-w-[780px] max-h-[780px] rounded-full bg-[#092b68] opacity-80 blur-[110px] transform-gpu"
              />
              {/* Vermelho escuro */}
              <motion.div
                animate={{
                  x: ['16%', '-20%', '10%', '16%'],
                  y: ['12%', '-18%', '16%', '12%'],
                  scale: [1.12, 0.9, 1.24, 1.12],
                }}
                transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-[10%] -right-[12%] w-[60vw] h-[60vw] max-w-[740px] max-h-[740px] rounded-full bg-[#680e20] opacity-75 blur-[115px] transform-gpu"
              />
              {/* Verde escuro */}
              <motion.div
                animate={{
                  x: ['-10%', '18%', '-16%', '-10%'],
                  y: ['18%', '-15%', '12%', '18%'],
                  scale: [0.95, 1.22, 1.05, 0.95],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-[18%] left-[15%] w-[65vw] h-[65vw] max-w-[760px] max-h-[760px] rounded-full bg-[#07472f] opacity-80 blur-[115px] transform-gpu"
              />
              {/* Camada de vidro com blur sobre o gradiente em movimento */}
              <div className="absolute inset-0 bg-black/35 backdrop-blur-3xl" />
            </div>

            {/* Conteúdo das etapas (1. Boas-vindas / 2. Ajustes iniciais) */}
            <div ref={onboardingScrollRef} onScroll={handleOnboardingScroll} className="safe-area-pad relative z-10 flex-1 w-full h-full overflow-y-auto custom-scrollbar flex flex-col">
              <AnimatePresence mode="wait">
                {onboardingStep === 'welcome' ? (
                  <motion.div
                    key="onboarding-welcome-step"
                    variants={transicaoConteudo}
                    initial="escondido"
                    animate="visivel"
                    exit="saindo"
                    className="flex-1 w-full max-w-xl mx-auto px-6 py-12 flex flex-col items-center justify-center text-center min-h-full"
                  >
                    {/* Título no mesmo formato do topo do menu lateral (ícone + Audiobook Player) */}
                    <motion.div
                      initial={{ scale: 0.92, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                      className="flex items-center gap-2.5 text-white text-3xl sm:text-4xl md:text-5xl tracking-tight mb-2"
                    >
                      <LuBookHeadphones size={40} className="text-white shrink-0 sm:w-12 sm:h-12" />
                      <span>
                        <span className="font-bold">Audiobook</span>
                        <span className="font-normal opacity-90">Player</span>
                      </span>
                    </motion.div>

                    {/* Subtítulo: 'Bem-vindo!' e descrição breve do app */}
                    <h2 className="text-xl sm:text-2xl font-semibold text-white/95 tracking-tight mt-1">
                      {t('welcome_subtitle_short')}
                    </h2>
                    <p className="text-sm sm:text-base text-white/70 mt-2 max-w-md leading-relaxed">
                      {t('welcome_app_description')}
                    </p>

                    {/* Opção de selecionar ou confirmar idioma (apenas 'Idioma' sem legenda) */}
                    <div className="w-full max-w-md mt-8 p-4 rounded-[26px] bg-white/[0.07] backdrop-blur-3xl border border-white/15 shadow-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0 text-left rtl:text-right">
                        <div className="w-10 h-10 rounded-full bg-winblue/20 text-winblue flex items-center justify-center shrink-0 border border-winblue/30">
                          <Globe size={20} />
                        </div>
                        <span className="text-sm font-semibold text-white truncate">
                          {t('settings_language')}
                        </span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={morphTriggerAnimate(activeSettingSelector?.id === 'app-language')}
                        transition={{ type: "spring", stiffness: 600, damping: 30 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeSettingSelector?.id === 'app-language') {
                            clearButtonCoverAnchorCache(e.currentTarget);
                            setActiveSettingSelector(null);
                            return;
                          }
                          closeAllPopups();
                          setActiveSettingSelector({
                            id: 'app-language',
                            triggerEl: e.currentTarget,
                            title: t('settings_language'),
                            subtitle: t('settings_language_sub'),
                            currentValue: appLanguage,
                            options: [
                              {
                                value: 'system',
                                label: t('lang_system_label'),
                                description: t('lang_system_desc', { lang: LANGUAGE_NATIVE_NAMES[getSystemLanguage()] }),
                                icon: <Monitor size={15} />,
                              },
                              { value: 'en', label: 'English', description: getLanguageDisplayName('en', resolvedLanguage), icon: <Globe size={15} /> },
                              { value: 'es', label: 'Español', description: getLanguageDisplayName('es', resolvedLanguage), icon: <Globe size={15} /> },
                              { value: 'pt', label: 'Português', description: getLanguageDisplayName('pt', resolvedLanguage), icon: <Globe size={15} /> },
                              { value: 'ru', label: 'Русский', description: getLanguageDisplayName('ru', resolvedLanguage), icon: <Globe size={15} /> },
                              { value: 'ar', label: 'العربية', description: getLanguageDisplayName('ar', resolvedLanguage), icon: <Globe size={15} /> },
                            ],
                            onSelect: (val) => setAppLanguage(val),
                          });
                        }}
                        className="h-9 pl-4 pr-3 rounded-full bg-white/12 hover:bg-white/20 backdrop-blur-3xl border border-white/20 hover:border-white/35 text-white flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-pointer"
                      >
                        <span>
                          {appLanguage === 'system'
                            ? `${t('lang_system_label')} (${LANGUAGE_NATIVE_NAMES[resolvedLanguage]})`
                            : LANGUAGE_NATIVE_NAMES[appLanguage as SupportedLanguage] || appLanguage}
                        </span>
                        <ChevronDown size={14} className="-mr-0.5 text-white/75" />
                      </motion.button>
                    </div>

                    {/* 2 Botões abaixo: Ir para o app (com ícone à esquerda) e Configurar agora (fundo claro/transparência) */}
                    <div className="w-full max-w-md mt-6 flex flex-col sm:flex-row items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={completeOnboarding}
                        className="w-full sm:flex-1 h-12 px-6 rounded-full bg-winblue/25 hover:bg-winblue/35 border border-winblue text-winblue font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(var(--winblue-rgb),0.25)] hover:shadow-[0_0_28px_rgba(var(--winblue-rgb),0.4)] backdrop-blur-3xl cursor-pointer"
                      >
                        <LuBookHeadphones size={18} className="shrink-0 text-winblue" />
                        <span>{t('go_to_app')}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          setActiveSettingSelector(null);
                          setOnboardingStep('settings');
                        }}
                        className="w-full sm:flex-1 h-12 px-6 rounded-full bg-white/10 hover:bg-white/18 backdrop-blur-3xl border border-white/20 hover:border-white/35 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
                      >
                        <SettingsIcon size={16} />
                        <span>{t('configure_now')}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  renderOnboardingSettings()
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP: SELETOR DE CONFIGURAÇÃO (Emergindo do botão e ocupando o espaço do botão) */}
      {activeSettingSelector && (
        <div 
          className="fixed inset-0 z-[9998] cursor-default" 
          {...getBackdropProps(() => {
            if (activeSettingSelector?.triggerEl) {
              clearButtonCoverAnchorCache(activeSettingSelector.triggerEl);
            }
            setActiveSettingSelector(null);
          })}
        />
      )}
      <AnimatePresence>
        {activeSettingSelector && (
          <MorphPopup anchor={activeSettingSelector.triggerEl}
            key={`setting-popup-${activeSettingSelector.id}`}
            style={(() => {
              if (!activeSettingSelector.triggerEl || typeof window === 'undefined') {
                return { position: 'fixed', zIndex: 9999, width: '210px' };
              }
              const width = activeSettingSelector.id === 'detect-new-files'
                ? 300
                : (activeSettingSelector.id === 'app-language' || activeSettingSelector.id === 'theme')
                  ? 228
                  : 210;
              const estimatedHeight = Math.min(320, activeSettingSelector.options.length * 44 + 16);
              return getButtonCoverPopupStyle(activeSettingSelector.triggerEl, width, estimatedHeight, 'right');
            })()}
            data-popup-content="true"
            onClick={(e) => e.stopPropagation()}
            className="bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl p-2 z-[9999] flex flex-col text-left rtl:text-right overflow-hidden text-[var(--text-main)]"
          >
            <div className="overflow-y-auto custom-scrollbar space-y-1 p-0.5 max-h-[320px]">
              {activeSettingSelector.options.map((option, idx) => {
                const isSelected = activeSettingSelector.currentValue === option.value;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (activeSettingSelector.triggerEl) {
                        clearButtonCoverAnchorCache(activeSettingSelector.triggerEl);
                      }
                      activeSettingSelector.onSelect(option.value);
                      setActiveSettingSelector(null);
                    }}
                    className={`relative w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-2xl select-none transition-all duration-150 border border-transparent group ${
                      isSelected
                        ? 'hover:bg-winblue/25 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)]'
                        : 'hover:bg-white/15 hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="setting-active-pill"
                        className="absolute inset-0 bg-winblue/15 border border-winblue rounded-2xl shadow-[0_0_10px_rgba(var(--winblue-rgb),0.2)] pointer-events-none z-0"
                        transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
                      />
                    )}
                    <div className={`relative z-10 flex items-center gap-2.5 transition-colors min-w-0 ${isSelected ? 'text-winblue font-bold' : 'text-[var(--text-main)] group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'}`}>
                      {option.icon ? (
                        <span className={`transition-colors shrink-0 ${isSelected ? 'text-winblue' : 'text-[var(--text-muted)] group-hover:text-white'}`}>
                          {option.icon}
                        </span>
                      ) : option.colorPreview ? (
                        <div 
                          className="w-4 h-4 rounded-full border border-black/10 dark:border-white/20 shrink-0 shadow-sm"
                          style={{ backgroundColor: option.colorPreview }}
                        />
                      ) : null}
                      <div className="flex flex-col text-left rtl:text-right min-w-0">
                        <span className="truncate">{option.label}</span>
                        {option.description && (
                          <span className={`text-xs font-normal mt-0.5 transition-colors ${isSelected ? 'text-winblue/80' : 'text-[var(--text-muted)] group-hover:text-white/80'}`}>
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <motion.div
                        layoutId="setting-active-check"
                        className="relative z-10 text-winblue shrink-0 ml-2"
                        transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
                      >
                        <BsCheck2 size={16} />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </MorphPopup>
        )}
      </AnimatePresence>



      {/* MODAL: CRÉDITOS */}
      <AnimatePresence>
        {showCreditsModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl"
            {...getBackdropProps(() => setShowCreditsModal(false))}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8, transition: { duration: 0.12 } }}
              transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
              data-popup-content="true"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card/90 backdrop-blur-3xl border border-[var(--text-main)]/10 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--text-main)]/5">
                <h3 className="text-lg font-bold text-[var(--text-main)]">{t('credits')}</h3>
                <button
                  onClick={() => setShowCreditsModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--button-secondary-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto custom-scrollbar space-y-4 pr-1 text-sm text-[var(--text-muted)]">
                <div>
                  <h4 className="font-bold text-[var(--text-main)] text-base">Audiobook Player</h4>
                  <p className="text-xs">{t('version_label', { ver: APP_VERSION })}</p>
                  <p className="text-xs mt-1">{t('designed_and_developed_by', { name: 'Nauan' })}</p>
                </div>
                <div className="border-t border-[var(--text-main)]/5 pt-3">
                  <h5 className="font-semibold text-[var(--text-main)] mb-2">{t('technologies_and_libraries')}</h5>
                  <ul className="space-y-1 text-xs list-disc list-inside">
                    <li><strong className="text-[var(--text-main)]">React 19</strong> & TypeScript</li>
                    <li><strong className="text-[var(--text-main)]">Tailwind CSS v4</strong> {t('credits_tailwind_desc')}</li>
                    <li><strong className="text-[var(--text-main)]">Motion</strong> {t('credits_motion_desc')}</li>
                    <li><strong className="text-[var(--text-main)]">Lucide Icons & React Icons</strong></li>
                    <li><strong className="text-[var(--text-main)]">Vite</strong> {t('credits_vite_desc')}</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-[var(--text-main)]/5 flex justify-end">
                <button
                  onClick={() => setShowCreditsModal(false)}
                  className="px-5 py-2 rounded-full bg-winblue text-white font-semibold text-xs hover:opacity-90 transition-all"
                >
                  {t('close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* POPUP DE COLEÇÕES PARA O AUTOR NO CABEÇALHO */}
      {showAuthorCollectionPopup && (
        <div 
          className="fixed inset-0 z-[9998] cursor-default" 
          {...getBackdropProps(() => { 
            setShowAuthorCollectionPopup(false); 
            setAuthorCollectionAnchor(null); 
          })}
        />
      )}
      <AnimatePresence>
        {showAuthorCollectionPopup && activeScreen.data?.id && (
          <MorphPopup anchor={authorCollectionAnchor || authorCollectionBtnRef.current} 
            key="header-author-collection-popup"
            style={getButtonCoverPopupStyle(authorCollectionAnchor || authorCollectionBtnRef.current, 260, 260, 'right')}
            data-popup-content="true"
            onClick={(e) => e.stopPropagation()}
            className="w-64 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[20px] shadow-2xl z-[9999] overflow-hidden"
          >
            <CollectionPickerPopupContent
              itemType="author"
              itemId={activeScreen.data.id}
              collections={collections}
              onToggleItem={handleToggleItemInCollection}
              onClose={() => {
                setShowAuthorCollectionPopup(false);
                setAuthorCollectionAnchor(null);
              }}
            />
          </MorphPopup>
        )}
      </AnimatePresence>

      {/* POPUP DE COLEÇÕES PARA O AUDIOBOOK NO CABEÇALHO */}
      {showBookCollectionPopup && (
        <div 
          className="fixed inset-0 z-[9998] cursor-default" 
          {...getBackdropProps(() => { 
            setShowBookCollectionPopup(false); 
            setBookCollectionAnchor(null); 
          })}
        />
      )}
      <AnimatePresence>
        {showBookCollectionPopup && (activeScreen.data || selectedBook)?.id && (
          <MorphPopup anchor={bookCollectionAnchor || bookCollectionBtnRef.current} 
            key="header-book-collection-popup"
            style={getButtonCoverPopupStyle(bookCollectionAnchor || bookCollectionBtnRef.current, 260, 260, 'right')}
            data-popup-content="true"
            onClick={(e) => e.stopPropagation()}
            className="w-64 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[20px] shadow-2xl z-[9999] overflow-hidden"
          >
            <CollectionPickerPopupContent
              itemType="book"
              itemId={(activeScreen.data || selectedBook).id}
              collections={collections}
              onToggleItem={handleToggleItemInCollection}
              onClose={() => {
                setShowBookCollectionPopup(false);
                setBookCollectionAnchor(null);
              }}
            />
          </MorphPopup>
        )}
      </AnimatePresence>

      {/* POPUP GLOBAL DE ORDENAÇÃO (TRANSFORMAÇÃO DO BOTÃO) */}
      {showSortMenu && (
        <div 
          className="fixed inset-0 z-[9998] cursor-default" 
          {...getBackdropProps(() => { 
            setShowSortMenu(false); 
            setSortBtnAnchor(null); 
          })}
        />
      )}
      <AnimatePresence>
        {showSortMenu && (
          <MorphPopup anchor={sortBtnAnchor || sortBtnRef.current} 
            key="global-sort-menu"
            style={getButtonCoverPopupStyle(sortBtnAnchor || sortBtnRef.current, 205, 228, 'right')}
            data-popup-content="true"
            onClick={(e) => e.stopPropagation()}
            className="w-52 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[20px] shadow-2xl z-[9999] p-1.5 flex flex-col text-left overflow-hidden"
          >
            {/* Título: Ordenar por (maiúsculas e minúsculas, sem linhas divisórias) */}
            <div className="px-3 pt-2 pb-1.5">
              <h3 className="text-sm font-bold text-[var(--text-main)]">{t('sort_by')}</h3>
            </div>

            {renderSortOptions()}
          </MorphPopup>
        )}
      </AnimatePresence>

      {/* Elemento de Áudio HTML5 Nativo */}
      <audio
        ref={audioRef}
        preload="auto"
        className="hidden"
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={handleAudioEnded}
        onError={(e) => {
          console.warn('Erro na reprodução nativa de áudio:', e);
          // O endereço temporário do áudio pode ter sido descartado (ex.: pelo sistema): recarrega o arquivo
          // guardado no aparelho e retoma do mesmo ponto (no máximo 2 tentativas por livro, sem ciclo)
          const bookId = currentBook?.id;
          if (!bookId || bookId === EMPTY_BOOK.id || !storedAudioBlobKeysRef.current.has(bookId)) return;
          const tries = audioRecoveryTriesRef.current.get(bookId) || 0;
          if (tries >= 2) return;
          audioRecoveryTriesRef.current.set(bookId, tries + 1);
          pendingSeekRef.current = currentTime;
          const oldUrl = audioUrlsRef.current.get(bookId);
          if (oldUrl?.startsWith('blob:')) { try { URL.revokeObjectURL(oldUrl); } catch {} }
          audioUrlsRef.current.delete(bookId);
          loadAudioForBook(bookId, true);
        }}
        onLoadedMetadata={() => {
          if (pendingSeekRef.current !== null && audioRef.current) {
            audioRef.current.currentTime = pendingSeekRef.current;
            pendingSeekRef.current = null;
          }
        }}
        onCanPlay={() => {
          if (pendingSeekRef.current !== null && audioRef.current) {
            audioRef.current.currentTime = pendingSeekRef.current;
            pendingSeekRef.current = null;
          }
          if (isPlaying && audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(err => {
              console.warn('Autoplay prevented:', err);
            });
          }
        }}
      />



      {/* Overlay Visual de Drag & Drop Global */}
      <AnimatePresence>
        {isDraggingFiles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none p-6"
          >
            <div className="p-8 rounded-3xl bg-card/90 border-2 border-dashed border-winblue flex flex-col items-center text-center max-w-md shadow-2xl">
              <Upload size={48} className="text-winblue mb-4 animate-bounce" />
              <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">{t('drop_audiobooks_title')}</h3>
              <p className="text-sm text-[var(--text-muted)]">{t('drop_audiobooks_desc')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        </div>
        {/* Imagem para compartilhar: aberta em tela cheia, com salvar e compartilhar embaixo */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {sharePreview && (
              <motion.div
                key="share-preview"
                data-popup-content="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: 60 }}
                // Arrastar para baixo fecha (como o player em tela cheia)
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.8 }}
                dragSnapToOrigin
                onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) closeSharePreview(); }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-[9600] bg-black/85 backdrop-blur-2xl flex flex-col items-center"
                style={{
                  paddingTop: 'max(16px, var(--safe-top))',
                  paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                  paddingLeft: 'max(16px, var(--safe-left))',
                  paddingRight: 'max(16px, var(--safe-right))',
                }}
              >
                <div className="w-full flex items-center shrink-0 h-11">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={closeSharePreview}
                    aria-label={t('back')}
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 border border-white/15 text-white backdrop-blur-3xl"
                  >
                    <ChevronLeft size={20} className="rtl:rotate-180" />
                  </motion.button>
                </div>
                <div className="flex-1 min-h-0 w-full flex items-center justify-center py-4">
                  <motion.img
                    initial={{ scale: 0.94, y: 12 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.6 }}
                    src={sharePreview.url}
                    alt=""
                    className="max-h-full max-w-full aspect-[9/16] rounded-[24px] object-contain shadow-2xl"
                  />
                </div>
                <div className="shrink-0 flex items-center justify-center gap-2.5 pb-1">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { if (shareBlobRef.current) downloadShareBlob(shareBlobRef.current, sharePreview.fileName); }}
                    className="h-10 px-4 rounded-full bg-white/10 border border-white/15 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap backdrop-blur-3xl"
                  >
                    <Download size={15} />
                    <span>{t('save_image')}</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={async () => {
                      if (!shareBlobRef.current) return;
                      const result = await shareStoryBlob(shareBlobRef.current, sharePreview.fileName, sharePreview.title);
                      if (result === 'downloaded') showToast(t('image_saved'));
                    }}
                    className="h-10 px-5 rounded-full bg-winblue/25 border border-winblue/50 text-winblue text-[13px] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Share size={15} />
                    <span>{t('share')}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Confirmações no celular: cartão na base da tela */}
        <AnimatePresence>
          {mobileConfirm && (
            <MobileConfirmCard key="app-mobile-confirm" onClose={() => setMobileConfirm(null)}>
              <div className="flex flex-col p-4 text-left rtl:text-right">
                <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1.5">{mobileConfirm.title}</h4>
                {mobileConfirm.description && <p className="text-xs text-[var(--text-muted)] px-1 mb-4 line-clamp-4">{mobileConfirm.description}</p>}
                {mobileConfirm.preview && <div className="mb-4">{mobileConfirm.preview}</div>}
                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); const c = mobileConfirm; setMobileConfirm(null); c.onConfirm(); }}
                    className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md text-red-500 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>{mobileConfirm.confirmLabel}</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); setMobileConfirm(null); }}
                    className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] font-semibold text-xs flex items-center gap-1.5"
                  >
                    <X size={13} />
                    <span>{t('cancel')}</span>
                  </motion.button>
                </div>
              </div>
            </MobileConfirmCard>
          )}
        </AnimatePresence>

        {/* Folha estilo iOS (fora da tela que recua) */}
        {(() => {
          const content = renderMobileSheetContent();
          return (
            <MobileSheet
              open={Boolean(mobileSheet && content)}
              title={content?.title || ''}
              onClose={() => {
                setMobileSheet(null);
              }}
              closeLabel={t('back')}
              footer={content?.footer}
            >
              {content?.body}
            </MobileSheet>
          );
        })()}
      </CollectionsContext.Provider>
    </I18nContext.Provider>
  );
}


export { CollectionPickerPopupContent, CollectionItemsPickerContent, CollectionsContext, useCollections } from './components/LibraryCards';