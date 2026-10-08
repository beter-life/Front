export type ThemePreference = 'light' | 'dark' | 'system';
export const themeStorageKey = 'beter-life-theme';
export function readTheme(): ThemePreference {
  try { const value = localStorage.getItem(themeStorageKey); if (value === 'light' || value === 'dark') return value; } catch { /* Local preference is optional. */ }
  return 'system';
}
export function applyTheme(preference: ThemePreference) {
  const dark = preference === 'dark' || (preference === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}
