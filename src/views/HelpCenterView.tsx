import { useIsMobile } from '../components/MobileContextMenu';
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  RiApps2Line,
} from 'react-icons/ri';
import {
  BookOpen,
  Headphones,
  Bookmark,
  Search,
  Sliders,
  Keyboard,
  HelpCircle,
  Download,
  FolderTree,
  Edit3,
  CheckSquare,
  HardDrive,
  Gauge,
  Timer,
  ListPlus,
  Play,
  RotateCcw,
  Sparkles,
  Lightbulb,
  Share2,
  Quote,
  Hand,
  Smartphone,
} from 'lucide-react';
import { type HelpTheme, type HelpSubtheme } from '../helpData';
import { getHelpThemes } from '../helpTranslations';
import { SupportedLanguage } from '../translations';

export interface HelpCenterViewProps {
  activeScreen: { id: string; data?: any };
  navigateTo: (id: string, data?: any) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  resolvedLanguage: SupportedLanguage;
  transicaoConteudo?: any;
}

// Helper para mapear tópicos e detalhes da Ajuda para ícones Lucide elegantes
export function renderHelpIcon(identifier: string, size: number = 24, className?: string) {
  const s = (identifier || '').toLowerCase();
  if (s.includes('novidades') || s.includes('share-story')) {
    return <Share2 size={size} className={className} />;
  }
  if (s.includes('text-excerpts')) {
    return <Quote size={size} className={className} />;
  }
  if (s.includes('mobile-gestures')) {
    return <Hand size={size} className={className} />;
  }
  if (s.includes('install-app')) {
    return <Smartphone size={size} className={className} />;
  }
  
  if (s.includes('outros-apps') || s.includes('ebook-converter') || s.includes('text-generator') || s.includes('🧩')) {
    return <RiApps2Line size={size} className={className} />;
  }
  if (s.includes('biblioteca') || s.includes('livro') || s.includes('📚') || s.includes('📖')) {
    return <BookOpen size={size} className={className} />;
  }
  if (s.includes('reproducao') || s.includes('player') || s.includes('ouvir') || s.includes('🎧') || s.includes('audio')) {
    return <Headphones size={size} className={className} />;
  }
  if (s.includes('capitulo') || s.includes('marcador') || s.includes('📑') || s.includes('🔖')) {
    return <Bookmark size={size} className={className} />;
  }
  if (s.includes('pesquisa') || s.includes('busca') || s.includes('🔍') || s.includes('🔎')) {
    return <Search size={size} className={className} />;
  }
  if (s.includes('ajustes') || s.includes('config') || s.includes('⚙️') || s.includes('🎛️')) {
    return <Sliders size={size} className={className} />;
  }
  if (s.includes('atalho') || s.includes('teclado') || s.includes('⌨️')) {
    return <Keyboard size={size} className={className} />;
  }
  if (s.includes('duvida') || s.includes('ajuda') || s.includes('faq') || s.includes('❓') || s.includes('💡')) {
    return <HelpCircle size={size} className={className} />;
  }
  if (s.includes('add') || s.includes('import') || s.includes('📥') || s.includes('upload')) {
    return <Download size={size} className={className} />;
  }
  if (s.includes('organize') || s.includes('pasta') || s.includes('📂')) {
    return <FolderTree size={size} className={className} />;
  }
  if (s.includes('edit') || s.includes('tag') || s.includes('✏️')) {
    return <Edit3 size={size} className={className} />;
  }
  if (s.includes('multi') || s.includes('selec') || s.includes('☑️')) {
    return <CheckSquare size={size} className={className} />;
  }
  if (s.includes('backup') || s.includes('salvar') || s.includes('💾')) {
    return <HardDrive size={size} className={className} />;
  }
  if (s.includes('velocidade') || s.includes('speed') || s.includes('⚡')) {
    return <Gauge size={size} className={className} />;
  }
  if (s.includes('timer') || s.includes('sono') || s.includes('dormir') || s.includes('⏱️')) {
    return <Timer size={size} className={className} />;
  }
  if (s.includes('fila') || s.includes('queue') || s.includes('📜')) {
    return <ListPlus size={size} className={className} />;
  }
  if (s.includes('start') || s.includes('play') || s.includes('▶️')) {
    return <Play size={size} className={className} />;
  }
  if (s.includes('voltar') || s.includes('retroceder') || s.includes('⏮️')) {
    return <RotateCcw size={size} className={className} />;
  }
  return <Sparkles size={size} className={className} />;
}

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({
  activeScreen,
  navigateTo,
  t,
  resolvedLanguage,
  transicaoConteudo
}) => {
  const isMobile = useIsMobile();
  // No celular não há teclado físico: o tema de atalhos de teclado não é exibido
  const helpThemes: HelpTheme[] = useMemo(
    () => getHelpThemes(resolvedLanguage).filter(theme => !(isMobile && theme.id.includes('atalhos'))),
    [resolvedLanguage, isMobile]
  );

  return (
    <>
      {/* SCREEN: HELP (TEMAS PRINCIPAIS) */}
      {activeScreen.id === 'help' && (
        <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
          <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight">
            {t('nav_help')}
          </h1>
          <div className="space-y-4">
            {helpThemes.map((theme) => (
              <motion.div
                key={theme.id}
                whileTap={{ scale: 0.985 }}
                onClick={() => navigateTo('help-theme', { id: theme.id, title: theme.title })}
                className="relative isolate flex items-center justify-between p-5 sm:p-6 rounded-[28px] cursor-pointer shadow-lg border border-white/15 hover:border-white/30 transition-[border-color,box-shadow] group"
              >
                {/* Camada interna recortada com fundo e ícone com zoom */}
                <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
                  <div className="absolute inset-0 bg-black/15" />

                  {/* Ícone grande cortado no limite do card à direita (marca d'água) */}
                  <div className="absolute -bottom-6 -right-3 select-none pointer-events-none opacity-20 group-hover:scale-110 transition-transform duration-500 transform text-white">
                    {renderHelpIcon(theme.id || theme.emoji, 110, "stroke-[1.3]")}
                  </div>
                </div>

                {/* Conteúdo: textos */}
                <div className="relative z-10 flex flex-col text-left origin-left rtl:origin-right transition-transform duration-500 group-hover:scale-105">
                  <span className="text-lg sm:text-xl font-bold text-white drop-shadow-sm tracking-tight">{theme.title}</span>
                  <span className="text-xs sm:text-sm text-white/85 font-medium mt-0.5">{theme.subtitle}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* SCREEN: HELP - SUBTEMAS */}
      {activeScreen.id === 'help-theme' && (() => {
        const currentThemeId = (typeof activeScreen.data === 'object' && activeScreen.data?.id) 
          ? activeScreen.data.id 
          : (typeof activeScreen.data === 'string' ? activeScreen.data : helpThemes[0]?.id);
        const currentTheme: HelpTheme = helpThemes.find(t => t.id === currentThemeId) || helpThemes[0];

        return (
          <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">
                {currentTheme.title}
              </h1>
            </div>

            {/* Cards de Subtemas com o mesmo design dos cards dos tópicos principais */}
            <div className="space-y-4">
              {currentTheme.subthemes.map((sub, idx) => {
                const subGradients = [
                  currentTheme.gradient,
                  'from-indigo-600 via-purple-600 to-pink-600',
                  'from-blue-600 via-teal-600 to-emerald-500',
                  'from-violet-600 via-indigo-600 to-cyan-500',
                  'from-teal-600 via-cyan-600 to-blue-600',
                  'from-rose-600 via-pink-600 to-amber-500',
                ];
                const cardGradient = sub.gradient || subGradients[idx % subGradients.length];

                return (
                  <motion.div
                    key={sub.id}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => navigateTo('help-article', { themeId: currentTheme.id, subthemeId: sub.id, theme: currentTheme, subtheme: sub })}
                    className="relative isolate flex items-center justify-between p-5 sm:p-6 rounded-[28px] cursor-pointer shadow-lg border border-white/15 hover:border-white/30 transition-[border-color,box-shadow] group"
                  >
                    {/* Camada interna recortada com fundo e ícone com zoom */}
                    <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
                      <div className={`absolute inset-0 bg-gradient-to-br ${cardGradient}`} />
                      <div className="absolute inset-0 bg-black/15" />

                      {/* Ícone grande cortado no limite do card à direita (marca d'água) */}
                      <div className="absolute -bottom-6 -right-3 select-none pointer-events-none opacity-20 group-hover:scale-110 transition-transform duration-500 transform text-white">
                        {renderHelpIcon(sub.id || sub.emoji, 110, "stroke-[1.3]")}
                      </div>
                    </div>

                    {/* Conteúdo: textos */}
                    <div className="relative z-10 flex flex-col text-left origin-left rtl:origin-right transition-transform duration-500 group-hover:scale-105">
                      <span className="text-lg sm:text-xl font-bold text-white drop-shadow-sm tracking-tight">{sub.title}</span>
                      <span className="text-xs sm:text-sm text-white/85 font-medium mt-0.5">{sub.subtitle}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      {/* SCREEN: HELP - ARTIGO / EXPLICAÇÃO DETALHADA */}
      {activeScreen.id === 'help-article' && (() => {
        const dataObj = (typeof activeScreen.data === 'object' ? activeScreen.data : {}) as any;
        const themeId = dataObj?.theme?.id || dataObj?.themeId;
        const subthemeId = dataObj?.subtheme?.id || dataObj?.subthemeId || (typeof activeScreen.data === 'string' ? activeScreen.data : undefined);

        const currentTheme = helpThemes.find(t => t.id === themeId) || helpThemes.find(t => t.subthemes.some(s => s.id === subthemeId)) || helpThemes[0];
        const currentSub: HelpSubtheme = currentTheme?.subthemes.find(s => s.id === subthemeId) || currentTheme?.subthemes[0] || helpThemes[0]?.subthemes[0];
        const article = currentSub.article;

        return (
          <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
            {/* Cabeçalho do Artigo */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">
                {article.title}
              </h1>
            </div>

            <div className="space-y-8">
              {/* Visão Geral */}
              {article.overview && (
                <p className="text-base sm:text-lg leading-relaxed text-[var(--text-main)]/90 font-normal">
                  {article.overview}
                </p>
              )}

              {/* Passo a Passo */}
              {article.steps && article.steps.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-[var(--text-main)]">
                    {t('step_by_step')}
                  </h2>
                  <div className="space-y-3">
                    {article.steps.map((step, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-start gap-4 py-1.5"
                      >
                        <div className="w-8 h-8 rounded-full bg-winblue/15 border border-winblue/30 text-winblue font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                          {step.number}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm sm:text-base text-[var(--text-main)]">
                            {step.title}
                          </span>
                          <span className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mt-1">
                            {step.desc}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Destaques / Detalhes */}
              {article.highlights && article.highlights.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-[var(--text-main)]">
                    {t('features_and_details')}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {article.highlights.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-start gap-3.5 py-1"
                      >
                        <div className="w-9 h-9 rounded-xl bg-winblue/15 text-winblue flex items-center justify-center shrink-0 mt-0.5">
                          {renderHelpIcon(item.emoji + ' ' + item.title, 18)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-[var(--text-main)]">{item.title}</span>
                          <span className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mt-0.5">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Atalhos Relacionados */}
              {article.shortcuts && article.shortcuts.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-[var(--text-main)]">
                    {t('related_shortcuts')}
                  </h2>
                  <div className="divide-y divide-[var(--text-main)]/10 max-w-2xl">
                    {article.shortcuts.map((sc, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between first:pt-0">
                        <span className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">{sc.action}</span>
                        <div className="flex items-center gap-1.5">
                          {sc.keys.map((k, kIdx) => (
                            <React.Fragment key={kIdx}>
                              {kIdx > 0 && <span className="text-xs text-[var(--text-muted)] font-semibold">+</span>}
                              <kbd className="min-w-[28px] px-2 py-0.5 text-xs font-bold bg-white/80 dark:bg-neutral-800/80 border border-black/10 dark:border-white/10 rounded-md shadow-sm text-[var(--text-main)] text-center">
                                {k}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dica de Ouro */}
              {article.tip && (
                <div className="p-5 rounded-[22px] bg-amber-500/10 border border-amber-500/20 backdrop-blur-3xl shadow-sm flex items-start gap-4 my-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
                    <Lightbulb size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-amber-500 dark:text-amber-400">{article.tip.title}</span>
                    <span className="text-xs sm:text-sm text-[var(--text-main)]/90 leading-relaxed mt-1">{article.tip.text}</span>
                  </div>
                </div>
              )}

              {/* Perguntas Frequentes */}
              {article.faq && article.faq.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-[var(--text-main)]">
                    {t('faq')}
                  </h2>
                  <div className="space-y-4 pt-1">
                    {article.faq.map((item, idx) => (
                      <div key={idx} className="space-y-1 py-1">
                        <span className="font-bold text-sm sm:text-base text-[var(--text-main)] block">{item.q}</span>
                        <span className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed block">{item.a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })()}

      {/* SCREEN: HELP - ATALHOS */}
      {(activeScreen.id === 'help-atalhos' || activeScreen.id === 'settings-atalhos') && (
        <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">
              {t('keyboard_shortcuts')}
            </h1>
          </div>

          <div className="p-5 rounded-[26px] bg-card/75 border border-[var(--text-main)]/10 backdrop-blur-3xl shadow-sm space-y-1">
            {[
              { action: t('shortcut_play_pause'), keys: [t('key_space')] },
              { action: t('shortcut_seek_back_15'), keys: ['←'] },
              { action: t('shortcut_seek_forward_15'), keys: ['→'] },
              { action: t('shortcut_prev_chapter'), keys: ['Ctrl', '←'] },
              { action: t('shortcut_next_chapter'), keys: ['Ctrl', '→'] },
              { action: t('shortcut_volume_up'), keys: ['↑'] },
              { action: t('shortcut_volume_down'), keys: ['↓'] },
              { action: t('shortcut_mute_unmute'), keys: ['M'] },
              { action: t('shortcut_fullscreen'), keys: ['F11'] },
              { action: t('shortcut_close_modals'), keys: ['Esc'] },
            ].map((item, idx) => (
              <div key={idx} className="py-3.5 sm:py-4 flex items-center justify-between border-b border-[var(--text-main)]/5 last:border-b-0">
                <span className="font-semibold text-sm sm:text-base text-[var(--text-main)]">{item.action}</span>
                <div className="flex items-center gap-1.5">
                  {item.keys.map((k, kIdx) => (
                    <React.Fragment key={kIdx}>
                      {kIdx > 0 && <span className="text-xs text-[var(--text-muted)] font-semibold">+</span>}
                      <kbd className="min-w-[32px] px-2.5 py-1 text-xs font-bold bg-white/70 dark:bg-neutral-800/80 border border-black/10 dark:border-white/10 rounded-lg shadow-sm text-[var(--text-main)] text-center">
                        {k}
                      </kbd>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
};

export default HelpCenterView;
