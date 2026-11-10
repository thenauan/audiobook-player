import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect, useSyncExternalStore, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X, Search, Settings as SettingsIcon, ChevronLeft, Trash2, CheckCircle2, Power, Languages } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { BsCheck2 } from 'react-icons/bs';
import { AppLogo } from './components/AppLogo';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { Audiobook, Author, Chapter, TranscriptLine, AUTHORS_DATABASE, BOOKS_DATABASE, INITIAL_COLLECTIONS, GENRE_HIERARCHY, getGenreEmoji, resolveNarratorAndLanguage, isBookInGenre, Collection, COLLECTION_AVAILABLE_EMOJIS, COLLECTION_AVAILABLE_PALETTES } from './data/catalog';
import { parseAudioMetadata } from './audio/audioMetadata';
import { parseSynchronizedTextFile } from './audio/transcripts';
import { getGenericBookCover, getAuthorAvatar, getEffectiveAuthorAvatar, getGenericCoverColor, getGenericAuthorColor, getBookHighlightTheme, hexToHsl, hslToHex } from './lib/coverArt';
import { findActiveTranscriptIndex } from './audio/playbackTiming';
import { storeAudioBlobChunked, ImportCanceledError, getAudioBlob, deleteAudioBlob, getAllAudioBlobKeys } from './audio/audioStorage';
import { importStore, visibleImports } from './lib/importProgress';
import { ImportCancelAllButton, ImportCancelAllConfirm, ImportList } from './components/library/ImportProgress';
import { autoCropImageToSquare, autoCropImageToEbookCover } from './lib/imageProcessing';
import Sidebar, { MobileBottomBar, tabBarStore } from './components/Sidebar';
import { MenuOptionItem, clearButtonCoverAnchorCache, getButtonCoverPopupStyle, MorphPopup, morphTriggerAnimate, EMPTY_BOOK } from './components/popups/Popovers';
import MiniPlayer, { MobileMiniPlayer } from './components/player/MiniPlayer';
import FullscreenPlayer from './components/player/FullscreenPlayer';
import { useIsMobile, useIsTouchDevice, useIsCompactPlayer, useIsLandscapePhone } from './components/popups/MobileContextMenu';
import { MobileSheet } from './components/popups/MobileSheet';
import { desktop, IS_INSTALLED_APP, IS_APPLE_TOUCH } from './lib/desktopBridge';
import { ScreenErrorBoundary } from './components/ScreenErrorBoundary';
import { APP_VERSION } from './version';
import { getNotificationPermission, notifySystem, requestNotificationPermission, showSystemNotification } from './lib/systemNotifications';
import { shareOrDownload as shareStoryBlob, downloadBlob as downloadShareBlob } from './lib/shareStory';
import { MobileConfirmCard } from './components/popups/MobileConfirm';
import { installTapBounce } from './components/tapBounce';
import { getSystemInfo } from './lib/liteMode';
import { WhatsNewScreen } from './components/WhatsNewScreen';
import { visibleChapters } from './audio/chapterPrefs';
import { diag } from './audio/playbackDiag';
import { splitAuthorNames, bookHasAuthor, getBookAuthorNames, renameAuthorInField } from './lib/authorUtils';
import { installTouchMenus } from './components/popups/touchMenu';
import { installScrollFades } from './components/scrollFade';
import ZoomTransitionLayer, { requestZoomClose, canZoomCloseTo, getZoomReturnRect } from './components/ZoomTransitionLayer';
const loadImageCropperSquare = () => import('./components/ImageCropperSquare');
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
export const ImageCropperSquare = imageCropperLazy.Component;
export const HelpCenterView = helpCenterLazy.Component;
const DevToolsModal = React.lazy(() => import('./views/DevToolsModal'));
export const SettingsView = settingsLazy.Component;

// Ajustes, Ajuda e o recorte de imagem só são baixados ao abrir: o app abre o mais rápido possível
import type { HelpTheme } from './data/helpData';
import { getGenreName, getSubgenreName } from './i18n/genreTranslations';
import { getNationalityDisplayName } from './i18n/nationalityTranslations';
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
} from './i18n/translations';
import { Share, Download, Quote, Info, Edit3, Upload, ChevronRight, ChevronDown, Check, Star, RotateCcw, RefreshCw, Bookmark, ArrowUpDown, Code2, Globe, Turtle, Rabbit, Clock3, Clock6, Clock9, Clock12, Dog, Bird, FolderPlus, Plus, Monitor } from 'lucide-react';
import { normalizeSearchStr } from './lib/searchScoring';
import { getBackdropProps, useCloseOnOutsideScrollOrDrag } from './components/popups/popupUtils';
import { _FavoriteChapterCard, CollectionsContext, CollectionItemsPickerContent, CollectionPickerPopupContent, _FavoriteAuthorCard, ScreenSelectableRow, SCREEN_GROUP_CLASS, PopupSearchField } from './components/library/LibraryCards';
import { MOCK_DEV_AUTHORS, MOCK_DEV_AUDIOBOOKS, normalizeBookCompareStr, extractNormalizedFileName, isSameAudiobook, deduplicateAudiobooks, isTestBookId, isTestAuthorId, TEST_COLLECTION_IDS } from './data/libraryData';
import { isSyncTextFile, syncTextStem } from './audio/transcripts';
import { extractCoverPalette } from './lib/coverArt';
import { slimQueueForStorage } from './audio/queueUtils';
import { cancelLyricCentering, centerLyricLine } from './components/player/lyricScroll';
import { SPRING, FADE_IN, FADE_OUT } from './lib/motion';
import { ACCENT_COLORS } from './lib/accentColors';
import { EmojiIcon } from './components/EmojiIcon';
import { canSendSuggestion, crossedBookMilestone, getSentSuggestions, markSuggestionSent, markSuggestionTime, pickContentSuggestion, takeWeeklySeconds } from './lib/contentNotifications';
import { AmbientBackground } from './components/AmbientBackground';
import { AppScopeContext, type AppScope } from './app/AppScope';
import { OtherAppsScreen } from './views/screens/OtherAppsScreen';
import { MoreScreen } from './views/screens/MoreScreen';
import { AppInfoScreen } from './views/screens/AppInfoScreen';
import { BookInfoScreen } from './views/screens/BookInfoScreen';
import { SearchScreen } from './views/screens/SearchScreen';
import { HomeScreen } from './views/screens/HomeScreen';
import { LibraryScreen } from './views/screens/LibraryScreen';
import { LibraryListsScreen } from './views/screens/LibraryListsScreen';
import { CollectionEditorScreen } from './views/screens/CollectionEditorScreen';
import { BookDetailScreen } from './views/screens/BookDetailScreen';
import { BookSynopsisScreen } from './views/screens/BookSynopsisScreen';
import { AuthorDetailScreen } from './views/screens/AuthorDetailScreen';
import { SettingsOptionScreen } from './views/screens/SettingsOptionScreen';
import { SettingsScreen } from './views/screens/SettingsScreen';
import { HelpScreen } from './views/screens/HelpScreen';
import { SearchResultsList } from './views/screens/SearchResultsList';
import { HeaderActions } from './components/HeaderActions';
import { PlaybackReturnButton } from './components/player/PlaybackReturnButton';
import { OnboardingSettings } from './components/OnboardingSettings';
import { BookDetailsContent } from './components/BookDetailsContent';
import { SortOptions } from './components/library/SortOptions';
import { usePersistentState } from './app/usePersistentState';
import { useCollectionForm } from './app/useCollectionForm';
import { useCollectionsStore } from './app/useCollectionsStore';
import { useEditorForms } from './app/useEditorForms';
import { useLibraryStore } from './app/useLibraryStore';
import { useLibraryViews } from './app/useLibraryViews';
import { usePlaybackEngine } from './app/usePlaybackEngine';

export const getSpeedIcon = (s: number) => {
  if (s < 1) return <Turtle size={14} className="shrink-0" />;
  if (s === 1) return <Dog size={14} className="shrink-0" />;
  if (s < 2) return <Rabbit size={14} className="shrink-0" />;
  return <Bird size={14} className="shrink-0" />;
};

export const getSleepTimerIcon = (mins: number) => {
  if (mins <= 15) return <Clock3 size={14} className="shrink-0" />;
  if (mins <= 30) return <Clock6 size={14} className="shrink-0" />;
  if (mins <= 45) return <Clock9 size={14} className="shrink-0" />;
  if (mins <= 60) return <Clock12 size={14} className="shrink-0" />;
  if (mins <= 90) return <Clock6 size={14} className="shrink-0" />;
  return <Clock12 size={14} className="shrink-0" />;
};

export type ScreenState = {
  id: string; // 'home', 'search', 'library', 'history', 'settings', 'help', 'book-detail', 'author-detail', 'genre-detail', etc.
  data?: any; // The book or author object
  scrollTop?: number; // Rolagem da tela ao sair dela (restaurada ao voltar)
};


// iPhone/iPad em chave própria: versões anteriores gravaram 85% lá, o que ligaria o processamento de áudio sem pedir
export const VOLUME_KEY = IS_APPLE_TOUCH ? 'app_volume_ios' : 'app_volume';

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
const IOS_NAV = SPRING.snappy;
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
export const transicaoConteudo: any = {
  get escondido() {
    if (!isMobileNav()) return { opacity: 0, scale: 1, y: 4, x: 0 };
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
        transition: { y: SPRING.press, opacity: FADE_IN },
      };
    }
    if (navDirection === 'tab') return { opacity: 1, x: 0, scale: 1, y: 0, transition: FADE_IN };
    if (navDirection === 'instant') return { opacity: 1, x: 0, scale: 1, y: 0, transition: { duration: 0 } };
    return { opacity: 1, x: 0, scale: 1, y: 0, transition: { x: IOS_NAV, opacity: FADE_IN } };
  },
  get saindo() {
    if (!isMobileNav()) return { opacity: 0, scale: 1, y: 0, transition: { duration: 0.08 } };
    if (navDirection === 'push') return { ...exitOverlay(), x: '-30%', opacity: 0, zIndex: 1, transition: { ...OVERLAY_T, x: IOS_NAV, opacity: FADE_IN } };
    if (navDirection === 'pop') return { ...exitOverlay(), x: '100%', opacity: 0, zIndex: 2, transition: { ...OVERLAY_T, x: IOS_NAV, opacity: FADE_IN } };
    if (navDirection === 'popSwipe') {
      // Continua de onde o dedo soltou até sair pela direita
      const w = swipeAreaWidth || window.innerWidth;
      return { ...exitOverlay(), x: [swipeOffsetPx, w], opacity: 0, zIndex: 2, transition: { ...OVERLAY_T, x: SPRING.snappy, opacity: FADE_IN } };
    }
    if (navDirection === 'instant') return { ...exitOverlay(), opacity: 0, transition: { ...OVERLAY_T, opacity: { duration: 0 } } };
    // Troca de aba / volta para a capa: a tela que sai sai do fluxo na hora (a nova não é empurrada para baixo)
    return { ...exitOverlay(), opacity: 0, transition: { ...OVERLAY_T, opacity: FADE_OUT } };
  },
};


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

export function getLanguageData(lang: string, currentLang: AppLanguage = 'pt') {
  const canonical = normalizeAudiobookLanguage(lang) || lang;
  const entry = findRecognizedLanguageEntry(canonical);
  const resolved = currentLang === 'system' ? getSystemLanguage() : currentLang;
  return {
    name: getLanguageCardName(canonical, resolved),
    gradient: entry ? entry.gradient : 'from-purple-600 via-violet-600 to-indigo-800',
  };
}

// Tipos usados pelo App e pelas telas extraídas
export type SortOption = 'name-asc' | 'name-desc' | 'year-desc' | 'year-asc' | 'duration-desc' | 'duration-asc';

export type StatusFilter = 'all' | 'in-progress' | 'completed' | 'unstarted' | 'favorites';

export type DetectNewFilesMode = 'manual' | 'startup' | 'folder-select';

// =========================================================================
// SISTEMA INTELIGENTE DE ESTATÍSTICAS E PADRÃO DE USO DO USUÁRIO
// =========================================================================
export interface UserListeningStats {
  bookSeconds: Record<string, number>;
  genreSeconds: Record<string, number>;
  authorSeconds: Record<string, number>;
  bookPlayCount: Record<string, number>;
  bookLastPlayed: Record<string, number>;
  totalSeconds: number;
}

// ===== Folhas (sheets) do celular/tablet: adicionar à coleção e marcações =====
export type MobileSheetState =
  | { kind: 'collection-picker'; itemType: 'book' | 'author'; itemId: string }
  | { kind: 'collection-add-items'; collectionId: string }
  | { kind: 'bookmarks'; bookId: string; chapterId: any }
  | { kind: 'book-bookmarks'; bookId: string }
  | { kind: 'share-lyrics'; bookId: string }
  | { kind: 'collection-form-items'; mode: 'authors' | 'books' }
  | { kind: 'import-progress' };

export interface HomeSection {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  books: Audiobook[];
}

export interface AllBooksNavGroup {
  id: string;
  title: string;
  navLabel: string;
  books: Audiobook[];
}

export type SearchItem = {
  id: string;
  type: 'book' | 'author' | 'chapter' | 'bookmark' | 'collection';
  chapter?: Chapter;
  bookmark?: { id: string; text: string; timestamp?: number };
  collection?: Collection;
  tier: number;
  fieldPriority: number;
  subScore: number;
  score: number;
  title: string;
  book?: Audiobook;
  author?: Author;
};

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
  const { authors, books, booksRef, isLibraryDataHydrated, persistLibraryData, scheduleWrite, setAuthors, setBooks, setIsLibraryDataHydrated, showExtraChapters } = useLibraryStore();

  // Estados de edição de Audiobook
  const { authorCropImage, bookCropImage, editAuthorBio, editAuthorColor, editAuthorName, editAuthorNationality, editAuthorPicture, editBookAuthor, editBookCategory, editBookChapters, editBookCover, editBookDescription, editBookLanguage, editBookNarrator, editBookSubgenre, editBookTitle, editBookTranscript, editBookTranscriptFileName, editBookTranscriptSource, editCoverColor, isEditingAuthor, isEditingBook, setAuthorCropImage, setBookCropImage, setEditAuthorBio, setEditAuthorColor, setEditAuthorName, setEditAuthorNationality, setEditAuthorPicture, setEditBookAuthor, setEditBookCategory, setEditBookChapters, setEditBookCover, setEditBookDescription, setEditBookLanguage, setEditBookNarrator, setEditBookSubgenre, setEditBookTitle, setEditBookTranscript, setEditBookTranscriptFileName, setEditBookTranscriptSource, setEditCoverColor, setIsEditingAuthor, setIsEditingBook } = useEditorForms();

  // Estados de Coleções Personalizadas
  const { collections, setCollections } = useCollectionsStore({ isLibraryDataHydrated, persistLibraryData, setAuthors, setBooks, setIsLibraryDataHydrated });

  const { colFormDesc, colFormEmoji, colFormName, colFormPalette, colSelectedAuthorIds, colSelectedBookIds, editingCollectionId, selectedCollectionIds, setColFormDesc, setColFormEmoji, setColFormName, setColFormPalette, setColSelectedAuthorIds, setColSelectedBookIds, setEditingCollectionId, setSelectedCollectionIds } = useCollectionForm();

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
  const recoverAudioRef = useRef<(reason: string) => boolean>(() => false);
  const durationFixedBooksRef = useRef<Set<string>>(new Set());
  const durationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyBookDurationRef = useRef<(audio: HTMLAudioElement) => void>(() => {});
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

  // Pede ao sistema para não apagar os áudios guardados no aparelho quando faltar espaço
  useEffect(() => {
    try { navigator.storage?.persist?.().catch(() => {}); } catch {}
  }, []);

  // iPhone/iPad (Safari 17+): sessão de áudio do tipo "reprodução", que continua tocando em segundo plano
  useEffect(() => {
    try {
      const session = (navigator as any).audioSession;
      if (session && session.type !== 'playback') session.type = 'playback';
    } catch {}
  }, []);

  // Web Audio API Setup
  const setupWebAudioGraph = useCallback((forVolume = false) => {
    // iPhone/iPad: o áudio toca direto, sem o Web Audio, e só passa por ele quando o volume do app fica abaixo de
    // 100% (o sistema não deixa mudar o volume de outro jeito). Lá o processamento pode ficar "interrompido" depois
    // de uma pausa ou de outro app tocar som, e o que se ouve pode se desencontrar do tempo informado pelo áudio.
    if (IS_APPLE_TOUCH && !forVolume && volumeRef.current >= 1) return;
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
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
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
      // Arquivo de verdade: um endereço "data:" com a biblioteca inteira falha em bibliotecas grandes
      const backupUrl = URL.createObjectURL(new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' }));
      setTimeout(() => URL.revokeObjectURL(backupUrl), 60000);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', backupUrl);
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
  // Pulos (posição salva e os feitos pela pessoa): CONFERIDOS depois de aplicados. O iPhone às vezes ignora o
  // pulo em áudio guardado no aparelho e volta para outro ponto, e logo depois do pulo o áudio só repete o
  // valor pedido; por isso a conferência só termina quando o áudio já andou a partir do ponto certo. Enquanto
  // ela está ativa, o pulo é repetido e o tempo errado não é aceito nem gravado.
  const seekVerifyRef = useRef<{ target: number; at: number; tries: number; lastTry: number } | null>(null);
  // Arquivo carregado no elemento de áudio (sem o "#t=" do início) e quando isso aconteceu
  const loadedSrcRef = useRef<string | null>(null);
  const lastSrcSetAtRef = useRef(0);
  const noFragmentRef = useRef(false);
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
    return visibleChapters(book.chapters, showExtraChapters).every(c => completedChapters.includes(`${book.id}-${c.id}`));
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

    return () => { isMounted = false; };
    // Só ao abrir. Esta função muda junto com a fila: com ela nas dependências, cada mudança na fila ou na
    // biblioteca repetia o efeito e a limpeza apagava o endereço do áudio que estava tocando
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Libera a memória dos áudios só ao fechar
  useEffect(() => () => {
    audioUrlsRef.current.forEach(url => {
      if (url && url.startsWith('blob:')) {
        try { URL.revokeObjectURL(url); } catch {}
      }
    });
    audioUrlsRef.current.clear();
  }, []);

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

  const [themeMode, setThemeMode] = usePersistentState<'dark'|'light'|'system'>('app_theme_mode', () => {
    return (localStorage.getItem('app_theme_mode') as 'dark'|'light'|'system') || 'dark';
  }, (v) => v);

  // Paleta de Cores de Destaque

  // Ajustes: Interface
  const [accentColor, setAccentColor] = useState<string>(() => {
    const saved = localStorage.getItem('app_accent_color');
    // O azul era o padrão e ficava gravado sem ninguém escolher: passa uma vez para o novo padrão
    if (!localStorage.getItem('app_accent_v2')) {
      localStorage.setItem('app_accent_v2', '1');
      if (saved === 'blue') return 'orange';
    }
    return saved || 'orange';
  });
  const _currentAccentHex = ACCENT_COLORS[accentColor]?.hex || ACCENT_COLORS.orange.hex;
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

  // Textos da Ajuda: baixados só quando a Ajuda é aberta (não pesam na abertura do app)
  const [helpThemes, setHelpThemes] = useState<HelpTheme[]>([]);
  const needsHelpThemes = activeScreen.id.startsWith('help') || activeScreen.id === 'settings-atalhos';
  useEffect(() => {
    if (!needsHelpThemes) return;
    let alive = true;
    import('./i18n/helpTranslations').then(m => { if (alive) setHelpThemes(m.getHelpThemes(resolvedLanguage)); });
    return () => { alive = false; };
  }, [needsHelpThemes, resolvedLanguage]);

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
    // Texto sincronizado ao lado do áudio, com o mesmo nome (ex.: "Livro.mp3" + "Livro.sync.json", como o
    // Audiobook Generator salva): vira a letra do audiobook. O .sync.json tem frases E palavras, enquanto a
    // letra gravada dentro do áudio só tem as frases.
    const syncTextFiles = rawFiles.filter(f => !isAudio(f) && isSyncTextFile(f.name));
    const nonAudioFiles = rawFiles.filter(f => !isAudio(f) && !isSyncTextFile(f.name));
    const pickSyncText = async (stem: string, duration: number): Promise<{ lines: TranscriptLine[]; fileName: string } | null> => {
      const candidates = syncTextFiles.filter(f => syncTextStem(f.name) === stem);
      let best: { lines: TranscriptLine[]; fileName: string; words: number } | null = null;
      for (const f of candidates) {
        const res = await parseSynchronizedTextFile(f, duration || undefined);
        if (!res.ok || res.lines.length === 0) continue;
        const words = res.lines.reduce((n, l) => n + (l.words?.length || 0), 0);
        if (!best || words > best.words) best = { lines: res.lines, fileName: f.name, words };
      }
      return best;
    };

    // Só textos (sem áudio): cada um vai para o audiobook da biblioteca com o mesmo nome de arquivo
    if (audioFiles.length === 0 && syncTextFiles.length > 0) {
      const updates = new Map<string, { lines: TranscriptLine[]; fileName: string }>();
      for (const b of booksRef.current) {
        const stem = syncTextStem(b.fileName || b.filePath || '');
        if (!stem) continue;
        const dur = (b.chapters || []).reduce((acc, c) => acc + (c.duration || 0), 0);
        const found = await pickSyncText(stem, dur);
        if (found) updates.set(b.id, found);
      }
      if (updates.size === 0) {
        showToast(t('toast_sync_text_no_match'));
        return;
      }
      const apply = (b: Audiobook): Audiobook => {
        const u = updates.get(b.id);
        return u ? { ...b, transcript: u.lines, transcriptSource: 'upload', transcriptFileName: u.fileName } : b;
      };
      setBooks(prev => prev.map(apply));
      setCurrentBook(prev => apply(prev));
      setSelectedBook(prev => (prev ? apply(prev) : prev));
      showToast(t('toast_sync_text_attached', { count: updates.size }));
      return;
    }

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

    // Avisos: escolhido agora, carregando (se demorar) e adicionado no fim. No celular, a lista com o progresso
    // de cada um fica no botão da biblioteca
    const importIds = importStore.begin(files);
    showToast(t('toast_import_selected', { count: files.length }));
    const loadingToast = setTimeout(() => {
      if (importIds.some(id => !importStore.isCanceled(id))) showToast(t('toast_import_loading', { count: files.length }));
    }, 1300);

    const importedBooks: Audiobook[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const importId = importIds[i];
      if (importStore.isCanceled(importId)) continue;
      importStore.update(importId, { status: 'loading', progress: 0.02 });
      try {
        const meta = await parseAudioMetadata(file);
        if (importStore.isCanceled(importId)) continue;
        // Capa, título e autor aparecem na lista assim que são lidos
        importStore.update(importId, {
          progress: 0.06,
          title: meta.title || undefined,
          author: meta.author && meta.author !== 'Autor Desconhecido' ? meta.author : undefined,
          cover: meta.cover || undefined,
        });

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
          importStore.remove(importId);
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
        // Cancelado no meio: nada fica guardado nem na biblioteca
        const dropCanceled = () => {
          try { URL.revokeObjectURL(objectUrl); } catch {}
          audioUrlsRef.current.delete(bookId);
          storedAudioBlobKeysRef.current.delete(bookId);
        };
        try {
          await storeAudioBlobChunked(bookId, file, (f) => importStore.update(importId, { progress: 0.06 + f * 0.92 }), () => importStore.isCanceled(importId));
        } catch (err) {
          if (err instanceof ImportCanceledError) { dropCanceled(); continue; }
          throw err;
        }
        if (importStore.isCanceled(importId)) { dropCanceled(); deleteAudioBlob(bookId); continue; }

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

        let metaTranscript = Array.isArray(meta.transcript) ? meta.transcript : [];
        let transcriptFromFile: string | undefined;
        const sidecar = syncTextFiles.length > 0
          ? await pickSyncText(syncTextStem(file.name), meta.chapters.reduce((acc, c) => acc + (c.duration || 0), 0))
          : null;
        if (sidecar) {
          metaTranscript = sidecar.lines;
          transcriptFromFile = sidecar.fileName;
        }
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
          transcriptSource: transcriptFromFile ? 'upload' : metaTranscript.length > 0 ? 'metadata' : undefined,
          ...(transcriptFromFile ? { transcriptFileName: transcriptFromFile } : {}),
          description: meta.description || '',
          language: meta.language,
          audioUrl: objectUrl,
          filePath: realDiskPath,
          fileName: file.name,
          addedDate: now + (rawFiles.length - i)
        };
        if (importStore.isCanceled(importId)) { dropCanceled(); deleteAudioBlob(bookId); continue; }
        importedBooks.push(newBook);
        importStore.update(importId, { status: 'done', progress: 1 });
      } catch (err) {
        console.error('Erro ao ler metadados do audiobook:', err);
        importStore.remove(importId);
      }
    }
    clearTimeout(loadingToast);
    const canceledCount = importIds.filter(id => importStore.isCanceled(id)).length;
    importStore.finish(importIds);
    if (importedBooks.length === 0 && canceledCount > 0) {
      showToast(t('toast_import_canceled', { count: canceledCount }));
      return;
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
      notifySystem('app_notify_added', t('settings_notif_added'), t('toast_books_added_success', { count: importedBooks.length }));
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
  const [libraryFolder, setLibraryFolder] = usePersistentState<string>('app_library_folder', () => {
    const saved = localStorage.getItem('app_library_folder');
    if (!saved || saved.startsWith('D:\\') || saved.startsWith('D:/')) {
      return 'C:\\Audiobooks';
    }
    return saved;
  }, (v) => v);
  const [detectNewFiles, setDetectNewFiles] = usePersistentState<DetectNewFilesMode>('app_detect_files', () => {
    const saved = localStorage.getItem('app_detect_files');
    if (saved === 'manual' || saved === 'startup' || saved === 'folder-select') {
      return saved;
    }
    if (saved === 'false') return 'manual';
    return 'folder-select';
  }, (v) => String(v));
  const [checkOnStartup, setCheckOnStartup] = usePersistentState<boolean>('app_check_startup', () => localStorage.getItem('app_check_startup') !== 'false', (v) => String(v));

  // Ajustes: Reprodução
  const [defaultPlaybackSpeed, setDefaultPlaybackSpeed] = usePersistentState<number>('app_default_speed', () => Number(localStorage.getItem('app_default_speed')) || 1.0, (v) => String(v));
  const [seekForwardTime, setSeekForwardTime] = usePersistentState<number>('app_seek_forward', () => Number(localStorage.getItem('app_seek_forward')) || 30, (v) => String(v));
  const [seekBackwardTime, setSeekBackwardTime] = usePersistentState<number>('app_seek_backward', () => Number(localStorage.getItem('app_seek_backward')) || 30, (v) => String(v));
  const [resumePlayback, setResumePlayback] = useState<boolean>(() => localStorage.getItem('app_resume_playback') !== 'false');
  const [autoShowText, setAutoShowText] = usePersistentState<boolean>('app_auto_show_text', () => localStorage.getItem('app_auto_show_text') !== 'false', (v) => String(v));

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

  // Diagnóstico: o que foi restaurado ao abrir o app
  useEffect(() => {
    let saved: unknown = null;
    try { saved = JSON.parse(localStorage.getItem('audiobook_playback_positions') || '{}')[localStorage.getItem('app_last_played_book_id') || '']; } catch {}
    diag('abriu', {
      livro: localStorage.getItem('app_last_played_book_id'),
      tempoSalvo: Number(localStorage.getItem('app_last_played_time')),
      posicaoDoLivro: typeof saved === 'number' ? saved : null,
      estado: currentTimeRef.current,
      pendente: pendingSeekRef.current,
      livroAtual: currentBook?.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const [notificationsEnabled, setNotificationsEnabled] = usePersistentState<boolean>('app_notifications_enabled', () => localStorage.getItem('app_notifications_enabled') !== 'false', (v) => String(v));
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission);
  // Ligada só com a permissão do sistema (sem suporte, a chave continua valendo para os avisos dentro do app)
  const notificationsOn = notificationsEnabled && !['default', 'denied'].includes(notificationPermission);
  const toggleNotifications = async (enabled: boolean) => {
    if (!enabled) { setNotificationsEnabled(false); return; }
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    if (permission === 'denied') { showToast(t('toast_notif_blocked')); return; }
    if (permission === 'default') return;
    setNotificationsEnabled(true);
    if (permission === 'unsupported') showToast(t('toast_notif_unsupported'));
    else showSystemNotification(t('settings_notif_enabled'), t('notif_enabled_body'));
  };
  const [notifyChapterCompleted, setNotifyChapterCompleted] = usePersistentState<boolean>('app_notify_chapter', () => localStorage.getItem('app_notify_chapter') !== 'false', (v) => String(v));
  const [notifyBookCompleted, setNotifyBookCompleted] = usePersistentState<boolean>('app_notify_book', () => localStorage.getItem('app_notify_book') !== 'false', (v) => String(v));
  const [notifyContent, setNotifyContent] = usePersistentState<boolean>('app_notify_content', () => localStorage.getItem('app_notify_content') === 'true', (v) => String(v));
  const [notifyBookAdded, setNotifyBookAdded] = usePersistentState<boolean>('app_notify_added', () => localStorage.getItem('app_notify_added') !== 'false', (v) => String(v));

  // Ajustes: Sistema
  const [dataFolder, setDataFolder] = usePersistentState<string>('app_data_folder', () => localStorage.getItem('app_data_folder') || '%APPDATA%\\AudiobookPlayer', (v) => v);
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
    showToast('[Dev] Notificação 1: Temporizador de sono ativo (30 min)');
    setTimeout(() => {
      showToast('[Dev] Notificação 2: Audiobook "Duna" adicionado à fila');
    }, 1500);
  };

  const handleSimulateDevError = () => {
    setIsDevModeActive(true);
    try {
      localStorage.setItem('app_dev_mode', 'true');
    } catch {}
    setSearchQuery('');
    showToast('[Dev] Erro simulado: Falha ao decodificar arquivo de áudio.');
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
  const openMobileSheetRef = useRef<(sheet: any) => void>(() => {});
  useEffect(() => {
    const onOpenBookBookmarks = (e: Event) => openMobileSheetRef.current({ kind: 'book-bookmarks', bookId: (e as CustomEvent).detail });
    window.addEventListener('open-book-bookmarks', onOpenBookBookmarks);
    return () => window.removeEventListener('open-book-bookmarks', onOpenBookBookmarks);
  }, []);
  useEffect(() => {
    const onOpenAppInfo = (e: Event) => navigateToRef.current('app-info', (e as CustomEvent).detail);
    window.addEventListener('open-app-info', onOpenAppInfo);
    return () => window.removeEventListener('open-app-info', onOpenAppInfo);
  }, []);

  // Card (capa, foto ou coleção) de onde a tela atual foi aberta, se ele está na tela anterior
  const getZoomBackKey = (): string | null => {
    if (historyStack.length === 0) return null;
    const prev = historyStack[historyStack.length - 1];
    const key = activeScreen.id === 'book-detail'
      ? `book-${(activeScreen.data || selectedBook)?.id}`
      : activeScreen.id === 'author-detail' ? `author-${activeScreen.data?.id}`
      : activeScreen.id.startsWith('library-colecao-') ? `collection-${activeScreen.id.replace('library-colecao-', '')}`
      : null;
    return key && canZoomCloseTo(key, getScreenKey(prev)) ? key : null;
  };
  const getZoomBackKeyRef = useRef(getZoomBackKey);
  getZoomBackKeyRef.current = getZoomBackKey;

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
      const zoomKey = getZoomBackKey();
      if (zoomKey) {
        setSidebarHighlightHold({ value: sidebarHighlight });
        const swipe = zoomSwipeRef.current;
        if (swipe && Date.now() - swipe.at < 1500) {
          // Gesto da borda: a página já encolheu pelo dedo; a camada continua dali até o card e a tela
          // anterior aparece na hora por baixo
          zoomSwipeRef.current = null;
          setNavDirection('instant');
          requestZoomClose(zoomKey, swipe.from);
        } else {
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
  // Começa na velocidade padrão definida em Ajustes
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(defaultPlaybackSpeed);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(() => {
    const standard = IS_APPLE_TOUCH ? 1 : 0.85;
    try {
      const saved = localStorage.getItem(VOLUME_KEY);
      const parsed = saved === null ? NaN : Number(saved);
      return isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : standard;
    } catch { return standard; }
  });

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
  const completedChaptersRef = useRef(completedChapters);
  completedChaptersRef.current = completedChapters;
  // Último ponto ouvido (para saber se o fim do capítulo foi alcançado ouvindo, e não pulando)
  const lastHeardRef = useRef<{ bookId: string; time: number } | null>(null);
  const checkChapterFinished = (bookId: string, time: number) => {
    const prev = lastHeardRef.current;
    lastHeardRef.current = { bookId, time };
    if (!prev || prev.bookId !== bookId || time <= prev.time || time - prev.time > 4) return;
    const book = currentBook;
    if (!book || book.id !== bookId) return;
    const milestone = crossedBookMilestone(prev.time, time, (book.chapters || []).reduce((sum, c) => sum + (c.duration || 0), 0));
    if (milestone && notifyContent && !getSentSuggestions().includes(`${milestone}:${book.id}`)) {
      markSuggestionSent(`${milestone}:${book.id}`);
      notifySystem('app_notify_content', t('settings_notif_content'), t(milestone === 'half' ? 'notif_content_half' : 'notif_content_end', { title: book.title }));
    }
    for (const chap of book.chapters || []) {
      const end = (chap.startTime || 0) + (chap.duration || 0);
      if (!chap.duration) continue;
      // Cruzou o fim do capítulo (ou chegou a menos de 1 s dele) ouvindo
      if (prev.time < end - 1 && time >= end - 1) {
        const finished = [...completedChaptersRef.current, `${bookId}-${chap.id}`];
        if (!completedChaptersRef.current.includes(`${bookId}-${chap.id}`)) {
          notifySystem('app_notify_chapter', t('settings_notif_chapter'), chap.title);
          if (visibleChapters(book.chapters, showExtraChapters).every(c => finished.includes(`${bookId}-${c.id}`))) {
            notifySystem('app_notify_book', t('settings_notif_book'), book.title);
          }
        }
        markChapterCompleted(bookId, chap.id);
      }
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

  // Um aviso novo substitui o anterior e ganha o tempo inteiro (antes, o relógio do anterior o apagava cedo)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string) => {
    setNotification(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
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
    if (meta) meta.setAttribute('content', resolvedTheme === 'dark' ? '#000000' : '#F0F2F5');
  }, [resolvedTheme]);

  const [moreContrast, setMoreContrast] = useState(() => !!window.matchMedia?.('(prefers-contrast: more)').matches);
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-contrast: more)');
    if (!query) return;
    const update = () => setMoreContrast(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const c = ACCENT_COLORS[accentColor] || ACCENT_COLORS.orange;
    const dark = resolvedTheme === 'dark';
    const hex = moreContrast ? (dark ? c.soberDark : c.soberLight) : (dark ? c.dark : c.hex);
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ');
    const root = document.documentElement.style;
    root.setProperty('--app-winblue', hex);
    root.setProperty('--app-winblue-rgb', rgb);
    root.setProperty('--winblue', hex);
    root.setProperty('--winblue-rgb', rgb);
    try { localStorage.setItem('app_accent_color', accentColor); } catch {}
  }, [accentColor, resolvedTheme, moreContrast]);

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
    const hex = currentCoverHex || '#FF9500';
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
    const hex = currentCoverHex || '#FF9500';
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
        boxShadow: `0 0 40px 0 rgba(0, 0, 0, 0.7), 0 0 28px -4px ${darkBorder}33`,
        transition: 'background 0.45s ease, 0.45s ease, box-shadow 0.45s ease',
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
        boxShadow: `0 0 35px 0 rgba(0, 0, 0, 0.12), 0 0 28px -4px ${lightBorder}55`,
        transition: 'background 0.45s ease, 0.45s ease, box-shadow 0.45s ease',
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

  // A pessoa rolou ou tocou na letra: a rolagem automática para e volta ao ponto atual 4 s depois do último gesto
  const lyricsHoldRef = useRef(false);
  const lyricsActiveIdxRef = useRef(-1);
  lyricsActiveIdxRef.current = activeTranscriptIndex;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const recenter = (instant = false) => {
      lyricsHoldRef.current = false;
      const container = fsTranscriptScrollRef.current;
      if (!container || container.dataset.searching) return;
      const activeEl = container.querySelector(`[data-transcript-idx="${lyricsActiveIdxRef.current}"]`) as HTMLElement | null;
      if (activeEl) centerLyricLine(container, activeEl, instant);
    };
    const hold = () => {
      cancelLyricCentering();
      lyricsHoldRef.current = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => recenter(), 4000);
    };
    const onGesture = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest?.('.fullscreen-transcript')) hold();
    };
    // Rolagem por inércia depois de soltar o dedo também conta
    const onScroll = (e: Event) => {
      if (lyricsHoldRef.current && (e.target as HTMLElement | null)?.classList?.contains('fullscreen-transcript')) hold();
    };
    const onRecenter = (e: Event) => {
      if (timer) clearTimeout(timer);
      recenter(Boolean((e as CustomEvent).detail?.instant));
    };
    // A letra avisa qual frase está começando (pelo relógio rápido dela) e a rolagem vai até ela
    const onFollow = (e: Event) => {
      if (lyricsHoldRef.current) return;
      const container = fsTranscriptScrollRef.current;
      if (!container || container.dataset.searching) return;
      const el = container.querySelector(`[data-transcript-idx="${(e as CustomEvent).detail}"]`) as HTMLElement | null;
      if (el) centerLyricLine(container, el);
    };
    const options = { capture: true, passive: true };
    ['wheel', 'touchstart', 'touchmove', 'pointerdown'].forEach(name => document.addEventListener(name, onGesture, options));
    document.addEventListener('scroll', onScroll, options);
    window.addEventListener('lyrics-recenter', onRecenter);
    window.addEventListener('lyrics-follow', onFollow);
    return () => {
      if (timer) clearTimeout(timer);
      ['wheel', 'touchstart', 'touchmove', 'pointerdown'].forEach(name => document.removeEventListener(name, onGesture, options));
      document.removeEventListener('scroll', onScroll, options);
      window.removeEventListener('lyrics-recenter', onRecenter);
      window.removeEventListener('lyrics-follow', onFollow);
    };
  }, []);

  // Sugestões de conteúdo: no máximo uma por dia, sem interromper quem está ouvindo
  const sendContentSuggestionRef = useRef<() => void>(() => {});
  sendContentSuggestionRef.current = () => {
    const now = Date.now();
    if (!notifyContent || isPlaying || !canSendSuggestion(now)) return;
    const seconds = Object.values(userListeningStats.bookSeconds).reduce((sum, v) => sum + v, 0);
    const week = takeWeeklySeconds(seconds, now);
    if (week && week >= 60) {
      markSuggestionTime(now);
      const minutes = Math.round(week / 60);
      notifySystem('app_notify_content', t('settings_notif_content'), t('notif_content_week', { hours: minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min` }));
      return;
    }
    const pick = pickContentSuggestion({ books, lastPlayed: userListeningStats.bookLastPlayed, isStarted: isBookStarted, isCompleted: isBookCompleted, now, sent: getSentSuggestions() });
    if (!pick) return;
    markSuggestionSent(pick.id);
    markSuggestionTime(now);
    notifySystem('app_notify_content', t('settings_notif_content'), t(`notif_content_${pick.kind}`, { title: pick.book.title, author: pick.book.author, text: pick.text || '' }));
  };
  useEffect(() => {
    const send = () => sendContentSuggestionRef.current();
    const onVisibility = () => { if (document.hidden) send(); };
    const timer = setTimeout(send, 30000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Alinhamento ao abrir a letra após conclusão da transição
  useEffect(() => {
    if (showTranscript && isFullScreen && activeTranscriptIndex !== -1) {
      const timer = setTimeout(() => {
        const container = fsTranscriptScrollRef.current;
        if (!container) return;
        const activeEl = container.querySelector(`[data-transcript-idx="${activeTranscriptIndex}"]`) as HTMLElement;
        if (activeEl) centerLyricLine(container, activeEl);
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
    if (activeScreen.id.startsWith('library-colecao-')) {
      const colId = activeScreen.id.replace('library-colecao-', '');
      const col = collections.find(c => c.id === colId) || (activeScreen.data as Collection | undefined);
      return col?.color ? getBookHighlightTheme(col.color, resolvedTheme === 'dark') : null;
    }
    return null;
  }, [activeScreen.id, activeScreen.data, selectedBook, books, authors, collections, isEditingBook, editBookCover, editCoverColor, isEditingAuthor, editAuthorPicture, editAuthorColor, getCustomCoverColor, resolvedTheme]);

  const headerTintColor = useMemo(() => {
    if (!sidebarHighlight) return '';
    const { h, s: sat } = hexToHsl(sidebarHighlight.hex);
    return resolvedTheme === 'dark'
      ? hslToHex(h, Math.min(55, sat * 0.7), 13)
      : hslToHex(h, Math.min(60, sat * 0.6), 90);
  }, [sidebarHighlight, resolvedTheme]);

  // Título da tela/menu/submenu atual para exibição no cabeçalho ao rolar
  // ===== Mobile: ações do cabeçalho (ação rápida + três pontinhos) por tela =====
  const renderBookDetailsContent = () => <BookDetailsContent />;

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
  const renderOnboardingSettings = () => <OnboardingSettings />;
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
  // Busca dentro do texto ao compartilhar um trecho
  const [lyricsSearch, setLyricsSearch] = useState('');
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
      const { renderAudiobookStory, renderQuoteStory } = await import('./lib/shareStory');
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
  // A frase vira uma marcação do capítulo em que ela está, no tempo em que começa
  const addLineBookmark = (line: TranscriptLine) => {
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
  };

  const openShareLyrics = (book: Audiobook, preselect: number[] = []) => {
    setLyricsSelection(preselect.slice(0, MAX_SHARE_LINES));
    setLyricsSearch('');
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
  openMobileSheetRef.current = openMobileSheet;
  // Folha de audiobooks sendo adicionados: o App só redesenha quando muda o singular/plural ou a lista esvazia
  // (o progresso de cada um é lido pela própria lista)
  const importCount = useSyncExternalStore(importStore.subscribe, () => Math.min(2, visibleImports(importStore.get().items).length));
  useEffect(() => {
    if (importCount === 0 && mobileSheet?.kind === 'import-progress') setMobileSheet(null);
  }, [importCount, mobileSheet]);
  const renderMobileSheetContent = (): { title: string; subtitle?: string; body: React.ReactNode; footer?: React.ReactNode; headerAction?: React.ReactNode } | null => {
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
                leading={<span className="w-10 h-10 rounded-full bg-card/75 text-[var(--text-main)] flex items-center justify-center shrink-0"><FolderPlus size={17} /></span>}
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
                        <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${col.gradient} flex items-center justify-center text-2xl shrink-0 shadow-sm select-none`}>
                          <EmojiIcon emoji={col.emoji} />
                        </span>
                      }
                      title={col.name}
                      subtitle={col.description || undefined}
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
    // Todas as marcações do audiobook, por capítulo; tocar numa abre as marcações daquele capítulo (onde se
    // edita e apaga)
    if (mobileSheet.kind === 'import-progress') {
      if (!importCount) return null;
      return {
        title: t(importCount > 1 ? 'import_adding_many' : 'import_adding_one'),
        headerAction: <ImportCancelAllButton />,
        body: <ImportList />,
      };
    }
    if (mobileSheet.kind === 'book-bookmarks') {
      const bk = books.find(b => b.id === mobileSheet.bookId);
      if (!bk) return null;
      const groups = (bk.chapters || [])
        .map(chapter => ({ chapter, marks: (((chapter as any).bookmarks || (chapter as any).comments || []) as any[]) }))
        .filter(g => g.marks.length > 0);
      return {
        title: t('all_bookmarks'),
        subtitle: bk.title,
        body: (
          <div className="flex flex-col gap-5 pt-1">
            {groups.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-10">{t('no_bookmarks_in_book')}</p>
            )}
            {groups.map(({ chapter, marks }) => (
              <section key={String(chapter.id)} className="flex flex-col gap-2">
                <h3 className="px-1 text-[13px] font-semibold text-[var(--text-muted)] truncate">{chapter.title}</h3>
                <div className={SCREEN_GROUP_CLASS}>
                  {marks.map((mark: any) => (
                    <button
                      key={mark.id}
                      type="button"
                      onClick={() => openMobileSheet({ kind: 'bookmarks', bookId: bk.id, chapterId: chapter.id })}
                      className="w-full flex items-start gap-3 px-3 py-2.5 text-left rtl:text-right rounded-[24px] transition-colors hover:bg-[var(--hover-fill)]"
                    >
                      <span className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-winblue/15 text-winblue">
                        <Bookmark size={13} />
                      </span>
                      <span className="flex-1 min-w-0 text-[15px] leading-snug text-[var(--text-main)] line-clamp-3">{mark.text}</span>
                      {mark.timestamp !== undefined && mark.timestamp >= 0 && (
                        <span className="text-[11px] text-[var(--text-muted)] shrink-0 mt-1">{formatTime(mark.timestamp)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            ))}
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
            {/* Buscar um trecho no texto, no mesmo padrão da pesquisa do app (brilho ao digitar e X fora da
                barra); as linhas marcadas continuam marcadas ao filtrar */}
            <PopupSearchField value={lyricsSearch} onChange={setLyricsSearch} placeholder={t('share_search_placeholder')} autoFocus={false} />
            <div className={SCREEN_GROUP_CLASS}>
              {transcript.map((line, idx) => {
                const query = normalizeSearchStr(lyricsSearch.trim());
                if (query && !normalizeSearchStr(transcriptLineText(line)).includes(query)) return null;
                const selected = lyricsSelection.includes(idx);
                return (
                  // Mesmo padrão de seleção dos Ajustes: linha destacada e ✓ à direita
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggle(idx)}
                    className={`w-full min-h-[52px] flex items-center gap-3.5 px-3 py-2.5 text-left rtl:text-right rounded-[26px] transition-colors select-none ${selected ? 'bg-winblue/15 ' : ' hover:bg-[var(--hover-fill)]'}`}
                  >
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className={`text-[15px] leading-snug ${selected ? 'text-winblue font-semibold' : 'text-[var(--text-main)]'}`}>{transcriptLineText(line)}</span>
                      <span className="text-xs text-[var(--text-muted)] mt-0.5">{formatTime(line.start)}</span>
                    </span>
                    <span className="shrink-0 w-6 flex items-center justify-center text-winblue">
                      {selected && <BsCheck2 size={18} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ),
        footer: (
          <div className="flex items-center justify-center">
            <motion.button
              data-press="true"
              disabled={lyricsSelection.length === 0 || isGeneratingShare}
              onClick={() => openShareImage('quote', bk, lyricsSelection.map(i => transcriptLineText(transcript[i])))}
              className="h-12 px-7 rounded-full bg-winblue/20 text-winblue shadow-sm text-[15px] font-bold flex items-center justify-center gap-2 disabled:opacity-40"
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
  const renderSortOptions = (onPicked?: () => void) => <SortOptions onPicked={onPicked} />;

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

  // Muda quando o conjunto de botões do cabeçalho muda (tela, seleção, edição): dispara o fade de troca
  const headerActionsKey = `${getScreenKey(activeScreen)}|${isSelectionMode ? 's' : ''}|${isEditingBook ? 'eb' : ''}|${isEditingAuthor ? 'ea' : ''}`;
  const renderMobileHeaderActions = () => <HeaderActions />;

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
  // Texto do botão de voltar: nomes longos são resumidos ("...") para não encostar nos botões do outro lado
  const backLabelMaxWidth = typeof window === 'undefined' ? 320 : Math.min(320, Math.round(window.innerWidth * (isMobile ? 0.36 : 0.22)));

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
      // Mobile: rolar para baixo recolhe a barra de abas; como no iOS, ela só volta a expandir sozinha ao
      // chegar ao topo (rolar para cima não expande; tocar nela expande)
      const lastSt = lastScrollTopRef.current;
      lastScrollTopRef.current = st;
      // Só a rolagem do usuário mexe na barra (não as do app durante a troca de telas, nem saltos)
      const frozen = Date.now() < navBarFreezeUntil || Math.abs(st - lastSt) > 240;
      if (!frozen) {
        if (st < 24) tabBarStore.set(false);
        else if (st > lastSt + 6) tabBarStore.set(true);
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
    try { 
      localStorage.setItem('app_resume_playback', String(resumePlayback)); 
      if (!resumePlayback) {
        localStorage.removeItem('app_playback_queue');
        localStorage.removeItem('app_last_played_time');
      }
    } catch {}
  }, [resumePlayback]);

  const handleResetSettings = () => {
    setThemeMode('dark');
    setAccentColor('orange');
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
      'app_notify_chapter', 'app_notify_book', 'app_notify_added', 'app_notify_content',
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
    if (time < 1) {
      try {
        const prev = Number(JSON.parse(localStorage.getItem('audiobook_playback_positions') || '{}')[bookId]);
        if (isFinite(prev) && prev > 5) diag('gravou-0', { livro: bookId, antes: prev, force });
      } catch {}
    }
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
    if (latestBookIdRef.current) resumeCheckedBooksRef.current.add(latestBookIdRef.current);
    const clamped = Math.max(0, Math.min(totalDuration || 999999, newTime));
    seekVerifyRef.current = { target: clamped, at: Date.now(), tries: 0, lastTry: 0 };
    diag('pulo', { t: clamped });
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
  const renderPlaybackReturnButton = (_isFullScreenMode: boolean) => <PlaybackReturnButton _isFullScreenMode={_isFullScreenMode} />;

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
  const { applyPendingSeek, getLivePlaybackTime, handleAddBookToQueue, handleAddChapterToQueue, handleAddToQueue, handleAudioEnded, handleAudioTimeUpdate, handlePlayBookFromStart, handleSelectBookDetail, handleUploadTranscriptForEditBook, handleUploadTranscriptForPlayerBook, reconcileBookDuration, recoverAudio, resumeCheckedBooksRef, verifySeek } = usePlaybackEngine({ accrueListeningSeconds, activeScreen, applyBookDurationRef, audioContextRef, audioRecoveryTriesRef, audioRef, audioUrlsRef, beginBookSwitch, books, checkChapterFinished, currentAudioSrc, currentBook, currentChapter, currentChapterIndex, currentTime, currentTimeRef, durationFixedBooksRef, durationTimerRef, editBookChapters, gainNodeRef, getChapterResumeElapsed, handleSeek, isAudioLoading, isEditingBook, isMuted, isMutedRef, isPlaying, isSleepTimerPaused, lastSrcSetAtRef, lastTrackedAudioTimeRef, latestBookIdRef, loadAudioForBook, loadedSrcRef, markChapterCompleted, mediaSessionContextRef, navigateTo, noFragmentRef, pendingChapterScrollRef, pendingSeekRef, playbackQueue, playbackReturnPoint, playbackSpeed, queueAddedTimeoutRef, recordPlaySession, recoverAudioRef, resumePlayback, savePlaybackPosition, seekVerifyRef, selectedBook, setActiveScreen, setBooks, setCurrentBook, setCurrentTime, setEditBookTranscript, setEditBookTranscriptFileName, setEditBookTranscriptSource, setIsPlaying, setIsQueuePulse, setIsSleepTimerPaused, setPlaybackQueue, setPlaybackReturnPoint, setQueueAddedAnim, setSelectedBook, setShowAddTextPopup, setShowTranscript, setSleepTimerMode, setSleepTimerRemaining, setStartedChapters, setupWebAudioGraph, showExtraChapters, showToast, sleepTimerMode, sleepTimerRemaining, storedAudioBlobKeysRef, t, targetScrollChapterIdRef, totalDuration, updateMediaSessionPosition, volume, volumeRef });

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
  const { allBooksNavGroups, appStyle, computedSearchResults, filteredBooks, fsRowPopupProps, getCollectionItems, handleScrollToGroup, homeSections, isPlayerVisible, matchesBookSearch, renderCollectionAuthorCard, renderCollectionBookCard, renderCommentsContent, renderFullScreenHeaderControls, renderSecondaryControls, sortBooks, sortedAuthors, sortedCollections, sortedGenres, sortedLanguages } = useLibraryViews({ activeAllBooksNavId, activeScreen, authors, books, closeAllPopups, collections, completedChapters, currentBook, favoriteAuthorIds, favoriteBookIds, favoriteChapters, handleAddToQueue, handleDeleteBook, handlePlayBookFromStart, handleSelectAuthor, handleSelectBookDetail, isBookCompleted, isBookStarted, isFullScreen, isManualScrollingRef, isMobile, isPlaying, isSelectionMode, lastPlayedBookId, mainScrollRef, navigateTo, recentlyAddedBooks, recentlyListenedBookIds, recentlyListenedBooks, resolvedLanguage, resumePlayback, searchQuery, selectedBooks, setActiveAllBooksNavId, setAuthors, setBooks, setCompletedChapters, setEditingBook, setSelectedBooks, setStartedChapters, setStatusFilter, showExtraChapters, showToast, sortBy, startedChapters, statusFilter, t, toggleFavoriteAuthor, toggleFavoriteBook, userListeningStats });

  const handleSelectSearchItem = (item: SearchItem) => {
    addToSearchHistory(searchQuery);
    if (item.type === 'book' && item.book) {
      navigateTo('book-detail', item.book);
    } else if (item.type === 'author' && item.author) {
      navigateTo('author-detail', item.author);
    } else if (item.type === 'bookmark' && item.book) {
      // Marcação: abre a lista de marcações do audiobook
      openMobileSheet({ kind: 'book-bookmarks', bookId: item.book.id });
    } else if (item.type === 'chapter' && item.book && item.chapter) {
      // Capítulo ou marcação: abre a página do audiobook já no capítulo
      pendingChapterScrollRef.current = true;
      targetScrollChapterIdRef.current = `${item.book.id}-${item.chapter.id}`;
      setSelectedBook(item.book);
      setShouldScrollToCurrentChapter(Date.now());
      navigateTo('book-detail', item.book);
    } else if (item.type === 'collection' && item.collection) {
      navigateTo(`library-colecao-${item.collection.id}`, item.collection);
    }
    setSearchQuery('');
    setActiveSearchMenuId(null);
    setSearchMenuAnchor(null);
    setConfirmDeleteSearchId(null);
    setSearchCollectionTarget(null);
    setSearchSelectedIndex(-1);
  };

  // Celular: segurar um resultado abre as opções dele (como o clique direito no computador). O clique que
  // vem ao soltar o dedo não abre o item.
  const searchLongPressRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; fired: boolean; x: number; y: number }>({ timer: null, fired: false, x: 0, y: 0 });
  const openSearchItemMenu = (el: HTMLElement, itemId: string) => {
    const btn = (el.querySelector('button') as HTMLElement) || el;
    closeAllPopups();
    clearButtonCoverAnchorCache(btn);
    setSearchMenuAnchor(btn);
    setActiveSearchMenuId(itemId);
  };
  const searchLongPressProps = (itemId: string) => ({
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => {
      const st = searchLongPressRef.current;
      if (st.timer) clearTimeout(st.timer);
      st.fired = false;
      st.x = e.touches[0].clientX;
      st.y = e.touches[0].clientY;
      const el = e.currentTarget;
      st.timer = setTimeout(() => {
        st.timer = null;
        st.fired = true;
        try { navigator.vibrate?.(8); } catch { /* sem vibração */ }
        openSearchItemMenu(el, itemId);
      }, 450);
    },
    onTouchMove: (e: React.TouchEvent<HTMLElement>) => {
      const st = searchLongPressRef.current;
      if (st.timer && Math.hypot(e.touches[0].clientX - st.x, e.touches[0].clientY - st.y) > 8) {
        clearTimeout(st.timer);
        st.timer = null;
      }
    },
    onTouchEnd: () => {
      const st = searchLongPressRef.current;
      if (st.timer) { clearTimeout(st.timer); st.timer = null; }
    },
    onClickCapture: (e: React.MouseEvent<HTMLElement>) => {
      const st = searchLongPressRef.current;
      if (st.fired) { st.fired = false; e.stopPropagation(); e.preventDefault(); }
    },
  });

  const renderSearchResultsList = () => <SearchResultsList />;

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
  // Gesto da borda numa tela aberta de um card: onde a página encolhida estava ao soltar
  const zoomSwipeRef = useRef<{ at: number; from: { rect: { left: number; top: number; width: number; height: number }; radius: number } } | null>(null);
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
  // Botões crescem ao pressionar e dão um pulinho ao soltar (como nos sistemas da Apple)
  useEffect(() => installTapBounce(), []);
  // Aparelho simples com o modo leve desligado: sugere uma vez (depois de o app abrir e assentar)
  useEffect(() => {
    const timer = setTimeout(() => {
      getSystemInfo().then(info => {
        if (!info?.weak) return;
        try {
          if (localStorage.getItem('app_lite_mode') === 'true' || localStorage.getItem('app_lite_suggested_v1')) return;
          localStorage.setItem('app_lite_suggested_v1', 'true');
        } catch { return; }
        showToast(t('toast_lite_suggest'));
      });
    }, 9000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
    el.style.borderRadius = '';
    el.style.transformOrigin = '';
    el.style.overflow = '';
    el.style.opacity = '';
  }, [activeScreen]);
  const navDepthRef = useRef(navDepth);
  navDepthRef.current = navDepth;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let start: { x: number; y: number; t: number } | null = null;
    let active = false;
    let target: HTMLElement | null = null;
    // Tela aberta de um card (audiobook, autor, coleção): encolhe na direção dele em vez de deslizar
    let zoomKey: string | null = null;
    const EDGE = 24;
    const isRtl = () => document.documentElement.dir === 'rtl';
    const reset = (animateBack: boolean) => {
      if (target) {
        target.style.transition = animateBack ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), 0.28s ease' : '';
        target.style.transform = '';
        target.style.borderRadius = '';
        const el = target;
        setTimeout(() => { el.style.transition = ''; el.style.transformOrigin = ''; el.style.overflow = ''; }, 300);
      }
      start = null; active = false; target = null; zoomKey = null;
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
        zoomKey = target === mainScrollRef.current ? getZoomBackKeyRef.current() : null;
        const card = zoomKey ? getZoomReturnRect(zoomKey) : null;
        if (target && zoomKey && card) {
          // A página encolhe em direção ao card de onde foi aberta
          const box = target.getBoundingClientRect();
          const ox = Math.min(box.width, Math.max(0, card.left + card.width / 2 - box.left));
          const oy = Math.min(box.height, Math.max(0, card.top + card.height / 2 - box.top));
          target.style.transformOrigin = `${ox}px ${oy}px`;
          target.style.overflow = 'hidden';
        } else {
          zoomKey = null;
        }
      }
      if (e.cancelable) e.preventDefault();
      if (!target) return;
      if (zoomKey) {
        // Como o player ao minimizar: encolhe e arredonda as bordas acompanhando o dedo
        const progress = Math.min(1, Math.max(0, dx) / window.innerWidth);
        target.style.transform = `scale(${1 - progress * 0.45})`;
        target.style.borderRadius = `${Math.round(progress * 64)}px`;
        return;
      }
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
        const releasedZoomKey = zoomKey;
        zoomKey = null;
        if (isScreen && el && releasedZoomKey) {
          // Recolhe para dentro do card: a camada parte de onde a página encolhida está
          const r = el.getBoundingClientRect();
          zoomSwipeRef.current = {
            at: Date.now(),
            from: { rect: { left: r.left, top: r.top, width: r.width, height: r.height }, radius: parseFloat(el.style.borderRadius) || 0 },
          };
          el.style.transition = '';
          el.style.opacity = '0';
          pendingSwipeResetRef.current = el;
          if (IS_APPLE_TOUCH) {
            systemBackRef.current();
          } else {
            edgeSwipeRef.current.pendingBack = true;
            edgeSwipeRef.current.backAt = Date.now();
            window.history.back();
          }
        } else if (isScreen && el) {
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

  // O que as telas extraídas usam (src/views/screens)
  const appScope: AppScope = { accentColor, activeAllBooksNavId, activeChapterCommentsPopupId, activeChapterMenuId, activeChapterMenuMode, activeScreen, activeSearchMenuId, activeSettingSelector, addTextInputRef, addToSearchHistory, addingCommentText, allBooksNavGroups, alphaNavPressRef, appLanguage, authorCropImage, authors, autoShowText, beginBookSwitch, bookCropImage, books, booksRef, chapterCommentsPopupOpenUp, chapterElapsed, chapterMenuOpenUp, chapterRemaining, checkOnStartup, cleanupDeletedBooks, closeAllPopups, colFormDesc, colFormEmoji, colFormName, colFormPalette, colPickerAnchor, colSelectedAuthorIds, colSelectedBookIds, collectionMenu, collections, completeOnboarding, completedChapters, computedSearchResults, confirmDeleteSearchId, currentBook, currentBookHighlight, currentChapter, currentChapterIndex, currentTime, dataFolder, defaultPlaybackSpeed, deletingCommentId, detectNewFiles, dynamicCompressionEnabled, editAuthorBio, editAuthorColor, editAuthorName, editAuthorNationality, editAuthorPicture, editBookAuthor, editBookCategory, editBookChapters, editBookCover, editBookDescription, editBookLanguage, editBookNarrator, editBookSubgenre, editBookTextInputRef, editBookTitle, editBookTranscript, editBookTranscriptFileName, editBookTranscriptSource, editCoverColor, editingCommentId, editingCommentText, favoriteAuthorIds, favoriteBookIds, favoriteChapters, fileInputRef, filteredBooks, findAuthorIdForBook, fontSize, formatCountdown, formatTime, fsNowPlayingRef, fsQueueScrollRef, fsRowPopupProps, getChapterResumeElapsed, getCollectionItems, getCollectionSubScreen, getCollectionSubScreenTitle, getCustomCoverColor, goBack, handleAddBookToQueue, handleAddChapterToQueue, handleAddToQueue, handleBookCoverError, handleDeleteBook, handleDeleteCollection, handleExitDevMode, handleExportLibraryBackup, handleImportLibraryBackup, handleJumpToComment, handleOpenBookInFolder, handleOpenDataFolder, handleOpenExternalUrl, handlePlayBookFromStart, handleResetSettings, handleReturnToPreviousPoint, handleScrollToGroup, handleSeek, handleSelectAuthor, handleSelectBookDetail, handleSelectLibraryFolder, handleSelectSearchItem, handleSelectSort, handleSelectSpeed, handleStartCreateCollection, handleStartEditAuthor, handleStartEditBook, handleStartEditCurrentCollection, handleSyncLibraryNow, handleSynopsisRef, handleToggleItemInCollection, handleUploadTranscriptForEditBook, handleUploadTranscriptForPlayerBook, hasTranscript, homeSections, isAddingComment, isBookCompleted, isBookStarted, isChapterCompleted, isChapterStarted, isDevModeActive, isEditingAuthor, isEditingBook, isMobile, isMobileAlphaNavOpen, isMuted, isPlayerVisible, isPlaying, isQueuePulse, isSelectionMode, isSleepTimerPaused, isSyncingLibrary, isSynopsisTruncated, isTouchDevice, libraryFolder, matchesBookSearch, miniCommentsBtnAnchor, miniCommentsBtnRef, miniNowPlayingRef, miniQueueBtnAnchor, miniQueueBtnRef, miniQueueScrollRef, miniSleepBtnAnchor, miniSleepBtnRef, miniSpeedBtnAnchor, miniSpeedBtnRef, miniVolumeBtnAnchor, miniVolumeBtnRef, navigateTo, notificationsOn, notifyBookAdded, notifyBookCompleted, notifyChapterCompleted, notifyContent, onboardingHeaderProgress, onboardingPage, openMobileSheet, openShareImage, openShareLyrics, pendingChapterScrollRef, playbackQueue, playbackReturnPoint, playbackSpeed, queueAddedAnim, recentlyAddedBooks, recentlyListenedBookIds, recentlyListenedBooks, renderCollectionAuthorCard, renderCollectionBookCard, renderCommentsContent, renderSortOptions, resolvedLanguage, resolvedTheme, resumePlayback, searchCollectionTarget, searchHistory, searchInputRef, searchLongPressProps, searchMenuAnchor, searchQuery, searchSelectedIndex, seekBackwardTime, seekForwardTime, selectedAuthors, selectedBook, selectedBooks, selectedCollectionIds, selectedGenres, selectedLanguages, setAccentColor, setActiveChapterCommentsPopupId, setActiveChapterMenuId, setActiveChapterMenuMode, setActiveScreen, setActiveSearchMenuId, setActiveSettingSelector, setAddingCommentText, setAppLanguage, setAuthorCropImage, setAutoShowText, setBookCropImage, setBooks, setChapterCommentsPopupOpenUp, setChapterMenuOpenUp, setCheckOnStartup, setColFormDesc, setColFormEmoji, setColFormName, setColFormPalette, setColPickerAnchor, setColSelectedAuthorIds, setColSelectedBookIds, setCompletedChapters, setConfirmDeleteSearchId, setCurrentBook, setDefaultPlaybackSpeed, setDeletingCommentId, setDetectNewFiles, setDynamicCompressionEnabled, setEditAuthorBio, setEditAuthorColor, setEditAuthorName, setEditAuthorNationality, setEditAuthorPicture, setEditBookAuthor, setEditBookCategory, setEditBookChapters, setEditBookCover, setEditBookDescription, setEditBookLanguage, setEditBookNarrator, setEditBookSubgenre, setEditBookTitle, setEditBookTranscript, setEditBookTranscriptFileName, setEditBookTranscriptSource, setEditCoverColor, setEditingBook, setEditingCommentId, setEditingCommentText, setFavoriteChapters, setFontSize, setHistoryStack, setIsAddingComment, setIsFullScreen, setIsMobileAlphaNavOpen, setIsMuted, setIsPlaying, setIsSelectionMode, setIsSleepTimerPaused, setMiniCommentsBtnAnchor, setMiniQueueBtnAnchor, setMiniSleepBtnAnchor, setMiniSpeedBtnAnchor, setMiniVolumeBtnAnchor, setMobileConfirm, setMobileSearchSlot, setNotifyBookAdded, setNotifyBookCompleted, setNotifyChapterCompleted, setNotifyContent, setOnboardingPage, setOnboardingStep, setPlaybackQueue, setPlaybackSpeed, setResumePlayback, setSearchCollectionTarget, setSearchHistory, setSearchMenuAnchor, setSearchQuery, setSearchSelectedIndex, setSeekBackwardTime, setSeekForwardTime, setSelectedAuthors, setSelectedBook, setSelectedBooks, setSelectedCollectionIds, setSelectedGenres, setSelectedLanguages, setShouldScrollToCurrentChapter, setShowAddAuthorPopup, setShowAddBookPopup, setShowAddTextPopup, setShowCommentsPopover, setShowDeleteSearchHistoryConfirm, setShowLicensesModal, setShowQueuePopup, setShowSleepTimerMenu, setShowSpeedMenu, setShowTranscript, setShowVolumePopup, setSleepTimerMode, setSleepTimerRemaining, setStartedChapters, setStatusFilter, setThemeMode, setUiDensity, setVoiceBoostEnabled, setVolume, setupWebAudioGraph, showAddAuthorPopup, showAddBookPopup, showAddTextPopup, showCommentsPopover, showDeleteSearchHistoryConfirm, showLicensesModal, showQueuePopup, showSleepTimerMenu, showSpeedMenu, showToast, showTranscript, showVolumePopup, sleepTimerMode, sleepTimerRemaining, sortBooks, sortBy, sortedAuthors, sortedCollections, sortedGenres, sortedLanguages, startedChapters, statusFilter, synopsisFullTextRef, t, targetScrollChapterIdRef, themeMode, toggleFavoriteAuthor, toggleFavoriteBook, toggleFavoriteChapter, toggleNotifications, uiDensity, useFullScreenSheets, voiceBoostEnabled, volume };

  return (
    <AppScopeContext.Provider value={appScope}>
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
        accept="audio/*,.mp3,.m4a,.m4b,.mp4,.aac,.ogg,.wav,.flac,.opus,.wma,.json,.lrc,.vtt,.srt,.smil,.epub"
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
            className="max-md:hidden fixed top-6 left-1/2 md:left-[calc(50vw+136px)] rtl:md:left-auto rtl:md:right-[calc(50vw+136px)] -translate-x-1/2 rtl:translate-x-1/2 z-[300] bg-card/90 backdrop-blur-xl text-winblue px-5 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-2"
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
        className="accent-slide flex-1 min-w-0 h-full bg-transparent flex flex-col relative z-20"
        style={sidebarHighlight ? ({
          '--winblue': sidebarHighlight.hex,
          '--winblue-rgb': sidebarHighlight.rgb,
          '--color-winblue': 'var(--winblue)',
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
          style={{ ['--header-blur' as any]: 0 }}
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
                    data-instant="true"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.08 } }}
                    transition={SPRING.snappy}
                    data-press="true"
                    onClick={goBack}
                    // Celular: ao rolar, a pílula encolhe suavemente até virar um círculo só com a seta
                    // (o texto se recolhe e some), e volta ao subir
                    style={{
                      paddingLeft: backCollapsed ? 'calc((var(--back-btn-h) - 22px) / 2)' : '1rem',
                      paddingRight: backCollapsed ? 'calc((var(--back-btn-h) - 22px) / 2)' : '1rem',
                      transition: 'padding 0.2s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s, 0.2s, box-shadow 0.2s',
                    }}
                    className="h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] backdrop-blur-3xl"
                    aria-label={t('back') || undefined}
                  >
                    <ChevronLeft size={14} className="text-[var(--text-main)] rtl:rotate-180 shrink-0" />
                    <motion.span
                      initial={false}
                      animate={backCollapsed
                        ? { maxWidth: 0, opacity: 0, marginLeft: 0, marginRight: 0, filter: 'blur(4px)' }
                        : { maxWidth: backLabelMaxWidth, opacity: 1, marginLeft: 6, marginRight: 0, filter: 'blur(0px)' }}
                      transition={{ maxWidth: SPRING.snappy, marginLeft: SPRING.snappy, opacity: { duration: backCollapsed ? 0.08 : 0.14, delay: backCollapsed ? 0 : 0.05 }, filter: FADE_OUT }}
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
                  transition={SPRING.snappy}
                  className="absolute left-1/2 -translate-x-1/2 top-[var(--app-header-top)] h-9 flex items-center justify-center pointer-events-auto cursor-default z-30 max-w-[42%] sm:max-w-[50%] md:max-w-[58%]"
                  title={currentScreenTitle}
                >
                  <div className="relative flex items-center justify-center max-w-full">
                    {/* Efeito de sombra difusa / profundidade no fundo do título */}
                    <div 
                      className="absolute -inset-x-6 -inset-y-2 bg-black/15 dark:bg-black/50 rounded-full blur-xl -z-10 pointer-events-none" 
                      aria-hidden="true"
                    />
                    <h2 className="text-lg md:text-[19px] font-bold text-[var(--text-main)] truncate tracking-tight text-center drop-shadow-[0_0_10px_rgba(0,0,0,0.22)] dark:drop-shadow-[0_0_14px_rgba(0,0,0,0.7)] select-none">
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
                  transition={SPRING.snappy}
                  className="relative flex items-center max-md:w-[calc(100vw-32px)]"
                >
                  <div className="relative group/searchbar max-md:w-full">
                    <div
                      style={isMobile ? { width: searchQuery.length > 0 ? 'calc(100% - 52px)' : '100%', transition: 'width 0.32s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.15s, 0.15s' } : undefined}
                      className="h-9 max-md:h-11 w-64 sm:w-80 md:w-[380px] flex items-center gap-2 px-3.5 rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] focus-within:bg-winblue/15 text-[var(--text-main)] transition-all backdrop-blur-3xl">
                      <Search size={14} className="text-[var(--text-muted)] group-focus-within/searchbar:text-winblue transition-colors shrink-0" />
                      <input
                        ref={searchInputRef}
                        autoFocus
                        type="text"
                        placeholder={t('search_placeholder')}
                        enterKeyHint="search"
                        autoCapitalize="sentences"
                        autoCorrect="on"
                        spellCheck
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
                            data-scroll-list="true"
                            initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={isMobile ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                            transition={SPRING.snappy}
                            onClick={(e) => e.stopPropagation()}
                            className={isMobile
                              ? "relative w-full flex flex-col"
                              : "absolute top-full left-1/2 -translate-x-1/2 mt-3 w-full min-w-[272px] sm:min-w-[368px] md:min-w-[416px] max-h-[calc(100vh-220px)] bg-card/95 backdrop-blur-3xl rounded-[28px] shadow-2xl z-[100] flex flex-col overflow-hidden"}
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
                        transition={SPRING.snappy}
                        data-press="true"
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
                        className="absolute left-full rtl:left-auto rtl:right-full ml-3 rtl:ml-0 rtl:mr-3 max-md:left-auto max-md:right-0 max-md:ml-0 rtl:max-md:right-auto rtl:max-md:left-0 rtl:max-md:mr-0 top-0 z-[110] w-9 h-9 max-md:w-11 max-md:h-11 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl shrink-0 cursor-pointer"
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
            {isMobile && (
              <div className="md:hidden flex items-center pointer-events-auto shrink-0 z-40">
                <AnimatePresence mode="wait" initial={false}>
                  {!isSelectionMode && !isEditingBook && !isEditingAuthor && activeScreen.id !== 'create-collection' && activeScreen.id !== 'edit-collection' && (
                    <motion.div
                      key={headerActionsKey}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ ...SPRING.snappy, opacity: FADE_IN }}
                      className="flex items-center"
                    >
                      {renderMobileHeaderActions()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {/* Botões do cabeçalho: ao mudarem (outra tela/modo), os antigos somem e os novos surgem num fade rápido */}
            <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={headerActionsKey}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ ...SPRING.snappy, opacity: FADE_IN }}
              className={cn(
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
                    data-press="true"
                    onClick={handleExitDevMode}
                    title={t('exit_dev_mode')}
                    className="max-md:hidden h-9 px-3.5 rounded-full bg-gradient-to-r from-amber-500/25 via-amber-500/20 to-orange-500/25 text-amber-400 hover:text-amber-300 transition-all backdrop-blur-3xl font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-lg cursor-pointer select-none"
                  >
                    <Code2 size={13} className="text-amber-400 shrink-0" />
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
                      transition={SPRING.snappy}
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
                                data-press="true"
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
                                className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-card/75 shadow-xl hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs"
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
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-[26px] shrink-0 shadow-sm`}>
                                                  <EmojiIcon emoji={c.emoji} />
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
                                                <div className="w-11 h-11 rounded-xl bg-card/80 flex items-center justify-center text-[26px] shrink-0 shadow-sm">
                                                  <EmojiIcon emoji={getGenreEmoji(genre!.id)} />
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
                                                <div className="w-11 h-11 rounded-xl bg-card/80 flex items-center justify-center text-[26px] shrink-0 shadow-sm">
                                                  <Languages size="1em" strokeWidth={2} aria-hidden="true" className="inline-block align-[-0.125em]" />
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
                                          data-press="true"
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
                                          className="h-8 px-4 rounded-full bg-card/75 shadow-md hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                        >
                                          <Trash2 size={13} />
                                          <span>{t('delete')}</span>
                                        </motion.button>
                                        <motion.button
                                          data-press="true"
                                          onClick={() => {
                                            setShowDeleteSelectionConfirm(false);
                                            setIsSelectionMode(false);
                                            setSelectedBooks([]);
                                            setSelectedAuthors([]);
                                            setSelectedGenres([]);
                                            setSelectedLanguages([]);
                                            setSelectedCollectionIds([]);
                                          }}
                                          className="h-8 px-4 rounded-full bg-card/75 shadow-sm hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
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
                                        opacity: FADE_OUT,
                                        scale: SPRING.snappy,
                                      }}
                                      style={{ transformOrigin: "top right" }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute top-0 right-0 w-64 sm:w-80 bg-card/95 backdrop-blur-3xl rounded-[28px] shadow-2xl p-3.5 z-50 flex flex-col"
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
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-[26px] shrink-0 shadow-sm`}>
                                                  <EmojiIcon emoji={c.emoji} />
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
                                                <div className="w-11 h-11 rounded-xl bg-card/80 flex items-center justify-center text-[26px] shrink-0 shadow-sm">
                                                  <EmojiIcon emoji={getGenreEmoji(genre!.id)} />
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
                                                <div className="w-11 h-11 rounded-xl bg-card/80 flex items-center justify-center text-[26px] shrink-0 shadow-sm">
                                                  <Languages size="1em" strokeWidth={2} aria-hidden="true" className="inline-block align-[-0.125em]" />
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
                                          data-press="true"
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
                                          className="h-8 px-4 rounded-full bg-card/75 shadow-md hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                        >
                                          <Trash2 size={13} />
                                          <span>{t('delete')}</span>
                                        </motion.button>
                                        <motion.button
                                          data-press="true"
                                          onClick={() => {
                                            setShowDeleteSelectionConfirm(false);
                                            setIsSelectionMode(false);
                                            setSelectedBooks([]);
                                            setSelectedAuthors([]);
                                            setSelectedGenres([]);
                                            setSelectedLanguages([]);
                                            setSelectedCollectionIds([]);
                                          }}
                                          className="h-8 px-4 rounded-full bg-card/75 shadow-sm hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
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
                        data-press="true"
                        animate={showDeleteSelectionConfirm
                          ? { scale: 0.85, opacity: 0, pointerEvents: 'none', transition: FADE_OUT }
                          : { scale: 1, opacity: 1, pointerEvents: 'auto', transition: SPRING.snappy }
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
                        className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs"
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
                      transition={SPRING.snappy}
                      className="flex items-center gap-2.5"
                    >
                      {/* CRIAÇÃO OU EDIÇÃO DE COLEÇÃO (TELA CHEIA) */}
                      {(activeScreen.id === 'create-collection' || activeScreen.id === 'edit-collection') ? (
                        <div className="flex items-center gap-2.5">
                          <motion.button 
                            data-press="true" 
                            title={t('save')} 
                            onClick={handleSaveCollectionForm}
                            className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-winblue/20 hover:bg-winblue/30 text-winblue transition-all backdrop-blur-3xl font-semibold text-xs cursor-pointer"
                          >
                            <Check size={13} className="max-md:w-5 max-md:h-5" />
                            <span className="max-md:hidden">{t('save')}</span>
                          </motion.button>
                          <motion.button 
                            data-press="true" 
                            title={t('cancel')} 
                            onClick={goBack}
                            className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs cursor-pointer"
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
                                  data-press="true"
                                  animate={morphTriggerAnimate(showCollectionHeaderAddPopup)}
                                  title={t('add_to_collection')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = !showCollectionHeaderAddPopup;
                                    closeAllPopups();
                                    setShowCollectionHeaderAddPopup(next);
                                  }}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl cursor-pointer"
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
                                        className="absolute top-0 right-0 w-80 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl z-50 flex flex-col overflow-hidden"
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
                                data-press="true"
                                title={t('edit_collection')}
                                onClick={() => handleStartEditCurrentCollection()}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl cursor-pointer"
                              >
                                <Edit3 size={13} />
                              </motion.button>

                              {/* Ordenar por: mesma posição da Biblioteca (logo antes de excluir) */}
                              <div className={`relative w-9 h-9 shrink-0 ${showSortMenu ? 'z-50' : 'z-10'}`}>
                                <motion.button 
                                  ref={sortBtnRef}
                                  data-press="true"
                                  animate={morphTriggerAnimate(showSortMenu)}
                                  transition={SPRING.bouncy}
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
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                                >
                                  <ArrowUpDown size={13} />
                                </motion.button>
                              </div>

                              {/* Excluir coleção (confirmação nasce do botão, mesmo padrão de excluir audiobook) */}
                              <div className={`relative w-9 h-9 shrink-0 ${showDeleteCurrentCollectionConfirm ? 'z-50' : 'z-10'}`}>
                                <motion.button
                                  data-press="true"
                                  animate={morphTriggerAnimate(showDeleteCurrentCollectionConfirm)}
                                  title={t('delete_collection')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    closeAllPopups();
                                    setShowDeleteCurrentCollectionConfirm(true);
                                  }}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl cursor-pointer"
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
                                        className="absolute top-0 right-0 w-64 sm:w-80 bg-card/95 backdrop-blur-3xl rounded-[28px] shadow-2xl p-4 z-50 flex flex-col text-[var(--text-main)]"
                                      >
                                        <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1.5">
                                          {t('delete_collection')}
                                        </h4>
                                        <p className="text-xs text-[var(--text-muted)] px-1 mb-3">
                                          {t('delete_collections_confirm_desc')}
                                        </p>

                                        <div className="flex items-center gap-3 p-2 mb-4">
                                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${headerCol.gradient} flex items-center justify-center text-2xl shrink-0 shadow-sm select-none`}>
                                            <EmojiIcon emoji={headerCol.emoji} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[var(--text-main)] truncate">{headerCol.name}</p>
                                            {headerCol.description?.trim() && <p className="text-xs text-[var(--text-muted)] truncate">{headerCol.description.trim()}</p>}
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2.5 pt-1">
                                          <motion.button
                                            data-press="true"
                                            onClick={() => {
                                              setShowDeleteCurrentCollectionConfirm(false);
                                              handleDeleteCollection(headerCol.id);
                                            }}
                                            className="h-8 px-4 rounded-full bg-card/75 shadow-md hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <Trash2 size={13} />
                                            <span>{t('delete')}</span>
                                          </motion.button>
                                          <motion.button
                                            data-press="true"
                                            onClick={() => setShowDeleteCurrentCollectionConfirm(false)}
                                            className="h-8 px-4 rounded-full bg-card/75 shadow-sm hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
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
                            data-press="true" 
                            title={t('add_collection')} 
                            onClick={() => handleStartCreateCollection()}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl cursor-pointer"
                          >
                            <Plus size={14} />
                          </motion.button>
                          {/* Ordenar por: mesma posição da Biblioteca (logo antes de excluir) */}
                          <div className={`relative w-9 h-9 shrink-0 ${showSortMenu ? 'z-50' : 'z-10'}`}>
                            <motion.button 
                              ref={sortBtnRef}
                              data-press="true"
                              animate={morphTriggerAnimate(showSortMenu)}
                              transition={SPRING.bouncy}
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
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                            >
                              <ArrowUpDown size={13} />
                            </motion.button>
                          </div>
                          {collections.length > 0 && (
                            <motion.button 
                              data-press="true" 
                              title={t('delete_collections')} 
                              onClick={() => {
                                setIsSelectionMode(true);
                                setSelectedCollectionIds([]);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl"
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
                                data-press="true"
                                title={t('upload_audiobooks')}
                                onClick={() => fileInputRef.current?.click()} 
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                              >
                                <Upload size={13} />
                              </motion.button>
                              {IS_INSTALLED_APP && activeScreen.id.startsWith('library') && (
                                <motion.button
                                  data-press="true"
                                  title={t('sync_now')}
                                  onClick={() => handleSyncLibraryNow()}
                                  className={`w-9 h-9 flex items-center justify-center rounded-full shadow-xl transition-all backdrop-blur-3xl cursor-pointer ${
                                    isSyncingLibrary
                                      ? 'bg-winblue/20 text-winblue '
                                      : 'bg-card/75 hover:bg-[var(--hover-fill)] text-[var(--text-main)]'
                                  }`}
                                >
                                  <RefreshCw size={13} className={isSyncingLibrary ? "animate-spin text-winblue" : ""} />
                                </motion.button>
                              )}
                              <div className={`relative w-9 h-9 shrink-0 ${showSortMenu ? 'z-50' : 'z-10'}`}>
                                <motion.button 
                                  ref={sortBtnRef}
                                  data-press="true"
                                  animate={morphTriggerAnimate(showSortMenu)}
                                  transition={SPRING.bouncy}
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
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                                >
                                  <ArrowUpDown size={13} />
                                </motion.button>
                              </div>
                              <motion.button 
                                data-press="true"
                                title={t('delete_multiple')}
                                onClick={() => setIsSelectionMode(true)} 
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl"
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
                                  data-press="true" 
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
                                      ? 'bg-winblue/20 text-winblue '
                                      : 'bg-card/75 text-[var(--text-main)] hover:bg-[var(--hover-fill)] '
                                  }`}
                                >
                                  <FolderPlus size={14} />
                                </motion.button>
                              </div>

                              <motion.button 
                                data-press="true" 
                                title={favoriteAuthorIds.includes(activeScreen.data?.id) ? t('remove_favorite_author') : t('favorite_author')}
                                onClick={() => {
                                  if (activeScreen.data?.id) toggleFavoriteAuthor(activeScreen.data.id);
                                }}
                                className={`w-9 h-9 flex items-center justify-center rounded-full shadow-xl transition-all backdrop-blur-3xl ${
                                  favoriteAuthorIds.includes(activeScreen.data?.id)
                                    ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30'
                                    : 'bg-card/75 text-[var(--text-main)] hover:bg-[var(--hover-fill)] '
                                }`}
                              >
                                <Star size={14} className={favoriteAuthorIds.includes(activeScreen.data?.id) ? "fill-yellow-400 text-yellow-400" : ""} />
                              </motion.button>
                              <motion.button 
                                data-press="true" 
                                title={t('edit_author')} 
                                onClick={handleStartEditAuthor}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                              >
                                <Edit3 size={13} />
                              </motion.button>
                              <motion.button 
                                data-press="true" 
                                title={t('delete_multiple')}
                                onClick={() => setIsSelectionMode(true)} 
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl"
                              >
                                <Trash2 size={13} />
                              </motion.button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <motion.button 
                                data-press="true" 
                                title={t('save_changes')} 
                                onClick={handleSaveAuthorEdits}
                                className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-winblue/20 hover:bg-winblue/30 text-winblue transition-all backdrop-blur-3xl font-semibold text-xs"
                              >
                                <Check size={13} className="max-md:w-5 max-md:h-5" />
                                <span className="max-md:hidden">{t('save')}</span>
                              </motion.button>
                              <motion.button 
                                data-press="true" 
                                title={t('cancel_edit')} 
                                onClick={handleCancelAuthorEdits}
                                className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs"
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
                                  data-press="true" 
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
                                      ? 'bg-winblue/20 text-winblue '
                                      : 'bg-card/75 text-[var(--text-main)] hover:bg-[var(--hover-fill)] '
                                  }`}
                                >
                                  <FolderPlus size={14} />
                                </motion.button>
                              </div>

                              <motion.button 
                                data-press="true" 
                                title={favoriteBookIds.includes((activeScreen.data || selectedBook)?.id) ? t('remove_from_favorites') : t('favorite')} 
                                onClick={() => {
                                  const target = activeScreen.data || selectedBook;
                                  if (target) toggleFavoriteBook(target.id);
                                }}
                                className={`w-9 h-9 flex items-center justify-center rounded-full shadow-xl transition-all backdrop-blur-3xl ${
                                  favoriteBookIds.includes((activeScreen.data || selectedBook)?.id)
                                    ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30'
                                    : 'bg-card/75 text-[var(--text-main)] hover:bg-[var(--hover-fill)] '
                                }`}
                              >
                                <Star size={14} className={favoriteBookIds.includes((activeScreen.data || selectedBook)?.id) ? "fill-yellow-400 text-yellow-400" : "text-[var(--text-main)]"} />
                              </motion.button>
                              <motion.button 
                                data-press="true" 
                                title={t('edit_audiobook')} 
                                onClick={handleStartEditBook}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
                              >
                                <Edit3 size={13} />
                              </motion.button>
                              {/* Compartilhar: imagem do audiobook ou de um trecho do texto (formato de story) */}
                              <div className={`relative w-9 h-9 ${showShareBookMenu ? 'z-50' : 'z-10'}`}>
                                <motion.button
                                  key="btn"
                                  data-press="true"
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
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
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
                                        className="absolute top-0 right-0 w-60 bg-card/95 backdrop-blur-3xl rounded-[20px] shadow-2xl p-1.5 z-50 flex flex-col"
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
                                  data-press="true" 
                                  animate={morphTriggerAnimate(showBookDetailsPopup)}
                                  title={t('more_details')} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    closeAllPopups();
                                    setShowBookDetailsPopup(true);
                                  }}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
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
                                        className="absolute top-0 right-0 w-64 sm:w-80 bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl p-4 z-50 flex flex-col"
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
                                  data-press="true" 
                                  animate={morphTriggerAnimate(showDeleteBookDetailConfirm)}
                                  title={t('delete')} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    closeAllPopups();
                                    setShowDeleteBookDetailConfirm(true);
                                  }} 
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl"
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
                                        className="absolute top-0 right-0 w-64 sm:w-80 bg-card/95 backdrop-blur-3xl rounded-[28px] shadow-2xl p-4 z-50 flex flex-col"
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
                                            data-press="true"
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
                                            className="h-8 px-4 rounded-full bg-card/75 shadow-md hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                          >
                                            <Trash2 size={13} />
                                            <span>{t('delete')}</span>
                                          </motion.button>
                                          <motion.button
                                            data-press="true"
                                            onClick={() => setShowDeleteBookDetailConfirm(false)}
                                            className="h-8 px-4 rounded-full bg-card/75 shadow-sm hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
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
                                data-press="true" 
                                title={t('save_changes')} 
                                onClick={handleSaveBookEdits}
                                className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-winblue/20 hover:bg-winblue/30 text-winblue transition-all backdrop-blur-3xl font-semibold text-xs"
                              >
                                <Check size={13} className="max-md:w-5 max-md:h-5" />
                                <span className="max-md:hidden">{t('save')}</span>
                              </motion.button>
                              <motion.button 
                                data-press="true" 
                                title={t('cancel_edit')} 
                                onClick={handleCancelBookEdits}
                                className="px-3.5 max-md:px-0 max-md:w-11 h-9 flex items-center justify-center gap-1.5 rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs"
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
                              data-press="true"
                              animate={morphTriggerAnimate(showResetSettingsConfirm)}
                              title={t('settings_reset')} 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                closeAllPopups();
                                setShowResetSettingsConfirm(true); 
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
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
                                    className="absolute top-0 right-0 w-64 sm:w-80 bg-card/95 backdrop-blur-3xl rounded-[28px] shadow-2xl p-4 z-50 flex flex-col text-[var(--text-main)]"
                                  >
                                    <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1.5">
                                      {t('settings_reset_confirm_title')}
                                    </h4>
                                    <p className="text-xs text-[var(--text-muted)] px-1 mb-4">
                                      {t('settings_reset_confirm_desc')}
                                    </p>

                                    <div className="flex items-center justify-end gap-2.5 pt-1">
                                      <motion.button
                                        data-press="true"
                                        onClick={() => {
                                          handleResetSettings();
                                          setShowResetSettingsConfirm(false);
                                        }}
                                        className="h-8 px-4 rounded-full bg-card/75 shadow-md hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                      >
                                        <RotateCcw size={13} />
                                        <span>{t('settings_reset_btn')}</span>
                                      </motion.button>
                                      <motion.button
                                        data-press="true"
                                        onClick={() => setShowResetSettingsConfirm(false)}
                                        className="h-8 px-4 rounded-full bg-card/75 shadow-sm hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
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
                            data-press="true"
                            onClick={() => {
                              if ((window as any).electron) {
                                (window as any).electron.closeApp();
                              } else {
                                showToast(t('close_desktop_only'));
                              }
                            }}
                            className="px-3.5 h-9 flex items-center justify-center gap-1.5 rounded-full bg-card/75 shadow-xl hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs"
                          >
                            <Power size={13} />
                            <span>{t('close_app')}</span>
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
            </div>
          </div>

          {/* Fundo Desfocado Ambiente para Detalhes do Audiobook e Detalhes do Autor (fora da animação de escala da página) */}
          <AnimatePresence>
            {(activeScreen.id === 'book-detail' || activeScreen.id === 'book-synopsis') && (() => {
              const currentTargetBook = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
              return (
                <motion.div
                  key={`book-detail-bg-blur-${currentTargetBook?.id || 'default'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={FADE_IN}
                  className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
                >
                  {/* Cor sólida da capa (a mesma do cabeçalho), em tom escuro ou claro conforme o tema */}
                  <div className="absolute inset-0" style={{ backgroundColor: headerTintColor || 'var(--bg-mica)' }} />
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
                  transition={FADE_IN}
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
            {activeScreen.id.startsWith('library-colecao-') && (() => {
              const colId = activeScreen.id.replace('library-colecao-', '');
              const col = collections.find(c => c.id === colId) || (activeScreen.data as Collection | undefined);
              if (!col) return null;
              return (
                <motion.div
                  key={`collection-bg-${col.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={FADE_IN}
                  className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${col.gradient} opacity-[0.16] dark:opacity-[0.28] dark:mix-blend-screen`} />
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
          {activeScreen.id === 'search' && <SearchScreen key={"screen-search"} />}

          {/* SCREEN: HOME */}
          {activeScreen.id === 'home' && <HomeScreen key={(books.length === 0) ? "home-empty" : activeScreen.id} />}

          {/* SCREEN: LIBRARY */}
          {activeScreen.id === 'library' && <LibraryScreen key={(books.length === 0) ? "library-empty" : activeScreen.id} />}

          {/* SCREEN: HISTORY, SUB-LIBRARIES & HOME SUBMENUS */}
          {(activeScreen.id === 'history' || activeScreen.id.startsWith('library-') || activeScreen.id.startsWith('home-')) && <LibraryListsScreen key={activeScreen.id} />}

          {/* SCREEN: CRIAR OU EDITAR COLEÇÃO (MESMO PADRÃO DE EDITAR AUDIOBOOK/AUTOR) */}
          {(activeScreen.id === 'create-collection' || activeScreen.id === 'edit-collection') && <CollectionEditorScreen key={activeScreen.id} />}

          {/* SCREEN: BOOK DETAIL */}
          {activeScreen.id === 'book-detail' && <BookDetailScreen key={"BookDetailScreen"} />}

          {/* SCREEN: BOOK SYNOPSIS (SUBMENU) */}
          {activeScreen.id === 'book-synopsis' && <BookSynopsisScreen key={"screen-book-synopsis"} />}

          {/* SCREEN: AUTHOR DETAIL */}
          {activeScreen.id === 'author-detail' && activeScreen.data && <AuthorDetailScreen key={`author-detail-${activeScreen.data.id}`} />}

          {/* SUBMENUS EM TELA CHEIA (CELULAR): o que no computador abre como pop-up com "voltar" */}
          {activeScreen.id === 'book-info' && activeScreen.data && <BookInfoScreen key={"book-info"} />}

          {activeScreen.id === 'app-info' && activeScreen.data && <AppInfoScreen key={"app-info"} />}

          {/* SCREEN: SETTINGS (LAZY-LOADED) */}
          {/* SCREEN: OPÇÕES DE UM AJUSTE (MOBILE) — tela cheia com as opções e suas explicações */}
          {activeScreen.id === 'settings-option' && activeScreen.data && <SettingsOptionScreen key={"settings-option"} />}

          {activeScreen.id.startsWith('settings') && activeScreen.id !== 'settings-atalhos' && activeScreen.id !== 'settings-option' && <SettingsScreen key={"SettingsScreen"} />}
            {/* SCREEN: OUTROS (MOBILE) — itens do menu lateral que não estão na barra de abas */}
            {activeScreen.id === 'more' && <MoreScreen key={activeScreen.id} />}

            {/* SCREEN: OTHER APPS */}
            {activeScreen.id === 'other-apps' && <OtherAppsScreen key={activeScreen.id} />}

            {/* SCREEN: HELP SCREENS (LAZY-LOADED) */}
            {(activeScreen.id === 'help' || activeScreen.id === 'help-theme' || activeScreen.id === 'help-article' || activeScreen.id === 'help-atalhos' || activeScreen.id === 'settings-atalhos') && <HelpScreen key={"HelpScreen"} />}

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
              isQueuePulse={isQueuePulse}
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
                audioRef={audioRef}
                showToast={showToast}
                onShareLine={(line) => openShareImage('quote', currentBook, [transcriptLineText(line)])}
                onAddLineBookmark={addLineBookmark}
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
              />
          )
        )}
      </AnimatePresence>

      {/* TELA CHEIA DE BOAS-VINDAS E AJUSTES INICIAIS (1ª ABERTURA DO APP) */}
        {/* Novidades da versão: uma vez, depois de o app ser atualizado */}
        {!showOnboarding && <WhatsNewScreen language={resolvedLanguage} t={t} />}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            key="first-launch-onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="ambient-screen fixed inset-0 z-[5000] overflow-hidden flex flex-col text-white select-none"
          >
            <AmbientBackground />

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
                    {/* Título no mesmo formato do topo do menu lateral (ícone + Player) */}
                    <motion.div
                      initial={{ scale: 0.92, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={SPRING.snappy}
                      className="flex items-baseline text-white md: tracking-tight mb-2 gap-[2px] text-[42px] leading-none"
                    >
                      <AppLogo className="text-white shrink-0" />
                      <span className="font-normal">Player</span>
                    </motion.div>

                    {/* Subtítulo: 'Bem-vindo!' e descrição breve do app */}
                    <h2 className="text-xl sm:text-2xl font-semibold text-white/95 tracking-tight mt-1">
                      {t('welcome_subtitle_short')}
                    </h2>
                    <p className="text-sm sm:text-base text-white/70 mt-2 max-w-md leading-relaxed">
                      {t('welcome_app_description')}
                    </p>

                    {/* Opção de selecionar ou confirmar idioma (apenas 'Idioma' sem legenda) */}
                    <div className="w-full max-w-md mt-8 p-4 rounded-[26px] bg-white/[0.07] backdrop-blur-3xl shadow-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0 text-left rtl:text-right">
                        <div className="w-10 h-10 rounded-full bg-winblue/20 text-winblue flex items-center justify-center shrink-0 ">
                          <Globe size={20} />
                        </div>
                        <span className="text-sm font-semibold text-white truncate">
                          {t('settings_language')}
                        </span>
                      </div>

                      <motion.button
                        data-press="true"
                        animate={morphTriggerAnimate(activeSettingSelector?.id === 'app-language')}
                        transition={SPRING.bouncy}
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
                        className="h-9 pl-4 pr-3 rounded-full bg-white/12 hover:bg-[var(--hover-fill)] backdrop-blur-3xl text-white flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 shadow-sm cursor-pointer"
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
                        data-press="true"
                        onClick={completeOnboarding}
                        className="w-full sm:flex-1 h-12 px-6 rounded-full bg-winblue/25 hover:bg-winblue/35 text-winblue font-semibold text-sm flex items-center justify-center gap-2.5 transition-all backdrop-blur-3xl cursor-pointer"
                      >
                        <span>{t('go_to_app')}</span>
                        <ArrowRight size={18} className="shrink-0 text-winblue rtl:rotate-180" />
                      </motion.button>

                      <motion.button
                        data-press="true"
                        onClick={() => {
                          setActiveSettingSelector(null);
                          setOnboardingStep('settings');
                        }}
                        className="w-full sm:flex-1 h-12 px-6 rounded-full bg-white/10 hover:bg-[var(--hover-fill)] backdrop-blur-3xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
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
            className="bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl p-2 z-[9999] flex flex-col text-left rtl:text-right overflow-hidden text-[var(--text-main)]"
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
                    className={`relative w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-2xl select-none transition-all duration-150 group ${
                      isSelected
                        ? 'hover:bg-winblue/25 '
                        : 'hover:bg-[var(--hover-fill)] '
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="setting-active-pill"
                        className="absolute inset-0 bg-winblue/15 rounded-2xl pointer-events-none z-0"
                        transition={SPRING.snappy}
                      />
                    )}
                    <div className={`relative z-10 flex items-center gap-2.5 transition-colors min-w-0 ${isSelected ? 'text-winblue font-bold' : 'text-[var(--text-main)] group-hover:text-white '}`}>
                      {option.icon ? (
                        <span className={`transition-colors shrink-0 ${isSelected ? 'text-winblue' : 'text-[var(--text-muted)] group-hover:text-white'}`}>
                          {option.icon}
                        </span>
                      ) : option.colorPreview ? (
                        <div 
                          className="w-4 h-4 rounded-full shrink-0 shadow-sm"
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
                        transition={SPRING.snappy}
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
              exit={{ opacity: 0, scale: 0.94, y: 8, transition: FADE_OUT }}
              transition={SPRING.snappy}
              data-popup-content="true"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card/90 backdrop-blur-3xl rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between mb-4 pb-2 ">
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
                <div className=" pt-3">
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
              <div className="mt-6 pt-3 flex justify-end">
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
            className="w-64 bg-card/95 backdrop-blur-3xl rounded-[20px] shadow-2xl z-[9999] overflow-hidden"
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
            className="w-64 bg-card/95 backdrop-blur-3xl rounded-[20px] shadow-2xl z-[9999] overflow-hidden"
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
            className="w-52 bg-card/95 backdrop-blur-3xl rounded-[20px] shadow-2xl z-[9999] p-1.5 flex flex-col text-left overflow-hidden"
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
          // guardado no aparelho e retoma do mesmo ponto
          if (audioRef.current?.src.includes('#t=')) noFragmentRef.current = true;
          recoverAudio('erro');
        }}
        // iPhone: o áudio só carrega no primeiro play; a posição salva é aplicada assim que ele começa
        onPlay={() => {
          if (audioRef.current) applyPendingSeek(audioRef.current, 'play');
        }}
        onPlaying={() => {
          if (audioRef.current) verifySeek(audioRef.current, 'tocando');
        }}
        onSeeked={() => {
          if (audioRef.current) verifySeek(audioRef.current, 'seeked');
        }}
        onLoadedMetadata={() => {
          const a = audioRef.current;
          if (!a) return;
          diag('carregou', { dur: a.duration, pendente: pendingSeekRef.current, ready: a.readyState, agora: a.currentTime, arquivo: (currentBook?.fileName || '').split('.').pop(), letra: currentBook?.transcript?.length || 0, palavras: Boolean(currentBook?.transcript?.some(l => l.words?.length)), origem: currentBook?.transcriptSource, fimLetra: currentBook?.transcript?.[currentBook.transcript.length - 1]?.end, capitulos: currentBook?.chapters?.length, velocidade: a.playbackRate });
          if (a.playbackRate !== playbackSpeed) a.playbackRate = playbackSpeed;
          reconcileBookDuration(a);
          applyPendingSeek(a, 'loadedmetadata');
        }}
        onDurationChange={() => {
          if (audioRef.current) reconcileBookDuration(audioRef.current);
        }}
        onCanPlay={() => {
          if (audioRef.current) {
            applyPendingSeek(audioRef.current, 'canplay');
            verifySeek(audioRef.current, 'canplay');
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
                transition={FADE_IN}
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
                    data-press="true"
                    onClick={closeSharePreview}
                    aria-label={t('back')}
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 text-white backdrop-blur-3xl"
                  >
                    <ChevronLeft size={20} className="rtl:rotate-180" />
                  </motion.button>
                </div>
                <div className="flex-1 min-h-0 w-full flex items-center justify-center py-4">
                  <motion.img
                    initial={{ scale: 0.94, y: 12 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={SPRING.snappy}
                    src={sharePreview.url}
                    alt=""
                    className="max-h-full max-w-full aspect-[9/16] rounded-[24px] object-contain shadow-2xl"
                  />
                </div>
                <div className="shrink-0 flex items-center justify-center gap-2.5 pb-1">
                  <motion.button
                    data-press="true"
                    onClick={() => { if (shareBlobRef.current) downloadShareBlob(shareBlobRef.current, sharePreview.fileName); }}
                    className="h-10 px-4 rounded-full bg-white/10 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap backdrop-blur-3xl"
                  >
                    <Download size={15} />
                    <span>{t('save_image')}</span>
                  </motion.button>
                  <motion.button
                    data-press="true"
                    onClick={async () => {
                      if (!shareBlobRef.current) return;
                      const result = await shareStoryBlob(shareBlobRef.current, sharePreview.fileName, sharePreview.title);
                      if (result === 'downloaded') showToast(t('image_saved'));
                    }}
                    className="h-10 px-5 rounded-full bg-winblue/25 text-winblue text-[13px] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap"
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
                    data-press="true"
                    onClick={(e) => { e.stopPropagation(); const c = mobileConfirm; setMobileConfirm(null); c.onConfirm(); }}
                    className="h-8 px-4 rounded-full bg-card/75 shadow-md text-red-500 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>{mobileConfirm.confirmLabel}</span>
                  </motion.button>
                  <motion.button
                    data-press="true"
                    onClick={(e) => { e.stopPropagation(); setMobileConfirm(null); }}
                    className="h-8 px-4 rounded-full bg-card/75 shadow-sm text-[var(--text-main)] font-semibold text-xs flex items-center gap-1.5"
                  >
                    <X size={13} />
                    <span>{t('cancel')}</span>
                  </motion.button>
                </div>
              </div>
            </MobileConfirmCard>
          )}
        </AnimatePresence>

        {/* Cancelar todos os audiobooks sendo adicionados (por cima da folha) */}
        <ImportCancelAllConfirm />

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
              headerAction={content?.headerAction}
            >
              {content?.body}
            </MobileSheet>
          );
        })()}
      </CollectionsContext.Provider>
    </I18nContext.Provider>
</AppScopeContext.Provider>
  );
}
