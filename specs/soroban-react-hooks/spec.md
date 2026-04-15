# @stellar-solutions/soroban-react-hooks

Status: Draft
Version: 1.0
Last updated: 2026-04-15

## Overview

A set of React 19 hooks and a context provider that simplify connecting to the Freighter
wallet and interacting with Soroban smart contracts — providing a wagmi-like DX for the
Stellar ecosystem.

## User Stories

### Primary
As a React developer building a dApp on Soroban, I want hooks for wallet connection and
contract interaction so that I can focus on my UI without writing wallet and XDR boilerplate.

### Secondary
As a developer, I want query results cached and automatically refreshed so that my UI
reflects on-chain state without manual polling logic.

---

## Boundaries

**Always do:**
- Require `SorobanProvider` to wrap the application; throw a descriptive error if hooks are used outside it
- Use TanStack Query v5 for all reads — never raw `useEffect` + `useState` for async data
- Sign transactions in the wallet (Freighter) — never receive or handle private keys

**Ask first:**
- Adding support for a second wallet (xBull, Lobstr, etc.) — deferred to v2
- Changing the `QueryClient` config defaults

**Never do:**
- Accept private keys or seed phrases as arguments
- Expose raw XDR strings in hook return values (always decode to typed objects)
- Throw unhandled promise rejections — all async errors must surface via hook `error` state

---

## Acceptance Criteria

### AC-1: Provider setup [MUST]
Given `<SorobanProvider network="testnet">` wraps the React tree
When a child component calls `useWallet()` or `useSorobanQuery(...)`
Then the hooks return their initial state without throwing, confirming context is available

### AC-2: Connect Freighter wallet [MUST]
Given Freighter extension is installed in the browser
When `const { connect } = useWallet()` is called and `connect()` is invoked
Then Freighter prompts the user for permission and `address` is populated with the public key

### AC-3: Wallet connection state [MUST]
Given `useWallet()` is used in a component
Then it returns `{ address, isConnected, connect, disconnect, isLoading, error }`

### AC-4: Disconnect wallet [MUST]
Given the wallet is connected
When `disconnect()` is called
Then `address` becomes `null` and `isConnected` becomes `false`

### AC-5: Read contract state [MUST]
Given a valid `contractId` and `methodName` with `args`
When `useSorobanQuery(contractId, methodName, args)` is called
Then it returns `{ data, isLoading, error, refetch }` backed by TanStack Query

### AC-6: Query cache and stale-while-revalidate [MUST]
Given `useSorobanQuery` has fetched data
When the component re-renders without cache expiry
Then the cached value is returned immediately without a network round-trip

### AC-7: Invoke contract function [MUST]
Given a valid `contractId` and `methodName`
When `const { invoke, isPending, error } = useSorobanInvoke(contractId, methodName)` is called
And `invoke(args)` is called
Then Freighter prompts the user to sign the transaction, submits it, and returns a `TxResult`

### AC-8: Token balance shorthand [MUST]
Given a SAC (Stellar Asset Contract) `contractId` and an account `address`
When `useSorobanBalance(contractId, address)` is called
Then it returns `{ balance: string, isLoading, error }` with the token balance as a decimal string

### AC-9: Freighter not installed [MUST]
Given Freighter extension is not installed in the browser
When `connect()` is called
Then `error` is set to `FreighterNotInstalledError` and no unhandled exception is thrown

### AC-10: Network mismatch [MUST]
Given the wallet is connected to a different network than `SorobanProvider`
When `invoke(args)` is called
Then `NetworkMismatchError` is thrown with a message indicating expected vs actual network

### AC-11: Hook used outside Provider [MUST]
Given a component uses `useWallet()` without a parent `SorobanProvider`
When the component renders
Then a descriptive `Error` is thrown: "useWallet must be used within a SorobanProvider"

### AC-12: Query invalidation after invoke [MUST]
Given `useSorobanQuery` and `useSorobanInvoke` share the same `contractId`
When `invoke` completes successfully
Then `useSorobanQuery` automatically refetches to reflect updated on-chain state

### AC-13: Custom query options [SHOULD]
Given a developer passes `queryOptions: { staleTime: 60_000 }` to `useSorobanQuery`
Then TanStack Query respects those options for that specific query

### AC-14: SSR compatibility [SHOULD]
Given the package is imported in a Next.js Server Component
When the module is loaded
Then no browser-only APIs (window, document) are accessed at module initialization time;
wallet hooks return `{ isConnected: false }` during SSR

### AC-15: Multi-wallet [WONT]
This SDK will NOT support xBull, Lobstr, or other wallets in v1.
Reason: Freighter covers the target audience; multi-wallet adds significant complexity.
The `WalletAdapter` interface is designed for extensibility but not implemented.

---

## Out of Scope

- Non-Soroban (classic Stellar) transactions — use `@stellar-solutions/payments-kit`
- Server-side contract invocations without a wallet
- Mobile wallet support (WalletConnect)
- Multi-signature Soroban transactions

---

## Open Questions

- [RESOLVED] Wallet support → Freighter only in v1; interface is extensible
- [RESOLVED] State management for queries → TanStack Query v5 (peer dep)
- [RESOLVED] SSR behavior → graceful degradation, no crash on server

---

## Non-Functional Requirements

- Bundle size: < 20KB gzipped (excluding React, TanStack Query, and Stellar SDK peer deps)
- React version: peer dep `react >= 19.0.0`
- TanStack Query: peer dep `@tanstack/react-query >= 5.0.0`
- TypeScript: strict, full generics for contract return types where possible
- No side effects at module load time (tree-shakeable)
