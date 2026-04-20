import {
  InvalidAddressError,
  InvalidAmountError,
  InvalidAssetCodeError,
} from '@stellar-solutions/core';
import { describe, expect, it } from 'vitest';
import { validateAddress, validateAmount, validateAsset } from '../validators.js';

describe('validateAddress', () => {
  it('does not throw for valid address', () => {
    expect(() =>
      validateAddress('GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL'),
    ).not.toThrow();
  });
  it('throws InvalidAddressError for invalid address', () => {
    expect(() => validateAddress('bad')).toThrow(InvalidAddressError);
  });
});

describe('validateAmount', () => {
  it('does not throw for valid positive string', () => {
    expect(() => validateAmount('10.5')).not.toThrow();
  });
  it('throws for zero', () => {
    expect(() => validateAmount('0')).toThrow(InvalidAmountError);
  });
  it('throws for negative', () => {
    expect(() => validateAmount('-5')).toThrow(InvalidAmountError);
  });
  it('throws for non-numeric string', () => {
    expect(() => validateAmount('abc')).toThrow(InvalidAmountError);
  });
});

describe('validateAsset', () => {
  it('does not throw for native', () => {
    expect(() => validateAsset('native')).not.toThrow();
  });
  it('does not throw for issued asset', () => {
    expect(() =>
      validateAsset({
        code: 'USDC',
        issuer: 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL',
      }),
    ).not.toThrow();
  });
  it('throws for issued asset with missing issuer', () => {
    expect(() => validateAsset({ code: 'USDC', issuer: '' })).toThrow();
  });
  it('throws InvalidAssetCodeError for code that is too long', () => {
    expect(() =>
      validateAsset({
        code: 'TOOLONGCODE123',
        issuer: 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL',
      }),
    ).toThrow(InvalidAssetCodeError);
  });
});
