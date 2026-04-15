import { describe, it, expect, vi } from 'vitest';
import type { StellarClient } from '@stellar-solutions/core';
import { getBalance } from '../balance.js';

const mockAccount = {
  balances: [
    { asset_type: 'native', balance: '99.9999700' },
    { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GISSUER', balance: '50.0000000' },
  ],
};

const mockClient = {
  horizon: { loadAccount: vi.fn().mockResolvedValue(mockAccount) },
  withTimeout: (p: Promise<unknown>) => p,
} as unknown as StellarClient;

describe('getBalance', () => {
  it('returns native XLM balance when no asset specified', async () => {
    const balance = await getBalance(mockClient, 'GABC');
    expect(balance).toBe('99.9999700');
  });

  it('returns specific asset balance', async () => {
    const balance = await getBalance(mockClient, 'GABC', { code: 'USDC', issuer: 'GISSUER' });
    expect(balance).toBe('50.0000000');
  });

  it('returns "0" when no trustline exists', async () => {
    const balance = await getBalance(mockClient, 'GABC', { code: 'NOPE', issuer: 'GISSUER' });
    expect(balance).toBe('0');
  });

  it('returns "0" when account has no native balance', async () => {
    const noNativeClient = {
      ...mockClient,
      horizon: {
        loadAccount: vi.fn().mockResolvedValue({ balances: [] }),
      },
    } as unknown as StellarClient;
    const balance = await getBalance(noNativeClient, 'GABC');
    expect(balance).toBe('0');
  });
});
