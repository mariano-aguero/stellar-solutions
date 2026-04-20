'use client';

import { StellarKitError } from '@stellar-solutions/core';
import type { rpc } from '@stellar/stellar-sdk';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useSorobanContext } from '../context/SorobanContext.js';

export interface UseSorobanQueryOptions<T> {
  queryFn?: (rpcServer: rpc.Server) => Promise<T>;
  /**
   * Query arguments — included in the queryKey as a JSON-stringified segment so
   * callers passing fresh object/array literals on each render do NOT trigger
   * infinite refetches due to referential inequality.
   */
  args?: readonly unknown[];
  enabled?: boolean;
  staleTime?: number;
}

// Soroban contracts commonly use i128/u128 values, which map to JS bigint.
// Default JSON.stringify throws on bigint — this replacer coerces to decimal string.
function stringifyArgs(args: readonly unknown[]): string {
  return JSON.stringify(args, (_k, v) => (typeof v === 'bigint' ? `${v}n` : v));
}

export function useSorobanQuery<T>(
  contractId: string,
  methodName: string,
  options: UseSorobanQueryOptions<T> = {},
): UseQueryResult<T, Error> {
  const { client } = useSorobanContext();
  const argsKey = options.args !== undefined ? stringifyArgs(options.args) : '';
  return useQuery<T, Error>({
    queryKey: ['soroban', contractId, methodName, argsKey],
    queryFn: async () => {
      if (options.queryFn !== undefined) return options.queryFn(client.rpc);
      throw new StellarKitError(
        `No queryFn provided for ${contractId}.${methodName}`,
        'NO_QUERY_FN',
      );
    },
    ...(options.enabled !== undefined ? { enabled: options.enabled } : {}),
    ...(options.staleTime !== undefined ? { staleTime: options.staleTime } : { staleTime: 10_000 }),
  });
}
