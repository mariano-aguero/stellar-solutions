'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { createClient } from '@stellar-solutions/core';
import type { Network } from '@stellar-solutions/core';
import { SorobanContext } from './SorobanContext.js';

interface SorobanProviderProps {
  network: Network;
  children: ReactNode;
  queryClient?: QueryClient;
}

export function SorobanProvider({ network, children, queryClient }: SorobanProviderProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const client = useMemo(() => createClient(network), [network]);
  // Create an internal QueryClient per component instance to avoid shared state
  // between multiple SorobanProvider mounts (e.g. parallel renders in tests).
  const [internalQueryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, retry: 2 } } }),
  );
  const resolvedQueryClient = queryClient ?? internalQueryClient;

  // Clear the wallet address whenever the network changes — an address authenticated
  // against testnet must not silently appear connected after switching to mainnet.
  useEffect(() => {
    setWalletAddress(null);
  }, [network]);

  // Memoize the context value so consumers don't re-render when SorobanProvider's parent
  // re-renders but none of the context inputs changed.
  const contextValue = useMemo(
    () => ({ client, network, walletAddress, setWalletAddress }),
    [client, network, walletAddress],
  );

  return (
    <QueryClientProvider client={resolvedQueryClient}>
      <SorobanContext.Provider value={contextValue}>{children}</SorobanContext.Provider>
    </QueryClientProvider>
  );
}
