import { describe, it, expect, vi } from 'vitest';
import type { StellarClient } from '@stellar-solutions/core';
import { burn } from '../burn.js';

const DISTRIBUTOR_SECRET = 'SCN6I4YH2IR7SZ6RHYQMI2TCTS4VXG6MGS4APWXYEUH26VFMYPQMUT5A';
// Derived from DISTRIBUTOR_SECRET via Keypair.fromSecret(DISTRIBUTOR_SECRET).publicKey()
const DISTRIBUTOR_PUBLIC = 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL';

describe('burn', () => {
  it('submits payment from distributor back to issuer', async () => {
    const submitMock = vi.fn().mockResolvedValue({ hash: 'burn-tx', ledger: 1 });
    const client = {
      networkConfig: { networkPassphrase: 'Test SDF Network ; September 2015' },
      horizon: {
        loadAccount: vi.fn().mockResolvedValue({
          id: DISTRIBUTOR_PUBLIC,
          accountId: () => DISTRIBUTOR_PUBLIC,
          sequence: '100',
          sequenceNumber: () => '100',
          incrementSequenceNumber: vi.fn(),
        }),
        submitTransaction: submitMock,
      },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient;

    const result = await burn(client, {
      distributorSecretKey: DISTRIBUTOR_SECRET,
      issuerAddress: 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL',
      assetCode: 'TSTKN',
      amount: '50',
    });
    expect(result.hash).toBe('burn-tx');
    expect(submitMock).toHaveBeenCalledOnce();
  });
});
