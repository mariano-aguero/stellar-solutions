import { isValidAddress, InvalidAddressError } from '@stellar-solutions/core';
import type { Asset } from '@stellar-solutions/core';

export function validateAddress(address: string): void {
  if (!isValidAddress(address)) {
    throw new InvalidAddressError(address);
  }
}

export function validateAmount(amount: string): void {
  const n = Number(amount);
  if (isNaN(n) || n <= 0) {
    throw new Error(`Invalid amount: "${amount}" — must be a positive number`);
  }
}

export function validateAsset(asset: Asset): void {
  if (asset === 'native') return;
  if (!asset.issuer || !isValidAddress(asset.issuer)) {
    throw new InvalidAddressError(asset.issuer ?? '');
  }
  if (!asset.code || asset.code.length === 0) {
    throw new Error('Asset code cannot be empty');
  }
}
