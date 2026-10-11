import { validatePayment } from './validation';

const wallet = { walletId: 5, balance: 200 };

describe('validatePayment', () => {
  it('accepts a normal top-up', () => {
    expect(validatePayment('topup', { amount: '100.50', receiver: '' }, wallet)).toEqual({
      ok: true,
      amount: 100.5,
      receiverWalletId: undefined,
    });
  });

  it('rejects more than two decimals, below the minimum, and above the maximum', () => {
    for (const amount of ['10.999', '0.50', '1000001', 'abc', '']) {
      const r = validatePayment('topup', { amount, receiver: '' }, wallet);
      expect(r.ok).toBe(false);
    }
  });

  it('rejects withdrawing or sending more than the balance', () => {
    const r = validatePayment('withdraw', { amount: '250', receiver: '' }, wallet);
    expect(r).toMatchObject({ ok: false, errors: { amount: expect.stringContaining('balance') } });
  });

  it('requires a valid receiver that is not your own wallet', () => {
    expect(validatePayment('transfer', { amount: '10', receiver: '' }, wallet).ok).toBe(false);
    expect(validatePayment('transfer', { amount: '10', receiver: '1.5' }, wallet).ok).toBe(false);
    expect(validatePayment('transfer', { amount: '10', receiver: '5' }, wallet)).toMatchObject({
      ok: false,
      errors: { receiver: expect.stringContaining('own wallet') },
    });
    expect(validatePayment('transfer', { amount: '10', receiver: '9' }, wallet)).toMatchObject({
      ok: true,
      receiverWalletId: 9,
    });
  });
});
