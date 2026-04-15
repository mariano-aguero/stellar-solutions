import { describe, it, expect } from 'vitest';
import { StellarNotify } from '../../StellarNotify.js';
import type { PaymentEvent } from '../../types.js';

const SECRET = process.env['STELLAR_TEST_SECRET_KEY'];
const WATCHED_ADDRESS = process.env['STELLAR_TEST_WATCHED_ADDRESS'];

describe.skipIf(!SECRET || !WATCHED_ADDRESS)('notify integration (testnet)', () => {
  it('receives a payment event within 30s', async () => {
    const notifier = new StellarNotify({ network: 'testnet' });
    const handle = notifier.watch(WATCHED_ADDRESS!);

    const eventPromise = new Promise<PaymentEvent>((resolve) => {
      handle.on('payment', resolve);
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: no payment event received within 30s')), 30_000),
    );

    try {
      const event = await Promise.race([eventPromise, timeoutPromise]);
      expect(event.type).toBe('payment');
      expect(typeof event.hash).toBe('string');
    } finally {
      notifier.stopAll();
    }
  }, 35_000);
});
