import { NoAssetCreatedError, createClient } from '@stellar-solutions/core';
import type { Network, StellarClient, TxResult } from '@stellar-solutions/core';
import { burn } from './burn.js';
import { createAsset } from './createAsset.js';
import type { AssetResult, CreateAssetOptions } from './createAsset.js';
import { getHolders } from './holders.js';
import type { Holder } from './holders.js';
import { mintTo } from './mint.js';

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
    if (!this.lastAsset) throw new NoAssetCreatedError();
    return mintTo(this.client, {
      issuerSecretKey: this.lastAsset.issuerSecretKey,
      assetCode: this.lastAsset.assetCode,
      destination,
      amount,
    });
  }

  async burn(amount: string): Promise<TxResult> {
    if (!this.lastAsset) throw new NoAssetCreatedError();
    return burn(this.client, {
      distributorSecretKey: this.lastAsset.distributorSecretKey,
      issuerAddress: this.lastAsset.issuerAddress,
      assetCode: this.lastAsset.assetCode,
      amount,
    });
  }

  async getHolders(): Promise<Holder[]> {
    if (!this.lastAsset) throw new NoAssetCreatedError();
    return getHolders(this.client, {
      assetCode: this.lastAsset.assetCode,
      issuerAddress: this.lastAsset.issuerAddress,
    });
  }
}
