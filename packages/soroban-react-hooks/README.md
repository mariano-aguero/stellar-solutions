# @stellar-solutions/soroban-react-hooks

[![npm](https://img.shields.io/npm/v/@stellar-solutions/soroban-react-hooks?color=gray)](https://www.npmjs.com/package/@stellar-solutions/soroban-react-hooks)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

React hooks for Soroban smart contracts on Stellar. Wagmi-like DX — connect Freighter wallet, query contracts, invoke transactions, and subscribe to balance updates with full TanStack Query caching.

All hook files ship with a `"use client"` directive so they work inside Next.js App Router Server Components (import transitively — the runtime stays client-side).

---

## Installation

```bash
pnpm add @stellar-solutions/soroban-react-hooks @stellar/stellar-sdk @stellar/freighter-api @tanstack/react-query react
```

## Peer dependencies

| Dependency | Version |
|------------|---------|
| `react` | `>=19.0.0` |
| `@stellar/stellar-sdk` | `>=12.0.0` |
| `@stellar/freighter-api` | `>=3.0.0` |
| `@tanstack/react-query` | `>=5.0.0` |

---

## Setup

`SorobanProvider` creates its own internal `QueryClient` — no extra `QueryClientProvider` needed. If you already have a `QueryClient` in your app, pass it via the `queryClient` prop to share caches.

```tsx
import { SorobanProvider } from '@stellar-solutions/soroban-react-hooks';

export function App() {
  return (
    <SorobanProvider network="testnet">
      <YourApp />
    </SorobanProvider>
  );
}

// — or share an existing QueryClient:
<SorobanProvider network="testnet" queryClient={myQueryClient}>
  <YourApp />
</SorobanProvider>
```

Switching `network` at runtime automatically clears the connected wallet — a testnet-authenticated address is never silently reused on mainnet.

---

## Hooks

### `useWallet()`

Connect and manage the Freighter wallet.

```tsx
import { useWallet } from '@stellar-solutions/soroban-react-hooks';

function WalletButton() {
  const { address, isConnected, isLoading, error, connect, disconnect } = useWallet();

  if (isLoading) return <span>Connecting…</span>;
  if (error) return <span>Error: {error.message}</span>;

  return isConnected ? (
    <>
      <span>{address}</span>
      <button onClick={disconnect}>Disconnect</button>
    </>
  ) : (
    <button onClick={connect}>Connect Freighter</button>
  );
}
```

| Return | Type |
|--------|------|
| `address` | `string \| null` |
| `isConnected` | `boolean` |
| `isLoading` | `boolean` |
| `error` | `StellarKitError \| null` |
| `connect` | `() => Promise<void>` |
| `disconnect` | `() => void` |

`connect` and `disconnect` are referentially stable across renders (wrapped in `useCallback` with `network` as a dep) — safe to put in `useEffect` dependencies.

---

### `useSorobanQuery(contractId, methodName, options?)`

Read data from a Soroban contract. Backed by TanStack Query — results are cached, deduplicated, and invalidated by `useSorobanInvoke` on successful mutations to the same contract.

```tsx
import { useSorobanQuery } from '@stellar-solutions/soroban-react-hooks';

function TokenName({ tokenId }: { tokenId: string }) {
  const { data, isLoading } = useSorobanQuery<string>(tokenId, 'name', {
    queryFn: async (rpc) => { /* simulate and decode */ },
  });

  return isLoading ? <span>…</span> : <span>{data}</span>;
}
```

| Option | Type | Description |
|--------|------|-------------|
| `queryFn` | `(rpc) => Promise<T>` | Custom function that performs the simulation/decode |
| `args` | `readonly unknown[]` | Query args — included in cache key. **Bigint-safe**: i128/u128 values are serialised without throwing |
| `enabled` | `boolean` | Set `false` to skip the query |
| `staleTime` | `number` | Default `10_000` ms |

---

### `useSorobanBalance(contractId, address)`

Convenience hook for the SAC (Stellar Asset Contract) `balance` method. Runs simulation only — no signing required. Returns `'0'` when the address has no balance entry for the contract.

```tsx
import { useSorobanBalance, useWallet } from '@stellar-solutions/soroban-react-hooks';

function Balance({ tokenId }: { tokenId: string }) {
  const { address } = useWallet();
  const { data: balance, isLoading } = useSorobanBalance(tokenId, address);

  return <span>{isLoading ? '…' : balance}</span>;
}
```

The query is automatically disabled while `address` is `null`.

---

### `useSorobanInvoke(contractId, methodName, options?)`

Invoke a state-changing Soroban contract method. On success, invalidates all queries under the `['soroban', contractId]` prefix so balances/reads re-fetch automatically.

```tsx
import { useSorobanInvoke } from '@stellar-solutions/soroban-react-hooks';
import type { TxResult } from '@stellar-solutions/soroban-react-hooks';

function TransferButton({ tokenId, from, to }: { tokenId: string; from: string; to: string }) {
  const { invoke, isPending, error, data } = useSorobanInvoke<[string, string, bigint]>(
    tokenId,
    'transfer',
    {
      mutateFn: async (rpc, [fromArg, toArg, amount]) => {
        // build, sign with Freighter, send via rpc; return TxResult
      },
    },
  );

  return (
    <>
      <button onClick={() => invoke([from, to, 1_000_000n])} disabled={isPending}>
        {isPending ? 'Submitting…' : 'Transfer'}
      </button>
      {error && <p>{error.message}</p>}
      {data && <p>Tx: {data.hash}</p>}
    </>
  );
}
```

The hook is **generic over args** — `useSorobanInvoke<[string, string, bigint]>(…)` gives you typed `invoke(args)` at the call site.

| Return | Type |
|--------|------|
| `invoke` | `(args: TArgs) => Promise<TxResult>` |
| `isPending` | `boolean` |
| `error` | `StellarKitError \| null` |
| `data` | `TxResult \| undefined` |

---

## Error handling

```typescript
import {
  StellarKitError,
  FreighterNotInstalledError,
  NetworkMismatchError,
  NetworkTimeoutError,
} from '@stellar-solutions/soroban-react-hooks';
```

- `FreighterNotInstalledError` — user doesn't have the Freighter extension
- `NetworkMismatchError` — wallet is on a different network than the `SorobanProvider`. Strict Freighter-network → `'testnet'`/`'mainnet'` mapping; custom/futurenet is rejected.
- `NetworkTimeoutError` — RPC call timed out

All errors thrown by hooks are normalised to `StellarKitError` — consumers never have to type-check raw SDK errors.

---

## License

[MIT](../../LICENSE) © Mariano Aguero
