// Extraído do App.tsx (mesma ordem de antes: os efeitos rodam na mesma sequência)
import { useCallback, useEffect, useMemo } from 'react';
import { EMPTY_BOOK, getBookDurationInSeconds } from '../components/popups/Popovers';
import { bookHasAuthor, getBookAuthorNames, splitAuthorNames } from '../lib/authorUtils';
import { visibleChapters } from '../audio/chapterPrefs';
import { Audiobook, Author, Chapter, Collection, GENRE_HIERARCHY, isBookInGenre, isBookInSubgenre, resolveNarratorAndLanguage } from '../data/catalog';
import { getGenreName, getSubgenreName } from '../i18n/genreTranslations';
import { compareTitles } from '../lib/libraryText';
import { AuthorCard, BookCard } from '../components/library/LibraryCards';
import { getAuthorAvatar } from '../lib/coverArt';
import { findRecognizedLanguageEntry, getLanguageCardName, getLanguageDisplayName } from '../i18n/translations';
import { evaluateSearchTermMatch, matchesNationality, normalizeSearchStr, toPhoneticSearchStr } from '../lib/searchScoring';
import { BookmarksPanel } from '../components/BookmarksPanel';
import { FullscreenPlayerControls, MiniPlayerControls } from '../components/player/PlayerControls';
import { findNationalityEntry, getNationalityDisplayName } from '../i18n/nationalityTranslations';
import { AllBooksNavGroup, HomeSection, SearchItem } from '../App';
import type { ScreenState, SortOption, StatusFilter, UserListeningStats } from '../App';
import type { SupportedLanguage } from '../i18n/translations';

export function useLibraryViews({ activeAllBooksNavId, activeScreen, authors, books, closeAllPopups, collections, completedChapters, currentBook, favoriteAuthorIds, favoriteBookIds, favoriteChapters, handleAddToQueue, handleDeleteBook, handlePlayBookFromStart, handleSelectAuthor, handleSelectBookDetail, isBookCompleted, isBookStarted, isFullScreen, isManualScrollingRef, isMobile, isPlaying, isSelectionMode, lastPlayedBookId, mainScrollRef, navigateTo, recentlyAddedBooks, recentlyListenedBookIds, recentlyListenedBooks, resolvedLanguage, resumePlayback, searchQuery, selectedBooks, setActiveAllBooksNavId, setAuthors, setBooks, setCompletedChapters, setEditingBook, setSelectedBooks, setStartedChapters, setStatusFilter, showExtraChapters, showToast, sortBy, startedChapters, statusFilter, t, toggleFavoriteAuthor, toggleFavoriteBook, userListeningStats }: { activeAllBooksNavId: string; activeScreen: ScreenState; authors: Author[]; books: Audiobook[]; closeAllPopups: () => void; collections: Collection[]; completedChapters: string[]; currentBook: Audiobook; favoriteAuthorIds: string[]; favoriteBookIds: string[]; favoriteChapters: string[]; handleAddToQueue: (item: Audiobook, position: "next" | "last") => void; handleDeleteBook: (bookId: string) => void; handlePlayBookFromStart: (book: Audiobook, chapterIndex?: number) => void; handleSelectAuthor: (authorId?: string, authorName?: string) => void; handleSelectBookDetail: (book: Audiobook) => void; isBookCompleted: (book: Audiobook) => boolean; isBookStarted: (book: Audiobook) => boolean; isFullScreen: boolean; isManualScrollingRef: React.RefObject<boolean>; isMobile: boolean; isPlaying: boolean; isSelectionMode: boolean; lastPlayedBookId: string | null; mainScrollRef: React.RefObject<HTMLDivElement | null>; navigateTo: (screenId: string, data?: any) => void; recentlyAddedBooks: Audiobook[]; recentlyListenedBookIds: string[]; recentlyListenedBooks: Audiobook[]; resolvedLanguage: SupportedLanguage; resumePlayback: boolean; searchQuery: string; selectedBooks: string[]; setActiveAllBooksNavId: React.Dispatch<React.SetStateAction<string>>; setAuthors: React.Dispatch<React.SetStateAction<Author[]>>; setBooks: React.Dispatch<React.SetStateAction<Audiobook[]>>; setCompletedChapters: React.Dispatch<React.SetStateAction<string[]>>; setEditingBook: React.Dispatch<React.SetStateAction<Audiobook | null>>; setSelectedBooks: React.Dispatch<React.SetStateAction<string[]>>; setStartedChapters: React.Dispatch<React.SetStateAction<string[]>>; setStatusFilter: React.Dispatch<React.SetStateAction<StatusFilter>>; showExtraChapters: boolean; showToast: (message: string) => void; sortBy: SortOption; startedChapters: string[]; statusFilter: StatusFilter; t: (key: string, params?: Record<string, string | number>) => string; toggleFavoriteAuthor: (authorId: string) => void; toggleFavoriteBook: (bookId: string) => void; userListeningStats: UserListeningStats }) {
  const userListeningProfile = useMemo(() => {
    const engagedBooks = books.filter(b => 
      (userListeningStats.bookSeconds[b.id] || 0) >= 15 ||
      (userListeningStats.bookPlayCount[b.id] || 0) >= 1 ||
      isBookStarted(b) ||
      isBookCompleted(b) ||
      recentlyListenedBookIds.includes(b.id)
    );

    // 1. Duração média ponderada pelo tempo real de escuta
    let preferredDurationSeconds = 0;
    let totalDurationWeight = 0;

    engagedBooks.forEach(b => {
      const dur = getBookDurationInSeconds(b);
      if (dur <= 0) return;

      const listenedSec = userListeningStats.bookSeconds[b.id] || 0;
      const compBonus = isBookCompleted(b) ? dur : 0;
      const startedBonus = isBookStarted(b) ? dur * 0.3 : 0;
      const favBonus = favoriteBookIds.includes(b.id) ? dur * 0.5 : 0;

      const weight = Math.max(1, listenedSec + compBonus + startedBonus + favBonus);
      preferredDurationSeconds += dur * weight;
      totalDurationWeight += weight;
    });

    const avgPreferredDuration = totalDurationWeight > 0 
      ? Math.round(preferredDurationSeconds / totalDurationWeight) 
      : 0;

    let formattedDuration = '';
    if (avgPreferredDuration > 0) {
      const hours = Math.round(avgPreferredDuration / 3600);
      if (hours < 1) {
        formattedDuration = `~${Math.round(avgPreferredDuration / 60)} min`;
      } else {
        formattedDuration = `~${hours}h`;
      }
    }

    // 2. Ranking de gêneros por tempo real de escuta e engajamento
    const genreScores = new Map<string, number>();
    for (const [g, sec] of Object.entries(userListeningStats.genreSeconds)) {
      if (sec > 0) {
        genreScores.set(g, (genreScores.get(g) || 0) + sec);
      }
    }

    books.forEach(b => {
      const cat = (b.category || '').toLowerCase().trim();
      const subg = (b.subgenre || '').toLowerCase().trim();
      const isFav = favoriteBookIds.includes(b.id);
      const isComp = isBookCompleted(b);
      const isStart = isBookStarted(b);

      const bonus = (isComp ? 2400 : 0) + (isFav ? 1800 : 0) + (isStart ? 600 : 0);
      if (bonus > 0) {
        if (cat) genreScores.set(cat, (genreScores.get(cat) || 0) + bonus);
        if (subg && subg !== 'desconhecido') genreScores.set(subg, (genreScores.get(subg) || 0) + bonus * 0.7);
      }
    });

    const sortedGenres = Array.from(genreScores.entries())
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);

    // 3. Ranking de autores por tempo real de escuta e favoritos
    const authorScores = new Map<string, { authorId: string; name: string; score: number }>();

    authors.forEach(a => {
      const aName = a.name.toLowerCase().trim();
      let score = userListeningStats.authorSeconds[aName] || 0;
      if (favoriteAuthorIds.includes(a.id)) {
        score += 3600;
      }

      const aBooks = books.filter(b => bookHasAuthor(b, a));
      aBooks.forEach(b => {
        if (isBookCompleted(b)) score += 2400;
        if (favoriteBookIds.includes(b.id)) score += 1800;
        if (isBookStarted(b)) score += 600;
        score += (userListeningStats.bookSeconds[b.id] || 0);
      });

      if (score > 0) {
        authorScores.set(a.id, { authorId: a.id, name: a.name, score });
      }
    });

    const sortedAuthorsList = Array.from(authorScores.values())
      .sort((a, b) => b.score - a.score);

    return {
      hasListeningData: engagedBooks.length > 0 || userListeningStats.totalSeconds > 0,
      avgPreferredDuration,
      formattedDuration,
      topGenres: sortedGenres,
      topAuthors: sortedAuthorsList,
      totalSeconds: userListeningStats.totalSeconds
    };
  }, [
    books,
    authors,
    userListeningStats,
    favoriteBookIds,
    favoriteAuthorIds,
    startedChapters,
    completedChapters,
    recentlyListenedBookIds
  ]);

  // Controle de visibilidade inteligente do miniplayer:
  // - Se algo estiver tocando, sempre visível.
  // - Se em tela cheia, permanece visível.
  // - Se o usuário marcou em ajustes que não quer salvar de onde parou (resumePlayback === false), o miniplayer desaparece.
  // - Se nada nunca tiver sido reproduzido, ou o último livro tocado foi apagado, o miniplayer desaparece.
  const isPlayerVisible = useMemo(() => {
    // 1. Se algo está tocando no momento, o player SEMPRE deve aparecer
    if (isPlaying && currentBook?.id && currentBook.id !== EMPTY_BOOK.id) {
      return true;
    }

    // 2. Se a tela cheia do player estiver aberta pelo usuário, manter visível até minimizar
    if (isFullScreen && currentBook?.id && currentBook.id !== EMPTY_BOOK.id && books.some(b => b.id === currentBook.id)) {
      return true;
    }

    // 3. Se o usuário marcou em ajustes que NÃO quer salvar de onde parou (resumePlayback === false),
    // o miniplayer DEVE desaparecer da tela enquanto pausado/parado.
    if (!resumePlayback) {
      return false;
    }

    // 4. Se não há livro válido no player ou o livro é vazio
    if (!currentBook || !currentBook.id || currentBook.id === EMPTY_BOOK.id) {
      return false;
    }

    // 5. Se o livro não existe na biblioteca (por exemplo, foi apagado)
    const exists = books.some(b => b.id === currentBook.id);
    if (!exists) {
      return false;
    }

    // 6. Se nada nunca tiver sido reproduzido ou o último reproduzido foi apagado/diferente
    const wasEverPlayed = Boolean(
      lastPlayedBookId === currentBook.id ||
      recentlyListenedBookIds.includes(currentBook.id) ||
      (userListeningStats.bookSeconds[currentBook.id] || 0) > 0 ||
      (userListeningStats.bookPlayCount[currentBook.id] || 0) > 0 ||
      isBookStarted(currentBook) ||
      isBookCompleted(currentBook)
    );

    return wasEverPlayed;
  }, [
    isPlaying,
    isFullScreen,
    resumePlayback,
    currentBook,
    books,
    lastPlayedBookId,
    recentlyListenedBookIds,
    userListeningStats,
    startedChapters,
    completedChapters
  ]);

  useEffect(() => {
    if (!isPlayerVisible) {
      closeAllPopups();
    }
  }, [isPlayerVisible]);

  const homeSections = useMemo((): HomeSection[] => {
    if (books.length === 0) return [];

    const sections: HomeSection[] = [];
    const listenedBooks = books.filter(b => 
      recentlyListenedBookIds.includes(b.id) || 
      (userListeningStats.bookSeconds[b.id] || 0) >= 10 ||
      (userListeningStats.bookPlayCount[b.id] || 0) >= 1 ||
      isBookStarted(b) || 
      isBookCompleted(b) || 
      currentBook.id === b.id
    );
    const inProgressBooks = books.filter(b => isBookStarted(b) && !isBookCompleted(b));
    const completedBooks = books.filter(b => isBookCompleted(b));
    const unstartedBooks = books.filter(b => !isBookStarted(b) && !isBookCompleted(b));

    // 1. Continue ouvindo (em andamento, ordenado por último reproduzido)
    if (inProgressBooks.length > 0) {
      const sortedInProgress = [...inProgressBooks].sort((a, b) => {
        const timeA = userListeningStats.bookLastPlayed[a.id] || 0;
        const timeB = userListeningStats.bookLastPlayed[b.id] || 0;
        if (timeA !== timeB) return timeB - timeA;
        const idxA = recentlyListenedBookIds.indexOf(a.id);
        const idxB = recentlyListenedBookIds.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
      sections.push({
        id: 'in-progress',
        title: t('section_continue_listening'),
        subtitle: t('section_continue_listening_sub'),
        badge: `${inProgressBooks.length} ${t('filter_in_progress').toLowerCase()}`,
        ...(sortedInProgress.length > 6 ? {
          buttonLabel: t('see_all'),
          onButtonClick: () => navigateTo('home-continuar-ouvindo'),
        } : {}),
        books: sortedInProgress.slice(0, 6)
      });
    }

    // 2. Falta pouco para concluir (>50% concluído)
    const almostDone = inProgressBooks.filter(b => {
      const chaps = visibleChapters(b.chapters, showExtraChapters);
      if (chaps.length <= 1) return false;
      const doneCount = chaps.filter((c: any) => completedChapters.includes(`${b.id}-${c.id}`)).length;
      return (doneCount / chaps.length) >= 0.5;
    });
    if (almostDone.length > 0) {
      sections.push({
        id: 'almost-done',
        title: t('section_almost_done'),
        subtitle: t('section_almost_done_sub'),
        badge: t('section_almost_done'),
        books: almostDone.slice(0, 6)
      });
    }

    // 3. Ouvidos recentemente
    if (recentlyListenedBooks.length > 0) {
      sections.push({
        id: 'recently-listened',
        title: t('section_recently_listened'),
        subtitle: t('section_recently_listened_sub'),
        ...(recentlyListenedBooks.length > 6 ? {
          buttonLabel: t('see_all'),
          onButtonClick: () => navigateTo('home-ouvidos-recentemente'),
        } : {}),
        books: recentlyListenedBooks.slice(0, 6)
      });
    }

    // 4. Gênero que você mais ouve (personalizado com base no tempo real de escuta)
    if (userListeningProfile.topGenres.length > 0) {
      const topGenre = userListeningProfile.topGenres[0];
      let genreRecs = books.filter(b => 
        (b.category?.toLowerCase() === topGenre || b.subgenre?.toLowerCase() === topGenre) && 
        !isBookStarted(b) && 
        !isBookCompleted(b)
      );
      if (genreRecs.length === 0) {
        genreRecs = books.filter(b => 
          (b.category?.toLowerCase() === topGenre || b.subgenre?.toLowerCase() === topGenre) && 
          currentBook.id !== b.id
        );
      }
      if (genreRecs.length > 0) {
        if (userListeningProfile.avgPreferredDuration > 0) {
          genreRecs.sort((a, b) => {
            const diffA = Math.abs(getBookDurationInSeconds(a) - userListeningProfile.avgPreferredDuration);
            const diffB = Math.abs(getBookDurationInSeconds(b) - userListeningProfile.avgPreferredDuration);
            return diffA - diffB;
          });
        }

        const cleanCat = topGenre.trim().toLowerCase();
        const matchedGenreObj = Object.values(GENRE_HIERARCHY).find(g => 
          g.name.toLowerCase() === cleanCat || 
          g.id.toLowerCase() === cleanCat
        );
        const matchedSubgenreObj = !matchedGenreObj ? Object.values(GENRE_HIERARCHY).find(g => 
          g.subgenres.some(s => s.toLowerCase() === cleanCat)
        ) : null;
        const subgenreName = matchedSubgenreObj ? matchedSubgenreObj.subgenres.find(s => s.toLowerCase() === cleanCat) : null;

        const handleGoToGenre = () => {
          if (matchedGenreObj) {
            navigateTo(`library-genre-${matchedGenreObj.id}`);
          } else if (matchedSubgenreObj && subgenreName) {
            navigateTo(`library-subgenre-${matchedSubgenreObj.id}-${subgenreName}`, { genre: matchedSubgenreObj, subgenre: subgenreName });
          } else {
            navigateTo('library-gêneros');
          }
        };

        const localizedGenre = matchedGenreObj 
          ? getGenreName(matchedGenreObj.id, resolvedLanguage) 
          : (subgenreName ? getSubgenreName(subgenreName, resolvedLanguage) : topGenre);

        sections.push({
          id: 'top-genre',
          title: t('section_top_genre', { genre: localizedGenre }),
          subtitle: t('section_top_genre_sub'),
          badge: t('badge_top_genre'),
          buttonLabel: t('btn_go_to_genre'),
          onButtonClick: handleGoToGenre,
          books: genreRecs.slice(0, 6)
        });
      }
    }

    // 5. Audiobooks no ritmo de duração que o usuário mais costuma ouvir
    if (userListeningProfile.avgPreferredDuration >= 120 && userListeningProfile.formattedDuration) {
      const avgSec = userListeningProfile.avgPreferredDuration;
      const similarDurationBooks = books.filter(b => {
        if (isBookStarted(b) || isBookCompleted(b)) return false;
        const dur = getBookDurationInSeconds(b);
        return dur >= avgSec * 0.45 && dur <= avgSec * 1.85;
      }).sort((a, b) => {
        const catA = (a.category || '').toLowerCase();
        const catB = (b.category || '').toLowerCase();
        const genreRankA = userListeningProfile.topGenres.indexOf(catA);
        const genreRankB = userListeningProfile.topGenres.indexOf(catB);
        const bonusA = genreRankA !== -1 ? (genreRankA === 0 ? 0.65 : 0.85) : 1;
        const bonusB = genreRankB !== -1 ? (genreRankB === 0 ? 0.65 : 0.85) : 1;
        const diffA = Math.abs(getBookDurationInSeconds(a) - avgSec) * bonusA;
        const diffB = Math.abs(getBookDurationInSeconds(b) - avgSec) * bonusB;
        return diffA - diffB;
      });

      if (similarDurationBooks.length > 0) {
        sections.push({
          id: 'similar-duration',
          title: t('section_similar_duration', { duration: userListeningProfile.formattedDuration }),
          subtitle: t('section_similar_duration_sub'),
          badge: t('badge_similar_duration'),
          books: similarDurationBooks.slice(0, 6)
        });
      }
    }

    // 6. Mais títulos dos autores que o usuário mais ouve
    if (userListeningProfile.topAuthors.length > 0) {
      let selectedAuthorObj: { authorId: string; name: string; score: number } | null = null;
      let authorOtherTitles: Audiobook[] = [];

      for (const aEntry of userListeningProfile.topAuthors) {
        const others = books.filter(b => 
          bookHasAuthor(b, { id: aEntry.authorId, name: aEntry.name }) && 
          !isBookCompleted(b) && 
          !inProgressBooks.some(ip => ip.id === b.id)
        );
        if (others.length > 0) {
          selectedAuthorObj = aEntry;
          if (userListeningProfile.avgPreferredDuration > 0) {
            others.sort((a, b) => {
              const diffA = Math.abs(getBookDurationInSeconds(a) - userListeningProfile.avgPreferredDuration);
              const diffB = Math.abs(getBookDurationInSeconds(b) - userListeningProfile.avgPreferredDuration);
              return diffA - diffB;
            });
          }
          authorOtherTitles = others;
          break;
        }
      }

      if (selectedAuthorObj && authorOtherTitles.length > 0) {
        const authorObj = authors.find(a => a.id === selectedAuthorObj!.authorId || a.name.toLowerCase() === selectedAuthorObj!.name.toLowerCase());
        const authorId = authorObj?.id || selectedAuthorObj.authorId || authorOtherTitles[0]?.authorId;
        const authorName = authorObj?.name || selectedAuthorObj.name || authorOtherTitles[0]?.author;
        sections.push({
          id: 'listened-author-more',
          title: t('section_more_from_author', { author: authorName }),
          subtitle: t('section_more_from_author_sub'),
          buttonLabel: t('btn_go_to_author'),
          onButtonClick: () => handleSelectAuthor(authorId, authorName),
          books: authorOtherTitles.slice(0, 6)
        });
      }
    }

    // 7. Mais do seu segundo gênero preferido (se houver dados suficientes)
    if (userListeningProfile.topGenres.length > 1) {
      const secondGenre = userListeningProfile.topGenres[1];
      const secondGenreRecs = books.filter(b => 
        (b.category?.toLowerCase() === secondGenre || b.subgenre?.toLowerCase() === secondGenre) && 
        !isBookStarted(b) && 
        !isBookCompleted(b)
      );
      if (secondGenreRecs.length > 0) {
        if (userListeningProfile.avgPreferredDuration > 0) {
          secondGenreRecs.sort((a, b) => {
            const diffA = Math.abs(getBookDurationInSeconds(a) - userListeningProfile.avgPreferredDuration);
            const diffB = Math.abs(getBookDurationInSeconds(b) - userListeningProfile.avgPreferredDuration);
            return diffA - diffB;
          });
        }
        const cleanCat = secondGenre.trim().toLowerCase();
        const matchedGenreObj = Object.values(GENRE_HIERARCHY).find(g => 
          g.name.toLowerCase() === cleanCat || 
          g.id.toLowerCase() === cleanCat
        );
        const matchedSubgenreObj = !matchedGenreObj ? Object.values(GENRE_HIERARCHY).find(g => 
          g.subgenres.some(s => s.toLowerCase() === cleanCat)
        ) : null;
        const subgenreName = matchedSubgenreObj ? matchedSubgenreObj.subgenres.find(s => s.toLowerCase() === cleanCat) : null;

        const handleGoToGenre = () => {
          if (matchedGenreObj) {
            navigateTo(`library-genre-${matchedGenreObj.id}`);
          } else if (matchedSubgenreObj && subgenreName) {
            navigateTo(`library-subgenre-${matchedSubgenreObj.id}-${subgenreName}`, { genre: matchedSubgenreObj, subgenre: subgenreName });
          } else {
            navigateTo('library-gêneros');
          }
        };

        const localizedGenre = matchedGenreObj 
          ? getGenreName(matchedGenreObj.id, resolvedLanguage) 
          : (subgenreName ? getSubgenreName(subgenreName, resolvedLanguage) : secondGenre);

        sections.push({
          id: 'top-genre-2',
          title: t('section_top_genre', { genre: localizedGenre }),
          subtitle: t('section_top_genre_sub'),
          badge: t('badge_top_genre'),
          buttonLabel: t('btn_go_to_genre'),
          onButtonClick: handleGoToGenre,
          books: secondGenreRecs.slice(0, 6)
        });
      }
    }

    // 8. Audiobooks ainda não ouvidos de autores favoritos
    if (favoriteAuthorIds.length > 0) {
      const favAuthors = authors.filter(a => favoriteAuthorIds.includes(a.id));
      const unstartedFromFavAuthors = books.filter(b =>
        favAuthors.some(a => bookHasAuthor(b, a)) &&  
        !isBookStarted(b) && 
        !isBookCompleted(b)
      );
      if (unstartedFromFavAuthors.length > 0) {
        const topFavAuthor = authors.find(a => 
          favoriteAuthorIds.includes(a.id) && 
          unstartedFromFavAuthors.some(b => bookHasAuthor(b, a))
        );
        const authorName = topFavAuthor?.name || unstartedFromFavAuthors[0]?.author;
        const authorId = topFavAuthor?.id || unstartedFromFavAuthors[0]?.authorId;
        sections.push({
          id: 'unstarted-fav-authors',
          title: authorName ? t('section_unstarted_fav_authors', { author: authorName }) : t('section_unstarted_fav_authors_default'),
          subtitle: t('section_unstarted_fav_authors_sub'),
          badge: t('badge_fav_author'),
          buttonLabel: t('btn_go_to_author'),
          onButtonClick: () => handleSelectAuthor(authorId, authorName),
          books: unstartedFromFavAuthors.slice(0, 6)
        });
      }
    }

    // 9. Audiobooks ainda não ouvidos da lista de favoritos
    if (favoriteBookIds.length > 0) {
      const unstartedFavorites = books.filter(b => 
        favoriteBookIds.includes(b.id) && 
        !isBookStarted(b) && 
        !isBookCompleted(b)
      );
      if (unstartedFavorites.length > 0) {
        sections.push({
          id: 'unstarted-favorites',
          title: t('section_unstarted_favorites'),
          subtitle: t('section_unstarted_favorites_sub'),
          badge: t('badge_favorites'),
          ...(unstartedFavorites.length > 6 ? {
            buttonLabel: t('btn_view_favorites'),
            onButtonClick: () => navigateTo('library-audiobooks-favoritos'),
          } : {}),
          books: unstartedFavorites.slice(0, 6)
        });
      }
    }

    // 10. Esquecidos na biblioteca (adicionados há mais tempo e ainda não ouvidos)
    if (unstartedBooks.length > 0 && books.length >= 3) {
      const forgottenList = unstartedBooks.slice(0, 6);
      sections.push({
        id: 'forgotten-library',
        title: t('section_forgotten'),
        subtitle: t('section_forgotten_sub'),
        badge: t('badge_how_about_starting'),
        books: forgottenList
      });
    }

    // 11. Audiobooks em idiomas diferentes
    const langCounts = new Map<string, number>();
    listenedBooks.forEach(b => {
      const { language } = resolveNarratorAndLanguage(b);
      if (!language) return;
      const l = language.toLowerCase();
      langCounts.set(l, (l.toLowerCase() === l ? (langCounts.get(l) || 0) + 1 : 1));
    });
    const primaryLang = Array.from(langCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'português';

    const otherLangBooks = books.filter(b => {
      const { language } = resolveNarratorAndLanguage(b);
      if (!language) return false;
      const l = language.toLowerCase();
      return l !== primaryLang && !isBookCompleted(b);
    });

    if (otherLangBooks.length > 0) {
      sections.push({
        id: 'other-languages',
        title: t('section_other_languages'),
        subtitle: t('section_other_languages_sub'),
        buttonLabel: t('btn_view_languages'),
        onButtonClick: () => navigateTo('library-idiomas'),
        books: otherLangBooks.slice(0, 6)
      });
    }

    // 12. Novas descobertas (gêneros que o usuário ainda não experimentou)
    if (userListeningProfile.topGenres.length > 0 || listenedBooks.length > 0) {
      const triedGenres = new Set([
        ...userListeningProfile.topGenres,
        ...listenedBooks.map(b => b.category?.toLowerCase()).filter(Boolean)
      ]);
      const freshBooks = books.filter(b => {
        const cat = b.category?.toLowerCase();
        return cat && !triedGenres.has(cat) && !isBookStarted(b) && !isBookCompleted(b);
      });
      if (freshBooks.length > 0) {
        if (userListeningProfile.avgPreferredDuration > 0) {
          freshBooks.sort((a, b) => {
            const diffA = Math.abs(getBookDurationInSeconds(a) - userListeningProfile.avgPreferredDuration);
            const diffB = Math.abs(getBookDurationInSeconds(b) - userListeningProfile.avgPreferredDuration);
            return diffA - diffB;
          });
        }
        sections.push({
          id: 'fresh-discovery',
          title: t('section_fresh_discoveries'),
          subtitle: t('section_fresh_discoveries_sub'),
          badge: t('badge_try_it'),
          books: freshBooks.slice(0, 6)
        });
      }
    }

    // 13. Adicionados recentemente
    if (recentlyAddedBooks.length > 0) {
      sections.push({
        id: 'recently-added',
        title: t('section_recently_added'),
        subtitle: t('section_recently_added_sub'),
        ...(recentlyAddedBooks.length > 6 ? {
          buttonLabel: t('see_all'),
          onButtonClick: () => navigateTo('home-adicionados-recentemente'),
        } : {}),
        books: recentlyAddedBooks.slice(0, 6)
      });
    }

    // 14. Ouvir novamente (concluídos, priorizando favoritos)
    if (completedBooks.length > 0) {
      const sortedCompleted = [...completedBooks].sort((a, b) => {
        const favA = favoriteBookIds.includes(a.id) ? 1 : 0;
        const favB = favoriteBookIds.includes(b.id) ? 1 : 0;
        return favB - favA;
      });
      sections.push({
        id: 'listen-again',
        title: t('section_listen_again'),
        subtitle: t('section_listen_again_sub'),
        badge: t('filter_completed'),
        books: sortedCompleted.slice(0, 6)
      });
    }

    return sections;
  }, [
    books,
    recentlyListenedBooks,
    recentlyAddedBooks,
    recentlyListenedBookIds,
    userListeningStats,
    userListeningProfile,
    startedChapters,
    completedChapters,
    favoriteBookIds,
    favoriteAuthorIds,
    currentBook,
    authors,
    t,
    resolvedLanguage,
    handleSelectAuthor,
    navigateTo,
    setStatusFilter
  ]);

  const _favoriteChaptersList = useMemo(() => {
    const list: { book: Audiobook; chapter: Chapter; chapterIndex: number }[] = [];
    favoriteChapters.forEach(key => {
      const parts = key.split('-');
      const bookId = parts[0];
      const chapId = parts.slice(1).join('-');
      const book = books.find(b => b.id === bookId);
      if (book) {
        const idx = (book.chapters || []).findIndex(c => String(c.id) === String(chapId));
        if (idx !== -1) {
          list.push({ book, chapter: book.chapters[idx], chapterIndex: idx });
        }
      }
    });
    return list;
  }, [favoriteChapters, books]);
  void _favoriteChaptersList;

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    books.forEach(b => {
      const { language } = resolveNarratorAndLanguage(b);
      if (language) langs.add(language);
    });
    return Array.from(langs).filter(lang =>
      books.some(b => {
        const { language } = resolveNarratorAndLanguage(b);
        return Boolean(language && language.toLowerCase() === lang.toLowerCase());
      })
    );
  }, [books]);

  const sortBooks = useCallback((bookList: Audiobook[]): Audiobook[] => {
    return [...bookList].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return compareTitles(a.title, b.title, resolvedLanguage);
        case 'name-desc': return compareTitles(b.title, a.title, resolvedLanguage);
        case 'year-desc': return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
        case 'year-asc': return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
        case 'duration-desc': {
          const aDur = (a.chapters || []).reduce((s, c) => s + (c.duration || 0), 0);
          const bDur = (b.chapters || []).reduce((s, c) => s + (c.duration || 0), 0);
          return bDur - aDur;
        }
        case 'duration-asc': {
          const aDur = (a.chapters || []).reduce((s, c) => s + (c.duration || 0), 0);
          const bDur = (b.chapters || []).reduce((s, c) => s + (c.duration || 0), 0);
          return aDur - bDur;
        }
        default: return 0;
      }
    });
  }, [sortBy, resolvedLanguage]);

  // ===== Coleções: cards reutilizados na página da coleção e nas sub-páginas "Ver tudo" =====
  // Coleções seguem o "Ordenar por": nome; ano = data de criação; duração = quantidade de itens
  const sortedCollections = useMemo(() => {
    const count = (c: Collection) => c.bookIds.length + (c.authorIds || []).length;
    return [...collections].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name, resolvedLanguage, { sensitivity: 'base' });
        case 'name-desc': return b.name.localeCompare(a.name, resolvedLanguage, { sensitivity: 'base' });
        case 'year-desc': return (b.createdAt || 0) - (a.createdAt || 0);
        case 'year-asc': return (a.createdAt || 0) - (b.createdAt || 0);
        case 'duration-desc': return count(b) - count(a);
        case 'duration-asc': return count(a) - count(b);
        default: return 0;
      }
    });
  }, [collections, sortBy, resolvedLanguage]);
  // Autores seguem a ordenação por nome do botão "Ordenar por" (demais critérios mantêm a ordem da coleção)
  const sortCollectionAuthors = (list: Author[]): Author[] => {
    if (sortBy === 'name-asc') return [...list].sort((a, b) => a.name.localeCompare(b.name, resolvedLanguage, { sensitivity: 'base' }));
    if (sortBy === 'name-desc') return [...list].sort((a, b) => b.name.localeCompare(a.name, resolvedLanguage, { sensitivity: 'base' }));
    return list;
  };
  const getCollectionItems = (collection: Collection) => ({
    books: sortBooks(books.filter(b => collection.bookIds.includes(b.id))),
    authors: sortCollectionAuthors(authors.filter(a => (collection.authorIds || []).includes(a.id))),
  });
  const renderCollectionAuthorCard = (author: Author, collectionId: string) => (
    <AuthorCard
      key={author.id}
      author={author}
      onSelect={() => navigateTo('author-detail', author)}
      isFavorite={favoriteAuthorIds.includes(author.id)}
      onToggleFavorite={() => toggleFavoriteAuthor(author.id)}
      currentCollectionId={collectionId}
    />
  );
  const renderCollectionBookCard = (book: Audiobook, collectionId: string) => (
    <BookCard
      key={book.id}
      book={book}
      onSelect={() => handleSelectBookDetail(book)}
      onSelectAuthor={handleSelectAuthor}
      onPlay={() => handlePlayBookFromStart(book)}
      onEdit={() => setEditingBook(book)}
      onAddToQueue={(pos) => handleAddToQueue(book, pos)}
      currentCollectionId={collectionId}
      onDelete={() => {
        handleDeleteBook(book.id);
        showToast(t('toast_book_deleted', { title: book.title }));
      }}
      isSelectionMode={isSelectionMode}
      isSelected={selectedBooks.includes(book.id)}
      onToggleSelect={() => {
        if(selectedBooks.includes(book.id)) setSelectedBooks(selectedBooks.filter(id => id !== book.id));
        else setSelectedBooks([...selectedBooks, book.id]);
      }}
      isFavorite={favoriteBookIds.includes(book.id)}
      onToggleFavorite={() => toggleFavoriteBook(book.id)}
      isBookPlaying={currentBook.id === book.id && isPlaying}
      isCompleted={isBookCompleted(book)}
      isStarted={isBookStarted(book)}
      onToggleCompleted={() => {
        const isComp = isBookCompleted(book);
        const chapIds = (book.chapters || []).map((c: any) => `${book.id}-${c.id}`);
        if (isComp) {
          setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
          setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
          showToast(t('toast_book_marked_unstarted', { title: book.title }));
        } else {
          setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
          setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
          showToast(t('toast_book_marked_completed', { title: book.title }));
        }
      }}
    />
  );

  // Audiobooks com vários autores no campo ("A & B", "A, B"): cada nome vira um autor cadastrado e o
  // audiobook fica ligado a todos. Vale para os que já estavam na biblioteca e para os editados depois.
  useEffect(() => {
    const known = new Map(authors.map(a => [a.name.trim().toLowerCase(), a] as const));
    const missing: Author[] = [];
    let changed = false;
    const next = books.map(b => {
      const names = splitAuthorNames(b.author);
      if (names.length < 2) {
        if (!b.authorIds) return b;
        changed = true;
        const { authorIds: _drop, ...rest } = b;
        return rest as Audiobook;
      }
      const ids = names.map((name, k) => {
        const key = name.trim().toLowerCase();
        let a = known.get(key);
        if (!a) {
          a = { id: `a_${Date.now()}_${k}_${Math.random().toString(36).slice(2, 7)}`, name, nationality: 'Desconhecido', picture: getAuthorAvatar(name), bio: '' };
          known.set(key, a);
          missing.push(a);
        }
        return a.id;
      });
      if (b.authorId === ids[0] && (b.authorIds || []).join('|') === ids.join('|')) return b;
      changed = true;
      return { ...b, authorId: ids[0], authorIds: ids };
    });
    if (missing.length > 0) {
      setAuthors(prev => [...prev, ...missing.filter(m => !prev.some(a => a.name.trim().toLowerCase() === m.name.trim().toLowerCase()))]);
    }
    if (changed) setBooks(next);
  }, [books, authors]);

  const sortedAuthors = useMemo(() => {
    // Apenas autores que possuem pelo menos 1 audiobook correspondente na biblioteca
    const matchingAuthors = authors.filter(a =>
      books.some(bk => bookHasAuthor(bk, a))
    );

    // Inclui autores presentes nos audiobooks que porventura ainda não estejam cadastrados em 'authors'
    const existingNames = new Set(matchingAuthors.map(a => a.name.trim().toLowerCase()));
    const extraAuthors: Author[] = [];
    books.forEach(bk => {
      getBookAuthorNames(bk).forEach((authName, n) => {
      if (authName && !existingNames.has(authName.toLowerCase())) {
        existingNames.add(authName.toLowerCase());
        extraAuthors.push({
          id: (n === 0 && bk.authorId && !splitAuthorNames(bk.author).slice(1).length ? bk.authorId : '') || `author_${authName.toLowerCase().replace(/\s+/g, '_')}`,
          name: authName,
          nationality: 'Desconhecido',
          picture: getAuthorAvatar(authName),
          bio: ''
        });
      }
      });
    });

    const allValidAuthors = [...matchingAuthors, ...extraAuthors];

    return allValidAuthors.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, resolvedLanguage, { sensitivity: 'base' });
        case 'name-desc':
          return b.name.localeCompare(a.name, resolvedLanguage, { sensitivity: 'base' });
        case 'year-desc': {
          const aBooks = books.filter(bk => bookHasAuthor(bk, a));
          const bBooks = books.filter(bk => bookHasAuthor(bk, b));
          const aYear = Math.max(0, ...aBooks.map(bk => parseInt(bk.year) || 0));
          const bYear = Math.max(0, ...bBooks.map(bk => parseInt(bk.year) || 0));
          return bYear - aYear;
        }
        case 'year-asc': {
          const aBooks = books.filter(bk => bookHasAuthor(bk, a));
          const bBooks = books.filter(bk => bookHasAuthor(bk, b));
          const aYear = Math.min(9999, ...aBooks.map(bk => parseInt(bk.year) || 9999));
          const bYear = Math.min(9999, ...bBooks.map(bk => parseInt(bk.year) || 9999));
          return aYear - bYear;
        }
        case 'duration-desc': {
          const aBooks = books.filter(bk => bookHasAuthor(bk, a));
          const bBooks = books.filter(bk => bookHasAuthor(bk, b));
          const aDur = aBooks.reduce((sum, bk) => sum + (bk.chapters || []).reduce((s, c) => s + (c.duration || 0), 0), 0);
          const bDur = bBooks.reduce((sum, bk) => sum + (bk.chapters || []).reduce((s, c) => s + (c.duration || 0), 0), 0);
          return bDur - aDur;
        }
        case 'duration-asc': {
          const aBooks = books.filter(bk => bookHasAuthor(bk, a));
          const bBooks = books.filter(bk => bookHasAuthor(bk, b));
          const aDur = aBooks.reduce((sum, bk) => sum + (bk.chapters || []).reduce((s, c) => s + (c.duration || 0), 0), 0);
          const bDur = bBooks.reduce((sum, bk) => sum + (bk.chapters || []).reduce((s, c) => s + (c.duration || 0), 0), 0);
          return aDur - bDur;
        }
        default:
          return a.name.localeCompare(b.name, resolvedLanguage, { sensitivity: 'base' });
      }
    });
  }, [authors, books, sortBy, resolvedLanguage]);

  const sortedLanguages = useMemo(() => {
    return [...availableLanguages].sort((a, b) => {
      const aIsOther = a.toLowerCase() === 'outro' || a.toLowerCase() === 'outros';
      const bIsOther = b.toLowerCase() === 'outro' || b.toLowerCase() === 'outros';
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      const aName = getLanguageCardName(a, resolvedLanguage);
      const bName = getLanguageCardName(b, resolvedLanguage);
      if (sortBy === 'name-desc') {
        return bName.localeCompare(aName, resolvedLanguage, { sensitivity: 'base' });
      }
      return aName.localeCompare(bName, resolvedLanguage, { sensitivity: 'base' });
    });
  }, [availableLanguages, sortBy, resolvedLanguage]);

  const sortedGenres = useMemo(() => {
    const list = Object.values(GENRE_HIERARCHY).filter(genreData =>
      books.some(b => isBookInGenre(b, genreData))
    );
    return list.sort((a, b) => {
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name, resolvedLanguage, { sensitivity: 'base' });
      }
      return a.name.localeCompare(b.name, resolvedLanguage, { sensitivity: 'base' });
    });
  }, [books, sortBy, resolvedLanguage]);

  const matchesBookSearch = useCallback((b: Audiobook, q: string): boolean => {
    if (!q) return true;
    const qNorm = normalizeSearchStr(q);
    if (!qNorm) return true;

    const titleNorm = normalizeSearchStr(b.title);
    if (titleNorm.includes(qNorm)) return true;

    const authorNorm = normalizeSearchStr(b.author);
    if (authorNorm.includes(qNorm)) return true;

    const narratorNorm = normalizeSearchStr(b.narrator);
    if (narratorNorm.includes(qNorm)) return true;

    // Category / Genre
    const catNorm = normalizeSearchStr(b.category);
    if (catNorm.includes(qNorm)) return true;

    const catTranslated = normalizeSearchStr(getGenreName(b.category, resolvedLanguage));
    if (catTranslated.includes(qNorm)) return true;

    // Subgenre
    if (b.subgenre) {
      const subNorm = normalizeSearchStr(b.subgenre);
      if (subNorm.includes(qNorm)) return true;
      const subTranslated = normalizeSearchStr(getSubgenreName(b.subgenre, resolvedLanguage));
      if (subTranslated.includes(qNorm)) return true;
    }

    // Language
    const { language } = resolveNarratorAndLanguage(b);
    if (language) {
      const langNorm = normalizeSearchStr(language);
      if (langNorm.includes(qNorm)) return true;
      const langDisplayName = normalizeSearchStr(getLanguageDisplayName(language, resolvedLanguage));
      if (langDisplayName.includes(qNorm)) return true;
      const langCardName = normalizeSearchStr(getLanguageCardName(language, resolvedLanguage));
      if (langCardName.includes(qNorm)) return true;
    }

    // Author Nationality
    const authorObj = authors.find(a => a.id === b.authorId || (a.name || '').toLowerCase() === (b.author || '').toLowerCase());
    if (authorObj?.nationality) {
      if (matchesNationality(authorObj.nationality, qNorm)) return true;
    }

    return false;
  }, [authors, resolvedLanguage]);

  const filteredBooks = useMemo(() => {
    let result = books.filter(b => {
      const matchesSearch = !searchQuery || matchesBookSearch(b, searchQuery);
      if (!matchesSearch) return false;

      if (statusFilter === 'in-progress') {
        return isBookStarted(b) && !isBookCompleted(b);
      }
      if (statusFilter === 'completed') {
        return isBookCompleted(b);
      }
      if (statusFilter === 'unstarted') {
        return !isBookStarted(b) && !isBookCompleted(b);
      }
      if (statusFilter === 'favorites') {
        return favoriteBookIds.includes(b.id);
      }
      return true;
    });

    return sortBooks(result);
  }, [books, searchQuery, matchesBookSearch, sortBooks, statusFilter, completedChapters, startedChapters, favoriteBookIds, currentBook?.id]);

  // Mapeamento fonético / transliteração de letras latinas para Cirílico e Árabe
  const LATIN_TO_CYRILLIC: Record<string, string> = {
    A: 'А', B: 'Б', C: 'К', D: 'Д', E: 'Е', F: 'Ф', G: 'Г', H: 'Х',
    I: 'И', J: 'Ж', K: 'К', L: 'Л', M: 'М', N: 'Н', O: 'О', P: 'П',
    Q: 'К', R: 'Р', S: 'С', T: 'Т', U: 'У', V: 'В', W: 'В', X: 'Х',
    Y: 'И', Z: 'З'
  };

  const LATIN_TO_ARABIC: Record<string, string> = {
    A: 'أ', B: 'ب', C: 'ك', D: 'د', E: 'أ', F: 'ف', G: 'غ', H: 'هـ',
    I: 'أ', J: 'ج', K: 'ك', L: 'ل', M: 'م', N: 'ن', O: 'و', P: 'ب',
    Q: 'ق', R: 'ر', S: 'س', T: 'ت', U: 'أ', V: 'ف', W: 'و', X: 'أ',
    Y: 'ي', Z: 'ز'
  };

  const getAlphabetGroupKey = (title: string, lang: string): { id: string; key: string } => {
    const clean = (title || '').trim().replace(/^["'«»“”‘’()[\]{}—\-_\s.]+/, '');
    if (!clean) return { id: 'symbol', key: '#' };

    // Remove diacríticos do árabe (tashkeel) se houver
    const strippedArabic = clean.replace(/[\u064B-\u065F\u0670\u0640]/g, '');
    if (!strippedArabic) return { id: 'symbol', key: '#' };

    const firstChar = strippedArabic[0];

    // 0. Dígito (0-9 e numerais arábicos/persas)
    if (/[0-9\u0660-\u0669\u06F0-\u06F9]/.test(firstChar)) {
      return { id: 'symbol', key: '#' };
    }

    // 1. Caractere nativo Cirílico (\u0400-\u04FF)
    if (/[\u0400-\u04FF]/.test(firstChar)) {
      const cyr = firstChar.toUpperCase();
      return { id: `cyr-${cyr}`, key: cyr };
    }

    // 2. Caractere nativo Árabe (\u0600-\u06FF)
    if (/[\u0600-\u06FF]/.test(firstChar)) {
      let arChar = firstChar;
      if (/[أإآٱا]/.test(arChar)) arChar = 'أ';
      else if (/[يىئ]/.test(arChar)) arChar = 'ي';
      else if (/[ة]/.test(arChar)) arChar = 'هـ';
      return { id: `ar-${arChar}`, key: arChar };
    }

    // 3. Caractere Latino
    const latinNorm = firstChar.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (/[A-Z]/.test(latinNorm)) {
      if (lang === 'ru') {
        const cyrMapped = LATIN_TO_CYRILLIC[latinNorm] || latinNorm;
        return { id: `cyr-${cyrMapped}`, key: cyrMapped };
      }
      if (lang === 'ar') {
        const arMapped = LATIN_TO_ARABIC[latinNorm] || latinNorm;
        return { id: `ar-${arMapped}`, key: arMapped };
      }
      return { id: `lat-${latinNorm}`, key: latinNorm };
    }

    // 4. Dígito ou símbolo
    return { id: 'symbol', key: '#' };
  };

  const allBooksNavGroups = useMemo<AllBooksNavGroup[]>(() => {
    const filtered = books.filter(b => {
      if (statusFilter === 'in-progress') return isBookStarted(b) && !isBookCompleted(b);
      if (statusFilter === 'completed') return isBookCompleted(b);
      if (statusFilter === 'unstarted') return !isBookStarted(b) && !isBookCompleted(b);
      if (statusFilter === 'favorites') return favoriteBookIds.includes(b.id);
      return true;
    });

    if (sortBy === 'name-asc' || sortBy === 'name-desc') {
      const groupMap = new Map<string, { id: string; key: string; books: Audiobook[] }>();
      filtered.forEach(book => {
        const { id, key } = getAlphabetGroupKey(book.title, resolvedLanguage);
        if (!groupMap.has(key)) {
          groupMap.set(key, { id, key, books: [] });
        }
        groupMap.get(key)!.books.push(book);
      });

      // Ordem: números e símbolos (#) antes da letra A; "Z-A" inverte tudo
      const keyRank = (k: string) => (k === '#' ? 0 : 1);
      const keys = Array.from(groupMap.keys()).sort((a, b) => {
        const rankDiff = keyRank(a) - keyRank(b);
        if (rankDiff !== 0) return sortBy === 'name-asc' ? rankDiff : -rankDiff;
        return sortBy === 'name-asc'
          ? a.localeCompare(b, resolvedLanguage)
          : b.localeCompare(a, resolvedLanguage);
      });

      return keys.map(key => {
        const item = groupMap.get(key)!;
        const groupBooks = item.books.slice().sort((a, b) => {
          return sortBy === 'name-asc'
            ? compareTitles(a.title, b.title, resolvedLanguage)
            : compareTitles(b.title, a.title, resolvedLanguage);
        });
        return {
          id: item.id,
          title: item.key,
          navLabel: item.key,
          books: groupBooks,
        };
      });
    }

    if (sortBy === 'year-desc' || sortBy === 'year-asc') {
      const map = new Map<string, { decadeNum: number; books: Audiobook[] }>();
      const unspecKey = t('year_unspecified');

      filtered.forEach(book => {
        const yearStr = (book.year || '').trim();
        const num = parseInt(yearStr, 10);
        let key: string;
        let decadeNum: number;

        if (!isNaN(num) && num > 0) {
          decadeNum = Math.floor(num / 10) * 10;
          key = `${decadeNum}'s`;
        } else {
          decadeNum = -1;
          key = unspecKey;
        }

        if (!map.has(key)) map.set(key, { decadeNum, books: [] });
        map.get(key)!.books.push(book);
      });

      const keys = Array.from(map.keys()).sort((a, b) => {
        if (a === unspecKey) return 1;
        if (b === unspecKey) return -1;
        const numA = map.get(a)!.decadeNum;
        const numB = map.get(b)!.decadeNum;
        return sortBy === 'year-desc' ? numB - numA : numA - numB;
      });

      return keys.map(key => {
        const item = map.get(key)!;
        const groupBooks = item.books.slice().sort((a, b) => {
          const yearA = parseInt(a.year || '', 10) || 0;
          const yearB = parseInt(b.year || '', 10) || 0;
          if (yearA !== yearB) {
            return sortBy === 'year-desc' ? yearB - yearA : yearA - yearB;
          }
          return compareTitles(a.title, b.title, resolvedLanguage);
        });
        return {
          id: `year-${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
          title: key,
          navLabel: key === unspecKey ? '—' : key,
          books: groupBooks,
        };
      });
    }

    if (sortBy === 'duration-desc' || sortBy === 'duration-asc') {
      const categories = [
        { id: 'dur-under-1h', navLabel: '< 1h', min: 0, max: 3600 },
        { id: 'dur-1-3h', navLabel: '1-3h', min: 3600, max: 10800 },
        { id: 'dur-3-6h', navLabel: '3-6h', min: 10800, max: 21600 },
        { id: 'dur-6-10h', navLabel: '6-10h', min: 21600, max: 36000 },
        { id: 'dur-10-20h', navLabel: '10-20h', min: 36000, max: 72000 },
        { id: 'dur-over-20h', navLabel: '> 20h', min: 72000, max: Infinity },
      ];

      const orderedCategories = sortBy === 'duration-desc' ? [...categories].reverse() : categories;

      const getBookDuration = (b: Audiobook) => (b.chapters || []).reduce((s, c) => s + (c.duration || 0), 0);

      const groups: AllBooksNavGroup[] = [];

      orderedCategories.forEach(cat => {
        const groupBooks = filtered.filter(b => {
          const d = getBookDuration(b);
          return d >= cat.min && d < cat.max;
        }).sort((a, b) => {
          const dA = getBookDuration(a);
          const dB = getBookDuration(b);
          return sortBy === 'duration-desc' ? dB - dA : dA - dB;
        });

        if (groupBooks.length > 0) {
          groups.push({
            id: cat.id,
            title: cat.navLabel,
            navLabel: cat.navLabel,
            books: groupBooks,
          });
        }
      });

      return groups;
    }

    return [];
  }, [books, statusFilter, favoriteBookIds, isBookStarted, isBookCompleted, sortBy, resolvedLanguage, t]);

  // Sincroniza o primeiro item ativo da barra de navegação quando a tela abre ou os grupos mudam
  useEffect(() => {
    if (activeScreen.id === 'library-títulos' && allBooksNavGroups.length > 0) {
      if (!allBooksNavGroups.some(g => g.id === activeAllBooksNavId)) {
        setActiveAllBooksNavId(allBooksNavGroups[0].id);
      }
    }
  }, [activeScreen.id, allBooksNavGroups, activeAllBooksNavId]);

  // Scroll Spy: atualiza a seleção da barra de navegação conforme a rolagem da lista de audiobooks
  useEffect(() => {
    if (activeScreen.id !== 'library-títulos') return;
    const container = mainScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isManualScrollingRef.current) return;
      if (allBooksNavGroups.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const triggerY = containerRect.top + 160;

      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 30) {
        setActiveAllBooksNavId(allBooksNavGroups[allBooksNavGroups.length - 1].id);
        return;
      }

      let currentGroup = allBooksNavGroups[0].id;

      for (let i = 0; i < allBooksNavGroups.length; i++) {
        const g = allBooksNavGroups[i];
        const el = document.getElementById(`group-section-${g.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerY) {
            currentGroup = g.id;
          } else {
            break;
          }
        }
      }

      setActiveAllBooksNavId(prev => (prev !== currentGroup ? currentGroup : prev));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeScreen.id, allBooksNavGroups]);

  // Scroll suave ao clicar em um item da barra de navegação
  // instant: arrastando o dedo no índice, vai direto (a rolagem suave passava pelas letras do meio e o destaque piscava)
  const handleScrollToGroup = (groupId: string, instant = false) => {
    setActiveAllBooksNavId(groupId);
    const container = mainScrollRef.current;
    const target = document.getElementById(`group-section-${groupId}`);
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const targetScrollTop = container.scrollTop + (targetRect.top - containerRect.top) - 80;

    isManualScrollingRef.current = true;
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: instant ? 'auto' : 'smooth',
    });

    setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 600);
  };

  // Garante que o item ativo da barra de navegação permaneça visível verticalmente
  useEffect(() => {
    if (activeScreen.id !== 'library-títulos' || !activeAllBooksNavId) return;
    const navBtn = document.getElementById(`nav-item-${activeAllBooksNavId}`);
    if (navBtn) {
      navBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeAllBooksNavId, activeScreen.id]);
  
  const appStyle = {};


  const renderCommentsContent = (book: Audiobook, chapter: Chapter, isMiniplayer: boolean, showBackToOptions = !isMiniplayer, asScreen = false) => <BookmarksPanel book={book} chapter={chapter} isMiniplayer={isMiniplayer} showBackToOptions={showBackToOptions} asScreen={asScreen} />;


  // Mobile: os pop-ups dos controles abaixo do player nascem do próprio botão e ocupam a área da linha
  // de botões (crescendo para cima), por cima de tudo. Posição relativa ao botão (evita contêineres com transform).
  const fsRowPopupProps = (controlId: string): Record<string, any> => {
    if (!isMobile || typeof document === 'undefined') return {};
    const row = document.querySelector('[data-fs-ctrl-row]');
    const btn = document.querySelector(`[data-fs-ctrl="${controlId}"]`);
    if (!row || !btn) return {};
    const r = row.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const width = Math.min(vw - 32, Math.max(r.width, 320));
    const left = Math.max(16, Math.min(r.left + r.width / 2 - width / 2, vw - 16 - width));
    return {
      style: {
        position: 'absolute',
        left: left - b.left,
        right: 'auto',
        top: 'auto',
        bottom: b.bottom - r.bottom,
        width,
        maxHeight: Math.max(160, r.bottom - 24),
        zIndex: 9999,
        transformOrigin: `${b.left - left + b.width / 2}px bottom`,
      },
      originWidth: b.width,
      originHeight: b.height,
      originOffsetX: b.left - left,
      openUp: true,
      alignRight: false,
    };
  };

  const renderFullScreenHeaderControls = (group: 'all' | 'header' | 'row' = 'all') => <FullscreenPlayerControls group={group} />;

  const renderSecondaryControls = (isFullScreenMode: boolean) => <MiniPlayerControls isFullScreenMode={isFullScreenMode} />;

  const computedSearchResults = useMemo((): SearchItem[] => {
    const q = normalizeSearchStr(searchQuery);
    if (!q) return [];

    const qWords = q.split(/[\s:,\-_/().]+/).filter(Boolean);
    const qPhonetic = toPhoneticSearchStr(q);

    const getGenreTerms = (book: Audiobook): string[] => {
      const terms: string[] = [];
      if (book.category && normalizeSearchStr(book.category) !== 'desconhecido') {
        terms.push(
          book.category,
          getGenreName(book.category, resolvedLanguage),
          getGenreName(book.category, 'pt'),
          getGenreName(book.category, 'en')
        );
      }
      Object.values(GENRE_HIERARCHY).forEach(genre => {
        if (isBookInGenre(book, genre)) {
          terms.push(
            genre.name,
            getGenreName(genre.id, resolvedLanguage),
            getGenreName(genre.id, 'pt'),
            getGenreName(genre.id, 'en')
          );
        }
      });
      return Array.from(new Set(terms.filter(Boolean)));
    };

    const getSubgenreTerms = (book: Audiobook): string[] => {
      const terms: string[] = [];
      if (book.subgenre && normalizeSearchStr(book.subgenre) !== 'desconhecido') {
        terms.push(
          book.subgenre,
          getSubgenreName(book.subgenre, resolvedLanguage),
          getSubgenreName(book.subgenre, 'pt'),
          getSubgenreName(book.subgenre, 'en')
        );
      }
      Object.values(GENRE_HIERARCHY).forEach(genre => {
        genre.subgenres.forEach(sub => {
          if (isBookInSubgenre(book, genre, sub)) {
            terms.push(
              sub,
              getSubgenreName(sub, resolvedLanguage),
              getSubgenreName(sub, 'pt'),
              getSubgenreName(sub, 'en')
            );
          }
        });
      });
      return Array.from(new Set(terms.filter(Boolean)));
    };

    const getNationalityTerms = (rawNat?: string): string[] => {
      if (!rawNat || !rawNat.trim()) return [];
      const normNat = normalizeSearchStr(rawNat);
      if (normNat === 'desconhecido' || normNat === 'unknown') return [];

      const terms: string[] = [];
      const parts = rawNat.split(/[/,]/).map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        terms.push(
          part,
          getNationalityDisplayName(part, resolvedLanguage),
          getNationalityDisplayName(part, 'pt'),
          getNationalityDisplayName(part, 'en')
        );
        const entry = findNationalityEntry(part);
        if (entry && normalizeSearchStr(entry.countryPt) !== 'desconhecido') {
          terms.push(
            entry.countryPt,
            entry.pt,
            entry.en,
            entry.es,
            entry[resolvedLanguage],
            ...(entry.aliases || []).filter(a => a.length >= 3)
          );
        }
      }
      const expandedTerms: string[] = [];
      for (const t of terms) {
        if (!t) continue;
        expandedTerms.push(t);
        if (t.includes('(')) {
          const clean = t.replace(/\([^)]*\)/g, '').trim();
          if (clean) expandedTerms.push(clean);
        }
      }
      return Array.from(new Set(expandedTerms));
    };

    const getLanguageTerms = (book: Audiobook): string[] => {
      const { language: resolvedBookLang } = resolveNarratorAndLanguage(book);
      if (!resolvedBookLang) return [];
      const terms: string[] = [
        resolvedBookLang,
        getLanguageDisplayName(resolvedBookLang, resolvedLanguage),
        getLanguageDisplayName(resolvedBookLang, 'pt'),
        getLanguageDisplayName(resolvedBookLang, 'en'),
      ];
      const langEntry = findRecognizedLanguageEntry(resolvedBookLang);
      if (langEntry) {
        terms.push(
          langEntry.canonicalPt,
          langEntry.names[resolvedLanguage],
          langEntry.names.pt,
          langEntry.names.en,
          langEntry.names.es,
          ...langEntry.aliases.filter(a => a.length >= 4)
        );
      } else {
        terms.push('outro', 'outros', 'other', 'others');
      }
      return Array.from(new Set(terms.filter(Boolean)));
    };

    const evaluateGroups = (
      groups: { priority: number; terms: (string | undefined)[]; allowFuzzy?: boolean }[]
    ): { tier: number; fieldPriority: number; subScore: number } | null => {
      let best: { tier: number; fieldPriority: number; subScore: number } | null = null;

      for (const group of groups) {
        const allowFuzzy = group.allowFuzzy !== false;
        for (const term of group.terms) {
          const m = evaluateSearchTermMatch(term, q, qWords, qPhonetic);
          if (!m) continue;
          if (m.tier === 4 && !allowFuzzy) continue;

          if (
            !best ||
            m.tier < best.tier ||
            (m.tier === best.tier && group.priority < best.fieldPriority) ||
            (m.tier === best.tier && group.priority === best.fieldPriority && m.subScore < best.subScore)
          ) {
            best = {
              tier: m.tier,
              fieldPriority: group.priority,
              subScore: m.subScore,
            };
          }
        }
      }

      return best;
    };

    const results: SearchItem[] = [];

    // 1. Audiobooks
    books.forEach(book => {
      const authorObj = authors.find(
        a => a.id === book.authorId || (a.name || '').toLowerCase() === (book.author || '').toLowerCase()
      );
      const authorNat = authorObj?.nationality || '';
      const chapterTitles = (book.chapters || []).map(c => c.title);

      const bestMatch = evaluateGroups([
        { priority: 1, terms: [book.title] },
        { priority: 2, terms: [book.author, authorObj?.name] },
        { priority: 3, terms: getGenreTerms(book) },
        { priority: 4, terms: getSubgenreTerms(book) },
        { priority: 5, terms: getNationalityTerms(authorNat) },
        { priority: 6, terms: getLanguageTerms(book) },
        {
          priority: 7,
          terms: [`${book.title || ''} ${book.author || ''}`, ...chapterTitles, book.narrator, book.year],
          allowFuzzy: false,
        },
      ]);

      if (bestMatch) {
        results.push({
          id: `book-${book.id}`,
          type: 'book',
          tier: bestMatch.tier,
          fieldPriority: bestMatch.fieldPriority,
          subScore: bestMatch.subScore,
          score: bestMatch.tier * 100 + bestMatch.fieldPriority * 10 + bestMatch.subScore,
          title: book.title,
          book,
        });
      }
    });

    // 2. Authors
    authors.forEach(author => {
      const authorBooks = books.filter(
        b => bookHasAuthor(b, author)
      );

      const bestMatch = evaluateGroups([
        { priority: 1, terms: [author.name] },
        { priority: 2, terms: authorBooks.map(b => b.title) },
        { priority: 3, terms: authorBooks.flatMap(b => getGenreTerms(b)) },
        { priority: 4, terms: authorBooks.flatMap(b => getSubgenreTerms(b)) },
        { priority: 5, terms: getNationalityTerms(author.nationality) },
        { priority: 6, terms: authorBooks.flatMap(b => getLanguageTerms(b)) },
        { priority: 7, terms: [author.bio], allowFuzzy: false },
      ]);

      if (bestMatch) {
        results.push({
          id: `author-${author.id}`,
          type: 'author',
          tier: bestMatch.tier,
          fieldPriority: bestMatch.fieldPriority,
          subScore: bestMatch.subScore,
          score: bestMatch.tier * 100 + bestMatch.fieldPriority * 10 + bestMatch.subScore,
          title: author.name,
          author,
        });
      }
    });

    // 3. Capítulos (pelo título), marcações do usuário (pelo texto) e coleções (pelo nome)
    books.forEach(book => {
      (book.chapters || []).forEach(chapter => {
        const chapterMatch = evaluateGroups([{ priority: 1, terms: [chapter.title], allowFuzzy: false }]);
        if (chapterMatch) {
          results.push({
            id: `chapter-${book.id}-${chapter.id}`,
            type: 'chapter',
            tier: chapterMatch.tier,
            fieldPriority: chapterMatch.fieldPriority,
            subScore: chapterMatch.subScore,
            score: chapterMatch.tier * 100 + chapterMatch.fieldPriority * 10 + chapterMatch.subScore,
            title: chapter.title,
            book,
            chapter,
          });
        }
        const marks = ((chapter as any).bookmarks || (chapter as any).comments || []) as { id: string; text: string; timestamp?: number }[];
        marks.forEach(mark => {
          const markMatch = evaluateGroups([{ priority: 1, terms: [mark.text], allowFuzzy: false }]);
          if (!markMatch) return;
          results.push({
            id: `bookmark-${book.id}-${chapter.id}-${mark.id}`,
            type: 'bookmark',
            tier: markMatch.tier,
            fieldPriority: markMatch.fieldPriority,
            subScore: markMatch.subScore,
            score: markMatch.tier * 100 + markMatch.fieldPriority * 10 + markMatch.subScore,
            title: mark.text,
            book,
            chapter,
            bookmark: mark,
          });
        });
      });
    });
    collections.forEach(collection => {
      const colMatch = evaluateGroups([
        { priority: 1, terms: [collection.name] },
        { priority: 2, terms: [(collection as any).description], allowFuzzy: false },
      ]);
      if (colMatch) {
        results.push({
          id: `collection-${collection.id}`,
          type: 'collection',
          tier: colMatch.tier,
          fieldPriority: colMatch.fieldPriority,
          subScore: colMatch.subScore,
          score: colMatch.tier * 100 + colMatch.fieldPriority * 10 + colMatch.subScore,
          title: collection.name,
          collection,
        });
      }
    });

    // Ordem de prioridade:
    // 1. Posição da correspondência: começam pelas letras (1) -> meio das palavras (2) -> final das palavras (3) -> algo semelhante (4)
    // 2. Tipo: Audiobooks (1) sempre priorizados sobre Autores (2)
    // 3. Atributo correspondente (título/nome, gênero, subgênero, nacionalidade, idioma)
    // 4. Precisão interna dentro do tier (subScore) e ordem alfabética
    const typePriority: Record<string, number> = {
      book: 1,
      author: 2,
      collection: 3,
      chapter: 4,
      bookmark: 5,
    };

    results.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      const pA = typePriority[a.type] || 99;
      const pB = typePriority[b.type] || 99;
      if (pA !== pB) return pA - pB;
      if (a.fieldPriority !== b.fieldPriority) return a.fieldPriority - b.fieldPriority;
      if (a.subScore !== b.subScore) return a.subScore - b.subScore;
      return a.title.localeCompare(b.title);
    });

    return results;
  }, [searchQuery, books, authors, collections, resolvedLanguage, availableLanguages]);
  return { allBooksNavGroups, appStyle, computedSearchResults, filteredBooks, fsRowPopupProps, getCollectionItems, handleScrollToGroup, homeSections, isPlayerVisible, matchesBookSearch, renderCollectionAuthorCard, renderCollectionBookCard, renderCommentsContent, renderFullScreenHeaderControls, renderSecondaryControls, sortBooks, sortedAuthors, sortedCollections, sortedGenres, sortedLanguages };
}
