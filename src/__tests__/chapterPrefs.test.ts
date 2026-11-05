import { describe, it, expect } from 'vitest';
import { isExtraChapter, visibleChapters } from '../chapterPrefs';

describe('capítulos extras', () => {
  it('reconhece introdução, agradecimentos e afins', () => {
    ['Introdução', 'Agradecimentos', '1 - Prefácio', 'Nota do autor', 'Sobre o autor', 'Acknowledgments', 'Créditos'].forEach(t => expect(isExtraChapter(t)).toBe(true));
  });
  it('não confunde capítulos da história', () => {
    ['Capítulo 1', 'Prólogo', 'Epílogo', 'A introdução do vilão', 'Notas de um crime'].forEach(t => expect(isExtraChapter(t)).toBe(false));
  });
  it('oculta só com a opção desligada e nunca deixa o livro sem capítulos', () => {
    const chapters = [{ title: 'Introdução' }, { title: 'Capítulo 1' }];
    expect(visibleChapters(chapters, true)).toHaveLength(2);
    expect(visibleChapters(chapters, false)).toEqual([{ title: 'Capítulo 1' }]);
    expect(visibleChapters([{ title: 'Introdução' }], false)).toHaveLength(1);
  });
});
