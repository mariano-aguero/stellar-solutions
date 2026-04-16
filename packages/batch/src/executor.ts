import { Asset, Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import type { BatchPayment, StellarClient } from '@stellar-solutions/core';
import type { ResultCollector } from './result-collector.js';

export interface ExecuteOptions {
  onProgress?: (done: number, total: number) => void;
  maxRetries?: number;
}

export async function executeChunks(
  client: StellarClient,
  keypair: Keypair,
  chunks: BatchPayment[][],
  collector: ResultCollector,
  options: ExecuteOptions = {},
): Promise<void> {
  const maxRetries = options.maxRetries ?? 3;
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  let processed = 0;

  for (const [i, chunk] of chunks.entries()) {
    await submitChunkWithRetry(client, keypair, chunk, i * 100, collector, maxRetries);
    processed += chunk.length;
    options.onProgress?.(processed, total);
  }
}

async function submitChunkWithRetry(
  client: StellarClient,
  keypair: Keypair,
  chunk: BatchPayment[],
  startIndex: number,
  collector: ResultCollector,
  maxRetries: number,
  attempt = 0,
): Promise<void> {
  try {
    const account = await client.withTimeout(client.horizon.loadAccount(keypair.publicKey()));
    const builder = new TransactionBuilder(account, {
      fee: String(100 * chunk.length),
      networkPassphrase: client.networkConfig.networkPassphrase,
    });

    for (const payment of chunk) {
      const asset = payment.asset === 'native'
        ? Asset.native()
        : new Asset(payment.asset.code, payment.asset.issuer);
      builder.addOperation(
        Operation.payment({ destination: payment.to, asset, amount: payment.amount }),
      );
    }

    const tx = builder.setTimeout(180).build();
    tx.sign(keypair);
    const result = await client.withTimeout(client.horizon.submitTransaction(tx));
    collector.recordSuccess(result.hash, chunk.length);
  } catch (err: unknown) {
    if (isBadSeqError(err) && attempt === 0) {
      return submitChunkWithRetry(client, keypair, chunk, startIndex, collector, maxRetries, 1);
    }
    if (isRetryableError(err) && attempt < maxRetries) {
      return submitChunkWithRetry(client, keypair, chunk, startIndex, collector, maxRetries, attempt + 1);
    }
    const reason = err instanceof Error ? err.message : String(err);
    const code = extractCode(err);
    collector.recordFailure(chunk, startIndex, reason, code);
  }
}

function isBadSeqError(err: unknown): boolean {
  if (err == null || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  const data = (e['response'] as Record<string, unknown> | undefined)?.['data'] as Record<string, unknown> | undefined;
  return (data?.['extras'] as Record<string, unknown> | undefined)
    ?.['result_codes'] != null &&
    ((data?.['extras'] as Record<string, unknown>)['result_codes'] as Record<string, unknown>)
    ?.['transaction'] === 'tx_bad_seq';
}

function isRetryableError(err: unknown): boolean {
  if (err == null || typeof err !== 'object') return false;
  const msg = (err as Error).message ?? '';
  return msg.includes('timeout') || msg.includes('tx_too_late') || msg.includes('NetworkTimeoutError');
}

function extractCode(err: unknown): string | undefined {
  if (err == null || typeof err !== 'object') return undefined;
  const e = err as Record<string, unknown>;
  const data = (e['response'] as Record<string, unknown> | undefined)?.['data'] as Record<string, unknown> | undefined;
  const codes = (data?.['extras'] as Record<string, unknown> | undefined)?.['result_codes'] as Record<string, unknown> | undefined;
  const code = codes?.['transaction'];
  return typeof code === 'string' ? code : undefined;
}
