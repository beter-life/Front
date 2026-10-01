import { StrictMode } from 'react';
import type { Root } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { publicConfig } from './config/env';
import { captureCallback } from './auth/callback';
import { PkceFailure } from './auth/pkce-storage';
import { createServices } from './app/services';
import { AppProviders } from './app/providers';
import { ErrorBoundary } from './app/error-boundary';
import { AppRoutes } from './routing/routes';

export function mountLegacy(root: Root) {
  try {
    const callback = captureCallback(window.location);
    const config = publicConfig(import.meta.env);
    const services = createServices(config, window.location.origin, callback);
    root.render(<StrictMode><ErrorBoundary><AppProviders services={services}><BrowserRouter><AppRoutes /></BrowserRouter></AppProviders></ErrorBoundary></StrictMode>);
  } catch (error) {
    root.render(<main className="mx-auto max-w-xl space-y-5 p-8"><h1 className="text-2xl">Beter Life está sendo preparado.</h1><p>{error instanceof PkceFailure ? error.message : 'A configuração pública do aplicativo está incompleta. Confira as instruções do README e reinicie o frontend.'}</p></main>);
  }
}
