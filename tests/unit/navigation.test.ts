import { describe, expect, it } from 'vitest';
import { activeNavigation, expandableNavigationGroups, mobileNavigation, navigationGroups, navigationItems, pageBreadcrumbs, searchNavigation } from '../../src/navigation/navigation-config';

describe('single-source navigation', () => {
  it('prioritizes seven everyday destinations and only two secondary accordions', () => {
    expect(navigationItems.filter(item => item.group === 'Principal').map(item => item.id)).toEqual(['home', 'overview', 'movements', 'accounts', 'cards', 'budget', 'safe-spend']);
    expect(expandableNavigationGroups).toHaveLength(2);
    for (const group of expandableNavigationGroups) expect(navigationItems.filter(item => item.group === group).length).toBeGreaterThan(1);
    expect(navigationItems.find(item => item.id === 'categories')?.group).toBe('Mais');
  });
  it('maps all 15 base destinations with account security nested under the profile', () => {
    expect(navigationItems).toHaveLength(15);
    expect(new Set(navigationItems.map(item => item.id)).size).toBe(15);
    expect(new Set(navigationItems.map(item => item.path)).size).toBe(15);
    expect(navigationItems.filter(item => item.group === 'Conta').map(item => item.id)).toEqual(['profile']);
    for (const item of navigationItems) { expect(navigationGroups).toContain(item.group); expect(item.icon).toBeDefined(); expect(item.keywords.length).toBeGreaterThan(0); }
    expect(mobileNavigation.every(item => navigationItems.some(page => page.id === item.id))).toBe(true);
  });
  it.each(navigationItems)('$label has exact active identity', item => {
    expect(activeNavigation(item.path)?.id).toBe(item.id);
    if (item.exactMatch) expect(activeNavigation(item.path + '/unrelated')).toBeUndefined();
  });
  it.each(['cards', 'goals', 'debts'])('deep %s links have real ancestors and no technical label', name => {
    const path = '/finance/' + name + '/11111111-1111-4111-8111-111111111111';
    expect(activeNavigation(path)?.path).toBe('/finance/' + name);
    const crumbs = pageBreadcrumbs(path);
    expect(crumbs.map(crumb => crumb.path)).toEqual(['/finance', '/finance/' + name, path]);
    expect(crumbs.at(-1)?.label).toBe('Detalhes');
    expect(crumbs.some(crumb => crumb.label.includes('11111111'))).toBe(false);
  });
  it.each([['fatura', 'cards'], ['parcelas', 'cards'], ['EMPRÉSTIMO', 'debts'], ['assinatura', 'recurrences'], ['patrimônio', 'net-worth'], ['cdi', 'yield']])('finds %s locally', (word, id) => {
    expect(searchNavigation(word).map(item => item.id)).toContain(id);
  });
  it('never searches financial/private data and has a deterministic empty state', () => {
    expect(searchNavigation('gasto').map(item => item.id)).toEqual(['movements', 'safe-spend']);
    expect(searchNavigation('anything-not-a-page')).toEqual([]);
  });
  it.each(['segurança', 'senha', 'alterar senha'])('opens the security tab directly when searching %s', query => {
    expect(searchNavigation(query).map(item => item.path)).toEqual(['/profile?tab=security']);
    expect(pageBreadcrumbs('/profile', '?tab=security').map(item => item.label)).toEqual(['Meu perfil', 'Segurança']);
    expect(activeNavigation('/profile')?.id).toBe('profile');
  });
});
