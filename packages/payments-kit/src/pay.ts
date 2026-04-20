import {
  Asset as StellarAsset,
  Keypair,
  Memo,
  Operation,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import type { StellarClient, TxResult, Asset } from '@stellar-solutions/core';
import { SequenceError, InvalidSecretKeyError } from '@stellar-solutions/core';
import { estimateFee } from './fees.js';
import { validateAddress, validateAmount, validateAsset } from './validators.js';

export interface PaymentOptions {
  /**
   * SECRET key of the source account. **Never** log, serialize, or transmit this value.
   * Exists only in memory for signing and should be discarded after the call.
   */
  from: string;
  /** Public key (G...) of the destination account. */
  to: string;
  amount: string;
  asset: Asset;
  memo?: string;
  /** Fee in stroops as a decimal string (e.g. "100"). If omitted, fetched from Horizon feeStats. */
  fee?: string;
}

function toStellarAsset(asset: Asset): StellarAsset {
  if (asset === 'native') return StellarAsset.native();
  return new StellarAsset(asset.code, asset.issuer);
}

function extractFeeCharged(result: unknown, fallback: string): string {
  if (result != null && typeof result === 'object' && 'fee_charged' in result) {
    const fc = (result as { fee_charged: unknown }).fee_charged;
    if (typeof fc === 'string' && /^\d+$/.test(fc)) return fc;
    if (typeof fc === 'number' && Number.isFinite(fc)) return String(fc);
  }
  return fallback;
}

function isBadSeqError(err: unknown): boolean {
  if (err == null || typeof err !== 'object') return false;
  const response = (err as Record<string, unknown>).response;
  if (response == null || typeof response !== 'object') return false;
  const data = (response as Record<string, unknown>).data;
  if (data == null || typeof data !== 'object') return false;
  const extras = (data as Record<string, unknown>).extras;
  if (extras == null || typeof extras !== 'object') return false;
  const resultCodes = (extras as Record<string, unknown>).result_codes;
  if (resultCodes == null || typeof resultCodes !== 'object') return false;
  return (resultCodes as Record<string, unknown>).transaction === 'tx_bad_seq';
}

export async function pay(client: StellarClient, options: PaymentOptions): Promise<TxResult> {
  if (!StrKey.isValidEd25519SecretSeed(options.from)) throw new InvalidSecretKeyError();
  const keypair = Keypair.fromSecret(options.from);
  const sourceAddress = keypair.publicKey();

  validateAddress(options.to);
  validateAmount(options.amount);
  validateAsset(options.asset);

  const fee = options.fee ?? await estimateFee(client);

  async function buildAndSubmit(retryCount = 0): Promise<TxResult> {
    const account = await client.withTimeout(client.horizon.loadAccount(sourceAddress));

    const builder = new TransactionBuilder(account as ConstructorParameters<typeof TransactionBuilder>[0], {
      fee,
      networkPassphrase: client.networkConfig.networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: options.to,
          asset: toStellarAsset(options.asset),
          amount: options.amount,
        }),
      )
      .setTimeout(180);

    if (options.memo) {
      builder.addMemo(Memo.text(options.memo));
    }

    const tx = builder.build();
    tx.sign(keypair);

    try {
      const result = await client.withTimeout(client.horizon.submitTransaction(tx));
      return {
        hash: result.hash,
        ledger: result.ledger,
        fee: extractFeeCharged(result, String(fee)),
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      if (isBadSeqError(err) && retryCount === 0) {
        return buildAndSubmit(1);
      }
      if (isBadSeqError(err)) {
        throw new SequenceError();
      }
      throw err;
    }
  }

  return buildAndSubmit();
}
