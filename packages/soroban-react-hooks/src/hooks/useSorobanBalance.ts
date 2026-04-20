'use client';

import { StellarKitError } from '@stellar-solutions/core';
import {
  Account,
  Address,
  Contract,
  rpc as RpcModule,
  TransactionBuilder,
  scValToNative,
} from '@stellar/stellar-sdk';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useSorobanContext } from '../context/SorobanContext.js';

export function useSorobanBalance(
  contractId: string,
  address: string | null,
): UseQueryResult<string, Error> {
  const { client } = useSorobanContext();

  return useQuery<string, Error>({
    queryKey: ['soroban', contractId, 'balance', address],
    enabled: address !== null,
    staleTime: 10_000,
    queryFn: async () => {
      if (address === null) return '0';

      const contract = new Contract(contractId);
      // Simulation-only calls don't require a real sequence number —
      // use the queried address as the fake source account.
      const fakeAccount = new Account(address, '0');
      const tx = new TransactionBuilder(fakeAccount, {
        fee: '100',
        networkPassphrase: client.networkConfig.networkPassphrase,
      })
        .addOperation(contract.call('balance', Address.fromString(address).toScVal()))
        .setTimeout(30)
        .build();

      const sim = await client.rpc.simulateTransaction(tx);
      if (RpcModule.Api.isSimulationError(sim)) {
        throw new StellarKitError(sim.error, 'SOROBAN_SIMULATION_ERROR');
      }
      if (!('result' in sim) || sim.result === undefined) {
        return '0';
      }
      const native = scValToNative(sim.result.retval);
      return String(native);
    },
  });
}
