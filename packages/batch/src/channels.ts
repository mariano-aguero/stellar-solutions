import type { BatchPayment, StellarClient } from '@stellar-solutions/core';
import { StellarKitError } from '@stellar-solutions/core';
import { Keypair } from '@stellar/stellar-sdk';
import { executeChunks } from './executor.js';
import type { ExecuteOptions } from './executor.js';
import { ResultCollector } from './result-collector.js';

export class ChannelPool {
  private readonly keypairs: Keypair[];

  constructor(secretKeys: string[]) {
    if (secretKeys.length === 0) {
      throw new StellarKitError(
        'ChannelPool requires at least one secret key',
        'INVALID_CHANNEL_CONFIG',
      );
    }
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

    // Multi-channel: distribute chunks across keypairs, process in parallel batches.
    // Precompute the absolute offset of each chunk in the original payment array so
    // failures are reported with the correct index even when chunks have varying sizes.
    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    const offsets: number[] = [];
    let running = 0;
    for (const chunk of chunks) {
      offsets.push(running);
      running += chunk.length;
    }
    let processed = 0;

    for (let i = 0; i < chunks.length; i += this.keypairs.length) {
      const batchIndices: number[] = [];
      for (let k = i; k < Math.min(i + this.keypairs.length, chunks.length); k++)
        batchIndices.push(k);

      // allSettled so a thrown error in one channel doesn't abort the remaining
      // parallel chunks. Any unexpected throw is recorded as a failure for that chunk.
      await Promise.allSettled(
        batchIndices.map(async (chunkIdx, j) => {
          const chunk = chunks[chunkIdx]!;
          const keypair = this.keypairs[j % this.keypairs.length]!;
          const singleChunkCollector = new ResultCollector();
          try {
            await executeChunks(client, keypair, [chunk], singleChunkCollector, {
              // startOffset carries the absolute index so failures record correctly.
              startOffset: offsets[chunkIdx]!,
            });
          } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            collector.recordFailure(chunk, offsets[chunkIdx]!, reason);
            return;
          }
          const result = singleChunkCollector.toBatchResult();
          if (result.txHashes[0] !== undefined) {
            collector.recordSuccess(result.txHashes[0], result.successful);
          }
          for (const failure of result.errors) {
            // failure.index already absolute thanks to startOffset
            collector.recordFailure([failure.payment], failure.index, failure.reason, failure.code);
          }
        }),
      );

      // Accumulate progress AFTER allSettled resolves — no closure race on shared `processed`.
      for (const chunkIdx of batchIndices) processed += chunks[chunkIdx]!.length;
      options.onProgress?.(processed, total);
    }
  }
}
