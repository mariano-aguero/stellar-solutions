# Task List: @stellar-solutions/soroban-react-hooks

## Plan Reference
Implements: `specs/soroban-react-hooks/plan.md`

## Tasks

### Freighter adapter

- [ ] **TASK-001** [S] Write tests for freighter adapter
  - Tests: AC-9 (not installed → FreighterNotInstalledError), AC-10 (network mismatch → NetworkMismatchError)
  - Creates: `src/__tests__/freighter.test.ts`
  - Depends on: monorepo-setup TASK-012

- [ ] **TASK-002** [S] Implement freighter adapter
  - Creates: `src/freighter.ts`
  - Wraps: `@stellar/freighter-api` — getAddress, isConnected, signTransaction
  - Depends on: TASK-001

### Context / Provider

- [ ] **TASK-003** [M] Write tests for SorobanProvider
  - Tests: AC-1 (context available after mount), AC-11 (hook outside provider throws)
  - Creates: `src/__tests__/SorobanProvider.test.tsx`
  - Depends on: TASK-002

- [ ] **TASK-004** [M] Implement SorobanProvider
  - Creates: `src/context/SorobanProvider.tsx`, `src/context/SorobanContext.ts`
  - Wraps tree with `QueryClientProvider` + custom context
  - Depends on: TASK-003

### useWallet hook

- [ ] **TASK-005** [M] [P] Write tests for useWallet
  - Tests: AC-2 (connect populates address), AC-3 (return shape), AC-4 (disconnect clears address)
  - Creates: `src/__tests__/useWallet.test.tsx`
  - Depends on: TASK-004

- [ ] **TASK-006** [M] Implement useWallet
  - Creates: `src/hooks/useWallet.ts`
  - Depends on: TASK-005

### useSorobanQuery hook

- [ ] **TASK-007** [M] [P] Write tests for useSorobanQuery
  - Tests: AC-5 (returns data), AC-6 (cache hit, no re-fetch), AC-13 (queryOptions respected)
  - Creates: `src/__tests__/useSorobanQuery.test.tsx`
  - Depends on: TASK-004

- [ ] **TASK-008** [M] Implement useSorobanQuery
  - Creates: `src/hooks/useSorobanQuery.ts`
  - Uses: TanStack Query v5 `useQuery`
  - Depends on: TASK-007

### useSorobanInvoke hook

- [ ] **TASK-009** [M] Write tests for useSorobanInvoke
  - Tests: AC-7 (successful invoke → TxResult), AC-12 (query invalidated after invoke)
  - Creates: `src/__tests__/useSorobanInvoke.test.tsx`
  - Depends on: TASK-006, TASK-008

- [ ] **TASK-010** [M] Implement useSorobanInvoke
  - Creates: `src/hooks/useSorobanInvoke.ts`
  - Uses: TanStack Query v5 `useMutation` + `queryClient.invalidateQueries`
  - Depends on: TASK-009

### useSorobanBalance hook

- [ ] **TASK-011** [S] Write tests for useSorobanBalance
  - Tests: AC-8 (returns decimal string balance)
  - Creates: `src/__tests__/useSorobanBalance.test.tsx`
  - Depends on: TASK-008

- [ ] **TASK-012** [S] Implement useSorobanBalance
  - Creates: `src/hooks/useSorobanBalance.ts`
  - Thin wrapper over `useSorobanQuery` with SAC `balance` method
  - Depends on: TASK-011

### SSR guard + index

- [ ] **TASK-013** [S] Add SSR guard and export index
  - Tests: AC-14 — import in Node environment does not throw
  - Creates: `src/index.ts` with all public exports
  - Depends on: TASK-004, TASK-006, TASK-008, TASK-010, TASK-012

### Example

- [ ] **TASK-014** [L] Implement soroban-hooks-vite example app
  - Creates: `examples/soroban-hooks-vite/` — Vite + React 19 app
  - Demonstrates: wallet connect, contract query, contract invoke
  - Creates: `examples/soroban-hooks-vite/README.md`
  - Depends on: TASK-013

## Legend
- `[S]` Small — under 1 hour
- `[M]` Medium — 1–3 hours
- `[L]` Large — 3–6 hours
- `[P]` Parallelizable
