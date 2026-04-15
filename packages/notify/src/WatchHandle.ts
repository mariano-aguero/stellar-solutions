import { EventEmitter } from 'node:events';
import type { PaymentEvent, SorobanEvent, OtherEvent } from './types.js';
import type { StellarKitError } from '@stellar-solutions/core';

export class WatchHandle extends EventEmitter {
  on(event: 'payment', listener: (tx: PaymentEvent) => void): this;
  on(event: 'soroban', listener: (tx: SorobanEvent) => void): this;
  on(event: 'other', listener: (tx: OtherEvent) => void): this;
  on(event: 'error', listener: (err: Error | StellarKitError) => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }

  off(event: 'payment', listener: (tx: PaymentEvent) => void): this;
  off(event: 'soroban', listener: (tx: SorobanEvent) => void): this;
  off(event: 'other', listener: (tx: OtherEvent) => void): this;
  off(event: 'error', listener: (err: Error | StellarKitError) => void): this;
  off(event: string, listener: (...args: unknown[]) => void): this {
    return super.off(event, listener);
  }
}
