import { Asset, Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import type { StellarClient, TxResult } from '@stellar-solutions/core';
import { IssuerLockedError } from '@stellar-solutions/core';

export interface MintOptions {
  issuerSecretKey: string;
  assetCode: string;
  destination: string;
  amount: string;
}

export async function mintTo(client: StellarClient, options: MintOptions): Promise<TxResult> {
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
    fee: 100,
    createdAt: new Date().toISOString(),
  };
}
