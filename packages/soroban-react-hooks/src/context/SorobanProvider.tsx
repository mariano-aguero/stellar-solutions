import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useMemo, type ReactNode } from 'react';
import { createClient } from '@stellar-solutions/core';
import type { Network } from '@stellar-solutions/core';
import { SorobanContext } from './SorobanContext.js';

const defaultQueryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, retry: 2 } },
});

interface SorobanProviderProps {
  network: Network;
  children: ReactNode;
  queryClient?: QueryClient;
}

export function SorobanProvider({ network, children, queryClient = defaultQueryClient }: SorobanProviderProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const client = useMemo(() => createClient(network), [network]);

  return (
    <QueryClientProvider client={queryClient}>
      <SorobanContext.Provider value={{ client, network, walletAddress, setWalletAddress }}>
        {children}
      </SorobanContext.Provider>
    </QueryClientProvider>
  );
}
