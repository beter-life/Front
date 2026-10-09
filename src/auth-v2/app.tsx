import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router';
import { PublicLayout } from '../layouts/public-layout';
import { Button } from '../components/ui/button';
import { AppShell } from '../navigation/app-shell';
import { activeNavigation } from '../navigation/navigation-config';
import { ConfirmationPageV2, ForgotPasswordPageV2, LoginPageV2, RecoveryPageV2, SignupPageV2 } from './pages';
import { ProtectedRouteV2 } from './guards';
import { HomePage, ProfilePage } from '../profile/pages';
import { useAuthV2 } from './hooks';
import { FinanceLayout, FinanceDashboard, AccountsPage, CategoriesPage, TransactionsPage } from '../features/finance/pages';
import { BudgetPage } from '../features/finance/budget-pages';
import { GoalsPage, GoalDetailPage } from '../features/finance/goal-pages';
import { RecurrencesPage } from '../features/finance/recurrence-pages';
import { FinancialCalendarPage } from '../features/finance/calendar-page';
import { NetWorthPage } from '../features/finance/net-worth-page';
import { YieldPage } from '../features/finance/yield-page';
import { CardsPage, CardDetailPage } from '../features/finance/cards-page';
import { DebtsPage, DebtDetailPage } from '../features/finance/debts-page';
import { SafeSpendPage } from '../features/finance/safe-spend-page';

function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = 'Beter Life — ' + (activeNavigation(pathname)?.label ?? 'Seu espaço');
    const focusHeading = () => {
      const heading = document.querySelector<HTMLHeadingElement>('#main h1');
      if (!heading) return false;
      heading.focus(); return true;
    };
    if (focusHeading()) return;
    const observer = new MutationObserver(() => { if (focusHeading()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
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
  return <AppShell busy={busy} error={error} onLogout={() => { void logout(); }}><Outlet /></AppShell>;
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
      <Route path="/account/password" element={<Navigate to="/profile?tab=security" replace />} />
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
        <Route path="net-worth" element={<NetWorthPage />} />
        <Route path="yield" element={<YieldPage />} />
        <Route path="cards" element={<CardsPage />} />
        <Route path="cards/:cardId" element={<CardDetailPage />} />
        <Route path="debts" element={<DebtsPage />} />
        <Route path="debts/:debtId" element={<DebtDetailPage />} />
        <Route path="safe-to-spend" element={<SafeSpendPage />} />
      </Route>
    </Route></Route>
  </Routes></>;
}
