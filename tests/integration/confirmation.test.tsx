import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmAction } from '../../src/components/ui/confirm-action';

describe('presentation confirmation boundary', () => {
  it('never writes when opening or cancelling; confirms exactly once', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined), user = userEvent.setup();
    render(<ConfirmAction label="Desativar" title="Desativar conta" impact="Histórico preservado." pending={false} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Desativar' }));
    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Voltar sem alterar' }));
    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Desativar' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Desativar conta' });
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar ação' }));
    expect(onConfirm).toHaveBeenCalledTimes(1); expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
  it('retains the dialog on failure and exposes only neutral feedback', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('private-provider-detail')), user = userEvent.setup();
    render(<ConfirmAction label="Cancelar" title="Cancelar movimento" impact="Correção preserva o registro." pending={false} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar ação' }));
    expect(screen.getByRole('alertdialog')).toBeVisible(); expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível concluir. Tente novamente.');
    expect(screen.queryByText('private-provider-detail')).not.toBeInTheDocument();
  });
});
