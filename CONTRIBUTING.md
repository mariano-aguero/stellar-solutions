# Contributing to stellar-solutions

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Table of contents

- [Code of Conduct](#code-of-conduct)
- [Getting started](#getting-started)
- [Development workflow](#development-workflow)
- [Project structure](#project-structure)
- [Writing code](#writing-code)
- [Testing](#testing)
- [Changesets and versioning](#changesets-and-versioning)
- [Submitting a pull request](#submitting-a-pull-request)

---

## Code of Conduct

Be respectful. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

---

## Getting started

**Prerequisites:** Node.js 20+, pnpm 9+

```bash
# Clone the repo
git clone https://github.com/mariano-aguero/stellar-solutions.git
cd stellar-solutions

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

---

## Development workflow

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @stellar-solutions/payments-kit test

# Watch mode for a package
pnpm --filter @stellar-solutions/payments-kit exec vitest

# Typecheck everything
pnpm typecheck

# Lint + format check
pnpm lint

# Auto-format
pnpm format
```

---

## Project structure

```
packages/
  core/               # Shared types, errors, network client — internal dependency
  payments-kit/       # Send, receive, and query payments
  notify/             # Real-time account event streaming
  asset-issuer/       # Issue and manage custom Stellar assets
  batch/              # High-throughput batch payments via channel accounts
  soroban-react-hooks/ # React hooks for Soroban smart contracts
examples/
  soroban-hooks-vite/ # Demo app using soroban-react-hooks
```

Each package is independently publishable under the `@stellar-solutions/*` scope.

---

## Writing code

- **TypeScript strict mode** — no `any`, use `unknown` and narrow explicitly
- **No `console.log`** in library code — libraries must not produce side-effect output
- **All public errors extend `StellarKitError`** from `@stellar-solutions/core`
- **Validate all public inputs** before any network call — throw typed errors early
- **No `require()`** — ESM source only; tsup handles CJS output
- **No mutable module-level state**
- See [`constitution.md`](./constitution.md) for the full list of constraints

---

## Testing

### Unit tests

Unit tests use Vitest and must **never make real network calls** — mock all Horizon responses.

```bash
pnpm test                                        # all packages
pnpm --filter @stellar-solutions/core test       # single package
```

### Integration tests

Integration tests run against **Stellar Testnet** only. You need a funded testnet account:

```bash
export STELLAR_TEST_SECRET_KEY=S...
pnpm --filter @stellar-solutions/payments-kit test:integration
```

To fund a testnet account use [Friendbot](https://friendbot.stellar.org/?addr=<your-public-key>).

**Never use mainnet keys in tests.**

---

## Changesets and versioning

This monorepo uses [Changesets](https://github.com/changesets/changesets) for semantic versioning.

If your PR changes a published package, you **must** add a changeset:

```bash
pnpm changeset
```

Select the affected packages, choose the bump level (`patch` / `minor` / `major`), and describe the change. Commit the generated file in `.changeset/` with your PR.

- `patch` — bug fixes, internal refactors with no API changes
- `minor` — new functionality, backwards-compatible
- `major` — breaking changes

Changes to `examples/` or `docs/` do not require a changeset.

---

## Submitting a pull request

1. Fork the repo and create a branch: `git checkout -b feat/my-feature`
2. Make your changes following the guidelines above
3. Add a changeset if needed: `pnpm changeset`
4. Ensure tests pass: `pnpm test && pnpm typecheck`
5. Push and open a PR against `main`
6. Fill in the PR template completely

PRs that fail CI or are missing a changeset will not be merged.
