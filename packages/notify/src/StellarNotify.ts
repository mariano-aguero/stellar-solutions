import { createClient } from '@stellar-solutions/core';
import type { StellarClient, Network } from '@stellar-solutions/core';
import { WatchHandle } from './WatchHandle.js';
import { ReconnectScheduler } from './reconnect.js';
import { startWatcher } from './watcher.js';

export interface StellarNotifyOptions {
  network: Network;
  maxRetries?: number;
}

export class StellarNotify {
  private readonly client: StellarClient;
  private readonly maxRetries: number;
  private readonly watchers = new Map<string, { handle: WatchHandle; stop: () => void }>();

  constructor(options: StellarNotifyOptions) {
    this.maxRetries = options.maxRetries ?? 5;
    this.client = createClient(options.network);
  }

  watch(address: string, options?: { cursor?: string }): WatchHandle {
    const existing = this.watchers.get(address);
    if (existing !== undefined) {
      return existing.handle;
    }
    const handle = new WatchHandle();
    const reconnect = new ReconnectScheduler({
      maxRetries: this.maxRetries,
      onMaxRetries: () => handle.emit('error', new Error(`Max retries exceeded for ${address}`)),
    });
    const cursor = options?.cursor;
    const stop = cursor !== undefined
      ? startWatcher(this.client, address, handle, reconnect, cursor)
      : startWatcher(this.client, address, handle, reconnect);
    this.watchers.set(address, { handle, stop });
    return handle;
  }

  stop(address: string): void {
    const entry = this.watchers.get(address);
    if (entry !== undefined) {
      entry.stop();
      this.watchers.delete(address);
    }
  }

  stopAll(): void {
    for (const [address] of this.watchers) {
      this.stop(address);
    }
  }
}
