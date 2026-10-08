import { ArrowLeftRight, CalendarDays, ChartPie, CreditCard, HandCoins, House, KeyRound, Landmark, Layers3, Repeat2, ShieldCheck, Tags, Target, TrendingUp, UserRound, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const navigationGroups = ['Principal', 'Contas e pagamentos', 'Planejamento', 'Patrimônio', 'Mais', 'Conta'] as const;
export const expandableNavigationGroups = ['Contas e pagamentos', 'Planejamento', 'Patrimônio'] as const;
export type NavigationGroup = typeof navigationGroups[number];
export interface NavigationItem {
  id: string; label: string; path: string; icon: LucideIcon; group: NavigationGroup;
  keywords: readonly string[]; exactMatch: boolean;
  shortcut?: { label: string; path: string };
}
export const navigationItems: readonly NavigationItem[] = [
  { id: 'home', label: 'Página inicial', path: '/app', icon: House, group: 'Principal', keywords: ['inicio', 'home'], exactMatch: true },
  { id: 'overview', label: 'Visão geral', path: '/finance', icon: Wallet, group: 'Principal', keywords: ['financas', 'saldo', 'resumo'], exactMatch: true },
  { id: 'movements', label: 'Movimentos', path: '/finance/transactions', icon: ArrowLeftRight, group: 'Principal', keywords: ['gasto', 'receita', 'despesa', 'transferencia'], exactMatch: true, shortcut: { label: 'Novo movimento', path: '/finance/transactions?action=create' } },
  { id: 'safe-spend', label: 'Quanto posso gastar?', path: '/finance/safe-to-spend', icon: ShieldCheck, group: 'Principal', keywords: ['gasto', 'planejar', 'seguranca', 'disponivel'], exactMatch: true },
  { id: 'accounts', label: 'Contas', path: '/finance/accounts', icon: Landmark, group: 'Contas e pagamentos', keywords: ['banco', 'dinheiro', 'carteira'], exactMatch: true, shortcut: { label: 'Nova conta', path: '/finance/accounts?action=create' } },
  { id: 'cards', label: 'Cartões', path: '/finance/cards', icon: CreditCard, group: 'Contas e pagamentos', keywords: ['fatura', 'parcelas', 'credito', 'cartao'], exactMatch: false, shortcut: { label: 'Novo cartão', path: '/finance/cards?action=create' } },
  { id: 'budget', label: 'Orçamento', path: '/finance/budgets', icon: ChartPie, group: 'Principal', keywords: ['limite', 'mensal', 'categoria'], exactMatch: true },
  { id: 'calendar', label: 'Calendário', path: '/finance/calendar', icon: CalendarDays, group: 'Planejamento', keywords: ['agenda', 'vencimento', 'data'], exactMatch: true },
  { id: 'recurrences', label: 'Recorrências', path: '/finance/recurrences', icon: Repeat2, group: 'Planejamento', keywords: ['assinatura', 'recorrente', 'previsao'], exactMatch: true },
  { id: 'goals', label: 'Metas', path: '/finance/goals', icon: Target, group: 'Planejamento', keywords: ['objetivo', 'sonho'], exactMatch: false, shortcut: { label: 'Nova meta', path: '/finance/goals?action=create' } },
  { id: 'debts', label: 'Dívidas', path: '/finance/debts', icon: HandCoins, group: 'Contas e pagamentos', keywords: ['emprestimo', 'quitacao', 'avalanche', 'snowball'], exactMatch: false },
  { id: 'net-worth', label: 'Patrimônio', path: '/finance/net-worth', icon: Layers3, group: 'Patrimônio', keywords: ['ativo', 'passivo', 'patrimonio'], exactMatch: true },
  { id: 'yield', label: 'Rendimentos', path: '/finance/yield', icon: TrendingUp, group: 'Patrimônio', keywords: ['cdi', 'selic', 'poupanca', 'taxa'], exactMatch: true },
  { id: 'categories', label: 'Categorias', path: '/finance/categories', icon: Tags, group: 'Mais', keywords: ['classificar', 'organizacao'], exactMatch: true },
  { id: 'profile', label: 'Meu perfil', path: '/profile', icon: UserRound, group: 'Conta', keywords: ['nome', 'idioma', 'fuso'], exactMatch: true },
  { id: 'security', label: 'Segurança', path: '/account/password', icon: KeyRound, group: 'Conta', keywords: ['senha', 'alterar senha'], exactMatch: true },
];
export function activeNavigation(path: string) {
  return navigationItems.find(item => path === item.path || (!item.exactMatch && path.startsWith(item.path + '/')));
}
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function searchNavigation(query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return navigationItems.filter(item => words.every(word => normalize([item.label, item.group, ...item.keywords].join(' ')).includes(word)));
}
export function pageBreadcrumbs(path: string) {
  const item = activeNavigation(path);
  if (!item) return [{ label: 'Página inicial', path: '/app' }];
  const result = item.path.startsWith('/finance') && item.id !== 'overview' ? [{ label: 'Finanças', path: '/finance' }] : [];
  result.push({ label: item.label, path: item.path });
  if (path !== item.path) result.push({ label: 'Detalhes', path });
  return result;
}
export const mobileNavigation = [
  { id: 'home', label: 'Início' }, { id: 'overview', label: 'Finanças' },
  { id: 'movements', label: 'Movimentos' }, { id: 'safe-spend', label: 'Planejar' },
] as const;
