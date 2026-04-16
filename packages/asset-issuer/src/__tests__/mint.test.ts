import { describe, it, expect, vi } from 'vitest';
import type { StellarClient } from '@stellar-solutions/core';
import { IssuerLockedError } from '@stellar-solutions/core';
import { mintTo } from '../mint.js';

const ISSUER_SECRET = 'SCN6I4YH2IR7SZ6RHYQMI2TCTS4VXG6MGS4APWXYEUH26VFMYPQMUT5A';
// Derived from ISSUER_SECRET via Keypair.fromSecret(ISSUER_SECRET).publicKey()
const ISSUER_PUBLIC = 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL';

function makeMintClient(masterWeight = 1) {
  return {
    networkConfig: { networkPassphrase: 'Test SDF Network ; September 2015' },
    horizon: {
      loadAccount: vi.fn().mockResolvedValue({
        id: ISSUER_PUBLIC,
        accountId: () => ISSUER_PUBLIC,
        sequence: '100',
        sequenceNumber: () => '100',
        signers: [{ key: ISSUER_PUBLIC, weight: masterWeight }],
        thresholds: { low_threshold: 0, med_threshold: 0, high_threshold: 0 },
        incrementSequenceNumber: vi.fn(),
      }),
      submitTransaction: vi.fn().mockResolvedValue({ hash: 'mint-tx', ledger: 1 }),
    },
    withTimeout: (p: Promise<unknown>) => p,
  } as unknown as StellarClient;
}

describe('mintTo', () => {
  it('submits payment from issuer to destination', async () => {
    const client = makeMintClient();
    const result = await mintTo(client, {
      issuerSecretKey: ISSUER_SECRET,
      assetCode: 'TSTKN',
      destination: 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL',
      amount: '100',
    });
    expect(result.hash).toBe('mint-tx');
    expect((client.horizon as unknown as { submitTransaction: ReturnType<typeof vi.fn> }).submitTransaction).toHaveBeenCalledOnce();
  });

  it('throws IssuerLockedError when master weight is 0', async () => {
    const client = makeMintClient(0);
    await expect(mintTo(client, {
      issuerSecretKey: ISSUER_SECRET,
      assetCode: 'TSTKN',
      destination: 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL',
      amount: '100',
    })).rejects.toThrow(IssuerLockedError);
  });
});
