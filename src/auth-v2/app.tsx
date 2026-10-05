import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router';
import { House, KeyRound, LogOut, Sprout, UserRound, Wallet } from 'lucide-react';
import { PublicLayout } from '../layouts/public-layout';
import { Button } from '../components/ui/button';
import { Feedback } from '../components/feedback';
import { ConfirmationPageV2, ForgotPasswordPageV2, LoginPageV2, RecoveryPageV2, SignupPageV2 } from './pages';
import { ProtectedRouteV2 } from './guards';
import { HomePage, ProfilePage } from '../profile/pages';
import { PasswordChangePageV2 } from './password-change';
import { useAuthV2 } from './hooks';
import { FinanceLayout, FinanceDashboard, AccountsPage, CategoriesPage, TransactionsPage } from '../features/finance/pages';
import { BudgetPage } from '../features/finance/budget-pages';
import { GoalsPage, GoalDetailPage } from '../features/finance/goal-pages';
import { RecurrencesPage } from '../features/finance/recurrence-pages';
import { FinancialCalendarPage } from '../features/finance/calendar-page';

function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = 'Beter Life — Seu espaço';
    document.querySelector<HTMLHeadingElement>('h1')?.focus();
  }, [pathname]);
  return null;
}

function PrivateLayoutV2() {
  const { store } = useAuthV2();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function logout() {
    if (busy) return;
    setBusy(true); setError(false);
    try { await store.signOut(); navigate('/login', { replace: true }); }
    catch { setError(true); }
    finally { setBusy(false); }
  }
  return <div className="private-shell"><aside className="sidebar"><Link className="brand" to="/app"><Sprout aria-hidden="true" />beter life.</Link>
    <p className="eyebrow sidebar-caption">SEU ESPAÇO</p><nav aria-label="Navegação principal"><NavLink to="/app"><House aria-hidden="true" />Início</NavLink><NavLink to="/finance"><Wallet aria-hidden="true" />Finanças</NavLink><NavLink to="/profile"><UserRound aria-hidden="true" />Meu perfil</NavLink><NavLink to="/account/password"><KeyRound aria-hidden="true" />Alterar senha</NavLink></nav>
    <div className="sidebar-bottom"><p>Pequenos passos.<br />Novas possibilidades.</p><Button variant="ghost" onClick={logout} disabled={busy}><LogOut aria-hidden="true" />{busy ? 'Saindo…' : 'Sair da conta'}</Button></div></aside>
    <div className="private-content"><header className="private-header"><span>SEU PONTO DE PARTIDA</span><span className="status-dot">Conta conectada</span></header>{error && <div className="mx-6 mt-4"><Feedback>Não foi possível sair. Tente novamente.</Feedback></div>}
      <main id="main" className="private-main"><Outlet /></main><footer className="private-footer">Beter Life · Feito para uma vida com mais clareza.</footer></div></div>;
}

export function AuthV2Routes() {
  return <><a className="skip-link" href="#main">Pular para o conteúdo</a><RouteFocus /><Routes>
    <Route path="/" element={<Navigate to="/app" replace />} />
    <Route element={<PublicLayout />}>
      <Route path="/login" element={<LoginPageV2 />} />
      <Route path="/signup" element={<SignupPageV2 />} />
      <Route path="/forgot-password" element={<ForgotPasswordPageV2 />} />
      <Route path="/auth/confirm" element={<ConfirmationPageV2 />} />
      <Route path="/auth/recovery" element={<RecoveryPageV2 />} />
      <Route path="*" element={<div className="space-y-6"><h1 tabIndex={-1} className="text-3xl">Esse caminho não existe.</h1><Button asChild><Link to="/app">Voltar ao início</Link></Button></div>} />
    </Route>
    <Route element={<ProtectedRouteV2 />}><Route element={<PrivateLayoutV2 />}>
      <Route path="/app" element={<HomePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/account/password" element={<PasswordChangePageV2 />} />
      <Route path="/finance" element={<FinanceLayout />}>
        <Route index element={<FinanceDashboard />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="budgets" element={<BudgetPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="goals/:goalId" element={<GoalDetailPage />} />
        <Route path="recurrences" element={<RecurrencesPage />} />
        <Route path="calendar" element={<FinancialCalendarPage />} />
      </Route>
    </Route></Route>
  </Routes></>;
}
