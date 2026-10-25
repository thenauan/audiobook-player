import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Check, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useI18n } from './translations';
export { autoCropImageToSquare, autoCropImageToEbookCover } from './imageProcessing';

interface ImageCropperSquareProps {
  imageSrc: string;
  isAuthor?: boolean;
  onSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropperSquare: React.FC<ImageCropperSquareProps> = ({
  imageSrc,
  isAuthor = false,
  onSave,
  onCancel,
}) => {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number }>({
    clientX: 0,
    clientY: 0,
    panX: 0,
    panY: 0,
  });

  // Para autor: 224x224 (1:1 quadrado). Para audiobook: 175x280 (1.6:1 altura/largura padrão ebook)
  const boxWidth = isAuthor ? 224 : 175;
  const boxHeight = isAuthor ? 224 : 280;

  // Carrega as dimensões originais da imagem
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };

    img.src = imageSrc;
  }, [imageSrc]);

  // Dimensões base para cobrir completamente a caixa
  const baseScale = naturalSize
    ? Math.max(boxWidth / naturalSize.width, boxHeight / naturalSize.height)
    : 1;
  const baseW = naturalSize ? naturalSize.width * baseScale : boxWidth;
  const baseH = naturalSize ? naturalSize.height * baseScale : boxHeight;

  const clampPan = useCallback(
    (targetX: number, targetY: number, targetZoom: number) => {
      const currentW = baseW * targetZoom;
      const currentH = baseH * targetZoom;
      const maxX = Math.max(0, (currentW - boxWidth) / 2);
      const maxY = Math.max(0, (currentH - boxHeight) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, targetX)),
        y: Math.min(maxY, Math.max(-maxY, targetY)),
      };

    },
    [baseW, baseH, boxWidth, boxHeight]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };

  };


  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;
    const targetX = dragStartRef.current.panX + deltaX;
    const targetY = dragStartRef.current.panY + deltaY;
    setPan(clampPan(targetX, targetY, zoom));
  };


  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
  };


  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;

  // Listener nativo com { passive: false } para garantir que o scroll do mouse não role a página externa
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = -e.deltaY * 0.002;
      const currentZ = zoomRef.current;
      const nextZoom = Math.min(4, Math.max(1, Number((currentZ + delta).toFixed(2))));
      if (nextZoom !== currentZ) {
        setZoom(nextZoom);
        setPan(clampPan(panRef.current.x, panRef.current.y, nextZoom));
      }
    };


    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelNative);
    };

  }, [clampPan]);

  const handleZoomChange = (delta: number) => {
    const currentZ = zoomRef.current;
    const nextZoom = Math.min(4, Math.max(1, Number((currentZ + delta).toFixed(2))));
    if (nextZoom !== currentZ) {
      setZoom(nextZoom);
      setPan(clampPan(panRef.current.x, panRef.current.y, nextZoom));
    }
  };


  const handleSaveCrop = () => {
    if (!naturalSize || !imgRef.current) return;
    const { width: nw, height: nh } = naturalSize;

    const canvas = document.createElement('canvas');
    const targetW = isAuthor ? 600 : 750;
    const targetH = isAuthor ? 600 : 1200; // 1200 / 750 = 1.6
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentW = baseW * zoom;
    const currentH = baseH * zoom;

    const displayLeft = (boxWidth - currentW) / 2 + pan.x;
    const displayTop = (boxHeight - currentH) / 2 + pan.y;

    const scale = currentW / nw;

    const sx = (0 - displayLeft) / scale;
    const sy = (0 - displayTop) / scale;
    const sWidth = boxWidth / scale;
    const sHeight = boxHeight / scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      imgRef.current,
      Math.max(0, sx),
      Math.max(0, sy),
      Math.min(nw - Math.max(0, sx), sWidth),
      Math.min(nh - Math.max(0, sy), sHeight),
      0,
      0,
      targetW,
      targetH
    );

    try {
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onSave(croppedDataUrl);
    } catch (err) {
      console.warn('Could not export cropped image toDataURL', err);
      onSave(imageSrc);
    }
  };


  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
      className={`relative shrink-0 rounded-3xl overflow-hidden shadow-2xl select-none touch-none bg-black/80 border border-white/20 group/cropper ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      title={t('crop_drag_zoom')}
    >
      {/* Background Image positioned and zoomed */}
      {naturalSize && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={t('crop_alt')}
          draggable={false}
          style={{
            width: `${baseW * zoom}px`,
            height: `${baseH * zoom}px`,
            left: `${(boxWidth - baseW * zoom) / 2 + pan.x}px`,
            top: `${(boxHeight - baseH * zoom) / 2 + pan.y}px`,
            maxWidth: 'none',
            maxHeight: 'none',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          className="absolute object-cover will-change-transform"
        />
      )}

      {/* Grid overlay lines (regra dos terços sutil) */}
      <div className="absolute inset-0 pointer-events-none opacity-20 transition-opacity group-hover/cropper:opacity-40">
        <div className="w-full h-full grid grid-cols-3 grid-rows-3">
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-white" />
          <div className="border-r border-white" />
          <div />
        </div>
      </div>

      {/* Controles de Zoom verticais na lateral direita */}
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 right-3 flex flex-col items-center gap-1.5 z-30 pointer-events-auto"
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleZoomChange(0.3);
          }}
          className="w-7 h-7 rounded-full bg-card/85 backdrop-blur-md border border-white/25 text-white shadow-lg hover:bg-white/25 hover:border-white/50 hover:shadow-[0_0_12px_rgba(255,255,255,0.4)] flex items-center justify-center transition-all cursor-pointer"
          title={t('zoom_in')}
        >
          <ZoomIn size={14} />
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleZoomChange(-0.3);
          }}
          className="w-7 h-7 rounded-full bg-card/85 backdrop-blur-md border border-white/25 text-white shadow-lg hover:bg-white/25 hover:border-white/50 hover:shadow-[0_0_12px_rgba(255,255,255,0.4)] flex items-center justify-center transition-all cursor-pointer"
          title={t('zoom_out')}
        >
          <ZoomOut size={14} />
        </motion.button>
      </div>

      {/* Botões de Ação no Rodapé: Confirmar (v azul) e Cancelar (x vermelho) */}
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-3.5 z-30 pointer-events-auto"
      >
        {/* Botão Confirmar (v azul: contorno azul, preenchimento em outro tom/transparência, brilho azul no hover e ícone v azul da cor da borda) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            e.stopPropagation();
            handleSaveCrop();
          }}
          className="w-9 h-9 rounded-full bg-winblue/20 backdrop-blur-3xl border border-winblue text-winblue shadow-xl hover:bg-winblue/35 hover:border-winblue hover:shadow-[0_0_16px_rgba(var(--winblue-rgb),0.65)] flex items-center justify-center transition-all cursor-pointer"
          title={isAuthor ? t('confirm_photo') : t('confirm_cover')}
        >
          <Check size={18} strokeWidth={2.5} className="text-winblue" />
        </motion.button>

        {/* Botão Cancelar (x vermelho) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="w-9 h-9 rounded-full bg-card/85 backdrop-blur-3xl border border-red-500/35 text-red-400 shadow-xl hover:bg-red-500/25 hover:border-red-500/60 hover:text-red-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center justify-center transition-all cursor-pointer"
          title={t('cancel')}
        >
          <X size={18} strokeWidth={2.5} className="text-red-400" />
        </motion.button>
      </div>
    </div>
  );
};

export default ImageCropperSquare;
