import type { StellarClient } from '@stellar-solutions/core';
import { InvalidSecretKeyError, SequenceError } from '@stellar-solutions/core';
import { Keypair } from '@stellar/stellar-sdk';
import { describe, expect, it, vi } from 'vitest';
import { pay } from '../pay.js';

// Known-valid Stellar keypair for testing
const TEST_SECRET = 'SCN6I4YH2IR7SZ6RHYQMI2TCTS4VXG6MGS4APWXYEUH26VFMYPQMUT5A';
const TEST_DEST = 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL';
const TEST_SOURCE_PUBLIC = Keypair.fromSecret(TEST_SECRET).publicKey();

const mockSubmitResult = {
  hash: 'abc123def456abc123def456abc123def456abc123def456abc123def456abcd',
  ledger: 12345,
  fee_charged: '100',
  created_at: '2026-01-01T00:00:00Z',
};

function makeMockAccount() {
  return {
    id: TEST_SOURCE_PUBLIC,
    accountId: () => TEST_SOURCE_PUBLIC,
    sequence: '1000',
    sequenceNumber: () => '1000',
    balances: [{ asset_type: 'native', balance: '100.0000000' }],
    incrementSequenceNumber: vi.fn(),
  };
}

function makeMockClient(
  overrides?: Partial<{ submitResult: unknown; loadAccountFn: ReturnType<typeof vi.fn> }>,
): StellarClient {
  return {
    horizon: {
      loadAccount: overrides?.loadAccountFn ?? vi.fn().mockResolvedValue(makeMockAccount()),
      submitTransaction: vi.fn().mockResolvedValue(overrides?.submitResult ?? mockSubmitResult),
      feeStats: vi
        .fn()
        .mockResolvedValue({ fee_charged: { p50: '100' }, base_fee_in_stroops: '100' }),
    },
    networkConfig: { networkPassphrase: 'Test SDF Network ; September 2015' },
    withTimeout: (p: Promise<unknown>) => p,
  } as unknown as StellarClient;
}

describe('pay — validation', () => {
  it('throws InvalidSecretKeyError for invalid secret key', async () => {
    const client = makeMockClient();
    await expect(
      pay(client, {
        from: 'NOTASECRETKEY',
        to: TEST_DEST,
        amount: '1',
        asset: 'native',
      }),
    ).rejects.toThrow(InvalidSecretKeyError);
  });
});

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
    expect(result.fee).toBe('100'); // fee_charged from Horizon response (stroops, string)
  });

  it('uses provided fee instead of estimating', async () => {
    const feeStatsMock = vi
      .fn()
      .mockResolvedValue({ fee_charged: { p50: '100' }, base_fee_in_stroops: '100' });
    const client = {
      horizon: {
        loadAccount: vi.fn().mockResolvedValue(makeMockAccount()),
        submitTransaction: vi.fn().mockResolvedValue(mockSubmitResult),
        feeStats: feeStatsMock,
      },
      networkConfig: { networkPassphrase: 'Test SDF Network ; September 2015' },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient;

    const result = await pay(client, {
      from: TEST_SECRET,
      to: TEST_DEST,
      amount: '5',
      asset: 'native',
      fee: '200',
    });
    expect(result.hash).toBe(mockSubmitResult.hash);
    // feeStats should NOT be called since fee was provided
    expect(feeStatsMock).not.toHaveBeenCalled();
  });
});

describe('pay — sequence retry', () => {
  it('retries once on tx_bad_seq then succeeds', async () => {
    const loadAccountFn = vi.fn().mockResolvedValue(makeMockAccount());
    const badSeqError = {
      response: { data: { extras: { result_codes: { transaction: 'tx_bad_seq' } } } },
    };
    const submitMock = vi
      .fn()
      .mockRejectedValueOnce(badSeqError)
      .mockResolvedValueOnce(mockSubmitResult);
    const client = {
      horizon: {
        loadAccount: loadAccountFn,
        submitTransaction: submitMock,
        feeStats: vi
          .fn()
          .mockResolvedValue({ fee_charged: { p50: '100' }, base_fee_in_stroops: '100' }),
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
    expect(submitMock).toHaveBeenCalledTimes(2);
    // loadAccount called twice: once for initial, once for retry
    expect(loadAccountFn).toHaveBeenCalledTimes(2);
  });

  it('throws SequenceError when tx_bad_seq persists after retry', async () => {
    const badSeqError = {
      response: { data: { extras: { result_codes: { transaction: 'tx_bad_seq' } } } },
    };
    const client = {
      horizon: {
        loadAccount: vi.fn().mockResolvedValue(makeMockAccount()),
        submitTransaction: vi.fn().mockRejectedValue(badSeqError),
        feeStats: vi
          .fn()
          .mockResolvedValue({ fee_charged: { p50: '100' }, base_fee_in_stroops: '100' }),
      },
      networkConfig: { networkPassphrase: 'Test SDF Network ; September 2015' },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient;

    await expect(
      pay(client, {
        from: TEST_SECRET,
        to: TEST_DEST,
        amount: '1',
        asset: 'native',
      }),
    ).rejects.toThrow(SequenceError);
  });
});
