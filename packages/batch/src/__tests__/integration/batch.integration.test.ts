import { describe, expect, it } from 'vitest';
import { StellarBatch } from '../../StellarBatch.js';

const SECRET = process.env['STELLAR_TEST_SECRET_KEY'];
const DESTINATION = process.env['STELLAR_TEST_DESTINATION'];

describe.skipIf(!SECRET || !DESTINATION)('batch integration (testnet)', () => {
  it('sends 10 XLM payments and returns BatchResult with successful: 10', async () => {
    const batch = new StellarBatch({ secretKey: SECRET!, network: 'testnet' });
    const progress: Array<[number, number]> = [];

    const payments = Array.from({ length: 10 }, () => ({
      to: DESTINATION!,
      amount: '0.1',
      asset: 'native' as const,
    }));

    const result = await batch.send(payments, {
      onProgress: (done, total) => {
        progress.push([done, total]);
        console.log(`Progress: ${done}/${total}`);
      },
    });

    expect(result.successful).toBe(10);
    expect(result.failed).toBe(0);
    expect(result.txHashes.length).toBeGreaterThan(0);
  }, 120_000);
});
