// Extraído do App.tsx: lê do App, pelo contexto, só o que usa
import { resolveNarratorAndLanguage } from '../data/catalog';
import { BookOpen, Calendar, Clock, Database, FileAudio, FileText, FolderOpen, HardDrive, User } from 'lucide-react';
import { IS_INSTALLED_APP } from '../lib/desktopBridge';
import { motion } from 'motion/react';
import { useAppScope } from '../app/AppScope';

export function BookDetailsContent() {
  const { activeScreen, books, handleOpenBookInFolder, libraryFolder, selectedBook, t } = useAppScope();
  return (
    <>
                                        <div className="px-1 py-1 mb-2">
                                          <span className="text-sm font-bold text-[var(--text-main)]">{t('more_details')}</span>
                                        </div>

                                        {(() => {
                                          const activeBk = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
                                          if (!activeBk) return null;
                                          const { narrator, language } = resolveNarratorAndLanguage(activeBk);
                                          const genreParts: string[] = [];
                                          if (activeBk.category && activeBk.category !== 'Desconhecido') genreParts.push(activeBk.category);
                                          if (activeBk.subgenre && activeBk.subgenre !== 'Desconhecido' && (!activeBk.category || activeBk.subgenre.toLowerCase() !== activeBk.category.toLowerCase())) {
                                            genreParts.push(activeBk.subgenre);
                                          }
                                          const genreDisplay = genreParts.join(', ');

                                          return (
                                            <div className="space-y-3 px-1 py-1">
                                              {/* Gênero e Subgênero */}
                                              {genreDisplay && (
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <BookOpen size={13} className="text-[var(--text-muted)] shrink-0" />
                                                    <span className="text-xs text-[var(--text-muted)] font-medium">{t('genres')}</span>
                                                  </div>
                                                  <span className="text-xs font-semibold text-[var(--text-main)] text-right truncate max-w-[190px]">{genreDisplay}</span>
                                                </div>
                                              )}

                                              {/* Narrador */}
                                              {narrator && (
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <User size={13} className="text-[var(--text-muted)] shrink-0" />
                                                    <span className="text-xs text-[var(--text-muted)] font-medium">{t('narrated_by')}</span>
                                                  </div>
                                                  <span className="text-xs font-semibold text-[var(--text-main)] text-right truncate max-w-[190px]">{narrator}</span>
                                                </div>
                                              )}

                                              {/* Idioma */}
                                              {language && (
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <FileText size={13} className="text-[var(--text-muted)] shrink-0" />
                                                    <span className="text-xs text-[var(--text-muted)] font-medium">{t('language_label')}</span>
                                                  </div>
                                                  <span className="text-xs font-semibold text-[var(--text-main)]">{language}</span>
                                                </div>
                                              )}

                                              {/* Ano */}
                                              {activeBk.year && (
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Calendar size={13} className="text-[var(--text-muted)] shrink-0" />
                                                    <span className="text-xs text-[var(--text-muted)] font-medium">{t('year')}</span>
                                                  </div>
                                                  <span className="text-xs font-bold text-[var(--text-main)]">{activeBk.year}</span>
                                                </div>
                                              )}

                                              {/* Duração */}
                                              {activeBk.durationEst && (
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Clock size={13} className="text-[var(--text-muted)] shrink-0" />
                                                    <span className="text-xs text-[var(--text-muted)] font-medium">{t('duration')}</span>
                                                  </div>
                                                  <span className="text-xs font-bold text-[var(--text-main)]">{activeBk.durationEst}</span>
                                                </div>
                                              )}

                                              {/* Tamanho */}
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <Database size={13} className="text-[var(--text-muted)] shrink-0" />
                                                  <span className="text-xs text-[var(--text-muted)] font-medium">{t('size')}</span>
                                                </div>
                                                <span className="text-xs font-bold text-[var(--text-main)]">{activeBk.sizeStr || "428 MB"}</span>
                                              </div>

                                              {/* Formato */}
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <FileAudio size={13} className="text-[var(--text-muted)] shrink-0" />
                                                  <span className="text-xs text-[var(--text-muted)] font-medium">{t('format')}</span>
                                                </div>
                                                {(() => {
                                                  const ext = (activeBk.fileName || activeBk.filePath || '').split('.').pop()?.toUpperCase();
                                                  const formatLabel = (ext && ext.length <= 4) ? `${ext} Áudio` : 'M4B (AAC Áudio)';
                                                  return <span className="text-xs font-bold text-[var(--text-main)]">{formatLabel}</span>;
                                                })()}
                                              </div>

                                              {/* Local onde está armazenado e botão Ver na pasta */}
                                              {(() => {
                                                let bookStoragePath = activeBk.filePath || (activeBk.fileName ? `${libraryFolder}\\${activeBk.fileName}` : `${libraryFolder}\\${activeBk.title}.m4b`);
                                                if (bookStoragePath.startsWith('D:\\') || bookStoragePath.startsWith('D:/')) {
                                                  const parts = bookStoragePath.split(/[\\/]/);
                                                  bookStoragePath = `${libraryFolder}\\${parts[parts.length - 1]}`;
                                                }

                                                return (
                                                  <div className="flex flex-col gap-2 pt-1">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                          <HardDrive size={13} className="text-[var(--text-muted)] shrink-0" />
                                                          <span className="text-xs text-[var(--text-muted)] font-medium block">{t('storage_location')}</span>
                                                        </div>
                                                        <p className="text-[11px] text-[var(--text-main)] truncate" title={bookStoragePath}>
                                                          {bookStoragePath}
                                                        </p>
                                                      </div>
                                                      {IS_INSTALLED_APP && (<motion.button
                                                        data-press="true"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleOpenBookInFolder(activeBk);
                                                        }}
                                                        className="shrink-0 h-8 px-3.5 rounded-full bg-card/75 backdrop-blur-3xl shadow-sm text-[var(--text-main)] hover:bg-[var(--hover-fill)] flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
                                                        title={t('view_in_folder')}
                                                      >
                                                        <FolderOpen size={13} />
                                                        <span>{t('view_in_folder')}</span>
                                                      </motion.button>)}
                                                    </div>
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          );
                                        })()}
                                        </>
  );
}
