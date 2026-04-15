import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pay } from '../pay.js';
import type { StellarClient } from '@stellar-solutions/core';
import { SequenceError } from '@stellar-solutions/core';

// Known-valid Stellar keypair for testing
const TEST_SECRET = 'SCN6I4YH2IR7SZ6RHYQMI2TCTS4VXG6MGS4APWXYEUH26VFMYPQMUT5A';
const TEST_DEST = 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL';

const mockSubmitResult = {
  hash: 'abc123def456abc123def456abc123def456abc123def456abc123def456abcd',
  ledger: 12345,
  fee_charged: '100',
  created_at: '2026-01-01T00:00:00Z',
};

function makeMockClient(overrides?: Partial<{ submitResult: unknown; loadAccountFn: ReturnType<typeof vi.fn> }>): StellarClient {
  const { Keypair } = require('@stellar/stellar-sdk');
  const sourcePublic = Keypair.fromSecret(TEST_SECRET).publicKey();
  const mockAccount = {
    id: sourcePublic,
    accountId: () => sourcePublic,
    sequence: '1000',
    sequenceNumber: () => '1000',
    balances: [{ asset_type: 'native', balance: '100.0000000' }],
    incrementSequenceNumber: vi.fn(),
  };
  return {
    horizon: {
      loadAccount: overrides?.loadAccountFn ?? vi.fn().mockResolvedValue(mockAccount),
      submitTransaction: vi.fn().mockResolvedValue(overrides?.submitResult ?? mockSubmitResult),
      feeStats: vi.fn().mockResolvedValue({ fee_charged: { p50: '100' }, base_fee_in_stroops: '100' }),
    },
    networkConfig: { networkPassphrase: 'Test SDF Network ; September 2015' },
    withTimeout: (p: Promise<unknown>) => p,
  } as unknown as StellarClient;
}

describe('pay — happy path', () => {
  it('submits XLM payment and returns TxResult', async () => {
    const client = makeMockClient();
    const result = await pay(client, {
      from: TEST_SECRET,
      to: TEST_DEST,
      amount: '10',
      asset: 'native',
    });
    expect(result.hash).toBe(mockSubmitResult.hash);
    expect(result.ledger).toBe(12345);
    expect(result.fee).toBe(100);
  });

  it('uses provided fee instead of estimating', async () => {
    const client = makeMockClient();
    const result = await pay(client, {
      from: TEST_SECRET,
      to: TEST_DEST,
      amount: '5',
      asset: 'native',
      fee: 200,
    });
    expect(result.hash).toBe(mockSubmitResult.hash);
    // feeStats should NOT be called since fee was provided
    expect((client.horizon as { feeStats: ReturnType<typeof vi.fn> }).feeStats).not.toHaveBeenCalled();
  });
});

describe('pay — sequence retry', () => {
  it('retries once on tx_bad_seq then succeeds', async () => {
    const loadAccountFn = vi.fn().mockResolvedValue((() => {
      const { Keypair } = require('@stellar/stellar-sdk');
      const sourcePublic = Keypair.fromSecret(TEST_SECRET).publicKey();
      return {
        id: sourcePublic,
        accountId: () => sourcePublic,
        sequence: '1000',
        sequenceNumber: () => '1000',
        balances: [{ asset_type: 'native', balance: '100.0000000' }],
        incrementSequenceNumber: vi.fn(),
      };
    })());
    const badSeqError = { response: { data: { extras: { result_codes: { transaction: 'tx_bad_seq' } } } } };
    const client = {
      horizon: {
        loadAccount: loadAccountFn,
        submitTransaction: vi.fn()
          .mockRejectedValueOnce(badSeqError)
          .mockResolvedValueOnce(mockSubmitResult),
        feeStats: vi.fn().mockResolvedValue({ fee_charged: { p50: '100' }, base_fee_in_stroops: '100' }),
      },
      networkConfig: { networkPassphrase: 'Test SDF Network ; September 2015' },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient;

    const result = await pay(client, {
      from: TEST_SECRET,
      to: TEST_DEST,
      amount: '1',
      asset: 'native',
    });
    expect(result.hash).toBe(mockSubmitResult.hash);
    expect((client.horizon as { submitTransaction: ReturnType<typeof vi.fn> }).submitTransaction).toHaveBeenCalledTimes(2);
    // loadAccount called twice: once for initial, once for retry
    expect(loadAccountFn).toHaveBeenCalledTimes(2);
  });

  it('throws SequenceError when tx_bad_seq persists after retry', async () => {
    const badSeqError = { response: { data: { extras: { result_codes: { transaction: 'tx_bad_seq' } } } } };
    const { Keypair } = require('@stellar/stellar-sdk');
    const sourcePublic = Keypair.fromSecret(TEST_SECRET).publicKey();
    const mockAccount = {
      id: sourcePublic,
      accountId: () => sourcePublic,
      sequence: '1000',
      sequenceNumber: () => '1000',
      balances: [{ asset_type: 'native', balance: '100.0000000' }],
      incrementSequenceNumber: vi.fn(),
    };
    const client = {
      horizon: {
        loadAccount: vi.fn().mockResolvedValue(mockAccount),
        submitTransaction: vi.fn().mockRejectedValue(badSeqError),
        feeStats: vi.fn().mockResolvedValue({ fee_charged: { p50: '100' }, base_fee_in_stroops: '100' }),
      },
      networkConfig: { networkPassphrase: 'Test SDF Network ; September 2015' },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient;

    await expect(pay(client, {
      from: TEST_SECRET,
      to: TEST_DEST,
      amount: '1',
      asset: 'native',
    })).rejects.toThrow(SequenceError);
  });
});
