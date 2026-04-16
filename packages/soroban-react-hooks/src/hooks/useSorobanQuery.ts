import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { rpc } from '@stellar/stellar-sdk';
import { useSorobanContext } from '../context/SorobanContext.js';

export interface UseSorobanQueryOptions<T> {
  queryFn?: (rpc: rpc.Server) => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
}

export function useSorobanQuery<T>(
  contractId: string,
  methodName: string,
  options: UseSorobanQueryOptions<T> = {},
): UseQueryResult<T, Error> {
  const { client } = useSorobanContext();
  return useQuery<T, Error>({
    queryKey: ['soroban', contractId, methodName],
    queryFn: async () => {
      if (options.queryFn !== undefined) return options.queryFn(client.rpc);
      throw new Error(`No queryFn provided for ${contractId}.${methodName}`);
    },
    ...(options.enabled !== undefined ? { enabled: options.enabled } : {}),
    ...(options.staleTime !== undefined ? { staleTime: options.staleTime } : { staleTime: 10_000 }),
  });
}
