// ===== Modo leve e configuração do aparelho =====
// Modo leve (Ajustes › Sistema): sem desfoque de fundo, cards e pop-ups opacos e sem brilhos/fundos
// desfocados, para computadores e celulares mais simples. Classe `lite` no <html> (regras em index.css).
// A configuração do aparelho (processador e memória) indica quando o modo leve é recomendado: no app
// instalado vem do Electron; no navegador, do que ele informa (núcleos e, em alguns, a memória aproximada).
import { useEffect, useState, useSyncExternalStore } from 'react';
import { desktop } from './desktopBridge';

const KEY = 'app_lite_mode';
let lite = false;
try { lite = localStorage.getItem(KEY) === 'true'; } catch { /* sem armazenamento */ }
const listeners = new Set<() => void>();

function apply() {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('lite', lite);
}
apply();

export function setLiteMode(value: boolean) {
  if (value === lite) return;
  lite = value;
  try { localStorage.setItem(KEY, value ? 'true' : 'false'); } catch { /* sem armazenamento */ }
  apply();
  listeners.forEach(l => l());
}

export function useLiteMode(): boolean {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => lite,
    () => lite,
  );
}

export interface SystemInfo {
  cores: number;
  cpuModel: string;
  ramGB: number;
  /** Aparelho simples: o modo leve é recomendado */
  weak: boolean;
  /** Por que é simples (a tela mostra os números) */
  reasons: ('cores' | 'ram' | 'cpu')[];
  /** Nome curto do processador (ex.: "Intel Core i5-8250U") */
  cpuName: string;
  isPhone: boolean;
}

// Linhas de processador de entrada, mesmo com vários núcleos
const BASIC_CPU = /\b(celeron|pentium|atom|athlon|sempron|e[12]-\d{3,4}|a[46]-\d{4}|mediatek|snapdragon 7c)\b/i;

export function evaluateDevice(cores: number, ramGB: number, cpuModel: string, isPhone: boolean): SystemInfo {
  const reasons: SystemInfo['reasons'] = [];
  // Celulares têm menos memória que computadores: o limite de memória é menor para eles
  if (cores > 0 && cores <= 4) reasons.push('cores');
  if (ramGB > 0 && ramGB < (isPhone ? 3.5 : 7.5)) reasons.push('ram');
  if (BASIC_CPU.test(cpuModel)) reasons.push('cpu');
  const cpuName = cpuModel.replace(/\((R|TM)\)/gi, '').replace(/\s+CPU\b.*$/i, '').replace(/\s+@.*$/, '').replace(/\s+/g, ' ').trim();
  return { cores, cpuModel, ramGB, weak: reasons.length > 0, reasons, cpuName, isPhone };
}

let cache: SystemInfo | null = null;
let pending: Promise<SystemInfo | null> | null = null;

export function getSystemInfo(): Promise<SystemInfo | null> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    const isPhone = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches && Math.min(window.screen.width, window.screen.height) < 600;
    const fromBrowser = () => {
      const nav = navigator as Navigator & { deviceMemory?: number };
      if (!nav.hardwareConcurrency) return null;
      return (cache = evaluateDevice(nav.hardwareConcurrency, nav.deviceMemory || 0, '', isPhone));
    };
    pending = desktop?.getSystemInfo
      ? desktop.getSystemInfo()
        .then(d => (cache = evaluateDevice(Number(d.cores) || 0, Number(d.ramGB) || 0, String(d.cpuModel || ''), false)))
        .catch(fromBrowser)
      : Promise.resolve(typeof navigator !== 'undefined' ? fromBrowser() : null);
  }
  return pending;
}

export function useSystemInfo(): SystemInfo | null {
  const [info, setInfo] = useState<SystemInfo | null>(cache);
  useEffect(() => {
    let alive = true;
    getSystemInfo().then(s => { if (alive) setInfo(s); });
    return () => { alive = false; };
  }, []);
  return info;
}
