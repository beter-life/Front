import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { FormInput } from '../components/form-input';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Feedback } from '../components/feedback';
import { useAuthV2 } from './hooks';
import { newPasswordSchema } from './validation';

export function PasswordChangePageV2() {
  const { client, session } = useAuthV2();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !session) return;
    pending.current = true; setBusy(true); setError(''); setSuccess(false);
    try {
      const parsed = newPasswordSchema.safeParse({ password, confirmPassword });
      if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Confira a nova senha.'); return; }
      const result = await client.auth.updateUser({ password: parsed.data.password });
      if (result.error) { setError('Não foi possível atualizar a senha. Tente novamente.'); return; }
      setPassword(''); setConfirmPassword(''); setSuccess(true);
    } catch { setError('Não foi possível atualizar a senha. Tente novamente.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <><div className="page-intro"><p className="eyebrow">SEGURANÇA DA CONTA</p><h1 tabIndex={-1}>Alterar senha.</h1><p>Escolha uma senha forte que você ainda não usou aqui.</p></div>
    <Card className="max-w-2xl"><form className="form-stack" noValidate onSubmit={submit}>
      <FormInput id="password" label="Nova senha" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <FormInput id="confirmPassword" label="Confirmar nova senha" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      {error && <Feedback>{error}</Feedback>}{success && <Feedback success>Senha atualizada.</Feedback>}
      <Button type="submit" disabled={busy}>{busy ? 'Atualizando…' : 'Salvar nova senha'}</Button>
    </form></Card></>;
}
