import { useEffect, useRef, useState } from 'react';

const INTERVAL_MS = 5000;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Каждые 5 с кладёт форму в localStorage, чтобы текст не пропал при закрытой вкладке.
 * `restorable` — сохранённая версия, отличная от текущей; её можно восстановить или выбросить.
 */
export function useDraftAutosave<T>(key: string, value: T, enabled: boolean) {
  const [restorable, setRestorable] = useState<T | null>(null);
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    if (!enabled) return;
    const saved = read<T>(key);
    if (saved && JSON.stringify(saved) !== JSON.stringify(latest.current)) setRestorable(saved);
  }, [key, enabled]);

  useEffect(() => {
    if (!enabled || restorable) return;
    const timer = setInterval(() => {
      try {
        localStorage.setItem(key, JSON.stringify(latest.current));
      } catch {
        /* хранилище недоступно — просто не автосохраняем */
      }
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [key, enabled, restorable]);

  const clear = () => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setRestorable(null);
  };

  return { restorable, dismiss: clear, clear, accept: () => setRestorable(null) };
}
