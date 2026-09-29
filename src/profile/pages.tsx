import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CircleCheck, UserRound, ShieldCheck } from 'lucide-react';
import { useMe, useUpdateProfile } from './hooks';
import { profileInputSchema } from './schema';
import type { Profile, ProfileInput } from './schema';
import { ApiError } from '../api/client';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FormInput } from '../components/form-input';
import { Loading, Feedback } from '../components/feedback';

function QueryFailure({ retry }: { retry: () => void }) { return <div className="space-y-5"><Feedback>Não foi possível carregar seu perfil. Sua sessão continua protegida.</Feedback><Button variant="outline" onClick={retry}>Tentar novamente</Button></div>; }
export function HomePage() {
  const me = useMe();
  if (me.isPending) return <Loading>Buscando seu perfil…</Loading>;
  if (me.isError) return <QueryFailure retry={() => { void me.refetch(); }} />;
  const profile = me.data.profile;
  return <><div className="page-intro"><p className="eyebrow">COMECE PELO ESSENCIAL</p><h1 tabIndex={-1}>{profile ? 'Bom ter você aqui, ' + profile.displayName + '.' : 'Seu espaço começa com você.'}</h1><p>{profile ? 'Sua conta está pronta para os próximos passos.' : 'Vamos deixar tudo com a sua cara. Leva só um momento.'}</p></div><Card className="welcome-card"><div className="rounded-xl bg-primary/10 p-3 text-primary"><UserRound aria-hidden="true" className="size-7" /></div><div className="flex-1"><p className="eyebrow">{profile ? 'PERFIL CONFIGURADO' : 'PRIMEIRO PASSO'}</p><h2>{profile ? 'Os detalhes fazem diferença.' : 'Como podemos chamar você?'}</h2><p>{profile ? 'Mantenha seu nome, idioma e fuso horário atualizados.' : 'Seu nome, idioma e fuso horário ajudam a preparar uma experiência mais pessoal.'}</p></div><Button asChild><Link to="/profile">{profile ? 'Revisar perfil' : 'Completar meu perfil'}<ArrowRight aria-hidden="true" /></Link></Button></Card><div className="mt-8 grid gap-6 sm:grid-cols-2"><Card><CircleCheck aria-hidden="true" className="mb-5 size-6 text-primary" /><h2 className="text-lg font-semibold">Um começo organizado.</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Este é seu ponto de partida. As próximas ferramentas vão ganhar espaço aqui, no seu tempo.</p></Card><Card><ShieldCheck aria-hidden="true" className="mb-5 size-6 text-primary" /><h2 className="text-lg font-semibold">Um espaço só seu.</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Seu perfil está associado à sua conta. Ao terminar em um computador compartilhado, lembre-se de sair.</p></Card></div></>;
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
  return <Card className="max-w-2xl"><div className="mb-8 flex items-start gap-4"><div className="rounded-full bg-muted p-3"><UserRound aria-hidden="true" className="size-6 text-primary" /></div><div><h2 className="text-lg font-semibold">Informações pessoais</h2><p className="mt-1 text-sm text-muted-foreground">{profile ? 'Você pode ajustar esses dados quando precisar.' : 'Complete seu perfil para concluir esta primeira etapa.'}</p></div></div><form noValidate className="form-stack" onSubmit={handleSubmit(async (input) => { try { const result = await mutation.mutateAsync(input); reset({ displayName: result.displayName, locale: result.locale, timezone: result.timezone }); } catch { /* Safe mutation feedback below. */ } })}><FormInput id="displayName" label="Como prefere ser chamado?" autoComplete="nickname" maxLength={100} error={errors.displayName?.message} {...register('displayName')} /><div className="grid gap-5 sm:grid-cols-2"><FormInput id="locale" label="Idioma" hint="Ex.: pt-BR, en-US ou es." error={errors.locale?.message} {...register('locale')} /><FormInput id="timezone" label="Fuso horário" hint="Ex.: America/Sao_Paulo." error={errors.timezone?.message} {...register('timezone')} /></div>{mutation.isError && <Feedback>{mutation.error instanceof ApiError ? mutation.error.message : 'Não foi possível salvar seu perfil. Tente novamente.'}</Feedback>}{mutation.isSuccess && <Feedback success>Perfil salvo. Tudo do seu jeito.</Feedback>}<div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6"><Link className="text-link text-sm" to="/app">Voltar ao início</Link><Button type="submit" disabled={isSubmitting || mutation.isPending}>{isSubmitting ? 'Salvando…' : 'Salvar perfil'}</Button></div></form></Card>;
}
