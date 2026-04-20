import type { StellarClient } from '@stellar-solutions/core';
import {
  InvalidAddressError,
  InvalidAmountError,
  InvalidAssetCodeError,
  InvalidSecretKeyError,
  IssuerLockedError,
} from '@stellar-solutions/core';
import { describe, expect, it, vi } from 'vitest';
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
      submitTransaction: vi
        .fn()
        .mockResolvedValue({ hash: 'mint-tx', ledger: 1, fee_charged: '100' }),
    },
    withTimeout: (p: Promise<unknown>) => p,
  } as unknown as StellarClient;
}

const STUB_CLIENT = {} as unknown as StellarClient;

describe('mintTo — validation', () => {
  it('throws InvalidSecretKeyError for invalid secret key', async () => {
    await expect(
      mintTo(STUB_CLIENT, {
        issuerSecretKey: 'BADSECRET',
        assetCode: 'TSTKN',
        destination: ISSUER_PUBLIC,
        amount: '100',
      }),
    ).rejects.toThrow(InvalidSecretKeyError);
  });

  it('throws InvalidAddressError for invalid destination', async () => {
    await expect(
      mintTo(STUB_CLIENT, {
        issuerSecretKey: ISSUER_SECRET,
        assetCode: 'TSTKN',
        destination: 'BADINVALID',
        amount: '100',
      }),
    ).rejects.toThrow(InvalidAddressError);
  });

  it('throws InvalidAmountError for zero amount', async () => {
    await expect(
      mintTo(STUB_CLIENT, {
        issuerSecretKey: ISSUER_SECRET,
        assetCode: 'TSTKN',
        destination: ISSUER_PUBLIC,
        amount: '0',
      }),
    ).rejects.toThrow(InvalidAmountError);
  });

  it('throws InvalidAssetCodeError for invalid asset code', async () => {
    await expect(
      mintTo(STUB_CLIENT, {
        issuerSecretKey: ISSUER_SECRET,
        assetCode: 'invalid!',
        destination: ISSUER_PUBLIC,
        amount: '100',
      }),
    ).rejects.toThrow(InvalidAssetCodeError);
  });
});

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
    expect(
      (client.horizon as unknown as { submitTransaction: ReturnType<typeof vi.fn> })
        .submitTransaction,
    ).toHaveBeenCalledOnce();
  });

  it('throws IssuerLockedError when master weight is 0', async () => {
    const client = makeMintClient(0);
    await expect(
      mintTo(client, {
        issuerSecretKey: ISSUER_SECRET,
        assetCode: 'TSTKN',
        destination: 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL',
        amount: '100',
      }),
    ).rejects.toThrow(IssuerLockedError);
  });
});
