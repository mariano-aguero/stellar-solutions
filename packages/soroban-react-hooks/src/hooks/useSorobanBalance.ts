import type { UseQueryResult } from '@tanstack/react-query';
import { useSorobanQuery } from './useSorobanQuery.js';

export function useSorobanBalance(
  contractId: string,
  address: string | null,
): UseQueryResult<string, Error> {
  return useSorobanQuery<string>(contractId, 'balance', {
    enabled: address !== null,
    queryFn: async (rpc) => {
      // In a real implementation: call balance(address) on the SAC contract
      // For now, this is a placeholder that consumers can override via queryFn
      void rpc;
      return '0';
    },
  });
}
