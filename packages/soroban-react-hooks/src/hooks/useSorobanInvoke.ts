import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StellarKitError, TxResult } from '@stellar-solutions/core';
import { useSorobanContext } from '../context/SorobanContext.js';
import type { rpc } from '@stellar/stellar-sdk';

export interface UseSorobanInvokeOptions {
  mutateFn?: (rpc: rpc.Server, args: unknown[]) => Promise<TxResult>;
}

export interface SorobanInvokeResult {
  invoke: (args: unknown[]) => Promise<TxResult>;
  isPending: boolean;
  error: StellarKitError | null;
  data: TxResult | undefined;
}

export function useSorobanInvoke(
  contractId: string,
  methodName: string,
  options: UseSorobanInvokeOptions = {},
): SorobanInvokeResult {
  const { client } = useSorobanContext();
  const queryClient = useQueryClient();

  const mutation = useMutation<TxResult, Error, unknown[]>({
    mutationFn: async (args: unknown[]) => {
      if (options.mutateFn !== undefined) {
        return options.mutateFn(client.rpc, args);
      }
      // Default: simulate → sign → submit
      // This requires building a transaction, which needs the user's address
      // In practice callers provide mutateFn for full control
      throw new Error(`No mutateFn provided for ${contractId}.${methodName}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['soroban', contractId] });
    },
  });

  return {
    invoke: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error instanceof Error ? (mutation.error as StellarKitError) : null,
    data: mutation.data,
  };
}
