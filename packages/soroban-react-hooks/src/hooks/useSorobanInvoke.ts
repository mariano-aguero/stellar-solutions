'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StellarKitError } from '@stellar-solutions/core';
import type { TxResult } from '@stellar-solutions/core';
import { useSorobanContext } from '../context/SorobanContext.js';
import type { rpc } from '@stellar/stellar-sdk';

export interface UseSorobanInvokeOptions<TArgs extends readonly unknown[] = readonly unknown[]> {
  mutateFn?: (rpc: rpc.Server, args: TArgs) => Promise<TxResult>;
}

export interface SorobanInvokeResult<TArgs extends readonly unknown[] = readonly unknown[]> {
  invoke: (args: TArgs) => Promise<TxResult>;
  isPending: boolean;
  error: StellarKitError | null;
  data: TxResult | undefined;
}

export function useSorobanInvoke<TArgs extends readonly unknown[] = readonly unknown[]>(
  contractId: string,
  methodName: string,
  options: UseSorobanInvokeOptions<TArgs> = {},
): SorobanInvokeResult<TArgs> {
  const { client } = useSorobanContext();
  const queryClient = useQueryClient();

  const mutation = useMutation<TxResult, Error, TArgs>({
    mutationFn: async (args: TArgs) => {
      if (options.mutateFn !== undefined) {
        return options.mutateFn(client.rpc, args);
      }
      throw new StellarKitError(
        `No mutateFn provided for ${contractId}.${methodName}`,
        'NO_MUTATE_FN',
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['soroban', contractId] });
    },
  });

  // Normalize all errors to StellarKitError so consumers always deal with a consistent type.
  const error = mutation.error instanceof StellarKitError
    ? mutation.error
    : mutation.error !== null
    ? new StellarKitError(mutation.error.message, 'UNKNOWN')
    : null;

  return {
    invoke: mutation.mutateAsync,
    isPending: mutation.isPending,
    error,
    data: mutation.data,
  };
}
