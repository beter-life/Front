import { useEffect, useState } from 'react';
import { SunMoon } from 'lucide-react';
import { applyTheme, readTheme, themeStorageKey } from './theme';
import type { ThemePreference } from './theme';

export function ThemeControl() {
  const [preference, setPreference] = useState(readTheme);
  useEffect(() => {
    applyTheme(preference);
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const change = () => applyTheme(preference);
    const storage = () => { const next = readTheme(); setPreference(next); applyTheme(next); };
    media?.addEventListener('change', change); window.addEventListener('storage', storage);
    return () => { media?.removeEventListener('change', change); window.removeEventListener('storage', storage); };
  }, [preference]);
  return <label className="theme-control"><SunMoon aria-hidden="true" /><span className="sr-only">Tema</span><select aria-label="Tema" value={preference} onChange={event => {
    const next = event.target.value as ThemePreference; applyTheme(next); setPreference(next);
    try { localStorage.setItem(themeStorageKey, next); } catch { /* UI remains usable without storage. */ }
  }}><option value="light">Claro</option><option value="dark">Escuro</option><option value="system">Sistema</option></select></label>;
}
