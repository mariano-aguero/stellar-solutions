import { describe, it, expect } from 'vitest';
import {
  StellarKitError,
  InvalidAddressError,
  InsufficientFundsError,
  NetworkTimeoutError,
  NoTrustlineError,
  SequenceError,
  InvalidAssetCodeError,
  AssetAlreadyExistsError,
  IssuerLockedError,
  FreighterNotInstalledError,
  NetworkMismatchError,
  EmptyBatchError,
  BatchValidationError,
} from '../errors.js';

describe('StellarKitError', () => {
  it('is an instance of Error', () => {
    const err = new StellarKitError('test', 'TEST_CODE');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('test');
    expect(err.code).toBe('TEST_CODE');
    expect(err.name).toBe('StellarKitError');
  });
});

describe('typed error subclasses', () => {
  it('InvalidAddressError has correct code and is StellarKitError', () => {
    const err = new InvalidAddressError('GBAD');
    expect(err).toBeInstanceOf(StellarKitError);
    expect(err.code).toBe('INVALID_ADDRESS');
    expect(err.message).toContain('GBAD');
  });

  it('InsufficientFundsError includes available and required', () => {
    const err = new InsufficientFundsError({ available: '5', required: '10' });
    expect(err.code).toBe('INSUFFICIENT_FUNDS');
    expect(err.details).toEqual({ available: '5', required: '10' });
  });

  it('NetworkTimeoutError has correct code', () => {
    expect(new NetworkTimeoutError().code).toBe('NETWORK_TIMEOUT');
  });

  it('NoTrustlineError has correct code', () => {
    expect(new NoTrustlineError('GA...', 'USDC').code).toBe('NO_TRUSTLINE');
  });

  it('SequenceError has correct code', () => {
    expect(new SequenceError().code).toBe('SEQUENCE_ERROR');
  });

  it('InvalidAssetCodeError has correct code', () => {
    expect(new InvalidAssetCodeError('TOOLONG123456').code).toBe('INVALID_ASSET_CODE');
  });

  it('EmptyBatchError has correct code', () => {
    expect(new EmptyBatchError().code).toBe('EMPTY_BATCH');
  });

  it('BatchValidationError includes invalid indices', () => {
    const err = new BatchValidationError([0, 5]);
    expect(err.code).toBe('BATCH_VALIDATION_ERROR');
    expect(err.invalidIndices).toEqual([0, 5]);
  });
});
