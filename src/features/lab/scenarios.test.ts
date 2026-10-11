import { api } from '../../lib/api';
import { runReplay, runParallelSameKey } from './scenarios';

vi.mock('../../lib/api', () => ({ api: { wallet: vi.fn(), topUp: vi.fn() } }));

const wallet = vi.mocked(api.wallet);
const topUp = vi.mocked(api.topUp);

const tx = (id: number) => ({ transactionId: id }) as Awaited<ReturnType<typeof api.topUp>>;

afterEach(() => vi.resetAllMocks());

describe('lab scenarios', () => {
  it('replay passes when the retry returns the same transaction and balance rises once', async () => {
    wallet.mockResolvedValueOnce({ balance: 100 } as never).mockResolvedValueOnce({ balance: 150 } as never);
    topUp.mockResolvedValue(tx(7));
    const log = await runReplay();
    expect(log.some((l) => l.tone === 'bad')).toBe(false);
    expect(log.filter((l) => l.tone === 'ok')).toHaveLength(2);
  });

  it('replay fails loudly when the server pays twice', async () => {
    wallet.mockResolvedValueOnce({ balance: 100 } as never).mockResolvedValueOnce({ balance: 200 } as never);
    topUp.mockResolvedValueOnce(tx(7)).mockResolvedValueOnce(tx(8));
    const log = await runReplay();
    expect(log.filter((l) => l.tone === 'bad')).toHaveLength(2);
  });

  it('parallel same-key passes only if all requests resolve to one transaction', async () => {
    wallet.mockResolvedValueOnce({ balance: 0 } as never).mockResolvedValueOnce({ balance: 100 } as never);
    topUp.mockResolvedValue(tx(3));
    const log = await runParallelSameKey();
    expect(log.some((l) => l.tone === 'bad')).toBe(false);
  });
});
