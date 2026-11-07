import type { SupportedLanguage } from './translations';

export interface NationalityEntry {
  countryPt: string;
  pt: string;
  en: string;
  es: string;
  ru: string;
  ar: string;
  aliases?: string[];
}

export const NATIONALITIES_LIST: NationalityEntry[] = [
  { countryPt: 'Afeganistão', pt: 'Afegão', en: 'Afghan', es: 'Afgano', ru: 'Афганец', ar: 'أفغاني', aliases: ['afega', 'afegao', 'afghanistan'] },
  { countryPt: 'África do Sul', pt: 'Sul-africano', en: 'South African', es: 'Sudafricano', ru: 'Южноафриканец', ar: 'جنوب أفريقي', aliases: ['sul-africana', 'sulafricano', 'sulafricana', 'south africa'] },
  { countryPt: 'Albânia', pt: 'Albanês', en: 'Albanian', es: 'Albanés', ru: 'Албанец', ar: 'ألباني', aliases: ['albanesa', 'albania'] },
  { countryPt: 'Alemanha', pt: 'Alemão', en: 'German', es: 'Alemán', ru: 'Немец', ar: 'ألماني', aliases: ['alema', 'alemã', 'alemana', 'germany', 'deutsch', 'немка'] },
  { countryPt: 'Andorra', pt: 'Andorrano', en: 'Andorran', es: 'Andorrano', ru: 'Андоррец', ar: 'أندوري', aliases: ['andorrana'] },
  { countryPt: 'Angola', pt: 'Angolano', en: 'Angolan', es: 'Angoleño', ru: 'Анголец', ar: 'أنغولي', aliases: ['angolana', 'angolena'] },
  { countryPt: 'Antígua e Barbuda', pt: 'Antiguano', en: 'Antiguan', es: 'Antiguano', ru: 'Антигуанец', ar: 'أنتيغوي', aliases: ['antiguana', 'antigua and barbuda'] },
  { countryPt: 'Arábia Saudita', pt: 'Saudita', en: 'Saudi', es: 'Saudita', ru: 'Саудовец', ar: 'سعودي', aliases: ['saudi arabia', 'saudi arabian', 'saudí'] },
  { countryPt: 'Argélia', pt: 'Argelino', en: 'Algerian', es: 'Argelino', ru: 'Алжирец', ar: 'جزائري', aliases: ['argelina', 'algeria'] },
  { countryPt: 'Argentina', pt: 'Argentino', en: 'Argentine', es: 'Argentino', ru: 'Аргентинец', ar: 'أرجنتيني', aliases: ['argentina', 'argentinian'] },
  { countryPt: 'Armênia', pt: 'Armênio', en: 'Armenian', es: 'Armenio', ru: 'Армянин', ar: 'أرميني', aliases: ['armenia', 'armênia'] },
  { countryPt: 'Austrália', pt: 'Australiano', en: 'Australian', es: 'Australiano', ru: 'Австралиец', ar: 'أسترالي', aliases: ['australiana', 'australia'] },
  { countryPt: 'Áustria', pt: 'Austríaco', en: 'Austrian', es: 'Austriaco', ru: 'Австриец', ar: 'نمساوي', aliases: ['austriaca', 'austríaca', 'austria'] },
  { countryPt: 'Azerbaijão', pt: 'Azerbaijano', en: 'Azerbaijani', es: 'Azerbaiyano', ru: 'Азербайджанец', ar: 'أذربيجاني', aliases: ['azerbaijana', 'azerbaijan', 'azeri'] },
  { countryPt: 'Bahamas', pt: 'Bahamense', en: 'Bahamian', es: 'Bahameño', ru: 'Багамец', ar: 'بهامي', aliases: ['bahamena'] },
  { countryPt: 'Bangladesh', pt: 'Bangladês', en: 'Bangladeshi', es: 'Bangladesí', ru: 'Бангладешец', ar: 'بنغلاديشي', aliases: ['bangladesa', 'bengali'] },
  { countryPt: 'Barbados', pt: 'Barbadiano', en: 'Barbadian', es: 'Barbadense', ru: 'Барбадосец', ar: 'بربادوسي', aliases: ['barbadiana'] },
  { countryPt: 'Bahrein', pt: 'Bareinita', en: 'Bahraini', es: 'Bahreiní', ru: 'Бахрейнец', ar: 'بحريني', aliases: ['bahrain', 'barein'] },
  { countryPt: 'Bélgica', pt: 'Belga', en: 'Belgian', es: 'Belga', ru: 'Бельгиец', ar: 'بلجيكي', aliases: ['belgium', 'belgica'] },
  { countryPt: 'Belize', pt: 'Belizenho', en: 'Belizean', es: 'Beliceño', ru: 'Белизец', ar: 'بليزي', aliases: ['belizenha', 'belicena'] },
  { countryPt: 'Benim', pt: 'Beninense', en: 'Beninese', es: 'Beninés', ru: 'Бенинец', ar: 'بنيني', aliases: ['benin', 'beninesa'] },
  { countryPt: 'Bielorrússia', pt: 'Bielorrusso', en: 'Belarusian', es: 'Bielorruso', ru: 'Белорус', ar: 'بيلاروسي', aliases: ['bielorrussa', 'belarus'] },
  { countryPt: 'Bolívia', pt: 'Boliviano', en: 'Bolivian', es: 'Boliviano', ru: 'Боливиец', ar: 'بوليفي', aliases: ['boliviana', 'bolivia'] },
  { countryPt: 'Bósnia e Herzegovina', pt: 'Bósnio', en: 'Bosnian', es: 'Bosnio', ru: 'Босниец', ar: 'بوسني', aliases: ['bosnia', 'bósnia', 'bosnia and herzegovina'] },
  { countryPt: 'Botsuana', pt: 'Tsuana', en: 'Motswana', es: 'Botsuano', ru: 'Ботсванец', ar: 'بوتسواني', aliases: ['botswana', 'botsuano', 'botsuana'] },
  { countryPt: 'Brasil', pt: 'Brasileiro', en: 'Brazilian', es: 'Brasileño', ru: 'Бразилец', ar: 'برازيلي', aliases: ['brasileira', 'brazil', 'brasilena', 'brasileña', 'бразильянка'] },
  { countryPt: 'Brunei', pt: 'Bruneano', en: 'Bruneian', es: 'Bruneano', ru: 'Брунеец', ar: 'بروناي', aliases: ['bruneana'] },
  { countryPt: 'Bulgária', pt: 'Búlgaro', en: 'Bulgarian', es: 'Búlgaro', ru: 'Болгарин', ar: 'بلغاري', aliases: ['bulgara', 'búlgara', 'bulgaria'] },
  { countryPt: 'Burkina Faso', pt: 'Burquinense', en: 'Burkinabe', es: 'Burkinés', ru: 'Буркиниец', ar: 'بوركينابي', aliases: ['burquines', 'burkinesa'] },
  { countryPt: 'Burundi', pt: 'Burundiano', en: 'Burundian', es: 'Burundés', ru: 'Бурундиец', ar: 'بوروندي', aliases: ['burundiana', 'burundes'] },
  { countryPt: 'Butão', pt: 'Butanês', en: 'Bhutanese', es: 'Butanés', ru: 'Бутанец', ar: 'بوتاني', aliases: ['butanesa', 'bhutan'] },
  { countryPt: 'Cabo Verde', pt: 'Cabo-verdiano', en: 'Cape Verdean', es: 'Caboverdiano', ru: 'Кабовердец', ar: 'الرأس الأخضر', aliases: ['cabo-verdiana', 'caboverdiana', 'cape verde'] },
  { countryPt: 'Camarões', pt: 'Camaronês', en: 'Cameroonian', es: 'Camerunés', ru: 'Камерунец', ar: 'كاميروني', aliases: ['camaronesa', 'cameroon'] },
  { countryPt: 'Camboja', pt: 'Cambojano', en: 'Cambodian', es: 'Camboyano', ru: 'Камбоджиец', ar: 'كمبودي', aliases: ['cambojana', 'cambodia'] },
  { countryPt: 'Canadá', pt: 'Canadense', en: 'Canadian', es: 'Canadiense', ru: 'Канадец', ar: 'كندي', aliases: ['canada', 'canadiana', 'canadiano'] },
  { countryPt: 'Catar', pt: 'Catariano', en: 'Qatari', es: 'Catarí', ru: 'Катарец', ar: 'قطري', aliases: ['catariana', 'catari', 'qatar'] },
  { countryPt: 'Cazaquistão', pt: 'Cazaque', en: 'Kazakhstani', es: 'Kazajo', ru: 'Казахстанец', ar: 'كازاخستاني', aliases: ['kazakh', 'kazakhstan', 'казах'] },
  { countryPt: 'Chade', pt: 'Chadiano', en: 'Chadian', es: 'Chadiano', ru: 'Чадец', ar: 'تشادي', aliases: ['chadiana', 'chad'] },
  { countryPt: 'Chile', pt: 'Chileno', en: 'Chilean', es: 'Chileno', ru: 'Чилиец', ar: 'تشيلي', aliases: ['chilena'] },
  { countryPt: 'China', pt: 'Chinês', en: 'Chinese', es: 'Chino', ru: 'Китаец', ar: 'صيني', aliases: ['chinesa', 'china', 'китаянка'] },
  { countryPt: 'Chipre', pt: 'Cipriota', en: 'Cypriot', es: 'Chipriota', ru: 'Киприот', ar: 'قبرصي', aliases: ['cyprus'] },
  { countryPt: 'Colômbia', pt: 'Colombiano', en: 'Colombian', es: 'Colombiano', ru: 'Колумбиец', ar: 'كولومبي', aliases: ['colombiana', 'colombia'] },
  { countryPt: 'Comores', pt: 'Comorense', en: 'Comoran', es: 'Comorense', ru: 'Коморец', ar: 'قمري', aliases: ['comoros'] },
  { countryPt: 'Congo-Brazzaville', pt: 'Congolês', en: 'Congolese', es: 'Congoleño', ru: 'Конголезец', ar: 'كونغولي', aliases: ['congolesa', 'congo', 'congo-kinshasa'] },
  { countryPt: 'Coreia do Norte', pt: 'Norte-coreano', en: 'North Korean', es: 'Norcoreano', ru: 'Северокореец', ar: 'كوري شمالي', aliases: ['norte-coreana', 'north korea'] },
  { countryPt: 'Coreia do Sul', pt: 'Sul-coreano', en: 'South Korean', es: 'Surcoreano', ru: 'Южнокореец', ar: 'كوري جنوبي', aliases: ['sul-coreana', 'coreano', 'coreana', 'korean', 'south korea', 'кореец'] },
  { countryPt: 'Costa do Marfim', pt: 'Marfinense', en: 'Ivorian', es: 'Marfileño', ru: 'Ивуариец', ar: 'إيفواري', aliases: ['marfilena', 'ivory coast', 'cote d ivoire'] },
  { countryPt: 'Costa Rica', pt: 'Costa-riquenho', en: 'Costa Rican', es: 'Costarricense', ru: 'Костариканец', ar: 'كوستاريكي', aliases: ['costa-riquenha', 'costarriquenho'] },
  { countryPt: 'Croácia', pt: 'Croata', en: 'Croatian', es: 'Croata', ru: 'Хорват', ar: 'كرواتي', aliases: ['croatia'] },
  { countryPt: 'Cuba', pt: 'Cubano', en: 'Cuban', es: 'Cubano', ru: 'Кубинец', ar: 'كوبي', aliases: ['cubana'] },
  { countryPt: 'Dinamarca', pt: 'Dinamarquês', en: 'Danish', es: 'Danés', ru: 'Датчанин', ar: 'دنماركي', aliases: ['dinamarquesa', 'denmark', 'danesa'] },
  { countryPt: 'Djibouti', pt: 'Djibutiano', en: 'Djiboutian', es: 'Yibutiano', ru: 'Джибутиец', ar: 'جيبوتي', aliases: ['djibutiana', 'djibuti'] },
  { countryPt: 'Dominica', pt: 'Dominiquense', en: 'Dominican', es: 'Dominiqués', ru: 'Доминикец', ar: 'دومينيكي', aliases: ['dominicano', 'dominicana', 'república dominicana', 'dominican republic'] },
  { countryPt: 'Egito', pt: 'Egípcio', en: 'Egyptian', es: 'Egipcio', ru: 'Египтянин', ar: 'مصري', aliases: ['egipcia', 'egípcia', 'egypt'] },
  { countryPt: 'El Salvador', pt: 'Salvadorenho', en: 'Salvadoran', es: 'Salvadoreño', ru: 'Сальвадорец', ar: 'سلفادوري', aliases: ['salvadorenha', 'salvadorena'] },
  { countryPt: 'Emirados Árabes Unidos', pt: 'Emiratense', en: 'Emirati', es: 'Emiratí', ru: 'Эмиратец', ar: 'إماراتي', aliases: ['uae', 'united arab emirates'] },
  { countryPt: 'Equador', pt: 'Equatoriano', en: 'Ecuadorian', es: 'Ecuatoriano', ru: 'Эквадорец', ar: 'إكوادوري', aliases: ['equatoriana', 'ecuador', 'ecuatoriana'] },
  { countryPt: 'Eritreia', pt: 'Eritreu', en: 'Eritrean', es: 'Eritreo', ru: 'Эритреец', ar: 'إريتري', aliases: ['eritreia', 'eritrea'] },
  { countryPt: 'Eslováquia', pt: 'Eslovaco', en: 'Slovak', es: 'Eslovaco', ru: 'Словак', ar: 'سلوفاكي', aliases: ['eslovaca', 'slovakia'] },
  { countryPt: 'Eslovênia', pt: 'Esloveno', en: 'Slovenian', es: 'Esloveno', ru: 'Словенец', ar: 'سلوفيني', aliases: ['eslovena', 'slovenia', 'slovene'] },
  { countryPt: 'Espanha', pt: 'Espanhol', en: 'Spanish', es: 'Español', ru: 'Испанец', ar: 'إسباني', aliases: ['espanhola', 'spain', 'espanola', 'испанка'] },
  { countryPt: 'Estados Unidos', pt: 'Americano', en: 'American', es: 'Estadounidense', ru: 'Американец', ar: 'أمريكي', aliases: ['estadunidense', 'americano', 'americana', 'norte-americano', 'norte-americana', 'estadunidense (americano)', 'usa', 'eua', 'united states', 'американка'] },
  { countryPt: 'Estônia', pt: 'Estoniano', en: 'Estonian', es: 'Estonio', ru: 'Эстонец', ar: 'إستوني', aliases: ['estoniana', 'estonia'] },
  { countryPt: 'Eswatini (Suazilândia)', pt: 'Suázi', en: 'Swazi', es: 'Suazi', ru: 'Свазилендец', ar: 'سوازي', aliases: ['eswatini', 'suazilandia', 'swaziland'] },
  { countryPt: 'Etiópia', pt: 'Etíope', en: 'Ethiopian', es: 'Etíope', ru: 'Эфиоп', ar: 'إثيوبي', aliases: ['ethiopia', 'etiopia'] },
  { countryPt: 'Fiji', pt: 'Fijiano', en: 'Fijian', es: 'Fiyiano', ru: 'Фиджиец', ar: 'فيجي', aliases: ['fijiana'] },
  { countryPt: 'Filipinas', pt: 'Filipino', en: 'Filipino', es: 'Filipino', ru: 'Филиппинец', ar: 'فلبيني', aliases: ['filipina', 'philippines', 'philippine'] },
  { countryPt: 'Finlândia', pt: 'Finlandês', en: 'Finnish', es: 'Finlandés', ru: 'Финн', ar: 'فنلندي', aliases: ['finlandesa', 'finland'] },
  { countryPt: 'França', pt: 'Francês', en: 'French', es: 'Francés', ru: 'Француз', ar: 'فرنسي', aliases: ['francesa', 'france', 'француженка'] },
  { countryPt: 'Gabão', pt: 'Gabonês', en: 'Gabonese', es: 'Gabonés', ru: 'Габонец', ar: 'غابوني', aliases: ['gabonesa', 'gabon'] },
  { countryPt: 'Gâmbia', pt: 'Gambiano', en: 'Gambian', es: 'Gambiano', ru: 'Гамбиец', ar: 'غامبي', aliases: ['gambiana', 'gambia'] },
  { countryPt: 'Gana', pt: 'Ganês', en: 'Ghanaian', es: 'Ghanés', ru: 'Ганец', ar: 'غاني', aliases: ['ganesa', 'ghana'] },
  { countryPt: 'Geórgia', pt: 'Georgiano', en: 'Georgian', es: 'Georgiano', ru: 'Грузин', ar: 'جورجي', aliases: ['georgiana', 'georgia'] },
  { countryPt: 'Grécia', pt: 'Grego', en: 'Greek', es: 'Griego', ru: 'Грек', ar: 'يوناني', aliases: ['grega', 'greece', 'griega'] },
  { countryPt: 'Granada', pt: 'Granadino', en: 'Grenadian', es: 'Granadino', ru: 'Гренадец', ar: 'غرينادي', aliases: ['granadina', 'grenada'] },
  { countryPt: 'Guatemala', pt: 'Guatemalteco', en: 'Guatemalan', es: 'Guatemalteco', ru: 'Гватемалец', ar: 'غواتيمالي', aliases: ['guatemalteca'] },
  { countryPt: 'Guiana', pt: 'Guianense', en: 'Guyanese', es: 'Guyanés', ru: 'Гайанец', ar: 'غياني', aliases: ['guyana', 'guianes'] },
  { countryPt: 'Guiné', pt: 'Guineano', en: 'Guinean', es: 'Guineano', ru: 'Гвинеец', ar: 'غيني', aliases: ['guineana', 'guinea'] },
  { countryPt: 'Guiné-Bissau', pt: 'Guineense', en: 'Bissau-Guinean', es: 'Guineano', ru: 'Гвинеец-бисау', ar: 'غيني بيساوي', aliases: ['guinea-bissau'] },
  { countryPt: 'Guiné Equatorial', pt: 'Guinéu-equatoriano', en: 'Equatorial Guinean', es: 'Ecuatoguineano', ru: 'Экваториальный гвинеец', ar: 'غيني استوائي', aliases: ['equatorial guinea'] },
  { countryPt: 'Haiti', pt: 'Haitiano', en: 'Haitian', es: 'Haitiano', ru: 'Гаитянин', ar: 'هايتي', aliases: ['haitiana'] },
  { countryPt: 'Honduras', pt: 'Hondurenho', en: 'Honduran', es: 'Hondureño', ru: 'Гондурасец', ar: 'هندوراسي', aliases: ['hondurenha', 'hondurena'] },
  { countryPt: 'Hungria', pt: 'Húngaro', en: 'Hungarian', es: 'Húngaro', ru: 'Венгр', ar: 'مجري', aliases: ['hungara', 'húngara', 'hungary'] },
  { countryPt: 'Iêmen', pt: 'Iemenita', en: 'Yemeni', es: 'Yemení', ru: 'Йеменец', ar: 'يمني', aliases: ['yemen', 'iemen'] },
  { countryPt: 'Índia', pt: 'Indiano', en: 'Indian', es: 'Indio', ru: 'Индиец', ar: 'هندي', aliases: ['indiana', 'india', 'индианка'] },
  { countryPt: 'Indonésia', pt: 'Indonésio', en: 'Indonesian', es: 'Indonesio', ru: 'Индонезиец', ar: 'إندونيسي', aliases: ['indonesia', 'indonésia'] },
  { countryPt: 'Irã', pt: 'Iraniano', en: 'Iranian', es: 'Iraní', ru: 'Иранец', ar: 'إيراني', aliases: ['iraniana', 'iran', 'persa', 'persian'] },
  { countryPt: 'Iraque', pt: 'Iraquiano', en: 'Iraqi', es: 'Iraquí', ru: 'Иракец', ar: 'عراقي', aliases: ['iraquiana', 'iraq'] },
  { countryPt: 'Irlanda', pt: 'Irlandês', en: 'Irish', es: 'Irlandés', ru: 'Ирландец', ar: 'أيرلندي', aliases: ['irlandesa', 'ireland'] },
  { countryPt: 'Islândia', pt: 'Islandês', en: 'Icelandic', es: 'Islandés', ru: 'Исландец', ar: 'أيسلندي', aliases: ['islandesa', 'iceland', 'icelander'] },
  { countryPt: 'Israel', pt: 'Israelense', en: 'Israeli', es: 'Israelí', ru: 'Израильтянин', ar: 'إسرائيلي', aliases: ['israelita'] },
  { countryPt: 'Itália', pt: 'Italiano', en: 'Italian', es: 'Italiano', ru: 'Итальянец', ar: 'إيطالي', aliases: ['italiana', 'italy', 'italia', 'итальянка'] },
  { countryPt: 'Jamaica', pt: 'Jamaicano', en: 'Jamaican', es: 'Jamaicano', ru: 'Ямаец', ar: 'جامايكي', aliases: ['jamaicana'] },
  { countryPt: 'Japão', pt: 'Japonês', en: 'Japanese', es: 'Japonés', ru: 'Японец', ar: 'ياباني', aliases: ['japonesa', 'japan', 'японка'] },
  { countryPt: 'Jordânia', pt: 'Jordaniano', en: 'Jordanian', es: 'Jordano', ru: 'Иорданец', ar: 'أردني', aliases: ['jordaniana', 'jordan', 'jordana'] },
  { countryPt: 'Kiribati', pt: 'Quiribatiano', en: 'I-Kiribati', es: 'Kiribatiano', ru: 'Кирибатиец', ar: 'كيريباتي', aliases: ['quiribatiana'] },
  { countryPt: 'Kuwait', pt: 'Kuwaitiano', en: 'Kuwaiti', es: 'Kuwaití', ru: 'Кувейтец', ar: 'كويتي', aliases: ['kuwaitiana'] },
  { countryPt: 'Laos', pt: 'Laosiano', en: 'Laotian', es: 'Laosiano', ru: 'Лаосец', ar: 'لاوسي', aliases: ['laosiana'] },
  { countryPt: 'Lesoto', pt: 'Basoto', en: 'Mosotho', es: 'Lesotense', ru: 'Лесотец', ar: 'ليسوثي', aliases: ['lesotho', 'lesotiano'] },
  { countryPt: 'Letônia', pt: 'Letão', en: 'Latvian', es: 'Letón', ru: 'Латыш', ar: 'لاتفي', aliases: ['leta', 'letã', 'latvia', 'letona'] },
  { countryPt: 'Líbano', pt: 'Libanês', en: 'Lebanese', es: 'Libanés', ru: 'Ливанец', ar: 'لبناني', aliases: ['libanesa', 'lebanon', 'libano'] },
  { countryPt: 'Libéria', pt: 'Liberiano', en: 'Liberian', es: 'Liberiano', ru: 'Либериец', ar: 'ليبيري', aliases: ['liberiana', 'liberia'] },
  { countryPt: 'Líbia', pt: 'Líbio', en: 'Libyan', es: 'Libio', ru: 'Ливиец', ar: 'ليبي', aliases: ['libia', 'líbia', 'libya'] },
  { countryPt: 'Liechtenstein', pt: 'Liechtensteiniano', en: 'Liechtensteiner', es: 'Liechtensteiniano', ru: 'Лихтенштейнец', ar: 'ليختنشتايني', aliases: ['liechtensteinense'] },
  { countryPt: 'Lituânia', pt: 'Lituano', en: 'Lithuanian', es: 'Lituano', ru: 'Литовец', ar: 'ليتواني', aliases: ['lituana', 'lithuania'] },
  { countryPt: 'Luxemburgo', pt: 'Luxemburguês', en: 'Luxembourger', es: 'Luxemburgués', ru: 'Люксембуржец', ar: 'لوكسمبورغي', aliases: ['luxemburguesa', 'luxembourg'] },
  { countryPt: 'Macedônia do Norte', pt: 'Macedônio', en: 'Macedonian', es: 'Macedonio', ru: 'Македонец', ar: 'مقدوني', aliases: ['macedonia', 'macedônia', 'north macedonia'] },
  { countryPt: 'Madagascar', pt: 'Malgaxe', en: 'Malagasy', es: 'Malgache', ru: 'Малагасиец', ar: 'مدغشقري', aliases: ['madagascarense'] },
  { countryPt: 'Malásia', pt: 'Malaio', en: 'Malaysian', es: 'Malasio', ru: 'Малазиец', ar: 'ماليزي', aliases: ['malaia', 'malaysia', 'malasia'] },
  { countryPt: 'Malawi', pt: 'Malauiano', en: 'Malawian', es: 'Malauí', ru: 'Малавиец', ar: 'ملاوي', aliases: ['malauiana', 'malawiano'] },
  { countryPt: 'Maldivas', pt: 'Maldivo', en: 'Maldivian', es: 'Maldivo', ru: 'Мальдивец', ar: 'مالديفي', aliases: ['maldiva', 'maldives'] },
  { countryPt: 'Mali', pt: 'Maliano', en: 'Malian', es: 'Maliense', ru: 'Малиец', ar: 'مالي', aliases: ['maliana', 'malines'] },
  { countryPt: 'Malta', pt: 'Maltês', en: 'Maltese', es: 'Maltés', ru: 'Мальтиец', ar: 'مالطي', aliases: ['maltesa'] },
  { countryPt: 'Marrocos', pt: 'Marroquino', en: 'Moroccan', es: 'Marroquí', ru: 'Марокканец', ar: ' مغربي', aliases: ['marroquina', 'morocco'] },
  { countryPt: 'Ilhas Marshall', pt: 'Marshallino', en: 'Marshallese', es: 'Marshalés', ru: 'Маршаллец', ar: 'مارشالي', aliases: ['marshall islands', 'marshall, ilhas'] },
  { countryPt: 'Maurício', pt: 'Mauriciano', en: 'Mauritian', es: 'Mauriciano', ru: 'Маврикиец', ar: 'موريشيوسي', aliases: ['mauriciana', 'mauritius'] },
  { countryPt: 'Mauritânia', pt: 'Mauritano', en: 'Mauritanian', es: 'Mauritano', ru: 'Мавританец', ar: 'موريتاني', aliases: ['mauritana', 'mauritania'] },
  { countryPt: 'México', pt: 'Mexicano', en: 'Mexican', es: 'Mexicano', ru: 'Мексиканец', ar: 'مكسيكي', aliases: ['mexicana', 'mexico'] },
  { countryPt: 'Mianmar (Birmânia)', pt: 'Birmanês', en: 'Burmese', es: 'Birmano', ru: 'Бирманец', ar: 'ميانماري', aliases: ['birmanesa', 'myanmar', 'burma', 'mianmar'] },
  { countryPt: 'Micronésia', pt: 'Micronésio', en: 'Micronesian', es: 'Micronesio', ru: 'Микронезиец', ar: 'ميكرونيزي', aliases: ['micronesia'] },
  { countryPt: 'Moçambique', pt: 'Moçambicano', en: 'Mozambican', es: 'Mozambiqueño', ru: 'Мозамбикец', ar: 'موزمبيقي', aliases: ['mocambicana', 'moçambicana', 'mozambique'] },
  { countryPt: 'Moldávia', pt: 'Moldavo', en: 'Moldovan', es: 'Moldavo', ru: 'Молдаванин', ar: 'مولدوفي', aliases: ['moldava', 'moldova'] },
  { countryPt: 'Mônaco', pt: 'Monegasco', en: 'Monegasque', es: 'Monegasco', ru: 'Монегаск', ar: 'موناكي', aliases: ['monegasca', 'monaco'] },
  { countryPt: 'Mongólia', pt: 'Mongol', en: 'Mongolian', es: 'Mongol', ru: 'Монгол', ar: 'منغولي', aliases: ['mongolia'] },
  { countryPt: 'Montenegro', pt: 'Montenegrino', en: 'Montenegrin', es: 'Montenegrino', ru: 'Черногорец', ar: 'مونتينيغري', aliases: ['montenegrina'] },
  { countryPt: 'Namíbia', pt: 'Namibiano', en: 'Namibian', es: 'Namibio', ru: 'Намибиец', ar: 'ناميبي', aliases: ['namibiana', 'namibia'] },
  { countryPt: 'Nauru', pt: 'Nauruano', en: 'Nauruan', es: 'Nauruano', ru: 'Науруанец', ar: 'ناوروي', aliases: ['nauruana'] },
  { countryPt: 'Nepal', pt: 'Nepalês', en: 'Nepalese', es: 'Nepalí', ru: 'Непалец', ar: 'نيبالي', aliases: ['nepalesa', 'nepali'] },
  { countryPt: 'Nicarágua', pt: 'Nicaraguense', en: 'Nicaraguan', es: 'Nicaragüense', ru: 'Никарагуанец', ar: 'نيكاراغوي', aliases: ['nicaragua'] },
  { countryPt: 'Níger', pt: 'Nigerino', en: 'Nigerien', es: 'Nigerino', ru: 'Нигерец', ar: 'نيجري', aliases: ['nigerina', 'niger'] },
  { countryPt: 'Nigéria', pt: 'Nigeriano', en: 'Nigerian', es: 'Nigeriano', ru: 'Нигериец', ar: 'نيجيري', aliases: ['nigeriana', 'nigeria'] },
  { countryPt: 'Noruega', pt: 'Norueguês', en: 'Norwegian', es: 'Noruego', ru: 'Норвежец', ar: 'نرويجي', aliases: ['norueguesa', 'norway', 'noruega'] },
  { countryPt: 'Nova Zelândia', pt: 'Neozelandês', en: 'New Zealander', es: 'Neozelandés', ru: 'Новозеландец', ar: 'نيوزيلندي', aliases: ['neozelandesa', 'new zealand', 'kiwi'] },
  { countryPt: 'Omã', pt: 'Omanense', en: 'Omani', es: 'Omaní', ru: 'Оманец', ar: 'عماني', aliases: ['oman', 'omani'] },
  { countryPt: 'Países Baixos (Holanda)', pt: 'Holandês', en: 'Dutch', es: 'Neerlandés', ru: 'Нидерландец', ar: 'هولندي', aliases: ['holandesa', 'neerlandes', 'neerlandesa', 'netherlands', 'holland', 'paises baixos'] },
  { countryPt: 'Palau', pt: 'Palauano', en: 'Palauan', es: 'Palauano', ru: 'Палауанец', ar: 'بالاو', aliases: ['palauana'] },
  { countryPt: 'Panamá', pt: 'Panamenho', en: 'Panamanian', es: 'Panameño', ru: 'Панамец', ar: 'بنمي', aliases: ['panamenha', 'panama', 'panamena'] },
  { countryPt: 'Papua Nova Guiné', pt: 'Papuásio', en: 'Papua New Guinean', es: 'Papú', ru: 'Папуас', ar: 'بابوا غينيا الجديدة', aliases: ['papua new guinea', 'papua'] },
  { countryPt: 'Paquistão', pt: 'Paquistanês', en: 'Pakistani', es: 'Paquistaní', ru: 'Пакистанец', ar: 'باكستاني', aliases: ['paquistanesa', 'pakistan'] },
  { countryPt: 'Paraguai', pt: 'Paraguaio', en: 'Paraguayan', es: 'Paraguayo', ru: 'Парагваец', ar: 'باراغواياني', aliases: ['paraguaia', 'paraguay'] },
  { countryPt: 'Peru', pt: 'Peruano', en: 'Peruvian', es: 'Peruano', ru: 'Перуанец', ar: 'بيروفي', aliases: ['peruana'] },
  { countryPt: 'Polônia', pt: 'Polonês', en: 'Polish', es: 'Polaco', ru: 'Поляк', ar: 'بولندي', aliases: ['polonesa', 'polaca', 'polaco', 'poland', 'polonia'] },
  { countryPt: 'Portugal', pt: 'Português', en: 'Portuguese', es: 'Portugués', ru: 'Португалец', ar: 'برتغالي', aliases: ['portuguesa', 'португалка'] },
  { countryPt: 'Quênia', pt: 'Queniano', en: 'Kenyan', es: 'Keniano', ru: 'Кениец', ar: 'كيني', aliases: ['queniana', 'kenya', 'keniana'] },
  { countryPt: 'Quirguistão', pt: 'Quirguiz', en: 'Kyrgyzstani', es: 'Kirguís', ru: 'Киргиз', ar: 'قيرغيزي', aliases: ['kyrgyzstan', 'kyrgyz'] },
  { countryPt: 'Reino Unido', pt: 'Britânico', en: 'British', es: 'Británico', ru: 'Британец', ar: 'بريطاني', aliases: ['britanica', 'britânica', 'ingles', 'inglês', 'inglesa', 'english', 'uk', 'united kingdom', 'inglaterra', 'england', 'escoces', 'escocês', 'scottish', 'gales', 'galês', 'welsh', 'британка', 'англичанин', 'англичанка'] },
  { countryPt: 'República Centro-Africana', pt: 'Centro-africano', en: 'Central African', es: 'Centroafricano', ru: 'Центральноафриканец', ar: 'أفريقيا الوسطى', aliases: ['centro-africana', 'central african republic'] },
  { countryPt: 'República Tcheca', pt: 'Tcheco', en: 'Czech', es: 'Checo', ru: 'Чех', ar: 'تشيكي', aliases: ['tcheca', 'checo', 'checa', 'czechia', 'czech republic'] },
  { countryPt: 'Romênia', pt: 'Romeno', en: 'Romanian', es: 'Rumano', ru: 'Румын', ar: 'روماني', aliases: ['romena', 'romania', 'rumana'] },
  { countryPt: 'Ruanda', pt: 'Ruandês', en: 'Rwandan', es: 'Ruandés', ru: 'Руандиец', ar: 'رواندي', aliases: ['ruandesa', 'rwanda'] },
  { countryPt: 'Rússia', pt: 'Russo', en: 'Russian', es: 'Ruso', ru: 'Россиянин', ar: 'روسي', aliases: ['russa', 'russia', 'rusa', 'русский', 'русская', 'россиянка'] },
  { countryPt: 'Ilhas Salomão', pt: 'Salomonense', en: 'Solomon Islander', es: 'Salomonense', ru: 'Соломонец', ar: 'جزر سليمان', aliases: ['solomon islands', 'salomão, ilhas'] },
  { countryPt: 'Samoa', pt: 'Samoano', en: 'Samoan', es: 'Samoano', ru: 'Самоанец', ar: 'ساموي', aliases: ['samoana'] },
  { countryPt: 'San Marino', pt: 'Samarinês', en: 'Sammarinese', es: 'Sanmarinense', ru: 'Санмаринец', ar: 'سان مارينو', aliases: ['samarinesa', 'sanmarinense'] },
  { countryPt: 'Santa Lúcia', pt: 'Santa-lucense', en: 'Saint Lucian', es: 'Santalucense', ru: 'Сентлюсиец', ar: 'سانت لوسيا', aliases: ['saint lucia'] },
  { countryPt: 'São Cristóvão e Névis', pt: 'São-cristovense', en: 'Kittitian', es: 'Sancristobaleño', ru: 'Сенткитсец', ar: 'سانت كيتس ونيفيس', aliases: ['saint kitts and nevis'] },
  { countryPt: 'São Tomé e Príncipe', pt: 'São-tomense', en: 'Sao Tomean', es: 'Santotomense', ru: 'Сантомеец', ar: 'ساو تومي', aliases: ['sao tome and principe'] },
  { countryPt: 'São Vicente e Granadinas', pt: 'São-vicentino', en: 'Vincentian', es: 'Sanvicentino', ru: 'Сентвинсентец', ar: 'سانت فنسنت', aliases: ['saint vincent and the grenadines'] },
  { countryPt: 'Seicheles', pt: 'Seichelense', en: 'Seychellois', es: 'Seychellense', ru: 'Сейшелец', ar: 'سيشلي', aliases: ['seychelles'] },
  { countryPt: 'Senegal', pt: 'Senegalês', en: 'Senegalese', es: 'Senegalés', ru: 'Сенегалец', ar: 'سنغالي', aliases: ['senegalesa'] },
  { countryPt: 'Serra Leoa', pt: 'Serra-leonês', en: 'Sierra Leonean', es: 'Sierraleonés', ru: 'Сьерралеонец', ar: 'سيراليوني', aliases: ['sierra leone', 'serra-leonesa'] },
  { countryPt: 'Sérvia', pt: 'Sérvio', en: 'Serbian', es: 'Serbio', ru: 'Серб', ar: 'صربي', aliases: ['servia', 'sérvia', 'serbia'] },
  { countryPt: 'Singapura', pt: 'Singapurense', en: 'Singaporean', es: 'Singapurense', ru: 'Сингапурец', ar: 'سنغافوري', aliases: ['singapore', 'cingapurense'] },
  { countryPt: 'Síria', pt: 'Sírio', en: 'Syrian', es: 'Sirio', ru: 'Сириец', ar: 'سوري', aliases: ['siria', 'síria', 'syria'] },
  { countryPt: 'Somália', pt: 'Somali', en: 'Somali', es: 'Somalí', ru: 'Сомалиец', ar: 'صومالي', aliases: ['somalia', 'somaliense'] },
  { countryPt: 'Sri Lanka', pt: 'Cingalês', en: 'Sri Lankan', es: 'Ceilanés', ru: 'Ланкиец', ar: 'سريلانكي', aliases: ['cingalesa', 'sri lankan', 'ceilanes'] },
  { countryPt: 'Sudão', pt: 'Sudanês', en: 'Sudanese', es: 'Sudanés', ru: 'Суданец', ar: 'سوداني', aliases: ['sudanesa', 'sudan'] },
  { countryPt: 'Sudão do Sul', pt: 'Sul-sudanês', en: 'South Sudanese', es: 'Sursudanés', ru: 'Южносуданец', ar: 'جنوب سوداني', aliases: ['sul-sudanesa', 'south sudan'] },
  { countryPt: 'Suécia', pt: 'Sueco', en: 'Swedish', es: 'Sueco', ru: 'Швед', ar: 'سويدي', aliases: ['sueca', 'sweden'] },
  { countryPt: 'Suíça', pt: 'Suíço', en: 'Swiss', es: 'Suizo', ru: 'Швейцарец', ar: 'سويسري', aliases: ['suica', 'suíça', 'switzerland', 'suiza'] },
  { countryPt: 'Suriname', pt: 'Surinamês', en: 'Surinamese', es: 'Surinamés', ru: 'Суринамец', ar: 'سورينامي', aliases: ['surinamesa'] },
  { countryPt: 'Tadjiquistão', pt: 'Tadjique', en: 'Tajikistani', es: 'Tayiko', ru: 'Таджик', ar: 'طاجيكي', aliases: ['tajikistan', 'tajik', 'tajique'] },
  { countryPt: 'Tailândia', pt: 'Tailandês', en: 'Thai', es: 'Tailandés', ru: 'Таец', ar: 'تايلاندي', aliases: ['tailandesa', 'thailand'] },
  { countryPt: 'Tanzânia', pt: 'Tanzaniano', en: 'Tanzanian', es: 'Tanzano', ru: 'Танзаниец', ar: 'تنزاني', aliases: ['tanzaniana', 'tanzania'] },
  { countryPt: 'Timor-Leste', pt: 'Timorense', en: 'Timorese', es: 'Timorense', ru: 'Тиморец', ar: 'تيموري', aliases: ['east timor', 'timor leste'] },
  { countryPt: 'Togo', pt: 'Togolês', en: 'Togolese', es: 'Togolés', ru: 'Тоголезец', ar: 'توغولي', aliases: ['togolesa'] },
  { countryPt: 'Tonga', pt: 'Tonganês', en: 'Tongan', es: 'Tongano', ru: 'Тонганец', ar: 'تونغي', aliases: ['tonganesa', 'tongana'] },
  { countryPt: 'Trinidad e Tobago', pt: 'Trinitário', en: 'Trinidadian', es: 'Trinitense', ru: 'Тринидадец', ar: 'ترينيدادي', aliases: ['trinitaria', 'trinidad and tobago'] },
  { countryPt: 'Tunísia', pt: 'Tunisiano', en: 'Tunisian', es: 'Tunecino', ru: 'Тунисец', ar: 'تونسي', aliases: ['tunisiana', 'tunisia', 'tunecina'] },
  { countryPt: 'Turcomenistão', pt: 'Turcomeno', en: 'Turkmen', es: 'Turcomano', ru: 'Туркмен', ar: 'تركمانستاني', aliases: ['turkmenistan', 'turcomena'] },
  { countryPt: 'Turquia', pt: 'Turco', en: 'Turkish', es: 'Turco', ru: 'Турок', ar: 'تركي', aliases: ['turca', 'turkey'] },
  { countryPt: 'Tuvalu', pt: 'Tuvaluano', en: 'Tuvaluan', es: 'Tuvaluano', ru: 'Тувалуанец', ar: 'توفالوي', aliases: ['tuvaluana'] },
  { countryPt: 'Ucrânia', pt: 'Ucraniano', en: 'Ukrainian', es: 'Ucraniano', ru: 'Украинец', ar: 'أوكراني', aliases: ['ucraniana', 'ukraine', 'украинка'] },
  { countryPt: 'Uganda', pt: 'Ugandense', en: 'Ugandan', es: 'Ugandés', ru: 'Угандиец', ar: 'أوغندي', aliases: ['ugandesa'] },
  { countryPt: 'Uruguai', pt: 'Uruguaio', en: 'Uruguayan', es: 'Uruguayo', ru: 'Уругваец', ar: 'أوروغواياني', aliases: ['uruguaia', 'uruguay'] },
  { countryPt: 'Uzbequistão', pt: 'Uzbeque', en: 'Uzbekistani', es: 'Uzbeko', ru: 'Узбек', ar: 'أوزبكي', aliases: ['uzbekistan', 'uzbek'] },
  { countryPt: 'Vanuatu', pt: 'Vanuatuense', en: 'Ni-Vanuatu', es: 'Vanuatuense', ru: 'Вануатуец', ar: 'فانواتي', aliases: ['ni-vanuatu'] },
  { countryPt: 'Vaticano', pt: 'Vaticano', en: 'Vatican', es: 'Vaticano', ru: 'Ватиканец', ar: 'فاتيكاني', aliases: ['vatican city'] },
  { countryPt: 'Venezuela', pt: 'Venezuelano', en: 'Venezuelan', es: 'Venezolano', ru: 'Венесуэлец', ar: 'فنزويلي', aliases: ['venezuelana', 'venezolana'] },
  { countryPt: 'Vietnã', pt: 'Vietnamita', en: 'Vietnamese', es: 'Vietnamita', ru: 'Вьетнамец', ar: 'فيتنامي', aliases: ['vietnam', 'vietna'] },
  { countryPt: 'Zâmbia', pt: 'Zambiano', en: 'Zambian', es: 'Zambiano', ru: 'Замбиец', ar: 'زامبي', aliases: ['zambiana', 'zambia'] },
  { countryPt: 'Zimbábue', pt: 'Zimbabuano', en: 'Zimbabwean', es: 'Zimbabuense', ru: 'Зимбабвиец', ar: 'زيمبابوي', aliases: ['zimbabuana', 'zimbabwe'] },

  // Gentílicos históricos / literários adicionais presentes na biblioteca
  { countryPt: 'Roma Antiga', pt: 'Romano', en: 'Roman', es: 'Romano', ru: 'Римлянин', ar: 'روماني قديم', aliases: ['romana', 'roma'] },
  { countryPt: 'Mundo Árabe', pt: 'Árabe', en: 'Arab', es: 'Árabe', ru: 'Араб', ar: 'عربي', aliases: ['arabe', 'arabian', 'arabic'] },
  { countryPt: 'Desconhecido', pt: 'Desconhecido', en: 'Unknown', es: 'Desconocido', ru: 'Неизвестно', ar: 'غير معروف', aliases: ['desconhecida', 'unknown', 'desconocida', 'literatura geral', 'general literature'] },
];

function formatDualGenderPt(word: string): string {
  const w = (word || '').trim();
  if (!w || w.includes('(')) return w;
  if (w.endsWith('o')) return `${w}(a)`;
  if (w.endsWith('ês')) return `${w}(a)`;
  if (w.endsWith('ão')) return `${w}(ã)`;
  if (w === 'Espanhol') return 'Espanhol(a)';
  if (w === 'Eritreu') return 'Eritreu(eia)';
  return w;
}

function getFemininePt(word: string): string | null {
  const w = (word || '').trim();
  if (!w || w.includes('(')) return null;
  if (w.endsWith('o')) return `${w.slice(0, -1)}a`;
  if (w.endsWith('ês')) return `${w.slice(0, -2)}esa`;
  if (w.endsWith('ão')) return `${w.slice(0, -2)}ã`;
  if (w === 'Espanhol') return 'Espanhola';
  if (w === 'Eritreu') return 'Eritreia';
  return null;
}

function formatDualGenderEs(word: string): string {
  const w = (word || '').trim();
  if (!w || w.includes('(')) return w;
  if (w.endsWith('o')) return `${w}(a)`;
  if (w.endsWith('és') || w.endsWith('án') || w.endsWith('ón') || w.endsWith('ol')) {
    return `${w}(a)`;
  }
  return w;
}

function getFeminineEs(word: string): string | null {
  const w = (word || '').trim();
  if (!w || w.includes('(')) return null;
  if (w.endsWith('o')) return `${w.slice(0, -1)}a`;
  if (w.endsWith('és')) return `${w.slice(0, -2)}esa`;
  if (w.endsWith('án')) return `${w.slice(0, -2)}ana`;
  if (w.endsWith('ón')) return `${w.slice(0, -2)}ona`;
  if (w.endsWith('ol')) return `${w}a`;
  return null;
}

function formatDualGenderRu(word: string): string {
  const w = (word || '').trim();
  if (!w || w.includes('(')) return w;
  if (w.startsWith('Житель ')) return w.replace(/^Житель /, 'Житель(ница) ');
  const specialRu: Record<string, string> = {
    'Неизвестно': 'Неизвестный(ая)',
    'Француз': 'Француз(женка)',
    'Грек': 'Грек(чанка)',
    'Турок': 'Турок(чанка)',
    'Китаец': 'Китаец(янка)',
    'Кореец': 'Кореец(янка)',
    'Северокореец': 'Северокореец(янка)',
    'Южнокореец': 'Южнокореец(янка)',
    'Индиец': 'Индиец(ианка)',
    'Поляк': 'Поляк(чка)',
    'Таджик': 'Таджик(чка)',
    'Узбек': 'Узбек(чка)',
    'Словак': 'Словак(чка)',
    'Чех': 'Чех(шка)',
    'Казах': 'Казах(шка)',
    'Латыш': 'Латыш(ка)',
    'Финн': 'Финн(ка)',
  };
  if (specialRu[w]) return specialRu[w];
  if (w.endsWith('ий')) return `${w}(ая)`;
  if (w.endsWith('анин') || w.endsWith('янин') || w.endsWith('ин') || w.endsWith('ец')) {
    return `${w}(ка)`;
  }
  return `${w}(ка)`;
}

function formatDualGenderAr(word: string): string {
  const w = (word || '').trim();
  if (!w || w.includes('(')) return w;
  if (w === 'غير معروف') return 'غير معروف(ة)';
  if (w === 'روماني قديم') return 'روماني(ة) قديم(ة)';
  if (w.endsWith('ي')) return `${w}(ة)`;
  return w;
}

for (const entry of NATIONALITIES_LIST) {
  const baseAliases = new Set<string>(entry.aliases || []);
  baseAliases.add(entry.pt);
  baseAliases.add(entry.es);
  baseAliases.add(entry.ru);
  baseAliases.add(entry.ar);

  const femPt = getFemininePt(entry.pt);
  if (femPt) baseAliases.add(femPt);
  const femEs = getFeminineEs(entry.es);
  if (femEs) baseAliases.add(femEs);
  if (entry.ar && entry.ar.endsWith('ي')) {
    baseAliases.add(`${entry.ar}ة`);
  }

  entry.pt = formatDualGenderPt(entry.pt);
  entry.es = formatDualGenderEs(entry.es);
  entry.ru = formatDualGenderRu(entry.ru);
  entry.ar = formatDualGenderAr(entry.ar);
  entry.aliases = Array.from(baseAliases);
}

function normalizeKey(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const LOOKUP_MAP: Map<string, NationalityEntry> = new Map();

for (const entry of NATIONALITIES_LIST) {
  const keys = [
    entry.countryPt,
    entry.pt,
    entry.en,
    entry.es,
    entry.ru,
    entry.ar,
    ...(entry.aliases || []),
  ];
  for (const k of keys) {
    const norm = normalizeKey(k);
    if (norm && !LOOKUP_MAP.has(norm)) {
      LOOKUP_MAP.set(norm, entry);
    }
    const rawLower = (k || '').toLowerCase().trim();
    if (rawLower && !LOOKUP_MAP.has(rawLower)) {
      LOOKUP_MAP.set(rawLower, entry);
    }
  }
}

export function findNationalityEntry(raw: string): NationalityEntry | undefined {
  if (!raw || !raw.trim()) return undefined;
  const trimmed = raw.trim();
  const rawLower = trimmed.toLowerCase();
  if (LOOKUP_MAP.has(rawLower)) return LOOKUP_MAP.get(rawLower);

  const norm = normalizeKey(trimmed);
  if (LOOKUP_MAP.has(norm)) return LOOKUP_MAP.get(norm);

  // Tenta removendo sufixos entre parênteses como "(a)", "(ã)", "(ка)", "(ة)"
  const stripped = trimmed.replace(/\([^)]*\)/g, '').trim();
  if (stripped && stripped !== trimmed) {
    const strippedLower = stripped.toLowerCase();
    if (LOOKUP_MAP.has(strippedLower)) return LOOKUP_MAP.get(strippedLower);
    const strippedNorm = normalizeKey(stripped);
    if (LOOKUP_MAP.has(strippedNorm)) return LOOKUP_MAP.get(strippedNorm);
  }

  // Tenta sem sufixos de gênero/plural comuns (ex: brasileira -> brasileiro)
  const baseNorm = stripped ? normalizeKey(stripped) : norm;
  if (baseNorm.endsWith('a')) {
    const masc = baseNorm.slice(0, -1) + 'o';
    if (LOOKUP_MAP.has(masc)) return LOOKUP_MAP.get(masc);
    const noA = baseNorm.slice(0, -1);
    if (LOOKUP_MAP.has(noA)) return LOOKUP_MAP.get(noA);
  }

  return undefined;
}

export function getNationalityDisplayName(
  rawNationality: string | undefined,
  lang: SupportedLanguage
): string {
  if (!rawNationality || !rawNationality.trim()) return '';

  // Suporta múltiplas nacionalidades separadas por "/", "," ou "•"
  if (/[/,]/.test(rawNationality)) {
    const sep = rawNationality.includes('/') ? ' / ' : ', ';
    const parts = rawNationality.split(/[/,]/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      return parts.map(p => getNationalityDisplayName(p, lang)).join(sep);
    }
  }

  const entry = findNationalityEntry(rawNationality);
  if (entry) {
    const translated = entry[lang] || entry.pt;
    return translated.trim();
  }

  return rawNationality.trim();
}

export function matchesNationalityMultiLang(natStr: string, queryStr: string): boolean {
  const n = normalizeKey(natStr);
  const qn = normalizeKey(queryStr);
  if (!n || !qn) return false;
  if (n === qn || n.includes(qn) || qn.includes(n)) return true;

  const entry = findNationalityEntry(natStr);
  if (entry) {
    const allForms = [
      entry.countryPt,
      entry.pt,
      entry.en,
      entry.es,
      entry.ru,
      entry.ar,
      ...(entry.aliases || []),
    ];
    for (const form of allForms) {
      const fNorm = normalizeKey(form);
      const fRaw = (form || '').toLowerCase().trim();
      const qRaw = (queryStr || '').toLowerCase().trim();
      if (
        (fNorm && (fNorm === qn || fNorm.startsWith(qn) || qn.startsWith(fNorm) || fNorm.includes(qn))) ||
        (fRaw && qRaw && (fRaw === qRaw || fRaw.startsWith(qRaw) || fRaw.includes(qRaw)))
      ) {
        return true;
      }
    }
  }

  return false;
}

