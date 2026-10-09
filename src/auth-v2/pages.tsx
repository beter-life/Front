import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { ArrowRight, KeyRound, MailCheck } from 'lucide-react';
import { FormInput } from '../components/form-input';
import { Button } from '../components/ui/button';
import { Feedback, Loading } from '../components/feedback';
import { verifySignup } from './confirmation';
import type { ConfirmationResult } from './confirmation';
import { signIn, LoginFailure } from './login';
import { useAuthV2 } from './hooks';
import { requestRecovery, setRecoveredPassword, verifyRecovery } from './recovery';
import { requestSignup } from './signup';
import { loginSchema, newPasswordSchema, recoveryRequestSchema, signupSchema } from './validation';

function Intro({ title, text }: { tag: string; title: string; text: string }) {
  return <div className="form-intro"><h1 tabIndex={-1}>{title}</h1><p>{text}</p></div>;
}

function clearTokenHash(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('token_hash');
  url.searchParams.delete('type');
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}

function ConfirmationPending({ signup }: { signup: boolean }) {
  return <div className="space-y-6"><MailCheck className="size-10 text-primary" aria-hidden="true" /><Intro
    tag="CONFIRA SUA CAIXA DE ENTRADA" title={signup ? 'Falta só confirmar.' : 'Solicitação recebida.'}
    text={signup
      ? 'Se o cadastro puder ser concluído, você receberá instruções para confirmar o e-mail.'
      : 'Se a conta puder receber recuperação, enviaremos as instruções.'}
  /><p className="text-sm text-muted-foreground">Confira também o spam. Uma resposta da página não confirma a entrega do e-mail.</p><Button asChild variant="outline"><Link to="/login">Voltar para entrar</Link></Button></div>;
}

export function LoginPageV2() {
  const { client, store, status } = useAuthV2();
  const navigate = useNavigate();
  const location = useLocation();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  if (status === 'loading') return <Loading />;
  if (status === 'authenticated') return <Navigate to="/app" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Confira os dados informados.'); return; }
      const session = await signIn(client, parsed.data);
      store.accept(session);
      const from: unknown = location.state?.from;
      navigate(from === '/profile' ? '/profile' : '/app', { replace: true });
    } catch (failure) {
      setError(failure instanceof LoginFailure ? failure.message : 'Não foi possível entrar. Tente novamente em instantes.');
    } finally { pending.current = false; setBusy(false); }
  }
  return <><Intro tag="BEM-VINDO DE VOLTA" title="Entrar" text="Acesse sua conta Beter Life." />
    {location.state?.passwordUpdated && <Feedback success>Senha atualizada. Entre com sua nova senha.</Feedback>}
    <form className="form-stack" noValidate onSubmit={submit}>
      <FormInput id="email" label="E-mail" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <div className="space-y-2"><FormInput id="password" label="Senha" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /><Link className="text-link block text-right text-sm" to="/forgot-password">Esqueceu sua senha?</Link></div>
      <Button type="submit" disabled={busy} className="w-full">{busy ? 'Entrando…' : 'Entrar na minha conta'}<ArrowRight aria-hidden="true" /></Button>
      <div className="auth-feedback" aria-live="polite">{error && <Feedback>{error}</Feedback>}</div>
    </form><p className="form-footnote">Ainda não tem uma conta? <Link className="text-link" to="/signup">Criar conta</Link></p></>;
}

export function SignupPageV2() {
  const { client, status } = useAuthV2();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  if (status === 'loading') return <Loading />;
  if (status === 'authenticated') return <Navigate to="/app" replace />;
  if (sent) return <ConfirmationPending signup />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const parsed = signupSchema.safeParse({ email, password, confirmPassword });
      if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Confira os dados informados.'); return; }
      await requestSignup(client, parsed.data, window.location.origin);
      setSent(true);
    } catch { setSent(true); } // Same public response for provider failures and unknown accounts.
    finally { pending.current = false; setBusy(false); }
  }
  return <><Intro tag="SEU PRIMEIRO PASSO" title="Criar conta" text="Informe seu e-mail e escolha uma senha." />
    <form className="form-stack" noValidate onSubmit={submit}>
      <FormInput id="email" label="E-mail" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <FormInput id="password" label="Senha" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <FormInput id="confirmPassword" label="Confirmar senha" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      <Button type="submit" disabled={busy} className="w-full">{busy ? 'Solicitando…' : 'Criar minha conta'}<ArrowRight aria-hidden="true" /></Button>
      <div className="auth-feedback" aria-live="polite">{error && <Feedback>{error}</Feedback>}</div>
    </form><p className="form-footnote">Já tem uma conta? <Link className="text-link" to="/login">Entrar</Link></p></>;
}

export function ForgotPasswordPageV2() {
  const { client } = useAuthV2();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  if (sent) return <ConfirmationPending signup={false} />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const parsed = recoveryRequestSchema.safeParse({ email });
      if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Informe um e-mail válido.'); return; }
      await requestRecovery(client, parsed.data, window.location.origin);
      setSent(true);
    } catch { setSent(true); } // Never claim an email was sent or disclose account existence.
    finally { pending.current = false; setBusy(false); }
  }
  return <><Intro tag="RECUPERAR ACESSO" title="Recuperar senha" text="Informe seu e-mail para solicitar a recuperação." />
    <form className="form-stack" noValidate onSubmit={submit}>
      <FormInput id="email" label="E-mail" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <Button type="submit" disabled={busy} className="w-full">{busy ? 'Solicitando…' : 'Enviar link de recuperação'}</Button>
      <div className="auth-feedback" aria-live="polite">{error && <Feedback>{error}</Feedback>}</div>
    </form><p className="form-footnote"><Link className="text-link" to="/login">Voltar para entrar</Link></p></>;
}

export function ConfirmationPageV2() {
  const { client } = useAuthV2();
  const flight = useRef<Promise<ConfirmationResult> | null>(null);
  const [result, setResult] = useState<ConfirmationResult | null>(null);
  useEffect(() => {
    if (!flight.current) {
      const params = new URL(window.location.href).searchParams;
      flight.current = verifySignup(client, params.get('token_hash'), params.get('type'))
        .catch((): ConfirmationResult => ({ status: 'invalid' }))
        .finally(clearTokenHash);
    }
    let active = true;
    void flight.current.then((value) => { if (active) setResult(value); });
    return () => { active = false; };
  }, [client]);
  if (!result) return <Loading>Confirmando seu e-mail…</Loading>;
  if (result.status === 'invalid') return <><Intro tag="VAMOS TENTAR DE NOVO" title="Este link não está disponível." text="Ele pode ter expirado ou já ter sido usado." /><Button asChild><Link to="/login">Voltar para entrar</Link></Button></>;
  return <><MailCheck className="mb-6 size-10 text-primary" aria-hidden="true" /><Intro tag="TUDO CERTO" title="E-mail confirmado." text="Você já pode acessar sua conta." /><Button asChild><Link to={result.session ? '/app' : '/login'}>Continuar<ArrowRight aria-hidden="true" /></Link></Button></>;
}

export function RecoveryPageV2() {
  const { client, store } = useAuthV2();
  const navigate = useNavigate();
  const flight = useRef<Promise<Session | null> | null>(null);
  const pending = useRef(false);
  const [session, setSession] = useState<Session | null | undefined>();
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!flight.current) {
      const params = new URL(window.location.href).searchParams;
      flight.current = verifyRecovery(client, params.get('token_hash'), params.get('type'))
        .catch(() => null)
        .finally(clearTokenHash);
    }
    let active = true;
    void flight.current.then((value) => { if (active) setSession(value); });
    return () => { active = false; };
  }, [client]);
  if (session === undefined) return <Loading>Validando seu link…</Loading>;
  if (!session) return <><Intro tag="VAMOS TENTAR DE NOVO" title="Este link não está disponível." text="Ele pode ter expirado ou já ter sido usado." /><Button asChild><Link to="/forgot-password">Solicitar outro link</Link></Button></>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const parsed = newPasswordSchema.safeParse({ password, confirmPassword });
      if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Confira a nova senha.'); return; }
      await setRecoveredPassword(client, session ?? null, parsed.data);
      await store.signOut();
      navigate('/login', { replace: true, state: { passwordUpdated: true } });
    } catch { setError('Não foi possível atualizar a senha. Tente novamente.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <><KeyRound className="mb-6 size-9 text-primary" aria-hidden="true" /><Intro tag="RECUPERAR ACESSO" title="Nova senha" text="Escolha uma senha forte que você ainda não usou aqui." />
    <form className="form-stack" noValidate onSubmit={submit}>
      <FormInput id="password" label="Nova senha" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <FormInput id="confirmPassword" label="Confirmar nova senha" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      <Button type="submit" disabled={busy} className="w-full">{busy ? 'Atualizando…' : 'Salvar nova senha'}</Button>
      <div className="auth-feedback" aria-live="polite">{error && <Feedback>{error}</Feedback>}</div>
    </form></>;
}
