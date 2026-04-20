import { describe, expect, it } from 'vitest';
import {
  fromStroops,
  isValidAddress,
  isValidAmount,
  publicFromSecret,
  toStroops,
} from '../keypair.js';

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
  it('throws InvalidAmountError for negative amount', () => {
    expect(() => toStroops('-1')).toThrow('Invalid amount');
  });
  it('throws InvalidAmountError for non-numeric string', () => {
    expect(() => toStroops('abc')).toThrow('Invalid amount');
  });
  it('throws InvalidAmountError for negative fromStroops', () => {
    expect(() => fromStroops(-1n)).toThrow('Invalid amount');
  });

  // Edge cases added after hardening — these are the specific regressions that the
  // tightened canonical regex was meant to prevent.
  it('accepts the minimum non-zero amount (1 stroop)', () => {
    expect(toStroops('0.0000001')).toBe(1n);
  });
  it('rejects amounts with more than 7 decimal places (no silent truncation)', () => {
    expect(() => toStroops('1.12345678')).toThrow('Invalid amount');
    expect(() => toStroops('10.00000001')).toThrow('Invalid amount');
  });
  it('rejects leading zeros', () => {
    expect(() => toStroops('007.5')).toThrow('Invalid amount');
    expect(() => toStroops('01')).toThrow('Invalid amount');
  });
  it('accepts "0" exactly (but produces 0n)', () => {
    expect(toStroops('0')).toBe(0n);
    expect(toStroops('0.0')).toBe(0n);
  });
  it('rejects empty strings and whitespace', () => {
    expect(() => toStroops('')).toThrow('Invalid amount');
    expect(() => toStroops(' 1')).toThrow('Invalid amount');
    expect(() => toStroops('1 ')).toThrow('Invalid amount');
  });
  it('handles very large integer amounts without precision loss', () => {
    // ~900 million XLM — well above anything float64 could represent safely.
    expect(toStroops('900000000')).toBe(9_000_000_000_000_000n);
  });
});

describe('isValidAmount', () => {
  it.each([
    ['1', true],
    ['0', true],
    ['0.0000001', true],
    ['10.5000000', true],
    ['007.5', false],
    ['01', false],
    ['1.12345678', false],
    ['-1', false],
    ['abc', false],
    ['', false],
    [' 1', false],
  ])('isValidAmount(%j) === %j', (input, expected) => {
    expect(isValidAmount(input)).toBe(expected);
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
