import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Keypair } from '@stellar/stellar-sdk';
import { ChannelPool } from '../channels.js';
import { ResultCollector } from '../result-collector.js';
import type { StellarClient } from '@stellar-solutions/core';

// Mock executeChunks to avoid real network calls
vi.mock('../executor.js', () => ({
  executeChunks: vi.fn().mockResolvedValue(undefined),
}));

import { executeChunks } from '../executor.js';

const payment = {
  to: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
  amount: '1.0',
  asset: 'native' as const,
};

const mockClient = {} as StellarClient;

describe('ChannelPool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws if no secret keys provided', () => {
    expect(() => new ChannelPool([])).toThrow('at least one secret key');
  });

  it('size returns number of keypairs', () => {
    const pool = new ChannelPool([Keypair.random().secret()]);
    expect(pool.size).toBe(1);
  });

  it('single channel: calls executeChunks once sequentially', async () => {
    const pool = new ChannelPool([Keypair.random().secret()]);
    const collector = new ResultCollector();
    const chunks = [[payment], [payment]];
    await pool.executeWithChannels(mockClient, chunks, collector);
    expect(executeChunks).toHaveBeenCalledTimes(1);
    expect(executeChunks).toHaveBeenCalledWith(mockClient, expect.any(Keypair), chunks, collector, {});
  });

  it('3 channels: runs 3 chunks concurrently (Promise.all)', async () => {
    const secrets = [Keypair.random().secret(), Keypair.random().secret(), Keypair.random().secret()];
    const pool = new ChannelPool(secrets);
    const collector = new ResultCollector();
    // 3 chunks → all 3 dispatched in one Promise.all batch
    const chunks = [[payment], [payment], [payment]];

    // Mock executeChunks to record calls with timing
    const callOrder: number[] = [];
    (executeChunks as ReturnType<typeof vi.fn>).mockImplementation(async (_c, _k, [chunk]) => {
      callOrder.push(chunks.indexOf(chunk as typeof payment[]));
    });

    await pool.executeWithChannels(mockClient, chunks, collector);
    // All 3 should have been called
    expect(executeChunks).toHaveBeenCalledTimes(3);
  });
});
