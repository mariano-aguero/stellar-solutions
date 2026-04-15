import type { StellarClient, Asset } from '@stellar-solutions/core';

export async function getBalance(
  client: StellarClient,
  address: string,
  asset?: Asset,
): Promise<string> {
  const account = await client.withTimeout(client.horizon.loadAccount(address));

  if (!asset || asset === 'native') {
    const native = account.balances.find((b) => b.asset_type === 'native');
    return native?.balance ?? '0';
  }

  const found = account.balances.find(
    (b) =>
      b.asset_type !== 'native' &&
      'asset_code' in b &&
      b.asset_code === asset.code &&
      b.asset_issuer === asset.issuer,
  );
  return found?.balance ?? '0';
}
