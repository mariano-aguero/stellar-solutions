# Technical Plan: @stellar-solutions/soroban-react-hooks

## Spec Reference
Implements: `specs/soroban-react-hooks/spec.md`

## Architecture Overview

The package exports a React Context provider and four hooks. The provider initializes
a Soroban RPC client (from `@stellar-solutions/core`) and a TanStack `QueryClient`, and
exposes both via context. Read hooks (`useSorobanQuery`, `useSorobanBalance`) use
`useQuery`; write hooks (`useSorobanInvoke`) use `useMutation` with automatic query
invalidation on success. Wallet state (Freighter) is managed in the provider and exposed
via `useWallet`.

## Component Breakdown

### `SorobanProvider`
- **Responsibility:** Initialize RPC client, QueryClient, Freighter wallet state; wrap tree
- **Location:** `packages/soroban-react-hooks/src/context/SorobanProvider.tsx`
- **Accepts:** `{ network: 'testnet' | 'mainnet', children: ReactNode, queryClient?: QueryClient }`
- **AC Coverage:** AC-1, AC-11

### `useWallet` hook
- **Responsibility:** Expose Freighter wallet connection state and actions
- **Location:** `packages/soroban-react-hooks/src/hooks/useWallet.ts`
- **Returns:** `{ address: string | null, isConnected: boolean, connect: () => Promise<void>, disconnect: () => void, isLoading: boolean, error: StellarKitError | null }`
- **AC Coverage:** AC-2, AC-3, AC-4, AC-9

### `useSorobanQuery` hook
- **Responsibility:** Read contract state via `useQuery`; accepts custom `queryOptions`
- **Location:** `packages/soroban-react-hooks/src/hooks/useSorobanQuery.ts`
- **Accepts:** `(contractId: string, methodName: string, args?: unknown[], queryOptions?: UseQueryOptions)`
- **Returns:** `{ data: T | undefined, isLoading: boolean, error: StellarKitError | null, refetch: () => void }`
- **AC Coverage:** AC-5, AC-6, AC-13

### `useSorobanInvoke` hook
- **Responsibility:** Sign and submit a contract invocation via Freighter; invalidates related queries on success
- **Location:** `packages/soroban-react-hooks/src/hooks/useSorobanInvoke.ts`
- **Accepts:** `(contractId: string, methodName: string)`
- **Returns:** `{ invoke: (args: unknown[]) => Promise<TxResult>, isPending: boolean, error: StellarKitError | null }`
- **AC Coverage:** AC-7, AC-10, AC-12

### `useSorobanBalance` hook
- **Responsibility:** Shorthand for SAC token balance query using `useSorobanQuery`
- **Location:** `packages/soroban-react-hooks/src/hooks/useSorobanBalance.ts`
- **Accepts:** `(contractId: string, address: string | null)`
- **Returns:** `{ balance: string, isLoading: boolean, error: StellarKitError | null }`
- **AC Coverage:** AC-8

### `freighter` adapter module
- **Responsibility:** Wrap `@stellar/freighter-api` calls; handle not-installed and network-mismatch cases
- **Location:** `packages/soroban-react-hooks/src/freighter.ts`
- **AC Coverage:** AC-9, AC-10

## Key Types

```ts
type SorobanContextValue = {
  client: SorobanRpcClient   // from @stellar-solutions/core
  network: 'testnet' | 'mainnet'
  wallet: WalletState
}

type WalletState = {
  address: string | null
  isConnected: boolean
  isLoading: boolean
  error: StellarKitError | null
}
```

## Query Key Convention

```ts
// All query keys are namespaced to enable targeted invalidation
['soroban', contractId, methodName, ...args]
['soroban-balance', contractId, address]
```

After a successful `invoke`, `useSorobanInvoke` calls:
```ts
queryClient.invalidateQueries({ queryKey: ['soroban', contractId] })
```
This invalidates all reads for the contract, triggering refetch. (AC-12)

## Technology Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Async state | TanStack Query v5 | Peer dep in stack; cache, stale-time, background refetch out of box |
| Wallet | @stellar/freighter-api | Official Freighter JS SDK |
| Soroban RPC | @stellar/stellar-sdk SorobanRpc | Part of peer dep; no extra package |

## AC Coverage Map

| AC | Component(s) |
|----|-------------|
| AC-1 | `SorobanProvider` |
| AC-2 | `useWallet`, `freighter` adapter |
| AC-3 | `useWallet` |
| AC-4 | `useWallet` |
| AC-5 | `useSorobanQuery` |
| AC-6 | `useSorobanQuery` (TanStack Query cache) |
| AC-7 | `useSorobanInvoke` |
| AC-8 | `useSorobanBalance` |
| AC-9 | `freighter` adapter, `useWallet` |
| AC-10 | `useSorobanInvoke`, `freighter` adapter |
| AC-11 | `SorobanProvider`, all hooks |
| AC-12 | `useSorobanInvoke` (query invalidation) |
| AC-13 | `useSorobanQuery` |
| AC-14 | `SorobanProvider` (SSR guard), all hooks |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `@stellar/freighter-api` API changes | Medium | High | Pin version, add integration test against real Freighter |
| Soroban XDR decoding complexity | Medium | High | Use `@stellar/stellar-sdk` simulation endpoint; decode via SDK helpers |
| SSR crashes (Next.js) | Medium | Medium | Guard all `window`/`document` access behind `typeof window !== 'undefined'` |

## Out of Scope (Technical)

- Multi-wallet adapter pattern (interface defined but not implemented)
- Server-side contract reads without wallet
- Soroban event streaming
