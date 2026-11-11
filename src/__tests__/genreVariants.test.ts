import { describe, it, expect } from 'vitest';
import { resolveGenreAndSubgenre } from '../data/genreData';

describe('gêneros em outros idiomas', () => {
  it('reconhece poesia e os subgêneros de poesia', () => {
    expect(resolveGenreAndSubgenre('Literature', 'Contemporary Poetry')).toEqual({ category: 'Literatura', subgenre: 'Poesia contemporânea' });
    expect(resolveGenreAndSubgenre('', 'American Poetry')).toEqual({ category: 'Literatura', subgenre: 'Poesia' });
    expect(resolveGenreAndSubgenre('Poesía', '')).toEqual({ category: 'Literatura', subgenre: 'Poesia' });
    expect(resolveGenreAndSubgenre('', 'Современная поэзия')).toEqual({ category: 'Literatura', subgenre: 'Poesia contemporânea' });
  });
  it('agrupa as traduções no gênero do app', () => {
    expect(resolveGenreAndSubgenre('Horror', '').category).toBe('Terror');
    expect(resolveGenreAndSubgenre('Ficción', '').category).toBe(resolveGenreAndSubgenre('Ficção', '').category);
    expect(resolveGenreAndSubgenre('Short Stories', '')).toEqual(resolveGenreAndSubgenre('Contos', ''));
  });
});
