import { Link, Outlet, useLocation } from 'react-router';
import { ArrowUpRight, Sprout } from 'lucide-react';
import { ThemeControl } from '../theme/theme-control';
export function PublicLayout() {
  const recovery = useLocation().pathname === '/forgot-password';
  return <div className={'public-shell' + (recovery ? ' public-recovery' : '')}><aside className="brand-panel"><Link className="brand" to="/login" aria-label="Beter Life, início"><Sprout aria-hidden="true" />beter life<span className="brand-dot">.</span></Link><div className="brand-story"><p className="eyebrow">BETER LIFE</p><h2>Planejamento.<br />Finanças.<br /><em>Seu dia a dia.</em></h2><p>Contas, orçamento e metas em um só lugar.</p></div><div className="brand-footer"><span>PLANEJAMENTO FINANCEIRO</span><ArrowUpRight aria-hidden="true" /></div></aside><div className="public-content"><header className="public-top"><Link to="/login" className="mobile-brand">beter life.</Link><ThemeControl /></header><main id="main" className="auth-main"><Outlet /></main><footer className="public-footer">Beter Life</footer></div></div>;
}
