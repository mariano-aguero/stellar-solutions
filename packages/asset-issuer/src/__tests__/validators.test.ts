import { InvalidAssetCodeError } from '@stellar-solutions/core';
import { describe, expect, it } from 'vitest';
import { validateAssetCode, validateTotalSupply } from '../validators.js';

describe('validateAssetCode', () => {
  it('accepts valid 1-char code', () => {
    expect(() => validateAssetCode('X')).not.toThrow();
  });
  it('accepts valid 12-char code', () => {
    expect(() => validateAssetCode('ABCDEFGHIJKL')).not.toThrow();
  });
  it('accepts alphanumeric mixed case', () => {
    expect(() => validateAssetCode('USDC')).not.toThrow();
  });
  it('throws InvalidAssetCodeError for empty string', () => {
    expect(() => validateAssetCode('')).toThrow(InvalidAssetCodeError);
  });
  it('throws InvalidAssetCodeError for code > 12 chars', () => {
    expect(() => validateAssetCode('TOOLONGASSET1')).toThrow(InvalidAssetCodeError);
  });
  it('throws InvalidAssetCodeError for special chars', () => {
    expect(() => validateAssetCode('USD-C')).toThrow(InvalidAssetCodeError);
  });
});

describe('validateTotalSupply', () => {
  it('accepts positive amount string', () => {
    expect(() => validateTotalSupply('1000')).not.toThrow();
  });
  it('accepts fractional amount', () => {
    expect(() => validateTotalSupply('10.5000000')).not.toThrow();
  });
  it('throws for zero', () => {
    expect(() => validateTotalSupply('0')).toThrow();
  });
  it('throws for negative', () => {
    expect(() => validateTotalSupply('-1')).toThrow();
  });
  it('throws for more than 7 decimals', () => {
    expect(() => validateTotalSupply('1.12345678')).toThrow();
  });
  it('throws for leading zeros', () => {
    expect(() => validateTotalSupply('007.5')).toThrow();
  });
});
