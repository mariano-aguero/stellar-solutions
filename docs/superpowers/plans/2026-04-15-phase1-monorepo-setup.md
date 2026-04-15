# Phase 1: Monorepo Infrastructure Setup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a working pnpm + Turborepo monorepo with Biome, tsup, Vitest, and GitHub Actions so that all subsequent package implementations have a consistent, working foundation.

**Architecture:** Root workspace declares all packages and examples. Turborepo pipeline ensures `core` builds before any dependent SDK. Biome replaces ESLint+Prettier with a single config. Each package uses an identical tsup config template.

**Tech Stack:** pnpm 9+, Turborepo, tsup, Biome, Vitest, TypeScript 5.x, Changesets, GitHub Actions

**Spec:** `specs/monorepo-setup/spec.md`

---

## File Map

```
/
├── package.json                          CREATE — root, private, scripts
├── pnpm-workspace.yaml                   CREATE
├── turbo.json                            CREATE
├── tsconfig.base.json                    CREATE
├── biome.json                            CREATE
├── .npmrc                                CREATE
├── .gitignore                            MODIFY (already exists)
├── .changeset/
│   └── config.json                       CREATE
├── .github/
│   └── workflows/
│       ├── ci.yml                        CREATE
│       └── release.yml                   CREATE
├── packages/
│   ├── core/
│   │   ├── package.json                  CREATE
│   │   ├── tsconfig.json                 CREATE
│   │   ├── tsup.config.ts                CREATE
│   │   ├── vitest.config.ts              CREATE
│   │   └── src/index.ts                  CREATE (placeholder)
│   ├── payments-kit/    (same structure) CREATE
│   ├── soroban-react-hooks/              CREATE
│   ├── asset-issuer/                     CREATE
│   ├── notify/                           CREATE
│   └── batch/                            CREATE
└── examples/
    ├── payments-kit-node/
    │   ├── package.json                  CREATE
    │   └── src/index.ts                  CREATE (placeholder)
    ├── asset-issuer-node/                CREATE
    ├── notify-node/                      CREATE
    ├── batch-node/                       CREATE
    └── soroban-hooks-vite/               CREATE (Vite app)
```

---

### Task 1: Root workspace files

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.npmrc`
- Modify: `.gitignore`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "stellar-solutions",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "dev": "turbo run dev --parallel",
    "lint": "biome check .",
    "format": "biome format --write .",
    "release": "changeset publish",
    "version-packages": "changeset version"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@changesets/cli": "^2.27.0",
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'packages/*'
  - 'examples/*'
```

- [ ] **Step 3: Create `.npmrc`**

```
shamefully-hoist=false
strict-peer-dependencies=false
auto-install-peers=true
```

- [ ] **Step 4: Update `.gitignore`**

```
node_modules/
dist/
.turbo/
*.tsbuildinfo
.env
.env.local
.env.*.local
coverage/
```

- [ ] **Step 5: Run `pnpm install` to verify workspace is recognized**

```bash
pnpm install
```
Expected: no errors, `node_modules/.pnpm` exists at root

---

### Task 2: TypeScript base config

**Files:**
- Create: `tsconfig.base.json`

- [ ] **Step 1: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true
  }
}
```

---

### Task 3: Biome config

**Files:**
- Create: `biome.json`

- [ ] **Step 1: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noConsoleLog": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  },
  "files": {
    "ignore": ["**/dist/**", "**/node_modules/**", "**/*.d.ts"]
  }
}
```

- [ ] **Step 2: Verify Biome runs from root**

```bash
pnpm lint
```
Expected: exits 0 (no files to lint yet)

---

### Task 4: Turborepo pipeline

**Files:**
- Create: `turbo.json`

- [ ] **Step 1: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsup.config.ts", "tsconfig.json", "package.json"],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.json"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "vitest.config.ts"],
      "cache": false
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

---

### Task 5: Scaffold all packages

**Files:** `packages/core/`, `packages/payments-kit/`, `packages/soroban-react-hooks/`, `packages/asset-issuer/`, `packages/notify/`, `packages/batch/`

Each package follows this template. Apply for all 6.

- [ ] **Step 1: Create `packages/core/package.json`**

```json
{
  "name": "@stellar-solutions/core",
  "version": "0.1.0",
  "description": "Shared utilities, types, and Horizon client for stellar-solutions SDKs",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/mariano-aguero/stellar-solutions"
  },
  "keywords": ["stellar", "blockchain", "sdk", "core"],
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:integration": "vitest run --reporter=verbose src/__tests__/integration"
  },
  "peerDependencies": {
    "@stellar/stellar-sdk": ">=12.0.0"
  },
  "devDependencies": {
    "@stellar/stellar-sdk": "^13.0.0",
    "tsup": "^8.3.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `packages/core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/core/tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['@stellar/stellar-sdk'],
});
```

- [ ] **Step 4: Create `packages/core/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    exclude: ['src/__tests__/integration/**'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
```

- [ ] **Step 5: Create `packages/core/src/index.ts` placeholder**

```ts
export const STELLAR_SOLUTIONS_CORE_VERSION = '0.1.0';
```

- [ ] **Step 6: Repeat steps 1–5 for `payments-kit`, `asset-issuer`, `notify`, `batch`**

For `payments-kit/package.json`, add internal dep:
```json
"dependencies": {
  "@stellar-solutions/core": "workspace:*"
}
```
Do the same for `asset-issuer`, `notify`, `batch`.

- [ ] **Step 7: Create `packages/soroban-react-hooks/package.json`** (different peer deps)

```json
{
  "name": "@stellar-solutions/soroban-react-hooks",
  "version": "0.1.0",
  "description": "React hooks for Soroban smart contracts — wagmi-like DX for Stellar",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/mariano-aguero/stellar-solutions"
  },
  "keywords": ["stellar", "soroban", "react", "hooks", "freighter"],
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:integration": "vitest run --reporter=verbose src/__tests__/integration"
  },
  "dependencies": {
    "@stellar-solutions/core": "workspace:*"
  },
  "peerDependencies": {
    "@stellar/stellar-sdk": ">=12.0.0",
    "@stellar/freighter-api": ">=3.0.0",
    "@tanstack/react-query": ">=5.0.0",
    "react": ">=19.0.0"
  },
  "devDependencies": {
    "@stellar/stellar-sdk": "^13.0.0",
    "@stellar/freighter-api": "^3.0.0",
    "@tanstack/react-query": "^5.60.0",
    "@testing-library/react": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "jsdom": "^25.0.0",
    "tsup": "^8.3.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

For `soroban-react-hooks/tsup.config.ts`, add JSX:
```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@stellar/stellar-sdk', '@stellar/freighter-api', '@tanstack/react-query'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
```

For `soroban-react-hooks/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['src/__tests__/integration/**'],
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
    },
  },
});
```

- [ ] **Step 8: Run `pnpm install` and verify workspace links**

```bash
pnpm install
ls packages/payments-kit/node_modules/@stellar-solutions/
```
Expected: `core` symlink present

---

### Task 6: Build verification

- [ ] **Step 1: Run full build from root**

```bash
pnpm build
```
Expected: all 6 packages show `dist/index.mjs`, `dist/index.js`, `dist/index.d.ts`

- [ ] **Step 2: Verify Turborepo respected dependency order**

Output should show `core` completing before `payments-kit`, `asset-issuer`, `notify`, `batch`, `soroban-react-hooks`.

- [ ] **Step 3: Commit**

```bash
git add packages/ pnpm-workspace.yaml turbo.json tsconfig.base.json biome.json .npmrc
git commit -m "feat(monorepo): scaffold all package skeletons with tsup + Turborepo pipeline"
```

---

### Task 7: Scaffold examples

**Files:** `examples/payments-kit-node/`, `examples/asset-issuer-node/`, `examples/notify-node/`, `examples/batch-node/`

- [ ] **Step 1: Create `examples/payments-kit-node/package.json`**

```json
{
  "name": "example-payments-kit-node",
  "version": "0.0.0",
  "private": true,
  "description": "Example: send payments with @stellar-solutions/payments-kit on testnet",
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts"
  },
  "dependencies": {
    "@stellar-solutions/payments-kit": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create `examples/payments-kit-node/src/index.ts` placeholder**

```ts
// Placeholder — implemented in Phase 3
console.log('payments-kit example — run after Phase 3');
```

- [ ] **Step 3: Repeat for `asset-issuer-node`, `notify-node`, `batch-node`** with matching package names and deps

- [ ] **Step 4: Create `examples/soroban-hooks-vite/` using Vite**

```bash
pnpm create vite examples/soroban-hooks-vite --template react-ts
cd examples/soroban-hooks-vite
```

Then update its `package.json` dependencies:
```json
{
  "dependencies": {
    "@stellar-solutions/soroban-react-hooks": "workspace:*",
    "@stellar/stellar-sdk": "^13.0.0",
    "@stellar/freighter-api": "^3.0.0",
    "@tanstack/react-query": "^5.60.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

- [ ] **Step 5: Run `pnpm install` from root**

```bash
pnpm install
```

- [ ] **Step 6: Commit examples scaffold**

```bash
git add examples/
git commit -m "feat(examples): scaffold all example app skeletons"
```

---

### Task 8: Changeset config

**Files:** `.changeset/config.json`

- [ ] **Step 1: Initialize changesets**

```bash
pnpm changeset init
```

- [ ] **Step 2: Edit `.changeset/config.json`**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- [ ] **Step 3: Commit**

```bash
git add .changeset/
git commit -m "chore: initialize changesets for npm publishing"
```

---

### Task 9: GitHub Actions

**Files:** `.github/workflows/ci.yml`, `.github/workflows/release.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    name: Typecheck, Build, Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Build
        run: pnpm build

      - name: Lint
        run: pnpm lint

      - name: Test (unit only)
        run: pnpm test
```

- [ ] **Step 2: Create `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm build

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm release
          title: 'chore: version packages'
          commit: 'chore: version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions for CI and npm release via changesets"
```

---

### Task 10: Verify full pipeline

- [ ] **Step 1: Run all checks from root**

```bash
pnpm install && pnpm build && pnpm typecheck && pnpm lint && pnpm test
```
Expected: all pass

- [ ] **Step 2: Push to GitHub and verify CI is green**

```bash
git push -u origin main
```
Open `https://github.com/mariano-aguero/stellar-solutions/actions` — CI workflow should run and pass.

- [ ] **Step 3: Add `NPM_TOKEN` secret to GitHub repo**

Go to: `Settings → Secrets and variables → Actions → New repository secret`
Name: `NPM_TOKEN`
Value: your npm token with publish access

---

**Phase 1 complete.** Proceed to `2026-04-15-phase2-core.md`.
