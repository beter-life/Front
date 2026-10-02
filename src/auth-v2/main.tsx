import { StrictMode } from 'react';
import type { Root } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { publicConfig } from '../config/env';
import { ErrorBoundary } from '../app/error-boundary';
import { AppProviders } from '../app/providers';
import { createServices } from '../app/services';
import { AuthV2Routes } from './app';
import { getAuthClient } from './client';
import { AuthProviderV2 } from './provider';
import { SessionStore } from './session';

export function mountAuthV2(root: Root) {
  try {
    const config = publicConfig(import.meta.env);
    const client = getAuthClient(config);
    const store = new SessionStore(client.auth);
    store.start();
    const services = createServices(config, store);
    root.render(<StrictMode><ErrorBoundary><AuthProviderV2 client={client} store={store}><AppProviders services={services}><BrowserRouter><AuthV2Routes /></BrowserRouter></AppProviders></AuthProviderV2></ErrorBoundary></StrictMode>);
  } catch {
    root.render(<main className="mx-auto max-w-xl space-y-5 p-8"><h1 className="text-2xl">Beter Life está sendo preparado.</h1><p>A configuração pública do aplicativo está incompleta.</p></main>);
  }
}
