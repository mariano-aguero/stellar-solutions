import { vi, describe, it, expect, beforeEach } from 'vitest';
import { StellarIssuer } from '../StellarIssuer.js';
import { NoAssetCreatedError } from '@stellar-solutions/core';
import type { AssetResult } from '../createAsset.js';
import type { TxResult } from '@stellar-solutions/core';
import type { Holder } from '../holders.js';

vi.mock('../createAsset.js', () => ({ createAsset: vi.fn() }));
vi.mock('../mint.js', () => ({ mintTo: vi.fn() }));
vi.mock('../burn.js', () => ({ burn: vi.fn() }));
vi.mock('../holders.js', () => ({ getHolders: vi.fn() }));

vi.mock('@stellar-solutions/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stellar-solutions/core')>();
  return { ...actual, createClient: vi.fn(() => ({})) };
});

import { createAsset as mockCreateAsset } from '../createAsset.js';
import { mintTo as mockMintTo } from '../mint.js';
import { burn as mockBurn } from '../burn.js';
import { getHolders as mockGetHolders } from '../holders.js';

const MOCK_ASSET_RESULT: AssetResult = {
  assetCode: 'MYTKN',
  issuerAddress: 'GISSUER123',
  issuerSecretKey: 'SISSUER123',
  distributorAddress: 'GDIST123',
  distributorSecretKey: 'SDIST123',
  explorerUrl: 'https://stellar.expert/explorer/testnet/asset/MYTKN-GISSUER123',
  txHashes: ['abc123'],
};

const MOCK_TX_RESULT: TxResult = {
  hash: 'txhash1',
  ledger: 100,
  fee: '100',
  createdAt: '2026-04-15T00:00:00.000Z',
};

const MOCK_HOLDERS: Holder[] = [
  { address: 'GHOLDER1', balance: '1000.0000000' },
];

describe('StellarIssuer', () => {
  let issuer: StellarIssuer;

  beforeEach(() => {
    vi.clearAllMocks();
    issuer = new StellarIssuer({
      network: 'testnet',
      fundingSecretKey: 'SFUNDING123',
    });
  });

  it('createAsset() calls underlying createAsset with merged fundingSecretKey', async () => {
    vi.mocked(mockCreateAsset).mockResolvedValueOnce(MOCK_ASSET_RESULT);

    const result = await issuer.createAsset({ code: 'MYTKN', totalSupply: '1000000' });

    expect(mockCreateAsset).toHaveBeenCalledOnce();
    expect(mockCreateAsset).toHaveBeenCalledWith(
      {},
      {
        code: 'MYTKN',
        totalSupply: '1000000',
        fundingSecretKey: 'SFUNDING123',
      },
    );
    expect(result).toEqual(MOCK_ASSET_RESULT);
  });

  it('mintTo() calls underlying mintTo with stored issuerSecretKey and assetCode', async () => {
    vi.mocked(mockCreateAsset).mockResolvedValueOnce(MOCK_ASSET_RESULT);
    vi.mocked(mockMintTo).mockResolvedValueOnce(MOCK_TX_RESULT);

    await issuer.createAsset({ code: 'MYTKN', totalSupply: '1000000' });
    const result = await issuer.mintTo('GDEST999', '500');

    expect(mockMintTo).toHaveBeenCalledOnce();
    expect(mockMintTo).toHaveBeenCalledWith(
      {},
      {
        issuerSecretKey: 'SISSUER123',
        assetCode: 'MYTKN',
        destination: 'GDEST999',
        amount: '500',
      },
    );
    expect(result).toEqual(MOCK_TX_RESULT);
  });

  it('burn() calls underlying burn with stored distributorSecretKey', async () => {
    vi.mocked(mockCreateAsset).mockResolvedValueOnce(MOCK_ASSET_RESULT);
    vi.mocked(mockBurn).mockResolvedValueOnce(MOCK_TX_RESULT);

    await issuer.createAsset({ code: 'MYTKN', totalSupply: '1000000' });
    const result = await issuer.burn('200');

    expect(mockBurn).toHaveBeenCalledOnce();
    expect(mockBurn).toHaveBeenCalledWith(
      {},
      {
        distributorSecretKey: 'SDIST123',
        issuerAddress: 'GISSUER123',
        assetCode: 'MYTKN',
        amount: '200',
      },
    );
    expect(result).toEqual(MOCK_TX_RESULT);
  });

  it('getHolders() calls underlying getHolders with stored assetCode and issuerAddress', async () => {
    vi.mocked(mockCreateAsset).mockResolvedValueOnce(MOCK_ASSET_RESULT);
    vi.mocked(mockGetHolders).mockResolvedValueOnce(MOCK_HOLDERS);

    await issuer.createAsset({ code: 'MYTKN', totalSupply: '1000000' });
    const result = await issuer.getHolders();

    expect(mockGetHolders).toHaveBeenCalledOnce();
    expect(mockGetHolders).toHaveBeenCalledWith(
      {},
      {
        assetCode: 'MYTKN',
        issuerAddress: 'GISSUER123',
      },
    );
    expect(result).toEqual(MOCK_HOLDERS);
  });

  it('mintTo() throws NoAssetCreatedError if no asset has been created yet', async () => {
    await expect(issuer.mintTo('GDEST999', '500')).rejects.toThrow(NoAssetCreatedError);
    expect(mockMintTo).not.toHaveBeenCalled();
  });

  it('burn() throws NoAssetCreatedError if no asset has been created yet', async () => {
    await expect(issuer.burn('200')).rejects.toThrow(NoAssetCreatedError);
    expect(mockBurn).not.toHaveBeenCalled();
  });

  it('getHolders() throws NoAssetCreatedError if no asset has been created yet', async () => {
    await expect(issuer.getHolders()).rejects.toThrow(NoAssetCreatedError);
    expect(mockGetHolders).not.toHaveBeenCalled();
  });
});
