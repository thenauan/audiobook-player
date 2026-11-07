// Extraído do App.tsx: lê do App, pelo contexto, só o que usa
import { Audiobook, Chapter } from '../data/catalog';
import { AnimatePresence, motion } from 'motion/react';
import { Bookmark, Check, ChevronLeft, Edit3, Play, Trash2, X } from 'lucide-react';
import { SmoothSubMorph } from './popups/Popovers';
import { FADE_IN, SPRING } from '../lib/motion';
import { useAppScope } from '../app/AppScope';

export function BookmarksPanel({ book, chapter, isMiniplayer, showBackToOptions = !isMiniplayer, asScreen = false }: { book: Audiobook; chapter: Chapter; isMiniplayer: boolean; showBackToOptions?: any; asScreen?: any }) {
  const { addingCommentText, books, currentBook, currentChapter, currentTime, deletingCommentId, editingCommentId, editingCommentText, formatTime, handleJumpToComment, isAddingComment, isChapterCompleted, isMobile, isTouchDevice, setActiveChapterMenuMode, setAddingCommentText, setBooks, setCurrentBook, setDeletingCommentId, setEditingCommentId, setEditingCommentText, setIsAddingComment, setMobileConfirm, setSelectedBook, showToast, t } = useAppScope();
  const liveBook = books.find(b => b.id === book.id) || book;
  const liveChapter = liveBook.chapters?.find(c => c.id === chapter.id) || chapter;
  const chapComments = liveChapter.bookmarks || liveChapter.comments || [];
  const isChapCompleted = isChapterCompleted(liveBook.id, liveChapter.id);
  const handleSaveComment = () => {
    if (!addingCommentText.trim()) {
      setIsAddingComment(false);
      return;
    }
    const calculatedTimestamp = (isMiniplayer || (currentBook?.id === liveBook.id && currentChapter?.id === liveChapter.id))
      ? Math.max(0, Math.floor(currentTime - liveChapter.startTime))
      : 0;
    const newComment: any = {
      id: Math.random().toString(36).substring(2, 9),
      text: addingCommentText.trim(),
      timestamp: calculatedTimestamp,
      createdAt: Date.now()
    };

    setBooks(prevBooks => prevBooks.map(b => {
      if (b.id === liveBook.id) {
        return {
          ...b,
          chapters: b.chapters.map(c => {
            if (c.id === liveChapter.id) {
              const updatedList = [...(c.bookmarks || c.comments || []), newComment];
              return { ...c, comments: updatedList, bookmarks: updatedList };
            }
            return c;
          })
        };
      }
      return b;
    }));
    setCurrentBook(prev => {
      if (prev.id === liveBook.id) {
        return {
          ...prev,
          chapters: prev.chapters.map(c => {
            if (c.id === liveChapter.id) {
              const updatedList = [...(c.bookmarks || c.comments || []), newComment];
              return { ...c, comments: updatedList, bookmarks: updatedList };
            }
            return c;
          })
        };
      }
      return prev;
    });
    setSelectedBook(prev => {
      if (prev?.id === liveBook.id) {
        return {
          ...prev,
          chapters: prev.chapters.map(c => {
            if (c.id === liveChapter.id) {
              const updatedList = [...(c.bookmarks || c.comments || []), newComment];
              return { ...c, comments: updatedList, bookmarks: updatedList };
            }
            return c;
          })
        };
      }
      return prev;
    });
    setAddingCommentText('');
    setIsAddingComment(false);
    showToast(t('toast_bookmark_saved') || t('toast_comment_saved'));
  };
  const handleSaveEditComment = (id: string) => {
    if (!editingCommentText.trim()) {
      setEditingCommentId(null);
      return;
    }
    setBooks(prevBooks => prevBooks.map(b => {
      if (b.id === liveBook.id) {
        return {
          ...b,
          chapters: b.chapters.map(c => {
            if (c.id === liveChapter.id) {
              const updatedList = (c.bookmarks || c.comments || []).map(com => com.id === id ? { ...com, text: editingCommentText.trim() } : com);
              return { ...c, comments: updatedList, bookmarks: updatedList };
            }
            return c;
          })
        };
      }
      return b;
    }));
    setCurrentBook(prev => {
      if (prev.id === liveBook.id) {
        return {
          ...prev,
          chapters: prev.chapters.map(c => {
            if (c.id === liveChapter.id) {
              const updatedList = (c.bookmarks || c.comments || []).map(com => com.id === id ? { ...com, text: editingCommentText.trim() } : com);
              return { ...c, comments: updatedList, bookmarks: updatedList };
            }
            return c;
          })
        };
      }
      return prev;
    });
    setSelectedBook(prev => {
      if (prev?.id === liveBook.id) {
        return {
          ...prev,
          chapters: prev.chapters.map(c => {
            if (c.id === liveChapter.id) {
              const updatedList = (c.bookmarks || c.comments || []).map(com => com.id === id ? { ...com, text: editingCommentText.trim() } : com);
              return { ...c, comments: updatedList, bookmarks: updatedList };
            }
            return c;
          })
        };
      }
      return prev;
    });
    setEditingCommentId(null);
    setEditingCommentText('');
    showToast(t('toast_bookmark_updated') || t('toast_comment_updated'));
  };
  const handleDeleteComment = (id: string) => {
    setBooks(prevBooks => prevBooks.map(b => {
      if (b.id === liveBook.id) {
        return {
          ...b,
          chapters: b.chapters.map(c => {
            if (c.id === liveChapter.id) {
              const updatedList = (c.bookmarks || c.comments || []).filter(com => com.id !== id);
              return { ...c, comments: updatedList, bookmarks: updatedList };
            }
            return c;
          })
        };
      }
      return b;
    }));
    setCurrentBook(prev => {
      if (prev.id === liveBook.id) {
        return {
          ...prev,
          chapters: prev.chapters.map(c => {
            if (c.id === liveChapter.id) {
              const updatedList = (c.bookmarks || c.comments || []).filter(com => com.id !== id);
              return { ...c, comments: updatedList, bookmarks: updatedList };
            }
            return c;
          })
        };
      }
      return prev;
    });
    setSelectedBook(prev => {
      if (prev?.id === liveBook.id) {
        return {
          ...prev,
          chapters: prev.chapters.map(c => {
            if (c.id === liveChapter.id) {
              const updatedList = (c.bookmarks || c.comments || []).filter(com => com.id !== id);
              return { ...c, comments: updatedList, bookmarks: updatedList };
            }
            return c;
          })
        };
      }
      return prev;
    });
    setDeletingCommentId(null);
    showToast(t('toast_bookmark_deleted') || t('toast_comment_deleted'));
  };
  return (
    <div className={asScreen ? "bookmarks-screen flex flex-col w-full" : "flex flex-col overflow-hidden max-h-[380px] w-full"}>
      {!asScreen && <div className="px-3.5 pt-3 pb-1 flex items-center gap-2.5 shrink-0">
        {showBackToOptions && !isMobile && (
          <motion.button
            data-press="true"
            onClick={(e) => {
              e.stopPropagation();
              setActiveChapterMenuMode('options');
            }}
            className="h-7 px-2.5 rounded-full bg-card/75 flex items-center gap-1.5 text-[var(--text-main)] hover:bg-[var(--hover-fill)] transition-all shrink-0 cursor-pointer text-xs font-semibold"
            title={t('more_options')}
          >
            <ChevronLeft size={14} className="rtl:rotate-180" />
            <span>{t('more_options')}</span>
          </motion.button>
        )}
        <h4 className="text-sm font-bold text-[var(--text-main)] truncate">{t('bookmarks') || t('comments')}</h4>
      </div>}

      <div className={asScreen ? "flex flex-col" : "flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-3.5 pt-1 pb-3.5 flex flex-col"}>
        {/* Adicionar Marcação Block */}
        <SmoothSubMorph
          activeKey={
            isAddingComment
              ? 'adding-comment-form'
              : chapComments.length === 0
                ? 'add-comment-empty'
                : 'add-comment-btn'
          }
          direction={isAddingComment ? 1 : -1}
        >
          {!isAddingComment ? (
            <div className="flex flex-col py-1.5 px-1">
              <motion.button 
                onClick={(e) => { e.stopPropagation(); setIsAddingComment(true); setAddingCommentText(''); }}
                className="w-full h-11 border border-dashed border-[var(--text-main)]/20 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-white hover:border-white/35 hover:bg-[var(--hover-fill)] transition-[background-color,border-color,color,box-shadow]"
              >
                <Bookmark size={15} />
                <span>{t('add_bookmark') || t('add_comment')}</span>
              </motion.button>
              {chapComments.length === 0 && (
                <div className="pt-3 py-6 text-center text-[var(--text-muted)] text-xs">
                  {t('no_bookmarks_yet') || t('no_comments_yet')}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card/90 p-3.5 rounded-2xl flex flex-col gap-2 mx-0.5 my-1" onClick={e => e.stopPropagation()}>
              <textarea 
                value={addingCommentText}
                onChange={(e) => {
                  if (e.target.value.length <= 500) setAddingCommentText(e.target.value);
                }}
                className="w-full bg-transparent border-none outline-none text-xs text-[var(--text-main)] resize-none h-20 placeholder:text-[var(--text-muted)]/50"
                placeholder={t('write_bookmark_placeholder') || t('write_comment_placeholder')}
                autoFocus
              />
              <div className="flex items-center justify-between pt-2 pb-1 px-1">
                <span className="text-[10px] text-[var(--text-muted)]">
                  {addingCommentText.length}/500
                </span>
                <div className="flex items-center gap-2.5">
                  <motion.button 
                    data-press="true" 
                    onClick={() => { setIsAddingComment(false); setAddingCommentText(''); }} 
                    className="h-7 px-3 rounded-full bg-card/75 shadow-sm text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--hover-fill)] hover:text-white flex items-center gap-1 transition-[background-color,border-color,color,box-shadow]"
                  >
                    <X size={12} />
                    <span>{t('cancel')}</span>
                  </motion.button>
                  <motion.button 
                    data-press="true" 
                    onClick={handleSaveComment} 
                    className="h-7 px-3 rounded-full bg-card/75 shadow-sm text-xs font-semibold text-winblue hover:bg-winblue/15 flex items-center gap-1 transition-[background-color,border-color,color,box-shadow]"
                  >
                    <Check size={12} />
                    <span>{t('done')}</span>
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </SmoothSubMorph>

        {/* Lista de Marcações */}
        <AnimatePresence initial={false}>
          {chapComments.map((com: any) => {
            const isEditing = editingCommentId === com.id;
            const isDeleting = deletingCommentId === com.id;
            const commentModeKey = isEditing ? 'edit' : isDeleting ? 'delete' : 'view';
            const commentDir: 1 | -1 = isEditing || isDeleting ? 1 : -1;

            let timeStr = '';
            if (com.timestamp !== undefined && com.timestamp >= 0) {
              timeStr = formatTime(com.timestamp);
            } else {
              timeStr = isChapCompleted ? t('comment_after_listening') : t('comment_before_listening');
            }

            return (
              <motion.div
                key={com.id}
                initial={{ opacity: 0, height: 0, scale: 0.96 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.96 }}
                transition={{
                  height: SPRING.snappy,
                  opacity: FADE_IN,
                  scale: SPRING.snappy,
                }}
                className="overflow-visible shrink-0"
                onClick={e => e.stopPropagation()}
              >
                <div className="pt-3 px-0.5">
                  <div className="relative group bg-card/60 p-3.5 rounded-2xl shadow-sm transition-colors overflow-visible">
                    <SmoothSubMorph activeKey={commentModeKey} direction={commentDir}>
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <textarea 
                            value={editingCommentText}
                            onChange={(e) => {
                              if (e.target.value.length <= 500) setEditingCommentText(e.target.value);
                            }}
                            className="w-full bg-transparent border-none outline-none text-xs text-[var(--text-main)] resize-none h-20"
                            autoFocus
                          />
                          <div className="flex items-center justify-between pt-2 pb-1 px-1">
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {editingCommentText.length}/500
                            </span>
                            <div className="flex items-center gap-2.5">
                              <motion.button 
                                data-press="true" 
                                onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }} 
                                className="h-7 px-3 rounded-full bg-card/75 shadow-sm text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--hover-fill)] hover:text-white flex items-center gap-1 transition-[background-color,border-color,color,box-shadow]"
                              >
                                <X size={12} />
                                <span>{t('cancel')}</span>
                              </motion.button>
                              <motion.button 
                                data-press="true" 
                                onClick={() => handleSaveEditComment(com.id)} 
                                className="h-7 px-3 rounded-full bg-card/75 shadow-sm text-xs font-semibold text-winblue hover:bg-winblue/15 flex items-center gap-1 transition-[background-color,border-color,color,box-shadow]"
                              >
                                <Check size={12} />
                                <span>{t('save')}</span>
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      ) : isDeleting ? (
                        <div className="flex flex-col items-center justify-center py-2.5 px-1 gap-3">
                          <span className="text-sm font-bold text-[var(--text-main)]">{t('confirm_delete_bookmark') || t('confirm_delete_comment')}</span>
                          <div className="flex items-center gap-3 py-1 px-2">
                            <motion.button 
                              data-press="true" 
                              onClick={() => handleDeleteComment(com.id)} 
                              className="h-8 px-4 rounded-full bg-card/75 shadow-sm hover:bg-red-500/20 text-red-500 transition-[background-color,border-color,color,box-shadow] font-semibold text-xs flex items-center gap-1.5"
                            >
                              <Trash2 size={13} />
                              <span>{t('delete')}</span>
                            </motion.button>
                            <motion.button 
                              data-press="true" 
                              onClick={() => setDeletingCommentId(null)} 
                              className="h-8 px-4 rounded-full bg-card/75 shadow-sm hover:bg-[var(--hover-fill)] hover:text-white text-[var(--text-main)] transition-[background-color,border-color,color,box-shadow] font-semibold text-xs flex items-center gap-1.5"
                            >
                              <X size={13} />
                              <span>{t('cancel')}</span>
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            {com.timestamp !== undefined && com.timestamp >= 0 ? (
                              <motion.button
                                type="button"
                                data-press="true"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJumpToComment(liveBook, liveChapter, com.timestamp);
                                }}
                                className="h-6 px-2.5 rounded-full bg-winblue/15 hover:bg-winblue/25 text-winblue hover:text-winblue shadow-sm flex items-center gap-1.5 text-[10px] font-bold transition-all cursor-pointer group/timebtn"
                                title={t('jump_to_timestamp')}
                              >
                                <Play size={10} className="fill-current text-winblue group-hover/timebtn:scale-110 transition-transform" />
                                <span>{timeStr}</span>
                              </motion.button>
                            ) : (
                              <span className="text-[10px] font-bold text-winblue bg-winblue/10 px-2 py-0.5 rounded-full">{timeStr}</span>
                            )}

                            {/* Botoes redondos de editar e excluir com destaque, contorno, sombra, crescer e brilhar */}
                            <div className="flex items-center gap-2 py-1 px-1.5 -my-0.5 -mr-0.5">
                              <motion.button 
                                data-press="true"
                                onClick={() => { setDeletingCommentId(null); setEditingCommentId(com.id); setEditingCommentText(com.text); }} 
                                className="w-7 h-7 rounded-full bg-card/75 shadow-sm flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--hover-fill)] hover:text-white transition-[background-color,border-color,color,box-shadow]"
                                title={t('edit_bookmark') || t('edit_comment')}
                              >
                                <Edit3 size={12} />
                              </motion.button>
                              <motion.button 
                                data-press="true"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  if (isMobile || isTouchDevice) {
                                    setMobileConfirm({
                                      title: t('confirm_delete_bookmark') || t('confirm_delete_comment'),
                                      description: com.text,
                                      confirmLabel: t('delete'),
                                      onConfirm: () => handleDeleteComment(com.id),
                                    });
                                    return;
                                  }
                                  setDeletingCommentId(com.id);
                                }}  
                                className="w-7 h-7 rounded-full bg-card/75 shadow-sm flex items-center justify-center text-red-500 hover:bg-red-500/15 transition-[background-color,border-color,color,box-shadow]"
                                title={t('delete_bookmark') || t('delete_comment')}
                              >
                                <Trash2 size={12} />
                              </motion.button>
                            </div>
                          </div>
                          <p className="text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-wrap pr-1">{com.text}</p>
                        </div>
                      )}
                    </SmoothSubMorph>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
