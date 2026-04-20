import {
  InvalidAddressError,
  InvalidAmountError,
  InvalidAssetCodeError,
  isValidAddress,
  toStroops,
} from '@stellar-solutions/core';
import type { Asset } from '@stellar-solutions/core';

export function validateAddress(address: string): void {
  if (!isValidAddress(address)) {
    throw new InvalidAddressError(address);
  }
}

export function validateAmount(amount: string): void {
  // toStroops enforces canonical Stellar format (no leading zeros, ≤7 decimals)
  // and returns a bigint, so we can compare positivity without float loss.
  let stroops: bigint;
  try {
    stroops = toStroops(amount);
  } catch {
    throw new InvalidAmountError(amount);
  }
  if (stroops <= 0n) {
    throw new InvalidAmountError(amount);
  }
}

export function validateAsset(asset: Asset): void {
  if (asset === 'native') return;
  if (!asset.issuer || !isValidAddress(asset.issuer)) {
    throw new InvalidAddressError(asset.issuer ?? '');
  }
  if (!asset.code || !/^[A-Z0-9]{1,12}$/.test(asset.code)) {
    throw new InvalidAssetCodeError(asset.code ?? '');
  }
}
