export const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * Hands out idempotency keys. The key stays the same while the user retries an IDENTICAL request
 * (so a retry after a timeout can never pay twice) and changes when the request changes or after a
 * success (reset).
 */
export function createKeyRegistry(makeKey: () => string = newKey) {
  let current: { signature: string; key: string } | null = null;
  return {
    keyFor(signature: string): string {
      if (!current || current.signature !== signature) current = { signature, key: makeKey() };
      return current.key;
    },
    reset() {
      current = null;
    },
  };
}
