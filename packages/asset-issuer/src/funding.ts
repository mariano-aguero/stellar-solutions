import { Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import type { StellarClient } from '@stellar-solutions/core';
import { FundingError } from '@stellar-solutions/core';

export interface FundingOptions {
  fundingSecretKey: string;
  startingBalance?: string;
}

export async function fundAccount(
  client: StellarClient,
  address: string,
  options: FundingOptions,
): Promise<void> {
  const { friendbotUrl } = client.networkConfig;

  if (friendbotUrl) {
    // Testnet: use Friendbot
    const response = await client.withTimeout(
      fetch(`${friendbotUrl}?addr=${encodeURIComponent(address)}`),
    );
    if (!response.ok) {
      const body = await response.text();
      throw new FundingError(`Friendbot failed (${response.status}): ${body}`, { status: response.status });
    }
    return;
  }

  // Mainnet: submit createAccount operation
  const fundingKeypair = Keypair.fromSecret(options.fundingSecretKey);
  const fundingAddress = fundingKeypair.publicKey();
  const fundingAccount = await client.withTimeout(
    client.horizon.loadAccount(fundingAddress),
  );

  const tx = new TransactionBuilder(fundingAccount, {
    fee: '100',
    networkPassphrase: client.networkConfig.networkPassphrase,
  })
    .addOperation(
      Operation.createAccount({
        destination: address,
        startingBalance: options.startingBalance ?? '1.5',
      }),
    )
    .setTimeout(180)
    .build();

  tx.sign(fundingKeypair);
  await client.withTimeout(client.horizon.submitTransaction(tx));
}
