# @stellar-solutions/payments-kit

## 0.1.0

### Minor Changes

- c991af2: Initial open-source release.

  - `@stellar-solutions/core` — shared Horizon/Soroban client, typed errors, network config, keypair + amount utilities (bigint-safe `toStroops`/`fromStroops`)
  - `@stellar-solutions/payments-kit` — `StellarKit` class and functional API for sending payments, querying balance, and fetching transaction or payment history with `tx_bad_seq` retry handling
  - `@stellar-solutions/notify` — real-time account event streaming via Horizon `/operations`, with exponential-backoff reconnect, cursor persistence, and typed `payment` / `soroban` / `other` events
  - `@stellar-solutions/asset-issuer` — asset lifecycle (`StellarIssuer` class): create issuer + distributor accounts, establish trustline, mint, burn, optional issuer lock, holder enumeration; secret keys kept non-enumerable on the result object
  - `@stellar-solutions/batch` — high-throughput batch payments with channel-account parallelism, `Promise.allSettled` per-channel fault isolation, absolute failure indexing, independent `tx_bad_seq` retry budget
  - `@stellar-solutions/soroban-react-hooks` — wagmi-like React hooks for Soroban: `useWallet`, `useSorobanQuery`, `useSorobanBalance` (SAC simulation), `useSorobanInvoke` (generic over args); bigint-safe query keys; `'use client'` directives for Next.js App Router; Freighter wallet integration with strict network matching

### Patch Changes

- Updated dependencies [c991af2]
  - @stellar-solutions/core@0.1.0
