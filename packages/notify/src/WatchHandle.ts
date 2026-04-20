import { EventEmitter } from 'node:events';
import type { StellarKitError } from '@stellar-solutions/core';
import type { OtherEvent, PaymentEvent, SorobanEvent } from './types.js';

export class WatchHandle extends EventEmitter {
  override on(event: 'payment', listener: (tx: PaymentEvent) => void): this;
  override on(event: 'soroban', listener: (tx: SorobanEvent) => void): this;
  override on(event: 'other', listener: (tx: OtherEvent) => void): this;
  override on(event: 'error', listener: (err: Error | StellarKitError) => void): this;
  // biome-ignore lint/suspicious/noExplicitAny: EventEmitter override fallback signature
  override on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  override off(event: 'payment', listener: (tx: PaymentEvent) => void): this;
  override off(event: 'soroban', listener: (tx: SorobanEvent) => void): this;
  override off(event: 'other', listener: (tx: OtherEvent) => void): this;
  override off(event: 'error', listener: (err: Error | StellarKitError) => void): this;
  // biome-ignore lint/suspicious/noExplicitAny: EventEmitter override fallback signature
  override off(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.off(event, listener);
  }

  override emit(event: 'payment', tx: PaymentEvent): boolean;
  override emit(event: 'soroban', tx: SorobanEvent): boolean;
  override emit(event: 'other', tx: OtherEvent): boolean;
  override emit(event: 'error', err: Error | StellarKitError): boolean;
  // biome-ignore lint/suspicious/noExplicitAny: EventEmitter override fallback signature
  override emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }
}
