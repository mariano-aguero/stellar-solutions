import { Asset, Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import type { StellarClient, TxResult } from '@stellar-solutions/core';

export interface BurnOptions {
  distributorSecretKey: string;
  issuerAddress: string;
  assetCode: string;
  amount: string;
}

export async function burn(client: StellarClient, options: BurnOptions): Promise<TxResult> {
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
    fee: 100,
    createdAt: new Date().toISOString(),
  };
}
