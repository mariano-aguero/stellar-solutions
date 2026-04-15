import { Keypair, StrKey } from '@stellar/stellar-sdk';

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

export function toStroops(xlm: string): bigint {
  if (!/^\d+(\.\d+)?$/.test(xlm)) {
    throw new Error(`toStroops: invalid XLM amount "${xlm}" — must be a non-negative number`);
  }
  const [whole = '0', fraction = ''] = xlm.split('.');
  const paddedFraction = fraction.padEnd(7, '0').slice(0, 7);
  return BigInt(whole) * STROOPS_PER_XLM + BigInt(paddedFraction);
}

export function fromStroops(stroops: bigint): string {
  const whole = stroops / STROOPS_PER_XLM;
  const remainder = stroops % STROOPS_PER_XLM;
  return `${whole}.${String(remainder).padStart(7, '0')}`;
}
