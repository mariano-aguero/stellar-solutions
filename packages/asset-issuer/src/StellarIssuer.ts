import { createClient } from '@stellar-solutions/core';
import type { StellarClient, TxResult, Network } from '@stellar-solutions/core';
import { createAsset } from './createAsset.js';
import { mintTo } from './mint.js';
import { burn } from './burn.js';
import { getHolders } from './holders.js';
import type { CreateAssetOptions, AssetResult } from './createAsset.js';
import type { Holder } from './holders.js';

export interface StellarIssuerOptions {
  network: Network;
  fundingSecretKey: string;
}

export class StellarIssuer {
  private readonly client: StellarClient;
  private readonly fundingSecretKey: string;
  private lastAsset: AssetResult | null = null;

  constructor(options: StellarIssuerOptions) {
    this.client = createClient(options.network);
    this.fundingSecretKey = options.fundingSecretKey;
  }

  async createAsset(options: Omit<CreateAssetOptions, 'fundingSecretKey'>): Promise<AssetResult> {
    this.lastAsset = await createAsset(this.client, {
      ...options,
      fundingSecretKey: this.fundingSecretKey,
    });
    return this.lastAsset;
  }

  async mintTo(destination: string, amount: string): Promise<TxResult> {
    if (!this.lastAsset) throw new Error('No asset created yet. Call createAsset() first.');
    return mintTo(this.client, {
      issuerSecretKey: this.lastAsset.issuerSecretKey,
      assetCode: this.lastAsset.assetCode,
      destination,
      amount,
    });
  }

  async burn(amount: string): Promise<TxResult> {
    if (!this.lastAsset) throw new Error('No asset created yet. Call createAsset() first.');
    return burn(this.client, {
      distributorSecretKey: this.lastAsset.distributorSecretKey,
      issuerAddress: this.lastAsset.issuerAddress,
      assetCode: this.lastAsset.assetCode,
      amount,
    });
  }

  async getHolders(): Promise<Holder[]> {
    if (!this.lastAsset) throw new Error('No asset created yet. Call createAsset() first.');
    return getHolders(this.client, {
      assetCode: this.lastAsset.assetCode,
      issuerAddress: this.lastAsset.issuerAddress,
    });
  }
}
