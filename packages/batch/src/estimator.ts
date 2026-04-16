import type { BatchPayment } from '@stellar-solutions/core';

export interface BatchEstimate {
  txCount: number;
  estimatedFeeXLM: string;
  estimatedTimeMs: number;
}

const CHUNK_SIZE = 100;
const FEE_PER_OP_STROOPS = 100;
const STROOPS_PER_XLM = 10_000_000;
const TIME_PER_TX_MS = 5_000;

export function estimate(payments: BatchPayment[]): BatchEstimate {
  const txCount = Math.ceil(payments.length / CHUNK_SIZE);
  const totalFeeStroops = payments.length * FEE_PER_OP_STROOPS;
  const feeXLM = totalFeeStroops / STROOPS_PER_XLM;
  return {
    txCount,
    estimatedFeeXLM: feeXLM.toFixed(7),
    estimatedTimeMs: txCount * TIME_PER_TX_MS,
  };
}
