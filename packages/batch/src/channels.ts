import type { BatchPayment, StellarClient } from '@stellar-solutions/core';
import { Keypair } from '@stellar/stellar-sdk';
import { ResultCollector } from './result-collector.js';
import { executeChunks } from './executor.js';
import type { ExecuteOptions } from './executor.js';

export class ChannelPool {
  private readonly keypairs: Keypair[];

  constructor(secretKeys: string[]) {
    if (secretKeys.length === 0) throw new Error('ChannelPool requires at least one secret key');
    this.keypairs = secretKeys.map((sk) => Keypair.fromSecret(sk));
  }

  get size(): number {
    return this.keypairs.length;
  }

  async executeWithChannels(
    client: StellarClient,
    chunks: BatchPayment[][],
    collector: ResultCollector,
    options: ExecuteOptions = {},
  ): Promise<void> {
    if (this.keypairs.length === 1) {
      // Single channel: sequential
      return executeChunks(client, this.keypairs[0]!, chunks, collector, options);
    }

    // Multi-channel: distribute chunks across keypairs, process in parallel batches
    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    let processed = 0;

    for (let i = 0; i < chunks.length; i += this.keypairs.length) {
      const batch = chunks.slice(i, i + this.keypairs.length);
      await Promise.all(
        batch.map(async (chunk, j) => {
          const keypair = this.keypairs[j % this.keypairs.length]!;
          const singleChunkCollector = new ResultCollector();
          await executeChunks(client, keypair, [chunk], singleChunkCollector, {});
          const result = singleChunkCollector.toBatchResult();
          if (result.txHashes[0] !== undefined) {
            collector.recordSuccess(result.txHashes[0], result.successful);
          }
          for (const failure of result.errors) {
            collector.recordFailure([failure.payment], failure.index, failure.reason, failure.code);
          }
          processed += chunk.length;
          options.onProgress?.(processed, total);
        }),
      );
    }
  }
}
