import { EmptyBatchError, BatchValidationError, isValidAddress, toStroops } from '@stellar-solutions/core';
import type { BatchPayment } from '@stellar-solutions/core';

function isValidPositiveAmount(amount: string): boolean {
  try {
    return toStroops(amount) > 0n;
  } catch {
    return false;
  }
}

export function validateAndChunk(payments: BatchPayment[]): BatchPayment[][] {
  if (payments.length === 0) throw new EmptyBatchError();

  const invalid: number[] = [];
  payments.forEach((p, i) => {
    if (!isValidAddress(p.to)) invalid.push(i);
    else if (!isValidPositiveAmount(p.amount)) invalid.push(i);
  });
  if (invalid.length > 0) throw new BatchValidationError(invalid);

  const chunks: BatchPayment[][] = [];
  for (let i = 0; i < payments.length; i += 100) {
    chunks.push(payments.slice(i, i + 100));
  }
  return chunks;
}
