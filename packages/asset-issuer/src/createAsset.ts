import { Asset, Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import type { StellarClient } from '@stellar-solutions/core';
import { fundAccount } from './funding.js';
import { validateAssetCode, validateTotalSupply } from './validators.js';

export interface CreateAssetOptions {
  code: string;
  totalSupply: number;
  fundingSecretKey: string;
  lock?: boolean;
  startingBalance?: string;
}

export interface AssetResult {
  assetCode: string;
  issuerAddress: string;
  issuerSecretKey: string;
  distributorAddress: string;
  distributorSecretKey: string;
  explorerUrl: string;
  txHashes: string[];
}

export async function createAsset(
  client: StellarClient,
  options: CreateAssetOptions,
): Promise<AssetResult> {
  validateAssetCode(options.code);
  validateTotalSupply(options.totalSupply);

  const issuerKeypair = Keypair.random();
  const distributorKeypair = Keypair.random();
  const network = client.networkConfig.networkPassphrase.includes('Test') ? 'testnet' : 'mainnet';
  const txHashes: string[] = [];

  // Fund both accounts
  const fundingOptions = options.startingBalance !== undefined
    ? { fundingSecretKey: options.fundingSecretKey, startingBalance: options.startingBalance }
    : { fundingSecretKey: options.fundingSecretKey };
  await fundAccount(client, issuerKeypair.publicKey(), fundingOptions);
  await fundAccount(client, distributorKeypair.publicKey(), fundingOptions);

  const asset = new Asset(options.code, issuerKeypair.publicKey());

  // Trustline: distributor trusts issuer asset
  const distributorAccount = await client.withTimeout(
    client.horizon.loadAccount(distributorKeypair.publicKey()),
  );
  const trustlineTx = new TransactionBuilder(distributorAccount, {
    fee: '100',
    networkPassphrase: client.networkConfig.networkPassphrase,
  })
    .addOperation(Operation.changeTrust({ asset }))
    .setTimeout(180)
    .build();
  trustlineTx.sign(distributorKeypair);
  const trustlineResult = await client.withTimeout(
    client.horizon.submitTransaction(trustlineTx),
  );
  txHashes.push(trustlineResult.hash);

  // Mint: issuer sends totalSupply to distributor
  const issuerAccount = await client.withTimeout(
    client.horizon.loadAccount(issuerKeypair.publicKey()),
  );
  const mintTx = new TransactionBuilder(issuerAccount, {
    fee: '100',
    networkPassphrase: client.networkConfig.networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: distributorKeypair.publicKey(),
        asset,
        amount: String(options.totalSupply),
      }),
    )
    .setTimeout(180)
    .build();
  mintTx.sign(issuerKeypair);
  const mintResult = await client.withTimeout(
    client.horizon.submitTransaction(mintTx),
  );
  txHashes.push(mintResult.hash);

  // Lock issuer if requested
  if (options.lock) {
    const lockAccount = await client.withTimeout(
      client.horizon.loadAccount(issuerKeypair.publicKey()),
    );
    const lockTx = new TransactionBuilder(lockAccount, {
      fee: '100',
      networkPassphrase: client.networkConfig.networkPassphrase,
    })
      .addOperation(Operation.setOptions({ masterWeight: 0 }))
      .setTimeout(180)
      .build();
    lockTx.sign(issuerKeypair);
    const lockResult = await client.withTimeout(
      client.horizon.submitTransaction(lockTx),
    );
    txHashes.push(lockResult.hash);
  }

  return {
    assetCode: options.code,
    issuerAddress: issuerKeypair.publicKey(),
    issuerSecretKey: issuerKeypair.secret(),
    distributorAddress: distributorKeypair.publicKey(),
    distributorSecretKey: distributorKeypair.secret(),
    explorerUrl: `https://stellar.expert/explorer/${network}/asset/${options.code}-${issuerKeypair.publicKey()}`,
    txHashes,
  };
}
