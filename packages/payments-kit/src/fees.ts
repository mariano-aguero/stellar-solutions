import type { StellarClient } from '@stellar-solutions/core';

/** Returns the recommended fee in stroops (integer string). */
export async function estimateFee(client: StellarClient): Promise<string> {
  const stats = await client.withTimeout(client.horizon.feeStats());
  const p50 = Number.parseInt(stats.fee_charged.p50 ?? '100', 10);
  const base = Number.isNaN(p50) ? 100 : p50;
  return String(Math.max(Math.ceil(base * 1.5), 100));
}
