import type { StellarClient } from '@stellar-solutions/core';
import { InvalidAddressError } from '@stellar-solutions/core';
import { describe, expect, it, vi } from 'vitest';
import { getHistory } from '../history.js';

const mockTx = {
  hash: 'txhash1',
  ledger_attr: 12345,
  created_at: '2026-01-01T00:00:00Z',
  memo: 'test memo',
};

const mockClient = {
  horizon: {
    transactions: vi.fn().mockReturnValue({
      forAccount: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      call: vi.fn().mockResolvedValue({ records: [mockTx] }),
    }),
  },
  withTimeout: (p: Promise<unknown>) => p,
} as unknown as StellarClient;

describe('getHistory', () => {
  it('throws InvalidAddressError for invalid address', async () => {
    await expect(getHistory(mockClient, 'BADINVALID')).rejects.toThrow(InvalidAddressError);
  });

  it('returns an array of HistoryEntry', async () => {
    const result = await getHistory(
      mockClient,
      'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL',
      { limit: 10 },
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.hash).toBe('txhash1');
    expect(result[0]?.ledger).toBe(12345);
    expect(result[0]?.createdAt).toBe('2026-01-01T00:00:00Z');
    expect(result[0]?.memo).toBe('test memo');
  });

  it('forwards cursor to builder when provided', async () => {
    const cursorMock = vi.fn().mockReturnThis();
    const chainMock = {
      forAccount: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      cursor: cursorMock,
      call: vi.fn().mockResolvedValue({ records: [] }),
    };
    const client = {
      horizon: { transactions: vi.fn().mockReturnValue(chainMock) },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient;

    await getHistory(client, 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL', {
      cursor: 'tok-123',
    });
    expect(cursorMock).toHaveBeenCalledWith('tok-123');
  });

  it('does not call cursor when not provided', async () => {
    const cursorMock = vi.fn().mockReturnThis();
    const chainMock = {
      forAccount: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      cursor: cursorMock,
      call: vi.fn().mockResolvedValue({ records: [] }),
    };
    const client = {
      horizon: { transactions: vi.fn().mockReturnValue(chainMock) },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient;

    await getHistory(client, 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL');
    expect(cursorMock).not.toHaveBeenCalled();
  });

  it('defaults to limit 20 and desc order', async () => {
    const chainMock = {
      forAccount: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      call: vi.fn().mockResolvedValue({ records: [] }),
    };
    const client = {
      horizon: { transactions: vi.fn().mockReturnValue(chainMock) },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient;

    await getHistory(client, 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL');
    expect(chainMock.limit).toHaveBeenCalledWith(20);
    expect(chainMock.order).toHaveBeenCalledWith('desc');
  });
});
