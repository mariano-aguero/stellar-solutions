import { createContext, useContext } from 'react';
import type { StellarClient, Network } from '@stellar-solutions/core';

export interface SorobanContextValue {
  client: StellarClient;
  network: Network;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
}

export const SorobanContext = createContext<SorobanContextValue | null>(null);

export function useSorobanContext(): SorobanContextValue {
  const ctx = useContext(SorobanContext);
  if (!ctx) throw new Error('useSorobanContext must be used within a SorobanProvider');
  return ctx;
}
