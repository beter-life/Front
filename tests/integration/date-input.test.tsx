import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { Input } from '../../src/components/ui/input';

describe('date input keeps native form and controlled input contracts', () => {
  it('updates a controlled value once, preserves local time, and returns focus', async () => {
    const change=vi.fn(), user=userEvent.setup();
    function Form() { const [value,setValue]=useState('2026-01-31T23:45'); return <Input calendarLabel="Data e hora" type="datetime-local" name="when" value={value} onChange={event=>{change(event.target.value);setValue(event.target.value);}}/>; }
    render(<Form/>);
    await user.click(screen.getByRole('button',{name:'Abrir calendário: Data e hora'}));
    await screen.findByRole('grid', {}, { timeout: 10000 });
    const day=await screen.findByRole('button',{name:/, 1 de fevereiro de 2026(?:,|$)/i});
    await user.click(day);
    const input=screen.getByLabelText('Data e hora');
    expect(input).toHaveValue('2026-02-01T23:45'); expect(change).toHaveBeenCalledOnce(); expect(input).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  }, 15000);
  it('writes only the chosen date to native FormData and honors min/max', async () => {
    const user=userEvent.setup();
    render(<form aria-label="Fixture"><Input calendarLabel="Data" name="date" type="date" defaultValue="2026-02-01" min="2026-02-01" max="2026-02-03" required/></form>);
    await user.click(screen.getByRole('button',{name:'Abrir calendário: Data'}));
    const dialog=screen.getByRole('dialog');
    await screen.findByRole('button',{name:/, 2 de fevereiro de 2026(?:,|$)/i});
    expect(within(dialog).getByRole('button',{name:/, 4 de fevereiro de 2026(?:,|$)/i})).toBeDisabled();
    await user.click(within(dialog).getByRole('button',{name:/, 2 de fevereiro de 2026(?:,|$)/i}));
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('date')).toBe('2026-02-02');
    (screen.getByRole('form') as HTMLFormElement).reset(); expect(screen.getByLabelText('Data')).toHaveValue('2026-02-01');
  });
  it('retains React Hook Form registration and does not submit on calendar selection', async () => {
    const submit=vi.fn(),user=userEvent.setup();
    function Form() { const {register,handleSubmit}=useForm({defaultValues:{date:'2026-02-01'}}); return <form onSubmit={handleSubmit(submit)}><Input calendarLabel="Data" type="date" {...register('date')}/><button type="submit">Salvar</button></form>; }
    render(<Form/>); await user.click(screen.getByRole('button',{name:'Abrir calendário: Data'}));
    await user.click(await screen.findByRole('button',{name:/, 2 de fevereiro de 2026(?:,|$)/i}));
    expect(submit).not.toHaveBeenCalled(); await user.click(screen.getByRole('button',{name:'Salvar'}));
    expect(submit.mock.calls[0]?.[0]).toEqual({date:'2026-02-02'});
  });
  it('does not open an enabled-looking calendar in a disabled fieldset', async () => {
    render(<fieldset disabled><Input calendarLabel="Data" type="date"/></fieldset>);
    expect(screen.getByRole('button',{name:'Abrir calendário: Data'})).toBeDisabled();
  });
});
