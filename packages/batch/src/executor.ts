import { Asset, Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import type { BatchPayment, StellarClient } from '@stellar-solutions/core';
import type { ResultCollector } from './result-collector.js';

export interface ExecuteOptions {
  onProgress?: (done: number, total: number) => void;
  maxRetries?: number;
  /** Absolute offset of the first chunk in the original payment array (for failure indexing). */
  startOffset?: number;
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
  let offset = options.startOffset ?? 0;

  for (const chunk of chunks) {
    await submitChunkWithRetry(client, keypair, chunk, offset, collector, maxRetries);
    offset += chunk.length;
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
  badSeqRetries = 0,
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
    // bad_seq is retried at most once regardless of attempt number — sequence skew can happen any time.
    if (isBadSeqError(err) && badSeqRetries === 0) {
      return submitChunkWithRetry(client, keypair, chunk, startIndex, collector, maxRetries, attempt, 1);
    }
    if (isRetryableError(err) && attempt < maxRetries) {
      return submitChunkWithRetry(client, keypair, chunk, startIndex, collector, maxRetries, attempt + 1, badSeqRetries);
    }
    const reason = err instanceof Error ? err.message : String(err);
    const code = extractTxResultCode(err);
    collector.recordFailure(chunk, startIndex, reason, code);
  }
}

function getTxResultCodes(err: unknown): Record<string, unknown> | undefined {
  if (err == null || typeof err !== 'object') return undefined;
  const response = (err as { response?: unknown }).response;
  if (response == null || typeof response !== 'object') return undefined;
  const data = (response as { data?: unknown }).data;
  if (data == null || typeof data !== 'object') return undefined;
  const extras = (data as { extras?: unknown }).extras;
  if (extras == null || typeof extras !== 'object') return undefined;
  const codes = (extras as { result_codes?: unknown }).result_codes;
  if (codes == null || typeof codes !== 'object') return undefined;
  return codes as Record<string, unknown>;
}

function isBadSeqError(err: unknown): boolean {
  return getTxResultCodes(err)?.['transaction'] === 'tx_bad_seq';
}

function isRetryableError(err: unknown): boolean {
  if (err == null || typeof err !== 'object') return false;
  const msg = (err as Error).message ?? '';
  return msg.includes('timeout') || msg.includes('tx_too_late') || msg.includes('NetworkTimeoutError');
}

function extractTxResultCode(err: unknown): string | undefined {
  const code = getTxResultCodes(err)?.['transaction'];
  return typeof code === 'string' ? code : undefined;
}
