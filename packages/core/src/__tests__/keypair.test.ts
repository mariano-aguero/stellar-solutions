import { describe, it, expect } from 'vitest';
import { isValidAddress, toStroops, fromStroops, publicFromSecret } from '../keypair.js';

describe('isValidAddress', () => {
  it('returns true for valid G... address', () => {
    expect(isValidAddress('GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL')).toBe(true);
  });
  it('returns false for invalid string', () => {
    expect(isValidAddress('not-an-address')).toBe(false);
  });
  it('returns false for empty string', () => {
    expect(isValidAddress('')).toBe(false);
  });
});

describe('toStroops / fromStroops', () => {
  it('converts 1 XLM to 10_000_000 stroops', () => {
    expect(toStroops('1')).toBe(10_000_000n);
  });
  it('converts back from stroops to lumens', () => {
    expect(fromStroops(10_000_000n)).toBe('1.0000000');
  });
  it('handles fractional amounts', () => {
    expect(toStroops('0.5')).toBe(5_000_000n);
  });
  it('handles integer and fractional parts together', () => {
    expect(toStroops('1.25')).toBe(12_500_000n);
  });
  it('round-trips: toStroops then fromStroops', () => {
    expect(fromStroops(toStroops('2.5'))).toBe('2.5000000');
  });
  it('throws for negative amount', () => {
    expect(() => toStroops('-1')).toThrow('invalid XLM amount');
  });
  it('throws for non-numeric string', () => {
    expect(() => toStroops('abc')).toThrow('invalid XLM amount');
  });
});

describe('publicFromSecret', () => {
  it('derives public key from a valid secret key', () => {
    const secret = 'SCN6I4YH2IR7SZ6RHYQMI2TCTS4VXG6MGS4APWXYEUH26VFMYPQMUT5A';
    const pub = publicFromSecret(secret);
    expect(pub).toMatch(/^G/);
    expect(pub).toHaveLength(56);
  });
});
