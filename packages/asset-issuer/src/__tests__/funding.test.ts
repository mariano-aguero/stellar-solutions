import type { StellarClient } from '@stellar-solutions/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fundAccount } from '../funding.js';

afterEach(() => vi.restoreAllMocks());

describe('fundAccount — testnet (Friendbot)', () => {
  it('calls Friendbot URL for testnet', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ hash: 'friendbot-tx' }),
    } as Response);

    const mockClient = {
      networkConfig: {
        friendbotUrl: 'https://friendbot.stellar.org',
        networkPassphrase: 'Test SDF Network ; September 2015',
      },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient;

    await fundAccount(mockClient, 'GDEST', { fundingSecretKey: '' });

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('friendbot.stellar.org'));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('GDEST'));
  });

  it('throws if Friendbot returns non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    } as Response);

    const mockClient = {
      networkConfig: { friendbotUrl: 'https://friendbot.stellar.org' },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient;

    await expect(fundAccount(mockClient, 'GBAD', { fundingSecretKey: '' })).rejects.toThrow();
  });
});

describe('fundAccount — mainnet (createAccount)', () => {
  it('calls submitTransaction for mainnet', async () => {
    const submitMock = vi.fn().mockResolvedValue({ hash: 'mainnet-tx', ledger: 1 });

    // Use a valid Stellar secret key for testing
    const FUNDING_SECRET = 'SCN6I4YH2IR7SZ6RHYQMI2TCTS4VXG6MGS4APWXYEUH26VFMYPQMUT5A';
    // Public key derived from FUNDING_SECRET
    const FUNDING_PUBLIC = 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL';

    const loadAccountMock = vi.fn().mockResolvedValue({
      id: FUNDING_PUBLIC,
      accountId: () => FUNDING_PUBLIC,
      sequence: '100',
      sequenceNumber: () => '100',
      incrementSequenceNumber: vi.fn(),
    });

    const mockClient = {
      networkConfig: {
        friendbotUrl: null,
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
      },
      horizon: {
        loadAccount: loadAccountMock,
        submitTransaction: submitMock,
      },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient;

    // Destination is a separate valid Stellar address (randomly generated)
    const DESTINATION = 'GDJJF6GVME2KP6JDUAVNBNUCHIQT5EJL7R6PCOONIGAOMOCY2SWQY5LW';

    await fundAccount(mockClient, DESTINATION, {
      fundingSecretKey: FUNDING_SECRET,
      startingBalance: '2',
    });

    expect(submitMock).toHaveBeenCalledOnce();
  });
});
