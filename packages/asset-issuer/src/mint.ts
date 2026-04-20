import { Asset, Keypair, Operation, StrKey, TransactionBuilder } from '@stellar/stellar-sdk';
import type { StellarClient, TxResult } from '@stellar-solutions/core';
import { IssuerLockedError, InvalidAddressError, InvalidSecretKeyError, isValidAddress } from '@stellar-solutions/core';
import { extractFeeCharged, validateAmount, validateAssetCode } from './validators.js';

export interface MintOptions {
  /** SECRET key of the issuer account. Never log or persist. */
  issuerSecretKey: string;
  assetCode: string;
  destination: string;
  amount: string;
}

export async function mintTo(client: StellarClient, options: MintOptions): Promise<TxResult> {
  if (!StrKey.isValidEd25519SecretSeed(options.issuerSecretKey)) throw new InvalidSecretKeyError();
  if (!isValidAddress(options.destination)) throw new InvalidAddressError(options.destination);
  validateAmount(options.amount);
  validateAssetCode(options.assetCode);

  const keypair = Keypair.fromSecret(options.issuerSecretKey);
  const issuerAddress = keypair.publicKey();

  const account = await client.withTimeout(client.horizon.loadAccount(issuerAddress));

  // Check if issuer is locked (master weight = 0)
  const masterSigner = account.signers.find((s) => s.key === issuerAddress);
  if (masterSigner?.weight === 0) {
    throw new IssuerLockedError();
  }

  const asset = new Asset(options.assetCode, issuerAddress);
  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: client.networkConfig.networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: options.destination,
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
