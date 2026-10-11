import { createKeyRegistry } from './idempotency';

describe('idempotency key registry', () => {
  const make = () => {
    let n = 0;
    return createKeyRegistry(() => `key-${++n}`);
  };

  it('reuses the key while the same request is retried', () => {
    const r = make();
    expect(r.keyFor('transfer|7|50')).toBe('key-1');
    expect(r.keyFor('transfer|7|50')).toBe('key-1');
  });

  it('issues a new key when the request changes', () => {
    const r = make();
    r.keyFor('transfer|7|50');
    expect(r.keyFor('transfer|7|60')).toBe('key-2');
  });

  it('issues a new key after a successful payment (reset)', () => {
    const r = make();
    r.keyFor('topup||100');
    r.reset();
    expect(r.keyFor('topup||100')).toBe('key-2');
  });
});
