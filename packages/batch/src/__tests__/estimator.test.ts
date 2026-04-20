import { describe, expect, it } from 'vitest';
import { estimate } from '../estimator.js';

const payment = {
  to: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
  amount: '1.0',
  asset: 'native' as const,
};

describe('estimate', () => {
  it('single payment → txCount: 1', () => {
    const result = estimate([payment]);
    expect(result.txCount).toBe(1);
  });

  it('100 payments → txCount: 1', () => {
    const payments = Array.from({ length: 100 }, () => payment);
    expect(estimate(payments).txCount).toBe(1);
  });

  it('101 payments → txCount: 2', () => {
    const payments = Array.from({ length: 101 }, () => payment);
    expect(estimate(payments).txCount).toBe(2);
  });

  it('250 payments → txCount: 3', () => {
    const payments = Array.from({ length: 250 }, () => payment);
    const result = estimate(payments);
    expect(result.txCount).toBe(3);
  });

  it('returns estimatedFeeXLM as a decimal string', () => {
    const result = estimate([payment]);
    expect(typeof result.estimatedFeeXLM).toBe('string');
    expect(Number.parseFloat(result.estimatedFeeXLM)).toBeGreaterThan(0);
  });

  it('returns estimatedTimeMs as a positive number', () => {
    const result = estimate([payment]);
    expect(result.estimatedTimeMs).toBeGreaterThan(0);
  });

  it('250 payments → estimatedTimeMs = 3 * 5000 = 15000', () => {
    const payments = Array.from({ length: 250 }, () => payment);
    expect(estimate(payments).estimatedTimeMs).toBe(15_000);
  });
});
