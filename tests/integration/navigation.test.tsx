import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AppShell } from '../../src/navigation/app-shell';
import { useCreationShortcut } from '../../src/navigation/use-creation-shortcut';
import { navigationItems } from '../../src/navigation/navigation-config';

function Shell({ logout = vi.fn() }: { logout?: () => void }) { return <AppShell busy={false} error={false} onLogout={logout}><h1 tabIndex={-1}>Conteúdo existente</h1><input aria-label="Campo de edição" /></AppShell>; }
function setup(path = '/finance/cards', logout?: () => void) {
  localStorage.clear(); render(<StrictMode><MemoryRouter initialEntries={[path]}><Routes><Route path="*" element={<Shell logout={logout} />} /></Routes></MemoryRouter></StrictMode>);
  return userEvent.setup();
}
describe('navigation presentation only', () => {
  it('keeps five primary links direct, account links at the bottom, and only three toggles', () => {
    setup('/app'); const nav = screen.getByRole('navigation', { name: 'Navegação principal' });
    expect(within(nav).getAllByRole('button')).toHaveLength(3);
    for (const name of ['Página inicial', 'Visão geral', 'Movimentos', 'Quanto posso gastar?', 'Orçamento', 'Categorias']) expect(within(nav).getByRole('link', { name })).toBeVisible();
    expect(within(nav).queryByRole('link', { name: 'Meu perfil' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('complementary', { name: 'Barra lateral' })).getByRole('link', { name: 'Meu perfil' })).toBeVisible();
  });
  it('opens the active group, supports expansion and does not add Finance horizontal nav', async () => {
    const user = setup(); const nav = screen.getByRole('navigation', { name: 'Navegação principal' });
    expect(within(nav).getByRole('button', { name: 'Contas e pagamentos' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(nav).getByRole('link', { name: 'Cartões' })).toHaveAttribute('aria-current', 'page');
    await user.click(within(nav).getByRole('button', { name: 'Planejamento' }));
    expect(within(nav).getByRole('link', { name: 'Metas' })).toBeVisible();
    expect(screen.queryByRole('navigation', { name: 'Finanças' })).not.toBeInTheDocument();
  });
  it('searches aliases and routes by keyboard with a real breadcrumb', async () => {
    const user = setup('/finance'); await user.click(screen.getByRole('button', { name: 'Buscar páginas' }));
    const dialog = screen.getByRole('dialog', { name: 'Buscar páginas' });
    await user.type(within(dialog).getByRole('combobox'), 'fatura'); await user.keyboard('{Enter}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Caminho da página' })).getByText('Cartões')).toHaveAttribute('aria-current', 'page');
  });
  it('lists every real destination in the full mobile menu, closes after navigation', async () => {
    const user = setup(); await user.click(screen.getByRole('button', { name: 'Mais, abrir menu completo' }));
    const dialog = screen.getByRole('dialog', { name: 'Todas as ferramentas' });
    for (const item of navigationItems) expect(within(dialog).getByRole('link', { name: item.label })).toHaveAttribute('href', item.path);
    await user.click(within(dialog).getByRole('link', { name: 'Orçamento' })); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('ignores Ctrl+K while editing, has empty results and exposes rail labels', async () => {
    const user = setup(); await user.click(screen.getByLabelText('Campo de edição')); await user.keyboard('{Control>}k{/Control}'); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Recolher navegação' })); expect(localStorage.getItem('beter-life-sidebar-rail')).toBe('true');
    expect(within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole('link', { name: 'Dívidas' })).toHaveAttribute('title', 'Dívidas');
    await user.click(screen.getByRole('button', { name: 'Buscar páginas' })); await user.type(screen.getByLabelText('Para onde você quer ir?'), 'no-such-page'); expect(screen.getByRole('status')).toHaveTextContent('Nenhuma página encontrada');
  });
  it('keeps the logout callback and pending behavior at the existing boundary', async () => {
    const logout = vi.fn(), user = setup('/app', logout); await user.click(screen.getByRole('button', { name: 'Sair da conta' })); expect(logout).toHaveBeenCalledTimes(1);
  });
  it('opens a creation shortcut without submitting and consumes it on close', async () => {
    const submit = vi.fn();
    function Form() { const [open, setOpen] = useCreationShortcut(); return <><button onClick={() => setOpen(true)}>Abrir</button>{open && <form onSubmit={submit}><h1>Editor existente</h1><button type="button" onClick={() => setOpen(false)}>Fechar editor</button></form>}</>; }
    render(<MemoryRouter initialEntries={['/finance/accounts?action=create&currency=BRL']}><Form /></MemoryRouter>);
    expect(screen.getByRole('heading')).toHaveTextContent('Editor existente'); expect(submit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Fechar editor' })); expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
