// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { Suspense } from 'react';
import BookDetailView from '../BookDetailView';
import { getBackdropProps } from '../../components/popups/popupUtils';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function BookDetailScreen() {
  const { activeChapterCommentsPopupId, activeChapterMenuId, activeChapterMenuMode, activeScreen, bookCropImage, books, chapterCommentsPopupOpenUp, chapterMenuOpenUp, closeAllPopups, completedChapters, currentBook, currentChapter, editBookAuthor, editBookCategory, editBookChapters, editBookCover, editBookDescription, editBookLanguage, editBookNarrator, editBookSubgenre, editBookTextInputRef, editBookTitle, editBookTranscript, editBookTranscriptFileName, editBookTranscriptSource, editCoverColor, favoriteBookIds, favoriteChapters, formatTime, getCustomCoverColor, handleAddChapterToQueue, handleAddToQueue, handleBookCoverError, handlePlayBookFromStart, handleSelectAuthor, handleSynopsisRef, handleUploadTranscriptForEditBook, isBookCompleted, isBookStarted, isChapterCompleted, isChapterStarted, isEditingBook, isPlaying, isSynopsisTruncated, navigateTo, openMobileSheet, renderCommentsContent, resolvedLanguage, resolvedTheme, selectedBook, setActiveChapterCommentsPopupId, setActiveChapterMenuId, setActiveChapterMenuMode, setBookCropImage, setChapterCommentsPopupOpenUp, setChapterMenuOpenUp, setCompletedChapters, setEditBookAuthor, setEditBookCategory, setEditBookChapters, setEditBookCover, setEditBookDescription, setEditBookLanguage, setEditBookNarrator, setEditBookSubgenre, setEditBookTitle, setEditBookTranscript, setEditBookTranscriptFileName, setEditBookTranscriptSource, setEditCoverColor, setFavoriteChapters, setIsPlaying, setStartedChapters, showToast, startedChapters, synopsisFullTextRef, toggleFavoriteChapter, useFullScreenSheets } = useScreenScope();
  return (
    <Suspense fallback={
      <div className="w-full min-h-[320px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-winblue border-t-transparent animate-spin" />
      </div>
    }>
      <BookDetailView
        onOpenBookmarks={useFullScreenSheets ? (b, c) => openMobileSheet({ kind: 'bookmarks', bookId: b.id, chapterId: c.id }) : undefined}
        activeBook={books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook}
        books={books}
        currentBook={currentBook}
        currentChapter={currentChapter}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        favoriteBookIds={favoriteBookIds}
        favoriteChapters={favoriteChapters}
        setFavoriteChapters={setFavoriteChapters}
        completedChapters={completedChapters}
        setCompletedChapters={setCompletedChapters}
        startedChapters={startedChapters}
        setStartedChapters={setStartedChapters}
        isBookCompleted={isBookCompleted}
        isBookStarted={isBookStarted}
        isChapterCompleted={isChapterCompleted}
        isChapterStarted={isChapterStarted}
        handleSelectAuthor={handleSelectAuthor}
        handlePlayBookFromStart={handlePlayBookFromStart}
        handleBookCoverError={handleBookCoverError}
        handleAddToQueue={handleAddToQueue}
        formatTime={formatTime}
        showToast={showToast}
        navigateTo={navigateTo}
        transicaoConteudo={transicaoConteudo}
        resolvedTheme={resolvedTheme}
        resolvedLanguage={resolvedLanguage}
        getCustomCoverColor={getCustomCoverColor}
        isEditingBook={isEditingBook}
        editBookCover={editBookCover}
        setEditBookCover={setEditBookCover}
        bookCropImage={bookCropImage}
        setBookCropImage={setBookCropImage}
        editCoverColor={editCoverColor}
        setEditCoverColor={setEditCoverColor}
        editBookTitle={editBookTitle}
        setEditBookTitle={setEditBookTitle}
        editBookAuthor={editBookAuthor}
        setEditBookAuthor={setEditBookAuthor}
        editBookCategory={editBookCategory}
        setEditBookCategory={setEditBookCategory}
        editBookSubgenre={editBookSubgenre}
        setEditBookSubgenre={setEditBookSubgenre}
        editBookDescription={editBookDescription}
        setEditBookDescription={setEditBookDescription}
        editBookNarrator={editBookNarrator}
        setEditBookNarrator={setEditBookNarrator}
        editBookLanguage={editBookLanguage}
        setEditBookLanguage={setEditBookLanguage}
        editBookChapters={editBookChapters}
        setEditBookChapters={setEditBookChapters}
        editBookTranscript={editBookTranscript}
        setEditBookTranscript={setEditBookTranscript}
        editBookTranscriptSource={editBookTranscriptSource}
        setEditBookTranscriptSource={setEditBookTranscriptSource}
        editBookTranscriptFileName={editBookTranscriptFileName}
        setEditBookTranscriptFileName={setEditBookTranscriptFileName}
        editBookTextInputRef={editBookTextInputRef}
        handleUploadTranscriptForEditBook={handleUploadTranscriptForEditBook}
        activeChapterMenuId={activeChapterMenuId}
        setActiveChapterMenuId={setActiveChapterMenuId}
        activeChapterMenuMode={activeChapterMenuMode}
        setActiveChapterMenuMode={setActiveChapterMenuMode}
        chapterMenuOpenUp={chapterMenuOpenUp}
        setChapterMenuOpenUp={setChapterMenuOpenUp}
        activeChapterCommentsPopupId={activeChapterCommentsPopupId}
        setActiveChapterCommentsPopupId={setActiveChapterCommentsPopupId}
        chapterCommentsPopupOpenUp={chapterCommentsPopupOpenUp}
        setChapterCommentsPopupOpenUp={setChapterCommentsPopupOpenUp}
        closeAllPopups={closeAllPopups}
        renderCommentsContent={renderCommentsContent}
        getBackdropProps={getBackdropProps}
        toggleFavoriteChapter={toggleFavoriteChapter}
        handleAddChapterToQueue={handleAddChapterToQueue}
        isSynopsisTruncated={isSynopsisTruncated}
        handleSynopsisRef={handleSynopsisRef}
        synopsisFullTextRef={synopsisFullTextRef}
      />
    </Suspense>
  );
}
