import { useEffect, useState } from 'react';

// Estado guardado no aparelho: começa com o valor salvo e grava de novo sempre que muda
export function usePersistentState<T>(key: string, initial: T | (() => T), save: (value: T) => string) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try { localStorage.setItem(key, save(value)); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);
  return [value, setValue] as const;
}
