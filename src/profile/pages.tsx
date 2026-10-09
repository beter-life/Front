import { Link, useSearchParams } from 'react-router';
import type { KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, UserRound } from 'lucide-react';
import { useMe, useUpdateProfile } from './hooks';
import { profileInputSchema } from './schema';
import type { Profile, ProfileInput } from './schema';
import { ApiError } from '../api/client';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FormGrid } from '../components/ui/form-section';
import { FormInput } from '../components/form-input';
import { Loading, Feedback } from '../components/feedback';
import { PageHeader, SectionHeader } from '../components/ui/surface';
import { navigationItems } from '../navigation/navigation-config';
import { PasswordChangeFormV2 } from '../auth-v2/password-change';

function QueryFailure({ retry }: { retry: () => void }) { return <div className="space-y-5"><Feedback>Não foi possível carregar seu perfil. Sua sessão continua protegida.</Feedback><Button variant="outline" onClick={retry}>Tentar novamente</Button></div>; }
export function HomePage() {
  const me = useMe();
  if (me.isPending) return <Loading>Buscando seu perfil…</Loading>;
  if (me.isError) return <QueryFailure retry={() => { void me.refetch(); }} />;
  const profile = me.data.profile;
  const essentials = ['overview', 'safe-spend', 'budget', 'cards'];
  const descriptions: Record<string, string> = { overview: 'Saldos e resultado por moeda.', 'safe-spend': 'Planeje sem comprometer suas reservas.', budget: 'Acompanhe os limites do mês.', cards: 'Faturas, compras e pagamentos.' };
  const remaining = navigationItems.filter(item => !essentials.includes(item.id) && item.group !== 'Conta' && item.id !== 'home');
  const toolGroups = [{ label: 'Dia a dia', groups: ['Principal', 'Mais'] }, { label: 'Planejamento', groups: ['Planejamento'] }, { label: 'Patrimônio', groups: ['Patrimônio'] }];
  return <><PageHeader title={'Início'} description={profile?.displayName} actions={<Button asChild><Link to="/finance/transactions?action=create"><ArrowRight aria-hidden="true" />Novo movimento</Link></Button>} />
    <SectionHeader title="Seu dia financeiro" /><nav aria-label="Ferramentas essenciais" className="home-essential">{essentials.map(id => {
      const item = navigationItems.find(item => item.id === id)!;
      return <Link key={id} className="home-essential-link" to={item.path} aria-label={'Acessar ' + item.label}><item.icon aria-hidden="true" /><strong>{id === 'overview' ? 'Visão financeira' : item.label}</strong><p>{descriptions[id]}</p></Link>;
    })}</nav>
    <div className="home-actions" aria-label="Atalhos de criação">{navigationItems.filter(item => item.shortcut && item.id !== 'movements').map(item => <Button asChild key={item.id} variant="outline" size="compact"><Link to={item.shortcut!.path}><item.icon aria-hidden="true" />{item.shortcut!.label}</Link></Button>)}</div>
    <SectionHeader title="Organize e planeje" /><div className="home-tools">{toolGroups.map(group => <section className="home-tool-group" key={group.label}><h3>{group.label}</h3>{remaining.filter(item => group.groups.includes(item.group)).map(item => <Link className="home-tool" key={item.id} to={item.path} aria-label={'Acessar ' + item.label}><item.icon aria-hidden="true" /><span>{item.label}</span><ArrowRight aria-hidden="true" /></Link>)}</section>)}</div>
    <section className="home-profile"><div><h2>{profile ? 'Seu perfil' : 'Complete seu perfil'}</h2><p>Dados pessoais e segurança da conta.</p></div><Button asChild variant="ghost"><Link to="/profile">{profile ? 'Revisar perfil' : 'Completar meu perfil'}<ArrowRight aria-hidden="true" /></Link></Button></section></>;
}
export function ProfilePage() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('tab') === 'security' ? 'security' : 'data';
  const tabs = [{ id: 'data', label: 'Dados pessoais' }, { id: 'security', label: 'Segurança' }] as const;
  function select(id: 'data' | 'security') {
    if (selected === id) return;
    const next = new URLSearchParams(params);
    if (id === 'security') next.set('tab', id); else next.delete('tab');
    setParams(next);
  }
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : event.key === 'ArrowRight' ? (index + 1) % 2 : event.key === 'ArrowLeft' ? (index + 1) % 2 : null;
    if (next === null) return;
    event.preventDefault(); select(tabs[next]!.id);
    document.getElementById('profile-tab-' + tabs[next]!.id)?.focus();
  }
  return <><PageHeader title="Meu perfil" description="Seus dados pessoais e a segurança da conta." />
    <div role="tablist" aria-label="Configurações do perfil" className="mb-6 flex flex-wrap gap-2">{tabs.map((tab, index) => <Button key={tab.id} id={'profile-tab-' + tab.id} role="tab" aria-selected={selected === tab.id} aria-controls={'profile-panel-' + tab.id} tabIndex={selected === tab.id ? 0 : -1} variant={selected === tab.id ? 'default' : 'outline'} onClick={() => select(tab.id)} onKeyDown={event => move(event, index)}>{tab.label}</Button>)}</div>
    {tabs.map(tab => <section key={tab.id} id={'profile-panel-' + tab.id} role="tabpanel" aria-labelledby={'profile-tab-' + tab.id} hidden={selected !== tab.id} tabIndex={0}>
      {selected === tab.id && (tab.id === 'security' ? <PasswordChangeFormV2 /> : <ProfileDataPanel />)}
    </section>)}</>;
}
function ProfileDataPanel() {
  const me = useMe();
  return me.isPending ? <Loading>Buscando seu perfil…</Loading> : me.isError ? <QueryFailure retry={() => { void me.refetch(); }} /> : <ProfileForm profile={me.data.profile} />;
}
function ProfileForm({ profile }: { profile: Profile | null }) {
  const mutation = useUpdateProfile();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileInput>({ resolver: zodResolver(profileInputSchema), defaultValues: {
    displayName: profile?.displayName ?? '', locale: profile?.locale ?? 'pt-BR', timezone: profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  } });
  return <Card className="ui-form-panel"><div className="mb-6 flex items-start gap-4"><div className="rounded-full bg-muted p-3"><UserRound aria-hidden="true" className="size-6 text-primary" /></div><div><h2 className="text-lg font-semibold">Informações pessoais</h2>{!profile && <p className="mt-1 text-sm text-muted-foreground">Informe seu nome, idioma e fuso horário.</p>}</div></div><form noValidate className="form-stack" onSubmit={handleSubmit(async (input) => { try { const result = await mutation.mutateAsync(input); reset({ displayName: result.displayName, locale: result.locale, timezone: result.timezone }); } catch { /* Safe mutation feedback below. */ } })}><FormGrid className="ui-profile-fields"><FormInput reserveErrorSpace id="displayName" label="Como prefere ser chamado?" autoComplete="nickname" maxLength={100} error={errors.displayName?.message} {...register('displayName')} /><FormInput reserveErrorSpace id="locale" label="Idioma" hint="Ex.: pt-BR, en-US ou es." error={errors.locale?.message} {...register('locale')} /><FormInput reserveErrorSpace id="timezone" label="Fuso horário" hint="Ex.: America/Sao_Paulo." error={errors.timezone?.message} {...register('timezone')} /></FormGrid><div className="ui-form-actions"><Link className="text-link text-sm" to="/app">Voltar ao início</Link><Button type="submit" disabled={isSubmitting || mutation.isPending}>{isSubmitting ? 'Salvando…' : 'Salvar perfil'}</Button></div><div className="ui-form-feedback">{mutation.isError && <Feedback>{mutation.error instanceof ApiError ? mutation.error.message : 'Não foi possível salvar seu perfil. Tente novamente.'}</Feedback>}{mutation.isSuccess && <Feedback success>Perfil salvo.</Feedback>}</div></form></Card>;
}
