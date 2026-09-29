import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { Sprout, House, UserRound, LogOut } from 'lucide-react';
import { useServices } from '../hooks/use-services';
import { Button } from '../components/ui/button';
import { Feedback } from '../components/feedback';
export function PrivateLayout() {
  const { auth } = useServices(); const navigate = useNavigate();
  const [pending, setPending] = useState(false); const [error, setError] = useState(false);
  async function logout() { setPending(true); setError(false); try { await auth.logout(); navigate('/login', { replace: true }); } catch { setError(true); } finally { setPending(false); } }
  return <div className="private-shell"><aside className="sidebar"><Link className="brand" to="/app"><Sprout aria-hidden="true" />beter life.</Link><p className="eyebrow sidebar-caption">SEU ESPAÇO</p><nav aria-label="Navegação principal"><NavLink to="/app"><House aria-hidden="true" />Início</NavLink><NavLink to="/profile"><UserRound aria-hidden="true" />Meu perfil</NavLink></nav><div className="sidebar-bottom"><p>Pequenos passos.<br />Novas possibilidades.</p><Button variant="ghost" onClick={logout} disabled={pending}><LogOut aria-hidden="true" />{pending ? 'Saindo…' : 'Sair da conta'}</Button></div></aside><div className="private-content"><header className="private-header"><span>SEU PONTO DE PARTIDA</span><span className="status-dot">Conta conectada</span></header>{error && <div className="mx-6 mt-4"><Feedback>Não foi possível sair. Tente novamente.</Feedback></div>}<main id="main" className="private-main"><Outlet /></main><footer className="private-footer">Beter Life · Feito para uma vida com mais clareza.</footer></div></div>;
}
