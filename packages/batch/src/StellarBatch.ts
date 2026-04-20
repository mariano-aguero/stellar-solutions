import { createClient } from '@stellar-solutions/core';
import type { BatchPayment, BatchResult, Network, StellarClient } from '@stellar-solutions/core';
import { ChannelPool } from './channels.js';
import { estimate } from './estimator.js';
import type { BatchEstimate } from './estimator.js';
import { validateAndChunk } from './queue.js';
import { ResultCollector } from './result-collector.js';

export interface StellarBatchOptions {
  secretKey: string;
  network: Network;
  channelSecretKeys?: string[]; // additional channel accounts for parallel submission
  maxRetries?: number;
}

export class StellarBatch {
  private readonly client: StellarClient;
  private readonly pool: ChannelPool;
  private readonly maxRetries: number;

  constructor(options: StellarBatchOptions) {
    this.client = createClient(options.network);
    this.maxRetries = options.maxRetries ?? 3;
    // Primary account + optional extra channels
    const allKeys = [options.secretKey, ...(options.channelSecretKeys ?? [])];
    this.pool = new ChannelPool(allKeys);
  }

  async send(
    payments: BatchPayment[],
    options?: { onProgress?: (done: number, total: number) => void },
  ): Promise<BatchResult> {
    const chunks = validateAndChunk(payments);
    const collector = new ResultCollector();
    await this.pool.executeWithChannels(this.client, chunks, collector, {
      maxRetries: this.maxRetries,
      ...(options?.onProgress !== undefined ? { onProgress: options.onProgress } : {}),
    });
    return collector.toBatchResult();
  }

  estimate(payments: BatchPayment[]): BatchEstimate {
    return estimate(payments);
  }
}
