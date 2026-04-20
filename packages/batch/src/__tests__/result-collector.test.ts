import { describe, expect, it } from 'vitest';
import { ResultCollector } from '../result-collector.js';

const payment = {
  to: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
  amount: '1.0',
  asset: 'native' as const,
};

describe('ResultCollector', () => {
  it('starts empty', () => {
    const collector = new ResultCollector();
    const result = collector.toBatchResult();
    expect(result.successful).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.txHashes).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('records successful chunk', () => {
    const collector = new ResultCollector();
    collector.recordSuccess('abc123', 5);
    const result = collector.toBatchResult();
    expect(result.successful).toBe(5);
    expect(result.failed).toBe(0);
    expect(result.txHashes).toEqual(['abc123']);
  });

  it('records multiple successes', () => {
    const collector = new ResultCollector();
    collector.recordSuccess('hash1', 100);
    collector.recordSuccess('hash2', 50);
    const result = collector.toBatchResult();
    expect(result.successful).toBe(150);
    expect(result.txHashes).toEqual(['hash1', 'hash2']);
  });

  it('records failure with index offset', () => {
    const collector = new ResultCollector();
    const chunk = [payment, payment, payment];
    collector.recordFailure(chunk, 100, 'Network timeout', 'TIMEOUT');
    const result = collector.toBatchResult();
    expect(result.failed).toBe(3);
    expect(result.successful).toBe(0);
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0]?.index).toBe(100);
    expect(result.errors[1]?.index).toBe(101);
    expect(result.errors[2]?.index).toBe(102);
    expect(result.errors[0]?.reason).toBe('Network timeout');
    expect(result.errors[0]?.code).toBe('TIMEOUT');
  });

  it('accumulates both successes and failures', () => {
    const collector = new ResultCollector();
    collector.recordSuccess('hash1', 100);
    collector.recordFailure([payment], 100, 'error');
    const result = collector.toBatchResult();
    expect(result.successful).toBe(100);
    expect(result.failed).toBe(1);
  });
});
