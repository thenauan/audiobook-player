import type { SupportedLanguage } from './translations';

export const GENRE_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  'ficcao': {
    pt: 'Ficção',
    en: 'Fiction',
    es: 'Ficción',
    ru: 'Художественная литература',
    ar: 'خيال',
  },
  'nao-ficcao': {
    pt: 'Não ficção',
    en: 'Non-fiction',
    es: 'No ficción',
    ru: 'Документальная литература',
    ar: 'غير خيالي',
  },
  'literatura': {
    pt: 'Literatura',
    en: 'Literature',
    es: 'Literatura',
    ru: 'Литература',
    ar: 'الأدب',
  },
  'infantil-e-juvenil': {
    pt: 'Infantil e Juvenil',
    en: 'Children & Young Adult',
    es: 'Infantil y Juvenil',
    ru: 'Детская и подростковая',
    ar: 'للأطفال والناشئة',
  },
  'outros': {
    pt: 'Outros',
    en: 'Others',
    es: 'Otros',
    ru: 'Другое',
    ar: 'أخرى',
  },
  'desconhecido': {
    pt: 'Desconhecido',
    en: 'Unknown',
    es: 'Desconocido',
    ru: 'Неизвестно',
    ar: 'غير معروف',
  },
};

export const SUBGENRE_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  // Ficção
  'romance': { pt: 'Romance', en: 'Romance', es: 'Romance', ru: 'Любовный роман', ar: 'رواية رومانسية' },
  'drama': { pt: 'Drama', en: 'Drama', es: 'Drama', ru: 'Драма', ar: 'دراما' },
  'aventura': { pt: 'Aventura', en: 'Adventure', es: 'Aventura', ru: 'Приключения', ar: 'مغامرة' },
  'ação': { pt: 'Ação', en: 'Action', es: 'Acción', ru: 'Боевик', ar: 'أكشن' },
  'acao': { pt: 'Ação', en: 'Action', es: 'Acción', ru: 'Боевик', ar: 'أكشن' },
  'mistério': { pt: 'Mistério', en: 'Mystery', es: 'Misterio', ru: 'Детектив', ar: 'غموض' },
  'misterio': { pt: 'Mistério', en: 'Mystery', es: 'Misterio', ru: 'Детектив', ar: 'غموض' },
  'suspense': { pt: 'Suspense', en: 'Suspense', es: 'Suspense', ru: 'Триллер', ar: 'إثارة وتشويق' },
  'thriller': { pt: 'Thriller', en: 'Thriller', es: 'Thriller', ru: 'Остросюжетный', ar: 'تشويق' },
  'policial': { pt: 'Policial', en: 'Crime & Police', es: 'Policiaco', ru: 'Полицейский детектив', ar: 'بوليسي' },
  'terror': { pt: 'Terror', en: 'Horror', es: 'Terror', ru: 'Ужасы', ar: 'رعب' },
  'horror': { pt: 'Horror', en: 'Horror', es: 'Horror', ru: 'Хоррор', ar: 'رعب شديد' },
  'fantasia': { pt: 'Fantasia', en: 'Fantasy', es: 'Fantasía', ru: 'Фэнтези', ar: 'فانتازيا' },
  'alta fantasia': { pt: 'Alta Fantasia', en: 'High Fantasy', es: 'Alta Fantasía', ru: 'Эпическое фэнтези', ar: 'فانتازيا ملحمية' },
  'fantasia urbana': { pt: 'Fantasia Urbana', en: 'Urban Fantasy', es: 'Fantasía Urbana', ru: 'Городское фэнтези', ar: 'فانتازيا مدنية' },
  'ficção científica': { pt: 'Ficção científica', en: 'Science Fiction', es: 'Ciencia ficción', ru: 'Научная фантастика', ar: 'خيال علمي' },
  'ficcao cientifica': { pt: 'Ficção científica', en: 'Science Fiction', es: 'Ciencia ficción', ru: 'Научная фантастика', ar: 'خيال علمي' },
  'space opera': { pt: 'Space Opera', en: 'Space Opera', es: 'Space Opera', ru: 'Космическая опера', ar: 'أوبرا الفضاء' },
  'cyberpunk': { pt: 'Cyberpunk', en: 'Cyberpunk', es: 'Ciberpunk', ru: 'Киберпанк', ar: 'سايبربانك' },
  'distopia': { pt: 'Distopia', en: 'Dystopia', es: 'Distopía', ru: 'Антиутопия', ar: 'ديستوبيا' },
  'ficção histórica': { pt: 'Ficção histórica', en: 'Historical Fiction', es: 'Ficción histórica', ru: 'Исторический роман', ar: 'خيال تاريخي' },
  'ficcao historica': { pt: 'Ficção histórica', en: 'Historical Fiction', es: 'Ficción histórica', ru: 'Исторический роман', ar: 'خيال تاريخي' },
  'sobrenatural': { pt: 'Sobrenatural', en: 'Supernatural', es: 'Sobrenatural', ru: 'Сверхъестественное', ar: 'خوارق' },

  // Não ficção
  'história': { pt: 'História', en: 'History', es: 'Historia', ru: 'История', ar: 'تاريخ' },
  'historia': { pt: 'História', en: 'History', es: 'Historia', ru: 'История', ar: 'تاريخ' },
  'biografia': { pt: 'Biografia', en: 'Biography', es: 'Biografía', ru: 'Биография', ar: 'سيرة ذاتية' },
  'memórias': { pt: 'Memórias', en: 'Memoirs', es: 'Memorias', ru: 'Мемуары', ar: 'مذكرات' },
  'memorias': { pt: 'Memórias', en: 'Memoirs', es: 'Memorias', ru: 'Мемуары', ar: 'مذكرات' },
  'filosofia': { pt: 'Filosofia', en: 'Philosophy', es: 'Filosofía', ru: 'Философия', ar: 'فلسفة' },
  'estoicismo': { pt: 'Estoicismo', en: 'Stoicism', es: 'Estoicismo', ru: 'Стоицизм', ar: 'رواقية' },
  'psicologia': { pt: 'Psicologia', en: 'Psychology', es: 'Psicología', ru: 'Психология', ar: 'علم النفس' },
  'ciência': { pt: 'Ciência', en: 'Science', es: 'Ciencia', ru: 'Наука', ar: 'علوم' },
  'ciencia': { pt: 'Ciência', en: 'Science', es: 'Ciencia', ru: 'Наука', ar: 'علوم' },
  'tecnologia': { pt: 'Tecnologia', en: 'Technology', es: 'Tecnología', ru: 'Технологии', ar: 'تكنولوجيا' },
  'política': { pt: 'Política', en: 'Politics', es: 'Política', ru: 'Политика', ar: 'سياسة' },
  'politica': { pt: 'Política', en: 'Politics', es: 'Política', ru: 'Политика', ar: 'سياسة' },
  'economia': { pt: 'Economia', en: 'Economics', es: 'Economía', ru: 'Экономика', ar: 'اقتصاد' },
  'finanças': { pt: 'Finanças', en: 'Finance', es: 'Finanzas', ru: 'Финансы', ar: 'مالية' },
  'financas': { pt: 'Finanças', en: 'Finance', es: 'Finanzas', ru: 'Финансы', ar: 'مالية' },
  'negócios': { pt: 'Negócios', en: 'Business', es: 'Negocios', ru: 'Бизнес', ar: 'أعمال' },
  'negocios': { pt: 'Negócios', en: 'Business', es: 'Negocios', ru: 'Бизнес', ar: 'أعمال' },
  'liderança': { pt: 'Liderança', en: 'Leadership', es: 'Liderazgo', ru: 'Лидерство', ar: 'قيادة' },
  'lideranca': { pt: 'Liderança', en: 'Leadership', es: 'Liderazgo', ru: 'Лидерство', ar: 'قيادة' },
  'autoajuda': { pt: 'Autoajuda', en: 'Self-help', es: 'Autoayuda', ru: 'Саморазвитие', ar: 'تطوير الذات' },
  'desenvolvimento pessoal': { pt: 'Desenvolvimento pessoal', en: 'Personal Development', es: 'Desarrollo personal', ru: 'Личностный рост', ar: 'تنمية بشرية' },
  'saúde e bem-estar': { pt: 'Saúde e Bem-estar', en: 'Health & Wellness', es: 'Salud y Bienestar', ru: 'Здоровье и благополучие', ar: 'صحة وعافية' },
  'saude e bem-estar': { pt: 'Saúde e Bem-estar', en: 'Health & Wellness', es: 'Salud y Bienestar', ru: 'Здоровье и благополучие', ar: 'صحة وعافية' },
  'sociologia': { pt: 'Sociologia', en: 'Sociology', es: 'Sociología', ru: 'Социология', ar: 'علم الاجتماع' },
  'espiritualidade': { pt: 'Espiritualidade', en: 'Spirituality', es: 'Espiritualidad', ru: 'Духовность', ar: 'روحانيات' },

  // Literatura
  'clássicos': { pt: 'Clássicos', en: 'Classics', es: 'Clásicos', ru: 'Классика', ar: 'كلاسيكيات' },
  'classicos': { pt: 'Clássicos', en: 'Classics', es: 'Clásicos', ru: 'Классика', ar: 'كلاسيكيات' },
  'poesia': { pt: 'Poesia', en: 'Poetry', es: 'Poesía', ru: 'Поэзия', ar: 'شعر' },
  'teatro': { pt: 'Teatro', en: 'Plays & Theater', es: 'Teatro', ru: 'Драматургия', ar: 'مسرح' },
  'contos': { pt: 'Contos', en: 'Short Stories', es: 'Cuentos', ru: 'Рассказы', ar: 'قصص قصيرة' },
  'crônicas': { pt: 'Crônicas', en: 'Chronicles', es: 'Crónicas', ru: 'Хроники', ar: 'مقالات أدبية' },
  'cronicas': { pt: 'Crônicas', en: 'Chronicles', es: 'Crónicas', ru: 'Хроники', ar: 'مقالات أدبية' },
  'ensaios': { pt: 'Ensaios', en: 'Essays', es: 'Ensayos', ru: 'Эссе', ar: 'مقالات' },
  'romance clássico': { pt: 'Romance clássico', en: 'Classic Romance', es: 'Novela clásica', ru: 'Классический роман', ar: 'رواية كلاسيكية' },
  'romance classico': { pt: 'Romance clássico', en: 'Classic Romance', es: 'Novela clásica', ru: 'Классический роман', ar: 'رواية كلاسيكية' },
  'fábulas': { pt: 'Fábulas', en: 'Fables', es: 'Fábulas', ru: 'Басни', ar: 'خرافات' },
  'fabulas': { pt: 'Fábulas', en: 'Fables', es: 'Fábulas', ru: 'Басни', ar: 'خرافات' },
  'mitologia': { pt: 'Mitologia', en: 'Mythology', es: 'Mitología', ru: 'Мифология', ar: 'ميثولوجيا' },
  'realismo': { pt: 'Realismo', en: 'Realism', es: 'Realismo', ru: 'Реализм', ar: 'واقعية' },
  'literatura brasileira': { pt: 'Literatura brasileira', en: 'Brazilian Literature', es: 'Literatura brasileña', ru: 'Бразильская литература', ar: 'أدب برازيلي' },
  'literatura estrangeira': { pt: 'Literatura estrangeira', en: 'Foreign Literature', es: 'Literatura extranjera', ru: 'Зарубежная литература', ar: 'أدب أجنبي' },

  // Infantil e Juvenil
  'infantil': { pt: 'Infantil', en: 'Children', es: 'Infantil', ru: 'Детская литература', ar: 'أطفال' },
  'contos de fadas': { pt: 'Contos de fadas', en: 'Fairy Tales', es: 'Cuentos de hadas', ru: 'Сказки', ar: 'قصص خيالية' },
  'fábulas infantis': { pt: 'Fábulas infantis', en: "Children's Fables", es: 'Fábulas infantiles', ru: 'Детские басни', ar: 'حكايات أطفال' },
  'fabulas infantis': { pt: 'Fábulas infantis', en: "Children's Fables", es: 'Fábulas infantiles', ru: 'Детские басни', ar: 'حكايات أطفال' },
  'juvenil': { pt: 'Juvenil', en: 'Young Adult', es: 'Juvenil', ru: 'Подростковая литература', ar: 'يافعين' },
  'young adult': { pt: 'Young Adult', en: 'Young Adult', es: 'Young Adult', ru: 'Young Adult', ar: 'روايات اليافعين' },
  'fantasia juvenil': { pt: 'Fantasia juvenil', en: 'YA Fantasy', es: 'Fantasía juvenil', ru: 'Подростковое фэнтези', ar: 'فانتازيا للناشئة' },
  'aventura juvenil': { pt: 'Aventura juvenil', en: 'YA Adventure', es: 'Aventura juvenil', ru: 'Подростковые приключения', ar: 'مغامرات للناشئة' },
  'educativo infantil': { pt: 'Educativo infantil', en: "Children's Educational", es: 'Educativo infantil', ru: 'Развивающая литература', ar: 'تعليمي للأطفال' },
  'histórias de dormir': { pt: 'Histórias de dormir', en: 'Bedtime Stories', es: 'Cuentos para dormir', ru: 'Сказки на ночь', ar: 'قصص قبل النوم' },
  'historias de dormir': { pt: 'Histórias de dormir', en: 'Bedtime Stories', es: 'Cuentos para dormir', ru: 'Сказки на ночь', ar: 'قصص قبل النوم' },

  // Outros
  'humor': { pt: 'Humor', en: 'Humor', es: 'Humor', ru: 'Юмор', ar: 'فكاهة' },
  'comédia': { pt: 'Comédia', en: 'Comedy', es: 'Comedia', ru: 'Комедия', ar: 'كوميديا' },
  'comedia': { pt: 'Comédia', en: 'Comedy', es: 'Comedia', ru: 'Комедия', ar: 'كوميديا' },
  'religião': { pt: 'Religião', en: 'Religion', es: 'Religión', ru: 'Религия', ar: 'أديان' },
  'religiao': { pt: 'Religião', en: 'Religion', es: 'Religión', ru: 'Религия', ar: 'أديان' },
  'esportes': { pt: 'Esportes', en: 'Sports', es: 'Deportes', ru: 'Спорт', ar: 'رياضة' },
  'arte e música': { pt: 'Arte e Música', en: 'Art & Music', es: 'Arte y Música', ru: 'Искусство и музыка', ar: 'فن وموسيقى' },
  'arte e musica': { pt: 'Arte e Música', en: 'Art & Music', es: 'Arte y Música', ru: 'Искусство и музыка', ar: 'فن وموسيقى' },
  'culinária e gastronomia': { pt: 'Culinária e Gastronomia', en: 'Cooking & Gastronomy', es: 'Cocina y Gastronomía', ru: 'Кулинария', ar: 'طبخ ومأكولات' },
  'culinaria e gastronomia': { pt: 'Culinária e Gastronomia', en: 'Cooking & Gastronomy', es: 'Cocina y Gastronomía', ru: 'Кулинария', ar: 'طبخ ومأكولات' },
  'viagens e guias': { pt: 'Viagens e Guias', en: 'Travel & Guides', es: 'Viajes y Guías', ru: 'Путешествия и гиды', ar: 'سفر ودليل' },
  'idiomas e aprendizado': { pt: 'Idiomas e Aprendizado', en: 'Languages & Learning', es: 'Idiomas y Aprendizaje', ru: 'Языки и обучение', ar: 'لغات وتعليم' },
  'notícias e atualidades': { pt: 'Notícias e Atualidades', en: 'News & Current Affairs', es: 'Noticias y Actualidad', ru: 'Новости', ar: 'أخبار' },
  'noticias e atualidades': { pt: 'Notícias e Atualidades', en: 'News & Current Affairs', es: 'Noticias y Actualidad', ru: 'Новости', ar: 'أخبار' },
  'geral': { pt: 'Geral', en: 'General', es: 'General', ru: 'Общее', ar: 'عام' },
  'outros': { pt: 'Outros', en: 'Others', es: 'Otros', ru: 'Другое', ar: 'أخرى' },
};

function normalizeKey(str: string): string {
  return (str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

export function getGenreName(genreIdOrName: string, lang: SupportedLanguage = 'pt'): string {
  if (!genreIdOrName) return '';
  const key = normalizeKey(genreIdOrName);
  
  // Mapeamentos diretos
  if (key === 'ficcao' || key === 'ficcao-cientifica') {
    return GENRE_TRANSLATIONS['ficcao']?.[lang] || 'Ficção';
  }
  if (key === 'nao-ficcao') {
    return GENRE_TRANSLATIONS['nao-ficcao']?.[lang] || 'Não ficção';
  }
  if (key === 'literatura') {
    return GENRE_TRANSLATIONS['literatura']?.[lang] || 'Literatura';
  }
  if (key === 'infantil-e-juvenil' || key === 'infantil' || key === 'juvenil') {
    return GENRE_TRANSLATIONS['infantil-e-juvenil']?.[lang] || 'Infantil e Juvenil';
  }
  if (key === 'outros') {
    return GENRE_TRANSLATIONS['outros']?.[lang] || 'Outros';
  }
  if (key === 'desconhecido') {
    return GENRE_TRANSLATIONS['desconhecido']?.[lang] || 'Desconhecido';
  }

  // Procura no dicionário de gêneros
  const match = GENRE_TRANSLATIONS[key];
  if (match && match[lang]) return match[lang];

  return genreIdOrName;
}

export function getSubgenreName(subgenre: string, lang: SupportedLanguage = 'pt'): string {
  if (!subgenre) return '';
  const clean = subgenre.trim().toLowerCase();
  
  if (SUBGENRE_TRANSLATIONS[clean]?.[lang]) {
    return SUBGENRE_TRANSLATIONS[clean][lang];
  }

  // Tenta sem acentos
  const noAccents = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (SUBGENRE_TRANSLATIONS[noAccents]?.[lang]) {
    return SUBGENRE_TRANSLATIONS[noAccents][lang];
  }

  // Se for "outros" ou "outro"
  if (clean === 'outros' || clean === 'outro') {
    return SUBGENRE_TRANSLATIONS['outros']?.[lang] || 'Outros';
  }

  return subgenre;
}

