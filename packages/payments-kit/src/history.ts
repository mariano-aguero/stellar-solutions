import type { StellarClient, HistoryEntry } from '@stellar-solutions/core';

export interface HistoryOptions {
  limit?: number;
  cursor?: string;
  order?: 'asc' | 'desc';
}

export async function getHistory(
  client: StellarClient,
  address: string,
  options: HistoryOptions = {},
): Promise<HistoryEntry[]> {
  const { limit = 20, order = 'desc' } = options;

  const response = await client.withTimeout(
    client.horizon
      .transactions()
      .forAccount(address)
      .limit(limit)
      .order(order as 'asc' | 'desc')
      .call(),
  );

  return response.records.map((tx) => ({
    hash: tx.hash,
    type: 'transaction',
    ...(typeof tx.memo === 'string' ? { memo: tx.memo } : {}),
    createdAt: tx.created_at,
    ledger: tx.ledger_attr,
  }));
}
