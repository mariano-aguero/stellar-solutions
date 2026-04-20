import { Keypair, StrKey } from '@stellar/stellar-sdk';
import { InvalidAmountError } from './errors.js';

export function isValidAddress(address: string): boolean {
  try {
    return StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
}

export function publicFromSecret(secretKey: string): string {
  return Keypair.fromSecret(secretKey).publicKey();
}

const STROOPS_PER_XLM = 10_000_000n;

// Canonical Stellar amount: no leading zeros, at most 7 decimals (stroop precision).
// Rejecting >7 decimals prevents silent money loss via truncation.
const AMOUNT_REGEX = /^(0|[1-9]\d*)(\.\d{1,7})?$/;

export function isValidAmount(xlm: string): boolean {
  return AMOUNT_REGEX.test(xlm);
}

export function toStroops(xlm: string): bigint {
  if (!AMOUNT_REGEX.test(xlm)) {
    throw new InvalidAmountError(xlm);
  }
  const [whole = '0', fraction = ''] = xlm.split('.');
  const paddedFraction = fraction.padEnd(7, '0');
  return BigInt(whole) * STROOPS_PER_XLM + BigInt(paddedFraction);
}

export function fromStroops(stroops: bigint): string {
  if (stroops < 0n) {
    throw new InvalidAmountError(String(stroops));
  }
  const whole = stroops / STROOPS_PER_XLM;
  const remainder = stroops % STROOPS_PER_XLM;
  return `${whole}.${String(remainder).padStart(7, '0')}`;
}
