import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Conditional "See all" and section header action buttons', () => {
  const appFile = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf-8');

  it('verifies that in-progress section only displays see_all button when sortedInProgress.length > 6', () => {
    expect(appFile).toContain('sortedInProgress.length > 6 ?');
    expect(appFile).toMatch(/sortedInProgress\.length > 6 \?\s*\{\s*buttonLabel:\s*t\('see_all'\)/);
  });

  it('verifies that recently-listened section only displays see_all button when recentlyListenedBooks.length > 6', () => {
    expect(appFile).toContain('recentlyListenedBooks.length > 6 ?');
    expect(appFile).toMatch(/recentlyListenedBooks\.length > 6 \?\s*\{\s*buttonLabel:\s*t\('see_all'\)/);
  });

  it('verifies that recently-added section only displays see_all button when recentlyAddedBooks.length > 6', () => {
    expect(appFile).toContain('recentlyAddedBooks.length > 6 ?');
    expect(appFile).toMatch(/recentlyAddedBooks\.length > 6 \?\s*\{\s*buttonLabel:\s*t\('see_all'\)/);
  });

  it('verifies that unstarted-favorites section only displays button when unstartedFavorites.length > 6', () => {
    expect(appFile).toContain('unstartedFavorites.length > 6 ?');
    expect(appFile).toMatch(/unstartedFavorites\.length > 6 \?\s*\{\s*buttonLabel:\s*t\('btn_view_favorites'\)/);
  });

  it('verifies that specific submenus in Home keep their dedicated navigation buttons regardless of count', () => {
    // top-genre: opens specific genre page
    expect(appFile).toContain("id: 'top-genre'");
    expect(appFile).toContain("buttonLabel: t('btn_go_to_genre')");

    // listened-author-more: opens specific author page
    expect(appFile).toContain("id: 'listened-author-more'");
    expect(appFile).toContain("buttonLabel: t('btn_go_to_author')");

    // other-languages: opens languages page
    expect(appFile).toContain("id: 'other-languages'");
    expect(appFile).toContain("buttonLabel: t('btn_view_languages')");
  });

  it('verifies that Library sections only show "see_all" when items exceed 6', () => {
    // Favorite audiobooks in Library
    expect(appFile).toMatch(/favoriteBookIds\.includes\(b\.id\)\)\.length > 6\s*&&/);

    // Favorite authors in Library
    expect(appFile).toMatch(/favoriteAuthorIds\.includes\(a\.id\)\)\.length > 6\s*&&/);

    // Genres in Library (4 retangulares por linha)
    expect(appFile).toMatch(/sortedGenres\.length > 4\s*&&/);

    // Authors in Library
    expect(appFile).toMatch(/sortedAuthors\.length > 6\s*&&/);

    // Collections in Library (4 retangulares por linha)
    expect(appFile).toMatch(/collections\.length > 4\s*&&/);

    // All audiobooks in Library
    expect(appFile).toMatch(/filteredBooks\.length > 6\s*&&/);
  });

  it('simulates Home and Library section button visibility rule correctly', () => {
    const shouldShowSectionButton = (params: {
      isSpecificSubmenu: boolean;
      itemsCount: number;
    }) => {
      if (params.isSpecificSubmenu) return true;
      return params.itemsCount > 6;
    };

    // Lists with <= 6 items do NOT show button
    expect(shouldShowSectionButton({ isSpecificSubmenu: false, itemsCount: 1 })).toBe(false);
    expect(shouldShowSectionButton({ isSpecificSubmenu: false, itemsCount: 3 })).toBe(false);
    expect(shouldShowSectionButton({ isSpecificSubmenu: false, itemsCount: 6 })).toBe(false);

    // Lists with > 6 items show button
    expect(shouldShowSectionButton({ isSpecificSubmenu: false, itemsCount: 7 })).toBe(true);
    expect(shouldShowSectionButton({ isSpecificSubmenu: false, itemsCount: 20 })).toBe(true);

    // Specific submenus (author detail, languages, specific genre) always show button
    expect(shouldShowSectionButton({ isSpecificSubmenu: true, itemsCount: 1 })).toBe(true);
    expect(shouldShowSectionButton({ isSpecificSubmenu: true, itemsCount: 0 })).toBe(true);
    expect(shouldShowSectionButton({ isSpecificSubmenu: true, itemsCount: 6 })).toBe(true);
    expect(shouldShowSectionButton({ isSpecificSubmenu: true, itemsCount: 12 })).toBe(true);
  });
});

