# Phase 6: @stellar-solutions/soroban-react-hooks

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement React 19 hooks and provider for Freighter wallet connection and Soroban contract interaction, backed by TanStack Query v5.

**Architecture:** `SorobanProvider` wraps the app with a `QueryClientProvider` and a custom context holding RPC client + wallet state. Read hooks use `useQuery`; write hooks use `useMutation` + query invalidation. Freighter interactions are isolated in an adapter module.

**Tech Stack:** TypeScript, React 19, TanStack Query v5, `@stellar/freighter-api`, `@stellar/stellar-sdk`, `@stellar-solutions/core`, Vitest + Testing Library, jsdom

**Spec:** `specs/soroban-react-hooks/spec.md`

---

## File Map

```
packages/soroban-react-hooks/src/
├── index.ts
├── context/
│   ├── SorobanContext.ts
│   └── SorobanProvider.tsx
├── hooks/
│   ├── useWallet.ts
│   ├── useSorobanQuery.ts
│   ├── useSorobanInvoke.ts
│   └── useSorobanBalance.ts
├── freighter.ts
└── __tests__/
    ├── freighter.test.ts
    ├── SorobanProvider.test.tsx
    ├── useWallet.test.tsx
    ├── useSorobanQuery.test.tsx
    ├── useSorobanInvoke.test.tsx
    └── useSorobanBalance.test.tsx
```

---

### Task 1: Freighter adapter [P]

- [ ] Write `src/__tests__/freighter.test.ts`
  - `getAddress()` when not installed → throws `FreighterNotInstalledError`
  - `getAddress()` when wrong network → throws `NetworkMismatchError`
  - `signTransaction()` returns signed XDR string

Mock `@stellar/freighter-api` with `vi.mock`.

- [ ] Run — fail
- [ ] Implement `src/freighter.ts`

```ts
import * as FreighterAPI from '@stellar/freighter-api';
import { FreighterNotInstalledError, NetworkMismatchError } from '@stellar-solutions/core';

export async function getFreighterAddress(expectedNetwork: string): Promise<string> {
  if (!await FreighterAPI.isConnected()) throw new FreighterNotInstalledError();
  const { network } = await FreighterAPI.getNetwork();
  if (!network.toLowerCase().includes(expectedNetwork)) {
    throw new NetworkMismatchError(expectedNetwork, network);
  }
  const { address } = await FreighterAPI.getAddress();
  return address;
}

export async function signWithFreighter(xdr: string, network: string): Promise<string> {
  const { signedTxXdr } = await FreighterAPI.signTransaction(xdr, { network });
  return signedTxXdr;
}
```

- [ ] Run — pass
- [ ] `git commit -m "feat(soroban-react-hooks): add Freighter adapter with error typing"`

---

### Task 2: Context + Provider [P]

- [ ] Write `src/__tests__/SorobanProvider.test.tsx`
  - Renders without error wrapping a child
  - Hook outside provider throws descriptive error
  - `useWallet()` returns `{ isConnected: false }` before connect
- [ ] Run — fail
- [ ] Implement `src/context/SorobanContext.ts`

```ts
import { createContext, useContext } from 'react';
import type { StellarClient } from '@stellar-solutions/core';

export interface SorobanContextValue {
  client: StellarClient;
  network: 'testnet' | 'mainnet';
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
}

export const SorobanContext = createContext<SorobanContextValue | null>(null);

export function useSorobanContext(): SorobanContextValue {
  const ctx = useContext(SorobanContext);
  if (!ctx) throw new Error('useSorobanContext must be used within a SorobanProvider');
  return ctx;
}
```

- [ ] Implement `src/context/SorobanProvider.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useMemo, type ReactNode } from 'react';
import { createClient } from '@stellar-solutions/core';
import { SorobanContext } from './SorobanContext.js';

const defaultQueryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, retry: 2 } },
});

export function SorobanProvider({
  network,
  children,
  queryClient = defaultQueryClient,
}: {
  network: 'testnet' | 'mainnet';
  children: ReactNode;
  queryClient?: QueryClient;
}) {
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
```

- [ ] Run — pass
- [ ] `git commit -m "feat(soroban-react-hooks): add SorobanProvider and context"`

---

### Task 3: useWallet

- [ ] Write `src/__tests__/useWallet.test.tsx` using `renderHook` from Testing Library

```tsx
it('connect sets address', async () => {
  vi.mocked(getFreighterAddress).mockResolvedValue('GABC...');
  const { result } = renderHook(() => useWallet(), { wrapper: TestProvider });
  await act(() => result.current.connect());
  expect(result.current.address).toBe('GABC...');
  expect(result.current.isConnected).toBe(true);
});

it('disconnect clears address', async () => {
  // ...
});

it('sets error when Freighter not installed', async () => {
  vi.mocked(getFreighterAddress).mockRejectedValue(new FreighterNotInstalledError());
  const { result } = renderHook(() => useWallet(), { wrapper: TestProvider });
  await act(() => result.current.connect());
  expect(result.current.error).toBeInstanceOf(FreighterNotInstalledError);
});
```

- [ ] Run — fail
- [ ] Implement `src/hooks/useWallet.ts`

```ts
export function useWallet() {
  const { network, walletAddress, setWalletAddress } = useSorobanContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<StellarKitError | null>(null);

  const connect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const address = await getFreighterAddress(network);
      setWalletAddress(address);
    } catch (err) {
      setError(err instanceof StellarKitError ? err : new StellarKitError(String(err), 'UNKNOWN'));
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => setWalletAddress(null);

  return {
    address: walletAddress,
    isConnected: walletAddress !== null,
    connect,
    disconnect,
    isLoading,
    error,
  };
}
```

- [ ] Run — pass
- [ ] `git commit -m "feat(soroban-react-hooks): add useWallet hook"`

---

### Task 4: useSorobanQuery + useSorobanBalance

- [ ] Write `src/__tests__/useSorobanQuery.test.tsx` — mock RPC call, verify cache hit on second render
- [ ] Run — fail
- [ ] Implement `src/hooks/useSorobanQuery.ts`

```ts
export function useSorobanQuery<T>(
  contractId: string,
  methodName: string,
  args: unknown[] = [],
  queryOptions?: Partial<UseQueryOptions<T>>,
) {
  const { client } = useSorobanContext();
  return useQuery<T>({
    queryKey: ['soroban', contractId, methodName, ...args],
    queryFn: () => simulateContractRead<T>(client.rpc, contractId, methodName, args),
    staleTime: 10_000,
    ...queryOptions,
  });
}
```

- [ ] Write `src/__tests__/useSorobanBalance.test.tsx`
- [ ] Implement `src/hooks/useSorobanBalance.ts` — thin wrapper calling `balance(address)` on the SAC contract
- [ ] `git commit -m "feat(soroban-react-hooks): add useSorobanQuery and useSorobanBalance"`

---

### Task 5: useSorobanInvoke

- [ ] Write `src/__tests__/useSorobanInvoke.test.tsx`
  - successful invoke → TxResult returned, query with same contractId invalidated
  - NetworkMismatchError during invoke → surfaces in `error`

- [ ] Run — fail
- [ ] Implement `src/hooks/useSorobanInvoke.ts`

```ts
export function useSorobanInvoke(contractId: string, methodName: string) {
  const { client, network } = useSorobanContext();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (args: unknown[]) => {
      // 1. Simulate with RPC to get tx footprint
      // 2. Sign with Freighter (signWithFreighter)
      // 3. Submit signed tx via RPC
      // 4. Return TxResult
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soroban', contractId] });
    },
  });

  return {
    invoke: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error as StellarKitError | null,
  };
}
```

- [ ] Run — pass
- [ ] `git commit -m "feat(soroban-react-hooks): add useSorobanInvoke with query invalidation"`

---

### Task 6: Index + SSR guard

- [ ] Implement `src/index.ts` — re-export all public API

```ts
export { SorobanProvider } from './context/SorobanProvider.js';
export { useWallet } from './hooks/useWallet.js';
export { useSorobanQuery } from './hooks/useSorobanQuery.js';
export { useSorobanInvoke } from './hooks/useSorobanInvoke.js';
export { useSorobanBalance } from './hooks/useSorobanBalance.js';
export type { ... }
```

- [ ] Build + typecheck + test — all pass
- [ ] `git commit -m "feat(soroban-react-hooks): finalize public API"`

---

### Task 7: Vite example app

- [ ] Implement `examples/soroban-hooks-vite/src/App.tsx`

```tsx
function App() {
  const { address, connect, isConnected } = useWallet();
  const { data: balance } = useSorobanBalance(SAC_CONTRACT_ID, address);
  const { invoke, isPending } = useSorobanInvoke(SAC_CONTRACT_ID, 'transfer');

  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect Freighter</button>
      ) : (
        <>
          <p>Address: {address}</p>
          <p>Balance: {balance ?? '...'}</p>
          <button onClick={() => invoke([DESTINATION, '10'])} disabled={isPending}>
            {isPending ? 'Sending...' : 'Transfer 10 tokens'}
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] Wrap with `<SorobanProvider network="testnet">` in `main.tsx`
- [ ] Run: `pnpm --filter soroban-hooks-vite dev` → open browser → connect Freighter → verify balance loads
- [ ] `git commit -m "feat(examples): soroban-hooks-vite demo with wallet connect + token transfer"`

---

**Phase 6 complete. All 6 packages implemented.**

Next step: push to GitHub, verify CI is green, add `NPM_TOKEN` secret, merge to main to trigger first release.
