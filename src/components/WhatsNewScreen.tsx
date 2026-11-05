import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLogo } from './AppLogo';
import { Check, ArrowRight } from 'lucide-react';
import { APP_VERSION } from '../version';
import type { SupportedLanguage } from '../translations';

// ===== Tela de novidades =====
// Aparece uma vez depois de o app ser atualizado, no mesmo visual da tela inicial. Ao publicar uma versão,
// acrescente aqui as novidades dela: sem novidades cadastradas, a tela não aparece.
type Notes = Record<SupportedLanguage, string[]>;

const RELEASE_NOTES: Record<string, Notes> = {
  '1.0.9': {
    pt: ['Letra mais limpa: destaque só com cor, com sombra suave', 'Destaque das palavras mais preciso', 'Metadados de Opus, OGG, FLAC, WAV e WMA, e capítulos em MP3'],
    en: ['Cleaner lyrics: color-only highlighting with a soft shadow', 'More precise word highlighting', 'Metadata for Opus, OGG, FLAC, WAV and WMA, plus MP3 chapters'],
    es: ['Letra más limpia: resaltado solo con color y sombra suave', 'Resaltado de palabras más preciso', 'Metadatos de Opus, OGG, FLAC, WAV y WMA, y capítulos en MP3'],
    ru: ['Более чистый текст: выделение только цветом и мягкая тень', 'Более точное выделение слов', 'Метаданные Opus, OGG, FLAC, WAV и WMA и главы в MP3'],
    ar: ['نص أوضح: تمييز باللون فقط مع ظل خفيف', 'تمييز أدق للكلمات', 'بيانات Opus وOGG وFLAC وWAV وWMA وفصول MP3'],
  },
  '1.0.8': {
    pt: [
      'Novo ícone do app',
      'Destaque das palavras mais preciso na letra',
      'Metadados de Opus, OGG, FLAC, WAV e WMA, e capítulos em MP3',
      'Correção do travamento ao abrir a letra',
      'No computador, pop-ups nascem dos botões e o volume fica salvo',
    ],
    en: [
      'New app icon',
      'More precise word highlighting in the lyrics',
      'Metadata for Opus, OGG, FLAC, WAV and WMA, plus MP3 chapters',
      'Fixed the freeze when opening the lyrics',
      'On the computer, pop-ups grow from their buttons and the volume is saved',
    ],
    es: [
      'Nuevo icono de la app',
      'Resaltado de palabras más preciso en la letra',
      'Metadatos de Opus, OGG, FLAC, WAV y WMA, y capítulos en MP3',
      'Corrección del bloqueo al abrir la letra',
      'En el ordenador, las ventanas nacen de los botones y el volumen se guarda',
    ],
    ru: [
      'Новый значок приложения',
      'Более точное выделение слов в тексте',
      'Метаданные Opus, OGG, FLAC, WAV и WMA и главы в MP3',
      'Исправлено зависание при открытии текста',
      'На компьютере окна появляются из кнопок, а громкость сохраняется',
    ],
    ar: [
      'أيقونة جديدة للتطبيق',
      'تمييز أدق للكلمات في النص',
      'بيانات Opus وOGG وFLAC وWAV وWMA وفصول MP3',
      'إصلاح التجمد عند فتح النص',
      'على الحاسوب تنبثق النوافذ من الأزرار ويُحفظ مستوى الصوت',
    ],
  },
  '1.0.7': {
    pt: [
      'Áudio mais estável no iPhone: pausas, volta ao app e retomada do ponto em que parou',
      'Letra completa, com busca no texto e opção de destacar frases ou palavras',
      'Gêneros e subgêneros reorganizados',
      'Opção de ocultar capítulos como introdução e agradecimentos',
      'Modo leve para aparelhos mais simples',
      'Nomes longos andam nos players, e os toques e destaques ficaram como no iOS',
    ],
    en: [
      'More stable audio on iPhone: pauses, returning to the app and resuming where you left off',
      'Full lyrics, with search in the text and a choice of highlighting sentences or words',
      'Genres and subgenres reorganized',
      'Option to hide chapters such as introductions and acknowledgments',
      'Lite mode for simpler devices',
      'Long names scroll in the players, and taps and highlights now feel like iOS',
    ],
    es: [
      'Audio más estable en iPhone: pausas, volver a la app y retomar donde lo dejaste',
      'Letra completa, con búsqueda en el texto y opción de resaltar frases o palabras',
      'Géneros y subgéneros reorganizados',
      'Opción de ocultar capítulos como introducción y agradecimientos',
      'Modo ligero para dispositivos más sencillos',
      'Los nombres largos se desplazan en los reproductores, y los toques y resaltados son como en iOS',
    ],
    ru: [
      'Более стабильный звук на iPhone: паузы, возврат в приложение и продолжение с нужного места',
      'Полный текст с поиском и выбором выделения фраз или слов',
      'Жанры и поджанры упорядочены заново',
      'Можно скрывать главы вроде введения и благодарностей',
      'Облегчённый режим для простых устройств',
      'Длинные названия прокручиваются в плеерах, а нажатия и выделение стали как в iOS',
    ],
    ar: [
      'صوت أكثر ثباتًا على iPhone: الإيقاف المؤقت والعودة إلى التطبيق والمتابعة من حيث توقفت',
      'النص كاملًا مع البحث فيه وخيار تمييز الجمل أو الكلمات',
      'إعادة تنظيم الأنواع والأنواع الفرعية',
      'خيار إخفاء فصول مثل المقدمة والشكر',
      'وضع خفيف للأجهزة البسيطة',
      'الأسماء الطويلة تتحرك في المشغلات، واللمسات والتمييز أصبحت كما في iOS',
    ],
  },
};

const KEY = 'app_last_seen_version';

// Quem acabou de instalar não vê a tela: a versão atual já conta como vista
function shouldShowOnStart(): boolean {
  try {
    const seen = localStorage.getItem(KEY);
    const returning = seen !== null || localStorage.getItem('app_onboarding_completed_v1') === 'true';
    if (seen === APP_VERSION) return false;
    if (!returning || !RELEASE_NOTES[APP_VERSION]) {
      localStorage.setItem(KEY, APP_VERSION);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function WhatsNewScreen({ language, t }: { language: SupportedLanguage; t: (key: string, vars?: Record<string, any>) => string }) {
  const [open, setOpen] = useState(shouldShowOnStart);
  const notes = RELEASE_NOTES[APP_VERSION]?.[language] || RELEASE_NOTES[APP_VERSION]?.en || [];
  const close = () => {
    try { localStorage.setItem(KEY, APP_VERSION); } catch { /* sem armazenamento */ }
    setOpen(false);
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="whats-new"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9800] overflow-y-auto bg-[#04070f] text-white select-none"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[15%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[#092b68] opacity-70 blur-[110px]" />
            <div className="absolute -bottom-[15%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-[#4a0d24] opacity-50 blur-[110px]" />
          </div>
          <div
            className="relative w-full max-w-xl mx-auto min-h-full flex flex-col items-center justify-center text-center px-6"
            style={{ paddingTop: 'calc(var(--safe-top) + 32px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              className="flex items-baseline gap-1 text-3xl sm:text-4xl tracking-tight mb-2"
            >
              <AppLogo className="shrink-0" />
              <span>
                <span className="font-bold">Audiobook</span>
                <span className="font-normal opacity-90">Player</span>
              </span>
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white/95 tracking-tight mt-1">{t('whats_new_title', { ver: APP_VERSION })}</h2>
            <ul className="w-full max-w-md mt-7 p-2 rounded-[26px] bg-white/[0.07] backdrop-blur-3xl border border-white/15 shadow-xl text-left rtl:text-right">
              {notes.map(note => (
                <li key={note} className="flex items-start gap-3 px-3 py-2.5 text-sm sm:text-[15px] leading-snug text-white/90">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-winblue/25 text-winblue flex items-center justify-center shrink-0"><Check size={12} /></span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <motion.button
              whileHover={{ scale: 1.04 }}
              data-press="true"
              onClick={close}
              className="mt-8 h-12 px-6 rounded-full bg-winblue/25 hover:bg-winblue/35 border border-winblue text-winblue font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(var(--winblue-rgb),0.25)] hover:shadow-[0_0_28px_rgba(var(--winblue-rgb),0.4)] backdrop-blur-3xl cursor-pointer"
            >
              <span>{t('whats_new_go')}</span>
              <ArrowRight size={18} className="shrink-0 rtl:rotate-180" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
