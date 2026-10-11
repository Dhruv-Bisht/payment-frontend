import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from './ui';

interface State {
  failed: boolean;
}

/** Last line of defence: a rendering bug shows a recovery screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="fallback">
        <h1>Something went wrong</h1>
        <p className="muted">Your money is safe. Nothing was sent from this screen after the error.</p>
        <Button onClick={() => window.location.reload()}>Reload the page</Button>
      </main>
    );
  }
}
