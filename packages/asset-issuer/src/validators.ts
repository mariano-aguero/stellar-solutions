import { InvalidAmountError, InvalidAssetCodeError, toStroops } from '@stellar-solutions/core';

/** Asset codes in Stellar classic credit assets are A-Z0-9, 1-12 chars (uppercase). */
export function validateAssetCode(code: string): void {
  if (!/^[A-Z0-9]{1,12}$/.test(code)) {
    throw new InvalidAssetCodeError(code);
  }
}

export function validateAmount(amount: string): void {
  let stroops: bigint;
  try {
    stroops = toStroops(amount);
  } catch {
    throw new InvalidAmountError(amount);
  }
  if (stroops <= 0n) throw new InvalidAmountError(amount);
}

/** Alias for total supply validation — same rules as any positive amount. */
export const validateTotalSupply = validateAmount;

export function extractFeeCharged(result: unknown, fallback: string): string {
  if (result != null && typeof result === 'object' && 'fee_charged' in result) {
    const fc = (result as { fee_charged: unknown }).fee_charged;
    if (typeof fc === 'string' && /^\d+$/.test(fc)) return fc;
    if (typeof fc === 'number' && Number.isFinite(fc)) return String(fc);
  }
  return fallback;
}
