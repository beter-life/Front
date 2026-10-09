import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { ChevronDown, ChevronRight, LogOut, Menu, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Search, Sprout, UserRound } from 'lucide-react';
import { expandableNavigationGroups, navigationItems, activeNavigation, mobileNavigation, pageBreadcrumbs, searchNavigation } from './navigation-config';
import type { NavigationItem } from './navigation-config';
import { Button } from '../components/ui/button';
import { Dialog } from '../components/ui/dialog';
import { IconButton, PageContainer } from '../components/ui/surface';
import { Feedback } from '../components/feedback';
import { ThemeControl } from '../theme/theme-control';

const railKey = 'beter-life-sidebar-rail';
function readRail() { try { return localStorage.getItem(railKey) === 'true'; } catch { return false; } }
function NavigationLink({ item, rail = false, close }: { item: NavigationItem; rail?: boolean; close?: () => void }) {
  const Icon = item.icon;
  const anchor = useRef<HTMLAnchorElement>(null);
  const tooltipId = useId(), [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const visible = rail && position !== null;
  useEffect(() => {
    if (!visible) return;
    const reposition = () => {
      const element = anchor.current;
      if (!element || !(element.matches(':hover') || document.activeElement === element)) { setPosition(null); return; }
      const rect = element.getBoundingClientRect();
      setPosition({ left: rect.right + 12, top: rect.top + rect.height / 2 });
    };
    window.addEventListener('scroll', reposition, true); window.addEventListener('resize', reposition);
    return () => { window.removeEventListener('scroll', reposition, true); window.removeEventListener('resize', reposition); };
  }, [visible]);
  const show = (element: HTMLElement) => { if (rail) { const rect = element.getBoundingClientRect(); setPosition({ left: rect.right + 12, top: rect.top + rect.height / 2 }); } };
  return <><NavLink ref={anchor} to={item.path} end={item.exactMatch} aria-label={item.label} aria-describedby={rail && position ? tooltipId : undefined} onClick={close}
    onMouseEnter={event => show(event.currentTarget)} onMouseLeave={() => setPosition(null)} onFocus={event => show(event.currentTarget)} onBlur={() => setPosition(null)}
    className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
    <Icon aria-hidden="true" /><span className="nav-label">{item.label}</span>
  </NavLink>{rail && position && createPortal(<span id={tooltipId} role="tooltip" className="nav-tooltip" style={position}>{item.label}</span>, document.body)}</>;
}
function NavigationGroups({ rail = false, mobile = false, close }: { rail?: boolean; mobile?: boolean; close?: () => void }) {
  const { pathname } = useLocation(), current = activeNavigation(pathname);
  const [expanded, setExpanded] = useState<string[]>([]);
  return <nav aria-label={mobile ? 'Menu completo' : 'Navegação principal'} className="navigation-groups">
    <div className="nav-group nav-primary">{!rail && <h3 className="nav-section-label">Principal</h3>}{navigationItems.filter(item => item.group === 'Principal').map(item => <NavigationLink key={item.id} item={item} rail={rail} close={close} />)}</div>
    {expandableNavigationGroups.map(group => {
      const open = mobile || current?.group === group || expanded.includes(group);
      return <div className="nav-group" key={group}>
        {!rail && mobile && <h3 className="nav-section-label">{group}</h3>}
        {!rail && !mobile && <button type="button" className="nav-group-toggle" aria-expanded={open} aria-controls={'nav-' + group}
          onClick={() => setExpanded(values => values.includes(group) ? values.filter(value => value !== group) : [...values, group])}>
          {group}<ChevronDown aria-hidden="true" />
        </button>}
        <div id={'nav-' + (mobile ? 'mobile-' : '') + group} hidden={!rail && !open}>
          {navigationItems.filter(item => item.group === group).map(item => <NavigationLink key={item.id} item={item} rail={rail} close={close} />)}
        </div>
      </div>;
    })}
    <div className="nav-group">{!rail && <h3 className="nav-section-label">Mais</h3>}{navigationItems.filter(item => item.group === 'Mais').map(item => <NavigationLink key={item.id} item={item} rail={rail} close={close} />)}</div>
    {mobile && <div className="nav-account"><h3 className="nav-section-label">Sua conta</h3>{navigationItems.filter(item => item.group === 'Conta').map(item => <NavigationLink key={item.id} item={item} close={close} />)}</div>}
  </nav>;
}
function Breadcrumbs() {
  const { pathname } = useLocation(), crumbs = pageBreadcrumbs(pathname);
  return <nav aria-label="Caminho da página" className="breadcrumbs"><ol>{crumbs.map((crumb, index) => <li key={crumb.path}>
    {index > 0 && <ChevronRight aria-hidden="true" />}{index === crumbs.length - 1 ? <span aria-current="page">{crumb.label}</span> : <Link to={crumb.path}>{crumb.label}</Link>}
  </li>)}</ol></nav>;
}
function PageFinder({ close }: { close: () => void }) {
  const [query, setQuery] = useState(''), [selected, setSelected] = useState(0);
  const navigate = useNavigate(), results = searchNavigation(query);
  const chosen = results[Math.min(selected, results.length - 1)];
  const go = (item: NavigationItem) => { close(); navigate(item.path); };
  return <Dialog title="Buscar páginas" onClose={close}><label className="finder-label" htmlFor="page-finder">Para onde você quer ir?</label>
    <input id="page-finder" data-initial-focus className="finance-select" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="page-results"
      aria-activedescendant={chosen ? 'result-' + chosen.id : undefined} value={query}
      onChange={event => { setQuery(event.target.value); setSelected(0); }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); setSelected(index => results.length ? (index + (event.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length : 0);
        } else if (event.key === 'Enter' && chosen) { event.preventDefault(); go(chosen); }
      }} />
    <div id="page-results" role="listbox" aria-label="Páginas disponíveis" className="finder-results">
      {results.map(item => <button id={'result-' + item.id} key={item.id} role="option" aria-selected={item.id === chosen?.id} tabIndex={-1} onClick={() => go(item)}>
        <item.icon aria-hidden="true" /><span>{item.label}<small>{item.group}</small></span><ChevronRight aria-hidden="true" />
      </button>)}
    </div>{!results.length && <p role="status">Nenhuma página encontrada. Tente outro termo.</p>}
    <p className="ui-caption">↑ ↓ para escolher · Enter para abrir · Escape para fechar. Busca somente páginas, não seus dados.</p>
  </Dialog>;
}
export function AppShell({ children, busy, error, onLogout }: { children: ReactNode; busy: boolean; error: boolean; onLogout: () => void }) {
  const { pathname } = useLocation();
  const [rail, setRail] = useState(readRail), [overlay, setOverlay] = useState<'menu' | 'search' | 'account' | null>(null);
  useEffect(() => { setOverlay(null); }, [pathname]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOverlay('search'); }
    };
    window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut);
  }, []);
  const logoutButton = <Button variant="ghost" onClick={onLogout} disabled={busy}><LogOut aria-hidden="true" />{busy ? 'Saindo…' : 'Sair da conta'}</Button>;
  return <div className={'app-shell' + (rail ? ' rail' : '')}>
    <aside className="global-sidebar" aria-label="Barra lateral"><div className="sidebar-brand-row"><Link className="brand" to="/app" aria-label="Beter Life, página inicial"><Sprout aria-hidden="true" /><span>beter life.</span></Link>
      <IconButton label={rail ? 'Expandir navegação' : 'Recolher navegação'} onClick={() => {
        setRail(value => { try { localStorage.setItem(railKey, String(!value)); } catch { /* Optional UI preference. */ } return !value; });
      }}>{rail ? <PanelLeftOpen /> : <PanelLeftClose />}</IconButton></div>
      <NavigationGroups rail={rail} /><div className="nav-account">{navigationItems.filter(item => item.group === 'Conta').map(item => <NavigationLink key={item.id} item={item} rail={rail} />)}{rail ? <IconButton label="Sair da conta" onClick={onLogout} disabled={busy}><LogOut /></IconButton> : logoutButton}</div>
    </aside>
    <div className="app-content"><header className="app-header">
      <IconButton label="Abrir menu completo" className="mobile-menu-trigger" onClick={() => setOverlay('menu')}><Menu /></IconButton>
      <Breadcrumbs /><div className="header-actions"><button type="button" className="header-search" aria-label="Buscar páginas" onClick={() => setOverlay('search')}><Search aria-hidden="true" /><span>Buscar páginas</span><kbd aria-hidden="true">⌘ / Ctrl K</kbd></button><ThemeControl /><IconButton label="Menu da conta" onClick={() => setOverlay('account')}><UserRound /></IconButton></div>
    </header>{error && <div className="shell-feedback"><Feedback>Não foi possível sair. Tente novamente.</Feedback></div>}
      <PageContainer id="main">{children}</PageContainer><footer className="app-footer">Beter Life</footer>
    </div>
    <nav aria-label="Navegação mobile" className="mobile-navigation">{mobileNavigation.map(item => {
      const destination = navigationItems.find(value => value.id === item.id)!;
      return <NavLink key={item.id} to={destination.path} end={destination.exactMatch}><destination.icon aria-hidden="true" /><span>{item.label}</span></NavLink>;
    })}<button type="button" aria-label="Mais, abrir menu completo" onClick={() => setOverlay('menu')}><MoreHorizontal aria-hidden="true" /><span>Mais</span></button></nav>
    {overlay === 'search' && <PageFinder close={() => setOverlay(null)} />}
    {overlay === 'menu' && <Dialog title="Todas as ferramentas" drawer onClose={() => setOverlay(null)}><NavigationGroups mobile close={() => setOverlay(null)} /><div className="nav-account">{logoutButton}</div></Dialog>}
    {overlay === 'account' && <Dialog title="Sua conta" onClose={() => setOverlay(null)}><nav aria-label="Configurações de conta">{navigationItems.filter(item => item.group === 'Conta').map(item => <NavigationLink key={item.id} item={item} close={() => setOverlay(null)} />)}</nav>{logoutButton}</Dialog>}
  </div>;
}
