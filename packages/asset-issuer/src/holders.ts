import { Asset } from '@stellar/stellar-sdk';
import type { StellarClient } from '@stellar-solutions/core';

export interface Holder {
  address: string;
  balance: string;
}

export interface GetHoldersOptions {
  assetCode: string;
  issuerAddress: string;
  limit?: number;
}

export async function getHolders(
  client: StellarClient,
  options: GetHoldersOptions,
): Promise<Holder[]> {
  const limit = options.limit ?? 200;
  const asset = new Asset(options.assetCode, options.issuerAddress);
  const holders: Holder[] = [];

  let page = await client.withTimeout(
    client.horizon.accounts().forAsset(asset).limit(limit).call(),
  );

  while (page.records.length > 0) {
    for (const account of page.records) {
      const balanceEntry = account.balances.find(
        (b) =>
          b.asset_type !== 'native' &&
          'asset_code' in b &&
          b.asset_code === options.assetCode &&
          'asset_issuer' in b &&
          b.asset_issuer === options.issuerAddress,
      );

      if (balanceEntry && balanceEntry.balance !== '0.0000000') {
        holders.push({
          address: account.account_id,
          balance: balanceEntry.balance,
        });
      }
    }

    const lastRecord = page.records[page.records.length - 1];
    const pagingToken = lastRecord?.paging_token;
    // Guard against infinite loop: if the last record has no paging token,
    // we can't advance the cursor, so stop paginating.
    if (!pagingToken) break;

    page = await client.withTimeout(
      client.horizon.accounts().forAsset(asset).limit(limit).cursor(pagingToken).call(),
    );
  }

  return holders;
}
