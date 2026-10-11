import type { Transaction } from '../../lib/types';

export function describeTx(t: Transaction, myWalletId?: number): { title: string; outgoing: boolean } {
  const outgoing = myWalletId !== undefined && t.senderWalletId === myWalletId;
  switch (t.type) {
    case 'TOP_UP':
      return { title: 'Money added', outgoing };
    case 'WITHDRAWAL':
      return { title: 'Withdrawal', outgoing };
    case 'OPENING_BALANCE':
      return { title: 'Opening balance', outgoing };
    case 'TRANSFER':
      return {
        title: outgoing ? `Sent to wallet ${t.receiverWalletId}` : `Received from wallet ${t.senderWalletId}`,
        outgoing,
      };
  }
}
