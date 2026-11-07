import React, { Component, useState, useMemo, type ReactNode } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RefreshCw, Database, Copy, Check, Eye } from 'lucide-react';
import { type SupportedLanguage, getSystemLanguage } from '../i18n/translations';
import { SPRING, FADE_OUT } from '../lib/motion';
import { AmbientBackground } from './AmbientBackground';

function getAppLanguageAtError(): SupportedLanguage {
  try {
    const stored = localStorage.getItem('app_language');
    if (stored && stored !== 'system' && ['pt', 'en', 'es', 'ru', 'ar'].includes(stored)) {
      return stored as SupportedLanguage;
    }
  } catch {}
  return getSystemLanguage();
}

interface ErrorTranslations {
  title: string;
  scopeBadge: string;
  scopeDesc: string;
  inaccessiblePrefix: string;
  inaccessibleItems: [string, string, string];
  inaccessibleConjunction: string;
  inaccessibleSuffix: string;
  copyDetails: string;
  copied: string;
  showStack: string;
  stackPopupTitle: string;
  reloadBtn: string;
  restoreBtn: string;
  restoreHint: string;
  unknownError: string;
}

const ERROR_I18N: Record<SupportedLanguage, ErrorTranslations> = {
  pt: {
    title: 'Ops! Ocorreu um problema ao carregar o app',
    scopeBadge: 'Aplicativo inteiro indisponível',
    scopeDesc: 'Ocorreu um erro inesperado durante a execução. Toda a interface foi suspensa temporariamente para proteger seus dados e histórico.',
    inaccessiblePrefix: 'Nesta sessão, os recursos de ',
    inaccessibleItems: [
      'reprodução de áudio e fila de capítulos',
      'navegação pela biblioteca, livros e autores',
      'ajustes e personalizações do usuário'
    ],
    inaccessibleConjunction: ' e ',
    inaccessibleSuffix: ' estão indisponíveis.',
    copyDetails: 'Copiar erro',
    copied: 'Copiado!',
    showStack: 'Ver rastreamento da pilha',
    stackPopupTitle: 'Rastreamento da pilha',
    reloadBtn: 'Recarregar',
    restoreBtn: 'Restaurar dados',
    restoreHint: 'Atenção: "Restaurar dados" redefine as preferências locais e o cache do navegador para corrigir eventuais dados corrompidos.',
    unknownError: 'Erro desconhecido'
  },
  en: {
    title: 'Oops! A problem occurred while loading the app',
    scopeBadge: 'Entire application unavailable',
    scopeDesc: 'An unexpected error occurred during execution. The entire interface was temporarily suspended to protect your data and history.',
    inaccessiblePrefix: 'In this session, ',
    inaccessibleItems: [
      'audio playback and chapter queue',
      'library browsing, books and authors',
      'settings and user customizations'
    ],
    inaccessibleConjunction: ', and ',
    inaccessibleSuffix: ' are unavailable.',
    copyDetails: 'Copy error',
    copied: 'Copied!',
    showStack: 'View stack trace',
    stackPopupTitle: 'Stack trace',
    reloadBtn: 'Reload',
    restoreBtn: 'Restore data',
    restoreHint: 'Note: "Restore data" resets local preferences and browser cache to fix corrupted data.',
    unknownError: 'Unknown error'
  },
  es: {
    title: '¡Ups! Ocurrió un problema al cargar la app',
    scopeBadge: 'Aplicación completa no disponible',
    scopeDesc: 'Ocurrió un error inesperado durante la ejecución. Toda la interfaz se suspendió temporalmente para proteger sus datos e historial.',
    inaccessiblePrefix: 'En esta sesión, los recursos de ',
    inaccessibleItems: [
      'reproducción de audio y cola de capítulos',
      'navegación por la biblioteca, libros y autores',
      'ajustes y personalizaciones de usuario'
    ],
    inaccessibleConjunction: ' y ',
    inaccessibleSuffix: ' no están disponibles.',
    copyDetails: 'Copiar error',
    copied: '¡Copiado!',
    showStack: 'Ver seguimiento de pila',
    stackPopupTitle: 'Seguimiento de pila',
    reloadBtn: 'Recargar',
    restoreBtn: 'Restaurar datos',
    restoreHint: 'Nota: "Restaurar datos" restablece las preferencias locales y el caché del navegador para corregir datos dañados.',
    unknownError: 'Error desconocido'
  },
  ru: {
    title: 'Ой! Произошла ошибка при загрузке приложения',
    scopeBadge: 'Всё приложение недоступно',
    scopeDesc: 'Во время работы произошла непредвиденная ошибка. Весь интерфейс временно приостановлен для защиты ваших данных и истории.',
    inaccessiblePrefix: 'В этой сессии недоступны ',
    inaccessibleItems: [
      'воспроизведение аудио и очередь глав',
      'навигация по библиотеке, книгам и авторам',
      'настройки и персонализация пользователя'
    ],
    inaccessibleConjunction: ' и ',
    inaccessibleSuffix: '.',
    copyDetails: 'Копировать ошибку',
    copied: 'Скопировано!',
    showStack: 'Показать стек вызовов',
    stackPopupTitle: 'Стек вызовов',
    reloadBtn: 'Перезагрузить',
    restoreBtn: 'Восстановить данные',
    restoreHint: 'Примечание: «Восстановить данные» сбрасывает локальные настройки и кэш браузера для устранения повреждений.',
    unknownError: 'Неизвестная ошибка'
  },
  ar: {
    title: 'عفوًا! حدثت مشكلة أثناء تحميل التطبيق',
    scopeBadge: 'التطبيق بالكامل غير متاح',
    scopeDesc: 'حدث خطأ غير متوقع أثناء التشغيل. تم تعليق الواجهة بالكامل مؤقتًا لحماية بياناتك وسجل الاستماع.',
    inaccessiblePrefix: 'في هذه الجلسة، تتعذر إتاحة ',
    inaccessibleItems: [
      'تشغيل الصوت وقائمة انتظار الفصول',
      'تصفح المكتبة والكتب والمؤلفين',
      'الإعدادات وتفضيلات المستخدم'
    ],
    inaccessibleConjunction: ' و',
    inaccessibleSuffix: '.',
    copyDetails: 'نسخ الخطأ',
    copied: 'تم النسخ!',
    showStack: 'عرض تتبع المكدس',
    stackPopupTitle: 'تتبع المكدس',
    reloadBtn: 'إعادة تحميل',
    restoreBtn: 'استعادة البيانات',
    restoreHint: 'ملاحظة: يؤدي "استعادة البيانات" إلى إعادة تعيين التفضيلات وذاكرة التخزين المؤقت للمتصفح لإصلاح التلف.',
    unknownError: 'خطأ غير معروف'
  }
};

function ErrorFallback({ error }: { error: Error }) {
  const [copied, setCopied] = useState(false);
  const [showStack, setShowStack] = useState(false);

  const lang = useMemo(() => getAppLanguageAtError(), []);
  const t = ERROR_I18N[lang] || ERROR_I18N.pt;
  const isRtl = lang === 'ar';

  const errorRedColor = '#f87171';

  const handleCopy = () => {
    const errorDetails = `[Audiobook Player Error Report]
Error: ${error.name || 'Error'}: ${error.message || 'Unknown error'}
Language: ${lang}
URL: ${window.location.href}
UserAgent: ${navigator.userAgent}
Stack:
${error.stack || 'No stack trace available'}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(errorDetails).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleRestoreData = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  const stackText = error.stack || `${error.name || 'Error'}: ${error.message || t.unknownError}`;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-8 text-white select-none ambient-screen"
      style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <AmbientBackground />

      <style>{`
        .error-reload-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 26px;
          border-radius: 9999px;
          border: 1.5px solid var(--winblue, #FF9500);
          background: rgba(255, 149, 0, 0.18);
          color: var(--winblue, #FF9500);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          user-select: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .error-reload-btn:hover {
          transform: scale(1.06);
          border-color: var(--winblue, #FF9500);
          color: var(--winblue, #FF9500);
          background: rgba(255, 149, 0, 0.30);
          box-shadow: 0 0 25px rgba(255, 149, 0, 0.85), 0 0 50px rgba(201, 52, 0, 0.45);
        }
        .error-reload-btn:active {
          transform: scale(1.02);
        }

        .error-restore-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 26px;
          border-radius: 9999px;
          border: 1.5px solid rgb(var(--ambient-ink) / 0.25);
          background: rgb(var(--ambient-ink) / 0.08);
          color: rgb(var(--ambient-ink));
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          user-select: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .error-restore-btn:hover {
          transform: scale(1.06);
          border-color: rgb(var(--ambient-ink) / 0.85);
          background: rgb(var(--ambient-ink) / 0.18);
          box-shadow: 0 0 25px rgb(var(--ambient-ink) / 0.75), 0 0 50px rgb(var(--ambient-ink) / 0.35);
        }
        .error-restore-btn:active {
          transform: scale(1.02);
        }

        .error-small-pill-btn {
          height: 32px;
          padding: 0 15px 0 14px;
          border-radius: 9999px;
          background: rgb(var(--ambient-ink) / 0.08);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgb(var(--ambient-ink) / 0.28);
          color: rgb(var(--ambient-ink));
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          user-select: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
          transition: background 0.2s ease, 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .error-small-pill-btn:hover {
          transform: scale(1.06);
          background: rgb(var(--ambient-ink) / 0.16);
          border-color: rgb(var(--ambient-ink) / 0.55);
          box-shadow: 0 0 15px rgb(var(--ambient-ink) / 0.32), 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        .error-small-pill-btn:active {
          transform: scale(0.95);
        }
      `}</style>

      <div className="relative z-10 max-w-[580px] w-full text-center">
        {/* Ícone vermelho de aviso direto no fundo da tela, sem destaque de fundo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px'
        }}>
          <AlertTriangle size={46} color={errorRedColor} />
        </div>

        {/* Título principal logo abaixo e na mesma cor do ícone */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          margin: '0 0 10px 0',
          color: errorRedColor,
          letterSpacing: '-0.02em'
        }}>
          {t.title}
        </h1>

        {/* Subtítulo branco com o que exatamente está indisponível */}
        <h2 style={{
          fontSize: '16px',
          fontWeight: 600,
          margin: '0 0 12px 0',
          color: 'rgb(var(--ambient-ink))',
          letterSpacing: '-0.01em'
        }}>
          {t.scopeBadge}
        </h2>

        {/* Descrição do erro */}
        <p style={{
          fontSize: '14px',
          color: 'rgb(var(--ambient-ink) / 0.62)',
          lineHeight: '1.6',
          margin: '0 0 14px 0'
        }}>
          {t.scopeDesc}
        </p>

        {/* Parágrafo com os recursos indisponíveis destacados em negrito */}
        <p style={{
          fontSize: '14px',
          color: 'rgb(var(--ambient-ink) / 0.62)',
          lineHeight: '1.6',
          margin: '0 0 24px 0'
        }}>
          {t.inaccessiblePrefix}
          <strong style={{ color: 'rgb(var(--ambient-ink))', fontWeight: 700 }}>{t.inaccessibleItems[0]}</strong>
          {', '}
          <strong style={{ color: 'rgb(var(--ambient-ink))', fontWeight: 700 }}>{t.inaccessibleItems[1]}</strong>
          {t.inaccessibleConjunction}
          <strong style={{ color: 'rgb(var(--ambient-ink))', fontWeight: 700 }}>{t.inaccessibleItems[2]}</strong>
          {t.inaccessibleSuffix}
        </p>

        {/* Destaque vermelho do erro (sem container cinza ao redor, sem título de Error, cantos mais arredondados) */}
        <div style={{
          fontFamily: 'inherit',
          fontSize: '13px',
          color: '#fca5a5',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          padding: '16px 20px',
          borderRadius: '24px',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          wordBreak: 'break-word',
          lineHeight: '1.55',
          textAlign: isRtl ? 'right' : 'left',
          marginBottom: '16px'
        }}>
          {error.message || t.unknownError}
        </div>

        {/* Botões menores abaixo do destaque do erro: Ver rastreamento da pilha e Copiar erro */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '56px',
          position: 'relative'
        }}>
          {/* Botão Ver rastreamento da pilha + Pop-up emergindo dele */}
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <motion.button
              type="button"
              animate={showStack
                ? { scale: 0.5, opacity: 0, pointerEvents: 'none', transition: FADE_OUT }
                : { scale: 1, opacity: 1, pointerEvents: 'auto', transition: { duration: 0 } }
              }
              onClick={(e) => {
                e.stopPropagation();
                setShowStack(true);
              }}
              className="error-small-pill-btn"
            >
              <Eye size={14} style={{ flexShrink: 0 }} />
              <span>{t.showStack}</span>
            </motion.button>

            <AnimatePresence>
              {showStack && (
                <>
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setShowStack(false);
                    }}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 90,
                      cursor: 'default'
                    }}
                  />
                  <motion.div
                    key="stack-trace-popup"
                    data-popup-content="true"
                    initial={{ opacity: 0, scale: 0.15, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.15, filter: 'blur(6px)' }}
                    transition={SPRING.snappy}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      x: '-50%',
                      transformOrigin: 'bottom center',
                      width: '480px',
                      maxWidth: 'calc(100vw - 32px)',
                      backgroundColor: 'var(--ambient-card)',
                      backdropFilter: 'blur(28px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                      border: '1px solid rgb(var(--ambient-ink) / 0.12)',
                      borderRadius: '26px',
                      boxShadow: '0 0 50px 0 rgba(0, 0, 0, 0.85)',
                      padding: '16px',
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: isRtl ? 'right' : 'left',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      padding: '2px 6px 10px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'rgb(var(--ambient-ink))'
                      }}>
                        {t.stackPopupTitle}
                      </span>
                    </div>
                    <pre
                      className="custom-scrollbar"
                      style={{
                        margin: 0,
                        padding: '12px 14px',
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgb(var(--ambient-ink) / 0.08)',
                        borderRadius: '18px',
                        fontFamily: 'inherit',
                        fontSize: '12px',
                        color: '#d4d4d4',
                        overflowX: 'auto',
                        overflowY: 'auto',
                        maxHeight: '220px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        userSelect: 'text',
                        WebkitUserSelect: 'text'
                      }}
                    >
                      {stackText}
                    </pre>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Botão Copiar erro */}
          <button
            type="button"
            onClick={handleCopy}
            className="error-small-pill-btn"
          >
            {copied ? (
              <Check size={13} style={{ flexShrink: 0 }} />
            ) : (
              <Copy size={13} style={{ flexShrink: 0 }} />
            )}
            <span>{copied ? t.copied : t.copyDetails}</span>
          </button>
        </div>

        {/* Botões principais de Ação: Recarregar e Restaurar dados */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <button onClick={handleReload} className="error-reload-btn">
            <RefreshCw size={17} />
            <span>{t.reloadBtn}</span>
          </button>

          <button onClick={handleRestoreData} className="error-restore-btn">
            <Database size={17} />
            <span>{t.restoreBtn}</span>
          </button>
        </div>

        {/* Informação sobre restauração */}
        <p style={{
          fontSize: '12px',
          color: '#737373',
          lineHeight: '1.5',
          maxWidth: '460px',
          margin: '0 auto'
        }}>
          {t.restoreHint}
        </p>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
