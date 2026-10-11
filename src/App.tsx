import { lazy } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { PageSkeleton } from './components/ui';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import LoginPage from './features/auth/LoginPage';
import LandingPage from './features/landing/LandingPage';
import Overview from './features/activity/Overview';
import { useMe } from './features/wallet/queries';
import { queryClient } from './lib/queryClient';

// Secondary screens are code-split: they download only when first visited.
const ActivityPage = lazy(() => import('./features/activity/ActivityPage'));
const LedgerPage = lazy(() => import('./features/activity/LedgerPage'));
const LabPage = lazy(() => import('./features/lab/LabPage'));
const AboutPage = lazy(() => import('./features/landing/AboutPage'));
const AccountPage = lazy(() => import('./features/account/AccountPage'));
const AdminLayout = lazy(() => import('./features/admin/AdminLayout'));
const AdminOverviewPage = lazy(() => import('./features/admin/AdminOverviewPage'));
const AdminWalletsPage = lazy(() => import('./features/admin/AdminWalletsPage'));
const AdminTransactionsPage = lazy(() => import('./features/admin/AdminTransactionsPage'));
const AdminPipelinePage = lazy(() => import('./features/admin/AdminPipelinePage'));

/** Role guard. The server enforces ADMIN on every admin endpoint too; this only hides the screens. */
function AdminRoute() {
  const me = useMe();
  if (me.isPending) return <PageSkeleton />;
  return me.data?.role === 'ADMIN' ? <AdminLayout /> : <Navigate to="/" replace />;
}

function Gate() {
  const { session, notice } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        {session ? (
          <Route element={<AppShell />}>
            <Route index element={<Overview />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="activity/:id" element={<ActivityPage />} />
            <Route path="ledger" element={<LedgerPage />} />
            <Route path="lab" element={<LabPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="admin" element={<AdminRoute />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="wallets" element={<AdminWalletsPage />} />
              <Route path="transactions" element={<AdminTransactionsPage />} />
              <Route path="pipeline" element={<AdminPipelinePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage key="login" mode="login" />} />
            <Route path="/register" element={<LoginPage key="register" mode="register" />} />
            <Route path="*" element={<Navigate to={notice ? '/login' : '/'} replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Gate />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
