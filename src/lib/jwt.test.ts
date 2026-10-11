import { decodeJwt } from './jwt';

const b64url = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('decodeJwt', () => {
  it('reads subject and expiry claims', () => {
    const token = `${b64url({ alg: 'HS256' })}.${b64url({ sub: 'a@b.com', iat: 100, exp: 1000 })}.sig`;
    expect(decodeJwt(token)).toEqual({ sub: 'a@b.com', iat: 100, exp: 1000 });
  });

  it('returns null for garbage', () => {
    expect(decodeJwt('not-a-token')).toBeNull();
    expect(decodeJwt('a.b.c')).toBeNull();
  });
});
