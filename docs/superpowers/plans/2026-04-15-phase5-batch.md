# Phase 5: @stellar-solutions/batch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `StellarBatch.send()` — chunked batch payments (≤100 ops/tx), per-transaction failure isolation, sequence management, and optional progress callbacks.

**Architecture:** `queue` validates + chunks payments. `executor` builds, signs, and submits each chunk sequentially (default) or in parallel via fee channels. `result-collector` aggregates per-payment outcomes. `estimator` is a dry-run calculator.

**Tech Stack:** TypeScript, `@stellar/stellar-sdk`, `@stellar-solutions/core`, Vitest

**Spec:** `specs/batch/spec.md`

---

## File Map

```
packages/batch/src/
├── index.ts
├── StellarBatch.ts
├── queue.ts
├── result-collector.ts
├── estimator.ts
├── executor.ts
├── channels.ts
└── __tests__/
    ├── queue.test.ts
    ├── result-collector.test.ts
    ├── estimator.test.ts
    ├── executor.test.ts
    ├── channels.test.ts
    ├── StellarBatch.test.ts
    └── integration/
        └── batch.integration.test.ts
```

---

### Task 1: Queue + validation [P]

- [ ] Write `src/__tests__/queue.test.ts`
  - empty array → `EmptyBatchError`
  - invalid address at index 2 → `BatchValidationError` with `invalidIndices: [2]`
  - 250 payments → 3 chunks: [100, 100, 50]
- [ ] Run — fail
- [ ] Implement `src/queue.ts`

```ts
export function validateAndChunk(payments: BatchPayment[]): BatchPayment[][] {
  if (payments.length === 0) throw new EmptyBatchError();
  const invalid: number[] = [];
  payments.forEach((p, i) => {
    if (!isValidAddress(p.to)) invalid.push(i);
    try { validateAmount(p.amount); } catch { invalid.push(i); }
  });
  if (invalid.length > 0) throw new BatchValidationError(invalid);

  const chunks: BatchPayment[][] = [];
  for (let i = 0; i < payments.length; i += 100) {
    chunks.push(payments.slice(i, i + 100));
  }
  return chunks;
}
```

- [ ] Run — pass
- [ ] `git commit -m "feat(batch): add queue validation and chunking"`

---

### Task 2: Result collector [P]

- [ ] Write `src/__tests__/result-collector.test.ts` — verify BatchResult shape, failed tx isolation
- [ ] Run — fail
- [ ] Implement `src/result-collector.ts`

```ts
export class ResultCollector {
  private successful = 0;
  private txHashes: string[] = [];
  private errors: FailedPayment[] = [];

  recordSuccess(hash: string, count: number): void { ... }
  recordFailure(payments: BatchPayment[], startIndex: number, reason: string, code?: string): void { ... }
  toBatchResult(): BatchResult { ... }
}
```

- [ ] Run — pass
- [ ] `git commit -m "feat(batch): add result collector"`

---

### Task 3: Estimator [P]

- [ ] Write `src/__tests__/estimator.test.ts` — 250 payments → txCount: 3, no network calls
- [ ] Run — fail
- [ ] Implement `src/estimator.ts`

```ts
export function estimate(payments: BatchPayment[]): BatchEstimate {
  const txCount = Math.ceil(payments.length / 100);
  // estimatedFeeXLM: txCount * (fee * payments.length / 100) / 10_000_000
  // estimatedTimeMs: txCount * 5000 (5s per tx on testnet)
}
```

- [ ] Run — pass
- [ ] `git commit -m "feat(batch): add estimator (dry-run, no network)"`

---

### Task 4: Executor (single channel)

- [ ] Write `src/__tests__/executor.test.ts`
  - 100 payments → 1 tx submitted
  - 250 payments → 3 txs submitted
  - `tx_bad_seq` on first tx → re-fetch sequence, retry → success
  - per-payment retry on timeout error (max 3)
  - `onProgress` called after each tx
- [ ] Run — fail
- [ ] Implement `src/executor.ts`

```ts
export async function executeChunks(
  client: StellarClient,
  keypair: Keypair,
  chunks: BatchPayment[][],
  collector: ResultCollector,
  options: { onProgress?: (done: number, total: number) => void; maxRetries?: number }
): Promise<void> {
  let processed = 0;
  for (const [i, chunk] of chunks.entries()) {
    await submitChunkWithRetry(client, keypair, chunk, i * 100, collector, options.maxRetries ?? 3);
    processed += chunk.length;
    options.onProgress?.(processed, chunks.flat().length);
  }
}
```

Each chunk → `TransactionBuilder` with up to 100 `Operation.payment` ops → sign → submit.
On `tx_bad_seq`: re-fetch account sequence, rebuild + resubmit once.
On `tx_too_late` / timeout: retry up to `maxRetries`.
On other failure: `collector.recordFailure(chunk, startIndex, errorMessage)`.

- [ ] Run — pass
- [ ] `git commit -m "feat(batch): implement executor with sequence retry and per-chunk error isolation"`

---

### Task 5: Fee channels

- [ ] Write `src/__tests__/channels.test.ts` — verify that with `channels: 3`, up to 3 txs run concurrently
- [ ] Run — fail
- [ ] Implement `src/channels.ts`

```ts
// Pool of channel accounts (pre-funded keypairs)
// Each channel has its own sequence number — enables parallel submission without seq conflicts
// StellarBatch constructor validates channel balances; throws InsufficientChannelFundsError
export class ChannelPool { ... }
```

When `channels: 1` (default): all chunks go through the single source account sequentially.
When `channels > 1`: chunks are distributed across channel accounts using `Promise.all` on batches of size `channels`.

- [ ] Run — pass
- [ ] `git commit -m "feat(batch): add fee channel pool for parallel tx submission"`

---

### Task 6: StellarBatch class + index

- [ ] Write `src/__tests__/StellarBatch.test.ts` — `send`, `estimate`, `onProgress` callback
- [ ] Run — fail
- [ ] Implement `src/StellarBatch.ts`

```ts
export class StellarBatch {
  constructor(options: {
    secretKey: string;
    network: Network;
    channels?: number;
    maxRetries?: number;
  }) { ... }

  async send(
    payments: BatchPayment[],
    options?: { onProgress?: (done: number, total: number) => void }
  ): Promise<BatchResult> { ... }

  estimate(payments: BatchPayment[]): BatchEstimate { ... }
}
```

- [ ] Implement `src/index.ts`
- [ ] Build + typecheck + test — all pass
- [ ] `git commit -m "feat(batch): add StellarBatch class and finalize public API"`

---

### Task 7: Integration test (testnet)

```ts
describe.skipIf(!SECRET)('batch integration (testnet)', () => {
  it('sends 10 XLM payments and returns BatchResult with successful: 10', async () => {
    const batch = new StellarBatch({ secretKey: SECRET!, network: 'testnet' });
    const payments = Array.from({ length: 10 }, () => ({
      to: DESTINATION!,
      amount: '0.1',
      asset: 'native' as const,
    }));
    const result = await batch.send(payments, {
      onProgress: (done, total) => console.log(`${done}/${total}`),
    });
    expect(result.successful).toBe(10);
    expect(result.failed).toBe(0);
  });
});
```

- [ ] Run: `STELLAR_TEST_SECRET_KEY=S... STELLAR_TEST_DESTINATION=G... pnpm --filter @stellar-solutions/batch test:integration`
- [ ] `git commit -m "test(batch): add testnet integration test (10 payments)"`

---

### Task 8: Example

- [ ] Implement `examples/batch-node/src/index.ts` — 50 XLM payments with progress bar
- [ ] Run against testnet
- [ ] `git commit -m "feat(examples): batch-node demo sending 50 payments on Stellar testnet"`

---

**Phase 5 complete.** Proceed to Phase 6 (soroban-react-hooks).
