import { createClient, type ClientOptions, type StellarClient } from '@stellar-solutions/core';
import type { TxResult, HistoryEntry, Asset, Network } from '@stellar-solutions/core';
import { pay, type PaymentOptions } from './pay.js';
import { getBalance } from './balance.js';
import { getHistory, type HistoryOptions } from './history.js';

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
