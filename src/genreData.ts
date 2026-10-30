export interface GenreItem {
  id: string;
  name: string;
  subgenres: string[];
  gradient: string;
}

export const GENRE_HIERARCHY: Record<string, GenreItem> = {
  'ficção': {
    id: 'ficcao',
    name: 'Ficção',
    subgenres: [
      'Romance',
      'Drama',
      'Aventura',
      'Ação',
      'Mistério',
      'Suspense',
      'Thriller',
      'Policial',
      'Terror',
      'Horror',
      'Fantasia',
      'Alta Fantasia',
      'Fantasia Urbana',
      'Ficção científica',
      'Space Opera',
      'Cyberpunk',
      'Distopia',
      'Ficção histórica',
      'Sobrenatural',
      'Romantasia',
      'Comédia romântica',
      'Dark Romance',
      'Ficção contemporânea',
      'Thriller psicológico',
      'Espionagem',
      'Guerra',
      'Faroeste',
      'Pós-apocalíptico',
      'Steampunk',
      'Realismo mágico',
      'Gótico',
      'Outros'
    ],
    gradient: 'from-blue-600 via-indigo-600 to-violet-700'
  },
  'não ficção': {
    id: 'nao-ficcao',
    name: 'Não ficção',
    subgenres: [
      'História',
      'Biografia',
      'Memórias',
      'Filosofia',
      'Estoicismo',
      'Psicologia',
      'Ciência',
      'Tecnologia',
      'Política',
      'Economia',
      'Finanças',
      'Negócios',
      'Liderança',
      'Autoajuda',
      'Desenvolvimento pessoal',
      'Saúde e Bem-estar',
      'Sociologia',
      'Espiritualidade',
      'True crime',
      'Educação',
      'Feminismo',
      'Natureza e Meio ambiente',
      'Medicina',
      'Direito',
      'Astronomia',
      'Produtividade',
      'Relacionamentos',
      'Parentalidade',
      'Outros'
    ],
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700'
  },
  'literatura': {
    id: 'literatura',
    name: 'Literatura',
    subgenres: [
      'Clássicos',
      'Poesia',
      'Teatro',
      'Contos',
      'Crônicas',
      'Ensaios',
      'Romance clássico',
      'Fábulas',
      'Mitologia',
      'Realismo',
      'Literatura brasileira',
      'Literatura estrangeira',
      'Romantismo',
      'Modernismo',
      'Literatura portuguesa',
      'Literatura latino-americana',
      'Literatura africana',
      'Literatura de cordel',
      'Outros'
    ],
    gradient: 'from-amber-600 via-orange-600 to-rose-700'
  },
  'infantil e juvenil': {
    id: 'infantil-e-juvenil',
    name: 'Infantil e Juvenil',
    subgenres: [
      'Infantil',
      'Contos de fadas',
      'Fábulas infantis',
      'Juvenil',
      'Young Adult',
      'Fantasia juvenil',
      'Aventura juvenil',
      'Educativo infantil',
      'Histórias de dormir',
      'Romance juvenil',
      'Distopia juvenil',
      'Mistério juvenil',
      'Outros'
    ],
    gradient: 'from-pink-500 via-rose-500 to-purple-600'
  },
  'lgbtq+': {
    id: 'lgbtq',
    name: 'LGBTQ+',
    subgenres: [
      'Romance LGBTQ+',
      'Ficção LGBTQ+',
      'Fantasia LGBTQ+',
      'Young Adult LGBTQ+',
      'Memórias LGBTQ+',
      'Não ficção LGBTQ+',
      'Poesia LGBTQ+',
      'Outros'
    ],
    gradient: 'from-red-500 via-yellow-500 to-violet-600'
  },
  'outros': {
    id: 'outros',
    name: 'Outros',
    subgenres: [
      'Humor',
      'Comédia',
      'Religião',
      'Esportes',
      'Arte e Música',
      'Culinária e Gastronomia',
      'Viagens e Guias',
      'Idiomas e Aprendizado',
      'Notícias e Atualidades',
      'Geral',
      'Quadrinhos e Mangá',
      'Meditação',
      'Podcasts',
      'Audiodrama',
      'Palestras e Cursos',
      'Outros'
    ],
    gradient: 'from-purple-600 via-violet-600 to-indigo-800'
  },
  'desconhecido': {
    id: 'desconhecido',
    name: 'Desconhecido',
    subgenres: [
      'Outros'
    ],
    gradient: 'from-slate-700 via-gray-700 to-zinc-800'
  }
};

export const SUBGENRE_GRADIENTS: Record<string, string> = {
  'romance': 'from-rose-500 via-pink-600 to-red-500',
  'drama': 'from-indigo-600 via-purple-600 to-pink-600',
  'aventura': 'from-teal-600 via-emerald-600 to-green-700',
  'ação': 'from-orange-600 via-red-600 to-amber-700',
  'acao': 'from-orange-600 via-red-600 to-amber-700',
  'mistério': 'from-slate-800 via-indigo-950 to-blue-900',
  'misterio': 'from-slate-800 via-indigo-950 to-blue-900',
  'suspense': 'from-slate-800 via-cyan-950 to-zinc-900',
  'thriller': 'from-red-700 via-rose-800 to-zinc-900',
  'policial': 'from-blue-800 via-slate-800 to-zinc-900',
  'terror': 'from-zinc-900 via-neutral-900 to-red-950',
  'horror': 'from-zinc-950 via-neutral-900 to-rose-950',
  'fantasia': 'from-violet-600 via-purple-700 to-indigo-800',
  'alta fantasia': 'from-indigo-700 via-purple-800 to-violet-900',
  'fantasia urbana': 'from-purple-800 via-indigo-900 to-slate-900',
  'ficção científica': 'from-cyan-600 via-blue-600 to-indigo-700',
  'ficcao cientifica': 'from-cyan-600 via-blue-600 to-indigo-700',
  'space opera': 'from-blue-700 via-indigo-800 to-cyan-900',
  'cyberpunk': 'from-fuchsia-600 via-pink-600 to-cyan-600',
  'distopia': 'from-zinc-700 via-slate-800 to-neutral-900',
  'ficção histórica': 'from-amber-700 via-yellow-800 to-stone-800',
  'ficcao historica': 'from-amber-700 via-yellow-800 to-stone-800',
  'sobrenatural': 'from-purple-900 via-violet-950 to-indigo-950',
  'história': 'from-amber-700 via-yellow-800 to-orange-900',
  'historia': 'from-amber-700 via-yellow-800 to-orange-900',
  'biografia': 'from-orange-600 via-amber-600 to-rose-700',
  'memórias': 'from-amber-600 via-rose-600 to-orange-700',
  'memorias': 'from-amber-600 via-rose-600 to-orange-700',
  'filosofia': 'from-emerald-700 via-teal-800 to-slate-800',
  'estoicismo': 'from-stone-600 via-zinc-700 to-slate-800',
  'psicologia': 'from-teal-600 via-cyan-700 to-blue-800',
  'ciência': 'from-blue-600 via-cyan-600 to-teal-600',
  'ciencia': 'from-blue-600 via-cyan-600 to-teal-600',
  'tecnologia': 'from-sky-500 via-blue-600 to-indigo-700',
  'política': 'from-red-800 via-rose-900 to-slate-900',
  'politica': 'from-red-800 via-rose-900 to-slate-900',
  'economia': 'from-green-700 via-emerald-800 to-teal-900',
  'finanças': 'from-emerald-600 via-teal-700 to-green-800',
  'financas': 'from-emerald-600 via-teal-700 to-green-800',
  'negócios': 'from-blue-700 via-slate-700 to-indigo-800',
  'negocios': 'from-blue-700 via-slate-700 to-indigo-800',
  'liderança': 'from-amber-600 via-orange-700 to-yellow-800',
  'lideranca': 'from-amber-600 via-orange-700 to-yellow-800',
  'autoajuda': 'from-teal-500 via-emerald-600 to-cyan-600',
  'desenvolvimento pessoal': 'from-emerald-600 via-teal-600 to-blue-600',
  'saúde e bem-estar': 'from-teal-600 via-emerald-600 to-lime-700',
  'saude e bem-estar': 'from-teal-600 via-emerald-600 to-lime-700',
  'sociologia': 'from-orange-700 via-amber-800 to-stone-800',
  'espiritualidade': 'from-amber-600 via-yellow-600 to-stone-700',
  'clássicos': 'from-amber-700 via-amber-800 to-yellow-900',
  'classicos': 'from-amber-700 via-amber-800 to-yellow-900',
  'poesia': 'from-pink-600 via-rose-500 to-amber-500',
  'teatro': 'from-purple-700 via-fuchsia-700 to-pink-700',
  'contos': 'from-indigo-700 via-violet-700 to-purple-800',
  'crônicas': 'from-rose-600 via-pink-700 to-purple-700',
  'cronicas': 'from-rose-600 via-pink-700 to-purple-700',
  'ensaios': 'from-stone-700 via-zinc-800 to-neutral-800',
  'romance clássico': 'from-rose-700 via-pink-800 to-amber-800',
  'romance classico': 'from-rose-700 via-pink-800 to-amber-800',
  'fábulas': 'from-emerald-600 via-teal-700 to-cyan-800',
  'fabulas': 'from-emerald-600 via-teal-700 to-cyan-800',
  'fábula': 'from-emerald-600 via-teal-700 to-cyan-800',
  'mitologia': 'from-amber-600 via-yellow-700 to-orange-800',
  'realismo': 'from-stone-600 via-zinc-700 to-amber-800',
  'literatura brasileira': 'from-green-600 via-yellow-600 to-emerald-700',
  'literatura estrangeira': 'from-blue-600 via-indigo-700 to-violet-800',
  'infantil': 'from-sky-400 via-teal-400 to-emerald-400',
  'contos de fadas': 'from-pink-400 via-purple-400 to-indigo-500',
  'fábulas infantis': 'from-teal-400 via-emerald-400 to-green-500',
  'fabulas infantis': 'from-teal-400 via-emerald-400 to-green-500',
  'juvenil': 'from-fuchsia-500 via-pink-500 to-rose-500',
  'young adult': 'from-violet-500 via-indigo-500 to-purple-600',
  'fantasia juvenil': 'from-purple-500 via-indigo-600 to-pink-500',
  'aventura juvenil': 'from-amber-500 via-orange-600 to-teal-600',
  'educativo infantil': 'from-cyan-400 via-blue-500 to-indigo-500',
  'histórias de dormir': 'from-indigo-900 via-blue-900 to-slate-900',
  'historias de dormir': 'from-indigo-900 via-blue-900 to-slate-900',
  'humor': 'from-yellow-500 via-amber-500 to-orange-500',
  'comédia': 'from-amber-400 via-yellow-500 to-orange-500',
  'comedia': 'from-amber-400 via-yellow-500 to-orange-500',
  'religião': 'from-amber-600 via-yellow-600 to-stone-700',
  'religiao': 'from-amber-600 via-yellow-600 to-stone-700',
  'esportes': 'from-lime-600 via-green-600 to-teal-700',
  'arte e música': 'from-rose-500 via-purple-600 to-indigo-600',
  'culinária e gastronomia': 'from-orange-500 via-amber-600 to-red-600',
  'viagens e guias': 'from-sky-500 via-teal-600 to-emerald-600',
  'idiomas e aprendizado': 'from-blue-500 via-indigo-600 to-violet-600',
  'notícias e atualidades': 'from-red-600 via-slate-700 to-zinc-800',
  'geral': 'from-slate-600 via-gray-700 to-zinc-800',
  'outros': 'from-purple-600 via-violet-600 to-indigo-800',
  'outro': 'from-purple-600 via-violet-600 to-indigo-800',
  'romantasia': 'from-rose-600 via-fuchsia-700 to-violet-800',
  'comédia romântica': 'from-pink-400 via-rose-500 to-amber-400',
  'comedia romantica': 'from-pink-400 via-rose-500 to-amber-400',
  'dark romance': 'from-zinc-900 via-rose-950 to-red-900',
  'ficção contemporânea': 'from-sky-600 via-slate-600 to-indigo-700',
  'ficcao contemporanea': 'from-sky-600 via-slate-600 to-indigo-700',
  'thriller psicológico': 'from-slate-900 via-purple-950 to-zinc-900',
  'thriller psicologico': 'from-slate-900 via-purple-950 to-zinc-900',
  'espionagem': 'from-slate-700 via-zinc-800 to-neutral-900',
  'guerra': 'from-stone-700 via-green-900 to-zinc-900',
  'faroeste': 'from-amber-700 via-orange-800 to-stone-800',
  'pós-apocalíptico': 'from-lime-800 via-stone-800 to-zinc-900',
  'pos-apocaliptico': 'from-lime-800 via-stone-800 to-zinc-900',
  'steampunk': 'from-amber-800 via-orange-900 to-stone-900',
  'realismo mágico': 'from-emerald-600 via-teal-700 to-amber-600',
  'realismo magico': 'from-emerald-600 via-teal-700 to-amber-600',
  'gótico': 'from-zinc-900 via-purple-950 to-black',
  'gotico': 'from-zinc-900 via-purple-950 to-black',
  'true crime': 'from-red-900 via-zinc-900 to-slate-900',
  'educação': 'from-blue-600 via-indigo-600 to-sky-700',
  'educacao': 'from-blue-600 via-indigo-600 to-sky-700',
  'feminismo': 'from-fuchsia-600 via-purple-600 to-pink-600',
  'natureza e meio ambiente': 'from-green-600 via-emerald-700 to-lime-700',
  'medicina': 'from-cyan-600 via-teal-600 to-blue-700',
  'direito': 'from-slate-700 via-stone-700 to-amber-900',
  'astronomia': 'from-indigo-900 via-blue-950 to-violet-900',
  'produtividade': 'from-teal-500 via-cyan-600 to-blue-600',
  'relacionamentos': 'from-rose-500 via-pink-600 to-orange-500',
  'parentalidade': 'from-amber-500 via-orange-500 to-rose-500',
  'romantismo': 'from-rose-600 via-pink-700 to-purple-700',
  'modernismo': 'from-indigo-600 via-blue-700 to-teal-700',
  'literatura portuguesa': 'from-green-700 via-red-700 to-yellow-700',
  'literatura latino-americana': 'from-yellow-600 via-orange-600 to-red-700',
  'literatura africana': 'from-amber-600 via-orange-700 to-green-800',
  'literatura de cordel': 'from-amber-700 via-yellow-700 to-stone-700',
  'romance juvenil': 'from-pink-500 via-rose-500 to-fuchsia-600',
  'distopia juvenil': 'from-zinc-700 via-slate-700 to-orange-700',
  'mistério juvenil': 'from-indigo-700 via-blue-800 to-slate-800',
  'misterio juvenil': 'from-indigo-700 via-blue-800 to-slate-800',
  'quadrinhos e mangá': 'from-yellow-500 via-red-500 to-blue-600',
  'quadrinhos e manga': 'from-yellow-500 via-red-500 to-blue-600',
  'meditação': 'from-teal-400 via-cyan-500 to-indigo-500',
  'meditacao': 'from-teal-400 via-cyan-500 to-indigo-500',
  'podcasts': 'from-purple-600 via-fuchsia-600 to-pink-600',
  'audiodrama': 'from-violet-700 via-purple-800 to-indigo-900',
  'palestras e cursos': 'from-sky-600 via-blue-700 to-indigo-700',
  'romance lgbtq+': 'from-pink-500 via-purple-600 to-sky-500',
  'ficção lgbtq+': 'from-red-500 via-amber-500 to-violet-600',
  'ficcao lgbtq+': 'from-red-500 via-amber-500 to-violet-600',
  'fantasia lgbtq+': 'from-violet-600 via-fuchsia-600 to-sky-500',
  'young adult lgbtq+': 'from-fuchsia-500 via-violet-500 to-cyan-500',
  'memórias lgbtq+': 'from-amber-500 via-rose-500 to-purple-600',
  'memorias lgbtq+': 'from-amber-500 via-rose-500 to-purple-600',
  'não ficção lgbtq+': 'from-teal-500 via-blue-600 to-violet-600',
  'nao ficcao lgbtq+': 'from-teal-500 via-blue-600 to-violet-600',
  'poesia lgbtq+': 'from-rose-500 via-pink-500 to-indigo-500',
  'desconhecido': 'from-slate-700 via-zinc-700 to-neutral-800'
};

export const GENRE_EMOJIS: Record<string, string> = {
  'ficcao': '🚀',
  'ficção': '🚀',
  'nao-ficcao': '💡',
  'não ficção': '💡',
  'literatura': '📖',
  'infantil-e-juvenil': '🧸',
  'infantil e juvenil': '🧸',
  'lgbtq': '🏳️‍🌈',
  'lgbtq+': '🏳️‍🌈',
  'outros': '🧩',
  'desconhecido': '🎧'
};

export const SUBGENRE_EMOJIS: Record<string, string> = {
  'romance': '💖',
  'drama': '🎭',
  'aventura': '🗺️',
  'ação': '💥',
  'acao': '💥',
  'mistério': '🔍',
  'misterio': '🔍',
  'suspense': '🕵️',
  'thriller': '⚡',
  'policial': '🚨',
  'terror': '👻',
  'horror': '🧟',
  'fantasia': '🧙‍♂️',
  'alta fantasia': '🏰',
  'fantasia urbana': '🏙️',
  'ficção científica': '🛸',
  'ficcao cientifica': '🛸',
  'space opera': '🪐',
  'cyberpunk': '🤖',
  'distopia': '☣️',
  'ficção histórica': '⏳',
  'ficcao historica': '⏳',
  'sobrenatural': '🔮',
  'história': '🏛️',
  'historia': '🏛️',
  'biografia': '👤',
  'memórias': '📖',
  'memorias': '📖',
  'filosofia': '🏛️',
  'estoicismo': '🗿',
  'psicologia': '🧠',
  'ciência': '🔬',
  'ciencia': '🔬',
  'tecnologia': '💻',
  'política': '⚖️',
  'politica': '⚖️',
  'economia': '📈',
  'finanças': '💰',
  'financas': '💰',
  'negócios': '💼',
  'negocios': '💼',
  'liderança': '👑',
  'lideranca': '👑',
  'autoajuda': '🌱',
  'desenvolvimento pessoal': '🎯',
  'saúde e bem-estar': '🧘',
  'saude e bem-estar': '🧘',
  'sociologia': '🌐',
  'espiritualidade': '✨',
  'clássicos': '📜',
  'classicos': '📜',
  'poesia': '✒️',
  'teatro': '🎭',
  'contos': '📚',
  'crônicas': '📰',
  'cronicas': '📰',
  'ensaios': '📝',
  'romance clássico': '🌹',
  'romance classico': '🌹',
  'fábulas': '🦊',
  'fabulas': '🦊',
  'fábula': '🦊',
  'mitologia': '⚡',
  'realismo': '🖋️',
  'literatura brasileira': '🇧🇷',
  'literatura estrangeira': '🌍',
  'infantil': '🧸',
  'contos de fadas': '🧚',
  'fábulas infantis': '🐇',
  'fabulas infantis': '🐇',
  'juvenil': '🛹',
  'young adult': '🎧',
  'fantasia juvenil': '🪄',
  'aventura juvenil': '🧗',
  'educativo infantil': '🎨',
  'histórias de dormir': '🌙',
  'historias de dormir': '🌙',
  'humor': '😄',
  'comédia': '🎉',
  'comedia': '🎉',
  'religião': '🕊️',
  'religiao': '🕊️',
  'esportes': '⚽',
  'arte e música': '🎨',
  'culinária e gastronomia': '🍳',
  'viagens e guias': '✈️',
  'idiomas e aprendizado': '🗣️',
  'notícias e atualidades': '📢',
  'geral': '📦',
  'outros': '🧩',
  'romantasia': '🌹',
  'comédia romântica': '💞',
  'comedia romantica': '💞',
  'dark romance': '🖤',
  'ficção contemporânea': '🏙️',
  'ficcao contemporanea': '🏙️',
  'thriller psicológico': '🧠',
  'thriller psicologico': '🧠',
  'espionagem': '🕵️',
  'guerra': '🎖️',
  'faroeste': '🤠',
  'pós-apocalíptico': '☢️',
  'pos-apocaliptico': '☢️',
  'steampunk': '⚙️',
  'realismo mágico': '🦋',
  'realismo magico': '🦋',
  'gótico': '🦇',
  'gotico': '🦇',
  'true crime': '🔎',
  'educação': '🎓',
  'educacao': '🎓',
  'feminismo': '♀️',
  'natureza e meio ambiente': '🌿',
  'medicina': '🩺',
  'direito': '⚖️',
  'astronomia': '🔭',
  'produtividade': '⏱️',
  'relacionamentos': '🤝',
  'parentalidade': '👨‍👩‍👧',
  'romantismo': '🌸',
  'modernismo': '🎨',
  'literatura portuguesa': '🇵🇹',
  'literatura latino-americana': '🌎',
  'literatura africana': '🌍',
  'literatura de cordel': '🪕',
  'romance juvenil': '💌',
  'distopia juvenil': '🏹',
  'mistério juvenil': '🔦',
  'misterio juvenil': '🔦',
  'quadrinhos e mangá': '💬',
  'quadrinhos e manga': '💬',
  'meditação': '🧘',
  'meditacao': '🧘',
  'podcasts': '🎙️',
  'audiodrama': '🎭',
  'palestras e cursos': '🎤',
  'romance lgbtq+': '🏳️‍🌈',
  'ficção lgbtq+': '🌈',
  'ficcao lgbtq+': '🌈',
  'fantasia lgbtq+': '🦄',
  'young adult lgbtq+': '💜',
  'memórias lgbtq+': '📔',
  'memorias lgbtq+': '📔',
  'não ficção lgbtq+': '📣',
  'nao ficcao lgbtq+': '📣',
  'poesia lgbtq+': '✒️',
  'outro': '🧩',
  'desconhecido': '🎧'
};

export function getGenreEmoji(idOrName: string): string {
  const key = idOrName.toLowerCase().trim();
  return GENRE_EMOJIS[key] || GENRE_EMOJIS[key.replace(/[^a-z0-9-]/g, '')] || '📚';
}

export function getSubgenreEmoji(subgenreName: string): string {
  const key = subgenreName.toLowerCase().trim();
  return SUBGENRE_EMOJIS[key] || '📖';
}

export function getSubgenreGradient(subgenreName: string): string {
  const key = subgenreName.toLowerCase().trim();
  return SUBGENRE_GRADIENTS[key] || 'from-slate-600 via-gray-700 to-zinc-800';
}

// Vários gêneros/subgêneros num audiobook, separados por vírgula ou ponto e vírgula
export function splitGenreValues(raw?: string | null): string[] {
  const seen = new Set<string>();
  return String(raw || '').split(/\s*[,;]\s*/).map(v => v.trim()).filter(v => {
    if (!v || seen.has(v.toLowerCase())) return false;
    seen.add(v.toLowerCase());
    return true;
  });
}

// Resolve listas: cada valor resolvido; o resultado volta como lista separada por vírgula
export function resolveGenreList(rawCategory?: string, rawSubgenre?: string): { category: string; subgenre: string } {
  const cats = splitGenreValues(rawCategory);
  const subs = splitGenreValues(rawSubgenre);
  if (cats.length <= 1 && subs.length <= 1) return resolveGenreAndSubgenre(rawCategory, rawSubgenre);
  const outCats: string[] = [];
  const outSubs: string[] = [];
  const push = (list: string[], v: string) => { if (v && !list.some(x => x.toLowerCase() === v.toLowerCase())) list.push(v); };
  // Cada subgênero com o gênero dele; gêneros sem subgênero entram sozinhos
  subs.forEach(sub => {
    const r = resolveGenreAndSubgenre(cats.length === 1 ? cats[0] : '', sub);
    push(outCats, r.category);
    push(outSubs, r.subgenre);
  });
  cats.forEach(cat => push(outCats, resolveGenreAndSubgenre(cat, '').category));
  const cleanSubs = outSubs.filter(sg => sg.toLowerCase() !== 'outros' || outSubs.length === 1);
  return { category: outCats.join(', ') || 'Outros', subgenre: cleanSubs.join(', ') || 'Outros' };
}

export function resolveGenreAndSubgenre(rawCategory?: string, rawSubgenre?: string): { category: string; subgenre: string } {
  const cat = (rawCategory || '').trim();
  const sub = (rawSubgenre || '').trim();
  const catKey = cat.toLowerCase();
  const subKey = sub.toLowerCase();

  // Helper dictionary of known subgenre -> { category, subgenre }
  const aliases: Record<string, { category: string; subgenre: string }> = {
    'sci-fi': { category: 'Ficção', subgenre: 'Ficção científica' },
    'scifi': { category: 'Ficção', subgenre: 'Ficção científica' },
    'science fiction': { category: 'Ficção', subgenre: 'Ficção científica' },
    'ficcao cientifica': { category: 'Ficção', subgenre: 'Ficção científica' },
    'ficção científica': { category: 'Ficção', subgenre: 'Ficção científica' },
    'space opera': { category: 'Ficção', subgenre: 'Space Opera' },
    'cyberpunk': { category: 'Ficção', subgenre: 'Cyberpunk' },
    'distopia': { category: 'Ficção', subgenre: 'Distopia' },
    'dystopia': { category: 'Ficção', subgenre: 'Distopia' },
    'alta fantasia': { category: 'Ficção', subgenre: 'Alta Fantasia' },
    'high fantasy': { category: 'Ficção', subgenre: 'Alta Fantasia' },
    'fantasia urbana': { category: 'Ficção', subgenre: 'Fantasia Urbana' },
    'fantasy': { category: 'Ficção', subgenre: 'Fantasia' },
    'fantasia': { category: 'Ficção', subgenre: 'Fantasia' },
    'suspense': { category: 'Ficção', subgenre: 'Suspense' },
    'thriller': { category: 'Ficção', subgenre: 'Thriller' },
    'policial': { category: 'Ficção', subgenre: 'Policial' },
    'crime': { category: 'Ficção', subgenre: 'Policial' },
    'horror': { category: 'Ficção', subgenre: 'Horror' },
    'terror': { category: 'Ficção', subgenre: 'Terror' },
    'mystery': { category: 'Ficção', subgenre: 'Mistério' },
    'misterio': { category: 'Ficção', subgenre: 'Mistério' },
    'mistério': { category: 'Ficção', subgenre: 'Mistério' },
    'adventure': { category: 'Ficção', subgenre: 'Aventura' },
    'aventura': { category: 'Ficção', subgenre: 'Aventura' },
    'ação': { category: 'Ficção', subgenre: 'Ação' },
    'acao': { category: 'Ficção', subgenre: 'Ação' },
    'action': { category: 'Ficção', subgenre: 'Ação' },
    'romance': { category: 'Ficção', subgenre: 'Romance' },
    'drama': { category: 'Ficção', subgenre: 'Drama' },
    'sobrenatural': { category: 'Ficção', subgenre: 'Sobrenatural' },
    'paranormal': { category: 'Ficção', subgenre: 'Sobrenatural' },
    'ficcao historica': { category: 'Ficção', subgenre: 'Ficção histórica' },
    'ficção histórica': { category: 'Ficção', subgenre: 'Ficção histórica' },

    'history': { category: 'Não ficção', subgenre: 'História' },
    'história': { category: 'Não ficção', subgenre: 'História' },
    'historia': { category: 'Não ficção', subgenre: 'História' },
    'biography': { category: 'Não ficção', subgenre: 'Biografia' },
    'biografia': { category: 'Não ficção', subgenre: 'Biografia' },
    'memoir': { category: 'Não ficção', subgenre: 'Memórias' },
    'memórias': { category: 'Não ficção', subgenre: 'Memórias' },
    'memorias': { category: 'Não ficção', subgenre: 'Memórias' },
    'philosophy': { category: 'Não ficção', subgenre: 'Filosofia' },
    'filosofia': { category: 'Não ficção', subgenre: 'Filosofia' },
    'estoicismo': { category: 'Não ficção', subgenre: 'Estoicismo' },
    'stoicism': { category: 'Não ficção', subgenre: 'Estoicismo' },
    'psychology': { category: 'Não ficção', subgenre: 'Psicologia' },
    'psicologia': { category: 'Não ficção', subgenre: 'Psicologia' },
    'science': { category: 'Não ficção', subgenre: 'Ciência' },
    'ciência': { category: 'Não ficção', subgenre: 'Ciência' },
    'ciencia': { category: 'Não ficção', subgenre: 'Ciência' },
    'politics': { category: 'Não ficção', subgenre: 'Política' },
    'política': { category: 'Não ficção', subgenre: 'Política' },
    'politica': { category: 'Não ficção', subgenre: 'Política' },
    'economy': { category: 'Não ficção', subgenre: 'Economia' },
    'economia': { category: 'Não ficção', subgenre: 'Economia' },
    'finanças': { category: 'Não ficção', subgenre: 'Finanças' },
    'financas': { category: 'Não ficção', subgenre: 'Finanças' },
    'finance': { category: 'Não ficção', subgenre: 'Finanças' },
    'negócios': { category: 'Não ficção', subgenre: 'Negócios' },
    'negocios': { category: 'Não ficção', subgenre: 'Negócios' },
    'business': { category: 'Não ficção', subgenre: 'Negócios' },
    'technology': { category: 'Não ficção', subgenre: 'Tecnologia' },
    'tecnologia': { category: 'Não ficção', subgenre: 'Tecnologia' },
    'tech': { category: 'Não ficção', subgenre: 'Tecnologia' },
    'autoajuda': { category: 'Não ficção', subgenre: 'Autoajuda' },
    'self-help': { category: 'Não ficção', subgenre: 'Autoajuda' },
    'self help': { category: 'Não ficção', subgenre: 'Autoajuda' },
    'desenvolvimento pessoal': { category: 'Não ficção', subgenre: 'Desenvolvimento pessoal' },
    'saúde e bem-estar': { category: 'Não ficção', subgenre: 'Saúde e Bem-estar' },
    'saude': { category: 'Não ficção', subgenre: 'Saúde e Bem-estar' },
    'liderança': { category: 'Não ficção', subgenre: 'Liderança' },
    'lideranca': { category: 'Não ficção', subgenre: 'Liderança' },
    'sociologia': { category: 'Não ficção', subgenre: 'Sociologia' },

    'poetry': { category: 'Literatura', subgenre: 'Poesia' },
    'poesia': { category: 'Literatura', subgenre: 'Poesia' },
    'classic': { category: 'Literatura', subgenre: 'Clássicos' },
    'classics': { category: 'Literatura', subgenre: 'Clássicos' },
    'clássicos': { category: 'Literatura', subgenre: 'Clássicos' },
    'classicos': { category: 'Literatura', subgenre: 'Clássicos' },
    'play': { category: 'Literatura', subgenre: 'Teatro' },
    'teatro': { category: 'Literatura', subgenre: 'Teatro' },
    'contos': { category: 'Literatura', subgenre: 'Contos' },
    'crônicas': { category: 'Literatura', subgenre: 'Crônicas' },
    'cronicas': { category: 'Literatura', subgenre: 'Crônicas' },
    'ensaios': { category: 'Literatura', subgenre: 'Ensaios' },
    'realismo': { category: 'Literatura', subgenre: 'Realismo' },

    'fábula': { category: 'Literatura', subgenre: 'Fábulas' },
    'fabula': { category: 'Literatura', subgenre: 'Fábulas' },
    'fábulas': { category: 'Literatura', subgenre: 'Fábulas' },
    'fabulas': { category: 'Literatura', subgenre: 'Fábulas' },
    'fable': { category: 'Literatura', subgenre: 'Fábulas' },
    'infantil': { category: 'Infantil e Juvenil', subgenre: 'Infantil' },
    'children': { category: 'Infantil e Juvenil', subgenre: 'Infantil' },
    'kids': { category: 'Infantil e Juvenil', subgenre: 'Infantil' },
    'juvenil': { category: 'Infantil e Juvenil', subgenre: 'Juvenil' },
    'teen': { category: 'Infantil e Juvenil', subgenre: 'Juvenil' },
    'young adult': { category: 'Infantil e Juvenil', subgenre: 'Young Adult' },
    'ya': { category: 'Infantil e Juvenil', subgenre: 'Young Adult' },
    'contos de fadas': { category: 'Infantil e Juvenil', subgenre: 'Contos de fadas' },

    'humor': { category: 'Outros', subgenre: 'Humor' },
    'comédia': { category: 'Outros', subgenre: 'Comédia' },
    'comedia': { category: 'Outros', subgenre: 'Comédia' },
    'religião': { category: 'Outros', subgenre: 'Religião' },
    'religiao': { category: 'Outros', subgenre: 'Religião' },
    'espiritualidade': { category: 'Outros', subgenre: 'Religião' },
    'esportes': { category: 'Outros', subgenre: 'Esportes' },
    'culinária': { category: 'Outros', subgenre: 'Culinária e Gastronomia' },
    'culinaria': { category: 'Outros', subgenre: 'Culinária e Gastronomia' },
    'viagens': { category: 'Outros', subgenre: 'Viagens e Guias' },
    'lgbt': { category: 'LGBTQ+', subgenre: 'Ficção LGBTQ+' },
    'lgbtq': { category: 'LGBTQ+', subgenre: 'Ficção LGBTQ+' },
    'lgbtq+': { category: 'LGBTQ+', subgenre: 'Ficção LGBTQ+' },
    'lgbtqia+': { category: 'LGBTQ+', subgenre: 'Ficção LGBTQ+' },
    'lgbtqia': { category: 'LGBTQ+', subgenre: 'Ficção LGBTQ+' },
    'queer': { category: 'LGBTQ+', subgenre: 'Ficção LGBTQ+' },
    'gay': { category: 'LGBTQ+', subgenre: 'Ficção LGBTQ+' },
    'lésbico': { category: 'LGBTQ+', subgenre: 'Ficção LGBTQ+' },
    'lesbian': { category: 'LGBTQ+', subgenre: 'Ficção LGBTQ+' },
    'gay romance': { category: 'LGBTQ+', subgenre: 'Romance LGBTQ+' },
    'mm romance': { category: 'LGBTQ+', subgenre: 'Romance LGBTQ+' },
    'm/m romance': { category: 'LGBTQ+', subgenre: 'Romance LGBTQ+' },
    'romantasy': { category: 'Ficção', subgenre: 'Romantasia' },
    'rom-com': { category: 'Ficção', subgenre: 'Comédia romântica' },
    'romcom': { category: 'Ficção', subgenre: 'Comédia romântica' },
    'romantic comedy': { category: 'Ficção', subgenre: 'Comédia romântica' },
    'dark romance': { category: 'Ficção', subgenre: 'Dark Romance' },
    'western': { category: 'Ficção', subgenre: 'Faroeste' },
    'post-apocalyptic': { category: 'Ficção', subgenre: 'Pós-apocalíptico' },
    'magical realism': { category: 'Ficção', subgenre: 'Realismo mágico' },
    'gothic': { category: 'Ficção', subgenre: 'Gótico' },
    'espionage': { category: 'Ficção', subgenre: 'Espionagem' },
    'spy': { category: 'Ficção', subgenre: 'Espionagem' },
    'war': { category: 'Ficção', subgenre: 'Guerra' },
    'psychological thriller': { category: 'Ficção', subgenre: 'Thriller psicológico' },
    'contemporary': { category: 'Ficção', subgenre: 'Ficção contemporânea' },
    'true crime': { category: 'Não ficção', subgenre: 'True crime' },
    'education': { category: 'Não ficção', subgenre: 'Educação' },
    'feminism': { category: 'Não ficção', subgenre: 'Feminismo' },
    'nature': { category: 'Não ficção', subgenre: 'Natureza e Meio ambiente' },
    'medicine': { category: 'Não ficção', subgenre: 'Medicina' },
    'law': { category: 'Não ficção', subgenre: 'Direito' },
    'astronomy': { category: 'Não ficção', subgenre: 'Astronomia' },
    'productivity': { category: 'Não ficção', subgenre: 'Produtividade' },
    'relationships': { category: 'Não ficção', subgenre: 'Relacionamentos' },
    'parenting': { category: 'Não ficção', subgenre: 'Parentalidade' },
    'comics': { category: 'Outros', subgenre: 'Quadrinhos e Mangá' },
    'manga': { category: 'Outros', subgenre: 'Quadrinhos e Mangá' },
    'mangá': { category: 'Outros', subgenre: 'Quadrinhos e Mangá' },
    'quadrinhos': { category: 'Outros', subgenre: 'Quadrinhos e Mangá' },
    'meditation': { category: 'Outros', subgenre: 'Meditação' },
    'podcast': { category: 'Outros', subgenre: 'Podcasts' },
    'audio drama': { category: 'Outros', subgenre: 'Audiodrama' },
    'radio drama': { category: 'Outros', subgenre: 'Audiodrama' }
  };

  // 1. Try resolving via subgenre directly
  if (subKey && subKey !== 'desconhecido' && subKey !== 'outros' && subKey !== 'outro') {
    if (aliases[subKey]) {
      return aliases[subKey];
    }
    for (const genre of Object.values(GENRE_HIERARCHY)) {
      const match = genre.subgenres.find(s => s.toLowerCase() === subKey);
      if (match) {
        return { category: genre.name, subgenre: match };
      }
    }
  }

  // 2. Check if category is a top-level parent genre
  const matchedGenre = Object.values(GENRE_HIERARCHY).find(
    g => g.name.toLowerCase() === catKey || g.id.toLowerCase() === catKey
  );

  if (matchedGenre) {
    if (subKey && subKey !== 'desconhecido') {
      const match = matchedGenre.subgenres.find(s => s.toLowerCase() === subKey);
      if (match) {
        return { category: matchedGenre.name, subgenre: match };
      }
      return { category: matchedGenre.name, subgenre: sub };
    }
    return { category: matchedGenre.name, subgenre: 'Outros' };
  }

  // 3. Try resolving via category aliases
  if (catKey && aliases[catKey]) {
    const aliasMatch = aliases[catKey];
    if (sub && subKey !== 'desconhecido') {
      return { category: aliasMatch.category, subgenre: sub };
    }
    return aliasMatch;
  }

  // 4. Check if category matches any subgenre across the hierarchy
  if (catKey) {
    for (const genre of Object.values(GENRE_HIERARCHY)) {
      const match = genre.subgenres.find(s => s.toLowerCase() === catKey);
      if (match) {
        return { category: genre.name, subgenre: sub || match };
      }
    }
  }

  // Fallback
  return {
    category: cat || 'Outros',
    subgenre: sub || 'Outros'
  };
}