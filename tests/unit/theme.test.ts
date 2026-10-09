import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, readTheme, themeStorageKey } from '../../src/theme/theme';
const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
const shellCss = readFileSync(resolve(process.cwd(), 'src/uiux-v2.css'), 'utf8');

afterEach(() => { localStorage.removeItem(themeStorageKey); vi.unstubAllGlobals(); });
describe('theme preferences without session/financial persistence', () => {
  it('defines identity only once per theme, without violet or decorative legacy green overrides', () => {
    expect(css.match(/--primary:/g)).toHaveLength(2);
    expect(shellCss).not.toMatch(/--primary:|:root/);
    expect(css + shellCss).not.toMatch(/#(?:6d28d9|5b21b6|b8a1ff|cabaff|d4c3ff|245d4a|193d35|f7f7f2|dee7d8|95b4a5)/i);
    expect(css).toContain('@import "./uiux-v2.css"');
  });
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
    const blocks = [...css.matchAll(/:root(?:\[data-theme="dark"\])?\s*\{([^}]+)\}/g)];
    expect(blocks).toHaveLength(2);
    let inherited: Record<string, string> = {};
    for (const block of blocks) {
      const tokens: Record<string, string> = { ...inherited, ...Object.fromEntries([...block[1]!.matchAll(/--([\w-]+):\s*(#[\da-f]+|var\(--[\w-]+\))/g)].map(match => [match[1], match[2]])) };
      const resolve = (name: string): string => { const token = tokens[name]!; const alias = token.match(/^var\(--([\w-]+)\)$/); return alias ? resolve(alias[1]!) : token; };
      const colors = Object.fromEntries(Object.keys(tokens).map(name => [name, resolve(name)]));
      inherited = tokens;
      for (const [a, b] of [['foreground', 'background'], ['muted-foreground', 'card'], ['muted-foreground', 'background'], ['primary', 'card'], ['primary-foreground', 'primary'], ['action-foreground', 'action-primary'], ['action-foreground', 'action-hover'], ['success', 'success-surface'], ['warning', 'warning-surface'], ['destructive', 'error-surface'], ['expense', 'expense-surface'], ['info', 'info-surface'], ['brand-foreground', 'brand-surface']]) {
        const x = luminance(colors[a!]!), y = luminance(colors[b!]!);
        expect((Math.max(x, y) + .05) / (Math.min(x, y) + .05), a + '/' + b).toBeGreaterThanOrEqual(4.5);
      }
      const x = luminance(colors.input!), y = luminance(colors.card!);
      expect((Math.max(x, y) + .05) / (Math.min(x, y) + .05)).toBeGreaterThanOrEqual(3);
    }
  });
});
