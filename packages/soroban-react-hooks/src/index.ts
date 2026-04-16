// Context + Provider
export { SorobanProvider } from './context/SorobanProvider.js';
export type { SorobanContextValue } from './context/SorobanContext.js';

// Hooks
export { useWallet } from './hooks/useWallet.js';
export type { WalletState } from './hooks/useWallet.js';
export { useSorobanQuery } from './hooks/useSorobanQuery.js';
export type { UseSorobanQueryOptions } from './hooks/useSorobanQuery.js';
export { useSorobanBalance } from './hooks/useSorobanBalance.js';
export { useSorobanInvoke } from './hooks/useSorobanInvoke.js';
export type { UseSorobanInvokeOptions, SorobanInvokeResult } from './hooks/useSorobanInvoke.js';

// Re-export core error types useful for consumers
export {
  StellarKitError,
  FreighterNotInstalledError,
  NetworkMismatchError,
  NetworkTimeoutError,
} from '@stellar-solutions/core';
export type { Network, TxResult } from '@stellar-solutions/core';
