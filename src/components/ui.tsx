import { useId } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      className={`btn btn-${variant} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  ...input
}: { label: string; hint?: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...input}
      />
      {message && (
        <p id={messageId} className={error ? 'field-message bad' : 'field-message'}>
          {message}
        </p>
      )}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'ok' | 'bad' | 'neutral'; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Skeleton({ width = '100%', height = 16 }: { width?: number | string; height?: number | string }) {
  return <span className="skeleton" style={{ width, height }} aria-hidden="true" />;
}

export function ErrorNotice({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="notice bad" role="alert">
      <span>{error.message}</span>
      {onRetry && (
        <button className="link" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      <button className="link" disabled={page === 0} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="muted small">
        Page {page + 1} of {pages}
      </span>
      <button className="link" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  );
}

export function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label="Loading">
      <Skeleton width="30%" height={28} />
      <Skeleton height={180} />
      <Skeleton height={120} />
    </div>
  );
}

export function StatusChip({ state }: { state?: 'UP' | 'DOWN' | 'UNREACHABLE' }) {
  if (!state) return <Badge>Checking status…</Badge>;
  if (state === 'UP') return <Badge tone="ok">API online</Badge>;
  return <Badge tone="bad">{state === 'DOWN' ? 'API degraded' : 'API unreachable'}</Badge>;
}
