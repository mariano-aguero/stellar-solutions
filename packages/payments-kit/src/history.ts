import type { StellarClient, HistoryEntry, Asset } from '@stellar-solutions/core';
import { isValidAddress, InvalidAddressError } from '@stellar-solutions/core';

export interface HistoryOptions {
  limit?: number;
  cursor?: string;
  order?: 'asc' | 'desc';
  /**
   * Source of records:
   * - `'transactions'` (default): raw transactions — memo + ledger only, no payment details.
   * - `'payments'`: payment/create_account operations with `amount`, `asset`, `from`, `to`.
   */
  source?: 'transactions' | 'payments';
}

function toAsset(op: {
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
}): Asset | undefined {
  if (!op.asset_type) return undefined;
  if (op.asset_type === 'native') return 'native';
  if (op.asset_code && op.asset_issuer) {
    return { code: op.asset_code, issuer: op.asset_issuer };
  }
  return undefined;
}

export async function getHistory(
  client: StellarClient,
  address: string,
  options: HistoryOptions = {},
): Promise<HistoryEntry[]> {
  if (!isValidAddress(address)) {
    throw new InvalidAddressError(address);
  }

  const { limit = 20, cursor, order = 'desc', source = 'transactions' } = options;

  if (source === 'payments') {
    let opBuilder = client.horizon.payments().forAccount(address).limit(limit).order(order);
    if (cursor !== undefined) {
      opBuilder = opBuilder.cursor(cursor);
    }
    const opResponse = await client.withTimeout(opBuilder.call());

    return opResponse.records
      .map((op) => {
        const record = op as unknown as Record<string, unknown>;
        const type = String(record['type'] ?? 'payment');
        if (type !== 'payment' && type !== 'create_account') return null;
        const asset = toAsset(record);
        const entry: HistoryEntry = {
          hash: String(record['transaction_hash'] ?? ''),
          type,
          createdAt: String(record['created_at'] ?? ''),
          // ledger is omitted — the /payments endpoint doesn't expose ledger sequence
          ...(typeof record['amount'] === 'string' ? { amount: record['amount'] } : {}),
          ...(typeof record['starting_balance'] === 'string' ? { amount: record['starting_balance'] } : {}),
          ...(asset !== undefined ? { asset } : {}),
          ...(typeof record['from'] === 'string' ? { from: record['from'] } : {}),
          ...(typeof record['source_account'] === 'string' && record['from'] === undefined
            ? { from: record['source_account'] as string }
            : {}),
          ...(typeof record['to'] === 'string' ? { to: record['to'] } : {}),
          ...(typeof record['account'] === 'string' && record['to'] === undefined
            ? { to: record['account'] as string }
            : {}),
        };
        return entry;
      })
      .filter((e): e is HistoryEntry => e !== null);
  }

  let builder = client.horizon.transactions().forAccount(address).limit(limit).order(order);
  if (cursor !== undefined) {
    builder = builder.cursor(cursor);
  }
  const response = await client.withTimeout(builder.call());

  return response.records.map((tx) => ({
    hash: tx.hash,
    type: 'transaction',
    ...(typeof tx.memo === 'string' ? { memo: tx.memo } : {}),
    createdAt: tx.created_at,
    ledger: tx.ledger_attr, // SDK exposes ledger seq as `ledger_attr` (not `ledger`) to avoid collision with the method name
  }));
}
