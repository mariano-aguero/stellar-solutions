import { describe, expect, it } from 'vitest';
import { createClient } from '../client.js';

describe('createClient', () => {
  it('returns a client with horizon and rpc properties', () => {
    const client = createClient('testnet');
    expect(client.horizon).toBeDefined();
    expect(client.rpc).toBeDefined();
    expect(client.networkConfig.horizonUrl).toBe('https://horizon-testnet.stellar.org');
  });

  it('respects custom horizonUrl', () => {
    const client = createClient('testnet', { horizonUrl: 'https://custom.test' });
    expect(client.networkConfig.horizonUrl).toBe('https://custom.test');
  });

  it('withTimeout resolves when promise resolves in time', async () => {
    const client = createClient('testnet');
    const result = await client.withTimeout(Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('withTimeout rejects with NetworkTimeoutError on timeout', async () => {
    const client = createClient('testnet', { timeout: 50 });
    const neverResolves = new Promise<never>(() => {});
    await expect(client.withTimeout(neverResolves)).rejects.toThrow('timed out after 50ms');
  });

  it('withTimeout rejects with NetworkTimeoutError instance on timeout', async () => {
    const { NetworkTimeoutError } = await import('../errors.js');
    const client = createClient('testnet', { timeout: 50 });
    const neverResolves = new Promise<never>(() => {});
    await expect(client.withTimeout(neverResolves)).rejects.toBeInstanceOf(NetworkTimeoutError);
  });
});
