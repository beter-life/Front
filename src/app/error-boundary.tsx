import { Component } from 'react';
import type { ReactNode } from 'react';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <main id="main" className="mx-auto max-w-xl space-y-6 p-8"><h1 className="text-2xl">Não foi possível abrir este espaço.</h1><p>Tente recarregar a página. Se continuar, tente novamente mais tarde.</p><button className="text-link" onClick={() => window.location.reload()}>Recarregar</button></main> : this.props.children; }
}
