import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { publicConfig } from './config/env';
import { captureCallback } from './auth/callback';
import { createServices } from './app/services';
import { AppProviders } from './app/providers';
import { ErrorBoundary } from './app/error-boundary';
import { AppRoutes } from './routing/routes';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
try {
  const callback = captureCallback(window.location);
  const config = publicConfig(import.meta.env);
  const services = createServices(config, window.location.origin, callback);
  root.render(<StrictMode><ErrorBoundary><AppProviders services={services}><BrowserRouter><AppRoutes /></BrowserRouter></AppProviders></ErrorBoundary></StrictMode>);
} catch {
  root.render(<main className="mx-auto max-w-xl space-y-5 p-8"><h1 className="text-2xl">Beter Life está sendo preparado.</h1><p>A configuração pública do aplicativo está incompleta. Confira as instruções do README e reinicie o frontend.</p></main>);
}
