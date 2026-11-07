// Extraído do App.tsx: lê do App, pelo contexto, só o que usa
import React from 'react';
import { ALargeSmall, Bell, Bird, Check, ChevronLeft, ChevronRight, Dog, Laptop, Moon, Palette, Play, Rabbit, Sun, Turtle, Type, X } from 'lucide-react';
import { ACCENT_COLORS } from '../lib/accentColors';
import { AnimatePresence, motion } from 'motion/react';
import { SPRING } from '../lib/motion';
import { BsCheck2 } from 'react-icons/bs';
import { transicaoConteudo } from '../App';
import { useAppScope } from '../app/AppScope';

export function OnboardingSettings() {
  const { accentColor, completeOnboarding, defaultPlaybackSpeed, fontSize, notificationsOn, onboardingHeaderProgress, onboardingPage, resumePlayback, setAccentColor, setDefaultPlaybackSpeed, setFontSize, setOnboardingPage, setOnboardingStep, setPlaybackSpeed, setResumePlayback, setThemeMode, t, themeMode, toggleNotifications } = useAppScope();
  type OnbOption = { value: any; label: string; description?: string; icon?: React.ReactNode; colorPreview?: string };
  type OnbSetting = { id: string; title: string; subtitle: string; value: any; options: OnbOption[]; onSelect: (v: any) => void };
  const yesNo = (value: boolean, onSelect: (v: boolean) => void, id: string, title: string, subtitle: string): OnbSetting => ({
    id, title, subtitle, value, onSelect,
    options: [
      { value: true, label: t('yes'), icon: <Check size={16} /> },
      { value: false, label: t('no'), icon: <X size={16} /> },
    ],
  });
  const pages: { id: string; title: string; icon: React.ReactNode; settings: OnbSetting[] }[] = [
    {
      id: 'appearance', title: t('settings_interface'), icon: <Palette size={18} />,
      settings: [
        {
          id: 'theme', title: t('settings_theme'), subtitle: t('settings_theme_sub'), value: themeMode,
          onSelect: (v) => setThemeMode(v),
          options: [
            { value: 'system', label: t('theme_system'), description: t('theme_system_desc'), icon: <Laptop size={16} /> },
            { value: 'light', label: t('theme_light'), description: t('theme_light_desc'), icon: <Sun size={16} /> },
            { value: 'dark', label: t('theme_dark'), description: t('theme_dark_desc'), icon: <Moon size={16} /> },
          ],
        },
        {
          id: 'accent-color', title: t('settings_accent'), subtitle: t('settings_accent_sub'), value: accentColor,
          onSelect: (v) => setAccentColor(v),
          options: Object.entries(ACCENT_COLORS).map(([key, item]) => ({ value: key, label: t('color_' + key) || item.name, colorPreview: item.hex })),
        },
        {
          id: 'font-size', title: t('settings_font_size'), subtitle: t('settings_font_size_sub'), value: fontSize,
          onSelect: (v) => setFontSize(v),
          options: [
            { value: 'standard', label: t('font_standard'), icon: <Type size={16} /> },
            { value: 'large', label: t('font_large'), description: '+20%', icon: <ALargeSmall size={16} /> },
          ],
        },
      ],
    },
    {
      id: 'playback', title: t('settings_playback'), icon: <Play size={18} />,
      settings: [
        {
          id: 'default-speed', title: t('settings_default_speed'), subtitle: t('settings_default_speed_sub'), value: defaultPlaybackSpeed,
          onSelect: (v) => { setDefaultPlaybackSpeed(v); setPlaybackSpeed(v); },
          options: [0.75, 1, 1.25, 1.5, 1.75, 2].map(v => ({
            value: v,
            label: `${v.toFixed(2).replace(/0$/, '').replace(/\.0$/, '.0').replace('.', ',')}×`,
            icon: v < 1 ? <Turtle size={16} /> : v === 1 ? <Dog size={16} /> : v < 1.75 ? <Rabbit size={16} /> : <Bird size={16} />,
          })),
        },
        yesNo(resumePlayback, setResumePlayback, 'resume', t('settings_resume_playback'), t('settings_resume_playback_sub')),
      ],
    },
    {
      id: 'notifications', title: t('settings_notifications'), icon: <Bell size={18} />,
      settings: [yesNo(notificationsOn, toggleNotifications, 'notifications', t('settings_notif_enabled'), t('settings_notif_enabled_sub'))],
    },
  ];
  const pageIdx = Math.min(onboardingPage, pages.length - 1);
  const page = pages[pageIdx];
  const isLast = pageIdx === pages.length - 1;
  const goPrev = () => {
    if (pageIdx === 0) { setOnboardingStep('welcome'); return; }
    setOnboardingPage(pageIdx - 1);
  };
  const goNext = () => {
    if (isLast) { setOnboardingPage(0); completeOnboarding(); return; }
    setOnboardingPage(pageIdx + 1);
  };
  const prevLabel = pageIdx === 0 ? t('onb_welcome') : pages[pageIdx - 1].title;
  const nextLabel = isLast ? t('onb_finish') : pages[pageIdx + 1].title;
  const navBtn = "h-12 rounded-full flex items-center gap-1.5 backdrop-blur-3xl shadow-lg text-[14px] md:text-[15px] font-semibold min-w-0 max-md:flex-1 max-md:max-w-[42%] max-md:justify-center";
  return (
    <motion.div
      key="onboarding-settings"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="flex-1 w-full flex flex-col min-h-full"
    >
      {/* Celular: cabeçalho com o título da página quando a tela rola (desfoque atrás, esmaecendo para baixo) */}
      <div
        aria-hidden={onboardingHeaderProgress < 0.5}
        className="md:hidden fixed inset-x-0 top-0 z-30 pointer-events-none"
        style={{ height: 'calc(var(--app-header-top) + 44px + 40px)', opacity: onboardingHeaderProgress }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(4,7,15,0.62), rgba(4,7,15,0.38) 60%, rgba(4,7,15,0))',
            WebkitBackdropFilter: 'blur(18px) saturate(150%)',
            backdropFilter: 'blur(18px) saturate(150%)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)',
          }}
        />
        <div className="absolute inset-x-0 flex items-center justify-center px-16" style={{ top: 'var(--app-header-top)', height: 44 }}>
          <span className="text-[17px] font-semibold text-white truncate">{page.title}</span>
        </div>
      </div>
      <div className="flex-1 w-full max-w-xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 md:pt-14 pb-36 md:pb-44 flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={SPRING.snappy}
            className="flex flex-col"
          >
            <h1 className="text-[34px] md:text-5xl font-semibold text-white tracking-tight mb-7 md:mb-10 flex items-center gap-3 md:gap-4">
              <span className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-winblue/20 text-winblue flex items-center justify-center shrink-0">{page.icon}</span>
              {page.title}
            </h1>
            {/* Celular: um tema abaixo do outro. Computador: duas colunas independentes (temas alternados),
                cada um logo abaixo do anterior, sem buracos entre as linhas */}
            {(() => {
              const renderSetting = (setting: OnbSetting) => (
                <section key={setting.id}>
                  <h2 className="text-[15px] md:text-base font-bold text-white">{setting.title}</h2>
                  <p className="text-[13px] md:text-sm text-white/65 mt-0.5 mb-3">{setting.subtitle}</p>
                  <div className="settings-option-list p-1.5 rounded-[32px] bg-white/[0.07] backdrop-blur-xl space-y-0.5">
                    {setting.options.map((option, idx) => {
                      const selected = setting.value === option.value;
                      return (
                        <motion.button
                          key={idx}
                          transition={SPRING.snappy}
                          onClick={() => setting.onSelect(option.value)}
                          className={`w-full min-h-[52px] flex items-center gap-3.5 px-3 py-2 text-left rtl:text-right rounded-[26px] transition-[background-color,border-color,box-shadow] duration-150 ${selected ? 'bg-winblue/20 ' : ' hover:bg-[var(--hover-fill)] '}`}
                        >
                          <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selected ? 'bg-winblue/25 text-winblue' : 'bg-white/10 text-white/85'}`}>
                            {option.colorPreview
                              ? <span className="w-5 h-5 rounded-full " style={{ backgroundColor: option.colorPreview }} />
                              : option.icon}
                          </span>
                          <span className="flex-1 min-w-0 flex flex-col">
                            <span className={`text-[15px] font-semibold truncate ${selected ? 'text-winblue' : 'text-white'}`}>{option.label}</span>
                            {option.description && <span className="text-xs text-white/60 truncate mt-0.5">{option.description}</span>}
                          </span>
                          {selected && <BsCheck2 size={18} className="text-winblue shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
              );
              const left = page.settings.filter((_, i) => i % 2 === 0);
              const right = page.settings.filter((_, i) => i % 2 === 1);
              return (
                <>
                  <div className="flex flex-col gap-7 md:hidden">{page.settings.map(renderSetting)}</div>
                  <div className={`hidden md:flex gap-8 items-start ${right.length === 0 ? 'max-w-xl' : ''}`}>
                    <div className="flex-1 min-w-0 flex flex-col gap-8">{left.map(renderSetting)}</div>
                    {right.length > 0 && <div className="flex-1 min-w-0 flex flex-col gap-8">{right.map(renderSetting)}</div>}
                  </div>
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Voltar (com o nome da página anterior), bolinhas das páginas e prosseguir/concluir (com o nome da próxima) */}
      <div className="fixed inset-x-0 bottom-0 z-20 px-4 md:px-10 pb-[max(20px,env(safe-area-inset-bottom))] pt-8 md:bg-gradient-to-t md:from-black/55 md:to-transparent">
        {/* Celular: desfoque no rodapé, atrás dos botões, esmaecendo para cima */}
        <div
          aria-hidden="true"
          className="md:hidden absolute inset-x-0 bottom-0 -top-6 -z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(4,7,15,0.6), rgba(4,7,15,0.35) 55%, rgba(4,7,15,0))',
            WebkitBackdropFilter: 'blur(18px) saturate(150%)',
            backdropFilter: 'blur(18px) saturate(150%)',
            WebkitMaskImage: 'linear-gradient(to top, #000 0%, #000 50%, transparent 100%)',
            maskImage: 'linear-gradient(to top, #000 0%, #000 50%, transparent 100%)',
          }}
        />
        <div className="max-w-xl md:max-w-5xl mx-auto md:px-10 flex items-center justify-between gap-3">
          <motion.button
            data-press="true"
            onClick={goPrev}
            className={`${navBtn} pl-2.5 pr-4 md:pl-3 md:pr-5 bg-white/10 text-white transition-[background-color,border-color,box-shadow] hover:bg-[var(--hover-fill)] `}
          >
            <ChevronLeft size={22} className="shrink-0 rtl:rotate-180" />
            <span className="truncate">{prevLabel}</span>
          </motion.button>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0" aria-hidden="true">
            {pages.map((p, i) => (
              <span key={p.id} className={`h-2 rounded-full transition-all duration-300 ${i === pageIdx ? 'w-5 md:w-6 bg-winblue' : 'w-2 bg-white/30'}`} />
            ))}
          </div>
          <motion.button
            data-press="true"
            onClick={goNext}
            className={`${navBtn} pl-4 pr-2.5 md:pl-5 md:pr-3 bg-winblue/30 text-winblue transition-[background-color,box-shadow] hover:bg-winblue/40 `}
          >
            <span className="truncate">{nextLabel}</span>
            {isLast ? <Check size={20} className="shrink-0" /> : <ChevronRight size={22} className="shrink-0 rtl:rotate-180" />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
