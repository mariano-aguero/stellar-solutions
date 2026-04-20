import type { StellarClient, TxResult } from '@stellar-solutions/core';
import {
  InvalidAddressError,
  InvalidSecretKeyError,
  isValidAddress,
} from '@stellar-solutions/core';
import { Asset, Keypair, Operation, StrKey, TransactionBuilder } from '@stellar/stellar-sdk';
import { extractFeeCharged, validateAmount, validateAssetCode } from './validators.js';

export interface BurnOptions {
  /** SECRET key of the distributor account. Never log or persist. */
  distributorSecretKey: string;
  issuerAddress: string;
  assetCode: string;
  amount: string;
}

export async function burn(client: StellarClient, options: BurnOptions): Promise<TxResult> {
  if (!StrKey.isValidEd25519SecretSeed(options.distributorSecretKey))
    throw new InvalidSecretKeyError();
  if (!isValidAddress(options.issuerAddress)) throw new InvalidAddressError(options.issuerAddress);
  validateAmount(options.amount);
  validateAssetCode(options.assetCode);

  const keypair = Keypair.fromSecret(options.distributorSecretKey);
  const distributorAddress = keypair.publicKey();

  const account = await client.withTimeout(client.horizon.loadAccount(distributorAddress));
  const asset = new Asset(options.assetCode, options.issuerAddress);

  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: client.networkConfig.networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: options.issuerAddress,
        asset,
        amount: options.amount,
      }),
    )
    .setTimeout(180)
    .build();

  tx.sign(keypair);
  const result = await client.withTimeout(client.horizon.submitTransaction(tx));

  return {
    hash: result.hash,
    ledger: result.ledger,
    fee: extractFeeCharged(result, '100'),
    createdAt: new Date().toISOString(),
  };
}
