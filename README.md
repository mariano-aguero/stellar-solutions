# stellar-solutions

[![CI](https://github.com/mariano-aguero/stellar-solutions/actions/workflows/ci.yml/badge.svg)](https://github.com/mariano-aguero/stellar-solutions/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-orange.svg)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

**A monorepo of TypeScript SDKs that bring Stripe-like developer experience to the Stellar blockchain.**

Each package is a standalone, publishable library under the `@stellar-solutions/*` scope. All packages ship dual ESM/CJS output with full TypeScript types, built on top of [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk).

---

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@stellar-solutions/core`](./packages/core) | [![npm](https://img.shields.io/npm/v/@stellar-solutions/core?label=%20&color=gray)](https://www.npmjs.com/package/@stellar-solutions/core) | Shared types, errors, and Horizon/Soroban client |
| [`@stellar-solutions/payments-kit`](./packages/payments-kit) | [![npm](https://img.shields.io/npm/v/@stellar-solutions/payments-kit?label=%20&color=gray)](https://www.npmjs.com/package/@stellar-solutions/payments-kit) | Send payments, query balances and history |
| [`@stellar-solutions/notify`](./packages/notify) | [![npm](https://img.shields.io/npm/v/@stellar-solutions/notify?label=%20&color=gray)](https://www.npmjs.com/package/@stellar-solutions/notify) | Real-time account event streaming with auto-reconnect |
| [`@stellar-solutions/asset-issuer`](./packages/asset-issuer) | [![npm](https://img.shields.io/npm/v/@stellar-solutions/asset-issuer?label=%20&color=gray)](https://www.npmjs.com/package/@stellar-solutions/asset-issuer) | Issue, mint, and burn custom Stellar assets |
| [`@stellar-solutions/batch`](./packages/batch) | [![npm](https://img.shields.io/npm/v/@stellar-solutions/batch?label=%20&color=gray)](https://www.npmjs.com/package/@stellar-solutions/batch) | High-throughput batch payments via channel accounts |
| [`@stellar-solutions/soroban-react-hooks`](./packages/soroban-react-hooks) | [![npm](https://img.shields.io/npm/v/@stellar-solutions/soroban-react-hooks?label=%20&color=gray)](https://www.npmjs.com/package/@stellar-solutions/soroban-react-hooks) | React hooks for Soroban smart contracts (wagmi-like DX) |

---

## Quick start

### Send a payment

```typescript
import { StellarKit } from '@stellar-solutions/payments-kit';

const kit = new StellarKit({ network: 'testnet' });

const result = await kit.pay({
  from: 'S...',
  to: 'G...',
  amount: '10',
  asset: 'native',
});
console.log(result.hash);
```

### Watch an account in real-time

```typescript
import { StellarNotify } from '@stellar-solutions/notify';

const notify = new StellarNotify({ network: 'testnet' });
const handle = notify.watch('G...');

handle.on('payment', (event) => console.log('Payment received:', event.amount));
handle.on('error', (err) => console.error(err));
```

### Issue a custom asset

```typescript
import { StellarIssuer } from '@stellar-solutions/asset-issuer';

const issuer = new StellarIssuer({
  network: 'testnet',
  fundingSecretKey: 'S...',
});

const asset = await issuer.createAsset({ code: 'MYTKN', totalSupply: '1000000' });
await issuer.mintTo('G...recipient', '5000');

const holders = await issuer.getHolders();
```

### Send payments in parallel

```typescript
import { StellarBatch } from '@stellar-solutions/batch';

const batch = new StellarBatch({
  secretKey: 'S...',
  network: 'testnet',
});

const result = await batch.send([
  { to: 'G...alice', amount: '10', asset: 'native' },
  { to: 'G...bob',   amount: '25', asset: 'native' },
  { to: 'G...carol', amount: '5',  asset: { code: 'USDC', issuer: 'G...' } },
]);

console.log(`Sent: ${result.successful} / ${result.successful + result.failed}`);
```

### React hooks for Soroban

```tsx
import { SorobanProvider, useWallet, useSorobanQuery } from '@stellar-solutions/soroban-react-hooks';

function App() {
  return (
    <SorobanProvider network="testnet">
      <WalletButton />
    </SorobanProvider>
  );
}

function WalletButton() {
  const { address, isConnected, connect } = useWallet();
  return (
    <button onClick={connect}>
      {isConnected ? address : 'Connect Freighter'}
    </button>
  );
}
```

---

## Repository structure

```
packages/
  core/                   # Internal — shared types, errors, network client
  payments-kit/           # Send payments, query balance & history
  notify/                 # Real-time event streaming
  asset-issuer/           # Asset lifecycle management
  batch/                  # Batch payments with channel accounts
  soroban-react-hooks/    # React hooks for Soroban
examples/
  payments-kit-node/      # Send payment, query balance & history (Node)
  notify-node/            # Watch account events in real-time (Node)
  asset-issuer-node/      # Create/mint/burn a custom asset (Node)
  batch-node/             # Send 50 parallel payments (Node)
  soroban-hooks-vite/     # Freighter wallet + Soroban hooks (Vite + React)
```

---

## Development

**Prerequisites:** Node.js 20+, pnpm 9+

```bash
# Install
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Typecheck
pnpm typecheck

# Lint
pnpm lint
```

### Running a single package

```bash
pnpm --filter @stellar-solutions/payments-kit test
pnpm --filter @stellar-solutions/payments-kit build
pnpm --filter @stellar-solutions/payments-kit dev   # watch mode
```

### Integration tests

Integration tests run against **Stellar Testnet**. Fund a fresh testnet account with [Friendbot](https://friendbot.stellar.org) and export its secret:

```bash
export STELLAR_TEST_SECRET_KEY=S...
pnpm --filter @stellar-solutions/payments-kit test:integration
```

### Running examples

```bash
# Node examples — require env vars (see each example's src/index.ts)
pnpm --filter example-payments-kit-node start
pnpm --filter notify-node-example start
pnpm --filter asset-issuer-node-example start
pnpm --filter batch-node-example start

# Vite example — requires Freighter extension in the browser
pnpm --filter example-soroban-hooks-vite dev
```

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a PR.

---

## License

[MIT](./LICENSE) © Mariano Aguero
