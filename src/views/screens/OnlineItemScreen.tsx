// Página de uma sugestão da internet, no mesmo desenho da página de um audiobook da biblioteca (no celular, a capa
// ocupa o topo e se dissolve na tela com desfoque; no computador, capa ao lado do título), com as diferenças de cada
// tipo de item:
// - audiobook gratuito (LibriVox): "Baixar para a biblioteca" e "Abrir no site";
// - ebook gratuito (Project Gutenberg): "Ler online" e a sugestão de virar audiobook no Audiobook Generator;
// - à venda (Apple Books): "Ver na Apple Books" e a busca do título em outras lojas, cada uma com o próprio ícone.
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Download, Globe, ExternalLink, Loader2, X, Check } from 'lucide-react';
import { FaApple, FaAmazon, FaGooglePlay } from 'react-icons/fa';
import { SiAudible } from 'react-icons/si';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';
import { getGenericBookCover, extractCoverPalette } from '../../lib/coverArt';
import { getLanguageDisplayName } from '../../i18n/translations';
import { getItemDetails, downloadAudiobook, titleMatches, authorMatches, type OnlineItem, type OnlineItemDetails } from '../../lib/onlineCatalog';
import { IS_INSTALLED_APP } from '../../lib/desktopBridge';
import { GeneratorGlyph } from '../../components/GeneratorGlyph';

const GENERATOR_URL = 'https://github.com/thenauan/audiobook-generator/releases/latest';
const formatSize = (bytes: number) => bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1e6))} MB`;
const formatRuntime = (rt?: string) => {
  if (!rt) return '';
  const parts = rt.split(':').map(Number);
  if (parts.some(n => Number.isNaN(n))) return rt;
  const [h, m] = parts.length === 3 ? parts : [0, parts[0]];
  return h ? `${h}h ${m}min` : `${m}min`;
};

// Mesmos esmaecimentos da capa no topo da página do audiobook (celular)
const FADE_MAIN = 'linear-gradient(to bottom, black 0%, rgba(0,0,0,1) 38%, rgba(0,0,0,0.951) 48.5%, rgba(0,0,0,0.820) 55.5%, rgba(0,0,0,0.616) 62.5%, rgba(0,0,0,0.384) 69.5%, rgba(0,0,0,0.180) 76.5%, rgba(0,0,0,0.049) 83.5%, rgba(0,0,0,0) 94%)';
const FADE_TOP = 'linear-gradient(to bottom, black 0px, black 20px, transparent 96px)';
const FADE_BASE = 'linear-gradient(to bottom, transparent 38%, rgba(0,0,0,0.104) 42.5%, rgba(0,0,0,0.5) 47%, rgba(0,0,0,0.896) 51.5%, rgba(0,0,0,1) 56%, rgba(0,0,0,1) 64%, rgba(0,0,0,0.896) 70%, rgba(0,0,0,0.5) 76%, rgba(0,0,0,0.104) 82%, rgba(0,0,0,0) 88%)';

const primaryBtn = 'h-10 px-5 max-md:h-12 max-md:px-6 max-md:text-sm justify-center rounded-full bg-winblue/20 shadow-xl backdrop-blur-3xl hover:bg-winblue/30 text-winblue text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-60';
// Celular: os botões secundários ficam só com o ícone, redondos, ao lado do principal
const secondaryBtn = 'h-10 px-4 max-md:h-12 max-md:w-12 max-md:px-0 justify-center rounded-full bg-card/75 backdrop-blur-3xl shadow-xl hover:bg-[var(--hover-fill)] text-xs font-semibold text-[var(--text-main)] transition-all flex items-center gap-2';

// Cor da capa (a mesma conta das capas da biblioteca) para o fundo da página
function useCoverColor(url?: string) {
  useEffect(() => {
    if (!url) return;
    let alive = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!alive) return;
      try {
        const c = document.createElement('canvas');
        c.width = 32; c.height = 32;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 32, 32);
        const palette = extractCoverPalette(ctx.getImageData(0, 0, 32, 32).data);
        if (palette) window.dispatchEvent(new CustomEvent('online-item-color', { detail: palette.primary }));
      } catch { /* imagem sem acesso às cores */ }
    };
    img.src = url;
    return () => { alive = false; };
  }, [url]);
}

export function OnlineItemScreen() {
  const { activeScreen, books, handleOpenExternalUrl, resolvedLanguage, setMobileConfirm, showToast, t } = useScreenScope();
  const item = activeScreen.data as OnlineItem;
  const [details, setDetails] = useState<OnlineItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);
  const store = item.source === 'apple';
  const isAudio = item.kind === 'audiobook';
  const freeAudio = isAudio && !store;
  const inLibrary = books.some(b => titleMatches(b.title, item.title) && (!b.author || authorMatches(b.author, item.author)));
  // Capa grande: a imagem do próprio item (melhor que a miniatura) quando já se sabe qual é
  const bigCover = details?.coverUrl || item.cover;
  const cover = coverFailed ? getGenericBookCover(item.title, item.author) : bigCover;
  useCoverColor(store ? item.cover : details?.coverUrl);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getItemDetails(item).then(d => { if (alive) { setDetails(d); setLoading(false); } }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; abortRef.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const askDownload = () => {
    if (!details?.m4b || progress !== null) return;
    const facts = [
      details.m4b.size ? formatSize(details.m4b.size) : '',
      details.runtime ? formatRuntime(details.runtime) : '',
      t('online_download_format'),
    ].filter(Boolean).join(' · ');
    window.dispatchEvent(new Event('close-all-popups'));
    setMobileConfirm({
      title: t('online_download_title', { title: item.title }),
      description: `${facts}. ${IS_INSTALLED_APP ? t('online_download_where_desktop') : t('online_download_where_web')} ${t('online_download_tip')}`,
      confirmLabel: t('online_download_confirm'),
      tone: 'accent',
      icon: <Download size={13} />,
      onConfirm: () => { void startDownload(); },
    });
  };

  const startDownload = async () => {
    if (!details?.m4b || progress !== null) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setProgress(0);
    try {
      const file = await downloadAudiobook(details, setProgress, ctrl.signal);
      window.dispatchEvent(new CustomEvent('import-audio-files', { detail: [file] }));
      showToast(t('online_download_done', { title: item.title }));
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') showToast(t('online_download_failed'));
    } finally {
      abortRef.current = null;
      setProgress(null);
    }
  };

  // Outras lojas (a busca pelo título e autor: elas não oferecem os dados de graça), cada uma com o próprio ícone
  const q = encodeURIComponent(`${item.title} ${item.author}`.trim());
  const otherStores = [
    { name: 'Amazon', icon: <FaAmazon size={14} />, url: `https://www.amazon.com.br/s?k=${q}${isAudio ? '&i=audible' : '&i=digital-text'}` },
    { name: 'Google Play', icon: <FaGooglePlay size={13} />, url: `https://play.google.com/store/search?q=${q}&c=books` },
    ...(isAudio ? [{ name: 'Audible', icon: <SiAudible size={15} />, url: `https://www.audible.com/search?keywords=${q}` }] : []),
  ];

  const typeLabel = store ? (isAudio ? t('online_type_store_audiobook') : t('online_type_store_ebook')) : isAudio ? t('online_type_audiobook') : t('online_type_ebook');
  const meta: { key: string; node: React.ReactNode }[] = [];
  meta.push({ key: 'type', node: <span>{typeLabel}</span> });
  if (store && item.price) meta.push({ key: 'price', node: <span className="font-semibold text-[var(--text-main)]">{item.price}</span> });
  if (item.genre) meta.push({ key: 'genre', node: <span>{item.genre}</span> });
  if (details?.runtime) meta.push({ key: 'duration', node: <span>{formatRuntime(details.runtime)}</span> });
  if (details?.year || item.year) meta.push({ key: 'year', node: <span>{details?.year || item.year}</span> });
  if (details?.narrator) meta.push({ key: 'narrator', node: <span>{t('narrated_by')}: <span className="font-semibold text-[var(--text-main)]">{details.narrator}</span></span> });
  if (item.language) meta.push({ key: 'language', node: <span>{t('language_label')}: <span className="font-semibold text-[var(--text-main)]">{getLanguageDisplayName(item.language, resolvedLanguage)}</span></span> });
  meta.push({ key: 'source', node: <span>{store ? 'Apple Books' : isAudio ? 'LibriVox' : 'Project Gutenberg'}</span> });

  // Selo da capa: na biblioteca, para baixar, online, ou o ícone da loja com o preço ("Para comprar" sem preço)
  const badge = (
    <>
      {inLibrary ? <Check size={13} /> : store ? <FaApple size={13} /> : isAudio ? <Download size={13} /> : <Globe size={13} />}
      <span>{inLibrary ? t('online_in_library') : store ? (item.price || t('online_badge_store')) : isAudio ? t('online_badge_download') : t('online_badge_online')}</span>
    </>
  );

  // Cada autor abre a própria página (a da biblioteca, se já houver)
  const authorNames = item.author.split(/\s*,\s*/).filter(Boolean);
  const authorLinks = authorNames.map((name, i) => (
    <React.Fragment key={name}>
      {i > 0 && ', '}
      <span role="link" tabIndex={0} onClick={() => window.dispatchEvent(new CustomEvent('open-online-author', { detail: name }))} className="hover:text-winblue transition-colors cursor-pointer">{name}</span>
    </React.Fragment>
  ));

  const metaRow = (center: boolean) => (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[var(--text-muted)] tracking-wide mt-2 ${center ? 'justify-center' : ''}`}>
      {meta.map((m, i) => (
        <React.Fragment key={m.key}>
          {i > 0 && <span className="text-[var(--text-muted)]/60">•</span>}
          {m.node}
        </React.Fragment>
      ))}
    </div>
  );

  const buttons = (
    <div className="flex flex-wrap items-center gap-3 pt-2 max-md:justify-center max-md:w-full">
      {store ? (
        <motion.button data-press="true" onClick={() => handleOpenExternalUrl(item.url)} className={primaryBtn}>
          <FaApple size={16} />
          <span className="whitespace-nowrap">{t('online_view_store')}</span>
        </motion.button>
      ) : freeAudio ? (
        inLibrary ? null : progress !== null ? (
          <>
            <button disabled className={primaryBtn}>
              <Loader2 size={16} className="animate-spin" />
              <span>{t('online_downloading', { pct: Math.round(progress * 100) })}</span>
            </button>
            <motion.button data-press="true" onClick={() => abortRef.current?.abort()} className={secondaryBtn} title={t('cancel')} aria-label={t('cancel')}>
              <X size={14} />
              <span className="max-md:hidden">{t('cancel')}</span>
            </motion.button>
          </>
        ) : (
          <motion.button data-press="true" onClick={askDownload} disabled={loading || !details?.m4b} className={primaryBtn}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="whitespace-nowrap">{t('online_download')}{details?.m4b?.size ? <span className="max-md:hidden">{` · ${formatSize(details.m4b.size)}`}</span> : null}</span>
          </motion.button>
        )
      ) : (
        <motion.button data-press="true" onClick={() => handleOpenExternalUrl(item.url)} className={primaryBtn}>
          <Globe size={16} />
          <span>{t('online_read')}</span>
        </motion.button>
      )}
      <div className="flex items-center justify-center gap-3 md:contents">
        {freeAudio && (
          <motion.button data-press="true" onClick={() => handleOpenExternalUrl(item.url)} className={secondaryBtn} title={t('online_open_site')} aria-label={t('online_open_site')}>
            <ExternalLink size={14} />
            <span className="max-md:hidden">{t('online_open_site')}</span>
          </motion.button>
        )}
        {!isAudio && !store && (
          <motion.button data-press="true" onClick={() => handleOpenExternalUrl(GENERATOR_URL)} className={secondaryBtn} title={t('online_convert_title')} aria-label={t('online_convert_title')}>
            <GeneratorGlyph size={14} className="shrink-0" />
            <span className="max-md:hidden">{t('online_convert_title')}</span>
          </motion.button>
        )}
        {store && otherStores.map(s => (
          <motion.button key={s.name} data-press="true" onClick={() => handleOpenExternalUrl(s.url)} className={secondaryBtn} title={t('online_search_store', { store: s.name })} aria-label={t('online_search_store', { store: s.name })}>
            {s.icon}
            <span className="max-md:hidden">{s.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const notes = (
    <>
      {freeAudio && !loading && !details?.m4b && !inLibrary && <p className="text-xs text-[var(--text-muted)] max-w-md">{t('online_no_file')}</p>}
      {!isAudio && !store && <p className="text-xs text-[var(--text-muted)] max-w-md">{t('online_convert_desc')}{IS_INSTALLED_APP ? '' : ` ${t('online_generator_desktop_only')}`}</p>}
      {store && <p className="text-xs text-[var(--text-muted)] max-w-md">{t('online_store_note')}</p>}
    </>
  );

  return (
    <motion.div key={`online-${item.id}`} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="flex flex-col gap-8 mt-4 relative w-full">
      {/* Celular: capa de ponta a ponta no topo, dissolvendo na tela com desfoque (como na página do audiobook) */}
      <div className="md:hidden relative mobile-bleed -mt-[calc(var(--app-header-top)+76px)]">
        <div className="relative w-full" style={{ height: 'min(150vw, 74dvh)' }}>
          <div className="absolute inset-x-0 top-0 -z-10 overflow-hidden pointer-events-none" style={{ height: 'calc(100% + 140px)' }}>
            <img src={cover} onError={() => setCoverFailed(true)} alt={item.title} className="absolute inset-0 w-full h-full object-cover" style={{ WebkitMaskImage: FADE_MAIN, maskImage: FADE_MAIN }} />
            <img src={cover} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110" style={{ WebkitMaskImage: FADE_TOP, maskImage: FADE_TOP }} />
            <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/45 to-transparent" />
            <img src={cover} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110" style={{ WebkitMaskImage: FADE_BASE, maskImage: FADE_BASE }} />
          </div>
          <div className="absolute inset-x-0 bottom-0 px-5 pb-4 flex flex-col items-center text-center text-[var(--text-main)]">
            <div className="h-7 px-3 mb-2 rounded-full bg-black/60 backdrop-blur-md flex items-center gap-1.5 shadow-lg text-white text-xs font-bold">{badge}</div>
            <h2 data-screen-title="true" className="text-[28px] font-bold leading-tight tracking-tight line-clamp-3">{item.title}</h2>
            {item.author && <p className="text-[15px] font-semibold text-[var(--text-main)]/80 mt-1 [text-shadow:0_1px_8px_rgba(0,0,0,0.25)]">{authorLinks}</p>}
            {metaRow(true)}
            <div className="mt-4 w-full">{buttons}</div>
          </div>
        </div>
      </div>
      <div className="md:hidden -mt-4 px-1 flex flex-col items-center text-center">{notes}</div>

      {/* Computador */}
      <div className="max-md:hidden flex flex-row items-center gap-8 w-full">
        <div className="relative shrink-0">
          <img src={cover} onError={() => setCoverFailed(true)} alt={item.title} className="w-[175px] h-[280px] rounded-3xl object-cover shadow-2xl shrink-0 aspect-[1/1.6]" />
          <div className="absolute top-3 left-3 z-10 h-7 px-3 rounded-full bg-black/60 backdrop-blur-md flex items-center gap-1.5 shadow-lg text-white pointer-events-none text-xs font-bold">{badge}</div>
        </div>
        <div className="flex flex-col justify-center space-y-4 flex-1 min-w-0">
          <div>
            <h2 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight [overflow-wrap:anywhere]">{item.title}</h2>
            {item.author && <h3 className="text-xl font-semibold text-[var(--text-muted)] mt-1">{authorLinks}</h3>}
            {metaRow(false)}
          </div>
          {buttons}
          {notes}
        </div>
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--text-main)]">{t('synopsis')}</h2>
        </div>
        {loading ? (
          <div className="space-y-2" aria-busy="true">
            {[92, 100, 84, 60].map((w, i) => <div key={i} className="h-3.5 rounded-full bg-[var(--ios-fill)] animate-pulse" style={{ width: `${w}%` }} />)}
          </div>
        ) : (
          <p className="text-[var(--text-main)]/90 text-sm leading-relaxed whitespace-pre-line select-text">
            {details?.description || <span className="text-[var(--text-muted)]">{t('online_no_synopsis')}</span>}
          </p>
        )}
      </div>
    </motion.div>
  );
}
