import type { StellarClient } from '@stellar-solutions/core';
import {
  InvalidAddressError,
  InvalidAmountError,
  InvalidAssetCodeError,
  InvalidSecretKeyError,
} from '@stellar-solutions/core';
import { describe, expect, it, vi } from 'vitest';
import { burn } from '../burn.js';

const DISTRIBUTOR_SECRET = 'SCN6I4YH2IR7SZ6RHYQMI2TCTS4VXG6MGS4APWXYEUH26VFMYPQMUT5A';
// Derived from DISTRIBUTOR_SECRET via Keypair.fromSecret(DISTRIBUTOR_SECRET).publicKey()
const DISTRIBUTOR_PUBLIC = 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL';

const STUB_CLIENT = {} as unknown as StellarClient;

describe('burn', () => {
  it('throws InvalidSecretKeyError for invalid distributor secret key', async () => {
    await expect(
      burn(STUB_CLIENT, {
        distributorSecretKey: 'BADSECRET',
        issuerAddress: DISTRIBUTOR_PUBLIC,
        assetCode: 'TSTKN',
        amount: '50',
      }),
    ).rejects.toThrow(InvalidSecretKeyError);
  });

  it('throws InvalidAddressError for invalid issuerAddress', async () => {
    await expect(
      burn(STUB_CLIENT, {
        distributorSecretKey: DISTRIBUTOR_SECRET,
        issuerAddress: 'BADINVALID',
        assetCode: 'TSTKN',
        amount: '50',
      }),
    ).rejects.toThrow(InvalidAddressError);
  });

  it('throws InvalidAmountError for zero amount', async () => {
    await expect(
      burn(STUB_CLIENT, {
        distributorSecretKey: DISTRIBUTOR_SECRET,
        issuerAddress: DISTRIBUTOR_PUBLIC,
        assetCode: 'TSTKN',
        amount: '0',
      }),
    ).rejects.toThrow(InvalidAmountError);
  });

  it('throws InvalidAmountError for non-numeric amount', async () => {
    await expect(
      burn(STUB_CLIENT, {
        distributorSecretKey: DISTRIBUTOR_SECRET,
        issuerAddress: DISTRIBUTOR_PUBLIC,
        assetCode: 'TSTKN',
        amount: 'abc',
      }),
    ).rejects.toThrow(InvalidAmountError);
  });

  it('throws InvalidAssetCodeError for invalid asset code', async () => {
    await expect(
      burn(STUB_CLIENT, {
        distributorSecretKey: DISTRIBUTOR_SECRET,
        issuerAddress: DISTRIBUTOR_PUBLIC,
        assetCode: 'invalid!',
        amount: '50',
      }),
    ).rejects.toThrow(InvalidAssetCodeError);
  });

  it('submits payment from distributor back to issuer', async () => {
    const submitMock = vi
      .fn()
      .mockResolvedValue({ hash: 'burn-tx', ledger: 1, fee_charged: '100' });
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
