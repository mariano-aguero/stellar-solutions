import { EventEmitter } from 'node:events';
import type { PaymentEvent, SorobanEvent, OtherEvent } from './types.js';
import type { StellarKitError } from '@stellar-solutions/core';

export class WatchHandle extends EventEmitter {
  override on(event: 'payment', listener: (tx: PaymentEvent) => void): this;
  override on(event: 'soroban', listener: (tx: SorobanEvent) => void): this;
  override on(event: 'other', listener: (tx: OtherEvent) => void): this;
  override on(event: 'error', listener: (err: Error | StellarKitError) => void): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  override off(event: 'payment', listener: (tx: PaymentEvent) => void): this;
  override off(event: 'soroban', listener: (tx: SorobanEvent) => void): this;
  override off(event: 'other', listener: (tx: OtherEvent) => void): this;
  override off(event: 'error', listener: (err: Error | StellarKitError) => void): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override off(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.off(event, listener);
  }

  override emit(event: 'payment', tx: PaymentEvent): boolean;
  override emit(event: 'soroban', tx: SorobanEvent): boolean;
  override emit(event: 'other', tx: OtherEvent): boolean;
  override emit(event: 'error', err: Error | StellarKitError): boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }
}
