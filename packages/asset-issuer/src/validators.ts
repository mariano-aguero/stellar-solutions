import { InvalidAssetCodeError } from '@stellar-solutions/core';

export function validateAssetCode(code: string): void {
  if (!/^[A-Za-z0-9]{1,12}$/.test(code)) {
    throw new InvalidAssetCodeError(code);
  }
}

export function validateTotalSupply(supply: number): void {
  if (supply <= 0) {
    throw new Error(`totalSupply must be > 0, got ${supply}`);
  }
}
