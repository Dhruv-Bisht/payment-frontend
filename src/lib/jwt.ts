export interface JwtClaims {
  sub?: string;
  iat?: number;
  exp?: number;
}

/** Reads the (unverified) claims of a JWT for display. Verification is the server's job. */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    return JSON.parse(atob(base64)) as JwtClaims;
  } catch {
    return null;
  }
}
