import css from '../../src/uiux-v2.css?raw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, readTheme, themeStorageKey } from '../../src/theme/theme';

afterEach(() => { localStorage.removeItem(themeStorageKey); vi.unstubAllGlobals(); });
describe('theme preferences without session/financial persistence', () => {
  it.each(['light', 'dark'] as const)('persists valid %s preference only', preference => {
    localStorage.setItem(themeStorageKey, preference); expect(readTheme()).toBe(preference);
    applyTheme(preference); expect(document.documentElement.dataset.theme).toBe(preference);
  });
  it('defaults safely to system and follows the current OS', () => {
    localStorage.setItem(themeStorageKey, 'invalid'); expect(readTheme()).toBe('system');
    vi.stubGlobal('matchMedia', () => ({ matches: true })); applyTheme('system'); expect(document.documentElement.dataset.theme).toBe('dark');
    vi.stubGlobal('matchMedia', () => ({ matches: false })); applyTheme('system'); expect(document.documentElement.dataset.theme).toBe('light');
  });
  it('maintains WCAG AA text contrasts for semantic pairs in both themes', () => {
    const luminance = (hex: string) => {
      const value = hex.length === 4 ? '#' + [...hex.slice(1)].map(c => c + c).join('') : hex;
      const channels = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
      return channels[0]! * .2126 + channels[1]! * .7152 + channels[2]! * .0722;
    };
    for (const block of css.matchAll(/:root(?:\[data-theme="dark"\])?\s*\{([^}]+)\}/g)) {
      const colors = Object.fromEntries([...block[1]!.matchAll(/--([\w-]+):\s*(#[\da-f]+)/g)].map(match => [match[1], match[2]]));
      for (const [a, b] of [['foreground', 'background'], ['muted-foreground', 'card'], ['primary', 'card'], ['primary-foreground', 'primary'], ['success', 'success-surface'], ['warning', 'warning-surface'], ['destructive', 'error-surface']]) {
        const x = luminance(colors[a!]!), y = luminance(colors[b!]!);
        expect((Math.max(x, y) + .05) / (Math.min(x, y) + .05), a + '/' + b).toBeGreaterThanOrEqual(4.5);
      }
      const x = luminance(colors.input!), y = luminance(colors.card!);
      expect((Math.max(x, y) + .05) / (Math.min(x, y) + .05)).toBeGreaterThanOrEqual(3);
    }
  });
});
