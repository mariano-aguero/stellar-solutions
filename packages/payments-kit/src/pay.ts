import {
  Asset as StellarAsset,
  Keypair,
  Memo,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import type { StellarClient, TxResult, Asset } from '@stellar-solutions/core';
import { SequenceError } from '@stellar-solutions/core';
import { estimateFee } from './fees.js';
import { validateAddress, validateAmount, validateAsset } from './validators.js';

export interface PaymentOptions {
  from: string;     // secret key
  to: string;       // public key destination
  amount: string;
  asset: Asset;
  memo?: string;
  fee?: number;
}

function toStellarAsset(asset: Asset): StellarAsset {
  if (asset === 'native') return StellarAsset.native();
  return new StellarAsset(asset.code, asset.issuer);
}

function isBadSeqError(err: unknown): boolean {
  try {
    const e = err as { response?: { data?: { extras?: { result_codes?: { transaction?: string } } } } };
    return e.response?.data?.extras?.result_codes?.transaction === 'tx_bad_seq';
  } catch {
    return false;
  }
}

export async function pay(client: StellarClient, options: PaymentOptions): Promise<TxResult> {
  const keypair = Keypair.fromSecret(options.from);
  const sourceAddress = keypair.publicKey();

  validateAddress(options.to);
  validateAmount(options.amount);
  validateAsset(options.asset);

  const fee = options.fee ?? await estimateFee(client);

  async function buildAndSubmit(retryCount = 0): Promise<TxResult> {
    const account = await client.withTimeout(client.horizon.loadAccount(sourceAddress));

    const builder = new TransactionBuilder(account as Parameters<typeof TransactionBuilder>[0], {
      fee: String(fee),
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
      const rawResult = result as {
        hash: string;
        ledger: number;
        fee_charged: string;
        created_at: string;
      };
      return {
        hash: rawResult.hash,
        ledger: rawResult.ledger,
        fee: parseInt(rawResult.fee_charged, 10),
        createdAt: rawResult.created_at,
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
