import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler } from '../../lib/client';
import { sessionStore } from '../../lib/session';
import type { Session } from '../../lib/session';

interface AuthState {
  session: Session | null;
  notice: string;
  signIn: (s: Session) => void;
  signOut: (notice?: string) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(() => sessionStore.get());
  const [notice, setNotice] = useState('');

  const signOut = useCallback(
    (message = '') => {
      sessionStore.clear();
      setSession(null);
      setNotice(message);
      queryClient.clear(); // never let the next user see the previous user's cached data
    },
    [queryClient]
  );

  const signIn = useCallback((s: Session) => {
    sessionStore.set(s);
    setSession(s);
    setNotice('');
  }, []);

  // Any 401 (for example the 15-minute token expiring) returns the user to the sign-in screen.
  useEffect(() => {
    setUnauthorizedHandler(() => signOut('Your session expired. Sign in again.'));
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo(() => ({ session, notice, signIn, signOut }), [session, notice, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
