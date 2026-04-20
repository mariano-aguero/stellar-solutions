import { type ClientOptions, type StellarClient, createClient } from '@stellar-solutions/core';
import type { Asset, HistoryEntry, Network, TxResult } from '@stellar-solutions/core';
import { getBalance } from './balance.js';
import { type HistoryOptions, getHistory } from './history.js';
import { type PaymentOptions, pay } from './pay.js';

export interface StellarKitOptions extends ClientOptions {
  network: Network;
}

export class StellarKit {
  private readonly client: StellarClient;

  constructor(options: StellarKitOptions) {
    this.client = createClient(options.network, options);
  }

  pay(options: PaymentOptions): Promise<TxResult> {
    return pay(this.client, options);
  }

  getBalance(address: string, asset?: Asset): Promise<string> {
    return getBalance(this.client, address, asset);
  }

  getHistory(address: string, options?: HistoryOptions): Promise<HistoryEntry[]> {
    return getHistory(this.client, address, options);
  }
}
