import { splitAuthorNames } from '../authorUtils';
// Extraído do App.tsx (conteúdo sem alterações)
import { Audiobook, Author, AUTHORS_DATABASE, BOOKS_DATABASE, Collection, INITIAL_COLLECTIONS } from '../data';
import { getGenericBookCover, getAuthorAvatar, getGenericCoverColor, getGenericAuthorColor } from '../audioUtils';
import { normalizeAudiobookLanguage } from '../translations';

export const MOCK_DEV_AUTHORS: Author[] = [
  {
    id: 'author-frank-herbert',
    name: 'Frank Herbert',
    nationality: 'Norte-Americano',
    bio: 'Escritor clássico de ficção científica, criador do universo épico de Duna.',
    picture: getAuthorAvatar('Frank Herbert')
  },
  {
    id: 'author-patrick-rothfuss',
    name: 'Patrick Rothfuss',
    nationality: 'Norte-Americano',
    bio: 'Autor contemporâneo de fantasia épica best-seller com A Crônica do Matador do Rei.',
    picture: getAuthorAvatar('Patrick Rothfuss')
  },
  {
    id: 'author-marco-aurelio',
    name: 'Marco Aurélio',
    nationality: 'Romano',
    bio: 'Imperador romano e filósofo estoico, autor da célebre obra Meditações.',
    picture: getAuthorAvatar('Marco Aurélio')
  }
];

export const MOCK_DEV_AUDIOBOOKS: Audiobook[] = [
  {
    id: 'mock-dev-1',
    title: 'Duna: Crônicas de Arrakis (Edição Definitiva de Teste)',
    author: 'Frank Herbert',
    authorId: 'author-frank-herbert',
    cover: getGenericBookCover('Duna: Crônicas de Arrakis (Edição Definitiva de Teste)', 'Frank Herbert'),
    category: 'Ficção Científica',
    subgenre: 'Space Opera',
    year: '1965',
    language: 'Português',
    narrator: 'Carlos Silveira',
    description: 'Em um futuro distante, a nobre família Atreides aceita administrar o perigoso planeta desértico Arrakis.',
    durationEst: '1h 45min',
    sizeStr: '112 MB',
    transcript: [],
    chapters: [
      { id: 101, title: 'Capítulo 1: O Teste do Gom Jabbar', startTime: 0, duration: 1845 },
      { id: 102, title: 'Capítulo 2: Partida de Caladan', startTime: 1845, duration: 2150 },
      { id: 103, title: 'Capítulo 3: Os Vermes das Areias', startTime: 3995, duration: 2780 }
    ]
  },
  {
    id: 'mock-dev-2',
    title: 'O Nome do Vento (Volume 1)',
    author: 'Patrick Rothfuss',
    authorId: 'author-patrick-rothfuss',
    cover: getGenericBookCover('O Nome do Vento (Volume 1)', 'Patrick Rothfuss'),
    category: 'Fantasia',
    subgenre: 'Alta Fantasia',
    year: '2007',
    language: 'Português',
    narrator: 'Rodrigo Araújo',
    description: 'A história envolvente do jovem Kvothe, que se torna uma lenda viva em seu próprio tempo.',
    durationEst: '1h 14min',
    sizeStr: '88 MB',
    transcript: [],
    chapters: [
      { id: 201, title: 'Prólogo: O Silêncio de Três Partes', startTime: 0, duration: 420 },
      { id: 202, title: 'Capítulo 1: Um Lugar para Estar', startTime: 420, duration: 1650 },
      { id: 203, title: 'Capítulo 2: Música e Vento', startTime: 2070, duration: 2400 }
    ]
  },
  {
    id: 'mock-dev-3',
    title: 'Meditações para Tempos Modernos',
    author: 'Marco Aurélio',
    authorId: 'author-marco-aurelio',
    cover: getGenericBookCover('Meditações para Tempos Modernos', 'Marco Aurélio'),
    category: 'Filosofia',
    subgenre: 'Estoicismo',
    year: '180',
    language: 'Português',
    narrator: 'Beatriz Vasconcelos',
    description: 'Reflexões atemporais de um imperador romano sobre disciplina interior e tranquilidade.',
    durationEst: '40min',
    sizeStr: '45 MB',
    transcript: [],
    chapters: [
      { id: 301, title: 'Livro I: Agradecimentos e Princípios', startTime: 0, duration: 980 },
      { id: 302, title: 'Livro II: Sobre a Mente Racional', startTime: 980, duration: 1420 }
    ]
  },
  {
    id: 'mock-dev-4',
    title: 'Neuromancer: O Legado do Ciberespaço',
    author: 'William Gibson',
    authorId: 'author-william-gibson',
    cover: getGenericBookCover('Neuromancer: O Legado do Ciberespaço', 'William Gibson'),
    category: 'Ficção Científica',
    subgenre: 'Cyberpunk',
    year: '1984',
    language: 'Português',
    narrator: 'Felipe Santana',
    description: 'O céu sobre o porto tinha a cor de uma televisão sintonizada num canal fora do ar.',
    durationEst: '1h 07min',
    sizeStr: '78 MB',
    transcript: [],
    chapters: [
      { id: 401, title: 'Capítulo 1: Chiba City Blues', startTime: 0, duration: 1930 },
      { id: 402, title: 'Capítulo 2: Noite na Conspiração', startTime: 1930, duration: 2110 }
    ]
  },
  {
    id: 'mock-dev-5',
    title: 'O Pequeno Príncipe (Edição Especial Narrada)',
    author: 'Antoine de Saint-Exupéry',
    authorId: 'author-antoine',
    cover: getGenericBookCover('O Pequeno Príncipe (Edição Especial Narrada)', 'Antoine de Saint-Exupéry'),
    category: 'Clássicos',
    subgenre: 'Fábula',
    year: '1943',
    language: 'Português',
    narrator: 'Juliana Mendes',
    description: 'Um piloto perdido no deserto encontra um jovem príncipe vindo de um asteroide minúsculo.',
    durationEst: '35min',
    sizeStr: '38 MB',
    transcript: [],
    chapters: [
      { id: 501, title: 'Capítulo 1: A jiboia e o elefante', startTime: 0, duration: 510 },
      { id: 502, title: 'Capítulo 2: Desenha-me um carneiro', startTime: 510, duration: 740 },
      { id: 503, title: 'Capítulo 3: O Asteroide B-612', startTime: 1250, duration: 890 }
    ]
  }
];

export function normalizeBookCompareStr(s?: string): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function extractNormalizedFileName(pathOrName?: string): string {
  if (!pathOrName) return '';
  return pathOrName
    .replace(/\//g, '\\')
    .split('\\')
    .pop()
    ?.trim()
    .toLowerCase() || '';
}

export function isSameAudiobook(
  a: Partial<Audiobook>,
  b: Partial<Audiobook>
): boolean {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;

  const fileA = extractNormalizedFileName(a.fileName || a.filePath);
  const fileB = extractNormalizedFileName(b.fileName || b.filePath);
  if (fileA && fileB && fileA === fileB) return true;

  const titleA = normalizeBookCompareStr(a.title);
  const titleB = normalizeBookCompareStr(b.title);
  if (titleA && titleB && titleA === titleB) {
    const authorA = normalizeBookCompareStr(a.author);
    const authorB = normalizeBookCompareStr(b.author);
    if (authorA && authorB && authorA === authorB) return true;
    if (a.sizeStr && b.sizeStr && a.sizeStr === b.sizeStr) return true;
  }

  return false;
}

export function deduplicateAudiobooks(list: Audiobook[]): Audiobook[] {
  const result: Audiobook[] = [];
  for (const item of list) {
    if (!item) continue;
    const alreadyExists = result.some(existing => isSameAudiobook(existing, item));
    if (!alreadyExists) {
      result.push(item);
    }
  }
  return result;
}

// Dados de teste (catálogo de exemplo e audiobooks fictícios) só existem com o modo de desenvolvedor ligado.
// Fora dele, o app começa vazio e qualquer item de teste salvo antes é descartado ao carregar.
export function isDevModeStored(): boolean {
  try { return localStorage.getItem('app_dev_mode') === 'true'; } catch { return false; }
}
export const TEST_BOOK_IDS = new Set(BOOKS_DATABASE.map(b => b.id));
export const TEST_AUTHOR_IDS = new Set(AUTHORS_DATABASE.map(a => a.id));
export const TEST_COLLECTION_IDS = new Set(INITIAL_COLLECTIONS.map(c => c.id));
export const isTestBookId = (id: string) => TEST_BOOK_IDS.has(id) || String(id).startsWith('mock-dev-');
export const isTestAuthorId = (id: string) => TEST_AUTHOR_IDS.has(id) || String(id).startsWith('mock-dev-');

export function loadBooksFromJson(saved: string | null): Audiobook[] {
    try {
      const shouldMigrateTestCovers = localStorage.getItem('app_test_covers_generic_v1') !== 'true';
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const loaded = parsed.map((b: Audiobook) => {
            const defaultMatch = BOOKS_DATABASE.find(db => db.id === b.id);
            const isTestBook = Boolean(defaultMatch) || String(b.id).startsWith('mock-dev-');
            const rawLang = 'language' in b ? b.language : defaultMatch?.language;
            const merged = defaultMatch
              ? {
                  ...defaultMatch,
                  ...b,
                  subgenre: b.subgenre || defaultMatch.subgenre,
                  language: normalizeAudiobookLanguage(rawLang) ?? '',
                  narrator: b.narrator || defaultMatch.narrator,
                }
              : {
                  ...b,
                  language: normalizeAudiobookLanguage(b.language),
                };
            if (
              !merged.cover ||
              merged.cover.startsWith('data:image/svg') ||
              merged.cover.includes('images.unsplash.com') ||
              (isTestBook && shouldMigrateTestCovers)
            ) {
              const savedColor = merged.cover && merged.cover.startsWith('data:image/svg')
                ? getGenericCoverColor(merged.cover, merged.title, merged.author)
                : undefined;
              return {
                ...merged,
                cover: getGenericBookCover(merged.title, merged.author, savedColor),
              };
            }
            return merged;
          });
          const kept = isDevModeStored() ? loaded : loaded.filter((b: Audiobook) => !isTestBookId(b.id));
          return deduplicateAudiobooks(kept);
        }
      }
    } catch (e) {}
    return [];
}

export function loadAuthorsFromJson(saved: string | null): Author[] {
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((a: any) => {
            const normNationality =
              !a.nationality || !a.nationality.trim() || a.nationality.trim() === 'Literatura Geral'
                ? 'Desconhecido'
                : a.nationality.trim();
            if (!a.picture || a.picture.startsWith('data:image/svg+xml') || a.picture.includes('images.unsplash.com')) {
              const savedColor = a.picture && a.picture.startsWith('data:image/svg') ? getGenericAuthorColor(a.picture, a.name) : undefined;
              return { ...a, nationality: normNationality, picture: getAuthorAvatar(a.name, savedColor) };
            }
            return { ...a, nationality: normNationality };
          });
          if (isDevModeStored()) return updated;
          // Autores de exemplo saem, a não ser que algum audiobook do usuário seja deles
          const userBooks = (() => {
            try { return JSON.parse(localStorage.getItem('app_books') || '[]') as Audiobook[]; } catch { return []; }
          })().filter(b => !isTestBookId(b.id));
          const usedAuthorIds = new Set(userBooks.map(b => b.authorId));
          const usedAuthorNames = new Set(userBooks.flatMap(b => splitAuthorNames(b.author).map(n => n.trim().toLowerCase())));
          return updated.filter((a: Author) =>
            !isTestAuthorId(a.id) || usedAuthorIds.has(a.id) || usedAuthorNames.has((a.name || '').trim().toLowerCase())
          );
        }
      }
    } catch (e) {}
    return [];
}

export function loadCollectionsFromJson(saved: string | null): Collection[] {
  try {
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return isDevModeStored() ? parsed : parsed.filter((c: Collection) => !TEST_COLLECTION_IDS.has(c.id));
    }
  } catch (e) {}
  return [];
}

export function safeLocalGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
