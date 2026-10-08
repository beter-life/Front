import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, UserRound } from 'lucide-react';
import { useMe, useUpdateProfile } from './hooks';
import { profileInputSchema } from './schema';
import type { Profile, ProfileInput } from './schema';
import { ApiError } from '../api/client';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FormInput } from '../components/form-input';
import { Loading, Feedback } from '../components/feedback';
import { PageHeader, SectionHeader } from '../components/ui/surface';
import { navigationItems, navigationGroups } from '../navigation/navigation-config';

function QueryFailure({ retry }: { retry: () => void }) { return <div className="space-y-5"><Feedback>Não foi possível carregar seu perfil. Sua sessão continua protegida.</Feedback><Button variant="outline" onClick={retry}>Tentar novamente</Button></div>; }
export function HomePage() {
  const me = useMe();
  if (me.isPending) return <Loading>Buscando seu perfil…</Loading>;
  if (me.isError) return <QueryFailure retry={() => { void me.refetch(); }} />;
  const profile = me.data.profile;
  return <><PageHeader title={profile ? 'Bom ter você aqui, ' + profile.displayName + '.' : 'Seu espaço começa com você.'} description="Tudo o que você precisa para cuidar da sua vida financeira, em um só lugar." />
    <SectionHeader title="O que você quer fazer?" /><div className="home-actions">{navigationItems.filter(item => item.shortcut).map(item => <Button asChild key={item.id} variant={item.id === 'movements' ? 'default' : 'outline'}><Link to={item.shortcut!.path}><item.icon aria-hidden="true" />{item.shortcut!.label}</Link></Button>)}<Button asChild variant="outline"><Link to="/finance/budgets">Ver orçamento</Link></Button></div>
    <SectionHeader title="Suas ferramentas" /><div className="home-tools">{navigationGroups.filter(group => group !== 'Conta' && group !== 'Início').map(group => <Card key={group}><h3>{group}</h3>{navigationItems.filter(item => item.group === group).map(item => <Link className="home-tool" key={item.id} to={item.path} aria-label={'Acessar ' + item.label}><item.icon aria-hidden="true" /><span>{item.label}</span><ArrowRight aria-hidden="true" /></Link>)}</Card>)}</div>
    <Card className="home-profile"><div><h2>{profile ? 'Perfil configurado' : 'Complete seu perfil'}</h2><p>Nome, idioma e fuso horário para sua experiência.</p></div><Button asChild variant="outline"><Link to="/profile">{profile ? 'Revisar perfil' : 'Completar meu perfil'}<ArrowRight aria-hidden="true" /></Link></Button></Card></>;
}
export function ProfilePage() {
  const me = useMe();
  return <><div className="page-intro"><p className="eyebrow">DO SEU JEITO</p><h1 tabIndex={-1}>Seu perfil.</h1><p>O básico para uma experiência que combina com você.</p></div>{me.isPending ? <Loading>Buscando seu perfil…</Loading> : me.isError ? <QueryFailure retry={() => { void me.refetch(); }} /> : <ProfileForm profile={me.data.profile} />}</>;
}
function ProfileForm({ profile }: { profile: Profile | null }) {
  const mutation = useUpdateProfile();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileInput>({ resolver: zodResolver(profileInputSchema), defaultValues: {
    displayName: profile?.displayName ?? '', locale: profile?.locale ?? 'pt-BR', timezone: profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  } });
  return <Card className="max-w-2xl"><div className="mb-8 flex items-start gap-4"><div className="rounded-full bg-muted p-3"><UserRound aria-hidden="true" className="size-6 text-primary" /></div><div><h2 className="text-lg font-semibold">Informações pessoais</h2><p className="mt-1 text-sm text-muted-foreground">{profile ? 'Você pode ajustar esses dados quando precisar.' : 'Complete seu perfil para concluir esta primeira etapa.'}</p></div></div><form noValidate className="form-stack" onSubmit={handleSubmit(async (input) => { try { const result = await mutation.mutateAsync(input); reset({ displayName: result.displayName, locale: result.locale, timezone: result.timezone }); } catch { /* Safe mutation feedback below. */ } })}><FormInput id="displayName" label="Como prefere ser chamado?" autoComplete="nickname" maxLength={100} error={errors.displayName?.message} {...register('displayName')} /><div className="grid gap-5 sm:grid-cols-2"><FormInput id="locale" label="Idioma" hint="Ex.: pt-BR, en-US ou es." error={errors.locale?.message} {...register('locale')} /><FormInput id="timezone" label="Fuso horário" hint="Ex.: America/Sao_Paulo." error={errors.timezone?.message} {...register('timezone')} /></div><div className="ui-form-feedback">{mutation.isError && <Feedback>{mutation.error instanceof ApiError ? mutation.error.message : 'Não foi possível salvar seu perfil. Tente novamente.'}</Feedback>}{mutation.isSuccess && <Feedback success>Perfil salvo. Tudo do seu jeito.</Feedback>}</div><div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6"><Link className="text-link text-sm" to="/app">Voltar ao início</Link><Button type="submit" disabled={isSubmitting || mutation.isPending}>{isSubmitting ? 'Salvando…' : 'Salvar perfil'}</Button></div></form></Card>;
}
