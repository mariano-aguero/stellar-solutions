import type { StellarClient } from '@stellar-solutions/core';

export async function estimateFee(client: StellarClient): Promise<number> {
  const stats = await client.withTimeout(client.horizon.feeStats());
  const p50 = parseInt(stats.fee_charged.p50 ?? '100', 10);
  const base = isNaN(p50) ? 100 : p50;
  return Math.max(Math.ceil(base * 1.5), 100);
}
