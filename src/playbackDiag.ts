// ===== Diagnóstico da reprodução =====
// Registro curto (no próprio aparelho) do caminho da posição de reprodução: posição restaurada ao abrir o
// app, troca de arquivo, carregamento, pulos para a posição salva (e se deram certo), play e gravações de
// posição. Serve para entender problemas que só acontecem num aparelho (ex.: o iPhone voltar ao capítulo 1).
// Fica em Ajustes > Sistema > Diagnóstico da reprodução, onde pode ser copiado.

const KEY = 'app_playback_diag';
const MAX = 200;

type Entry = { t: number; e: string; d?: Record<string, unknown> };

let buffer: Entry[] | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function load(): Entry[] {
  if (buffer) return buffer;
  try { buffer = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { buffer = []; }
  if (!Array.isArray(buffer)) buffer = [];
  return buffer;
}

function flush() {
  flushTimer = null;
  try { localStorage.setItem(KEY, JSON.stringify(load())); } catch { /* sem espaço: ignora */ }
}

const round = (v: unknown) => (typeof v === 'number' && isFinite(v) ? Math.round(v * 10) / 10 : v);

export function diag(event: string, data?: Record<string, unknown>) {
  const list = load();
  const d = data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, round(v)])) : undefined;
  list.push({ t: Date.now(), e: event, d });
  if (list.length > MAX) list.splice(0, list.length - MAX);
  // Gravação logo em seguida (e já na hora em eventos importantes, para não perder se o app for fechado)
  if (/^(abriu|pausou|saiu|seek-falhou|gravou-0|pausa-sistema|travou|recuper|play-falhou|erro|encerrado)/.test(event)) flush();
  else if (!flushTimer) flushTimer = setTimeout(flush, 1000);
}

export function getDiagText(): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone);
  const lines = load().map(x => {
    const time = new Date(x.t).toISOString().slice(11, 23);
    return `${time} ${x.e}${x.d ? ' ' + JSON.stringify(x.d) : ''}`;
  });
  return [`Aparelho: ${ua}`, `Instalado: ${standalone ? 'sim' : 'não'}`, '', ...lines].join('\n');
}

export function clearDiag() {
  buffer = [];
  flush();
}

// Fecha o registro ao sair do app. A marca de "em uso" só some ao sair ou ir para outro app: se ela ainda estiver
// lá ao abrir, a página foi encerrada à força com o app na tela (tela preta, em geral por falta de memória)
if (typeof window !== 'undefined') {
  const ALIVE = 'app_session_alive';
  const mark = (on: boolean) => { try { if (on) localStorage.setItem(ALIVE, '1'); else localStorage.removeItem(ALIVE); } catch { /* sem armazenamento */ } };
  try { if (localStorage.getItem(ALIVE)) diag('encerrado-a-forca'); } catch { /* sem armazenamento */ }
  mark(true);
  window.addEventListener('pagehide', () => { mark(false); diag('saiu'); });
  document.addEventListener('visibilitychange', () => mark(document.visibilityState === 'visible'));
  window.addEventListener('error', (e) => diag('erro', { msg: String(e.message).slice(0, 200) }));
  window.addEventListener('unhandledrejection', (e) => diag('erro', { msg: String((e as PromiseRejectionEvent).reason).slice(0, 200) }));
}
