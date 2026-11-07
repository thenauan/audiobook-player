// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { AnimatePresence, motion } from 'motion/react';
import { MorphPopup, morphTriggerAnimate } from '../../components/popups/Popovers';
import { Clock, Search, Trash2, X } from 'lucide-react';
import { MobileConfirmCard } from '../../components/popups/MobileConfirm';
import { getBackdropProps } from '../../components/popups/popupUtils';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function SearchScreen() {
  const { closeAllPopups, isMobile, searchHistory, searchInputRef, searchQuery, setMobileSearchSlot, setSearchHistory, setSearchQuery, setShowDeleteSearchHistoryConfirm, showDeleteSearchHistoryConfirm, showToast, t } = useScreenScope();
  return (
                <motion.div 
                  key="screen-search" 
                  variants={transicaoConteudo} 
                  initial="escondido" 
                  animate="visivel" 
                  exit="saindo" 
                  className="space-y-6"
                >
                  {isMobile && searchQuery.length > 0 && (
                    <div ref={setMobileSearchSlot} data-popup-content="true" data-search-slot="true" className="w-full" />
                  )}
                  <div className={isMobile && searchQuery.length > 0 ? 'hidden' : ''}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-[var(--text-main)]">{t('search_last')}</h2>
                      {searchHistory.length > 0 && (
                        <div className={`relative w-11 h-11 shrink-0 ${showDeleteSearchHistoryConfirm ? 'z-50' : 'z-10'}`}>
                          <motion.button
                            key="btn-clear-history"
                            data-press="true"
                            animate={morphTriggerAnimate(showDeleteSearchHistoryConfirm)}
                            title={t('clear_search_history')}
                            onClick={(e) => {
                              e.stopPropagation();
                              closeAllPopups();
                              setShowDeleteSearchHistoryConfirm(true);
                            }}
                            className="w-11 h-11 flex items-center justify-center rounded-full bg-card/75 shadow-xl hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl shrink-0"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                          <AnimatePresence>
                            {showDeleteSearchHistoryConfirm && (
                              isMobile ? (
    <MobileConfirmCard key="history-confirm" onClose={() => setShowDeleteSearchHistoryConfirm(false)}>
                                  <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1.5">
                                    {t('clear_search_history_confirm_title')}
                                  </h4>
                                  <p className="text-xs text-[var(--text-muted)] px-1 mb-4">
                                    {t('clear_search_history_confirm_desc')}
                                  </p>

                                  <div className="flex items-center justify-end gap-2.5 pt-1">
                                    <motion.button
                                      data-press="true"
                                      onClick={() => {
                                        setSearchHistory([]);
                                        try {
                                          localStorage.removeItem('app_search_history');
                                        } catch {}
                                        setShowDeleteSearchHistoryConfirm(false);
                                        showToast(t('search_history_cleared'));
                                      }}
                                      className="h-8 px-4 rounded-full bg-card/75 shadow-md hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                    >
                                      <Trash2 size={13} />
                                      <span>{t('delete')}</span>
                                    </motion.button>
                                    <motion.button
                                      data-press="true"
                                      onClick={() => setShowDeleteSearchHistoryConfirm(false)}
                                      className="h-8 px-4 rounded-full bg-card/75 shadow-sm hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                    >
                                      <X size={13} />
                                      <span>{t('cancel')}</span>
                                    </motion.button>
                                  </div>
                                </MobileConfirmCard>
    ) : (<>
                                <div 
                                  className="fixed inset-0 z-40 cursor-default" 
                                  {...getBackdropProps(() => setShowDeleteSearchHistoryConfirm(false))} 
                                />
                                <MorphPopup originWidth={44} originHeight={44}
                                  key="popup-clear-history"
                                  data-popup-content="true"
                                  style={{ transformOrigin: "top right" }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute top-0 right-0 w-80 sm:w-96 bg-card/95 backdrop-blur-3xl rounded-[28px] shadow-2xl p-4 z-50 flex flex-col text-[var(--text-main)]"
                                >
                                  <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1.5">
                                    {t('clear_search_history_confirm_title')}
                                  </h4>
                                  <p className="text-xs text-[var(--text-muted)] px-1 mb-4">
                                    {t('clear_search_history_confirm_desc')}
                                  </p>

                                  <div className="flex items-center justify-end gap-2.5 pt-1">
                                    <motion.button
                                      data-press="true"
                                      onClick={() => {
                                        setSearchHistory([]);
                                        try {
                                          localStorage.removeItem('app_search_history');
                                        } catch {}
                                        setShowDeleteSearchHistoryConfirm(false);
                                        showToast(t('search_history_cleared'));
                                      }}
                                      className="h-8 px-4 rounded-full bg-card/75 shadow-md hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                    >
                                      <Trash2 size={13} />
                                      <span>{t('delete')}</span>
                                    </motion.button>
                                    <motion.button
                                      data-press="true"
                                      onClick={() => setShowDeleteSearchHistoryConfirm(false)}
                                      className="h-8 px-4 rounded-full bg-card/75 shadow-sm hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                                    >
                                      <X size={13} />
                                      <span>{t('cancel')}</span>
                                    </motion.button>
                                  </div>
                                </MorphPopup>
                              </>)
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {searchHistory.length === 0 ? (
                      <div className="py-16 flex flex-col items-center justify-center text-center">
                        <Clock size={36} className="text-[var(--text-muted)] opacity-35 mb-3" />
                        <p className="text-sm font-medium text-[var(--text-muted)]">{t('no_recent_searches')}</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 w-full">
                        {searchHistory.map((term, index) => (
                          <div
                            key={`${term}-${index}`}
                            onClick={() => {
                              setSearchQuery(term);
                              searchInputRef.current?.focus();
                            }}
                            className="group flex items-center justify-between h-[52px] pl-[18px] pr-5 rounded-full hover:bg-[var(--button-secondary-bg)]/50 cursor-pointer transition-all w-full select-none"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                                <Clock size={16} className="text-[var(--text-muted)] group-hover:hidden transition-colors" />
                                <div className="hidden group-hover:flex items-center justify-center relative">
                                  <div className="absolute w-4 h-4 bg-white/70 blur-[6px] rounded-full pointer-events-none" />
                                  <Search size={16} className="relative z-10 text-white " />
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-[var(--text-main)] transition-colors truncate">{term}</span>
                            </div>
                            <div className="text-xs text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity select-none shrink-0 pointer-events-none pr-1 font-medium">
                              <span>{t('tap_to_search') || 'Toque para pesquisar'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
  );
}
