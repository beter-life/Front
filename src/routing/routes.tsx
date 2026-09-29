import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router';
import { LoginPage, SignupPage, ForgotPasswordPage, ConfirmationPage, RecoveryPage } from '../auth/pages';
import { HomePage, ProfilePage } from '../profile/pages';
import { PublicLayout } from '../layouts/public-layout';
import { PrivateLayout } from '../layouts/private-layout';
import { ProtectedRoute } from './protected-route';
import { Button } from '../components/ui/button';
function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => { document.title = 'Beter Life — Seu espaço'; document.querySelector<HTMLHeadingElement>('h1')?.focus(); }, [pathname]);
  return null;
}
export function AppRoutes() {
  return <><a className="skip-link" href="#main">Pular para o conteúdo</a><RouteFocus /><Routes><Route path="/" element={<Navigate to="/app" replace />} /><Route element={<PublicLayout />}><Route path="/login" element={<LoginPage />} /><Route path="/signup" element={<SignupPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/auth/confirm" element={<ConfirmationPage />} /><Route path="/auth/recovery" element={<RecoveryPage />} /><Route path="*" element={<div className="space-y-6"><h1 tabIndex={-1} className="text-3xl">Esse caminho não existe.</h1><Button asChild><Link to="/app">Voltar ao início</Link></Button></div>} /></Route><Route element={<ProtectedRoute />}><Route element={<PrivateLayout />}><Route path="/app" element={<HomePage />} /><Route path="/profile" element={<ProfilePage />} /></Route></Route></Routes></>;
}
