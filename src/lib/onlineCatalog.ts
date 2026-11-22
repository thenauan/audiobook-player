// ===== Dados e sugestões da internet =====
// Fontes gratuitas, sem conta e sem chave:
// - Open Library (openlibrary.org): dados de livros (ano, assuntos, sinopse e capa) para completar os audiobooks.
// - Internet Archive (archive.org): audiobooks da LibriVox (gratuitos, com M4B pronto para baixar) e ebooks do
//   Project Gutenberg (só para ler online). Tudo em domínio público.
// Todas as buscas têm tempo limite, ficam guardadas no aparelho e falham em silêncio (sem internet, nada aparece).
// Só o título e o autor do livro consultado (ou os gostos resumidos, para as sugestões) saem do aparelho.
import { useSyncExternalStore } from 'react';
import { mp3AudioFrames, buildChapteredMp3, type Mp3Part } from '../audio/tagWriter';

// ---------- Ajuste: liga/desliga ----------
const PREF_KEY = 'app_online_data';
const prefListeners = new Set<() => void>();
let enabled = (() => { try { return localStorage.getItem(PREF_KEY) !== 'false'; } catch { return true; } })();
export const onlineData = {
  get: () => enabled,
  set(next: boolean) {
    enabled = next;
    try { localStorage.setItem(PREF_KEY, String(next)); } catch { /* sem armazenamento */ }
    prefListeners.forEach(l => l());
  },
  subscribe(l: () => void) { prefListeners.add(l); return () => { prefListeners.delete(l); }; },
};
export const useOnlineData = () => useSyncExternalStore(onlineData.subscribe, onlineData.get, onlineData.get);

// ---------- Utilidades ----------
export const fold = (s?: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/\(.*?\)|\[.*?\]/g, ' ').replace(/[^a-z0-9Ѐ-ӿ؀-ۿ]+/g, ' ').trim();
// Título sem subtítulo ("Dom Casmurro: romance" → "dom casmurro")
const baseTitle = (s?: string) => fold((s || '').split(/[:;]| - /)[0]);
const surname = (author?: string) => {
  const a = (author || '').split(/[,&;]| e | and /)[0].trim();
  // "Assis, Machado de" (formato de catálogo) ou "Machado de Assis"
  const parts = fold(a.includes(',') ? a.split(',')[0] : a).split(' ').filter(w => w.length > 2);
  return parts[parts.length - 1] || '';
};
export const authorMatches = (a?: string, b?: string) => {
  const sa = surname(a); const sb = surname(b);
  if (!sa || !sb) return false;
  return sa === sb || fold(a).includes(sb) || fold(b).includes(sa);
};
export const titleMatches = (a?: string, b?: string) => {
  const x = baseTitle(a); const y = baseTitle(b);
  return Boolean(x) && x === y;
};

async function getJson<T>(url: string, timeoutMs = 9000): Promise<T | null> {
  if (typeof fetch === 'undefined' || (typeof navigator !== 'undefined' && navigator.onLine === false)) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const CACHE_PREFIX = 'online_cache_v4:';
function cacheGet<T>(key: string, ttlMs: number): T | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const { t, v } = JSON.parse(raw);
    return Date.now() - t < ttlMs ? v as T : undefined;
  } catch { return undefined; }
}
function cacheSet(key: string, v: unknown) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), v })); } catch { /* cheio */ }
}
const DAY = 24 * 60 * 60 * 1000;

// Sinopse sem créditos ("- Summary by Fulano"), sem marcação de texto (**negrito**, [link](url)) e sem fontes
const cleanSynopsis = (text: string) => text
  .replace(/\s*[-–(]\s*Summary by [^)\n]*\)?\s*$/gim, '')
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/^-{3,}[\s\S]*$/m, '')
  .trim();

const stripHtml = (html?: string) => {
  if (!html) return '';
  const text = String(Array.isArray(html) ? html.join('\n') : html)
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div)>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return text.split('\n').map(l => l.trim()).filter(Boolean).join('\n\n').trim();
};

// ---------- Idiomas ----------
// Nome do idioma no app (como em normalizeAudiobookLanguage) ↔ códigos do Internet Archive
const LANGS: { app: string; ia: string[] }[] = [
  { app: 'Português', ia: ['por', 'pt', 'Portuguese'] }, { app: 'Inglês', ia: ['eng', 'en', 'English'] },
  { app: 'Espanhol', ia: ['spa', 'es', 'Spanish'] }, { app: 'Francês', ia: ['fre', 'fr', 'French'] },
  { app: 'Alemão', ia: ['ger', 'de', 'German'] }, { app: 'Italiano', ia: ['ita', 'it', 'Italian'] },
  { app: 'Russo', ia: ['rus', 'ru', 'Russian'] }, { app: 'Árabe', ia: ['ara', 'ar', 'Arabic'] },
  { app: 'Holandês', ia: ['dut', 'nl', 'Dutch'] }, { app: 'Latim', ia: ['lat', 'la', 'Latin'] },
  { app: 'Grego', ia: ['gre', 'el', 'Greek'] }, { app: 'Japonês', ia: ['jpn', 'ja', 'Japanese'] }, { app: 'Chinês', ia: ['chi', 'zh', 'Chinese'] },
];
const iaToApp = (code?: string | string[]) => {
  const c = (Array.isArray(code) ? code[0] : code || '').toLowerCase();
  return LANGS.find(l => l.ia.some(x => x.toLowerCase() === c))?.app;
};

// ---------- Gêneros ----------
// Gênero do app → palavras dos assuntos (subject) da LibriVox, Gutenberg e Open Library
const GENRE_KEYWORDS: Record<string, string[]> = {
  'Ficção': ['fiction', 'ficcao', 'novel', 'romance'], 'Romance': ['romance', 'love'],
  'Fantasia': ['fantasy', 'fantasia', 'fairy'], 'Ficção Científica': ['science fiction', 'ficcao cientifica'],
  'Mistério': ['mystery', 'detective', 'misterio', 'crime'], 'Suspense': ['thriller', 'suspense'],
  'Terror': ['horror', 'ghost', 'terror', 'gothic'], 'Aventura': ['adventure', 'aventura'],
  'Poesia': ['poetry', 'poesia', 'poems'], 'Drama': ['drama', 'plays', 'teatro'],
  'Humor': ['humor', 'humour', 'comedy'], 'Infantil': ['children', 'infantil', 'juvenile'],
  'História': ['history', 'historia', 'historical'], 'Biografia': ['biography', 'memoir', 'biografia', 'autobiography'],
  'Filosofia': ['philosophy', 'filosofia'], 'Religião': ['religion', 'bible', 'religiao', 'christian'],
  'Ciência': ['science', 'ciencia', 'nature'], 'Autoajuda': ['self-help', 'self help', 'autoajuda'],
};
export function genreFromSubjects(subjects: string[]): string | undefined {
  const s = subjects.map(fold).join(' | ');
  // Mais específicos primeiro
  for (const g of ['Ficção Científica', 'Fantasia', 'Terror', 'Mistério', 'Suspense', 'Poesia', 'Drama', 'Biografia', 'Infantil', 'Aventura', 'Humor', 'Filosofia', 'Religião', 'História', 'Romance', 'Ficção']) {
    if (GENRE_KEYWORDS[g].some(k => s.includes(fold(k)))) return g;
  }
  return undefined;
}

// ---------- Itens do Internet Archive ----------
export interface OnlineItem {
  id: string;
  kind: 'audiobook' | 'ebook';
  title: string;
  author: string;
  language?: string;
  cover: string;
  year?: string;
  subjects: string[];
  url: string;
  // De onde vem: Internet Archive (gratuito) ou Apple Books (à venda, com preço e link da loja)
  source?: 'archive' | 'apple';
  price?: string;
  priceValue?: number;
  // Tamanho aproximado do download (MP3 dos capítulos, cerca de 1/3 do item inteiro no Internet Archive)
  sizeBytes?: number;
  description?: string;
  genre?: string;
}
export interface OnlineItemDetails extends OnlineItem {
  description: string;
  narrator?: string;
  runtime?: string;
  // O que dá para baixar (os MP3 de cada capítulo, que o site consegue baixar; o M4B não libera o acesso do navegador)
  m4b?: { name: string; size: number; url: string };
  parts?: { name: string; title: string; size: number; url: string }[];
  coverUrl?: string;
}

const coverOf = (id: string) => `https://archive.org/services/img/${encodeURIComponent(id)}`;
const asList = (v: unknown): string[] => (Array.isArray(v) ? v : v ? [v] : []).flatMap(x => String(x).split(/;\s*/)).map(x => x.trim()).filter(Boolean);
const cleanTitle = (t: string) => t.replace(/\s*\((version \d+|dramatic reading|solo|abridged)\)\s*$/i, '').trim();
const cleanAuthor = (a: string) => {
  // "Assis, Machado de, 1839-1908" → "Machado de Assis"
  const noDates = a.replace(/,?\s*\d{3,4}\s*-\s*\d{0,4}\??/g, '').trim().replace(/,$/, '');
  const m = /^([^,]+),\s*([^,]+)$/.exec(noDates);
  return m ? `${m[2].trim()} ${m[1].trim()}` : noDates;
};

function toItem(doc: any, kind: OnlineItem['kind']): OnlineItem | null {
  const title = cleanTitle(String(Array.isArray(doc.title) ? doc.title[0] : doc.title || '').trim());
  if (!doc.identifier || !title) return null;
  const subjects = asList(doc.subject).filter(s => !/^(librivox|audiobooks?|gutenberg)$/i.test(s));
  return {
    id: String(doc.identifier),
    kind,
    title,
    author: cleanAuthor(asList(doc.creator)[0] || ''),
    language: iaToApp(doc.language),
    cover: coverOf(String(doc.identifier)),
    year: doc.year ? String(doc.year).slice(0, 4) : undefined,
    sizeBytes: kind === 'audiobook' && doc.item_size ? Math.round(Number(doc.item_size) / 3) : undefined,
    subjects,
    url: `https://archive.org/details/${encodeURIComponent(String(doc.identifier))}`,
  };
}

async function searchArchive(query: string, kind: OnlineItem['kind'], rows = 24, sort: 'downloads' | 'addeddate' = 'downloads'): Promise<OnlineItem[]> {
  const fl = ['identifier', 'title', 'creator', 'language', 'subject', 'year', 'item_size'].map(f => `fl[]=${f}`).join('&');
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&${fl}&sort[]=${sort}+desc&rows=${rows}&output=json`;
  const data = await getJson<any>(url);
  return (data?.response?.docs || []).map((d: any) => toItem(d, kind)).filter(Boolean) as OnlineItem[];
}

// ---------- Sugestões ----------
export interface TasteProfile {
  languages: string[]; // nomes do app, por ordem de uso
  genres: string[];    // gêneros do app, por ordem de uso
  subgenres: string[];
  authors: string[];   // autores da biblioteca, por ordem de uso
  favoriteAuthors: string[];
  favoriteTitles: string[];
  owned: { title: string; author: string }[];
}

const quoteTerm = (s: string) => `"${s.replace(/"/g, '')}"`;
// ---------- Apple Books (à venda) ----------
const COUNTRY: Record<string, string> = { 'Português': 'br', 'Inglês': 'us', 'Espanhol': 'es', 'Francês': 'fr', 'Alemão': 'de', 'Italiano': 'it', 'Russo': 'ru', 'Japonês': 'jp', 'Holandês': 'nl' };
const appleGenre = (g?: string) => g && !/^(books|livros|audiobooks)$/i.test(g) ? g : undefined;
async function searchApple(term: string, media: 'ebook' | 'audiobook', country: string, limit = 20): Promise<OnlineItem[]> {
  if (!term.trim()) return [];
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=${media}&country=${country}&limit=${limit}`;
  const data = await getJson<any>(url);
  return (data?.results || []).map((r: any): OnlineItem | null => {
    const title = String(r.trackName || r.collectionName || '').trim();
    const id = String(r.trackId || r.collectionId || '');
    if (!title || !id) return null;
    const price = r.formattedPrice || (typeof (r.price ?? r.collectionPrice) === 'number'
      ? new Intl.NumberFormat(undefined, { style: 'currency', currency: r.currency || 'USD' }).format(r.price ?? r.collectionPrice) : undefined);
    return {
      id: `apple-${id}`,
      kind: media === 'audiobook' ? 'audiobook' : 'ebook',
      title,
      author: String(r.artistName || '').replace(/\s*&\s*/g, ', '),
      cover: String(r.artworkUrl100 || r.artworkUrl60 || '').replace(/\/\d+x\d+(bb)?\.(jpg|png)$/, '/600x600bb.$2'),
      year: r.releaseDate ? String(r.releaseDate).slice(0, 4) : undefined,
      subjects: (r.genres || [r.primaryGenreName]).filter(Boolean),
      genre: appleGenre(r.primaryGenreName) || appleGenre((r.genres || [])[0]),
      url: String(r.trackViewUrl || r.collectionViewUrl || ''),
      source: 'apple',
      price: price && Number(r.price ?? r.collectionPrice) > 0 ? price : undefined,
      priceValue: Number(r.price ?? r.collectionPrice) > 0 ? Number(r.price ?? r.collectionPrice) : undefined,
      description: stripHtml(r.description || r.longDescription || ''),
      language: undefined,
    };
  }).filter(Boolean) as OnlineItem[];
}

// ---------- Afinidade: do mais provável de gostar para o menos ----------
function affinity(profile: TasteProfile, it: OnlineItem): number {
  let score = 0;
  const author = it.author;
  if (profile.favoriteAuthors.some(a => authorMatches(a, author))) score += 8;
  else if (profile.authors.some(a => authorMatches(a, author))) score += 5;
  const subj = it.subjects.map(fold).join(' | ') + ' | ' + fold(it.genre);
  profile.genres.slice(0, 4).forEach((g, idx) => {
    if ((GENRE_KEYWORDS[g] || [g]).some(k => subj.includes(fold(k)))) score += 4 - idx * 0.7;
  });
  profile.subgenres.slice(0, 4).forEach(sg => { if (subj.includes(fold(sg))) score += 2; });
  if (it.language && profile.languages[0] === it.language) score += 3;
  else if (it.language && profile.languages.includes(it.language)) score += 1.5;
  // Títulos parecidos com os favoritos (palavras em comum)
  const words = new Set(fold(it.title).split(' ').filter(w => w.length > 3));
  if (profile.favoriteTitles.some(t => fold(t).split(' ').some(w => w.length > 3 && words.has(w)))) score += 1.5;
  return score;
}
const rank = (profile: TasteProfile, items: OnlineItem[]) =>
  items.map((it, i) => ({ it, s: affinity(profile, it) - i * 0.01 })).sort((a, b) => b.s - a.s).map(x => x.it);

export interface OnlineSection { id: string; titleKey: string; titleVars?: Record<string, string>; items: OnlineItem[] }

// Mistura listas sem repetir (mesmo título e autor)
function mergeUnique(lists: OnlineItem[][]): OnlineItem[] {
  const out: OnlineItem[] = [];
  const seen = new Set<string>();
  const max = Math.max(0, ...lists.map(l => l.length));
  for (let i = 0; i < max; i++) {
    for (const list of lists) {
      const it = list[i];
      if (!it) continue;
      const k = `${baseTitle(it.title)}|${surname(it.author)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}

export async function getSuggestions(profile: TasteProfile): Promise<OnlineSection[]> {
  if (!enabled) return [];
  const mainLang = profile.languages[0];
  const langs = profile.languages.map(l => LANGS.find(x => x.app === l)).filter(Boolean).slice(0, 2) as typeof LANGS;
  const langQ = langs.length ? ` AND language:(${langs.flatMap(l => l.ia).join(' OR ')})` : '';
  const mainLangQ = langs.length ? ` AND language:(${langs[0].ia.join(' OR ')})` : '';
  const topGenre = profile.genres[0];
  const genreWords = profile.genres.slice(0, 3).flatMap(g => GENRE_KEYWORDS[g] || []).slice(0, 8);
  const topGenreWords = topGenre ? (GENRE_KEYWORDS[topGenre] || [topGenre]) : [];
  const authorWords = [...profile.favoriteAuthors, ...profile.authors].map(surname).filter((w, i, a) => w && a.indexOf(w) === i).slice(0, 8);
  const authorQ = authorWords.length ? ` AND creator:(${authorWords.map(quoteTerm).join(' OR ')})` : '';
  const genreQ = genreWords.length ? ` AND subject:(${genreWords.map(quoteTerm).join(' OR ')})` : '';
  const topGenreQ = topGenreWords.length ? ` AND subject:(${topGenreWords.map(quoteTerm).join(' OR ')})` : '';
  const country = COUNTRY[mainLang || ''] || 'us';
  const key = `sugg4:${fold(langQ + authorQ + genreQ + country)}`.slice(0, 200);
  let raw = cacheGet<Record<string, OnlineItem[]>>(key, DAY);
  if (!raw) {
    const A = 'collection:librivoxaudio AND format:"64Kbps MP3"';
    const E = 'collection:gutenberg AND mediatype:texts';
    const storeAuthors = [...profile.favoriteAuthors, ...profile.authors].filter((a, i, arr) => a && arr.indexOf(a) === i).slice(0, 3);
    const [aAuthors, aGenres, aRecent, aLang, eAuthors, eGenres, eRecent, eTopGenre, ...store] = await Promise.all([
      authorQ ? searchArchive(`${A}${langQ}${authorQ}`, 'audiobook', 30) : Promise.resolve([]),
      genreQ ? searchArchive(`${A}${langQ}${genreQ}`, 'audiobook', 30) : Promise.resolve([]),
      searchArchive(`${A}${langQ}${genreQ}`, 'audiobook', 24, 'addeddate'),
      searchArchive(`${A}${mainLangQ}`, 'audiobook', 30),
      authorQ ? searchArchive(`${E}${langQ}${authorQ}`, 'ebook', 30) : Promise.resolve([]),
      genreQ ? searchArchive(`${E}${langQ}${genreQ}`, 'ebook', 30) : Promise.resolve([]),
      searchArchive(`${E}${langQ}${genreQ}`, 'ebook', 24, 'addeddate'),
      topGenreQ ? searchArchive(`${E}${langQ}${topGenreQ}`, 'ebook', 30) : Promise.resolve([]),
      ...storeAuthors.flatMap(a => [searchApple(a, 'ebook', country, 15), searchApple(a, 'audiobook', country, 10)]),
      ...(topGenre ? [searchApple(topGenre, 'ebook', country, 20)] : []),
    ]);
    raw = {
      audiobooks: mergeUnique([aAuthors, aGenres, aRecent, aLang]),
      ebooks: mergeUnique([eAuthors, eGenres, eRecent]),
      lang: aLang,
      recent: aRecent,
      genreEbooks: eTopGenre,
      store: mergeUnique(store as OnlineItem[][]),
    };
    if (Object.values(raw).some(l => l.length)) cacheSet(key, raw);
  }
  const isOwned = (it: OnlineItem) => profile.owned.some(o => titleMatches(o.title, it.title) && (!o.author || !it.author || authorMatches(o.author, it.author)));
  const clean = (items: OnlineItem[] = []) => rank(profile, items.filter(it => !isOwned(it)));
  const sections: OnlineSection[] = [
    { id: 'audiobooks', titleKey: 'section_online_suggestions', items: clean(raw.audiobooks) },
    { id: 'store-ebooks', titleKey: 'section_online_store_ebooks', items: clean(raw.store).filter(it => it.kind === 'ebook') },
    { id: 'store-audiobooks', titleKey: 'section_online_store_audiobooks', items: clean(raw.store).filter(it => it.kind === 'audiobook') },
    { id: 'ebooks', titleKey: 'section_online_ebooks', items: clean(raw.ebooks) },
    ...(mainLang ? [{ id: 'lang', titleKey: 'section_online_lang', titleVars: { lang: mainLang }, items: clean(raw.lang) }] : []),
    ...(topGenre ? [{ id: 'genre-ebooks', titleKey: 'section_online_genre_read', titleVars: { genre: topGenre }, items: clean(raw.genreEbooks) }] : []),
    { id: 'recent', titleKey: 'section_online_recent', items: clean(raw.recent) },
  ];
  // Cada item aparece em uma seção só (a primeira em que entra), para as listas não se repetirem
  const used = new Set<string>();
  return sections.map(sec => {
    const items = sec.items.filter(it => !used.has(it.id));
    items.slice(0, 6).forEach(it => used.add(it.id));
    return { ...sec, items };
  }).filter(sec => sec.items.length >= 3);
}

export async function getAuthorSuggestions(author: string, profile: TasteProfile): Promise<OnlineItem[]> {
  if (!enabled || !author.trim()) return [];
  const key = `author:${fold(author)}`;
  let items = cacheGet<OnlineItem[]>(key, DAY);
  if (!items) {
    const sn = surname(author);
    const country = COUNTRY[profile.languages[0] || ''] || 'us';
    const lists = await Promise.all([
      sn ? searchArchive(`collection:librivoxaudio AND format:"64Kbps MP3" AND creator:(${quoteTerm(sn)})`, 'audiobook', 40) : Promise.resolve([]),
      sn ? searchArchive(`collection:gutenberg AND mediatype:texts AND creator:(${quoteTerm(sn)})`, 'ebook', 40) : Promise.resolve([]),
      searchApple(author, 'ebook', country, 25),
      searchApple(author, 'audiobook', country, 15),
    ]);
    // Só o que é mesmo desse autor
    items = mergeUnique(lists).filter(it => authorMatches(it.author, author));
    if (items.length) cacheSet(key, items);
  }
  const isOwned = (it: OnlineItem) => profile.owned.some(o => titleMatches(o.title, it.title) && (!o.author || !it.author || authorMatches(o.author, it.author)));
  return rank(profile, items.filter(it => !isOwned(it)));
}

// Lojas para um item à venda: a página na Apple Books e a busca do título nas outras (elas não oferecem os dados)
export function storeLinks(item: OnlineItem): { id: 'apple' | 'amazon' | 'google' | 'audible'; name: string; url: string }[] {
  const q = encodeURIComponent(`${item.title} ${item.author}`.trim());
  const audio = item.kind === 'audiobook';
  return [
    ...(item.source === 'apple' && item.url ? [{ id: 'apple' as const, name: 'Apple Books', url: item.url }] : []),
    { id: 'amazon' as const, name: 'Amazon', url: `https://www.amazon.com.br/s?k=${q}${audio ? '&i=audible' : '&i=digital-text'}` },
    { id: 'google' as const, name: 'Google Play', url: `https://play.google.com/store/search?q=${q}&c=books` },
    ...(audio ? [{ id: 'audible' as const, name: 'Audible', url: `https://www.audible.com/search?keywords=${q}` }] : []),
  ];
}

// ---------- Página de um item (sinopse, narrador, arquivo para baixar) ----------
export async function getItemDetails(item: OnlineItem): Promise<OnlineItemDetails> {
  if (item.source === 'apple') return { ...item, description: item.description || '' };
  const cacheKey = `item:${item.id}`;
  const cached = cacheGet<OnlineItemDetails>(cacheKey, 7 * DAY);
  if (cached) return cached;
  const data = await getJson<any>(`https://archive.org/metadata/${encodeURIComponent(item.id)}`, 12000);
  const meta = data?.metadata || {};
  let description = stripHtml(meta.description);
  let narrator: string | undefined;
  // LibriVox: "Read in Portuguese by Fulano" / "Read by Fulano"
  const reader = /Read (?:in [A-Za-z]+ )?by ([^\n.<]+)/i.exec(description);
  if (reader) narrator = reader[1].trim();
  // Tira as linhas de crédito da LibriVox, deixando a sinopse
  description = cleanSynopsis(description.split('\n\n').filter(p => !/^(LibriVox recording of|Read (in [A-Za-z]+ )?by|For further information|For more free audio ?books|Summary by|\(Summary|M4B Audiobook|Download|Zip file|Cover art|Note:)/i.test(p)).join('\n\n'));
  // Ebook do Gutenberg: a descrição é só "Book from Project Gutenberg: título"; busca a sinopse na Open Library
  if (item.kind === 'ebook' && (!description || /^Book from Project Gutenberg/i.test(description))) {
    description = (await openLibrarySynopsis(item.title, item.author)) || '';
  }
  // Capítulos em MP3 (64 kbps, os menores), na ordem das faixas
  const mp3s = (data?.files || []).filter((f: any) => f.format === '64Kbps MP3' || /_64kb\.mp3$/i.test(f.name || ''));
  const parts = mp3s
    .map((f: any) => ({
      name: String(f.name),
      title: String(f.title || f.name).replace(/^\d+\s*-\s*/, '').trim(),
      size: Number(f.size) || 0,
      track: Number(String(f.track || '').split('/')[0]) || 0,
      url: `https://archive.org/download/${encodeURIComponent(item.id)}/${encodeURIComponent(String(f.name))}`,
    }))
    .sort((a: any, b: any) => (a.track - b.track) || a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map(({ track: _t, ...rest }: any) => rest);
  const details: OnlineItemDetails = {
    ...item,
    description,
    narrator,
    runtime: meta.runtime ? String(meta.runtime) : undefined,
    year: item.year || (meta.date ? String(meta.date).slice(0, 4) : undefined),
    // Capa do item (a imagem JPEG dele libera o acesso do navegador; a miniatura do site não)
    coverUrl: (() => {
      const img = (data?.files || []).find((f: any) => f.format === 'JPEG' && !/thumb/i.test(f.name || '')) || (data?.files || []).find((f: any) => /itemimage\.jpg$/i.test(f.name || ''));
      return img ? `https://archive.org/download/${encodeURIComponent(item.id)}/${encodeURIComponent(String(img.name))}` : undefined;
    })(),
    m4b: parts.length ? { name: `${item.title}.mp3`, size: parts.reduce((n: number, x: any) => n + x.size, 0), url: item.url } : undefined,
    parts,
  };
  if (data) cacheSet(cacheKey, details);
  return details;
}

// Baixa o M4B do audiobook (gratuito, da LibriVox) mostrando o andamento; devolve o arquivo para entrar na biblioteca
export async function downloadAudiobook(details: OnlineItemDetails, onProgress: (fraction: number) => void, signal?: AbortSignal): Promise<File> {
  const parts = details.parts || [];
  if (!parts.length) throw new Error('no-file');
  const total = parts.reduce((n, x) => n + x.size, 0);
  let done = 0;
  const audio: Mp3Part[] = [];
  for (const part of parts) {
    // Até 3 tentativas por capítulo (conexão instável no celular)
    let bytes: Uint8Array | null = null;
    for (let attempt = 0; attempt < 3 && !bytes; attempt++) {
      try {
        const res = await fetch(part.url, { signal });
        if (!res.ok || !res.body) throw new Error(`http-${res.status}`);
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let got = 0;
        for (;;) {
          const { done: end, value } = await reader.read();
          if (end) break;
          chunks.push(value);
          got += value.length;
          if (total) onProgress(Math.min(0.99, (done + got) / total));
        }
        const out = new Uint8Array(got);
        let o = 0;
        for (const c of chunks) { out.set(c, o); o += c.length; }
        bytes = out;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError' || attempt === 2) throw err;
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
    audio.push(mp3AudioFrames(bytes!));
    done += part.size;
  }
  // Capa (imagem do item) para dentro do arquivo
  let cover: string | undefined;
  try {
    if (!details.coverUrl) throw new Error('no-cover');
    const res = await fetch(details.coverUrl, { signal });
    const blob = res.ok ? await res.blob() : null;
    if (blob && /^image\/(jpeg|png)/.test(blob.type)) {
      cover = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error); r.readAsDataURL(blob); });
    }
  } catch { /* sem capa */ }
  const blob = buildChapteredMp3(audio, parts.map(p => p.title), {
    title: details.title, author: details.author, narrator: details.narrator, year: details.year,
    description: details.description, language: details.language, genre: genreFromSubjects(details.subjects), cover,
  });
  onProgress(1);
  const safe = `${details.title}${details.author ? ` - ${details.author}` : ''}`.replace(/[\\/:*?"<>|]+/g, ' ').trim();
  return new File([blob], `${safe}.mp3`, { type: 'audio/mpeg' });
}

// ---------- Open Library: completar os dados de um audiobook ----------
async function openLibrarySynopsis(title: string, author: string): Promise<string | undefined> {
  const doc = await findOpenLibraryWork(title, author);
  return doc?.description;
}

interface OpenLibraryMatch { key: string; title: string; year?: string; subjects: string[]; coverId?: number; description?: string; languages: string[] }
async function findOpenLibraryWork(title: string, author: string): Promise<OpenLibraryMatch | null> {
  if (!title) return null;
  const key = `ol:${baseTitle(title)}|${surname(author)}`;
  const cached = cacheGet<OpenLibraryMatch | null>(key, 7 * DAY);
  if (cached !== undefined) return cached;
  const params = new URLSearchParams({ title: baseTitle(title), limit: '8', fields: 'key,title,author_name,first_publish_year,subject,cover_i,language' });
  if (surname(author)) params.set('author', surname(author));
  const data = await getJson<any>(`https://openlibrary.org/search.json?${params}`);
  if (!data) return null; // sem resposta: tenta de novo outro dia (não guarda)
  // Precisa bater o título e o autor: na dúvida, nada
  const doc = (data.docs || []).find((d: any) => titleMatches(d.title, title) && (d.author_name || []).some((a: string) => authorMatches(a, author)));
  let match: OpenLibraryMatch | null = null;
  if (doc) {
    const work = await getJson<any>(`https://openlibrary.org${doc.key}.json`);
    const desc = work?.description;
    match = {
      key: doc.key,
      title: doc.title,
      year: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
      subjects: (doc.subject || []).slice(0, 40),
      coverId: doc.cover_i || undefined,
      description: cleanSynopsis(stripHtml(typeof desc === 'string' ? desc : desc?.value).replace(/\(\[source\]\[\d+\]\)[\s\S]*$/, '')) || undefined,
      languages: doc.language || [],
    };
  }
  cacheSet(key, match);
  return match;
}

async function imageAsDataUrl(url: string): Promise<string | undefined> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    // Capa "em branco" da Open Library (quando não existe) é minúscula
    if (!/^image\/(jpeg|png)/.test(blob.type) || blob.size < 2000) return undefined;
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export interface MetadataProposal {
  source: 'Open Library';
  year?: string;
  category?: string;
  description?: string;
  cover?: string; // data URL
}

// Dados encontrados que completam o audiobook. Só preenche o que falta ou é claramente melhor (capa genérica → capa
// real); nunca troca o que a pessoa já tem. Sem nada a acrescentar, devolve null
export async function findMetadataProposal(book: { id: string; title: string; author: string; year?: string; category?: string; description?: string; cover?: string }): Promise<MetadataProposal | null> {
  if (!enabled || !book.title || !book.author) return null;
  const work = await findOpenLibraryWork(book.title, book.author);
  if (!work) return null;
  const isUnknown = (v?: string) => !v || !v.trim() || /^(desconhecid[oa]|unknown|outro|-)$/i.test(v.trim());
  const proposal: MetadataProposal = { source: 'Open Library' };
  if (isUnknown(book.year) && work.year) proposal.year = work.year;
  if (isUnknown(book.category)) { const g = genreFromSubjects(work.subjects); if (g) proposal.category = g; }
  if (!book.description?.trim() && work.description) proposal.description = work.description.slice(0, 2000);
  const genericCover = !book.cover || book.cover.startsWith('data:image/svg');
  if (genericCover && work.coverId) {
    const cover = await imageAsDataUrl(`https://covers.openlibrary.org/b/id/${work.coverId}-L.jpg`);
    if (cover) proposal.cover = cover;
  }
  return proposal.year || proposal.category || proposal.description || proposal.cover ? proposal : null;
}
