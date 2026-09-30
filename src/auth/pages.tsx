import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, MailCheck, KeyRound } from 'lucide-react';
import { loginSchema, signupSchema, emailSchema, passwordSchema } from './schema';
import type { LoginInput, SignupInput, EmailInput, PasswordInput } from './schema';
import { AuthFailure } from './gateway';
import { PkceFailure } from './pkce-storage';
import { useAuth, useServices } from '../hooks/use-services';
import { FormInput } from '../components/form-input';
import { Button } from '../components/ui/button';
import { Feedback, Loading } from '../components/feedback';

const message = (error: unknown) => error instanceof AuthFailure || error instanceof PkceFailure ? error.message : 'Não foi possível concluir. Tente novamente em instantes.';
function Intro({ title, text, tag }: { title: string; text: string; tag: string }) { return <div className="form-intro"><p className="eyebrow">{tag}</p><h1 tabIndex={-1}>{title}</h1><p>{text}</p></div>; }
function SessionGate() { const auth = useAuth(); if (auth.status === 'loading') return <Loading />; if (auth.recovery) return <Navigate to="/auth/recovery" replace />; if (auth.status === 'authenticated') return <Navigate to="/app" replace />; return null; }
export function LoginPage() {
  const { auth } = useServices(); const state = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  if (state.status === 'loading' || state.status === 'authenticated') return <SessionGate />;
  const submit = handleSubmit(async ({ email, password }) => { setError(''); try { await auth.login(email, password); const next: unknown = location.state?.from; navigate(next === '/profile' ? '/profile' : '/app', { replace: true }); } catch (failure) { setError(message(failure)); } });
  return <><Intro tag="BEM-VINDO DE VOLTA" title="Bom ter você aqui." text="Entre na sua conta e continue de onde parou." />{location.state?.passwordUpdated && <Feedback success>Senha atualizada. Entre com sua nova senha.</Feedback>}<form onSubmit={submit} noValidate className="form-stack"><FormInput id="email" label="E-mail" type="email" autoComplete="email" placeholder="voce@exemplo.com" error={errors.email?.message} {...register('email')} /><div className="space-y-2"><FormInput id="password" label="Senha" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} /><Link className="text-link block text-right text-sm" to="/forgot-password">Esqueceu sua senha?</Link></div>{error && <Feedback>{error}</Feedback>}<Button disabled={isSubmitting} className="w-full" type="submit">{isSubmitting ? 'Entrando…' : 'Entrar na minha conta'}<ArrowRight aria-hidden="true" /></Button></form><p className="form-footnote">Ainda não tem uma conta? <Link className="text-link" to="/signup">Comece por aqui</Link></p></>;
}
export function SignupPage() {
  const { auth } = useServices(); const state = useAuth(); const navigate = useNavigate();
  const [error, setError] = useState(''); const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });
  if (state.status === 'loading' || state.status === 'authenticated') return <SessionGate />;
  if (sent) return <EmailSent signup />;
  return <><Intro tag="SEU PRIMEIRO PASSO" title="Vamos começar?" text="Crie sua conta. O resto, um passo de cada vez." /><form noValidate className="form-stack" onSubmit={handleSubmit(async ({ email, password }) => { setError(''); try { if (await auth.signup(email, password)) navigate('/app', { replace: true }); else setSent(true); } catch (failure) { setError(message(failure)); } })}><FormInput id="email" label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} /><FormInput id="password" label="Senha" type="password" autoComplete="new-password" hint="Use pelo menos 8 caracteres. Combine letras, números e símbolos." error={errors.password?.message} {...register('password')} /><FormInput id="confirmPassword" label="Confirmar senha" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />{error && <Feedback>{error}</Feedback>}<Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Criando conta…' : 'Criar minha conta'}<ArrowRight aria-hidden="true" /></Button></form><p className="form-footnote">Já tem uma conta? <Link className="text-link" to="/login">Entrar</Link></p></>;
}
function EmailSent({ signup = false }: { signup?: boolean }) { return <div className="space-y-6"><MailCheck className="size-10 text-primary" aria-hidden="true" /><Intro tag="CONFIRA SUA CAIXA DE ENTRADA" title={signup ? 'Falta só confirmar.' : 'O próximo passo está no seu e-mail.'} text={signup ? 'Se o cadastro puder ser concluído, você receberá um link para confirmar seu e-mail.' : 'Se houver uma conta para esse e-mail, enviaremos um link para criar uma nova senha.'} /><p className="text-sm leading-relaxed text-muted-foreground">Confira também o spam. Abra o link neste mesmo navegador, onde você iniciou a solicitação.</p><Button asChild variant="outline"><Link to="/login">Voltar para entrar</Link></Button></div>; }
export function ForgotPasswordPage() {
  const { auth } = useServices(); const [error, setError] = useState(''); const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmailInput>({ resolver: zodResolver(emailSchema) });
  if (sent) return <EmailSent />;
  return <><Intro tag="RECUPERAR ACESSO" title="Acontece. Vamos resolver." text="Informe seu e-mail para receber um link de recuperação." /><form noValidate className="form-stack" onSubmit={handleSubmit(async ({ email }) => { setError(''); try { await auth.gateway.recover(email); setSent(true); } catch (failure) { setError(message(failure)); } })}><FormInput id="email" label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />{error && <Feedback>{error}</Feedback>}<Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Enviando…' : 'Enviar link de recuperação'}</Button></form><p className="form-footnote"><Link className="text-link" to="/login">Voltar para entrar</Link></p></>;
}
function InvalidLink({ recovery = false }: { recovery?: boolean }) { return <div className="space-y-6"><Intro tag="VAMOS TENTAR DE NOVO" title="Este link não está disponível." text="Ele pode ter expirado, já ter sido usado ou ter sido aberto em outro navegador." /><Feedback>{recovery ? 'Solicite um novo link de recuperação e abra-o neste navegador.' : 'Abra o link de confirmação no navegador usado para criar a conta. Se você já confirmou, entre normalmente.'}</Feedback><Button asChild><Link to={recovery ? '/forgot-password' : '/login'}>{recovery ? 'Solicitar outro link' : 'Voltar para entrar'}</Link></Button></div>; }
export function ConfirmationPage() {
  const state = useAuth();
  if (state.status === 'loading' || state.callback === 'pending') return <Loading>Confirmando seu e-mail…</Loading>;
  if (state.recovery) return <Navigate to="/auth/recovery" replace />;
  if (state.callback !== 'success') return <InvalidLink />;
  return <div className="space-y-6"><MailCheck className="size-10 text-primary" aria-hidden="true" /><Intro tag="TUDO CERTO" title="E-mail confirmado." text="Sua conta está pronta. Vamos cuidar do seu perfil?" /><Button asChild><Link to={state.session ? '/app' : '/login'}>Continuar<ArrowRight aria-hidden="true" /></Link></Button></div>;
}
export function RecoveryPage() {
  const state = useAuth(); const { auth } = useServices(); const navigate = useNavigate(); const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema) });
  if (state.status === 'loading' || state.callback === 'pending') return <Loading>Validando seu link…</Loading>;
  if (!state.recovery || !state.session) return <InvalidLink recovery />;
  return <><KeyRound className="mb-6 size-9 text-primary" aria-hidden="true" /><Intro tag="RECUPERAR ACESSO" title="Uma nova senha." text="Escolha uma senha forte que você ainda não usou aqui." /><form noValidate className="form-stack" onSubmit={handleSubmit(async ({ password }) => { setError(''); try { await auth.completeRecovery(password); navigate('/login', { replace: true, state: { passwordUpdated: true } }); } catch (failure) { setError(message(failure)); } })}><FormInput id="password" label="Nova senha" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} /><FormInput id="confirmPassword" label="Confirmar nova senha" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />{error && <Feedback>{error}</Feedback>}<Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Atualizando…' : 'Salvar nova senha'}</Button></form></>;
}
