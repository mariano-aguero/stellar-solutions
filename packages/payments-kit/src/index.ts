export { StellarKit } from './StellarKit.js';
export type { StellarKitOptions } from './StellarKit.js';
export type { PaymentOptions } from './pay.js';
export type { HistoryOptions } from './history.js';

// Re-export core error classes so consumers don't need to import from @stellar-solutions/core directly
export {
  StellarKitError,
  InvalidAddressError,
  InvalidAmountError,
  InvalidAssetCodeError,
  SequenceError,
  NetworkTimeoutError,
  InsufficientFundsError,
  NoTrustlineError,
} from '@stellar-solutions/core';

// Re-export core types
export type { TxResult, HistoryEntry, Asset } from '@stellar-solutions/core';
