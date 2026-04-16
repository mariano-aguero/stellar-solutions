import type { BatchPayment, BatchResult, FailedPayment } from '@stellar-solutions/core';

export class ResultCollector {
  private successful = 0;
  private readonly txHashes: string[] = [];
  private readonly errors: FailedPayment[] = [];

  recordSuccess(hash: string, count: number): void {
    this.successful += count;
    this.txHashes.push(hash);
  }

  recordFailure(payments: BatchPayment[], startIndex: number, reason: string, code?: string): void {
    for (const [offset, payment] of payments.entries()) {
      this.errors.push({
        index: startIndex + offset,
        payment,
        reason,
        ...(code !== undefined ? { code } : {}),
      });
    }
  }

  toBatchResult(): BatchResult {
    return {
      successful: this.successful,
      failed: this.errors.length,
      txHashes: [...this.txHashes],
      errors: [...this.errors],
    };
  }
}
