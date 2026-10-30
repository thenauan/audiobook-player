export type TranscriptWord = {
  start: number;
  end: number;
  text: string;
};

export type TranscriptLine = {
  start: number;
  end: number;
  text: string;
  words?: TranscriptWord[];
};

export type ChapterBookmark = {
  id: string;
  text: string;
  timestamp?: number;
  createdAt: number;
};

export type ChapterComment = ChapterBookmark;

export type Chapter = {
  id: number;
  title: string;
  startTime: number;
  duration: number;
  comments?: ChapterBookmark[];
  bookmarks?: ChapterBookmark[];
  audioUrl?: string;
};

export type Audiobook = {
  id: string;
  title: string;
  author: string;
  authorId: string;
  // Todos os autores, quando o campo de autor tem mais de um nome ("A & B", "A, B")
  authorIds?: string[];
  narrator: string;
  cover: string;
  category: string;
  subgenre?: string;
  durationEst: string;
  sizeStr: string;
  chapters: Chapter[];
  transcript: TranscriptLine[];
  transcriptSource?: 'metadata' | 'upload';
  transcriptFileName?: string;
  year: string;
  description?: string;
  language?: string;
  audioUrl?: string;
  filePath?: string;
  fileName?: string;
  addedDate?: number;
};

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  gradient: string;
  emoji: string;
  createdAt: number;
  updatedAt?: number;
  bookIds: string[];
  authorIds: string[];
}

export const COLLECTION_AVAILABLE_EMOJIS = [
  '📚', '⭐', '🔥', '🎧', '🌙', '💡', '🚀', '🧠', 
  '🧙‍♂️', '🏆', '💎', '❤️', '📜', '🌍', '⚡', '☕',
  '🎯', '🪐', '⚔️', '🌊', '🌲', '👑', '🕊️', '🕰️'
] as const;

export const COLLECTION_AVAILABLE_PALETTES = [
  { id: 'indigo', name: 'Índigo Noturno', hex: '#6366f1', gradient: 'from-indigo-600 via-indigo-700 to-slate-900' },
  { id: 'emerald', name: 'Esmeralda', hex: '#10b981', gradient: 'from-emerald-600 via-teal-700 to-slate-900' },
  { id: 'violet', name: 'Violeta Místico', hex: '#8b5cf6', gradient: 'from-violet-600 via-purple-700 to-indigo-950' },
  { id: 'amber', name: 'Âmbar Dourado', hex: '#f59e0b', gradient: 'from-amber-600 via-orange-600 to-stone-900' },
  { id: 'rose', name: 'Rosa Carmim', hex: '#f43f5e', gradient: 'from-rose-600 via-pink-700 to-slate-900' },
  { id: 'sky', name: 'Azul Celestial', hex: '#0284c7', gradient: 'from-sky-600 via-blue-700 to-slate-900' },
  { id: 'crimson', name: 'Rubi Profundo', hex: '#dc2626', gradient: 'from-red-600 via-rose-800 to-zinc-950' },
  { id: 'cyan', name: 'Ciano Neon', hex: '#06b6d4', gradient: 'from-cyan-600 via-teal-700 to-gray-950' },
  { id: 'sunset', name: 'Pôr do Sol', hex: '#ea580c', gradient: 'from-orange-500 via-rose-600 to-purple-900' },
  { id: 'slate', name: 'Grafite Nobre', hex: '#64748b', gradient: 'from-slate-600 via-gray-700 to-zinc-900' },
] as const;

export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'col-classicos',
    name: 'Clássicos Essenciais',
    description: 'Obras-primas da literatura que atravessaram gerações.',
    color: '#8b5cf6',
    gradient: 'from-violet-600 via-purple-700 to-indigo-950',
    emoji: '📜',
    createdAt: 1700000000000,
    bookIds: ['1', '2'],
    authorIds: ['a1', 'a2']
  },
  {
    id: 'col-maratona',
    name: 'Para Maratonar',
    description: 'Histórias envolventes perfeitas para escutar sem parar.',
    color: '#0284c7',
    gradient: 'from-sky-600 via-blue-700 to-slate-900',
    emoji: '🎧',
    createdAt: 1700000000000,
    bookIds: ['2'],
    authorIds: []
  }
];


export * from './genreData';
import { GenreItem, resolveGenreAndSubgenre, splitGenreValues } from './genreData';


// Um audiobook pode ter vários gêneros e subgêneros (separados por vírgula): ele aparece em cada um.
// As regras abaixo valem para cada combinação gênero × subgênero.
const genrePairs = (b: Partial<Audiobook>) => {
  const cats = splitGenreValues(b.category);
  const subs = splitGenreValues(b.subgenre);
  const cs = cats.length ? cats : [''];
  const ss = subs.length ? subs : [''];
  return cs.flatMap(category => ss.map(subgenre => ({ category, subgenre })));
};

export function isBookInGenre(b: Partial<Audiobook>, genreData: GenreItem): boolean {
  return genrePairs(b).some(pair => isPairInGenre(pair, genreData));
}

export function isBookInSubgenre(b: Partial<Audiobook>, genreData: GenreItem, subgenreName: string): boolean {
  const pairs = genrePairs(b).filter(pair => isPairInGenre(pair, genreData));
  if (pairs.length === 0) return false;
  const target = subgenreName.toLowerCase().trim();
  // "Outros": nenhum dos subgêneros do audiobook é um subgênero específico deste gênero
  if (target === 'outros' || target === 'outro' || target === 'desconhecido') {
    return pairs.every(pair => isPairInSubgenre(pair, genreData, subgenreName));
  }
  return pairs.some(pair => isPairInSubgenre(pair, genreData, subgenreName));
}

function isPairInGenre(b: Partial<Audiobook>, genreData: GenreItem): boolean {
  const cat = (b.category || '').toLowerCase().trim();
  const id = (genreData.id || '').toLowerCase().trim();
  const name = (genreData.name || '').toLowerCase().trim();
  const resolved = resolveGenreAndSubgenre(b.category, b.subgenre);
  return (
    cat === name ||
    cat === id ||
    resolved.category.toLowerCase().trim() === name ||
    (id === 'outros' && (cat === 'desconhecido' || resolved.category.toLowerCase().trim() === 'desconhecido' || resolved.category.toLowerCase().trim() === 'outros'))
  );
}

function isPairInSubgenre(b: Partial<Audiobook>, genreData: GenreItem, subgenreName: string): boolean {

  const targetSub = subgenreName.toLowerCase().trim();
  const resolved = resolveGenreAndSubgenre(b.category, b.subgenre);
  const rawSub = (b.subgenre || '').toLowerCase().trim();
  const rawCat = (b.category || '').toLowerCase().trim();
  const resSub = resolved.subgenre.toLowerCase().trim();

  // "Outros" / "Outro" / "Desconhecido" option
  if (targetSub === 'outros' || targetSub === 'outro' || targetSub === 'desconhecido') {
    const specificSubs = genreData.subgenres
      .filter(s => {
        const sl = s.toLowerCase();
        return sl !== 'outros' && sl !== 'outro' && sl !== 'desconhecido';
      })
      .map(s => s.toLowerCase());

    const matchesAnySpecific = specificSubs.some(s => 
      rawSub === s || resSub === s || rawCat === s || (rawSub !== '' && rawSub.includes(s)) || (s.length > 3 && rawCat.includes(s))
    );

    return !matchesAnySpecific;
  }

  // Exact or alias match
  if (rawSub === targetSub || resSub === targetSub || rawCat === targetSub) {
    return true;
  }

  // Substring containment check
  if (rawSub && (rawSub.includes(targetSub) || targetSub.includes(rawSub))) {
    return true;
  }

  if (resSub && resSub !== 'outros' && resSub !== 'desconhecido' && (resSub.includes(targetSub) || targetSub.includes(resSub))) {
    return true;
  }

  if (rawCat && rawCat === targetSub) {
    return true;
  }

  return false;
}

import { normalizeAudiobookLanguage } from './translations';

export function resolveNarratorAndLanguage(book?: Partial<Audiobook>): { narrator?: string; language?: string } {
  if (!book) return { narrator: undefined, language: undefined };
  let narrator = book.narrator?.trim();
  let language = book.language?.trim();

  // Se o narrador contiver prefixo de idioma como "Português - Antonio (M)"
  if (narrator && narrator.includes(' - ')) {
    const parts = narrator.split(' - ');
    if (parts.length >= 2) {
      if (!language) {
        language = parts[0].trim();
      }
      narrator = parts.slice(1).join(' - ').trim();
    }
  }

  // Ignora placeholders sem valor real
  if (narrator === 'Áudio Local' || narrator === 'Desconhecido' || narrator === '') {
    narrator = undefined;
  }

  return { narrator, language: normalizeAudiobookLanguage(language) };
}


export type Author = {
  id: string;
  name: string;
  nationality: string;
  picture: string;
  bio: string;
};

import { getAuthorAvatar, getGenericBookCover } from './audioUtils';

export const AUTHORS_DATABASE: Author[] = [
  {
    id: "a1",
    name: "Machado de Assis",
    nationality: "Brasileiro",
    picture: getAuthorAvatar("Machado de Assis"),
    bio: "Considerado o maior nome da literatura do Brasil."
  },
  {
    id: "a2",
    name: "Antoine de Saint-Exupéry",
    nationality: "Francês",
    picture: getAuthorAvatar("Antoine de Saint-Exupéry"),
    bio: "Escritor, ilustrador e piloto francês."
  },
  {
    id: "a3",
    name: "Franz Kafka",
    nationality: "Tcheco",
    picture: getAuthorAvatar("Franz Kafka"),
    bio: "Um dos maiores escritores do século XX."
  },
  {
    id: "a4",
    name: "Лев Толстой",
    nationality: "Russo",
    picture: getAuthorAvatar("Лев Толстой"),
    bio: "Um dos maiores romancistas da literatura mundial."
  },
  {
    id: "a5",
    name: "مجهول",
    nationality: "Árabe",
    picture: getAuthorAvatar("مجهول"),
    bio: "Contadores e autores clássicos da tradição literária árabe."
  },
  {
    id: "a6",
    name: "George Orwell",
    nationality: "Britânico",
    picture: getAuthorAvatar("George Orwell"),
    bio: "Romancista, ensaísta e crítico inglês, célebre por suas obras de sátira política e distopia."
  },
  {
    id: "a7",
    name: "Clarice Lispector",
    nationality: "Brasileira",
    picture: getAuthorAvatar("Clarice Lispector"),
    bio: "Uma das maiores escritoras modernistas da literatura em língua portuguesa."
  },
  {
    id: "a8",
    name: "Arthur Conan Doyle",
    nationality: "Britânico",
    picture: getAuthorAvatar("Arthur Conan Doyle"),
    bio: "Escritor e médico britânico, mundialmente famoso por criar o lendário detetive Sherlock Holmes."
  },
  {
    id: "a9",
    name: "Gabriel García Márquez",
    nationality: "Colombiano",
    picture: getAuthorAvatar("Gabriel García Márquez"),
    bio: "Escritor e jornalista colombiano, vencedor do Nobel de Literatura e mestre do realismo mágico."
  },
  {
    id: "a10",
    name: "Edgar Allan Poe",
    nationality: "Americano",
    picture: getAuthorAvatar("Edgar Allan Poe"),
    bio: "Pioneiro da ficção policial, do conto moderno e mestre do horror gótico e mistério."
  },
  {
    id: "a11",
    name: "Albert Camus",
    nationality: "Francês",
    picture: getAuthorAvatar("Albert Camus"),
    bio: "Filósofo e escritor franco-argelino, vencedor do Nobel e figura central da literatura existencialista."
  },
  {
    id: "a12",
    name: "Sun Tzu",
    nationality: "Chinês",
    picture: getAuthorAvatar("Sun Tzu"),
    bio: "General, estrategista e filósofo militar da China antiga, autor de A Arte da Guerra."
  },
  {
    id: "a13",
    name: "Aldous Huxley",
    nationality: "Britânico",
    picture: getAuthorAvatar("Aldous Huxley"),
    bio: "Escritor e pensador inglês, autor de influentes distopias e reflexões sobre a condição humana."
  },
  {
    id: "a14",
    name: "Fiódor Dostoiévski",
    nationality: "Russo",
    picture: getAuthorAvatar("Fiódor Dostoiévski"),
    bio: "Um dos maiores romancistas de todos os tempos, profundo explorador da psicologia humana."
  },
  {
    id: "a15",
    name: "H.P. Lovecraft",
    nationality: "Americano",
    picture: getAuthorAvatar("H.P. Lovecraft"),
    bio: "Autor seminal da literatura fantástica, ficção científica e pioneiro do horror cósmico."
  },
  {
    id: "a16",
    name: "Victor Hugo",
    nationality: "Francês",
    picture: getAuthorAvatar("Victor Hugo"),
    bio: "Romancista, poeta e dramaturgo francês do Romantismo, autor de épicos imortais."
  },
  {
    id: "a17",
    name: "Lewis Carroll",
    nationality: "Britânico",
    picture: getAuthorAvatar("Lewis Carroll"),
    bio: "Matemático, poeta e romancista britânico, mestre da literatura fantástica e nonsense."
  },
  {
    id: "a18",
    name: "Arthur C. Clarke",
    nationality: "Britânico",
    picture: getAuthorAvatar("Arthur C. Clarke"),
    bio: "Célebre escritor de ficção científica, inventor e futurista britânico."
  },
  {
    id: "a19",
    name: "Mário de Andrade",
    nationality: "Brasileiro",
    picture: getAuthorAvatar("Mário de Andrade"),
    bio: "Poeta, romancista, musicólogo e um dos principais líderes do Modernismo brasileiro."
  },
  {
    id: "a20",
    name: "Oscar Wilde",
    nationality: "Irlandês",
    picture: getAuthorAvatar("Oscar Wilde"),
    bio: "Brilhante dramaturgo, poeta e escritor irlandês, célebre pela inteligência e estética de sua prosa."
  },
  {
    id: "a21",
    name: "Herman Melville",
    nationality: "Americano",
    picture: getAuthorAvatar("Herman Melville"),
    bio: "Romancista e poeta norte-americano, famoso pela grandiosidade épica de Moby Dick."
  },
  {
    id: "a22",
    name: "Marco Aurélio",
    nationality: "Romano",
    picture: getAuthorAvatar("Marco Aurélio"),
    bio: "Imperador romano e filósofo estoico, autor de reflexões atemporais em Meditações."
  },
  {
    id: "a23",
    name: "Júlio Verne",
    nationality: "Francês",
    picture: getAuthorAvatar("Júlio Verne"),
    bio: "Pioneiro da ficção científica e aventura moderna, inspirador de gerações de exploradores."
  }
];

export const BOOKS_DATABASE: Audiobook[] = [
  {
    id: "1",
    title: "Dom Casmurro",
    author: "Machado de Assis",
    authorId: "a1",
    narrator: "Antonio (M)",
    language: "Português",
    cover: getGenericBookCover("Dom Casmurro", "Machado de Assis"),
    category: "Ficção",
    subgenre: "Romance",
    year: "1899",
    durationEst: "11h 45m",
    sizeStr: "185.4 MB",
    description: "Publicado em 1899, Dom Casmurro é uma das grandes obras-primas de Machado de Assis. Narrado em primeira pessoa por Bento Santiago (Bentinho), o livro revisita suas memórias de infância, seu amor apaixonado por Capitu e as suspeitas de traição que consumiram sua vida.",
    chapters: [
      { id: 1, title: "Capítulo 1: Do Título", startTime: 0, duration: 180 },
      { id: 2, title: "Capítulo 2: Do Livro", startTime: 180, duration: 240 },
      { id: 3, title: "Capítulo 3: A Ópera", startTime: 420, duration: 320 },
      { id: 4, title: "Capítulo 4: Um Dever Estrito", startTime: 740, duration: 290 },
      { id: 5, title: "Capítulo 5: O Agregado", startTime: 1030, duration: 410 }
    ],
    transcript: [
      { start: 0, end: 6, text: "Uma noite destas, vindo da cidade para o Engenho Novo," },
      { start: 6.1, end: 13, text: "encontrei no trem da Central um rapaz aqui do bairro, o qual eu conheço de vista e de chapéu." },
      { start: 13.1, end: 21, text: "Cumprimentou-me, sentou-se ao pé de mim, falou da lua e dos ministros, e acabou recitando-me versos." },
      { start: 21.1, end: 29, text: "A viagem era curta, e os versos pode ser que não fossem inteiramente maus." },
      { start: 29.1, end: 38, text: "Sucedeu, porém, que, como eu estivesse cansado, fechei os olhos e acabei cochilando com o balanço dos trilhos." },
      { start: 38.1, end: 46, text: "Quando acordei, ele olhava para mim com ar de desgosto por ter perdido a atenção de um ouvinte." }
    ]
  },
  {
    id: "2",
    title: "Memórias Póstumas de Brás Cubas",
    author: "Machado de Assis",
    authorId: "a1",
    narrator: "Francisca (F)",
    language: "Português",
    cover: getGenericBookCover("Memórias Póstumas de Brás Cubas", "Machado de Assis"),
    category: "Literatura",
    subgenre: "Clássicos",
    year: "1881",
    durationEst: "07h 12m",
    sizeStr: "210.0 MB",
    description: "Um marco do Realismo brasileiro, a narrativa rompe com a linearidade tradicional ao ser contada por um 'defunto autor'. Com ironia fina e olhar cético sobre a sociedade do século XIX, Brás Cubas relata suas desilusões amorosas, ambições frustradas e a busca pelo emplasto universal.",
    chapters: [
      { id: 1, title: "Capítulo 1: Ao Leitor", startTime: 0, duration: 160 },
      { id: 2, title: "Capítulo 2: Do Óbito do Autor", startTime: 160, duration: 380 },
      { id: 3, title: "Capítulo 3: O Emplasto Brás Cubas", startTime: 540, duration: 320 }
    ],
    transcript: [
      { start: 0, end: 7, text: "Que me conste, ainda nenhum autor defunto escreveu as suas próprias memórias antes de mim." },
      { start: 7.1, end: 15, text: "Não sou propriamente um autor defunto, mas um defunto autor, para quem a campa foi outro berço." },
      { start: 15.1, end: 24, text: "Moisés, que também contou a sua morte, não a pôs no intróito, mas no cabo; diferença radical entre este livro e o Pentateuco." }
    ]
  },
  {
    id: "3",
    title: "O Pequeno Príncipe",
    author: "Antoine de Saint-Exupéry",
    authorId: "a2",
    narrator: "Guy (M)",
    language: "Inglês",
    cover: getGenericBookCover("O Pequeno Príncipe", "Antoine de Saint-Exupéry"),
    category: "Infantil e Juvenil",
    subgenre: "Infantil",
    year: "1943",
    durationEst: "02h 15m",
    sizeStr: "68.2 MB",
    description: "Uma clássica fábula poética e filosófica sobre a amizade, o amor e o sentido da vida. Um piloto perdido no deserto do Saara encontra um jovem príncipe vindo de um pequeno asteroide, aprendendo valiosas lições sobre o essencial que é invisível aos olhos.",
    chapters: [
      { id: 1, title: "Chapter 1: The Jibóia", startTime: 0, duration: 210 },
      { id: 2, title: "Chapter 2: The Sahara Desert", startTime: 210, duration: 340 },
      { id: 3, title: "Chapter 3: The Little Prince", startTime: 550, duration: 290 }
    ],
    transcript: [
      { start: 0, end: 7, text: "Certa vez, quando eu tinha seis anos, vi num livro uma gravura magnífica." },
      { start: 7.1, end: 14, text: "Representava uma serpente jiboia engolindo uma fera inteira sem ao menos mastigar." },
      { start: 14.1, end: 22, text: "Dizia o livro: As jiboias engolem a sua presa inteirinha, sem mastigar; depois não podem mover-se e dormem seis meses." }
    ]
  },
  {
    id: "4",
    title: "A Metamorfose",
    author: "Franz Kafka",
    authorId: "a3",
    narrator: "Alvaro (M)",
    language: "Espanhol",
    cover: getGenericBookCover("A Metamorfose", "Franz Kafka"),
    category: "Ficção",
    subgenre: "Drama",
    year: "1915",
    durationEst: "03h 05m",
    sizeStr: "94.5 MB",
    description: "Uma das narrativas mais célebres de Franz Kafka, a novela relata a história de Gregor Samsa, um caixeiro-viajante que acorda certa manhã metamorfoseado em um inseto monstruoso, expondo o absurdo, a alienação e a fragilidade dos laços familiares.",
    chapters: [
      { id: 1, title: "Capítulo 1: O Despertar", startTime: 0, duration: 420 },
      { id: 2, title: "Capítulo 2: A Reclusão", startTime: 420, duration: 490 }
    ],
    transcript: [
      { start: 0, end: 8, text: "Quando Gregor Samsa despertou de sonhos intranquilos, encontrou-se em sua cama metamorfoseado num inseto monstruoso." },
      { start: 8.1, end: 16, text: "Estava deitado sobre suas costas duras e via, ao levantar ligeiramente a cabeça, seu ventre abaulado e escuro." }
    ]
  },
  {
    id: "5",
    title: "Война и мир",
    author: "Лев Толстой",
    authorId: "a4",
    narrator: "Dmitry (M)",
    language: "Russo",
    cover: getGenericBookCover("Война и мир", "Лев Толстой"),
    category: "Literatura",
    subgenre: "Clássicos",
    year: "1869",
    durationEst: "61h 10m",
    sizeStr: "1.2 GB",
    description: "Шедевр мировой литературы Льва Толстого, описывающий русское общество в эпоху войн против Наполеона с 1805 по 1812 год.",
    chapters: [
      { id: 1, title: "Часть 1: В салоне Анны Павловны", startTime: 0, duration: 480 },
      { id: 2, title: "Часть 2: Пьер и Андрей", startTime: 480, duration: 520 },
      { id: 3, title: "Часть 3: В Лысых Горах", startTime: 1000, duration: 610 }
    ],
    transcript: [
      { start: 0, end: 8, text: "Еh bien, mon prince. Gênes et Lucques ne sont plus que des apanages de la famille Buonaparte." },
      { start: 8.1, end: 17, text: "Так говорила в июле 1805 года известная Анна Павловна Шерер, приветствуя князя Василия." }
    ]
  },
  {
    id: "6",
    title: "ألف ليلة وليلة",
    author: "مجهول",
    authorId: "a5",
    narrator: "Tariq (M)",
    language: "Árabe",
    cover: getGenericBookCover("ألف ليلة وليلة", "مجهول"),
    category: "Ficção",
    subgenre: "Contos",
    year: "1704",
    durationEst: "14h 30m",
    sizeStr: "380.0 MB",
    description: "مجموعة شهيرة من القصص والحكايات الشعبية الخيالية التي ترويها شهرزاد للملك شهريار لإنقاذ حياتها.",
    chapters: [
      { id: 1, title: "الليلة الأولى: حكاية التاجر مع العفريت", startTime: 0, duration: 420 },
      { id: 2, title: "الليلة الثانية: حكاية الصياد", startTime: 420, duration: 510 },
      { id: 3, title: "الليلة الثالثة: حكاية الملك يونان والحكيم رويان", startTime: 930, duration: 490 }
    ],
    transcript: [
      { start: 0, end: 9, text: "بلغني أيها الملك السعيد، ذو الرأي الرشيد، أنه كان في قديم الزمان وسالف العصر والأوان..." },
      { start: 9.1, end: 18, text: "تاجر من التجار، كثير المال، وكان له معاملات في سائر البلاد." }
    ]
  },
  {
    id: "7",
    title: "A Arte da Guerra",
    author: "Sun Tzu",
    authorId: "a12",
    narrator: "Antonio (M)",
    language: "Português",
    cover: getGenericBookCover("A Arte da Guerra", "Sun Tzu"),
    category: "Não ficção",
    subgenre: "Filosofia",
    year: "1772",
    durationEst: "01h 15m",
    sizeStr: "38.5 MB",
    description: "Tratado militar milenar atribuído ao estrategista chinês Sun Tzu, composto por treze capítulos dedicados à estratégia, liderança e resolução pacífica ou decisiva de conflitos.",
    chapters: [
      { id: 1, title: "Capítulo 1: Cálculos e Avaliações", startTime: 0, duration: 1500 },
      { id: 2, title: "Capítulo 2: Condução da Guerra", startTime: 1500, duration: 1500 },
      { id: 3, title: "Capítulo 3: Estratégia Ofensiva", startTime: 3000, duration: 1500 }
    ],
    transcript: [
      { start: 0, end: 7, text: "A arte da guerra é de vital importância para o Estado." },
      { start: 7.1, end: 15, text: "É uma questão de vida ou morte, um caminho para a sobrevivência ou a ruína." },
      { start: 15.1, end: 23, text: "Por conseguinte, é imperativo investigá-la e dominá-la minuciosamente." }
    ]
  },
  {
    id: "8",
    title: "A Revolução dos Bichos",
    author: "George Orwell",
    authorId: "a6",
    narrator: "Francisca (F)",
    language: "Português",
    cover: getGenericBookCover("A Revolução dos Bichos", "George Orwell"),
    category: "Ficção",
    subgenre: "Distopia",
    year: "1945",
    durationEst: "03h 40m",
    sizeStr: "108.2 MB",
    description: "Fábula alegórica em que os animais da Granja do Solar se rebelam contra os humanos para fundar uma sociedade justa, até que os porcos assumem o poder corrompendo os ideais iniciais.",
    chapters: [
      { id: 1, title: "Capítulo 1: O Sonho do Velho Major", startTime: 0, duration: 3300 },
      { id: 2, title: "Capítulo 2: A Tomada da Granja", startTime: 3300, duration: 3300 },
      { id: 3, title: "Capítulo 3: Os Sete Mandamentos", startTime: 6600, duration: 3300 },
      { id: 4, title: "Capítulo 4: A Batalha do Estábulo", startTime: 9900, duration: 3300 }
    ],
    transcript: [
      { start: 0, end: 7, text: "O senhor Jones, dono da Granja do Solar, trancou os galinheiros para a noite, mas estava bêbado demais." },
      { start: 7.1, end: 14, text: "Assim que a luz do quarto se apagou, houve um grande alvoroço em todos os recintos da fazenda." }
    ]
  },
  {
    id: "9",
    title: "A Hora da Estrela",
    author: "Clarice Lispector",
    authorId: "a7",
    narrator: "Francisca (F)",
    language: "Português",
    cover: getGenericBookCover("A Hora da Estrela", "Clarice Lispector"),
    category: "Literatura",
    subgenre: "Clássicos",
    year: "1977",
    durationEst: "02h 10m",
    sizeStr: "62.4 MB",
    description: "A comovente história de Macabéa, uma datilógrafa alagoana órfã e invisível no Rio de Janeiro, narrada pelo escritor fictício Rodrigo S.M. com reflexões profundas sobre a existência.",
    chapters: [
      { id: 1, title: "Parte 1: A Dedicatória do Autor", startTime: 0, duration: 2600 },
      { id: 2, title: "Parte 2: Macabéa na Cidade Grande", startTime: 2600, duration: 2600 },
      { id: 3, title: "Parte 3: O Encontro e o Destino", startTime: 5200, duration: 2600 }
    ],
    transcript: [
      { start: 0, end: 7, text: "Tudo no mundo começou com um sim. Uma molécula disse sim a outra molécula e nasceu a vida." },
      { start: 7.1, end: 15, text: "Mas antes da pré-história havia a pré-história da pré-história e havia o nunca e havia o sim." }
    ]
  },
  {
    id: "10",
    title: "Admirável Mundo Novo",
    author: "Aldous Huxley",
    authorId: "a13",
    narrator: "Guy (M)",
    language: "Inglês",
    cover: getGenericBookCover("Admirável Mundo Novo", "Aldous Huxley"),
    category: "Ficção",
    subgenre: "Ficção científica",
    year: "1932",
    durationEst: "08h 20m",
    sizeStr: "245.0 MB",
    description: "Visão profética e perturbadora de uma sociedade futurista tecnologicamente avançada onde os humanos são biologicamente condicionados, livres de dor mas desprovidos de paixão e liberdade genuína.",
    chapters: [
      { id: 1, title: "Chapter 1: The Central Incubatorium", startTime: 0, duration: 6000 },
      { id: 2, title: "Chapter 2: Conditioning the Mind", startTime: 6000, duration: 6000 },
      { id: 3, title: "Chapter 3: Soma and Stability", startTime: 12000, duration: 6000 },
      { id: 4, title: "Chapter 4: The Savage Reservation", startTime: 18000, duration: 6000 },
      { id: 5, title: "Chapter 5: Community, Identity, Stability", startTime: 24000, duration: 6000 }
    ],
    transcript: [
      { start: 0, end: 8, text: "A squat grey building of only thirty-four storeys over the main entrance the words: Central London Hatchery." },
      { start: 8.1, end: 16, text: "The enormous room on the ground floor faced towards the north, cold for all the summer beyond the panes." }
    ]
  },
  {
    id: "11",
    title: "Alice no País das Maravilhas",
    author: "Lewis Carroll",
    authorId: "a17",
    narrator: "Francisca (F)",
    language: "Português",
    cover: getGenericBookCover("Alice no País das Maravilhas", "Lewis Carroll"),
    category: "Infantil e Juvenil",
    subgenre: "Infantil",
    year: "1865",
    durationEst: "03h 15m",
    sizeStr: "95.0 MB",
    description: "Ao seguir um Coelho Branco apressado pela toca, a jovem Alice cai em um mundo subterrâneo fantástico e absurdo, habitado por criaturas singulares como o Chapeleiro Louco e o Gato de Cheshire.",
    chapters: [
      { id: 1, title: "Capítulo 1: Pela Toca do Coelho", startTime: 0, duration: 2925 },
      { id: 2, title: "Capítulo 2: O Lago de Lágrimas", startTime: 2925, duration: 2925 },
      { id: 3, title: "Capítulo 3: Um Chá de Loucos", startTime: 5850, duration: 2925 },
      { id: 4, title: "Capítulo 4: O Julgamento da Rainha", startTime: 8775, duration: 2925 }
    ],
    transcript: [
      { start: 0, end: 7, text: "Alice começava a ficar muito cansada de estar sentada ao lado de sua irmã no barranco." },
      { start: 7.1, end: 14, text: "De repente, um Coelho Branco de olhos cor-de-rosa passou correndo muito perto dela." }
    ]
  },
  {
    id: "12",
    title: "As Aventuras de Sherlock Holmes",
    author: "Arthur Conan Doyle",
    authorId: "a8",
    narrator: "Guy (M)",
    language: "Inglês",
    cover: getGenericBookCover("As Aventuras de Sherlock Holmes", "Arthur Conan Doyle"),
    category: "Ficção",
    subgenre: "Policial",
    year: "1892",
    durationEst: "10h 30m",
    sizeStr: "310.0 MB",
    description: "Coletânea com os mais memoráveis casos resolvidos pela mente dedutiva e implacável de Sherlock Holmes e seu fiel companheiro Dr. John Watson na sombria Londres vitoriana.",
    chapters: [
      { id: 1, title: "Case 1: A Scandal in Bohemia", startTime: 0, duration: 7560 },
      { id: 2, title: "Case 2: The Red-Headed League", startTime: 7560, duration: 7560 },
      { id: 3, title: "Case 3: A Case of Identity", startTime: 15120, duration: 7560 },
      { id: 4, title: "Case 4: The Boscombe Valley Mystery", startTime: 22680, duration: 7560 },
      { id: 5, title: "Case 5: The Five Orange Pips", startTime: 30240, duration: 7560 }
    ],
    transcript: [
      { start: 0, end: 7, text: "To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name." },
      { start: 7.1, end: 15, text: "In his eyes she eclipses and predominates the whole of her sex." }
    ]
  },
  {
    id: "13",
    title: "A Cartomante",
    author: "Machado de Assis",
    authorId: "a1",
    narrator: "Antonio (M)",
    language: "Português",
    cover: getGenericBookCover("A Cartomante", "Machado de Assis"),
    category: "Literatura",
    subgenre: "Contos",
    year: "1884",
    durationEst: "00h 25m",
    sizeStr: "14.2 MB",
    description: "Célebre conto machadiano sobre o triângulo amoroso entre Camilo, Rita e Vilela, onde a superstição e o destino culminam em uma reviravolta trágica e surpreendente.",
    chapters: [
      { id: 1, title: "Capítulo 1: O Triângulo e as Dúvidas", startTime: 0, duration: 750 },
      { id: 2, title: "Capítulo 2: A Consulta e o Destino", startTime: 750, duration: 750 }
    ],
    transcript: [
      { start: 0, end: 6, text: "Hamlet observa a Horácio que há mais cousas no céu e na terra do que sonha a nossa vã filosofia." },
      { start: 6.1, end: 13, text: "Era a mesma explicação que dava a bela Rita ao moço Camilo, numa sexta-feira de novembro de 1869." }
    ]
  },
  {
    id: "14",
    title: "Cem Anos de Solidão",
    author: "Gabriel García Márquez",
    authorId: "a9",
    narrator: "Alvaro (M)",
    language: "Espanhol",
    cover: getGenericBookCover("Cem Anos de Solidão", "Gabriel García Márquez"),
    category: "Ficção",
    subgenre: "Romance",
    year: "1967",
    durationEst: "16h 50m",
    sizeStr: "490.0 MB",
    description: "A saga monumental da família Buendía através de sete gerações na mística aldeia de Macondo, onde o fantástico e o real se entrelaçam em uma narrativa inesquecível.",
    chapters: [
      { id: 1, title: "Capítulo 1: La Fundación de Macondo", startTime: 0, duration: 10100 },
      { id: 2, title: "Capítulo 2: Los Gitanos y el Hielo", startTime: 10100, duration: 10100 },
      { id: 3, title: "Capítulo 3: La Peste del Insomnio", startTime: 20200, duration: 10100 },
      { id: 4, title: "Capítulo 4: Las Guerras del Coronel", startTime: 30300, duration: 10100 },
      { id: 5, title: "Capítulo 5: El Diluvio de Macondo", startTime: 40400, duration: 10100 },
      { id: 6, title: "Capítulo 6: Los Pergaminos de Melquíades", startTime: 50500, duration: 10100 }
    ],
    transcript: [
      { start: 0, end: 8, text: "Muchos años después, frente al pelotón de fusilamiento, el coronel Aureliano Buendía había de recordar aquella tarde remota." },
      { start: 8.1, end: 16, text: "Macondo era entonces una aldea de veinte casas de barro y cañabrava construidas a la orilla de un río." }
    ]
  },
  {
    id: "15",
    title: "Crime e Castigo",
    author: "Fiódor Dostoiévski",
    authorId: "a14",
    narrator: "Antonio (M)",
    language: "Português",
    cover: getGenericBookCover("Crime e Castigo", "Fiódor Dostoiévski"),
    category: "Literatura",
    subgenre: "Clássicos",
    year: "1866",
    durationEst: "23h 40m",
    sizeStr: "680.0 MB",
    description: "O jovem ex-estudante Raskólnikov planeja e executa o assassinato de uma velha agiota em São Petersburgo, mergulhando em um labirinto psicológico de culpa, delírio e redenção espiritual.",
    chapters: [
      { id: 1, title: "Parte 1: A Ideia e o Crime", startTime: 0, duration: 14200 },
      { id: 2, title: "Parte 2: O Peso do Remorso", startTime: 14200, duration: 14200 },
      { id: 3, title: "Parte 3: O Interrogatório", startTime: 28400, duration: 14200 },
      { id: 4, title: "Parte 4: Sônia e a Confissão", startTime: 42600, duration: 14200 },
      { id: 5, title: "Parte 5: A Tempestade Mental", startTime: 56800, duration: 14200 },
      { id: 6, title: "Parte 6: Redenção na Sibéria", startTime: 71000, duration: 14200 }
    ],
    transcript: [
      { start: 0, end: 7, text: "No início de julho, por um tempo extremamente quente, um jovem descia do seu quartinho para a rua." },
      { start: 7.1, end: 15, text: "Estava em dívida com a proprietária e temia encontrar-se com ela na escada." }
    ]
  },
  {
    id: "16",
    title: "Carta ao Pai",
    author: "Franz Kafka",
    authorId: "a3",
    narrator: "Antonio (M)",
    language: "Português",
    cover: getGenericBookCover("Carta ao Pai", "Franz Kafka"),
    category: "Não ficção",
    subgenre: "Memórias",
    year: "1919",
    durationEst: "01h 35m",
    sizeStr: "45.0 MB",
    description: "Carta comovente e dilacerante nunca entregue, na qual Franz Kafka analisa minuciosamente a complexa relação com sua figura paterna autoritária e o impacto psicológico em sua vida e escrita.",
    chapters: [
      { id: 1, title: "Capítulo 1: O Medo e a Distância", startTime: 0, duration: 1900 },
      { id: 2, title: "Capítulo 2: O Tribunal Doméstico", startTime: 1900, duration: 1900 },
      { id: 3, title: "Capítulo 3: As Palavras Finais", startTime: 3800, duration: 1900 }
    ],
    transcript: [
      { start: 0, end: 7, text: "Querido pai, perguntou-me há pouco tempo por que afirmo ter medo de ti." },
      { start: 7.1, end: 14, text: "Nunca soube o que responder, em parte justamente pelo medo que tenho de ti." }
    ]
  },
  {
    id: "17",
    title: "Crônica de uma Morte Anunciada",
    author: "Gabriel García Márquez",
    authorId: "a9",
    narrator: "Alvaro (M)",
    language: "Espanhol",
    cover: getGenericBookCover("Crônica de uma Morte Anunciada", "Gabriel García Márquez"),
    category: "Ficção",
    subgenre: "Mistério",
    year: "1981",
    durationEst: "02h 20m",
    sizeStr: "68.0 MB",
    description: "Narrativa vertiginosa que reconstrói os passos do assassinato de Santiago Nasar pelos irmãos Vicario, um crime do qual toda a cidade tinha conhecimento prévio, mas ninguém impediu.",
    chapters: [
      { id: 1, title: "Capítulo 1: A Manhã Fatal", startTime: 0, duration: 2800 },
      { id: 2, title: "Capítulo 2: O Casamento de Bayardo", startTime: 2800, duration: 2800 },
      { id: 3, title: "Capítulo 3: A Hora do Julgamento", startTime: 5600, duration: 2800 }
    ],
    transcript: [
      { start: 0, end: 7, text: "El día en que lo iban a matar, Santiago Nasar se levantó a las 5:30 de la mañana para esperar el buque." },
      { start: 7.1, end: 14, text: "Había soñado que atravesaba un bosque de higuerones donde caía una llovizna tierna." }
    ]
  },
  {
    id: "18",
    title: "Moby Dick",
    author: "Herman Melville",
    authorId: "a21",
    narrator: "Guy (M)",
    language: "Inglês",
    cover: getGenericBookCover("Moby Dick", "Herman Melville"),
    category: "Ficção",
    subgenre: "Aventura",
    year: "1851",
    durationEst: "24h 15m",
    sizeStr: "710.0 MB",
    description: "A obsessiva perseguição marítima do Capitão Ahab à monstruosa baleia branca que lhe arrancou a perna, narrada pelo marinheiro Ismael a bordo do baleeiro Pequod.",
    chapters: [
      { id: 1, title: "Chapter 1: Loomings", startTime: 0, duration: 14550 },
      { id: 2, title: "Chapter 2: The Carpet-Bag", startTime: 14550, duration: 14550 },
      { id: 3, title: "Chapter 3: The Spouter-Inn", startTime: 29100, duration: 14550 },
      { id: 4, title: "Chapter 4: The Quarter-Deck", startTime: 43650, duration: 14550 },
      { id: 5, title: "Chapter 5: Ahab and the White Whale", startTime: 58200, duration: 14550 },
      { id: 6, title: "Chapter 6: The Chase - Third Day", startTime: 72750, duration: 14550 }
    ],
    transcript: [
      { start: 0, end: 6, text: "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse." },
      { start: 6.1, end: 14, text: "I thought I would sail about a little and see the watery part of the world." }
    ]
  },
  {
    id: "19",
    title: "Macunaíma",
    author: "Mário de Andrade",
    authorId: "a19",
    narrator: "Francisca (F)",
    language: "Português",
    cover: getGenericBookCover("Macunaíma", "Mário de Andrade"),
    category: "Literatura",
    subgenre: "Literatura brasileira",
    year: "1928",
    durationEst: "05h 45m",
    sizeStr: "165.0 MB",
    description: "A rapsódia modernista que narra as peripécias fantásticas do herói sem nenhum caráter, cruzando o folclore amazônico e as lendas indígenas com o dinamismo da metrópole de São Paulo.",
    chapters: [
      { id: 1, title: "Capítulo 1: No Fundo do Mato-Virgem", startTime: 0, duration: 5175 },
      { id: 2, title: "Capítulo 2: Maiorana", startTime: 5175, duration: 5175 },
      { id: 3, title: "Capítulo 3: Ci, Mãe do Mato", startTime: 10350, duration: 5175 },
      { id: 4, title: "Capítulo 4: O Muiraquitã Perdido", startTime: 15525, duration: 5175 }
    ],
    transcript: [
      { start: 0, end: 7, text: "No fundo do mato-virgem nasceu Macunaíma, herói de nossa gente. Era preto retinto e filho do medo da noite." },
      { start: 7.1, end: 15, text: "Houve um momento em que o silêncio foi tão grande escutando o murmurejo do Uraricoera que a índia tapanhumas pariu uma criança feia." }
    ]
  },
  {
    id: "20",
    title: "Meditações",
    author: "Marco Aurélio",
    authorId: "a22",
    narrator: "Antonio (M)",
    language: "Português",
    cover: getGenericBookCover("Meditações", "Marco Aurélio"),
    category: "Não ficção",
    subgenre: "Estoicismo",
    year: "180",
    durationEst: "05h 10m",
    sizeStr: "152.0 MB",
    description: "Notas íntimas e reflexões espirituais do imperador romano sobre o dever, a serenidade diante das adversidades, a brevidade da vida e o autodomínio sob os princípios da filosofia estoica.",
    chapters: [
      { id: 1, title: "Livro 1: Os Mestres e a Gratidão", startTime: 0, duration: 4650 },
      { id: 2, title: "Livro 2: A Manhã e o Despertar", startTime: 4650, duration: 4650 },
      { id: 3, title: "Livro 3: A Alma Racional", startTime: 9300, duration: 4650 },
      { id: 4, title: "Livro 4: A Cidadela Interior", startTime: 13950, duration: 4650 }
    ],
    transcript: [
      { start: 0, end: 7, text: "Ao romper da manhã, diz a ti mesmo: hoje vou encontrar o indiscreto, o ingrato, o insolente, o desleal." },
      { start: 7.1, end: 15, text: "Tudo isto lhes acontece por ignorarem o que é bom e o que é mau." }
    ]
  },
  {
    id: "21",
    title: "O Estrangeiro",
    author: "Albert Camus",
    authorId: "a11",
    narrator: "Antonio (M)",
    language: "Português",
    cover: getGenericBookCover("O Estrangeiro", "Albert Camus"),
    category: "Ficção",
    subgenre: "Filosofia",
    year: "1942",
    durationEst: "03h 25m",
    sizeStr: "98.0 MB",
    description: "Em Argel, Meursault recebe a notícia da morte de sua mãe com indiferença. Pouco depois, comete um assassinato sob o sol escaldante da praia e é julgado mais por sua frieza moral do que pelo crime em si.",
    chapters: [
      { id: 1, title: "Capítulo 1: O Asilo de Marengo", startTime: 0, duration: 4100 },
      { id: 2, title: "Capítulo 2: O Sol na Praia", startTime: 4100, duration: 4100 },
      { id: 3, title: "Capítulo 3: O Tribunal e a Sentença", startTime: 8200, duration: 4100 }
    ],
    transcript: [
      { start: 0, end: 6, text: "Hoje, mamãe morreu. Ou talvez ontem, não sei bem." },
      { start: 6.1, end: 13, text: "Recebi um telegrama do asilo: 'Mãe falecida. Enterro amanhã. Sentidos pêsames.' Isto não quer dizer nada. Talvez tenha sido ontem." }
    ]
  },
  {
    id: "22",
    title: "O Retrato de Dorian Gray",
    author: "Oscar Wilde",
    authorId: "a20",
    narrator: "Guy (M)",
    language: "Inglês",
    cover: getGenericBookCover("O Retrato de Dorian Gray", "Oscar Wilde"),
    category: "Ficção",
    subgenre: "Drama",
    year: "1890",
    durationEst: "08h 50m",
    sizeStr: "260.0 MB",
    description: "Seduzido pela busca obsessiva do prazer estético, o belo jovem Dorian Gray mantém sua juventude eterna enquanto seu retrato a óleo envelhece e registra a decadência de sua alma corrompida.",
    chapters: [
      { id: 1, title: "Chapter 1: In the Studio", startTime: 0, duration: 6360 },
      { id: 2, title: "Chapter 2: The Vow of Eternal Youth", startTime: 6360, duration: 6360 },
      { id: 3, title: "Chapter 3: Sybil Vane", startTime: 12720, duration: 6360 },
      { id: 4, title: "Chapter 4: The Altered Canvas", startTime: 19080, duration: 6360 },
      { id: 5, title: "Chapter 5: The Locked Attic Room", startTime: 25440, duration: 6360 }
    ],
    transcript: [
      { start: 0, end: 7, text: "The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees." },
      { start: 7.1, end: 14, text: "In the centre of the room stood the full-length portrait of a young man of extraordinary personal beauty." }
    ]
  },
  {
    id: "23",
    title: "O Chamado de Cthulhu",
    author: "H.P. Lovecraft",
    authorId: "a15",
    narrator: "Guy (M)",
    language: "Inglês",
    cover: getGenericBookCover("O Chamado de Cthulhu", "H.P. Lovecraft"),
    category: "Ficção",
    subgenre: "Terror",
    year: "1928",
    durationEst: "01h 20m",
    sizeStr: "40.0 MB",
    description: "Ao investigar os misteriosos papéis de seu falecido tio-avô, Francis Thurston descobre a existência de um culto ancestral dedicado a uma entidade cósmica dormente nas profundezas do oceano.",
    chapters: [
      { id: 1, title: "Part 1: The Horror in Clay", startTime: 0, duration: 1600 },
      { id: 2, title: "Part 2: The Tale of Inspector Legrasse", startTime: 1600, duration: 1600 },
      { id: 3, title: "Part 3: The Madness from the Sea", startTime: 3200, duration: 1600 }
    ],
    transcript: [
      { start: 0, end: 7, text: "The most merciful thing in the world, I think, is the inability of the human mind to correlate all its contents." },
      { start: 7.1, end: 15, text: "We live on a placid island of ignorance in the midst of black seas of infinity." }
    ]
  },
  {
    id: "24",
    title: "O Gato Preto e Outros Contos",
    author: "Edgar Allan Poe",
    authorId: "a10",
    narrator: "Guy (M)",
    language: "Inglês",
    cover: getGenericBookCover("O Gato Preto e Outros Contos", "Edgar Allan Poe"),
    category: "Ficção",
    subgenre: "Terror",
    year: "1843",
    durationEst: "00h 45m",
    sizeStr: "22.5 MB",
    description: "Obra-prima do horror psicológico de Edgar Allan Poe sobre a espiral destrutiva da culpa, da superstição e da perversidade na mente de um narrador condenado à forca.",
    chapters: [
      { id: 1, title: "Capítulo 1: O Felino Plutão", startTime: 0, duration: 1350 },
      { id: 2, title: "Capítulo 2: A Ruína e a Revelação", startTime: 1350, duration: 1350 }
    ],
    transcript: [
      { start: 0, end: 7, text: "For the most wild yet most homely narrative which I am about to pen, I neither expect nor solicit belief." },
      { start: 7.1, end: 14, text: "Mad indeed would I be to expect it, in a case where my very senses reject their own evidence." }
    ]
  },
  {
    id: "25",
    title: "Os Miseráveis",
    author: "Victor Hugo",
    authorId: "a16",
    narrator: "Francisca (F)",
    language: "Português",
    cover: getGenericBookCover("Os Miseráveis", "Victor Hugo"),
    category: "Literatura",
    subgenre: "Clássicos",
    year: "1862",
    durationEst: "58h 30m",
    sizeStr: "1.6 GB",
    description: "O épico imortal de redenção e justiça social em torno de Jean Valjean, condenado a dezenove anos de galés por roubar um pão, incansavelmente perseguido pelo implacável inspetor Javert na França do século XIX.",
    chapters: [
      { id: 1, title: "Parte 1: Fantine", startTime: 0, duration: 35100 },
      { id: 2, title: "Parte 2: Cosette", startTime: 35100, duration: 35100 },
      { id: 3, title: "Parte 3: Marius", startTime: 70200, duration: 35100 },
      { id: 4, title: "Parte 4: O Idílio da Rua Plumet", startTime: 105300, duration: 35100 },
      { id: 5, title: "Parte 5: A Barricada", startTime: 140400, duration: 35100 },
      { id: 6, title: "Parte 6: Jean Valjean", startTime: 175500, duration: 35100 }
    ],
    transcript: [
      { start: 0, end: 7, text: "Enquanto houver, por efeito de leis e costumes, uma danação social criando artificialmente infernos no seio da civilização." },
      { start: 7.1, end: 15, text: "Livros desta natureza não serão inúteis." }
    ]
  },
  {
    id: "26",
    title: "1984",
    author: "George Orwell",
    authorId: "a6",
    narrator: "Guy (M)",
    language: "Inglês",
    cover: getGenericBookCover("1984", "George Orwell"),
    category: "Ficção",
    subgenre: "Distopia",
    year: "1949",
    durationEst: "11h 30m",
    sizeStr: "330.0 MB",
    description: "Em um futuro totalitário governado pelo Grande Irmão e vigiado pelas teletelas, Winston Smith ousa manter pensamentos proibidos e buscar um amor livre da vigilância do Partido.",
    chapters: [
      { id: 1, title: "Part 1: Big Brother is Watching You", startTime: 0, duration: 8280 },
      { id: 2, title: "Part 2: The Two Minutes Hate", startTime: 8280, duration: 8280 },
      { id: 3, title: "Part 3: The Golden Country", startTime: 16560, duration: 8280 },
      { id: 4, title: "Part 4: The Ministry of Love", startTime: 24840, duration: 8280 },
      { id: 5, title: "Part 5: Room 101", startTime: 33120, duration: 8280 }
    ],
    transcript: [
      { start: 0, end: 7, text: "It was a bright cold day in April, and the clocks were striking thirteen." },
      { start: 7.1, end: 14, text: "Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors." }
    ]
  },
  {
    id: "27",
    title: "2001: Uma Odisseia no Espaço",
    author: "Arthur C. Clarke",
    authorId: "a18",
    narrator: "Antonio (M)",
    language: "Português",
    cover: getGenericBookCover("2001: Uma Odisseia no Espaço", "Arthur C. Clarke"),
    category: "Ficção",
    subgenre: "Space Opera",
    year: "1968",
    durationEst: "09h 15m",
    sizeStr: "275.0 MB",
    description: "Um enigmático monólito negro é descoberto na Lua emitindo sinais para Júpiter. A nave Discovery One parte em missão exploratória sob o comando dos astronautas e da inteligência artificial HAL 9000.",
    chapters: [
      { id: 1, title: "Capítulo 1: A Alvorada do Homem", startTime: 0, duration: 8325 },
      { id: 2, title: "Capítulo 2: TMA-1 na Cratera Tycho", startTime: 8325, duration: 8325 },
      { id: 3, title: "Capítulo 3: A Bordo da Discovery", startTime: 16650, duration: 8325 },
      { id: 4, title: "Capítulo 4: Além do Infinito", startTime: 24975, duration: 8325 }
    ],
    transcript: [
      { start: 0, end: 7, text: "Atrás de cada homem vivo estão trinta fantasmas, pois essa é a proporção pela qual os mortos superam os vivos." },
      { start: 7.1, end: 15, text: "Desde o amanhecer do tempo, cerca de cem bilhões de seres humanos já caminharam sobre o planeta Terra." }
    ]
  },
  {
    id: "28",
    title: "20 Mil Léguas Submarinas",
    author: "Júlio Verne",
    authorId: "a23",
    narrator: "Antonio (M)",
    language: "Português",
    cover: getGenericBookCover("20 Mil Léguas Submarinas", "Júlio Verne"),
    category: "Ficção",
    subgenre: "Aventura",
    year: "1870",
    durationEst: "13h 20m",
    sizeStr: "395.0 MB",
    description: "O professor Aronnax, seu criado Conselho e o arpoador Ned Land partem para caçar um monstro marinho, apenas para serem capturados pelo enigmático Capitão Nemo a bordo do submarino Náutilus.",
    chapters: [
      { id: 1, title: "Capítulo 1: O Recife Flutuante", startTime: 0, duration: 9600 },
      { id: 2, title: "Capítulo 2: O Homem das Águas", startTime: 9600, duration: 9600 },
      { id: 3, title: "Capítulo 3: Mobilis in Mobile", startTime: 19200, duration: 9600 },
      { id: 4, title: "Capítulo 4: Uma Floresta Submarina", startTime: 28800, duration: 9600 },
      { id: 5, title: "Capítulo 5: O Turbilhão do Maelstrom", startTime: 38400, duration: 9600 }
    ],
    transcript: [
      { start: 0, end: 7, text: "O ano de 1866 ficou marcado por um acontecimento bizarro, um fenômeno inexplicado e inexplicável." },
      { start: 7.1, end: 15, text: "Havia algum tempo que vários navios vinham topando no mar com 'uma coisa enorme', um objeto longo e fosforescente." }
    ]
  }
];

