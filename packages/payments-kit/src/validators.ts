import { isValidAddress, InvalidAddressError, InvalidAmountError, InvalidAssetCodeError } from '@stellar-solutions/core';
import type { Asset } from '@stellar-solutions/core';

export function validateAddress(address: string): void {
  if (!isValidAddress(address)) {
    throw new InvalidAddressError(address);
  }
}

export function validateAmount(amount: string): void {
  const n = Number(amount);
  if (isNaN(n) || n <= 0) {
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
