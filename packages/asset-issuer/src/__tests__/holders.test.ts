import type { StellarClient } from '@stellar-solutions/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getHolders } from '../holders.js';

// Valid Stellar public keys (56 chars, base32 starting with G)
const ISSUER = 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL';
const ASSET_CODE = 'USDC';

const mockAccounts = {
  forAsset: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  cursor: vi.fn().mockReturnThis(),
  call: vi.fn(),
};

const mockClient = {
  horizon: { accounts: vi.fn().mockReturnValue(mockAccounts) },
  networkConfig: { networkPassphrase: 'Test SDF Network ; September 2015' },
  withTimeout: vi.fn((p: Promise<unknown>) => p),
} as unknown as StellarClient;

beforeEach(() => {
  vi.clearAllMocks();
  (
    mockClient.horizon as unknown as { accounts: ReturnType<typeof vi.fn> }
  ).accounts.mockReturnValue(mockAccounts);
  mockAccounts.forAsset.mockReturnThis();
  mockAccounts.limit.mockReturnThis();
  mockAccounts.cursor.mockReturnThis();
});

describe('getHolders', () => {
  it('returns holders with non-zero balances from a single page', async () => {
    mockAccounts.call
      .mockResolvedValueOnce({
        records: [
          {
            account_id: 'GABC000000000000000000000000000000000000000000000000000001',
            paging_token: 'token1',
            balances: [
              {
                asset_type: 'credit_alphanum4',
                asset_code: ASSET_CODE,
                asset_issuer: ISSUER,
                balance: '100.0000000',
              },
            ],
          },
          {
            account_id: 'GDEF000000000000000000000000000000000000000000000000000002',
            paging_token: 'token2',
            balances: [
              {
                asset_type: 'credit_alphanum4',
                asset_code: ASSET_CODE,
                asset_issuer: ISSUER,
                balance: '250.5000000',
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ records: [] });

    const holders = await getHolders(mockClient, {
      assetCode: ASSET_CODE,
      issuerAddress: ISSUER,
    });

    expect(holders).toHaveLength(2);
    expect(holders[0]).toEqual({
      address: 'GABC000000000000000000000000000000000000000000000000000001',
      balance: '100.0000000',
    });
    expect(holders[1]).toEqual({
      address: 'GDEF000000000000000000000000000000000000000000000000000002',
      balance: '250.5000000',
    });
  });

  it('filters out accounts with zero balance', async () => {
    mockAccounts.call
      .mockResolvedValueOnce({
        records: [
          {
            account_id: 'GABC000000000000000000000000000000000000000000000000000001',
            paging_token: 'token1',
            balances: [
              {
                asset_type: 'credit_alphanum4',
                asset_code: ASSET_CODE,
                asset_issuer: ISSUER,
                balance: '100.0000000',
              },
            ],
          },
          {
            account_id: 'GDEF000000000000000000000000000000000000000000000000000002',
            paging_token: 'token2',
            balances: [
              {
                asset_type: 'credit_alphanum4',
                asset_code: ASSET_CODE,
                asset_issuer: ISSUER,
                balance: '0.0000000',
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ records: [] });

    const holders = await getHolders(mockClient, {
      assetCode: ASSET_CODE,
      issuerAddress: ISSUER,
    });

    expect(holders).toHaveLength(1);
    expect(holders[0]!.address).toBe('GABC000000000000000000000000000000000000000000000000000001');
  });

  it('paginates through multiple pages', async () => {
    mockAccounts.call
      .mockResolvedValueOnce({
        records: [
          {
            account_id: 'GABC000000000000000000000000000000000000000000000000000001',
            paging_token: 'token1',
            balances: [
              {
                asset_type: 'credit_alphanum4',
                asset_code: ASSET_CODE,
                asset_issuer: ISSUER,
                balance: '100.0000000',
              },
            ],
          },
          {
            account_id: 'GDEF000000000000000000000000000000000000000000000000000002',
            paging_token: 'token2',
            balances: [
              {
                asset_type: 'credit_alphanum4',
                asset_code: ASSET_CODE,
                asset_issuer: ISSUER,
                balance: '0.0000000',
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ records: [] });

    const holders = await getHolders(mockClient, {
      assetCode: ASSET_CODE,
      issuerAddress: ISSUER,
    });

    // call was made twice: first page + empty page to stop
    expect(mockAccounts.call).toHaveBeenCalledTimes(2);
    // cursor was set with the last paging_token from first page
    expect(mockAccounts.cursor).toHaveBeenCalledWith('token2');
    // only non-zero balance returned
    expect(holders).toHaveLength(1);
  });

  it('returns empty array when no holders exist', async () => {
    mockAccounts.call.mockResolvedValueOnce({ records: [] });

    const holders = await getHolders(mockClient, {
      assetCode: ASSET_CODE,
      issuerAddress: ISSUER,
    });

    expect(holders).toEqual([]);
    expect(mockAccounts.call).toHaveBeenCalledTimes(1);
  });
});
