export { StellarBatch } from './StellarBatch.js';
export type { StellarBatchOptions } from './StellarBatch.js';
export { ChannelPool } from './channels.js';
export { estimate } from './estimator.js';
export type { BatchEstimate } from './estimator.js';
export { validateAndChunk } from './queue.js';
export { ResultCollector } from './result-collector.js';

// Re-export core types needed by consumers
export {
  EmptyBatchError,
  BatchValidationError,
  StellarKitError,
  InvalidAddressError,
  InvalidAmountError,
  NetworkTimeoutError,
} from '@stellar-solutions/core';
export type { BatchPayment, BatchResult, FailedPayment, Network } from '@stellar-solutions/core';
