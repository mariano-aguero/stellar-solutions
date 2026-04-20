'use client';

import type { Network, StellarClient } from '@stellar-solutions/core';
import { StellarKitError } from '@stellar-solutions/core';
import { createContext, useContext } from 'react';

export interface SorobanContextValue {
  client: StellarClient;
  network: Network;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
}

export const SorobanContext = createContext<SorobanContextValue | null>(null);

export function useSorobanContext(): SorobanContextValue {
  const ctx = useContext(SorobanContext);
  if (!ctx)
    throw new StellarKitError(
      'useSorobanContext must be used within a SorobanProvider',
      'MISSING_PROVIDER',
    );
  return ctx;
}
