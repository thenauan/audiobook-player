import { describe, it, expect } from 'vitest';
import { GENRE_HIERARCHY, isBookInGenre, isBookInSubgenre, registerDiscoveredGenres, resolveGenreAndSubgenre, resolveGenreList, splitGenreValues } from '../data';
import { getGenreName, getSubgenreName } from '../genreTranslations';

const G = (key: string) => GENRE_HIERARCHY[key];

describe('vários gêneros e subgêneros no mesmo audiobook', () => {
  it('separa por vírgula', () => {
    expect(splitGenreValues('Ficção, Literatura;Ficção')).toEqual(['Ficção', 'Literatura']);
  });

  it('o audiobook aparece em cada gênero e subgênero', () => {
    const book = { category: 'Ficção, LGBTQ+', subgenre: 'Fantasia, Romance LGBTQ+' };
    const fantasy = G('fantasia e ficção científica');
    expect(isBookInGenre(book, fantasy)).toBe(true);
    expect(isBookInGenre(book, G('lgbtq+'))).toBe(true);
    expect(isBookInGenre(book, G('literatura'))).toBe(false);
    expect(isBookInSubgenre(book, fantasy, 'Fantasia')).toBe(true);
    expect(isBookInSubgenre(book, G('lgbtq+'), 'Romance LGBTQ+')).toBe(true);
    expect(isBookInSubgenre(book, fantasy, 'Distopia')).toBe(false);
    // não cai em "Outros" de um gênero em que já tem subgênero específico
    expect(isBookInSubgenre(book, fantasy, 'Outros')).toBe(false);
  });

  it('a classificação vem da lista do app, não do campo do arquivo', () => {
    const book = { category: 'Ficção', subgenre: 'Sobrenatural' };
    expect(isBookInGenre(book, G('terror'))).toBe(true);
    expect(isBookInGenre(book, G('ficção'))).toBe(false);
    expect(isBookInSubgenre(book, G('terror'), 'Sobrenatural')).toBe(true);
    expect(resolveGenreAndSubgenre('Thriller', '')).toEqual({ category: 'Suspense e Mistério', subgenre: 'Thriller' });
    expect(resolveGenreAndSubgenre('Audiobook', 'Biografia')).toEqual({ category: 'Biografia e Memórias', subgenre: 'Biografia' });
    expect(resolveGenreAndSubgenre('Ficção', 'Terror')).toEqual({ category: 'Terror', subgenre: 'Outros' });
  });

  it('o que a lista não tem vira gênero ou subgênero novo', () => {
    registerDiscoveredGenres([{ category: 'Gastronomia Molecular', subgenre: 'Cozinha Experimental' }, { category: 'Ficção', subgenre: 'Ficção Náutica' }]);
    const novo = Object.values(GENRE_HIERARCHY).find(g => g.name === 'Gastronomia Molecular')!;
    expect(novo.subgenres).toContain('Cozinha Experimental');
    expect(isBookInSubgenre({ category: 'Gastronomia Molecular', subgenre: 'Cozinha Experimental' }, novo, 'Cozinha Experimental')).toBe(true);
    expect(G('ficção').subgenres).toContain('Ficção Náutica');
    expect(G('ficção').subgenres[G('ficção').subgenres.length - 1]).toBe('Outros');
  });

  it('nomes de gênero e subgênero não têm separador de lista nem repetição', () => {
    const subs = Object.values(GENRE_HIERARCHY).flatMap(g => g.subgenres).filter(s => s !== 'Outros');
    expect(new Set(subs.map(s => s.toLowerCase())).size).toBe(subs.length);
    expect(Object.values(GENRE_HIERARCHY).every(g => !/[,;]/.test(g.name))).toBe(true);
  });

  it('importação resolve cada valor', () => {
    const r = resolveGenreList('', 'queer, Sci-Fi');
    expect(r.category.split(', ').sort()).toEqual(['Fantasia e Ficção científica', 'LGBTQ+'].sort());
    expect(r.subgenre).toContain('Ficção científica');
  });

  it('nomes traduzidos para cada valor', () => {
    expect(getGenreName('Ficção, LGBTQ+', 'en')).toBe('Fiction, LGBTQ+');
    expect(getSubgenreName('Romantasia, Gótico', 'en')).toBe('Romantasy, Gothic');
  });
});

describe('subgêneros LGBTQ+', () => {
  const lgbt = Object.values(GENRE_HIERARCHY).find(g => g.id === 'lgbtq')!;
  it('audiobook aparece só nos subgêneros que tem', () => {
    const book = { category: 'LGBTQ+', subgenre: 'Romance LGBTQ+' };
    expect(lgbt.subgenres.filter(s => isBookInSubgenre(book, lgbt, s))).toEqual(['Romance LGBTQ+']);
  });
  it('subgênero genérico "LGBTQ+" fica só no subgênero padrão, não em todos', () => {
    const book = { category: 'LGBTQ+', subgenre: 'LGBTQ+' };
    expect(lgbt.subgenres.filter(s => s !== 'Outros' && isBookInSubgenre(book, lgbt, s))).toEqual(['Ficção LGBTQ+']);
  });
});
