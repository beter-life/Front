// UI-only preference, applied before stylesheet/React paint; no session/data access.
try {
  const value = localStorage.getItem('beter-life-theme');
  const dark = value === 'dark' || (value !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
} catch { document.documentElement.dataset.theme = 'light'; }
