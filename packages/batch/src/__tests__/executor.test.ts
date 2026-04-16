import { vi, describe, it, expect } from 'vitest';
import { Keypair } from '@stellar/stellar-sdk';
import { executeChunks } from '../executor.js';
import { ResultCollector } from '../result-collector.js';
import type { StellarClient } from '@stellar-solutions/core';

const payment = {
  to: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
  amount: '1.0',
  asset: 'native' as const,
};

vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stellar/stellar-sdk')>();
  const MockTxBuilder = vi.fn().mockReturnValue({
    addOperation: vi.fn().mockReturnThis(),
    setTimeout: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue({ sign: vi.fn(), toXDR: vi.fn() }),
  });
  return { ...actual, TransactionBuilder: MockTxBuilder };
});

function makeClient(submitResult: unknown): StellarClient {
  return {
    horizon: {
      loadAccount: vi.fn().mockResolvedValue({}),
      submitTransaction: vi.fn().mockResolvedValue(submitResult),
    },
    rpc: {} as never,
    networkConfig: {
      networkPassphrase: 'Test SDF Network ; September 2015',
      horizonUrl: 'https://horizon-testnet.stellar.org',
      sorobanRpcUrl: '',
    },
    withTimeout: vi.fn((p) => p),
  } as unknown as StellarClient;
}

describe('executeChunks', () => {
  it('submits 1 tx for a single chunk', async () => {
    const keypair = Keypair.random();
    const client = makeClient({ hash: 'hash1', ledger: 1 });
    const collector = new ResultCollector();
    await executeChunks(client, keypair, [[payment, payment]], collector);
    const result = collector.toBatchResult();
    expect(result.successful).toBe(2);
    expect(result.txHashes).toEqual(['hash1']);
    expect(client.horizon.submitTransaction).toHaveBeenCalledTimes(1);
  });

  it('submits 3 txs for 3 chunks', async () => {
    const keypair = Keypair.random();
    const client = makeClient({ hash: 'hash1', ledger: 1 });
    const collector = new ResultCollector();
    const chunks = [
      Array(100).fill(payment) as typeof payment[],
      Array(100).fill(payment) as typeof payment[],
      Array(50).fill(payment) as typeof payment[],
    ];
    await executeChunks(client, keypair, chunks, collector);
    expect(client.horizon.submitTransaction).toHaveBeenCalledTimes(3);
    expect(collector.toBatchResult().successful).toBe(250);
  });

  it('calls onProgress after each chunk', async () => {
    const keypair = Keypair.random();
    const client = makeClient({ hash: 'hash1', ledger: 1 });
    const collector = new ResultCollector();
    const progress: Array<[number, number]> = [];
    await executeChunks(client, keypair, [[payment], [payment, payment]], collector, {
      onProgress: (done, total) => progress.push([done, total]),
    });
    expect(progress).toEqual([[1, 3], [3, 3]]);
  });

  it('records failure when submit throws non-retryable error', async () => {
    const keypair = Keypair.random();
    const client = makeClient(null);
    (client.horizon.submitTransaction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('tx_failed'));
    const collector = new ResultCollector();
    await executeChunks(client, keypair, [[payment]], collector);
    const result = collector.toBatchResult();
    expect(result.failed).toBe(1);
    expect(result.successful).toBe(0);
  });

  it('retries on tx_bad_seq', async () => {
    const keypair = Keypair.random();
    const client = makeClient({ hash: 'hash1', ledger: 1 });
    const badSeqError = {
      response: {
        data: {
          extras: { result_codes: { transaction: 'tx_bad_seq' } },
        },
      },
      message: 'bad sequence',
    };
    (client.horizon.submitTransaction as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(badSeqError)
      .mockResolvedValueOnce({ hash: 'hash1', ledger: 1 });
    const collector = new ResultCollector();
    await executeChunks(client, keypair, [[payment]], collector);
    expect(client.horizon.submitTransaction).toHaveBeenCalledTimes(2);
    expect(collector.toBatchResult().successful).toBe(1);
  });
});
