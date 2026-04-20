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

describe('getHistory — source: "payments"', () => {
  function makePaymentsClient(records: unknown[]) {
    const chainMock = {
      forAccount: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      cursor: vi.fn().mockReturnThis(),
      call: vi.fn().mockResolvedValue({ records }),
    };
    return {
      client: {
        horizon: { payments: vi.fn().mockReturnValue(chainMock) },
        withTimeout: (p: Promise<unknown>) => p,
      } as unknown as StellarClient,
      chainMock,
    };
  }

  const VALID_ADDR = 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL';

  it('hits the /payments endpoint (not /transactions)', async () => {
    const { client, chainMock } = makePaymentsClient([]);
    await getHistory(client, VALID_ADDR, { source: 'payments' });
    expect((client.horizon as any).payments).toHaveBeenCalled();
    expect(chainMock.forAccount).toHaveBeenCalledWith(VALID_ADDR);
  });

  it('maps a native payment op with inline amount/asset/from/to', async () => {
    const { client } = makePaymentsClient([
      {
        type: 'payment',
        transaction_hash: 'txhash-pay',
        created_at: '2026-01-01T00:00:00Z',
        from: 'GA_SOURCE',
        to: 'GB_DEST',
        amount: '25.5000000',
        asset_type: 'native',
      },
    ]);

    const result = await getHistory(client, VALID_ADDR, { source: 'payments' });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      hash: 'txhash-pay',
      type: 'payment',
      createdAt: '2026-01-01T00:00:00Z',
      amount: '25.5000000',
      asset: 'native',
      from: 'GA_SOURCE',
      to: 'GB_DEST',
    });
    // ledger is intentionally omitted on the /payments path
    expect(result[0]?.ledger).toBeUndefined();
  });

  it('maps an issued-asset payment with code/issuer', async () => {
    const { client } = makePaymentsClient([
      {
        type: 'payment',
        transaction_hash: 'txhash-usdc',
        created_at: '2026-01-01T00:00:00Z',
        from: 'GA_SOURCE',
        to: 'GB_DEST',
        amount: '1.0000000',
        asset_type: 'credit_alphanum4',
        asset_code: 'USDC',
        asset_issuer: 'GUSDC_ISSUER',
      },
    ]);

    const result = await getHistory(client, VALID_ADDR, { source: 'payments' });

    expect(result[0]?.asset).toEqual({ code: 'USDC', issuer: 'GUSDC_ISSUER' });
  });

  it('maps create_account using starting_balance and account fields', async () => {
    const { client } = makePaymentsClient([
      {
        type: 'create_account',
        transaction_hash: 'txhash-create',
        created_at: '2026-01-01T00:00:00Z',
        source_account: 'GA_FUNDER',
        account: 'GB_NEW_ACCOUNT',
        starting_balance: '100.0000000',
      },
    ]);

    const result = await getHistory(client, VALID_ADDR, { source: 'payments' });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      hash: 'txhash-create',
      type: 'create_account',
      amount: '100.0000000',
      from: 'GA_FUNDER',
      to: 'GB_NEW_ACCOUNT',
    });
  });

  it('filters out non-payment/create_account op types', async () => {
    const { client } = makePaymentsClient([
      { type: 'manage_sell_offer', transaction_hash: 'tx1', created_at: '2026-01-01T00:00:00Z' },
      {
        type: 'payment',
        transaction_hash: 'tx2',
        created_at: '2026-01-01T00:00:00Z',
        from: 'GA',
        to: 'GB',
        amount: '1',
        asset_type: 'native',
      },
    ]);

    const result = await getHistory(client, VALID_ADDR, { source: 'payments' });

    expect(result).toHaveLength(1);
    expect(result[0]?.hash).toBe('tx2');
  });

  it('forwards cursor on the payments builder', async () => {
    const { client, chainMock } = makePaymentsClient([]);
    await getHistory(client, VALID_ADDR, { source: 'payments', cursor: 'tok-xyz' });
    expect(chainMock.cursor).toHaveBeenCalledWith('tok-xyz');
  });
});
