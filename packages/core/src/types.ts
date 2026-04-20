export type Asset = 'native' | { code: string; issuer: string };

export interface TxResult {
  hash: string;
  ledger: number;
  /** Fee actually charged, in stroops. String (not number) to stay consistent with amount fields. */
  fee: string;
  createdAt: string;
}

export interface HistoryEntry {
  hash: string;
  type: string;
  amount?: string;
  asset?: Asset;
  from?: string;
  to?: string;
  memo?: string;
  createdAt: string;
  /** Ledger sequence — omitted when the source endpoint (e.g. `/payments`) doesn't expose it. */
  ledger?: number;
}

export interface Holder {
  address: string;
  balance: string;
}

export interface BatchPayment {
  to: string;
  amount: string;
  asset: Asset;
  memo?: string;
}

export interface BatchResult {
  successful: number;
  failed: number;
  errors: FailedPayment[];
  txHashes: string[];
}

export interface FailedPayment {
  index: number;
  payment: BatchPayment;
  reason: string;
  code?: string;
}
