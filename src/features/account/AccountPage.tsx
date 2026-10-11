import { useMemo } from 'react';
import { Badge, Button, Skeleton } from '../../components/ui';
import { decodeJwt } from '../../lib/jwt';
import { duration } from '../../lib/format';
import { useNow } from '../../lib/useNow';
import { useAuth } from '../auth/AuthProvider';
import { useMe } from '../wallet/queries';

const at = (seconds?: number) => (seconds ? new Date(seconds * 1000).toLocaleString('en-IN') : 'Unknown');

export default function AccountPage() {
  const { session, signOut } = useAuth();
  const me = useMe();
  const now = useNow(1000);
  const claims = useMemo(() => (session ? decodeJwt(session.token) : null), [session]);
  const remaining = claims?.exp ? claims.exp - now / 1000 : null;

  return (
    <>
      <h1>Account</h1>
      <p className="muted lede">Who you are signed in as, and when this session ends.</p>

      <section className="check" aria-labelledby="profile-h">
        <h2 id="profile-h">Profile</h2>
        {me.isPending ? (
          <Skeleton height={90} />
        ) : (
          <dl className="facts">
            <dt>Name</dt>
            <dd>{me.data?.name ?? 'Unknown'}</dd>
            <dt>Email</dt>
            <dd>{me.data?.email ?? session?.email}</dd>
            <dt>Role</dt>
            <dd>{me.data?.role === 'ADMIN' ? <Badge tone="ok">Admin</Badge> : <Badge>Customer</Badge>}</dd>
            <dt>User ID</dt>
            <dd>{me.data?.id ?? 'Unknown'}</dd>
            <dt>Wallet ID</dt>
            <dd>{me.data?.walletId ?? 'Unknown'}</dd>
          </dl>
        )}
      </section>

      <section className="check" aria-labelledby="session-h">
        <h2 id="session-h">Session</h2>
        <dl className="facts">
          <dt>Signed in</dt>
          <dd>{at(claims?.iat)}</dd>
          <dt>Expires</dt>
          <dd>{at(claims?.exp)}</dd>
          <dt>Time left</dt>
          <dd>{remaining === null ? 'Unknown' : remaining > 0 ? duration(remaining) : 'Expired'}</dd>
        </dl>
        {remaining !== null && remaining > 0 && remaining < 60 && (
          <p className="notice bad" role="status">Your session ends in under a minute. Sign in again to continue.</p>
        )}
        <p className="muted small">
          Your login is a signed token that the server checks on every request. This page only reads its claims for
          display; it can’t be extended from here. When it expires you are returned to the sign-in screen.
        </p>
        <Button variant="secondary" onClick={() => signOut()}>Sign out</Button>
      </section>
    </>
  );
}
