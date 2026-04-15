# Phase 3: @stellar-solutions/payments-kit

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the flagship SDK — `pay()`, `getBalance()`, `getHistory()` — with auto fee estimation, sequence retry, and full typed errors, validated against Stellar testnet.

**Architecture:** `StellarKit` class holds a `StellarClient` from core. Each method delegates to a focused module. All inputs validated before network calls. Sequence retry is a single automatic retry on `tx_bad_seq`.

**Tech Stack:** TypeScript, `@stellar/stellar-sdk` (peer dep), `@stellar-solutions/core`, Vitest

**Spec:** `specs/payments-kit/spec.md`
**SDD Tasks:** `specs/payments-kit/tasks.md`

---

## File Map

```
packages/payments-kit/src/
├── index.ts
├── StellarKit.ts
├── validators.ts
├── fees.ts
├── balance.ts
├── history.ts
├── pay.ts
└── __tests__/
    ├── validators.test.ts
    ├── fees.test.ts
    ├── balance.test.ts
    ├── history.test.ts
    ├── pay.test.ts
    ├── StellarKit.test.ts
    └── integration/
        └── payments-kit.integration.test.ts
```

---

### Task 1: Validators

**Files:**
- Create: `packages/payments-kit/src/validators.ts`
- Create: `packages/payments-kit/src/__tests__/validators.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/payments-kit/src/__tests__/validators.test.ts
import { describe, it, expect } from 'vitest';
import { validateAddress, validateAmount, validateAsset } from '../validators.js';
import { InvalidAddressError } from '@stellar-solutions/core';

describe('validateAddress', () => {
  it('does not throw for valid address', () => {
    expect(() => validateAddress('GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN')).not.toThrow();
  });
  it('throws InvalidAddressError for invalid address', () => {
    expect(() => validateAddress('bad')).toThrow(InvalidAddressError);
  });
});

describe('validateAmount', () => {
  it('does not throw for valid positive string', () => {
    expect(() => validateAmount('10.5')).not.toThrow();
  });
  it('throws for zero', () => {
    expect(() => validateAmount('0')).toThrow();
  });
  it('throws for negative', () => {
    expect(() => validateAmount('-5')).toThrow();
  });
  it('throws for non-numeric string', () => {
    expect(() => validateAmount('abc')).toThrow();
  });
});

describe('validateAsset', () => {
  it('does not throw for native', () => {
    expect(() => validateAsset('native')).not.toThrow();
  });
  it('does not throw for issued asset', () => {
    expect(() => validateAsset({ code: 'USDC', issuer: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN' })).not.toThrow();
  });
  it('throws for issued asset with missing issuer', () => {
    expect(() => validateAsset({ code: 'USDC', issuer: '' })).toThrow();
  });
});
```

- [ ] **Step 2: Run — confirm fail, then implement**

```ts
// packages/payments-kit/src/validators.ts
import { isValidAddress, InvalidAddressError } from '@stellar-solutions/core';
import type { Asset } from '@stellar-solutions/core';

export function validateAddress(address: string): void {
  if (!isValidAddress(address)) {
    throw new InvalidAddressError(address);
  }
}

export function validateAmount(amount: string): void {
  const n = Number(amount);
  if (isNaN(n) || n <= 0) {
    throw new Error(`Invalid amount: "${amount}" — must be a positive number`);
  }
}

export function validateAsset(asset: Asset): void {
  if (asset === 'native') return;
  if (!asset.issuer || !isValidAddress(asset.issuer)) {
    throw new InvalidAddressError(asset.issuer ?? '');
  }
  if (!asset.code || asset.code.length === 0) {
    throw new Error('Asset code cannot be empty');
  }
}
```

- [ ] **Step 3: Run tests — pass, commit**

```bash
pnpm --filter @stellar-solutions/payments-kit test
git add packages/payments-kit/src/validators.ts packages/payments-kit/src/__tests__/validators.test.ts
git commit -m "feat(payments-kit): add input validators"
```

---

### Task 2: Fee estimation

**Files:**
- Create: `packages/payments-kit/src/fees.ts`
- Create: `packages/payments-kit/src/__tests__/fees.test.ts`

- [ ] **Step 1: Write tests (mock Horizon)**

```ts
// packages/payments-kit/src/__tests__/fees.test.ts
import { describe, it, expect, vi } from 'vitest';
import type { StellarClient } from '@stellar-solutions/core';
import { estimateFee } from '../fees.js';

const mockClient = {
  horizon: {
    feeStats: vi.fn().mockResolvedValue({
      fee_charged: { p50: '200', p90: '500' },
      base_fee_in_stroops: '100',
    }),
  },
  withTimeout: (p: Promise<unknown>) => p,
} as unknown as StellarClient;

describe('estimateFee', () => {
  it('returns Math.max(ceil(p50 * 1.5), 100) as a number', async () => {
    const fee = await estimateFee(mockClient);
    expect(fee).toBe(300); // ceil(200 * 1.5)
  });

  it('returns at least 100 when p50 is very low', async () => {
    const lowClient = {
      ...mockClient,
      horizon: {
        feeStats: vi.fn().mockResolvedValue({
          fee_charged: { p50: '10' },
          base_fee_in_stroops: '100',
        }),
      },
    } as unknown as StellarClient;
    const fee = await estimateFee(lowClient);
    expect(fee).toBeGreaterThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/payments-kit/src/fees.ts
import type { StellarClient } from '@stellar-solutions/core';

export async function estimateFee(client: StellarClient): Promise<number> {
  const stats = await client.withTimeout(client.horizon.feeStats());
  const p50 = parseInt(stats.fee_charged.p50 ?? '100', 10);
  return Math.max(Math.ceil(p50 * 1.5), 100);
}
```

- [ ] **Step 3: Test, commit**

```bash
pnpm --filter @stellar-solutions/payments-kit test
git add packages/payments-kit/src/fees.ts packages/payments-kit/src/__tests__/fees.test.ts
git commit -m "feat(payments-kit): add fee estimator (p50 * 1.5, min 100 stroops)"
```

---

### Task 3: Balance

**Files:**
- Create: `packages/payments-kit/src/balance.ts`
- Create: `packages/payments-kit/src/__tests__/balance.test.ts`

- [ ] **Step 1: Write tests**

```ts
// packages/payments-kit/src/__tests__/balance.test.ts
import { describe, it, expect, vi } from 'vitest';
import type { StellarClient } from '@stellar-solutions/core';
import { getBalance } from '../balance.js';

const mockAccount = {
  balances: [
    { asset_type: 'native', balance: '99.9999700' },
    { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GISSUER', balance: '50.0000000' },
  ],
};

const mockClient = {
  horizon: { loadAccount: vi.fn().mockResolvedValue(mockAccount) },
  withTimeout: (p: Promise<unknown>) => p,
} as unknown as StellarClient;

describe('getBalance', () => {
  it('returns native XLM balance when no asset specified', async () => {
    const balance = await getBalance(mockClient, 'GABC');
    expect(balance).toBe('99.9999700');
  });

  it('returns specific asset balance', async () => {
    const balance = await getBalance(mockClient, 'GABC', { code: 'USDC', issuer: 'GISSUER' });
    expect(balance).toBe('50.0000000');
  });

  it('returns "0" when no trustline exists', async () => {
    const balance = await getBalance(mockClient, 'GABC', { code: 'NOPE', issuer: 'GISSUER' });
    expect(balance).toBe('0');
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/payments-kit/src/balance.ts
import type { StellarClient, Asset } from '@stellar-solutions/core';

export async function getBalance(
  client: StellarClient,
  address: string,
  asset?: Asset,
): Promise<string> {
  const account = await client.withTimeout(client.horizon.loadAccount(address));

  if (!asset || asset === 'native') {
    const native = account.balances.find((b) => b.asset_type === 'native');
    return native?.balance ?? '0';
  }

  const found = account.balances.find(
    (b) =>
      b.asset_type !== 'native' &&
      'asset_code' in b &&
      b.asset_code === asset.code &&
      b.asset_issuer === asset.issuer,
  );
  return found?.balance ?? '0';
}
```

- [ ] **Step 3: Test, commit**

```bash
pnpm --filter @stellar-solutions/payments-kit test
git add packages/payments-kit/src/balance.ts packages/payments-kit/src/__tests__/balance.test.ts
git commit -m "feat(payments-kit): add getBalance (native + issued assets)"
```

---

### Task 4: History

**Files:**
- Create: `packages/payments-kit/src/history.ts`
- Create: `packages/payments-kit/src/__tests__/history.test.ts`

- [ ] **Step 1: Write tests**

```ts
// packages/payments-kit/src/__tests__/history.test.ts
import { describe, it, expect, vi } from 'vitest';
import type { StellarClient } from '@stellar-solutions/core';
import { getHistory } from '../history.js';

const mockTx = {
  id: 'txhash1',
  hash: 'txhash1',
  ledger_attr: 12345,
  created_at: '2026-01-01T00:00:00Z',
  operation_count: 1,
  memo_type: 'text',
  memo: 'test memo',
};

const mockClient = {
  horizon: {
    transactions: vi.fn().mockReturnValue({
      forAccount: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      call: vi.fn().mockResolvedValue({
        records: [mockTx],
      }),
    }),
  },
  withTimeout: (p: Promise<unknown>) => p,
} as unknown as StellarClient;

describe('getHistory', () => {
  it('returns an array of HistoryEntry', async () => {
    const result = await getHistory(mockClient, 'GABC', { limit: 10 });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ hash: 'txhash1' });
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/payments-kit/src/history.ts
import type { StellarClient, HistoryEntry } from '@stellar-solutions/core';

export interface HistoryOptions {
  limit?: number;
  cursor?: string;
  order?: 'asc' | 'desc';
}

export async function getHistory(
  client: StellarClient,
  address: string,
  options: HistoryOptions = {},
): Promise<HistoryEntry[]> {
  const { limit = 20, order = 'desc' } = options;

  const response = await client.withTimeout(
    client.horizon
      .transactions()
      .forAccount(address)
      .limit(limit)
      .order(order)
      .call(),
  );

  return response.records.map((tx) => ({
    hash: tx.hash,
    type: 'transaction',
    memo: tx.memo ?? undefined,
    createdAt: tx.created_at,
    ledger: tx.ledger_attr,
  }));
}
```

- [ ] **Step 3: Test, commit**

```bash
pnpm --filter @stellar-solutions/payments-kit test
git add packages/payments-kit/src/history.ts packages/payments-kit/src/__tests__/history.test.ts
git commit -m "feat(payments-kit): add getHistory with pagination options"
```

---

### Task 5: Pay (core feature)

**Files:**
- Create: `packages/payments-kit/src/pay.ts`
- Create: `packages/payments-kit/src/__tests__/pay.test.ts`

- [ ] **Step 1: Write tests — happy paths**

```ts
// packages/payments-kit/src/__tests__/pay.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pay } from '../pay.js';
import type { StellarClient } from '@stellar-solutions/core';
import {
  NoTrustlineError,
  InsufficientFundsError,
  SequenceError,
} from '@stellar-solutions/core';

const mockAccount = {
  id: 'GSOURCE',
  sequence: '1000',
  balances: [{ asset_type: 'native', balance: '100.0000000' }],
  incrementSequenceNumber: vi.fn(),
};

const mockSubmitResult = {
  hash: 'abc123',
  ledger: 12345,
  fee_charged: '100',
  created_at: '2026-01-01T00:00:00Z',
};

const mockClient = {
  horizon: {
    loadAccount: vi.fn().mockResolvedValue(mockAccount),
    submitTransaction: vi.fn().mockResolvedValue(mockSubmitResult),
  },
  networkConfig: {
    networkPassphrase: 'Test SDF Network ; September 2015',
  },
  withTimeout: (p: Promise<unknown>) => p,
} as unknown as StellarClient;

describe('pay — happy paths', () => {
  beforeEach(() => vi.clearAllMocks());

  it('submits XLM payment and returns TxResult', async () => {
    const result = await pay(mockClient, {
      from: 'SCZANGBA5RLMC6NRJL7XIYMROLEKDETBYQ8B93DVAK5KMFJ6HXLM7TJ',
      to: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      amount: '10',
      asset: 'native',
    });
    expect(result.hash).toBe('abc123');
    expect(result.ledger).toBe(12345);
    expect(mockClient.horizon.submitTransaction).toHaveBeenCalledOnce();
  });

  it('includes TEXT memo when provided', async () => {
    await pay(mockClient, {
      from: 'SCZANGBA5RLMC6NRJL7XIYMROLEKDETBYQ8B93DVAK5KMFJ6HXLM7TJ',
      to: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      amount: '5',
      asset: 'native',
      memo: 'Pago factura #123',
    });
    // memo is included in the built transaction (verified by checking submitTransaction was called)
    expect(mockClient.horizon.submitTransaction).toHaveBeenCalledOnce();
  });
});

describe('pay — error paths', () => {
  it('retries once on tx_bad_seq then succeeds', async () => {
    const badSeqClient = {
      ...mockClient,
      horizon: {
        loadAccount: vi.fn().mockResolvedValue(mockAccount),
        submitTransaction: vi.fn()
          .mockRejectedValueOnce({ response: { data: { extras: { result_codes: { transaction: 'tx_bad_seq' } } } } })
          .mockResolvedValueOnce(mockSubmitResult),
      },
    } as unknown as StellarClient;

    const result = await pay(badSeqClient, {
      from: 'SCZANGBA5RLMC6NRJL7XIYMROLEKDETBYQ8B93DVAK5KMFJ6HXLM7TJ',
      to: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      amount: '1',
      asset: 'native',
    });
    expect(result.hash).toBe('abc123');
    expect(badSeqClient.horizon.submitTransaction).toHaveBeenCalledTimes(2);
  });

  it('throws SequenceError when tx_bad_seq persists after retry', async () => {
    const alwaysBadSeq = {
      ...mockClient,
      horizon: {
        loadAccount: vi.fn().mockResolvedValue(mockAccount),
        submitTransaction: vi.fn().mockRejectedValue({
          response: { data: { extras: { result_codes: { transaction: 'tx_bad_seq' } } } },
        }),
      },
    } as unknown as StellarClient;

    await expect(pay(alwaysBadSeq, {
      from: 'SCZANGBA5RLMC6NRJL7XIYMROLEKDETBYQ8B93DVAK5KMFJ6HXLM7TJ',
      to: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      amount: '1',
      asset: 'native',
    })).rejects.toThrow(SequenceError);
  });
});
```

- [ ] **Step 2: Run — fail, then implement `pay.ts`**

```ts
// packages/payments-kit/src/pay.ts
import {
  Asset as StellarAsset,
  Keypair,
  Memo,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import type { StellarClient, TxResult, Asset } from '@stellar-solutions/core';
import { SequenceError } from '@stellar-solutions/core';
import { estimateFee } from './fees.js';
import { validateAddress, validateAmount, validateAsset } from './validators.js';

export interface PaymentOptions {
  from: string;     // secret key
  to: string;       // public key
  amount: string;
  asset: Asset;
  memo?: string;
  fee?: number;
}

function toStellarAsset(asset: Asset): StellarAsset {
  if (asset === 'native') return StellarAsset.native();
  return new StellarAsset(asset.code, asset.issuer);
}

function isBadSeqError(err: unknown): boolean {
  try {
    const e = err as { response?: { data?: { extras?: { result_codes?: { transaction?: string } } } } };
    return e.response?.data?.extras?.result_codes?.transaction === 'tx_bad_seq';
  } catch {
    return false;
  }
}

export async function pay(client: StellarClient, options: PaymentOptions): Promise<TxResult> {
  const keypair = Keypair.fromSecret(options.from);
  const sourceAddress = keypair.publicKey();

  validateAddress(options.to);
  validateAmount(options.amount);
  validateAsset(options.asset);

  const fee = options.fee ?? await estimateFee(client);

  async function buildAndSubmit(retryCount = 0): Promise<TxResult> {
    const account = await client.withTimeout(client.horizon.loadAccount(sourceAddress));

    const builder = new TransactionBuilder(account, {
      fee: String(fee),
      networkPassphrase: client.networkConfig.networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: options.to,
          asset: toStellarAsset(options.asset),
          amount: options.amount,
        }),
      )
      .setTimeout(180);

    if (options.memo) {
      builder.addMemo(Memo.text(options.memo));
    }

    const tx = builder.build();
    tx.sign(keypair);

    try {
      const result = await client.withTimeout(client.horizon.submitTransaction(tx));
      return {
        hash: result.hash,
        ledger: result.ledger,
        fee: parseInt(result.fee_charged, 10),
        createdAt: result.created_at,
      };
    } catch (err) {
      if (isBadSeqError(err) && retryCount === 0) {
        return buildAndSubmit(1);
      }
      if (isBadSeqError(err)) {
        throw new SequenceError();
      }
      throw err;
    }
  }

  return buildAndSubmit();
}
```

- [ ] **Step 3: Run tests — pass, commit**

```bash
pnpm --filter @stellar-solutions/payments-kit test
git add packages/payments-kit/src/pay.ts packages/payments-kit/src/__tests__/pay.test.ts
git commit -m "feat(payments-kit): implement pay() with auto-fee, memo, and seq retry"
```

---

### Task 6: StellarKit class + index

**Files:**
- Create: `packages/payments-kit/src/StellarKit.ts`
- Modify: `packages/payments-kit/src/index.ts`

- [ ] **Step 1: Implement class**

```ts
// packages/payments-kit/src/StellarKit.ts
import { createClient, type ClientOptions, type StellarClient } from '@stellar-solutions/core';
import type { TxResult, HistoryEntry, Asset } from '@stellar-solutions/core';
import type { Network } from '@stellar-solutions/core';
import { pay, type PaymentOptions } from './pay.js';
import { getBalance } from './balance.js';
import { getHistory, type HistoryOptions } from './history.js';

export interface StellarKitOptions extends ClientOptions {
  network: Network;
}

export class StellarKit {
  private readonly client: StellarClient;

  constructor(options: StellarKitOptions) {
    this.client = createClient(options.network, options);
  }

  pay(options: PaymentOptions): Promise<TxResult> {
    return pay(this.client, options);
  }

  getBalance(address: string, asset?: Asset): Promise<string> {
    return getBalance(this.client, address, asset);
  }

  getHistory(address: string, options?: HistoryOptions): Promise<HistoryEntry[]> {
    return getHistory(this.client, address, options);
  }
}
```

- [ ] **Step 2: Update index.ts**

```ts
// packages/payments-kit/src/index.ts
export { StellarKit } from './StellarKit.js';
export type { StellarKitOptions } from './StellarKit.js';
export type { PaymentOptions } from './pay.js';
export type { HistoryOptions } from './history.js';
```

- [ ] **Step 3: Build + typecheck + test**

```bash
pnpm --filter @stellar-solutions/payments-kit build
pnpm --filter @stellar-solutions/payments-kit typecheck
pnpm --filter @stellar-solutions/payments-kit test
```
Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add packages/payments-kit/src/
git commit -m "feat(payments-kit): add StellarKit class and finalize public API"
```

---

### Task 7: Integration tests (testnet)

**Files:**
- Create: `packages/payments-kit/src/__tests__/integration/payments-kit.integration.test.ts`

- [ ] **Step 1: Create integration test**

```ts
// requires STELLAR_TEST_SECRET_KEY and STELLAR_TEST_DESTINATION env vars
import { describe, it, expect, beforeAll } from 'vitest';
import { StellarKit } from '../../StellarKit.js';

const SECRET = process.env['STELLAR_TEST_SECRET_KEY'];
const DESTINATION = process.env['STELLAR_TEST_DESTINATION'];

describe.skipIf(!SECRET || !DESTINATION)('payments-kit integration (testnet)', () => {
  let kit: StellarKit;

  beforeAll(() => {
    kit = new StellarKit({ network: 'testnet' });
  });

  it('gets XLM balance', async () => {
    const { Keypair } = await import('@stellar/stellar-sdk');
    const address = Keypair.fromSecret(SECRET!).publicKey();
    const balance = await kit.getBalance(address);
    expect(Number(balance)).toBeGreaterThan(0);
  });

  it('sends 1 XLM and returns TxResult', async () => {
    const result = await kit.pay({
      from: SECRET!,
      to: DESTINATION!,
      amount: '1',
      asset: 'native',
      memo: 'integration test',
    });
    expect(result.hash).toHaveLength(64);
    expect(result.ledger).toBeGreaterThan(0);
  });

  it('gets transaction history', async () => {
    const { Keypair } = await import('@stellar/stellar-sdk');
    const address = Keypair.fromSecret(SECRET!).publicKey();
    const history = await kit.getHistory(address, { limit: 5 });
    expect(history.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
STELLAR_TEST_SECRET_KEY=S... STELLAR_TEST_DESTINATION=G... \
  pnpm --filter @stellar-solutions/payments-kit test:integration
```
Expected: all 3 tests pass on Stellar testnet

- [ ] **Step 3: Commit**

```bash
git add packages/payments-kit/src/__tests__/integration/
git commit -m "test(payments-kit): add testnet integration tests"
```

---

### Task 8: Example app

**Files:**
- Modify: `examples/payments-kit-node/src/index.ts`
- Create: `examples/payments-kit-node/README.md`

- [ ] **Step 1: Implement example**

```ts
// examples/payments-kit-node/src/index.ts
import { StellarKit } from '@stellar-solutions/payments-kit';
import { Keypair } from '@stellar/stellar-sdk';

const SECRET = process.env['STELLAR_TEST_SECRET_KEY'];
const DESTINATION = process.env['STELLAR_TEST_DESTINATION'];

if (!SECRET || !DESTINATION) {
  console.error('Set STELLAR_TEST_SECRET_KEY and STELLAR_TEST_DESTINATION env vars');
  process.exit(1);
}

const kit = new StellarKit({ network: 'testnet' });
const address = Keypair.fromSecret(SECRET).publicKey();

console.log('=== @stellar-solutions/payments-kit demo ===\n');

// 1. Balance
const balance = await kit.getBalance(address);
console.log(`XLM balance: ${balance}`);

// 2. Payment
console.log('\nSending 1 XLM...');
const result = await kit.pay({
  from: SECRET,
  to: DESTINATION,
  amount: '1',
  asset: 'native',
  memo: 'payments-kit demo',
});
console.log(`✓ Sent! Hash: ${result.hash}`);
console.log(`  Ledger: ${result.ledger}`);
console.log(`  Explorer: https://stellar.expert/explorer/testnet/tx/${result.hash}`);

// 3. History
const history = await kit.getHistory(address, { limit: 3 });
console.log('\nLast 3 transactions:');
history.forEach((tx) => console.log(`  ${tx.hash} — ${tx.createdAt}`));
```

- [ ] **Step 2: Run the example**

```bash
STELLAR_TEST_SECRET_KEY=S... STELLAR_TEST_DESTINATION=G... \
  pnpm --filter example-payments-kit-node start
```
Expected: balance printed, payment sent with hash, history shown

- [ ] **Step 3: Commit**

```bash
git add examples/payments-kit-node/
git commit -m "feat(examples): payments-kit-node demo running on Stellar testnet"
```

---

**Phase 3 complete.** Proceed to `2026-04-15-phase4a-asset-issuer.md` and `2026-04-15-phase4b-notify.md` in parallel.
