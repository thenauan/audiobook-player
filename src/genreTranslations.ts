import type { SupportedLanguage } from './translations';
import { splitGenreValues } from './genreData';

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
  'lgbtq': {
    pt: 'LGBTQ+',
    en: 'LGBTQ+',
    es: 'LGBTQ+',
    ru: 'ЛГБТК+',
    ar: 'مجتمع الميم',
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
  // Novos (gênero LGBTQ+ e mais opções)
  "romantasia": { pt: "Romantasia", en: "Romantasy", es: "Romantasía", ru: "Романтическое фэнтези", ar: "فانتازيا رومانسية" },
  "comédia romântica": { pt: "Comédia romântica", en: "Romantic Comedy", es: "Comedia romántica", ru: "Романтическая комедия", ar: "كوميديا رومانسية" },
  "comedia romantica": { pt: "Comédia romântica", en: "Romantic Comedy", es: "Comedia romántica", ru: "Романтическая комедия", ar: "كوميديا رومانسية" },
  "dark romance": { pt: "Dark Romance", en: "Dark Romance", es: "Dark Romance", ru: "Дарк-романс", ar: "رومانسية مظلمة" },
  "ficção contemporânea": { pt: "Ficção contemporânea", en: "Contemporary Fiction", es: "Ficción contemporánea", ru: "Современная проза", ar: "خيال معاصر" },
  "ficcao contemporanea": { pt: "Ficção contemporânea", en: "Contemporary Fiction", es: "Ficción contemporánea", ru: "Современная проза", ar: "خيال معاصر" },
  "thriller psicológico": { pt: "Thriller psicológico", en: "Psychological Thriller", es: "Thriller psicológico", ru: "Психологический триллер", ar: "تشويق نفسي" },
  "thriller psicologico": { pt: "Thriller psicológico", en: "Psychological Thriller", es: "Thriller psicológico", ru: "Психологический триллер", ar: "تشويق نفسي" },
  "espionagem": { pt: "Espionagem", en: "Spy Fiction", es: "Espionaje", ru: "Шпионский роман", ar: "تجسس" },
  "guerra": { pt: "Guerra", en: "War Fiction", es: "Bélica", ru: "Военная проза", ar: "حرب" },
  "faroeste": { pt: "Faroeste", en: "Western", es: "Western", ru: "Вестерн", ar: "غرب أمريكي" },
  "pós-apocalíptico": { pt: "Pós-apocalíptico", en: "Post-apocalyptic", es: "Postapocalíptico", ru: "Постапокалипсис", ar: "ما بعد الكارثة" },
  "pos-apocaliptico": { pt: "Pós-apocalíptico", en: "Post-apocalyptic", es: "Postapocalíptico", ru: "Постапокалипсис", ar: "ما بعد الكارثة" },
  "steampunk": { pt: "Steampunk", en: "Steampunk", es: "Steampunk", ru: "Стимпанк", ar: "ستيمبانك" },
  "realismo mágico": { pt: "Realismo mágico", en: "Magical Realism", es: "Realismo mágico", ru: "Магический реализм", ar: "واقعية سحرية" },
  "realismo magico": { pt: "Realismo mágico", en: "Magical Realism", es: "Realismo mágico", ru: "Магический реализм", ar: "واقعية سحرية" },
  "gótico": { pt: "Gótico", en: "Gothic", es: "Gótico", ru: "Готика", ar: "قوطي" },
  "gotico": { pt: "Gótico", en: "Gothic", es: "Gótico", ru: "Готика", ar: "قوطي" },
  "true crime": { pt: "True crime", en: "True Crime", es: "True crime", ru: "Тру-крайм", ar: "جرائم حقيقية" },
  "educação": { pt: "Educação", en: "Education", es: "Educación", ru: "Образование", ar: "تعليم" },
  "educacao": { pt: "Educação", en: "Education", es: "Educación", ru: "Образование", ar: "تعليم" },
  "feminismo": { pt: "Feminismo", en: "Feminism", es: "Feminismo", ru: "Феминизм", ar: "نسوية" },
  "natureza e meio ambiente": { pt: "Natureza e Meio ambiente", en: "Nature & Environment", es: "Naturaleza y Medio ambiente", ru: "Природа и экология", ar: "الطبيعة والبيئة" },
  "medicina": { pt: "Medicina", en: "Medicine", es: "Medicina", ru: "Медицина", ar: "طب" },
  "direito": { pt: "Direito", en: "Law", es: "Derecho", ru: "Право", ar: "قانون" },
  "astronomia": { pt: "Astronomia", en: "Astronomy", es: "Astronomía", ru: "Астрономия", ar: "علم الفلك" },
  "produtividade": { pt: "Produtividade", en: "Productivity", es: "Productividad", ru: "Продуктивность", ar: "إنتاجية" },
  "relacionamentos": { pt: "Relacionamentos", en: "Relationships", es: "Relaciones", ru: "Отношения", ar: "علاقات" },
  "parentalidade": { pt: "Parentalidade", en: "Parenting", es: "Crianza", ru: "Воспитание детей", ar: "تربية الأبناء" },
  "romantismo": { pt: "Romantismo", en: "Romanticism", es: "Romanticismo", ru: "Романтизм", ar: "الرومانسية الأدبية" },
  "modernismo": { pt: "Modernismo", en: "Modernism", es: "Modernismo", ru: "Модернизм", ar: "الحداثة" },
  "literatura portuguesa": { pt: "Literatura portuguesa", en: "Portuguese Literature", es: "Literatura portuguesa", ru: "Португальская литература", ar: "الأدب البرتغالي" },
  "literatura latino-americana": { pt: "Literatura latino-americana", en: "Latin American Literature", es: "Literatura latinoamericana", ru: "Латиноамериканская литература", ar: "أدب أمريكا اللاتينية" },
  "literatura africana": { pt: "Literatura africana", en: "African Literature", es: "Literatura africana", ru: "Африканская литература", ar: "الأدب الأفريقي" },
  "literatura de cordel": { pt: "Literatura de cordel", en: "Cordel Literature", es: "Literatura de cordel", ru: "Литература кордель", ar: "أدب الكورديل" },
  "romance juvenil": { pt: "Romance juvenil", en: "YA Romance", es: "Romance juvenil", ru: "Подростковый роман", ar: "رومانسية للناشئة" },
  "distopia juvenil": { pt: "Distopia juvenil", en: "YA Dystopia", es: "Distopía juvenil", ru: "Подростковая антиутопия", ar: "ديستوبيا للناشئة" },
  "mistério juvenil": { pt: "Mistério juvenil", en: "YA Mystery", es: "Misterio juvenil", ru: "Подростковый детектив", ar: "غموض للناشئة" },
  "misterio juvenil": { pt: "Mistério juvenil", en: "YA Mystery", es: "Misterio juvenil", ru: "Подростковый детектив", ar: "غموض للناشئة" },
  "quadrinhos e mangá": { pt: "Quadrinhos e Mangá", en: "Comics & Manga", es: "Cómics y Manga", ru: "Комиксы и манга", ar: "قصص مصورة ومانغا" },
  "quadrinhos e manga": { pt: "Quadrinhos e Mangá", en: "Comics & Manga", es: "Cómics y Manga", ru: "Комиксы и манга", ar: "قصص مصورة ومانغا" },
  "meditação": { pt: "Meditação", en: "Meditation", es: "Meditación", ru: "Медитация", ar: "تأمل" },
  "meditacao": { pt: "Meditação", en: "Meditation", es: "Meditación", ru: "Медитация", ar: "تأمل" },
  "podcasts": { pt: "Podcasts", en: "Podcasts", es: "Podcasts", ru: "Подкасты", ar: "بودكاست" },
  "audiodrama": { pt: "Audiodrama", en: "Audio Drama", es: "Radioteatro", ru: "Аудиоспектакль", ar: "دراما صوتية" },
  "palestras e cursos": { pt: "Palestras e Cursos", en: "Lectures & Courses", es: "Charlas y Cursos", ru: "Лекции и курсы", ar: "محاضرات ودورات" },
  "romance lgbtq+": { pt: "Romance LGBTQ+", en: "LGBTQ+ Romance", es: "Romance LGBTQ+", ru: "ЛГБТК+ любовный роман", ar: "رومانسية مجتمع الميم" },
  "ficção lgbtq+": { pt: "Ficção LGBTQ+", en: "LGBTQ+ Fiction", es: "Ficción LGBTQ+", ru: "ЛГБТК+ проза", ar: "خيال مجتمع الميم" },
  "ficcao lgbtq+": { pt: "Ficção LGBTQ+", en: "LGBTQ+ Fiction", es: "Ficción LGBTQ+", ru: "ЛГБТК+ проза", ar: "خيال مجتمع الميم" },
  "fantasia lgbtq+": { pt: "Fantasia LGBTQ+", en: "LGBTQ+ Fantasy", es: "Fantasía LGBTQ+", ru: "ЛГБТК+ фэнтези", ar: "فانتازيا مجتمع الميم" },
  "young adult lgbtq+": { pt: "Young Adult LGBTQ+", en: "LGBTQ+ Young Adult", es: "Juvenil LGBTQ+", ru: "ЛГБТК+ для подростков", ar: "ناشئة مجتمع الميم" },
  "memórias lgbtq+": { pt: "Memórias LGBTQ+", en: "LGBTQ+ Memoir", es: "Memorias LGBTQ+", ru: "ЛГБТК+ мемуары", ar: "مذكرات مجتمع الميم" },
  "memorias lgbtq+": { pt: "Memórias LGBTQ+", en: "LGBTQ+ Memoir", es: "Memorias LGBTQ+", ru: "ЛГБТК+ мемуары", ar: "مذكرات مجتمع الميم" },
  "não ficção lgbtq+": { pt: "Não ficção LGBTQ+", en: "LGBTQ+ Non-fiction", es: "No ficción LGBTQ+", ru: "ЛГБТК+ нон-фикшн", ar: "غير خيالي لمجتمع الميم" },
  "nao ficcao lgbtq+": { pt: "Não ficção LGBTQ+", en: "LGBTQ+ Non-fiction", es: "No ficción LGBTQ+", ru: "ЛГБТК+ нон-фикшн", ar: "غير خيالي لمجتمع الميم" },
  "poesia lgbtq+": { pt: "Poesia LGBTQ+", en: "LGBTQ+ Poetry", es: "Poesía LGBTQ+", ru: "ЛГБТК+ поэзия", ar: "شعر مجتمع الميم" },
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
  // Vários gêneros ("Ficção, Literatura"): cada um traduzido
  if (/[,;]/.test(genreIdOrName)) return splitGenreValues(genreIdOrName).map(g => getGenreName(g, lang)).join(', ');
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

  if (key === 'lgbtq+' || key === 'lgbtq' || key === 'lgbt') {
    return GENRE_TRANSLATIONS['lgbtq']?.[lang] || 'LGBTQ+';
  }

  // Procura no dicionário de gêneros
  const match = GENRE_TRANSLATIONS[key];
  if (match && match[lang]) return match[lang];

  return genreIdOrName;
}

export function getSubgenreName(subgenre: string, lang: SupportedLanguage = 'pt'): string {
  if (!subgenre) return '';
  if (/[,;]/.test(subgenre)) return splitGenreValues(subgenre).map(g => getSubgenreName(g, lang)).join(', ');
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

