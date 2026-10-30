import { describe, it, expect } from 'vitest';
import { GENRE_HIERARCHY, isBookInGenre, isBookInSubgenre, resolveGenreList, splitGenreValues } from '../data';
import { getGenreName, getSubgenreName } from '../genreTranslations';

const G = (key: string) => GENRE_HIERARCHY[key];

describe('vários gêneros e subgêneros no mesmo audiobook', () => {
  it('separa por vírgula', () => {
    expect(splitGenreValues('Ficção, Literatura;Ficção')).toEqual(['Ficção', 'Literatura']);
  });

  it('o audiobook aparece em cada gênero e subgênero', () => {
    const book = { category: 'Ficção, LGBTQ+', subgenre: 'Fantasia, Romance LGBTQ+' };
    expect(isBookInGenre(book, G('ficção'))).toBe(true);
    expect(isBookInGenre(book, G('lgbtq+'))).toBe(true);
    expect(isBookInGenre(book, G('literatura'))).toBe(false);
    expect(isBookInSubgenre(book, G('ficção'), 'Fantasia')).toBe(true);
    expect(isBookInSubgenre(book, G('lgbtq+'), 'Romance LGBTQ+')).toBe(true);
    expect(isBookInSubgenre(book, G('ficção'), 'Terror')).toBe(false);
    // não cai em "Outros" de um gênero em que já tem subgênero específico
    expect(isBookInSubgenre(book, G('ficção'), 'Outros')).toBe(false);
  });

  it('um valor só continua funcionando como antes', () => {
    const book = { category: 'Ficção', subgenre: 'Terror' };
    expect(isBookInGenre(book, G('ficção'))).toBe(true);
    expect(isBookInSubgenre(book, G('ficção'), 'Terror')).toBe(true);
    expect(isBookInSubgenre(book, G('ficção'), 'Outros')).toBe(false);
  });

  it('importação resolve cada valor', () => {
    const r = resolveGenreList('', 'queer, Sci-Fi');
    expect(r.category.split(', ').sort()).toEqual(['Ficção', 'LGBTQ+'].sort());
    expect(r.subgenre).toContain('Ficção científica');
  });

  it('nomes traduzidos para cada valor', () => {
    expect(getGenreName('Ficção, LGBTQ+', 'en')).toBe('Fiction, LGBTQ+');
    expect(getSubgenreName('Romantasia, Gótico', 'en')).toBe('Romantasy, Gothic');
  });
});
