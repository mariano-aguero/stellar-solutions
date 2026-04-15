import { describe, it, expect } from 'vitest';
import { validateAddress, validateAmount, validateAsset } from '../validators.js';
import { InvalidAddressError } from '@stellar-solutions/core';

describe('validateAddress', () => {
  it('does not throw for valid address', () => {
    expect(() => validateAddress('GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL')).not.toThrow();
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
    expect(() => validateAmount('0')).toThrow();
  });
  it('throws for negative', () => {
    expect(() => validateAmount('-5')).toThrow();
  });
  it('throws for non-numeric string', () => {
    expect(() => validateAmount('abc')).toThrow();
  });
});

describe('validateAsset', () => {
  it('does not throw for native', () => {
    expect(() => validateAsset('native')).not.toThrow();
  });
  it('does not throw for issued asset', () => {
    expect(() => validateAsset({ code: 'USDC', issuer: 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL' })).not.toThrow();
  });
  it('throws for issued asset with missing issuer', () => {
    expect(() => validateAsset({ code: 'USDC', issuer: '' })).toThrow();
  });
});
