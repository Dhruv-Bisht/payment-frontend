export interface Session {
  token: string;
  email: string;
}

const KEY = 'pp_session';

// sessionStorage: the token disappears when the tab closes. An httpOnly-cookie design would be
// safer against XSS; for this app a short-lived bearer token is the deliberate trade-off.
export const sessionStore = {
  get(): Session | null {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    } catch {
      return null;
    }
  },
  set(s: Session) {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  },
  clear() {
    sessionStorage.removeItem(KEY);
  },
};
