import { describe, it, expect, vi } from 'vitest';
import type { StellarClient } from '@stellar-solutions/core';
import { estimateFee } from '../fees.js';

const mockClient = {
  horizon: {
    feeStats: vi.fn().mockResolvedValue({
      fee_charged: { p50: '200', p90: '500' },
      base_fee_in_stroops: '100',
    }),
  },
  withTimeout: (p: Promise<unknown>) => p,
} as unknown as StellarClient;

describe('estimateFee', () => {
  it('returns Math.max(ceil(p50 * 1.5), 100) as a string', async () => {
    const fee = await estimateFee(mockClient);
    expect(fee).toBe('300'); // ceil(200 * 1.5)
  });

  it('returns at least 100 when p50 is very low', async () => {
    const lowClient = {
      ...mockClient,
      horizon: {
        feeStats: vi.fn().mockResolvedValue({
          fee_charged: { p50: '10' },
          base_fee_in_stroops: '100',
        }),
      },
    } as unknown as StellarClient;
    const fee = await estimateFee(lowClient);
    expect(Number(fee)).toBeGreaterThanOrEqual(100);
  });

  it('uses 100 as fallback when p50 is missing', async () => {
    const noP50Client = {
      ...mockClient,
      horizon: {
        feeStats: vi.fn().mockResolvedValue({
          fee_charged: {},
          base_fee_in_stroops: '100',
        }),
      },
    } as unknown as StellarClient;
    const fee = await estimateFee(noP50Client);
    expect(fee).toBe('150'); // ceil(100 * 1.5)
  });
});
