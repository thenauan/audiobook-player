// ===== Imagens para compartilhar (formato de story, 1080×1920) =====
// Inspiradas no compartilhamento do Apple Music: fundo como o do player em tela cheia (cores da capa,
// desfocadas), um destaque branco ou preto (conforme o tema do app) com a capa, o título e o autor, e
// abaixo o ícone e o nome do app. Na versão "trecho", as frases aparecem em destaque entre aspas e a
// capa, o título e o autor ficam menores, numa linha discreta.

const W = 1080;
const H = 1920;
const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export interface StoryBook {
  title: string;
  author: string;
  cover: string;
  fallbackCover: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image'));
    img.src = src;
  });
}

async function loadCover(book: StoryBook): Promise<HTMLImageElement> {
  try {
    const img = await loadImage(book.cover);
    // Testa se a imagem pode ser usada no canvas (imagens de outros sites sem permissão "sujam" o canvas)
    const probe = document.createElement('canvas');
    probe.width = probe.height = 2;
    const pctx = probe.getContext('2d')!;
    pctx.drawImage(img, 0, 0, 2, 2);
    pctx.getImageData(0, 0, 1, 1);
    return img;
  } catch {
    return loadImage(book.fallbackCover);
  }
}

// Cores da capa: média e tons claro/escuro, a partir de uma miniatura
function coverPalette(img: HTMLImageElement) {
  const c = document.createElement('canvas');
  c.width = 12;
  c.height = 19;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  let r = 0, g = 0, b = 0, n = 0;
  const px: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 4) {
    px.push([data[i], data[i + 1], data[i + 2]]);
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  const lum = (p: [number, number, number]) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  px.sort((a, z) => lum(a) - lum(z));
  const avg: [number, number, number] = [r / n, g / n, b / n];
  return {
    avg,
    dark: px[Math.floor(px.length * 0.15)],
    light: px[Math.floor(px.length * 0.85)],
  };
}

const rgba = (c: [number, number, number], a: number) => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${a})`;

// Fundo como o do player em tela cheia: base clara/escura, capa muito desfocada, manchas de cor e véu de vidro
// Fundo como o do player em tela cheia: manchas grandes e suaves com as cores da capa sobre a base
// clara/escura (como um "retrato" das cores em movimento do player), com o véu de vidro por cima
function drawBackground(ctx: CanvasRenderingContext2D, cover: HTMLImageElement, isDark: boolean) {
  const pal = coverPalette(cover);
  const mix = (c: [number, number, number], target: number, amount: number): [number, number, number] =>
    [c[0] + (target - c[0]) * amount, c[1] + (target - c[1]) * amount, c[2] + (target - c[2]) * amount];
  // Cores mais vivas, como os tons em movimento do player (aumenta a saturação a partir da média)
  const vivid = (c: [number, number, number], k = 1.6): [number, number, number] => {
    const g = (c[0] + c[1] + c[2]) / 3;
    return [0, 1, 2].map(i => Math.max(0, Math.min(255, g + (c[i] - g) * k))) as [number, number, number];
  };
  const primary = vivid(pal.avg, 1.8);
  const light = vivid(mix(pal.light, 255, 0.1), 1.6);
  const deep = vivid(mix(pal.dark, 0, 0.2), 1.6);
  const medium = vivid(mix(pal.avg, isDark ? 0 : 255, 0.2), 1.7);

  ctx.fillStyle = isDark ? '#03060c' : '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const orb = (x: number, y: number, rad: number, color: string) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, color);
    gr.addColorStop(0.55, color.replace(/[\d.]+\)$/, (m) => `${parseFloat(m) * 0.45})`));
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  };
  orb(W * 0.08, H * 0.1, W * 0.95, rgba(primary, isDark ? 0.85 : 0.7));
  orb(W * 1.0, H * 0.3, W * 0.8, rgba(isDark ? deep : light, isDark ? 0.8 : 0.65));
  orb(W * 0.85, H * 0.82, W * 0.9, rgba(medium, isDark ? 0.7 : 0.6));
  orb(W * 0.05, H * 0.72, W * 0.75, rgba(isDark ? light : deep, isDark ? 0.35 : 0.3));
  orb(W * 0.45, H * 0.45, W * 0.6, rgba(primary, isDark ? 0.3 : 0.35));

  ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(0, 0, W, H);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Destaque com o mesmo efeito de vidro dos pop-ups do app: fundo desfocado atrás, véu translúcido
// (branco no tema claro, grafite no escuro), borda sutil e cantos bem arredondados
const CARD_RADIUS = 92;
function drawCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isDark: boolean) {
  const canvas = ctx.canvas;
  // Desfoque do que está atrás (miniatura ampliada, sem depender de "filter")
  const blur = document.createElement('canvas');
  blur.width = Math.round(W / 20);
  blur.height = Math.round(H / 20);
  const bctx = blur.getContext('2d')!;
  bctx.imageSmoothingQuality = 'high';
  bctx.drawImage(canvas, 0, 0, blur.width, blur.height);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 26;
  roundRect(ctx, x, y, w, h, CARD_RADIUS);
  ctx.fillStyle = isDark ? 'rgba(20, 20, 24, 0.6)' : 'rgba(255, 255, 255, 0.55)';
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, CARD_RADIUS);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(blur, 0, 0, W, H);
  // Saturação extra como o "backdrop-filter: saturate" dos pop-ups
  ctx.globalCompositeOperation = 'saturation';
  ctx.fillStyle = 'hsl(0, 70%, 50%)';
  ctx.globalAlpha = 0.18;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = isDark ? 'rgba(30, 30, 34, 0.72)' : 'rgba(255, 255, 255, 0.72)';
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.save();
  roundRect(ctx, x + 1, y + 1, w - 2, h - 2, CARD_RADIUS - 1);
  ctx.lineWidth = 2;
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
  ctx.stroke();
  ctx.restore();
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  // object-fit: cover
  const ir = img.width / img.height;
  const tr = w / h;
  let sw = img.width, sh = img.height, sx = 0, sy = 0;
  if (ir > tr) { sw = img.height * tr; sx = (img.width - sw) / 2; } else { sh = img.width / tr; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function clampLines(ctx: CanvasRenderingContext2D, lines: string[], max: number, maxWidth: number): string[] {
  if (lines.length <= max) return lines;
  const out = lines.slice(0, max);
  let last = out[max - 1];
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
  out[max - 1] = `${last.trimEnd()}…`;
  return out;
}

// Ícone e nome do app, como no topo do menu lateral (ícone + "Audiobook" em negrito + "Player")
// Ícone do app (o mesmo do menu lateral) e o símbolo do GitHub, desenhados com caminhos vetoriais
const BOOK_HEADPHONES_PATHS = [
  'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20',
  'M8 12v-2a4 4 0 0 1 8 0v2',
];
const GITHUB_PATH = 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z';
const GITHUB_USER = 'thenauan';

function drawBookHeadphones(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  BOOK_HEADPHONES_PATHS.forEach(d => ctx.stroke(new Path2D(d)));
  [[15, 12], [9, 12]].forEach(([cx, cy]) => { ctx.beginPath(); ctx.arc(cx, cy, 1, 0, Math.PI * 2); ctx.stroke(); });
  ctx.restore();
}

async function drawAppBrand(ctx: CanvasRenderingContext2D, centerX: number, y: number, isDark: boolean) {
  const color = isDark ? '#ffffff' : '#141414';
  const size = 56;
  ctx.font = `700 46px ${FONT}`;
  const wBold = ctx.measureText('Audiobook').width;
  ctx.font = `400 46px ${FONT}`;
  const wReg = ctx.measureText('Player').width;
  const gap = 14;
  let x = centerX - (size + gap + wBold + wReg) / 2;
  drawBookHeadphones(ctx, x, y - size / 2, size, color);
  x += size + gap;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `700 46px ${FONT}`;
  ctx.fillText('Audiobook', x, y + 2);
  ctx.font = `400 46px ${FONT}`;
  ctx.fillText('Player', x + wBold, y + 2);

  // Bem pequeno, abaixo: "by [GitHub] thenauan"
  const small = 26;
  const y2 = y + 58;
  ctx.globalAlpha = 0.62;
  ctx.font = `500 ${small}px ${FONT}`;
  const wBy = ctx.measureText('by').width;
  const wUser = ctx.measureText(GITHUB_USER).width;
  const gh = 26;
  const gap2 = 9;
  let x2 = centerX - (wBy + gap2 + gh + gap2 + wUser) / 2;
  ctx.fillText('by', x2, y2);
  x2 += wBy + gap2;
  ctx.save();
  ctx.translate(x2, y2 - gh / 2);
  ctx.scale(gh / 16, gh / 16);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(GITHUB_PATH));
  ctx.restore();
  x2 += gh + gap2;
  ctx.fillStyle = color;
  ctx.fillText(GITHUB_USER, x2, y2);
  ctx.globalAlpha = 1;
}

async function prepare(book: StoryBook) {
  try { await (document as any).fonts?.ready; } catch {}
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const cover = await loadCover(book);
  return { canvas, ctx, cover };
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('blob'))), 'image/png'));
}

// Audiobook: capa grande, título e autor no destaque; o app abaixo
export async function renderAudiobookStory(book: StoryBook, isDark: boolean): Promise<Blob> {
  const { canvas, ctx, cover } = await prepare(book);
  drawBackground(ctx, cover, isDark);

  const cardW = 780;
  const pad = 56;
  const coverW = cardW - pad * 2;
  const coverH = Math.round(coverW * 1.6);
  ctx.font = `700 60px ${FONT}`;
  const titleLines = clampLines(ctx, wrapLines(ctx, book.title, cardW - pad * 2), 2, cardW - pad * 2);
  const titleH = titleLines.length * 72;
  const cardH = pad + coverH + 52 + titleH + 14 + 50 + pad;
  const brandH = 170;
  const cardX = (W - cardW) / 2;
  const cardY = Math.round((H - cardH - brandH) / 2);

  drawCard(ctx, cardX, cardY, cardW, cardH, isDark);
  drawCover(ctx, cover, cardX + pad, cardY + pad, coverW, coverH, CARD_RADIUS - pad + 10);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = isDark ? '#ffffff' : '#111111';
  ctx.font = `700 60px ${FONT}`;
  let ty = cardY + pad + coverH + 52;
  titleLines.forEach(line => { ctx.fillText(line, W / 2, ty); ty += 72; });
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.62)' : 'rgba(17,17,17,0.58)';
  ctx.font = `500 42px ${FONT}`;
  ctx.fillText(clampLines(ctx, [book.author], 1, cardW - pad * 2)[0], W / 2, ty + 14);

  await drawAppBrand(ctx, W / 2, cardY + cardH + 84, isDark);
  return toBlob(canvas);
}

// Trecho do texto: até 5 frases entre aspas em destaque; capa pequena à direita do título e do autor
export async function renderQuoteStory(book: StoryBook, lines: string[], isDark: boolean): Promise<Blob> {
  const { canvas, ctx, cover } = await prepare(book);
  drawBackground(ctx, cover, isDark);

  const cardW = 880;
  const pad = 72;
  const textW = cardW - pad * 2;
  const quote = `“${lines.map(l => l.trim()).filter(Boolean).join(' ')}”`;

  // Fonte se ajusta ao tamanho do trecho para caber com folga
  let size = 66;
  let wrapped: string[] = [];
  for (; size >= 38; size -= 4) {
    ctx.font = `700 ${size}px ${FONT}`;
    wrapped = wrapLines(ctx, quote, textW);
    if (wrapped.length * size * 1.3 <= 1000) break;
  }
  ctx.font = `700 ${size}px ${FONT}`;
  wrapped = clampLines(ctx, wrapped, 18, textW);
  const lineH = Math.round(size * 1.3);
  const quoteH = wrapped.length * lineH;

  const smallCoverW = 96;
  const smallCoverH = Math.round(smallCoverW * 1.6);
  const footerH = smallCoverH;
  const cardH = pad + quoteH + 64 + footerH + pad;
  const brandH = 170;
  const cardX = (W - cardW) / 2;
  const cardY = Math.round((H - cardH - brandH) / 2);

  drawCard(ctx, cardX, cardY, cardW, cardH, isDark);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = isDark ? '#ffffff' : '#111111';
  let y = cardY + pad;
  wrapped.forEach(line => { ctx.fillText(line, cardX + pad, y); y += lineH; });

  // Linha discreta: título e autor à esquerda, capa pequena à direita
  const footY = cardY + pad + quoteH + 64;
  const coverX = cardX + cardW - pad - smallCoverW;
  drawCover(ctx, cover, coverX, footY, smallCoverW, smallCoverH, 14);
  const infoW = coverX - (cardX + pad) - 28;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.88)' : 'rgba(17,17,17,0.85)';
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText(clampLines(ctx, [book.title], 1, infoW)[0], cardX + pad, footY + footerH / 2 - 22);
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(17,17,17,0.55)';
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText(clampLines(ctx, [book.author], 1, infoW)[0], cardX + pad, footY + footerH / 2 + 22);

  await drawAppBrand(ctx, W / 2, cardY + cardH + 84, isDark);
  return toBlob(canvas);
}

// Abre a folha de compartilhar do aparelho (Instagram, WhatsApp…); sem suporte, baixa a imagem
export async function shareOrDownload(blob: Blob, fileName: string, title: string): Promise<'shared' | 'downloaded' | 'canceled'> {
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = navigator as any;
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'canceled';
    }
  }
  downloadBlob(blob, fileName);
  return 'downloaded';
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
