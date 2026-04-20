import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Keypair } from '@stellar/stellar-sdk';
import type { StellarClient } from '@stellar-solutions/core';
import { InvalidAssetCodeError, InvalidAmountError } from '@stellar-solutions/core';
import { createAsset } from '../createAsset.js';

// Use a real public key so TransactionBuilder.build() is satisfied
const MOCK_PUBLIC_KEY = Keypair.random().publicKey();

// Minimal mock that satisfies TransactionBuilder + fundAccount + submitTransaction
function makeMockClient(balances: unknown[] = []) {
  const mockAccount = {
    id: MOCK_PUBLIC_KEY,
    accountId: () => MOCK_PUBLIC_KEY,
    sequence: '100',
    sequenceNumber: () => '100',
    balances,
    incrementSequenceNumber: vi.fn(),
  };

  return {
    networkConfig: {
      networkPassphrase: 'Test SDF Network ; September 2015',
      friendbotUrl: 'https://friendbot.stellar.org',
    },
    horizon: {
      loadAccount: vi.fn().mockResolvedValue(mockAccount),
      submitTransaction: vi.fn().mockResolvedValue({ hash: 'testhash', ledger: 1 }),
    },
    withTimeout: (p: Promise<unknown>) => p,
  } as unknown as StellarClient;
}

describe('createAsset', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ hash: 'friendbot-tx' }),
    } as Response);
  });

  it('returns AssetResult with issuerAddress, distributorAddress, explorerUrl', async () => {
    const client = makeMockClient();
    const result = await createAsset(client, {
      code: 'TSTKN',
      totalSupply: '1000',
      fundingSecretKey: 'SCN6I4YH2IR7SZ6RHYQMI2TCTS4VXG6MGS4APWXYEUH26VFMYPQMUT5A',
    });
    expect(result.assetCode).toBe('TSTKN');
    expect(result.issuerAddress).toMatch(/^G/);
    expect(result.distributorAddress).toMatch(/^G/);
    expect(result.explorerUrl).toContain('stellar.expert');
    expect(result.explorerUrl).toContain('TSTKN');
  });

  it('throws InvalidAssetCodeError for invalid asset code', async () => {
    const client = makeMockClient();
    await expect(createAsset(client, {
      code: 'invalid!',
      totalSupply: '1000',
      fundingSecretKey: 'SCN6I4YH2IR7SZ6RHYQMI2TCTS4VXG6MGS4APWXYEUH26VFMYPQMUT5A',
    })).rejects.toThrow(InvalidAssetCodeError);
  });

  it('throws InvalidAmountError for zero totalSupply', async () => {
    const client = makeMockClient();
    await expect(createAsset(client, {
      code: 'TSTKN',
      totalSupply: '0',
      fundingSecretKey: 'SCN6I4YH2IR7SZ6RHYQMI2TCTS4VXG6MGS4APWXYEUH26VFMYPQMUT5A',
    })).rejects.toThrow(InvalidAmountError);
  });
});
