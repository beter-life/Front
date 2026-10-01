import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, UserRound } from 'lucide-react';
import { meSchema } from '../profile/schema';
import type { Me } from '../profile/schema';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Feedback, Loading } from '../components/feedback';
import { useAuthV2 } from './hooks';

export function ProfilePreviewV2({ apiBaseUrl }: { apiBaseUrl: string }) {
  const { session } = useAuthV2();
  const [data, setData] = useState<Me | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    setData(null); setFailed(false);
    void (async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/me`, {
          method: 'GET',
          headers: { authorization: `Bearer ${session.access_token}`, accept: 'application/json' },
          credentials: 'omit', cache: 'no-store', redirect: 'error', signal: controller.signal,
        });
        if (!response.ok) throw new Error('PROFILE_REQUEST_FAILED');
        const parsed = meSchema.parse(await response.json());
        if (parsed.identity.authUserId !== session.user.id) throw new Error('PROFILE_OWNER_MISMATCH');
        if (!controller.signal.aborted) setData(parsed);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    })();
    return () => controller.abort();
  }, [apiBaseUrl, session]);

  if (failed) return <Feedback>Não foi possível carregar seu perfil. Sua sessão continua protegida.</Feedback>;
  if (!data) return <Loading>Buscando seu perfil…</Loading>;
  return <><div className="page-intro"><p className="eyebrow">SEU ESPAÇO</p><h1 tabIndex={-1}>{data.profile ? `Bom ter você aqui, ${data.profile.displayName}.` : 'Seu espaço começa com você.'}</h1><p>Seu perfil vem do serviço protegido Beter Life.</p></div>
    <Card className="welcome-card"><div className="rounded-xl bg-primary/10 p-3 text-primary"><UserRound aria-hidden="true" className="size-7" /></div><div className="flex-1"><p className="eyebrow">PERFIL</p><h2>{data.profile ? 'Informações da sua conta.' : 'Perfil ainda não configurado.'}</h2><p>{data.profile ? `${data.profile.locale} · ${data.profile.timezone}` : 'O perfil poderá ser completado depois da validação de Auth.'}</p></div><Button asChild><Link to="/profile">Ver perfil<ArrowRight aria-hidden="true" /></Link></Button></Card></>;
}
