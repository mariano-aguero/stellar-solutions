import { describe, it, expect, beforeAll } from 'vitest';
import { StellarKit } from '../../StellarKit.js';

const SECRET = process.env['STELLAR_TEST_SECRET_KEY'];
const DESTINATION = process.env['STELLAR_TEST_DESTINATION'];

describe.skipIf(!SECRET || !DESTINATION)('payments-kit integration (testnet)', () => {
  let kit: StellarKit;

  beforeAll(() => {
    kit = new StellarKit({ network: 'testnet' });
  });

  it('gets XLM balance', async () => {
    const { Keypair } = await import('@stellar/stellar-sdk');
    const address = Keypair.fromSecret(SECRET!).publicKey();
    const balance = await kit.getBalance(address);
    expect(Number(balance)).toBeGreaterThan(0);
  }, 30_000);

  it('sends 1 XLM and returns TxResult', async () => {
    const result = await kit.pay({
      from: SECRET!,
      to: DESTINATION!,
      amount: '1',
      asset: 'native',
      memo: 'integration test',
    });
    expect(result.hash).toHaveLength(64);
    expect(result.ledger).toBeGreaterThan(0);
  }, 30_000);

  it('gets transaction history', async () => {
    const { Keypair } = await import('@stellar/stellar-sdk');
    const address = Keypair.fromSecret(SECRET!).publicKey();
    const history = await kit.getHistory(address, { limit: 5 });
    expect(history.length).toBeGreaterThan(0);
  }, 30_000);
});
