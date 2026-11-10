import { useSyncExternalStore } from 'react';

// "Carregando" do player: o áudio está sendo lido do aparelho ou, tocando, espera dados para continuar.
// Fica fora do App (muda várias vezes durante o carregamento sem redesenhar o app inteiro); a barra de
// reprodução mostra "Carregando..." no lugar enquanto isso.
let loading = false;
let waiting = false;
let playing = false;
let busy = false;
const listeners = new Set<() => void>();

function update() {
  const next = loading || (waiting && playing);
  if (next === busy) return;
  busy = next;
  listeners.forEach(l => l());
}

export const audioBusy = {
  get: () => busy,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  setLoading(v: boolean) { loading = v; update(); },
  setWaiting(v: boolean) { waiting = v; update(); },
  setPlaying(v: boolean) { playing = v; if (!v) waiting = false; update(); },
};

export function useAudioBusy(): boolean {
  return useSyncExternalStore(audioBusy.subscribe, audioBusy.get, audioBusy.get);
}
