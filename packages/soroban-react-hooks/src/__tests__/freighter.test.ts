import { vi, describe, it, expect } from 'vitest';
import { FreighterNotInstalledError, NetworkMismatchError } from '@stellar-solutions/core';

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(),
  getNetwork: vi.fn(),
  getAddress: vi.fn(),
  signTransaction: vi.fn(),
}));

import * as FreighterAPI from '@stellar/freighter-api';
import { getFreighterAddress, signWithFreighter } from '../freighter.js';

describe('getFreighterAddress', () => {
  it('throws FreighterNotInstalledError when not connected', async () => {
    vi.mocked(FreighterAPI.isConnected).mockResolvedValue({ isConnected: false });
    await expect(getFreighterAddress('testnet')).rejects.toThrow(FreighterNotInstalledError);
  });

  it('throws NetworkMismatchError when on wrong network', async () => {
    vi.mocked(FreighterAPI.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(FreighterAPI.getNetwork).mockResolvedValue({ network: 'mainnet', networkPassphrase: '' });
    await expect(getFreighterAddress('testnet')).rejects.toThrow(NetworkMismatchError);
  });

  it('returns address when connected and on correct network', async () => {
    vi.mocked(FreighterAPI.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(FreighterAPI.getNetwork).mockResolvedValue({ network: 'testnet', networkPassphrase: '' });
    vi.mocked(FreighterAPI.getAddress).mockResolvedValue({ address: 'GABC123', error: '' });
    const address = await getFreighterAddress('testnet');
    expect(address).toBe('GABC123');
  });
});

describe('signWithFreighter', () => {
  it('returns signed XDR string', async () => {
    vi.mocked(FreighterAPI.signTransaction).mockResolvedValue({
      signedTxXdr: 'signed-xdr-string',
      signerAddress: 'GABC',
      error: '',
    });
    const result = await signWithFreighter('raw-xdr', 'testnet');
    expect(result).toBe('signed-xdr-string');
  });
});
