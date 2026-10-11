import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { useMe } from '../features/wallet/queries';
import { useTheme } from '../lib/theme';
import { PageSkeleton } from './ui';

export default function AppShell() {
  const { session, signOut } = useAuth();
  const me = useMe();
  const { theme, toggle } = useTheme();
  const isAdmin = me.data?.role === 'ADMIN';

  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <header className="rail">
        <p className="brand">Payment Platform</p>
        <nav aria-label="Main" className="nav">
          <NavLink to="/" end>Overview</NavLink>
          <NavLink to="/activity">Activity</NavLink>
          <NavLink to="/ledger">Ledger</NavLink>
          <NavLink to="/lab">Reliability lab</NavLink>
          <NavLink to="/about">How it works</NavLink>
          <NavLink to="/account">Account</NavLink>
          {isAdmin && <NavLink to="/admin" className="nav-admin">Admin console</NavLink>}
        </nav>
        <div className="rail-foot">
          <p className="who small" title={session?.email}>{me.data?.name ?? session?.email}</p>
          <div className="rail-actions">
            <button className="link" onClick={toggle}>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</button>
            <button className="link" onClick={() => signOut()}>Sign out</button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="main">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
