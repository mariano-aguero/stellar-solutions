import { BatchValidationError, EmptyBatchError } from '@stellar-solutions/core';
import { describe, expect, it } from 'vitest';
import { validateAndChunk } from '../queue.js';

const validPayment = {
  to: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
  amount: '1.0',
  asset: 'native' as const,
};

describe('validateAndChunk', () => {
  it('throws EmptyBatchError for empty array', () => {
    expect(() => validateAndChunk([])).toThrow(EmptyBatchError);
  });

  it('throws BatchValidationError with invalidIndices for bad address', () => {
    const payments = [validPayment, validPayment, { ...validPayment, to: 'INVALID' }, validPayment];
    expect(() => validateAndChunk(payments)).toThrow(BatchValidationError);
    try {
      validateAndChunk(payments);
    } catch (e) {
      expect(e).toBeInstanceOf(BatchValidationError);
      expect((e as BatchValidationError).invalidIndices).toEqual([2]);
    }
  });

  it('throws BatchValidationError with invalidIndices for bad amount', () => {
    const payments = [validPayment, { ...validPayment, amount: '-1' }, validPayment];
    expect(() => validateAndChunk(payments)).toThrow(BatchValidationError);
    try {
      validateAndChunk(payments);
    } catch (e) {
      expect((e as BatchValidationError).invalidIndices).toEqual([1]);
    }
  });

  it('throws BatchValidationError collecting all invalid indices', () => {
    const payments = [
      { ...validPayment, to: 'BAD' },
      validPayment,
      { ...validPayment, amount: '0' },
    ];
    try {
      validateAndChunk(payments);
    } catch (e) {
      expect((e as BatchValidationError).invalidIndices).toContain(0);
      expect((e as BatchValidationError).invalidIndices).toContain(2);
    }
  });

  it('returns single chunk for ≤100 payments', () => {
    const payments = Array.from({ length: 50 }, () => validPayment);
    const chunks = validateAndChunk(payments);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toHaveLength(50);
  });

  it('splits 250 payments into 3 chunks [100, 100, 50]', () => {
    const payments = Array.from({ length: 250 }, () => validPayment);
    const chunks = validateAndChunk(payments);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(100);
    expect(chunks[1]).toHaveLength(100);
    expect(chunks[2]).toHaveLength(50);
  });
});
