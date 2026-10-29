import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls, useMotionValue, useTransform, animate as animateValue, type HTMLMotionProps } from 'motion/react';
import { Play, Pause, ListPlus, Star, FileText, GripVertical, X, Trash2, Info, MoreHorizontal } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Audiobook } from '../data';
import { getGenericBookCover } from '../audioUtils';
import { useI18n } from '../translations';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function OptionsMenuPopover({ 
  item: _item, 
  type,
  onClose,
  onPlay,
  onEdit: _onEdit,
  onAddToQueue,
  isPlaying,
}: { 
  item: any; 
  type: 'book' | 'chapter'; 
  onClose: () => void;
  onPlay: () => void;
  onEdit?: () => void;
  onAddToQueue?: (position: 'next'|'last') => void;
  isPlaying: boolean;
}) {
  const { t } = useI18n();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute right-0 top-full mt-2 w-44 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[20px] shadow-2xl z-50 overflow-hidden p-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={() => { onPlay(); onClose(); }} className="w-full px-3 py-2 flex items-center gap-2.5 text-xs text-[var(--text-main)] rounded-2xl border border-transparent hover:bg-white/15 hover:text-white hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] transition-all">
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        <span>{isPlaying ? t('stop_listening') : t('listen')}</span>
      </button>
      <button onClick={() => { onAddToQueue?.('next'); onClose(); }} className="w-full px-3 py-2 flex items-center gap-2.5 text-xs text-[var(--text-main)] rounded-2xl hover:bg-[var(--button-secondary-bg)] transition-colors">
        <ListPlus size={14} />
        <span>{t('play_next')}</span>
      </button>
      <button onClick={() => { onAddToQueue?.('last'); onClose(); }} className="w-full px-3 py-2 flex items-center gap-2.5 text-xs text-[var(--text-main)] rounded-2xl hover:bg-[var(--button-secondary-bg)] transition-colors">
        <ListPlus size={14} />
        <span>{t('add_to_queue_end')}</span>
      </button>
      <button onClick={onClose} className="w-full px-3 py-2 flex items-center gap-2.5 text-xs text-[var(--text-main)] rounded-2xl hover:bg-[var(--button-secondary-bg)] transition-colors">
        <Star size={14} />
        <span>{t('favorite')}</span>
      </button>
      
      {type === 'book' && (
        <>
          <button onClick={onClose} className="w-full px-3 py-2 flex items-center gap-2.5 text-xs text-[var(--text-main)] rounded-2xl hover:bg-[var(--button-secondary-bg)] transition-colors">
            <FileText size={14} />
            <span>{t('go_to_author')}</span>
          </button>
        </>
      )}

      <button onClick={onClose} className="w-full px-3 py-2 flex items-center gap-2.5 text-xs text-[var(--text-main)] rounded-2xl hover:bg-[var(--button-secondary-bg)] transition-colors">
        <Info size={14} />
        <span>{t('information')}</span>
      </button>

      {type === 'book' && (
        <button onClick={onClose} className="w-full px-3 py-2 flex items-center gap-2.5 text-xs text-red-500 rounded-2xl hover:bg-red-500/10 transition-colors mt-1 pt-1">
          <Trash2 size={14} />
          <span>{t('delete')}</span>
        </button>
      )}
    </motion.div>
  );
}

export interface QueueItemRowProps {
  item: any;
  formatTime: (secs: number) => string;
  onPlay: () => void;
  onRemove: () => void;
  onViewBook: () => void;
  t: (key: string) => string;
}

export function QueueItemRow({
  item,
  formatTime,
  onPlay,
  onRemove,
  onViewBook,
  t,
}: QueueItemRowProps) {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const isActiveDrag = isDragging || isPointerDown;

  // ===== Toque (celular/tablet) =====
  // Segurar o item: ele "levanta" e pode ser movido na fila.
  // Arrastar para a esquerda: aparece o botão de remover; arrastar até o fim (ou tocar no botão) remove.
  const isTouch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
  const REMOVE_W = 84;
  const swipeX = useMotionValue(0);
  // O botão de remover surge conforme o item é arrastado
  const removeOpacity = useTransform(swipeX, [-REMOVE_W, -12, 0], [1, 0.15, 0]);
  const removeScale = useTransform(swipeX, [-REMOVE_W, 0], [1, 0.6]);
  const rowRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<{
    x: number; y: number; mode: 'pending' | 'swipe' | 'scroll' | 'drag'; timer: ReturnType<typeof setTimeout> | null; startX: number;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [swipeOpen, setSwipeOpen] = useState(false);
  const blockScroll = useCallback((e: TouchEvent) => { e.preventDefault(); }, []);
  const releaseScrollBlock = useCallback(() => {
    document.removeEventListener('touchmove', blockScroll);
  }, [blockScroll]);
  useEffect(() => () => releaseScrollBlock(), [releaseScrollBlock]);
  const settleSwipe = (open: boolean) => {
    setSwipeOpen(open);
    animateValue(swipeX, open ? -REMOVE_W : 0, { type: 'spring', stiffness: 520, damping: 42, mass: 0.6 });
  };
  const removeWithSwipe = () => {
    const w = rowRef.current?.offsetWidth || 360;
    animateValue(swipeX, -w, { duration: 0.18, ease: [0.32, 0, 0.67, 0] }).then(() => onRemove());
  };
  const onTouchPointerDown = (e: React.PointerEvent) => {
    if (!isTouch || e.pointerType === 'mouse') return;
    const native = e.nativeEvent;
    const g = { x: e.clientX, y: e.clientY, mode: 'pending' as const, timer: null as ReturnType<typeof setTimeout> | null, startX: swipeX.get() };
    g.timer = setTimeout(() => {
      const cur = gestureRef.current;
      if (!cur || cur.mode !== 'pending') return;
      cur.mode = 'drag';
      suppressClickRef.current = true;
      if (swipeOpen) settleSwipe(false);
      setIsPointerDown(true);
      navigator.vibrate?.(8);
      document.addEventListener('touchmove', blockScroll, { passive: false });
      dragControls.start(native, { snapToCursor: false });
    }, 380);
    gestureRef.current = g as any;
  };
  const onTouchPointerMove = (e: React.PointerEvent) => {
    const g = gestureRef.current;
    if (!g || g.mode === 'drag' || g.mode === 'scroll') return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.mode === 'pending') {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (g.timer) clearTimeout(g.timer);
      g.mode = Math.abs(dx) > Math.abs(dy) ? 'swipe' : 'scroll';
      if (g.mode === 'scroll') return;
      suppressClickRef.current = true;
    }
    // Só para a esquerda (com resistência além da largura do item)
    const next = Math.min(0, g.startX + dx);
    swipeX.set(next);
  };
  const onTouchPointerEnd = () => {
    const g = gestureRef.current;
    gestureRef.current = null;
    if (!g) return;
    if (g.timer) clearTimeout(g.timer);
    if (g.mode === 'drag') {
      releaseScrollBlock();
      setIsPointerDown(false);
      return;
    }
    if (g.mode === 'swipe') {
      const x = swipeX.get();
      const w = rowRef.current?.offsetWidth || 360;
      if (x < -w * 0.55) removeWithSwipe();
      else settleSwipe(x < -REMOVE_W / 2);
    }
  };

  useEffect(() => {
    if (isPointerDown) {
      const handlePointerUp = () => setIsPointerDown(false);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      return () => {
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
    }
  }, [isPointerDown]);

  return (
    <Reorder.Item
      key={item.id}
      value={item}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      initial={{ opacity: 0, height: 0, scale: 0.96 }}
      animate={{ opacity: 1, height: "auto", scale: 1 }}
      exit={{ opacity: 0, height: 0, scale: 0.96 }}
      transition={{
        height: { type: "spring", stiffness: 480, damping: 36, mass: 0.55 },
        opacity: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
        scale: { type: "spring", stiffness: 480, damping: 36, mass: 0.55 },
        layout: { type: "spring", stiffness: 480, damping: 36, mass: 0.55 },
      }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        setIsDragging(false);
        setIsPointerDown(false);
        releaseScrollBlock();
      }}
      onPointerDown={onTouchPointerDown}
      onPointerMove={onTouchPointerMove}
      onPointerUp={onTouchPointerEnd}
      onPointerCancel={onTouchPointerEnd}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        if (swipeOpen) {
          settleSwipe(false);
          return;
        }
        if (!isDragging) {
          onPlay();
        }
      }}
      className={`relative select-none shrink-0 ${
        isActiveDrag ? 'z-30 overflow-visible' : 'overflow-hidden'
      }`}
      style={{ touchAction: isTouch ? 'pan-y' : 'none', WebkitTouchCallout: 'none' }}
    >
      <div className="pt-1.5 relative" ref={rowRef}>
        {isTouch && (
          <div className="absolute inset-y-0 top-1.5 right-0 flex items-center justify-end pr-5 pointer-events-none" style={{ width: REMOVE_W + 40 }}>
            <motion.button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeWithSwipe(); }}
              className="pointer-events-auto w-11 h-11 shrink-0 rounded-full flex items-center justify-center bg-card/75 border border-red-500/25 text-red-500 shadow-md backdrop-blur-3xl"
              style={{ opacity: removeOpacity, scale: removeScale }}
              aria-label={t('remove_from_queue')}
              title={t('remove_from_queue')}
            >
              <X size={18} />
            </motion.button>
          </div>
        )}
        <motion.div
          style={{ x: swipeX }}
          className={`group relative flex items-center gap-3 p-2 rounded-2xl cursor-pointer transition-colors duration-150 ${
            isActiveDrag 
              ? 'bg-[var(--button-secondary-bg)] shadow-xl' 
              : 'bg-transparent hover:bg-[var(--button-secondary-bg)]/60'
          }`}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (!isDragging) onPlay();
            }}
            className="group/cover relative shrink-0 w-7 h-11 aspect-[1/1.6] rounded-lg overflow-hidden shadow-sm cursor-pointer"
            title={t('play') || 'Reproduzir'}
          >
            <img
              src={item.cover || getGenericBookCover(item.bookTitle || item.book?.title, item.author || item.book?.author)}
              onError={(e) => {
                const fallback = getGenericBookCover(item.bookTitle || item.book?.title, item.author || item.book?.author);
                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
              }}
              alt=""
              className="w-full h-full aspect-[1/1.6] rounded-lg object-cover"
            />
            <div className="absolute inset-0 bg-black/20 dark:bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity duration-200 pointer-events-none">
              <div className="relative flex items-center justify-center transition-transform duration-200 group-hover/cover:scale-125">
                <div className="absolute w-4 h-4 rounded-full bg-slate-400/80 dark:bg-white/55 blur-[5px] pointer-events-none group-hover/cover:bg-slate-500/90 dark:group-hover/cover:bg-white/80 group-hover/cover:blur-[7px] transition-all duration-200" />
                <Play 
                  size={13} 
                  className="relative fill-black text-black dark:fill-white dark:text-white drop-shadow-[0_0_6px_rgba(100,116,139,0.85)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,1)] translate-x-[0.5px]" 
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden min-w-0 pr-18 cursor-pointer">
            <p 
              onClick={(e) => {
                e.stopPropagation();
                onViewBook();
              }}
              className="text-xs font-bold text-[var(--text-main)] truncate w-fit max-w-full hover:text-winblue cursor-pointer transition-colors"
              title={t('view_chapter_in_book') || 'Ver capítulo na página do audiobook'}
            >
              {item.chapterTitle}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
              {item.bookTitle}
            </p>
          </div>

          <span className={`text-[10px] text-[var(--text-muted)] shrink-0 mr-1 pointer-events-none transition-opacity ${
            isTouch ? '' : isActiveDrag ? 'opacity-0' : 'group-hover:opacity-0'
          }`}>
            {formatTime(item.duration)}
          </span>

          {/* Computador: botões de mover e remover ao passar o mouse (no toque: segurar para mover, deslizar para remover) */}
          {!isTouch && <div 
            className={`absolute right-2 flex items-center gap-1.5 transition-opacity z-20 pointer-events-none ${
              isActiveDrag ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsPointerDown(true);
                dragControls.start(e);
              }}
              className={`w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-3xl border text-slate-800 dark:text-white cursor-grab active:cursor-grabbing transition-all duration-200 select-none touch-none pointer-events-auto ${
                isActiveDrag 
                  ? 'scale-115 border-slate-500 dark:border-white/70 shadow-md dark:shadow-[0_0_16px_rgba(255,255,255,0.75)] bg-slate-300/90 dark:bg-white/25' 
                  : 'bg-slate-200/80 hover:bg-slate-300/90 dark:bg-[var(--bg-card-75)] dark:hover:bg-white/25 border-slate-300 dark:border-white/25 hover:border-slate-400 dark:hover:border-white/60 hover:scale-115 shadow-sm hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.5)] active:scale-110'
              }`}
              style={{ touchAction: 'none' }}
              title={t('reorder') || 'Mover na fila'}
            >
              <GripVertical size={13} className="text-slate-800 dark:text-white" />
            </button>

            <motion.button 
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }} 
              className="w-7 h-7 flex items-center justify-center rounded-full bg-card/75 border border-red-500/25 text-red-500 shadow-md hover:bg-red-500/20 hover:border-red-400/50 hover:shadow-[0_0_12px_rgba(239,68,68,0.35)] transition-all backdrop-blur-3xl cursor-pointer pointer-events-auto"
              title={t('remove_from_queue')}
            >
              <X size={13} />
            </motion.button>
          </div>}
        </motion.div>
      </div>
    </Reorder.Item>
  );
}

export function MenuOptionItem({
  icon,
  children,
  onClick,
  danger = false,
  variant,
  immediate = false,
  className = ""
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick: (e?: any) => void;
  danger?: boolean;
  variant?: 'default' | 'danger' | 'play' | 'favorite';
  immediate?: boolean;
  className?: string;
}) {
  const [clicked, setClicked] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (immediate) {
      onClick(e);
      return;
    }
    if (clicked) return;
    // A ação acontece na hora; o destaque do clique continua visível enquanto o pop-up se fecha
    setClicked(true);
    onClick(e);
    setTimeout(() => setClicked(false), 180);
  };

  const textContent = typeof children === 'string'
    ? children
    : (Array.isArray(children) ? children : [children])
        .map((c: any) => (typeof c === 'string' ? c : (c?.props?.children || '')))
        .join(' ');
  const lower = textContent.toLowerCase();

  const isDanger = danger || variant === 'danger' || lower.includes('excluir') || lower.includes('apagar');

  const variantClasses = isDanger
    ? (clicked
        ? "bg-red-500/20 text-red-500 ring-1 ring-red-500/40 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
        : "text-red-500 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)]")
    : (clicked
        ? "bg-slate-400/25 text-slate-900 ring-1 ring-slate-400/40 border-slate-400/30 shadow-[0_0_12px_rgba(100,116,139,0.3)] dark:bg-white/20 dark:text-white dark:ring-white/30 dark:border-white/30 dark:shadow-[0_0_12px_rgba(255,255,255,0.2)]"
        : "text-[var(--text-main)] hover:bg-white/15 hover:text-white hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]");

  return (
    <motion.button
      animate={clicked ? { scale: 1.03 } : { scale: 1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 650, damping: 32, mass: 0.45 }}
      onClick={handleClick}
      className={cn(
        "group w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium rounded-2xl transition-all duration-150 select-none text-left border border-transparent [&_svg]:transition-colors [&_svg]:shrink-0",
        variantClasses,
        className
      )}
    >
      {icon && (
        <span className="shrink-0 flex items-center justify-center text-inherit [&_svg]:text-inherit [&_svg]:stroke-current">
          {icon}
        </span>
      )}
      {children}
    </motion.button>
  );
}

// ===== Pop-ups no celular: no máximo 6 opções por vez =====
// Com mais opções, a 6ª vira "Mais opções", que troca a lista pelas seguintes; na última página,
// "Mais opções" volta para as primeiras (ou para a lista anterior, quando há uma — onBackToParent).
// No computador (ou com poucas opções) a lista aparece inteira.
const COMPACT_POPUP_QUERY = '(max-width: 1023px)';
function subscribeCompactPopup(cb: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia(COMPACT_POPUP_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
function getCompactPopup() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(COMPACT_POPUP_QUERY).matches;
}
export function useCompactPopups(): boolean {
  return React.useSyncExternalStore(subscribeCompactPopup, getCompactPopup, () => false);
}

function flattenOptions(children: React.ReactNode): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (child === null || child === undefined || child === false || child === true || child === '') return;
    if (React.isValidElement(child) && child.type === React.Fragment) {
      out.push(...flattenOptions((child.props as any).children));
      return;
    }
    if (typeof child === 'string' && !child.trim()) return;
    out.push(child);
  });
  return out;
}

export const MAX_POPUP_OPTIONS = 6;

export function PagedMenu({
  children,
  className = "",
  onBackToParent,
  max = MAX_POPUP_OPTIONS,
}: {
  children: React.ReactNode;
  className?: string;
  onBackToParent?: () => void;
  max?: number;
}) {
  const { t } = useI18n();
  const compact = useCompactPopups();
  const [page, setPage] = useState(0);
  // Troca de página igual à troca de conteúdo dos pop-ups (ex.: opções -> "Ordenar por"): a altura muda
  // com a mola elástica, as opções antigas se dissolvem e as novas surgem do desfoque
  const wrapRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const height = useMotionValue<number | 'auto'>('auto');
  const fromHeightRef = useRef<number | null>(null);
  const [morphing, setMorphing] = useState(false);
  const goToPage = (next: number) => {
    fromHeightRef.current = wrapRef.current?.offsetHeight ?? null;
    setPage(next);
  };
  useLayoutEffect(() => {
    const from = fromHeightRef.current;
    const el = pageRef.current;
    if (from === null || !el) return;
    fromHeightRef.current = null;
    const to = el.offsetHeight;
    if (Math.abs(to - from) < 2) return;
    height.set(from);
    setMorphing(true);
    const controls = animateValue(height, to, MORPH_BOUNCE_SPRING);
    controls.then(() => { height.set('auto'); setMorphing(false); });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const items = flattenOptions(children);
  const needsPaging = compact && (items.length > max || Boolean(onBackToParent));
  if (!needsPaging) {
    return <div className={className}>{children}</div>;
  }
  const perPage = Math.max(1, max - 1);
  const pages: React.ReactNode[][] = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  if (pages.length === 0) pages.push([]);
  const current = Math.min(page, pages.length - 1);
  const isLast = current >= pages.length - 1;
  return (
    <motion.div
      ref={wrapRef}
      data-paged-morphing={morphing ? 'true' : undefined}
      style={{ height, position: 'relative', overflow: morphing ? 'hidden' : undefined }}
    >
      <AnimatePresence initial={false} custom={{}}>
        <motion.div
          key={`page-${current}`}
          ref={pageRef}
          variants={popupMorphContentVariants}
          custom={{}}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] },
            filter: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
            scale: MORPH_BOUNCE_SPRING,
          }}
          className="w-full"
        >
          <div className={className}>
            {pages[current]}
            <MenuOptionItem
              immediate
              icon={<MoreHorizontal size={14} />}
              onClick={() => {
                if (!isLast) { goToPage(current + 1); return; }
                if (onBackToParent) { onBackToParent(); return; }
                goToPage(0);
              }}
            >
              <span>{t('more_options')}</span>
            </MenuOptionItem>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ===== Morph "botão → pop-up" (estilo Apple) =====
// O pop-up nasce exatamente no retângulo do botão que o abriu (mesmo canto ancorado) e se expande
// até o tamanho final via clip-path; ao fechar, encolhe de volta para o botão. Sem distorcer o conteúdo.
// Molas dos menus no estilo do iOS 26: o botão "se estica" até virar o menu com uma leve ultrapassagem
// (efeito líquido) e, ao fechar, o menu se recolhe de volta para dentro do botão
export const MORPH_SPRING = { type: "spring" as const, stiffness: 170, damping: 21, mass: 1 };
export const MORPH_BOUNCE_SPRING = { type: "spring" as const, stiffness: 190, damping: 17, mass: 1 };
export const MORPH_EXIT_SPRING = { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.9 };
// Momento (s) em que o pop-up, já encolhido no formato do botão, passa o lugar para ele (troca cruzada)
export const MORPH_HANDOFF = { at: 0.26, fade: 0.12 };
// Margem negativa para não cortar a sombra do pop-up depois de aberto
export const MORPH_EXPANDED_CLIP = 'inset(calc(0% + -80px) calc(0% + -80px) calc(0% + -80px) calc(0% + -80px) round 100px)';

export function getButtonMorphClip(
  width: number,
  height: number,
  alignRight: boolean,
  openUp: boolean,
  radius?: number,
  offsetX?: number
): string {
  const r = radius ?? Math.min(width, height) / 2;
  const near = 'calc(0% + 0px)';
  const farX = `calc(100% + -${Math.round(width)}px)`;
  const farY = `calc(100% + -${Math.round(height)}px)`;
  const top = openUp ? farY : near;
  const bottom = openUp ? near : farY;
  let left = alignRight ? farX : near;
  let right = alignRight ? near : farX;
  // Botão que não está num canto: deslocamento horizontal a partir da borda esquerda do pop-up
  if (offsetX !== undefined) {
    left = `calc(0% + ${Math.round(offsetX)}px)`;
    right = `calc(100% + -${Math.round(offsetX + width)}px)`;
  }
  return `inset(${top} ${right} ${bottom} ${left} round ${Math.round(r)}px)`;
}

function inferMorphCorner(style?: React.CSSProperties | any, className?: string) {
  const origin = String(style?.transformOrigin ?? '');
  const cls = className || '';
  const openUp = (style && style.bottom !== undefined && style.top === undefined)
    || /(^|\s)bottom-0(\s|$)/.test(cls)
    || origin.includes('bottom');
  const alignRight = (style && style.right !== undefined && style.left === undefined)
    || /(^|\s)right-0(\s|$)/.test(cls)
    || origin.includes('right')
    || origin.startsWith('calc(100%');
  return { openUp: Boolean(openUp), alignRight: Boolean(alignRight) };
}

export function getButtonMorphMotion(opts: {
  originWidth: number;
  originHeight: number;
  alignRight: boolean;
  openUp: boolean;
  originRadius?: number;
  originOffsetX?: number;
}) {
  const collapsed = getButtonMorphClip(opts.originWidth, opts.originHeight, opts.alignRight, opts.openUp, opts.originRadius, opts.originOffsetX);
  return {
    // A forma (clip) parte exatamente do tamanho e do lugar do botão (escala 1: menor que ele, parecia um
    // pop-up abrindo por cima do botão) e cresce com a mola, com o leve "overshoot" elástico do iOS
    initial: { clipPath: collapsed, scale: 1, opacity: 0 },
    animate: { clipPath: MORPH_EXPANDED_CLIP, scale: 1, opacity: 1 },
    // Fechar: a forma encolhe até ficar exatamente do tamanho do botão e só então se dissolve nele
    // (o botão reaparece no mesmo instante, ver morphTriggerAnimate)
    exit: {
      clipPath: collapsed,
      scale: 1,
      opacity: 0,
      transition: {
        clipPath: MORPH_EXIT_SPRING,
        scale: MORPH_EXIT_SPRING,
        opacity: { duration: MORPH_HANDOFF.fade, delay: MORPH_HANDOFF.at },
      },
    },
    transition: {
      clipPath: MORPH_SPRING,
      scale: MORPH_BOUNCE_SPRING,
      opacity: { duration: 0.12, ease: "easeOut" as const },
    },
  };
}

// Conteúdo do pop-up: surge do desfoque com um leve zoom (e some desfocando antes da forma encolher)
export const MORPH_CONTENT_MOTION = {
  initial: { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: {
    opacity: 0,
    scale: 0.92,
    filter: 'blur(8px)',
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  },
  transition: {
    opacity: { duration: 0.22, delay: 0.06, ease: "easeOut" as const },
    filter: { duration: 0.28, delay: 0.04, ease: "easeOut" as const },
    scale: MORPH_BOUNCE_SPRING,
  },
};

// Variante de animação do botão gatilho: some quando o pop-up assume o lugar dele e volta quando o pop-up encolhe
// O botão cresce um pouco enquanto se funde no menu que nasce dele; ao fechar, ressurge do menu recolhido
export function morphTriggerAnimate(isOpen: boolean) {
  return isOpen
    // Ao abrir, o botão dá lugar à forma do pop-up que nasce exatamente sobre ele (sem crescer à parte)
    ? { opacity: 0, scale: 1, pointerEvents: 'none' as const, transition: { opacity: { duration: 0.1 }, scale: { duration: 0 } } }
    // Ao fechar, o botão reaparece quando o pop-up termina de encolher no formato dele: os dois se cruzam
    // (um surge enquanto o outro some), sem um instante vazio que faria o botão piscar
    : { opacity: 1, scale: 1, pointerEvents: 'auto' as const, transition: { opacity: { duration: MORPH_HANDOFF.fade, delay: MORPH_HANDOFF.at - 0.04 }, scale: { duration: 0 } } };
}

type MorphPopupProps = Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'> & {
  anchor?: HTMLElement | null;
  originWidth?: number;
  originHeight?: number;
  originRadius?: number;
  originOffsetX?: number;
  openUp?: boolean;
  alignRight?: boolean;
};

export const MorphPopup = React.forwardRef<HTMLDivElement, MorphPopupProps>(function MorphPopup(
  { anchor, originWidth, originHeight, originRadius, originOffsetX, openUp, alignRight, style, className, ...rest },
  ref
) {
  const corner = inferMorphCorner(style, className);
  const morph = getButtonMorphMotion({
    originWidth: originWidth ?? anchor?.offsetWidth ?? 36,
    originHeight: originHeight ?? anchor?.offsetHeight ?? 36,
    alignRight: alignRight ?? corner.alignRight,
    openUp: openUp ?? corner.openUp,
    originRadius,
    originOffsetX,
  });
  const { children, ...motionRest } = rest;
  // O wrapper herda o layout do pop-up (coluna, gap, alinhamento) para não alterar o conteúdo
  const layoutClasses = (className || '')
    .split(/\s+/)
    .filter(c => /^(gap-|gap-x-|gap-y-|items-|justify-|text-left|text-right|rtl:text-)/.test(c))
    .join(' ');
  return (
    <motion.div ref={ref} {...morph} style={style} className={className} {...motionRest}>
      <motion.div
        {...MORPH_CONTENT_MOTION}
        style={{ transformOrigin: style?.transformOrigin }}
        className={cn("flex flex-col min-h-0 flex-1 w-full", layoutClasses)}
      >
        {children as React.ReactNode}
      </motion.div>
    </motion.div>
  );
});

// ===== Abertura estilo "abrir app no iOS" =====
// O card tocado informa seu retângulo; o App expande uma camada a partir dele até a área de conteúdo
export interface ZoomOriginDetail {
  rect: { left: number; top: number; width: number; height: number };
  image?: string;
  radius: number;
  // Identifica o card (data-zoom-key) para a animação inversa ao voltar
  key?: string;
}

export function emitZoomOrigin(el: Element | null | undefined, image?: string, radius = 24, key?: string) {
  if (!el || typeof window === 'undefined') return;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return;
  window.dispatchEvent(new CustomEvent<ZoomOriginDetail>('zoom-origin', {
    detail: { rect: { left: r.left, top: r.top, width: r.width, height: r.height }, image, radius, key },
  }));
}

// Troca de conteúdo como nos menus do iOS: o pop-up se reforma (tamanho com mola) enquanto o conteúdo
// antigo se dissolve com leve desfoque e o novo surge do mesmo jeito, sem deslizar para os lados
export const popupMorphContentVariants = {
  enter: (_custom: any) => ({
    opacity: 0,
    scale: 0.96,
    x: 0,
    filter: 'blur(6px)',
    position: 'relative' as const,
  }),
  center: {
    opacity: 1,
    scale: 1,
    x: 0,
    filter: 'blur(0px)',
    position: 'relative' as const,
  },
  exit: (custom: any) => {
    const openUp = typeof custom === 'object' ? Boolean(custom?.openUp) : false;
    const alignRight = typeof custom === 'object' ? Boolean(custom?.alignRight) : false;
    return {
      opacity: 0,
      scale: 1.03,
      x: 0,
      filter: 'blur(6px)',
      position: 'absolute' as const,
      ...(openUp ? { bottom: 0 } : { top: 0 }),
      ...(alignRight ? { right: 0 } : { left: 0 }),
      pointerEvents: 'none' as const,
    };
  },
};

export function MorphMeasuredContent({
  itemKey,
  activeKeyRef,
  onResize,
  style,
  className,
  children,
}: {
  itemKey: string;
  activeKeyRef: React.MutableRefObject<string>;
  onResize: (height: number) => void;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (activeKeyRef.current !== itemKey) return;
      const h = el.offsetHeight;
      if (h > 0) {
        onResizeRef.current(h);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [itemKey, activeKeyRef]);

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}

export function PopupMorphContainer({
  activeKey,
  direction,
  targetWidth,
  targetRadius = 24,
  openUp,
  style,
  className = "",
  children,
  ambientBg,
  originWidth = 32,
  originHeight = 32,
}: {
  activeKey: string;
  direction: 1 | -1;
  targetWidth: number;
  targetRadius?: number;
  openUp?: boolean;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
  ambientBg?: React.ReactNode;
  originWidth?: number;
  originHeight?: number;
}) {
  // Celular: menus mais largos (sem quebrar o texto das opções) e com cantos bem arredondados, como no iOS
  const compactPopup = useCompactPopups();
  if (compactPopup && typeof window !== 'undefined') {
    targetWidth = Math.min(Math.max(targetWidth, 290), window.innerWidth - 32);
    targetRadius = Math.max(targetRadius, 30);
  } else if (typeof window !== 'undefined') {
    // Computador: 20% mais largos, para os textos das opções não quebrarem linha
    targetWidth = Math.min(Math.round(targetWidth * 1.2), window.innerWidth - 32);
  }
  // Mesmo critério do MorphPopup: considera right/bottom do style (getButtonCoverPopupStyle) e o transformOrigin
  const inferredCorner = inferMorphCorner(style, className);
  const isOpeningUp = openUp !== undefined ? openUp : inferredCorner.openUp;
  const isAlignRight = inferredCorner.alignRight;

  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;
  const prevKeyRef = useRef(activeKey);
  const lastHeightRef = useRef<number | 'auto'>('auto');
  const isKeyMorphingRef = useRef(false);
  const [morphHeight, setMorphHeight] = useState<number | 'auto'>('auto');
  const [isKeyMorphing, setIsKeyMorphing] = useState(false);
  const [enableWidthSpring, setEnableWidthSpring] = useState(false);

  const justChangedKey = prevKeyRef.current !== activeKey;
  if (justChangedKey) {
    isKeyMorphingRef.current = true;
  }

  const handleChildResize = useCallback((h: number) => {
    lastHeightRef.current = h;
    setMorphHeight(prev => (prev === h ? prev : h));
  }, []);

  useLayoutEffect(() => {
    if (prevKeyRef.current !== activeKey) {
      prevKeyRef.current = activeKey;
      isKeyMorphingRef.current = true;
      setIsKeyMorphing(true);
      const timer = setTimeout(() => {
        isKeyMorphingRef.current = false;
        setIsKeyMorphing(false);
      }, 560);
      return () => clearTimeout(timer);
    }
  }, [activeKey]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEnableWidthSpring(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const outerStyle: React.CSSProperties = {
    '--winblue': 'var(--app-winblue, #0086F0)',
    '--winblue-rgb': 'var(--app-winblue-rgb, 0, 134, 240)',
    '--color-winblue': 'var(--app-winblue, #0086F0)',
    ...style,
  } as React.CSSProperties;
  delete outerStyle.width;

  // Abre a partir do botão de três pontinhos (mesmo canto ancorado) e fecha de volta nele
  const openMorph = getButtonMorphMotion({
    originWidth,
    originHeight,
    alignRight: isAlignRight,
    openUp: isOpeningUp,
  });

  const animatedHeight = justChangedKey
    ? lastHeightRef.current
    : isKeyMorphing
      ? morphHeight
      : 'auto';

  return (
    <motion.div
      data-popup-content="true"
      initial={{ ...openMorph.initial, borderRadius: targetRadius }}
      animate={{ ...openMorph.animate, borderRadius: targetRadius }}
      exit={openMorph.exit}
      transition={{
        ...openMorph.transition,
        borderRadius: MORPH_SPRING,
      }}
      style={outerStyle}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] shadow-2xl flex flex-col text-left overflow-hidden",
        className
      )}
    >
      {ambientBg}
      <motion.div
        initial={MORPH_CONTENT_MOTION.initial}
        exit={MORPH_CONTENT_MOTION.exit}
        style={{ transformOrigin: outerStyle.transformOrigin }}
        animate={{ ...MORPH_CONTENT_MOTION.animate, width: targetWidth, height: animatedHeight }}
        transition={{
          ...MORPH_CONTENT_MOTION.transition,
          width: enableWidthSpring ? MORPH_BOUNCE_SPRING : { duration: 0 },
          height:
            !justChangedKey && isKeyMorphing
              ? MORPH_BOUNCE_SPRING
              : { duration: 0 },
        }}
        className="relative z-10 overflow-hidden will-change-[width,height]"
      >
        <AnimatePresence initial={false} custom={{ dir: direction, openUp: isOpeningUp, alignRight: isAlignRight }}>
          <motion.div
            key={activeKey}
            variants={popupMorphContentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              opacity: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] },
              filter: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
              scale: MORPH_BOUNCE_SPRING,
              x: MORPH_SPRING,
            }}
            className="w-full"
          >
            <MorphMeasuredContent
              itemKey={activeKey}
              activeKeyRef={activeKeyRef}
              onResize={handleChildResize}
              style={{ width: `${targetWidth}px` }}
            >
              {children}
            </MorphMeasuredContent>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export const subMorphVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    scale: 0.97,
    y: dir > 0 ? -5 : 5,
    position: 'relative' as const,
  }),
  center: {
    opacity: 1,
    scale: 1,
    y: 0,
    position: 'relative' as const,
  },
  exit: (dir: number) => ({
    opacity: 0,
    scale: 0.97,
    y: dir > 0 ? 5 : -5,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: 'none' as const,
  }),
};

export function SmoothSubMorph({
  activeKey,
  direction = 1,
  className = "",
  children,
}: {
  activeKey: string;
  direction?: 1 | -1;
  className?: string;
  children: React.ReactNode;
}) {
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;
  const [prevKey, setPrevKey] = useState(activeKey);
  const [isMorphing, setIsMorphing] = useState(false);
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const [enableSpring, setEnableSpring] = useState(false);
  // A troca é percebida já na renderização: o primeiro quadro mantém a altura anterior (sem mostrar o
  // tamanho novo por um instante antes de animar)
  if (prevKey !== activeKey) {
    setPrevKey(activeKey);
    setIsMorphing(true);
  }

  const handleResize = useCallback((h: number) => {
    setHeight(prev => (prev === h ? prev : h));
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEnableSpring(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!isMorphing) return;
    const t = setTimeout(() => setIsMorphing(false), 240);
    return () => clearTimeout(t);
  }, [isMorphing, activeKey]);

  return (
    <motion.div
      animate={{ height: isMorphing ? height : 'auto' }}
      transition={
        enableSpring
          ? { height: { type: "spring", stiffness: 520, damping: 38, mass: 0.55 } }
          : { height: { duration: 0 } }
      }
      // Grade com uma célula: o conteúdo que sai e o que entra ficam sobrepostos (a altura nunca soma os dois,
      // o que fazia o pop-up dar um salto de um quadro ao trocar de conteúdo)
      className={cn("relative w-full shrink-0 grid", isMorphing ? "overflow-hidden" : "overflow-visible", className)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={activeKey}
          custom={direction}
          variants={subMorphVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: { duration: 0.14, ease: [0.22, 1, 0.36, 1] },
            scale: { type: "spring", stiffness: 520, damping: 38, mass: 0.55 },
            y: { type: "spring", stiffness: 520, damping: 38, mass: 0.55 },
          }}
          style={{ gridArea: '1 / 1' }}
          className="w-full overflow-visible"
        >
          <MorphMeasuredContent
            itemKey={activeKey}
            activeKeyRef={activeKeyRef}
            onResize={handleResize}
            className="w-full overflow-visible"
          >
            {children}
          </MorphMeasuredContent>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export function checkChapterMenuShouldOpenUp(bottomCoord: number, requiredSpace: number = 320): boolean {
  if (typeof window === 'undefined') return false;
  const miniEl = document.getElementById('mini-player');
  let bottomLimit = window.innerHeight - 12;
  if (miniEl) {
    const mRect = miniEl.getBoundingClientRect();
    if (mRect.top > 0 && mRect.top < window.innerHeight && mRect.height > 0) {
      bottomLimit = mRect.top - 8;
    }
  }
  return (bottomLimit - bottomCoord < requiredSpace) || (bottomCoord > bottomLimit * 0.55);
}

export function checkIsLeftEdgeCard(triggerEl: HTMLElement | null): boolean {
  if (!triggerEl || typeof window === 'undefined') return false;

  const cardEl = triggerEl.classList.contains('group') ? triggerEl : (triggerEl.closest('[class*="group"]') as HTMLElement) || (triggerEl.closest('.group') as HTMLElement);
  const rect = triggerEl.getBoundingClientRect();

  if (cardEl && cardEl.parentElement) {
    const cardRect = cardEl.getBoundingClientRect();
    const parentRect = cardEl.parentElement.getBoundingClientRect();
    if ((cardRect.left - parentRect.left) < 55) {
      return true;
    }
  }

  const sidebarEl = typeof document !== 'undefined' ? document.querySelector('aside') : null;
  let minLeftBoundary = 16;
  if (sidebarEl) {
    const sRect = sidebarEl.getBoundingClientRect();
    if (sRect.width > 0 && sRect.right > 0 && sRect.right < window.innerWidth) {
      minLeftBoundary = sRect.right + 12;
    }
  }

  const maxTransformWidth = 320;
  if ((rect.right - maxTransformWidth) < minLeftBoundary) {
    return true;
  }

  const contentWidth = window.innerWidth - minLeftBoundary;
  if ((rect.left - minLeftBoundary) < contentWidth * 0.3) {
    return true;
  }

  return false;
}

export function getSmartPopupStyle(
  triggerEl: HTMLElement | null,
  width: number = 224,
  height: number = 280,
  maxPotentialWidth?: number,
  maxPotentialHeight?: number,
  preferredAlign: 'auto' | 'left' | 'right' = 'auto'
): React.CSSProperties {
  if (!triggerEl || typeof window === 'undefined') {
    return { position: 'fixed', zIndex: 9999, width: `${width}px` };
  }

  const rect = triggerEl.getBoundingClientRect();
  const margin = 12;

  const sidebarEl = typeof document !== 'undefined' ? document.querySelector('aside') : null;
  const isInsideSidebar = sidebarEl ? sidebarEl.contains(triggerEl) : false;
  let leftBoundary = margin;
  if (!isInsideSidebar && sidebarEl) {
    const sRect = sidebarEl.getBoundingClientRect();
    if (sRect.width > 0 && sRect.right > 0 && sRect.right < window.innerWidth) {
      if (rect.left >= sRect.right - 8) {
        leftBoundary = sRect.right + 8;
      }
    }
  }
  const rightBoundary = window.innerWidth - margin;

  const miniplayerEl = typeof document !== 'undefined' ? document.getElementById('mini-player') : null;
  const isInsideMiniplayer = miniplayerEl ? miniplayerEl.contains(triggerEl) : false;

  let bottomBoundary: number;
  if (isInsideMiniplayer) {
    bottomBoundary = rect.top - 6;
  } else if (miniplayerEl) {
    const mRect = miniplayerEl.getBoundingClientRect();
    bottomBoundary = mRect.top > 0 && mRect.top < window.innerHeight && mRect.height > 0
      ? mRect.top - 8
      : window.innerHeight - margin;
  } else {
    bottomBoundary = window.innerHeight - margin;
  }

  const topBoundary = margin;
  const checkHeight = Math.max(height, maxPotentialHeight || height);
  const checkWidth = Math.max(width, maxPotentialWidth || width);

  let top: number;
  let originY: 'top' | 'bottom' = 'top';

  if (isInsideMiniplayer) {
    top = Math.max(topBoundary, rect.top - height - 8);
    originY = 'bottom';
  } else {
    const spaceBelow = bottomBoundary - rect.bottom - 6;
    const spaceAbove = rect.top - topBoundary - 6;

    let openUp = false;
    if (spaceBelow < checkHeight + 8) {
      openUp = true;
    } else if (spaceAbove >= checkHeight && (rect.bottom > bottomBoundary * 0.55 || rect.top > window.innerHeight * 0.55)) {
      openUp = true;
    } else if (spaceBelow < spaceAbove && spaceAbove >= checkHeight) {
      openUp = true;
    } else if (spaceBelow < checkHeight && spaceAbove > spaceBelow) {
      openUp = true;
    }

    if (openUp) {
      top = Math.max(topBoundary, rect.top - height - 6);
      originY = 'bottom';
    } else {
      top = rect.bottom + 6;
      if (top + height > bottomBoundary) {
        top = Math.max(topBoundary, bottomBoundary - height);
      }
      originY = 'top';
    }
  }

  let left: number;
  let originX: 'left' | 'right' = 'right';

  const alignRightLeft = rect.right - width;
  const alignLeftLeft = rect.left;

  if (preferredAlign === 'left') {
    if (alignLeftLeft >= leftBoundary && alignLeftLeft + checkWidth <= rightBoundary) {
      left = alignLeftLeft;
      originX = 'left';
    } else if (rect.right - checkWidth >= leftBoundary && rect.right <= rightBoundary) {
      left = alignRightLeft;
      originX = 'right';
    } else {
      left = Math.min(Math.max(leftBoundary, rect.left), rightBoundary - width);
      originX = 'left';
    }
  } else if (preferredAlign === 'right') {
    if (rect.right - checkWidth >= leftBoundary && rect.right <= rightBoundary) {
      left = alignRightLeft;
      originX = 'right';
    } else if (alignLeftLeft >= leftBoundary && alignLeftLeft + checkWidth <= rightBoundary) {
      left = alignLeftLeft;
      originX = 'left';
    } else {
      left = Math.max(leftBoundary, Math.min(rect.right - width, rightBoundary - width));
      originX = 'right';
    }
  } else {
    if (rect.right - checkWidth >= leftBoundary && rect.right <= rightBoundary) {
      left = alignRightLeft;
      originX = 'right';
    } else if (alignLeftLeft >= leftBoundary && alignLeftLeft + checkWidth <= rightBoundary) {
      left = alignLeftLeft;
      originX = 'left';
    } else {
      if (rect.left < (leftBoundary + rightBoundary) / 2) {
        left = Math.min(Math.max(leftBoundary, rect.left), rightBoundary - width);
        originX = 'left';
      } else {
        left = Math.max(leftBoundary, Math.min(rect.right - width, rightBoundary - width));
        originX = 'right';
      }
    }
  }

  return {
    position: 'fixed',
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    width: `${width}px`,
    zIndex: 9999,
    transformOrigin: `${originY} ${originX}`,
  };
}

export function getBookDurationInSeconds(book: Audiobook): number {
  const fromChapters = (book.chapters || []).reduce((s, c) => s + (c.duration || 0), 0);
  if (fromChapters > 0) return fromChapters;
  if (book.durationEst) {
    let total = 0;
    const hMatch = book.durationEst.match(/(\d+)\s*h/i);
    const mMatch = book.durationEst.match(/(\d+)\s*m/i);
    const sMatch = book.durationEst.match(/(\d+)\s*s/i);
    if (hMatch) total += parseInt(hMatch[1]) * 3600;
    if (mMatch) total += parseInt(mMatch[1]) * 60;
    if (sMatch) total += parseInt(sMatch[1]);
    if (total > 0) return total;
  }
  return 0;
}

export const EMPTY_BOOK: Audiobook = {
  id: '',
  title: '',
  author: '',
  authorId: '',
  narrator: '',
  cover: '',
  category: '',
  durationEst: '',
  sizeStr: '',
  chapters: [],
  transcript: [],
  year: '',
  language: 'Português',
};

interface PopupAnchorState {
  openUp: boolean;
  alignSide: 'left' | 'right';
  anchorRight: number;
  anchorLeft: number;
  anchorTop: number;
  anchorBottom: number;
}

const buttonCoverAnchorCache = new WeakMap<HTMLElement, PopupAnchorState>();

export function clearButtonCoverAnchorCache(triggerEl?: HTMLElement | null) {
  if (triggerEl) {
    buttonCoverAnchorCache.delete(triggerEl);
  }
}

export function getButtonCoverPopupStyle(
  triggerEl: HTMLElement | null,
  width: number,
  estimatedHeight: number,
  preferredAlign: 'auto' | 'left' | 'right' = 'auto',
  fixedOpenUp?: boolean
): React.CSSProperties {
  // Computador: os pop-ups são 20% mais largos (mesma conta do CSS e do PopupMorphContainer)
  if (typeof window !== 'undefined' && !window.matchMedia?.('(max-width: 1023px)').matches) {
    width = Math.round(width * 1.2);
  }
  if (!triggerEl || typeof window === 'undefined') {
    return { position: 'fixed', zIndex: 9999, width: `${width}px` };
  }

  const rawRect = triggerEl.getBoundingClientRect();
  const centerX = rawRect.left + rawRect.width / 2;
  const centerY = rawRect.top + rawRect.height / 2;
  const unscaledW = triggerEl.offsetWidth || rawRect.width;
  const unscaledH = triggerEl.offsetHeight || rawRect.height;
  const rect = {
    left: centerX - unscaledW / 2,
    right: centerX + unscaledW / 2,
    top: centerY - unscaledH / 2,
    bottom: centerY + unscaledH / 2,
    width: unscaledW,
    height: unscaledH,
  };

  const margin = 12;
  const topBoundary = margin;

  const sidebarEl = typeof document !== 'undefined' ? document.querySelector('aside') : null;
  const isInsideSidebar = sidebarEl ? sidebarEl.contains(triggerEl) : false;
  let minLeftBoundary = margin;
  if (!isInsideSidebar && sidebarEl) {
    const sRect = sidebarEl.getBoundingClientRect();
    if (sRect.width > 0 && sRect.right > 0 && sRect.right < window.innerWidth) {
      if (rect.left >= sRect.right - 8) {
        minLeftBoundary = sRect.right + 8;
      }
    }
  }

  const miniplayerEl = typeof document !== 'undefined' ? document.getElementById('mini-player') : null;
  const isInsideMiniplayer = miniplayerEl ? miniplayerEl.contains(triggerEl) : false;

  let bottomBoundary = window.innerHeight - margin;
  if (!isInsideMiniplayer && miniplayerEl) {
    const mRect = miniplayerEl.getBoundingClientRect();
    if (mRect.top > 0 && mRect.top < window.innerHeight && mRect.height > 0) {
      bottomBoundary = mRect.top - 8;
    }
  }
  if (bottomBoundary < topBoundary + 100) {
    bottomBoundary = window.innerHeight - margin;
  }

  const actualWidth = Math.min(width, window.innerWidth - margin * 2);
  let cachedAnchor = buttonCoverAnchorCache.get(triggerEl);
  let alignSide: 'left' | 'right';
  let openUp: boolean;

  if (cachedAnchor) {
    alignSide = cachedAnchor.alignSide;
    openUp = fixedOpenUp !== undefined ? fixedOpenUp : cachedAnchor.openUp;
  } else {
    const potentialMaxHeight = Math.max(estimatedHeight, 320);

    if (preferredAlign === 'left') {
      alignSide = 'left';
      if (rect.left + actualWidth > window.innerWidth - margin && (rect.right - actualWidth >= minLeftBoundary)) {
        alignSide = 'right';
      }
    } else if (preferredAlign === 'right') {
      alignSide = 'right';
      if (rect.right - actualWidth < minLeftBoundary && (rect.left + actualWidth <= window.innerWidth - margin)) {
        alignSide = 'left';
      }
    } else {
      if (rect.right - actualWidth < minLeftBoundary && (rect.left + actualWidth <= window.innerWidth - margin)) {
        alignSide = 'left';
      } else if (rect.left + actualWidth <= window.innerWidth - margin && rect.left < window.innerWidth / 3) {
        alignSide = 'left';
      } else {
        alignSide = 'right';
      }
    }

    const spaceBelow = bottomBoundary - rect.bottom - 4;
    const spaceAbove = rect.top - topBoundary - 4;

    if (fixedOpenUp !== undefined) {
      openUp = fixedOpenUp;
    } else if (isInsideMiniplayer) {
      openUp = true;
    } else if (spaceBelow < potentialMaxHeight + 8) {
      openUp = true;
    } else if (spaceAbove >= potentialMaxHeight && (rect.bottom > bottomBoundary * 0.55 || rect.top > window.innerHeight * 0.55)) {
      openUp = true;
    } else if (spaceBelow < spaceAbove && spaceAbove >= potentialMaxHeight) {
      openUp = true;
    } else if (spaceBelow < potentialMaxHeight && spaceAbove > spaceBelow) {
      openUp = true;
    } else {
      openUp = false;
    }

    cachedAnchor = {
      openUp,
      alignSide,
      anchorRight: rect.right,
      anchorLeft: rect.left,
      anchorTop: rect.top,
      anchorBottom: rect.bottom,
    };
    buttonCoverAnchorCache.set(triggerEl, cachedAnchor);
  }

  const anchorRight = cachedAnchor.anchorRight;
  const anchorLeft = cachedAnchor.anchorLeft;
  const anchorTop = cachedAnchor.anchorTop;
  const anchorBottom = cachedAnchor.anchorBottom;
  const anchorCenterX = (anchorLeft + anchorRight) / 2;

  const styleResult: React.CSSProperties = {
    position: 'fixed',
    width: `${width}px`,
    zIndex: 9999,
  };

  let originXStr: string;
  if (alignSide === 'right') {
    const rightEdge = Math.min(window.innerWidth - margin, Math.max(minLeftBoundary + actualWidth, anchorRight));
    styleResult.right = `${Math.round(window.innerWidth - rightEdge)}px`;
    const distFromRight = Math.max(12, Math.round(rightEdge - anchorCenterX));
    originXStr = `calc(100% - ${distFromRight}px)`;
  } else {
    let leftEdge = anchorLeft;
    if (window.innerWidth - actualWidth - margin >= minLeftBoundary) {
      leftEdge = Math.max(minLeftBoundary, Math.min(window.innerWidth - actualWidth - margin, leftEdge));
    } else {
      leftEdge = Math.max(margin, Math.min(window.innerWidth - actualWidth - margin, leftEdge));
    }
    styleResult.left = `${Math.round(leftEdge)}px`;
    const distFromLeft = Math.max(12, Math.round(anchorCenterX - leftEdge));
    originXStr = `${distFromLeft}px`;
  }

  let originYStr: string;
  if (openUp) {
    const bottomEdge = Math.min(bottomBoundary, anchorBottom);
    styleResult.bottom = `${Math.round(window.innerHeight - bottomEdge)}px`;
    const maxH = bottomEdge - topBoundary;
    if (maxH > 0) {
      styleResult.maxHeight = `${Math.round(maxH)}px`;
    }
    originYStr = 'bottom';
  } else {
    const topEdge = Math.max(topBoundary, Math.min(bottomBoundary - 120, anchorTop));
    styleResult.top = `${Math.round(topEdge)}px`;
    const maxH = bottomBoundary - topEdge;
    if (maxH > 0) {
      styleResult.maxHeight = `${Math.round(maxH)}px`;
    }
    originYStr = 'top';
  }

  styleResult.transformOrigin = `${originXStr} ${originYStr}`;
  return styleResult;
}
